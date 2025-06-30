const { LocalNode } = require("../src/cli");

module.exports = async function setup() {
  // if preTest is falling just run cedra localnet itself
  // cedra node run-localnet --force-restart --assume-yes --with-indexer-api
  const localNode = new LocalNode();
  globalThis.__TESTNET_NODE__ = localNode;
  await localNode.run();
};
