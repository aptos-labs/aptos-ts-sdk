import { LocalNode } from "../src/cli/localNode";

let localNode: LocalNode;

export async function setup() {
  localNode = new LocalNode();
  await localNode.run();
}

export async function teardown() {
  if (localNode?.process) {
    await localNode.stop();
  }
}
