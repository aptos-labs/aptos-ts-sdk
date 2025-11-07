export default async function globalTeardown() {
  const localNode = globalThis.__LOCAL_NODE__;

  if (localNode?.process) {
    localNode.stop();
  }

  globalThis.__LOCAL_NODE__ = undefined;
}
