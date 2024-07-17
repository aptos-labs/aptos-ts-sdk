/* eslint-disable import/no-commonjs */
/* eslint-disable import/extensions */

/**
 * Example to show how one can require the CLI module and use it
 * to run cli commands
 */

const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");

let localNode: any;
const move = new cli.Move();

// Run local node
async function runLocalNode() {
  localNode = new cli.LocalNode();
  await localNode.run();
}

// initialize current directory for Aptos
async function init() {
  await move.init({
    network: "local",
    profile: "default",
  });
}

// compile a package
async function compile() {
  await move.compile({
    packageDirectoryPath: "move/moonCoin",
    namedAddresses: {
      MoonCoin: "0x123",
    },
  });
}

// run Move unit tests for a package
async function tests() {
  await move.test({
    packageDirectoryPath: "move/moonCoin",
    namedAddresses: {
      MoonCoin: "0x123",
    },
  });
}

// publish the Move package to the publisher's account
async function publish() {
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
  await move.runScript({
    compiledScriptPath: "move/moonCoin/build/MoonCoin/bytecode_scripts/register.mv",
  });
}

// build a publication transaction payload and store it in a JSON output file
async function buildPublishPayload() {
  await move.buildPublishPayload({
    outputFile: "move/moonCoin/test-package.json",
    packageDirectoryPath: "move/moonCoin",
    namedAddresses: {
      MoonCoin: "0x123",
    },
  });
}

// Stop local node
async function stopLocalNode() {
  await localNode.stop();
  try {
    // Query localnet endpoint
    await fetch("http://localhost:8080");
  } catch (err: any) {
    console.log("localnet stopped");
  }
}

async function run() {
  // start the localnet
  await runLocalNode();

  await init();
  await compile();
  await tests();
  await publish();
  await createObjectAndPublishPackage();
  await upgradeObjectPackage();
  await runScript();
  await buildPublishPayload();

  // stop the localnet
  await stopLocalNode();
}

run();
