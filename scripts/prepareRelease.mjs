// Prepare a release: bump package.json version + stamp the changelog.
// Pure helpers are exported for unit testing; the CLI entry point is at the bottom.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * True iff `version` is a plain `X.Y.Z` semver (no prerelease/build suffix).
 * @param {string} version
 * @returns {boolean}
 */
export function isPlainSemver(version) {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/**
 * Compute the next semver from a plain `X.Y.Z` current version.
 * @param {string} current
 * @param {"major"|"minor"|"patch"} bump
 * @returns {string}
 */
export function computeNextVersion(current, bump) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!m) throw new Error(`current version is not plain semver X.Y.Z: ${current}`);
  const major = Number(m[1]);
  const minor = Number(m[2]);
  const patch = Number(m[3]);
  switch (bump) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`unknown bump type: ${bump} (expected major|minor|patch)`);
  }
}

/**
 * True iff `next` is strictly greater than `current` (both plain `X.Y.Z`).
 * @param {string} next
 * @param {string} current
 * @returns {boolean}
 */
export function isStrictlyGreater(next, current) {
  const a = next.split(".").map(Number);
  const b = current.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return false;
}

/**
 * Return the text between the `# Unreleased` heading and the next top-level
 * `# ` heading (exclusive). Throws if there is no `# Unreleased` heading.
 * @param {string} changelogText
 * @returns {string}
 */
export function getUnreleasedSection(changelogText) {
  const lines = changelogText.split("\n");
  const start = lines.findIndex((l) => /^# Unreleased\s*$/.test(l));
  if (start === -1) throw new Error("no `# Unreleased` heading found in changelog");
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^# /.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
}

/**
 * True iff the `# Unreleased` section contains at least one changelog bullet.
 * @param {string} changelogText
 * @returns {boolean}
 */
export function hasUnreleasedContent(changelogText) {
  return /^\s*-\s+\S/m.test(getUnreleasedSection(changelogText));
}

/**
 * Rename `# Unreleased` to `# <version> (<dateStr>)`, leaving a fresh empty
 * `# Unreleased` heading above it. Throws if there is no `# Unreleased` heading.
 * @param {string} changelogText
 * @param {string} version
 * @param {string} dateStr  ISO `YYYY-MM-DD`
 * @returns {string}
 */
export function stampChangelog(changelogText, version, dateStr) {
  if (!/^# Unreleased[ \t]*$/m.test(changelogText)) {
    throw new Error("no `# Unreleased` heading found in changelog");
  }
  return changelogText.replace(/^# Unreleased[ \t]*$/m, `# Unreleased\n\n# ${version} (${dateStr})`);
}

/**
 * Replace the top-level `"version"` string in a package.json's raw text,
 * preserving all other formatting. Throws if no version field is present.
 * @param {string} pkgJsonText
 * @param {string} version
 * @returns {string}
 */
export function setPackageVersion(pkgJsonText, version) {
  const re = /("version":\s*")[^"]*(")/;
  if (!re.test(pkgJsonText)) throw new Error("no `version` field found in package.json");
  return pkgJsonText.replace(re, `$1${version}$2`);
}

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Per-package release configuration.
 * `runsUpdateVersion` is true only for ts-sdk (it owns src/version.ts + docs).
 */
const PACKAGES = {
  "ts-sdk": {
    tagPrefix: "ts-sdk",
    pkgJsonPath: join(REPO_ROOT, "package.json"),
    changelogPath: join(REPO_ROOT, "CHANGELOG.md"),
    runsUpdateVersion: true,
  },
  "confidential-asset": {
    tagPrefix: "confidential-asset",
    pkgJsonPath: join(REPO_ROOT, "confidential-asset", "package.json"),
    changelogPath: join(REPO_ROOT, "confidential-asset", "CHANGELOG.md"),
    runsUpdateVersion: false,
  },
};

/**
 * Parse `--package`, and exactly one of `--bump` / `--version`.
 * @param {string[]} argv
 * @returns {{ pkg: string, bump?: string, version?: string }}
 */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--package") out.pkg = value;
    else if (flag === "--bump") out.bump = value;
    else if (flag === "--version") out.version = value;
    else throw new Error(`unknown argument: ${flag}`);
  }
  if (!out.pkg || !PACKAGES[out.pkg]) {
    throw new Error("--package must be one of: ts-sdk, confidential-asset");
  }
  if (!!out.bump === !!out.version) {
    throw new Error("provide exactly one of --bump or --version");
  }
  return out;
}

function main() {
  const { pkg, bump, version } = parseArgs(process.argv.slice(2));
  const cfg = PACKAGES[pkg];

  const pkgJsonText = readFileSync(cfg.pkgJsonPath, "utf8");
  const current = JSON.parse(pkgJsonText).version;
  const next = version ?? computeNextVersion(current, bump);

  // `computeNextVersion` always returns plain semver, but an explicit
  // `--version` is unchecked until here — reject a malformed value before it is
  // written into package.json / the changelog.
  if (!isPlainSemver(next)) {
    throw new Error(`--version must be plain semver X.Y.Z: ${next}`);
  }

  if (!isStrictlyGreater(next, current)) {
    throw new Error(`new version ${next} is not greater than current ${current}`);
  }

  const changelogText = readFileSync(cfg.changelogPath, "utf8");
  if (!hasUnreleasedContent(changelogText)) {
    throw new Error(
      `\`# Unreleased\` section of ${cfg.changelogPath} is empty; ` +
        "add changelog entries before preparing a release",
    );
  }

  // UTC date so releases are reproducible regardless of the runner's timezone.
  const dateStr = new Date().toISOString().slice(0, 10);

  writeFileSync(cfg.pkgJsonPath, setPackageVersion(pkgJsonText, next));
  writeFileSync(cfg.changelogPath, stampChangelog(changelogText, next, dateStr));

  if (cfg.runsUpdateVersion) {
    // `pnpm update-version` re-reads package.json, so $npm_package_version is
    // the version we just wrote; it syncs src/version.ts and regenerates docs.
    execSync("pnpm update-version", { cwd: REPO_ROOT, stdio: "inherit" });
  }

  const tag = `${cfg.tagPrefix}-v${next}`;
  console.log(`\nPrepared ${pkg} release: ${current} -> ${next}`);
  console.log(`Changelog stamped with date ${dateStr}`);
  console.log(`Phase 2 tag will be: ${tag}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (err) {
    console.error(`prepareRelease failed: ${err.message}`);
    process.exit(1);
  }
}
