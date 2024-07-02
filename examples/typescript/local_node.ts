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
  await localNode.run();
}

// initialize current directory for Aptos
async function init() {
  const move = new cli.Move();

  await move.init({
    network: "local",
    profile: "default",
  });
}

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

// publish the Move package to the publisher's account
async function publish() {
  const move = new cli.Move();

  await move.publish({
    packageDirectoryPath: "move/moonCoin",
    namedAddresses: {
      // please replace the address with the actual address
      MoonCoin: "0x123",
    },
  });
}

// create a new object and publish a Move package to it
async function createObjectAndPublishPackage() {
  const move = new cli.Move();

  await move.createObjectAndPublishPackage({
    packageDirectoryPath: "move/moonCoin",
    addressName: "MoonCoin",
    namedAddresses: {
      // please replace the address with the actual address of publisher
      MoonCoin: "0x123",
    },
  });
}

// upgrade a Move packaged published to an object
async function upgradeObjectPackage() {
  const move = new cli.Move();

  await move.upgradeObjectPackage({
    packageDirectoryPath: "move/moonCoin",
    // please replace the address with the actual address of object that the package was published to
    objectAddress: "0x123",
    namedAddresses: {
      // please replace the address with the actual address of object that the package was published to
      MoonCoin: "0x123",
    },
  });
}

// run a Move script
async function runScript() {
  const move = new cli.Move();

  await move.runScript({
    compiledScriptPath: "move/moonCoin/build/MoonCoin/bytecode_scripts/register.mv",
  });
}

async function run() {
  await runLocalNode();
  await init();
  await compile();
  await tests();
  await publish();
  await createObjectAndPublishPackage();
  await upgradeObjectPackage();
  await runScript();
}

run();
