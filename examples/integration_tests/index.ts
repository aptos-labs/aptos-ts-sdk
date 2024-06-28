/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint-disable import/no-commonjs */
/* eslint-disable import/extensions */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Account, AnyNumber, Aptos, AptosConfig, Network, InputViewFunctionData } from "@aptos-labs/ts-sdk";

const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");

let localNode: any;

const runLocalNode = async () => {
  localNode = new cli.LocalNode();
  await localNode.run();
};

const compilePackage = async (namedAddress: string) => {
  const move = new cli.Move();

  await move.compile({
    packageDirectoryPath: "move/facoin",
    namedAddresses: {
      FACoin: namedAddress,
    },
  });
};

const publishPackage = async (namedAddress: string, privateKey: string, url: string) => {
  const move = new cli.Move();

  await move.publish({
    packageDirectoryPath: "move/facoin",
    namedAddresses: {
      FACoin: namedAddress,
    },
    privateKey,
    url,
  });
};

/** Admin mint the newly created coin to the specified receiver address */
const submitMintCoinTransaction = async (
  admin: Account,
  receiver: Account,
  amount: AnyNumber,
  aptos: Aptos,
): Promise<string> => {
  const transaction = await aptos.transaction.build.simple({
    sender: admin.accountAddress,
    data: {
      function: `${admin.accountAddress}::fa_coin::mint`,
      functionArguments: [receiver.accountAddress, amount],
    },
  });

  const senderAuthenticator = await aptos.transaction.sign({ signer: admin, transaction });
  const pendingTxn = await aptos.transaction.submit.simple({ transaction, senderAuthenticator });

  const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
  return response.version;
};

/** Return the FA balance of the account */
const queryAccountFaBalance = async (
  owner: Account,
  assetType: string,
  aptos: Aptos,
  ledgerVersion?: string,
): Promise<number> => {
  const data = await aptos.getCurrentFungibleAssetBalances({
    options: {
      where: {
        owner_address: { _eq: owner.accountAddress.toStringLong() },
        asset_type: { _eq: assetType },
      },
    },
    minimumLedgerVersion: BigInt(ledgerVersion || 0),
  });

  return data[0]?.amount ?? 0;
};

/** Return the address of the managed fungible asset that's created when this module is deployed */
async function getMetadata(admin: Account, aptos: Aptos): Promise<string> {
  const payload: InputViewFunctionData = {
    function: `${admin.accountAddress}::fa_coin::get_metadata`,
    functionArguments: [],
  };
  const res = (await aptos.view<[{ inner: string }]>({ payload }))[0];
  return res.inner;
}

const stopLocalNode = () => {
  localNode.stop();
};

const main = async () => {
  // spin up a local node
  await runLocalNode();

  // initialize sdk client
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);

  // generate an account
  const alice = Account.generate();
  const bob = Account.generate();

  // fund the account
  await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });
  await aptos.fundAccount({ accountAddress: bob.accountAddress, amount: 100_000_000 });

  // compile a move package
  await compilePackage(alice.accountAddress.toString());

  // publish the move module
  await publishPackage(alice.accountAddress.toString(), alice.privateKey.toString(), "http://localhost:8080");

  // fetch FA metadata
  const metadataAddress = await getMetadata(alice, aptos);

  // Query for Bob's initial FA balance
  const initialBalance = await queryAccountFaBalance(bob, metadataAddress, aptos);
  console.log(`Bob's initial FACoin primary fungible store balance: ${initialBalance}.`);

  // Alice submits a transaction to mint 100 coins to Bob
  const ledgerVersion = await submitMintCoinTransaction(alice, bob, 100, aptos);

  // Query for Bob's updated FA balance
  const updatedBalance = await queryAccountFaBalance(bob, metadataAddress, aptos, ledgerVersion);
  console.log(`Bob's updated FACoin primary fungible store balance: ${updatedBalance}.`);

  // Stop the local node
  stopLocalNode();
};

main();
