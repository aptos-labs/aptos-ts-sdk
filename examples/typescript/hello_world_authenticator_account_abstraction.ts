/* eslint-disable no-console */
import dotenv from "dotenv";
dotenv.config();
import { Account, AbstractedAccount, Cedra, Network, CedraConfig, UserTransactionResponse } from "@cedra-labs/ts-sdk";
import { compilePackage, getPackageBytesToPublish } from "./utils";

const cedra = new Cedra(new CedraConfig({ network: Network.DEVNET }));

const main = async () => {
  const alice = Account.generate();

  console.log("\n=== Addresses ===");
  console.log(`Alice: ${alice.accountAddress.toString()}`);

  console.log("\n=== Funding Accounts ===");
  await cedra.fundAccount({ accountAddress: alice.accountAddress, amount: 1000000000000000 });
  console.log("Finished funding accounts!");

  console.log("\n=== Compiling hello_world_authenticator package locally ===");
  compilePackage("move/account_abstraction", "move/account_abstraction/hello_world_authenticator.json", [
    { name: "deployer", address: alice.accountAddress },
  ]);
  const { metadataBytes, byteCode } = getPackageBytesToPublish(
    "move/account_abstraction/hello_world_authenticator.json",
  );
  console.log(`\n=== Publishing hello_world_authenticator package to ${cedra.config.network} network ===`);
  const publishTxn = await cedra.publishPackageTransaction({
    account: alice.accountAddress,
    metadataBytes,
    moduleBytecode: byteCode,
  });
  const pendingPublishTxn = await cedra.signAndSubmitTransaction({ signer: alice, transaction: publishTxn });
  console.log(`Publish package transaction hash: ${pendingPublishTxn.hash}`);
  await cedra.waitForTransaction({ transactionHash: pendingPublishTxn.hash });

  console.log("\n=== Dispatchable authentication function info ===");

  const authenticationFunction = `${alice.accountAddress}::hello_world_authenticator::authenticate`;
  const [moduleAddress, moduleName, functionName] = authenticationFunction.split("::");

  console.log(`Module address: ${moduleAddress}`);
  console.log(`Module name: ${moduleName}`);
  console.log(`Function name: ${functionName}`);

  console.log(
    `\n=== Changing ${alice.accountAddress.toString()} to use any_authenticator's AccountAbstraction function ===`,
  );
  const enableAccountAbstractionTransaction = await cedra.abstraction.enableAccountAbstractionTransaction({
    accountAddress: alice.accountAddress,
    authenticationFunction,
  });
  const pendingEnableAccountAbstractionTransaction = await cedra.signAndSubmitTransaction({
    signer: alice,
    transaction: enableAccountAbstractionTransaction,
  });
  console.log(`Enable account abstraction transaction hash: ${pendingEnableAccountAbstractionTransaction.hash}`);
  await cedra.waitForTransaction({ transactionHash: pendingEnableAccountAbstractionTransaction.hash });

  console.log("\n=== Signing a transaction with the abstracted account ===");

  const abstractedAccount = new AbstractedAccount({
    accountAddress: alice.accountAddress,
    signer: () => new TextEncoder().encode("hello world"),
    authenticationFunction,
  });
  const pendingTransferTxn = await cedra.signAndSubmitTransaction({
    signer: abstractedAccount,
    transaction: await cedra.transferCoinTransaction({
      sender: abstractedAccount.accountAddress,
      recipient: abstractedAccount.accountAddress,
      amount: 100,
    }),
  });

  const response = await cedra.waitForTransaction({ transactionHash: pendingTransferTxn.hash });
  console.log(`Committed transaction: ${response.hash}`);

  const txn = (await cedra.getTransactionByHash({
    transactionHash: pendingTransferTxn.hash,
  })) as UserTransactionResponse;
  console.log(`Transaction Signature: ${JSON.stringify(txn.signature, null, 2)}`);
};

main();
