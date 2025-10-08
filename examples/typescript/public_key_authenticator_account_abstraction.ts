/* eslint-disable no-console */
import dotenv from "dotenv";
dotenv.config();
import {
  Account,
  AbstractedAccount,
  Aptos,
  Network,
  AptosConfig,
  UserTransactionResponse,
  Serializer,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";
import { compilePackage, getPackageBytesToPublish } from "./utils";

const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];
const aptos = new Aptos(new AptosConfig({ network: APTOS_NETWORK }));

const main = async () => {
  const alice = Account.generate();
  const bob = Account.generate();

  console.log("\n=== Addresses ===");
  console.log(`Alice: ${alice.accountAddress.toString()}`);
  console.log(`Bob: ${bob.accountAddress.toString()}`);
  console.log("\n=== Funding Accounts ===");
  await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 1000000000000000 });
  console.log("Finished funding accounts!");

  console.log("\n=== Compiling public_key_authenticator package locally ===");
  compilePackage("move/account_abstraction", "move/account_abstraction/public_key_authenticator.json", [
    { name: "deployer", address: alice.accountAddress },
  ]);
  const { metadataBytes, byteCode } = getPackageBytesToPublish(
    "move/account_abstraction/public_key_authenticator.json",
  );
  console.log(`\n=== Publishing public_key_authenticator package to ${aptos.config.network} network ===`);
  const publishTxn = await aptos.publishPackageTransaction({
    account: alice.accountAddress,
    metadataBytes,
    moduleBytecode: byteCode,
  });
  const pendingPublishTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: publishTxn });
  console.log(`Publish package transaction hash: ${pendingPublishTxn.hash}`);
  await aptos.waitForTransaction({ transactionHash: pendingPublishTxn.hash });

  console.log("\n=== Dispatchable authentication function info ===");

  const authenticationFunction = `${alice.accountAddress}::public_key_authenticator::authenticate`;
  const [moduleAddress, moduleName, functionName] = authenticationFunction.split("::");

  console.log(`Module address: ${moduleAddress}`);
  console.log(`Module name: ${moduleName}`);
  console.log(`Function name: ${functionName}`);

  console.log(`\n=== Enabling account abstraction for ${alice.accountAddress.toString()} ===`);
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

  console.log("\n=== Permitting Bob's public key to sign on behalf of Alice");
  const enableBobPublicKeyTransaction = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function: `${alice.accountAddress}::public_key_authenticator::permit_public_key`,
      typeArguments: [],
      functionArguments: [bob.publicKey.toUint8Array()],
    },
  });
  const pendingEnableBobPublicKeyTransaction = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: enableBobPublicKeyTransaction,
  });
  console.log(`Enable Bob's public key transaction hash: ${pendingEnableBobPublicKeyTransaction.hash}`);
  await aptos.waitForTransaction({ transactionHash: pendingEnableBobPublicKeyTransaction.hash });

  console.log("\n=== Signing a transaction with the abstracted account using Bob's signer ===");

  const abstractedAccount = new AbstractedAccount({
    accountAddress: alice.accountAddress,
    signer: (digest) => {
      const serializer = new Serializer();
      bob.publicKey.serialize(serializer);
      bob.sign(digest).serialize(serializer);
      return serializer.toUint8Array();
    },
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
