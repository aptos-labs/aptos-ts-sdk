/* eslint-disable import/no-commonjs */
/* eslint-disable import/extensions */

/**
 * Example to show how one can require the CLI module and use it
 * to run cli commands
 */

const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");

// Run local node
async function runLocalNode() {
  const localNode = new cli.LocalNode();
  localNode.run();
}
runLocalNode();

// initialize current directory for Aptos
async function init() {
  const move = new cli.Move();

  await move.init({
    network: "devnet",
    profile: "devnet",
  });
}
init();

// compile a package
async function compile() {
  const move = new cli.Move();

  await move.compile({
    packageDirectoryPath: "move/moonCoin",
    namedAddresses: {
      MoonCoin: "0x123",
    },
  });
}
compile();

// run Move unit tests for a package
async function tests() {
  const move = new cli.Move();

  await move.test({
    packageDirectoryPath: "move/moonCoin",
    namedAddresses: {
      MoonCoin: "0x123",
    },
  });
}
tests();

// publishe the modules in a Move package to the Aptos blockchain
async function publish() {
  const move = new cli.Move();

  await move.publish({
    packageDirectoryPath: "move/moonCoin",
    namedAddresses: {
      MoonCoin: "0x123",
    },
  });
}
publish();
