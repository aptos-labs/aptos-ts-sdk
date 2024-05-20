/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint-disable import/no-commonjs */
/* eslint-disable import/extensions */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { transferAPT } from "./tests/transfer_apt";
import { sponsorTransaction } from "./tests/sponsor_transaction";
import { multiAgentTransaction } from "./tests/multi_agent_transaction";

const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");

let localNode: any;

const runLocalNode = async () => {
  localNode = new cli.LocalNode();
  await localNode.run();
};

const publishPackage = async () => {
  const move = new cli.Move();

  await move.compile({
    packageDirectoryPath: "move/facoin",
    namedAddresses: {
      FACoin: "0xa",
    },
  });
};

const runTests = async () => {
  console.log("run transfer apt test");
  await transferAPT();
  console.log("run sponsor transaction test");
  await sponsorTransaction();
  console.log("run multi agent transaction test");
  await multiAgentTransaction();
};

const stopLocalNode = () => {
  localNode.stop();
};

const main = async () => {
  await runLocalNode();
  // await publishPackage();
  await runTests();
  console.log("complete tests");
  stopLocalNode();
};

main();
