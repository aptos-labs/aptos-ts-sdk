const { LocalNode } = require("../src/cli");

module.exports = async function setup() {
  const localNode = new LocalNode();
  globalThis.__LOCAL_NODE__ = localNode;
  const nodeIsUp = await localNode.checkIfProcessIsUp();
  if (!nodeIsUp) {
    // indicate node is running using npm package
    // so we can kill process after tests finish
    globalThis.__LOCAL_NODE_NPM_PACKAGE__ = true;
    await localNode.run();
  }
};
