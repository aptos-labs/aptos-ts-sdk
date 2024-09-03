/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import { Account, Aptos, AptosConfig, InputViewFunctionData, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";
import { compilePackage, getPackageBytesToPublish } from "./utils";

const APTOS_NETWORK: Network = NetworkToNetworkName[Network.DEVNET];
const aptos = new Aptos(new AptosConfig({ network: APTOS_NETWORK }));

const alice = Account.generate();

async function main() {
  console.log("=== Addresses ===");
  console.log(`Alice: ${alice.accountAddress.toString()}, Private Key: ${alice.privateKey}`);

  await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });

  console.log("\n=== Compiling MoonCoin package locally ===");

  compilePackage("move/moonCoin", "move/moonCoin/moonCoin.json", [{ name: "MoonCoin", address: alice.accountAddress }]);
  const { metadataBytes: coinMetadataBytes, byteCode: coinByteCode } =
    getPackageBytesToPublish("move/moonCoin/moonCoin.json");

  console.log(`\n=== Publishing MoonCoin package to ${aptos.config.network} network ===`);

  const publishMoonCoinTxn = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: await aptos.publishPackageTransaction({
      account: alice.accountAddress,
      metadataBytes: coinMetadataBytes,
      moduleBytecode: coinByteCode,
    }),
  });

  await aptos.waitForTransaction({ transactionHash: publishMoonCoinTxn.hash });
  console.log(`MoonCoin package published on chain ${MOON_COIN_MODULE}`);

  console.log("\n=== Compiling FACoin package locally ===");

  compilePackage("move/facoin", "move/facoin/facoin.json", [{ name: "FACoin", address: alice.accountAddress }]);
  const { metadataBytes: faMetadatabytes, byteCode: faBytecode } = getPackageBytesToPublish("move/facoin/facoin.json");

  console.log(`\n=== Publishing FACoin package to ${aptos.config.network} network ===`);

  const publishFACoinTxn = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: await aptos.publishPackageTransaction({
      account: alice.accountAddress,
      metadataBytes: faMetadatabytes,
      moduleBytecode: faBytecode,
    }),
  });
  await aptos.waitForTransaction({ transactionHash: publishFACoinTxn.hash });

  const faCoinAddress = await getMetadata(alice);
  const faSecondaryStoreAddress = await getSecondaryStore(alice);

  console.log(`FACoin package published on chain ${faCoinAddress}`);
  console.log(`FACoin secondary store published on chain ${faSecondaryStoreAddress}`);

  console.log("\n=== Balance of Alice ===");

  const balance = await aptos.getCurrentFungibleAssetBalances({
    options: { where: { owner_address: { _eq: alice.accountAddress.toString() } } },
  });
  console.log("Alice's balance", balance);
}

const MOON_COIN_MODULE = `${alice.accountAddress}::moon_coin::MoonCoin` as const;

async function getMetadata(admin: Account): Promise<string> {
  const payload: InputViewFunctionData = {
    function: `${admin.accountAddress}::fa_coin::get_metadata`,
    functionArguments: [],
  };
  const res = (await aptos.view<[{ inner: string }]>({ payload }))[0];
  return res.inner;
}

async function getSecondaryStore(admin: Account): Promise<string> {
  const payload: InputViewFunctionData = {
    function: `${admin.accountAddress}::fa_coin::get_secondary_store`,
    functionArguments: [],
  };
  const res = (await aptos.view<[{ inner: string }]>({ payload }))[0];
  return res.inner;
}

main();

const hello = [
  {
    // APT
    amount: 98329000,
    asset_type: "0x000000000000000000000000000000000000000000000000000000000000000a",
    is_frozen: false,
    is_primary: true,
    last_transaction_timestamp: "2024-09-03T17:57:25",
    last_transaction_version: 53585971,
    owner_address: "0x94c1af0dfe748ac419b9e407e1616f20aae4b4870dd2b80d3c66296017c6a2ce",
    storage_id: "0xcaac7a53e25649905b63d1993bdfaca603d0e2e9468760355d8ff47d0dd07357",
    token_standard: "v2",
  },
  {
    amount: 150000,
    asset_type: "0x1ca79da641af41f4564ba93e7c737a7dbf78f68fc46c61fbb612353598a1552d",
    is_frozen: false,
    is_primary: true,
    last_transaction_timestamp: "2024-09-03T17:57:18",
    last_transaction_version: 53585872,
    owner_address: "0x94c1af0dfe748ac419b9e407e1616f20aae4b4870dd2b80d3c66296017c6a2ce",
    storage_id: "0x344347abe671583927527317db421b1a55a8ba84cbbbb372bf493a807f776e53",
    token_standard: "v2",
  },
  {
    amount: 1000000,
    asset_type: "0x901ee66ca88ebb5ca03cc77c54d268f8954dc9bc0bb6f0385321376d6336ae20",
    is_frozen: true,
    is_primary: true,
    last_transaction_timestamp: "2024-09-03T17:57:25",
    last_transaction_version: 53585971,
    owner_address: "0x94c1af0dfe748ac419b9e407e1616f20aae4b4870dd2b80d3c66296017c6a2ce",
    storage_id: "0xd50caae2ea4389f65720251e172f2e07db4e021996c8dd2fa0caaa3ff3fa1901",
    token_standard: "v2",
  },
  {
    amount: 100000,
    asset_type: "0x94c1af0dfe748ac419b9e407e1616f20aae4b4870dd2b80d3c66296017c6a2ce::moon_coin::MoonCoin",
    is_frozen: false,
    is_primary: true,
    last_transaction_timestamp: "2024-09-03T17:57:18",
    last_transaction_version: 53585872,
    owner_address: "0x94c1af0dfe748ac419b9e407e1616f20aae4b4870dd2b80d3c66296017c6a2ce",
    storage_id: "0x067926787ee4009a6aa111c8271a2fec456b3aae6671ca64ef7f7809c4f034b9",
    token_standard: "v1",
  },
  {
    amount: 1000000,
    asset_type: "0xe90f03519bb31031fdae5aed0ed44485b16c9844d9d2dacf4039cb72547b1f8c",
    is_frozen: false,
    is_primary: true,
    last_transaction_timestamp: "2024-09-03T17:57:25",
    last_transaction_version: 53585971,
    owner_address: "0x94c1af0dfe748ac419b9e407e1616f20aae4b4870dd2b80d3c66296017c6a2ce",
    storage_id: "0x4b8a0a8294af51f1f6be322a864252957516b69f2b406fc53314a5f633265c7b",
    token_standard: "v2",
  },
  {
    amount: 1000000,
    asset_type: "0xe90f03519bb31031fdae5aed0ed44485b16c9844d9d2dacf4039cb72547b1f8c",
    is_frozen: false,
    is_primary: false,
    last_transaction_timestamp: "2024-09-03T17:57:25",
    last_transaction_version: 53585971,
    owner_address: "0x94c1af0dfe748ac419b9e407e1616f20aae4b4870dd2b80d3c66296017c6a2ce",
    storage_id: "0xe9942cf6be043bc480e21e693a7a08726f2590c9880771c2af1db8b9d96a27c3",
    token_standard: "v2",
  },
];
