/* eslint-disable import/no-commonjs */
/* eslint-disable import/extensions */

/**
 * Example to show how one can require the LocalNode module and use it
 * to run an aptos local node
 */

const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");

async function example() {
  const localNode = new cli.LocalNode();
  localNode.run();
}
example();
