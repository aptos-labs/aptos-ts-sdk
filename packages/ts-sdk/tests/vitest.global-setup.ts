import { LocalNode } from "@aptos-labs/ts-sdk/cli";

export default async function globalSetup() {
  if (process.env.APTOS_VITEST_START_LOCAL_NODE !== "true") {
    globalThis.__LOCAL_NODE__ = undefined;
    return;
  }

  const localNode = new LocalNode();
  globalThis.__LOCAL_NODE__ = localNode;
  await localNode.run();
}
