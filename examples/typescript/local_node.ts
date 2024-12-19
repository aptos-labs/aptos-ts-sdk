/* eslint-disable import/no-commonjs */
/* eslint-disable import/extensions */
/* eslint-disable no-console */

/**
 * Example to show how one can require the CLI module and use it
 * to run cli commands
 */

const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");

let localNode: any;
const move = new cli.Move();

// Run local node
async function runLocalNode() {
  try {
    console.log("starting local node...");
    localNode = new cli.LocalNode({ showStdout: false });
    await localNode.run();
    console.log("local node started");
  } catch (error) {
    console.error(error);
  }
}

// initialize current directory for Aptos
async function init() {
  try {
    console.log("initializing Aptos");
    await move.init({
      network: "local",
      profile: "default",
    });
  } catch (error) {
    console.error("error initializing Aptos", error);
  }
}

// compile a package
async function compile() {
  try {
    console.log("compiling a move package");
    await move.compile({
      packageDirectoryPath: "move/moonCoin",
      namedAddresses: {
        MoonCoin: "0x123",
      },
      showStdout: false,
    });
  } catch (error) {
    console.error("error compiling a move package", error);
  }
}

// run Move unit tests for a package
async function tests() {
  try {
    console.log("running Move unit tests");
    await move.test({
      packageDirectoryPath: "move/moonCoin",
      namedAddresses: {
        MoonCoin: "0x123",
      },
    });
  } catch (error) {
    console.error("error running Move unit tests", error);
  }
}

// publish the Move package to the publisher's account
async function publish() {
  try {
    console.log("publishing the Move package to the publisher's account");
    await move.publish({
      packageDirectoryPath: "move/moonCoin",
      namedAddresses: {
        // please replace the address with the actual address
        MoonCoin: "0x123",
      },
      extraArguments: ["--assume-yes"],
      showStdout: false,
    });
  } catch (error) {
    console.error("error publishing the Move package to the publisher's account", error);
  }
}

// create a new object and publish a Move package to it
async function createObjectAndPublishPackage() {
  try {
    console.log("creating a new object and publishing a Move package to it");
    await move.createObjectAndPublishPackage({
      packageDirectoryPath: "move/moonCoin",
      addressName: "MoonCoin",
      namedAddresses: {
        // please replace the address with the actual address of publisher
        MoonCoin: "0x123",
      },
      extraArguments: ["--assume-yes"],
      showStdout: false,
    });
  } catch (error) {
    console.error("error creating a new object and publishing a Move package to it", error);
  }
}

// upgrade a Move packaged published to an object
async function upgradeObjectPackage() {
  try {
    console.log("upgrading a Move packaged published to an object");
    await move.upgradeObjectPackage({
      packageDirectoryPath: "move/moonCoin",
      // please replace the address with the actual address of object that the package was published to
      objectAddress: "0x123",
      namedAddresses: {
        // please replace the address with the actual address of object that the package was published to
        MoonCoin: "0x123",
      },
      extraArguments: ["--assume-yes"],
      showStdout: false,
    });
  } catch (error) {
    console.error("error upgrading a Move packaged published to an object", error);
  }
}

// run a Move script
async function runScript() {
  try {
    console.log("running a Move script");
    await move.runScript({
      compiledScriptPath: "move/moonCoin/build/MoonCoin/bytecode_scripts/register.mv",
      showStdout: false,
    });
  } catch (error) {
    console.error("error running a Move script", error);
  }
}

// build a publication transaction payload and store it in a JSON output file
async function buildPublishPayload() {
  try {
    console.log("building a publication transaction payload and storing it in a JSON output file");
    await move.buildPublishPayload({
      outputFile: "move/moonCoin/moonCoin.json",
      packageDirectoryPath: "move/moonCoin",
      namedAddresses: {
        MoonCoin: "0x123",
      },
      extraArguments: ["--assume-yes"],
      showStdout: false,
    });
  } catch (error) {
    console.error("error building a publication transaction payload and storing it in a JSON output file", error);
  }
}

// Stop local node
async function stopLocalNode() {
  try {
    console.log("stopping local node");
    await localNode.stop();
    console.log("local node stopped");
  } catch (err: any) {
    console.error("error stopping local node", err);
  }
}

async function profileGas() {
  try {
    console.log("running gas profiling");
    await move.gasProfile({
      network: "mainnet",
      transactionId: "1702334345",
    });
  } catch (error) {
    console.error("error running gas profiling", error);
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

  // run gas profiling
  await profileGas();
}

run();
