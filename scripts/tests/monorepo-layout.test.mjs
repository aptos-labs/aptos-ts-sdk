import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

async function readJson(path) {
  return JSON.parse(await readFile(join(repoRoot, path), "utf8"));
}

async function assertMissing(path) {
  await assert.rejects(access(join(repoRoot, path)));
}

test("root validation scripts cover tooling before package tasks", async () => {
  const packageJson = await readJson("package.json");
  const rootInputs = ["scripts", "package.json", "turbo.json", "biome.json"];

  for (const task of ["_fmt", "fmt", "lint", "check"]) {
    const rootTask = `${task}:root`;

    assert.match(packageJson.scripts[task], new RegExp(`pnpm ${rootTask} && turbo run ${task}`));
    assert.match(packageJson.scripts[rootTask], /^biome /);
    for (const input of rootInputs) {
      assert.match(packageJson.scripts[rootTask], new RegExp(`(?:^| )${input}(?: |$)`));
    }
  }

  assert.equal(packageJson.devDependencies["@biomejs/biome"], "2.5.12");
});

test("root config defines the private Turbo workspace", async () => {
  const packageJson = await readJson("package.json");
  const turbo = await readJson("turbo.json");
  const workspace = await readFile(join(repoRoot, "pnpm-workspace.yaml"), "utf8");

  assert.equal(packageJson.name, "@aptos-labs/aptos-ts-sdk-monorepo");
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.scripts.build, "turbo run build");
  assert.equal(packageJson.scripts.test, "pnpm test:repo && turbo run test --concurrency=1");
  assert.ok(packageJson.devDependencies.turbo);
  assert.match(workspace, /packages:\s*\n\s+- "packages\/\*"/);
  assert.deepEqual(turbo.tasks.build.dependsOn, ["^build"]);
  assert.deepEqual(turbo.tasks.build.outputs, ["dist/**"]);
  assert.equal(turbo.tasks.test.cache, false);
  for (const task of ["_fmt", "lint", "check", "check-version", "check-license"]) {
    assert.equal(turbo.tasks[task].cache, false, `${task} must not use stale cached validation results`);
  }
});

test("publishable SDKs live under packages", async () => {
  const tsSdk = await readJson("packages/ts-sdk/package.json");
  const confidentialAsset = await readJson("packages/confidential-asset/package.json");

  assert.equal(tsSdk.name, "@aptos-labs/ts-sdk");
  assert.equal(tsSdk.repository.directory, "packages/ts-sdk");
  assert.equal(confidentialAsset.name, "@aptos-labs/confidential-asset");
  assert.equal(confidentialAsset.devDependencies["@aptos-labs/ts-sdk"], "workspace:^7.3.0");
  await assertMissing("src");
  await assertMissing("tests");
  await assertMissing("confidential-asset");
  await assertMissing("packages/confidential-asset/pnpm-lock.yaml");
  await assertMissing("packages/confidential-asset/pnpm-workspace.yaml");
});

test("standalone examples link to the relocated TypeScript SDK", async () => {
  const linkedExamples = ["typescript", "javascript", "web-test"];
  const fileExamples = ["bun-test", "deno-test"];

  for (const example of linkedExamples) {
    const packageJson = await readJson(`examples/${example}/package.json`);
    assert.equal(packageJson.dependencies["@aptos-labs/ts-sdk"], "link:../../packages/ts-sdk");
  }

  for (const example of fileExamples) {
    const packageJson = await readJson(`examples/${example}/package.json`);
    assert.equal(packageJson.dependencies["@aptos-labs/ts-sdk"], "file:../../packages/ts-sdk");
  }
});

test("required CI validates repository and confidential asset contracts", async () => {
  const sdkTestAction = await readFile(join(repoRoot, ".github/actions/run-tests/action.yaml"), "utf8");
  const confidentialAssetAction = await readFile(
    join(repoRoot, ".github/actions/run-confidential-asset-tests/action.yaml"),
    "utf8",
  );

  assert.match(sdkTestAction, /run: pnpm test:repo/);
  assert.match(
    confidentialAssetAction,
    /run: pnpm turbo run build check-license --filter=@aptos-labs\/confidential-asset/,
  );
});
