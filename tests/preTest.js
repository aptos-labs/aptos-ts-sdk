const { LocalNode } = require("../src/cli");

module.exports = async function setup() {
  const localNode = new LocalNode();
  globalThis.__LOCAL_NODE__ = localNode;
  await localNode.run();
};
