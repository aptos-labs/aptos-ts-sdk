import { LocalNode } from "../src/cli/localNode.js";

let localNode: LocalNode;

export async function setup() {
  // Keyless e2e tests are skipped; avoid starting the keyless prover in localnet.
  process.env.ENABLE_KEYLESS_DEFAULT = "0";
  localNode = new LocalNode();
  await localNode.run();
}

export async function teardown() {
  if (localNode?.process) {
    await localNode.stop();
  }
}
