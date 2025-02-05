/* eslint-disable no-console */

import {
  Account,
  AbstractedAccount,
  Aptos,
  Network,
  AptosConfig,
  UserTransactionResponse,
  Hex,
} from "@aptos-labs/ts-sdk";
import { compilePackage, getPackageBytesToPublish } from "./utils";

const aptos = new Aptos(new AptosConfig({ network: Network.DEVNET }));

const main = async () => {
  const alice = Account.generate();

  console.log("\n=== Addresses ===");
  console.log(`Alice: ${alice.accountAddress.toString()}`);

  console.log("\n=== Funding Accounts ===");
  await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 1000000000000000 });
  console.log("Finished funding accounts!");

  console.log("\n=== Compiling any_authenticator package locally ===");
  compilePackage(
    "move/account_abstraction",
    "move/account_abstraction/any_authenticator.json",
    [{ name: "deployer", address: alice.accountAddress }],
    ["--move-2"],
  );
  const { metadataBytes, byteCode } = getPackageBytesToPublish("move/account_abstraction/any_authenticator.json");
  console.log(`\n=== Publishing any_authenticator package to ${aptos.config.network} network ===`);
  const publishTxn = await aptos.publishPackageTransaction({
    account: alice.accountAddress,
    metadataBytes,
    moduleBytecode: byteCode,
  });
  const pendingPublishTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: publishTxn });
  console.log(`Publish package transaction hash: ${pendingPublishTxn.hash}`);
  await aptos.waitForTransaction({ transactionHash: pendingPublishTxn.hash });

  console.log("\n=== Dispatchable authentication function info ===");

  const authenticationFunction = `${alice.accountAddress}::any_authenticator::authenticate`;
  const [moduleAddress, moduleName, functionName] = authenticationFunction.split("::");

  console.log(`Module address: ${moduleAddress}`);
  console.log(`Module name: ${moduleName}`);
  console.log(`Function name: ${functionName}`);

  console.log(
    `\n=== Changing ${alice.accountAddress.toString()} to use any_authenticator's AccountAbstraction function ===`,
  );
  const enableAccountAbstractionTransaction = await aptos.abstraction.enableAccountAbstractionTransaction({
    accountAddress: alice.accountAddress,
    authenticationFunction,
  });
  const pendingEnableAccountAbstractionTransaction = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: enableAccountAbstractionTransaction,
  });
  console.log(`Enable account abstraction transaction hash: ${pendingEnableAccountAbstractionTransaction.hash}`);
  await aptos.waitForTransaction({ transactionHash: pendingEnableAccountAbstractionTransaction.hash });

  console.log("\n=== Signing a transaction with the abstracted account ===");

  const abstractedAccount = new AbstractedAccount({
    signer: () => Hex.fromHexString("0x01").toUint8Array(),
    accountAddress: alice.accountAddress,
    authenticationFunction,
  });
  const pendingTransferTxn = await aptos.signAndSubmitTransaction({
    signer: abstractedAccount,
    transaction: await aptos.transferCoinTransaction({
      sender: abstractedAccount.accountAddress,
      recipient: abstractedAccount.accountAddress,
      amount: 100,
    }),
  });

  const response = await aptos.waitForTransaction({ transactionHash: pendingTransferTxn.hash });
  console.log(`Committed transaction: ${response.hash}`);

  const txn = (await aptos.getTransactionByHash({
    transactionHash: pendingTransferTxn.hash,
  })) as UserTransactionResponse;
  console.log(`Transaction Signature: ${JSON.stringify(txn.signature, null, 2)}`);
};

main();
