/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  InputViewFunctionData,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";
import { compilePackage, getPackageBytesToPublish } from "./utils";

const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];
const aptos = new Aptos(new AptosConfig({ network: APTOS_NETWORK }));

const alice = Account.generate();
const bob = Account.generate();

let data;

async function main() {
  console.log("=== Addresses ===");
  console.log(`Alice: ${alice.accountAddress.toString()}`);
  console.log(`Bob: ${bob.accountAddress.toString()}`);

  await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });
  await aptos.fundAccount({ accountAddress: bob.accountAddress, amount: 100_000_000 });

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

  console.log("\n=== Mint MoonCoin and query indexer ===");

  const registerCoinTxn = await aptos.signAndSubmitTransaction({
    signer: bob,
    transaction: await aptos.transaction.build.simple({
      sender: bob.accountAddress,
      data: {
        function: "0x1::managed_coin::register",
        typeArguments: [MOON_COIN_MODULE],
        functionArguments: [],
      },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: registerCoinTxn.hash });

  console.log("Registered MoonCoin for Bob");

  const mintMoonCoinTxn = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::managed_coin::mint",
        typeArguments: [MOON_COIN_MODULE],
        functionArguments: [bob.accountAddress, 100],
      },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: mintMoonCoinTxn.hash });

  console.log(`Minted MoonCoin to ${bob.accountAddress}`);

  const coinAmount = await aptos.getAccountCoinAmount({
    accountAddress: bob.accountAddress,
    coinType: `${alice.accountAddress}::moon_coin::MoonCoin`,
  });

  console.log(`Bob has ${coinAmount} MoonCoin`);

  console.log("\n=== Mint FACoin and query indexer ===");

  const mintFACoinTxn = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: `${alice.accountAddress}::fa_coin::mint`,
        functionArguments: [bob.accountAddress, 100],
      },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: mintFACoinTxn.hash });

  console.log(`Minted FACoin to ${bob.accountAddress}`);

  const faAmount = await aptos.getAccountCoinAmount({
    accountAddress: bob.accountAddress,
    faMetadataAddress: faCoinAddress,
  });

  console.log(`Bob has ${faAmount} FACoin`);

  console.log("\n=== Mint FACoin to secondary store ===");

  const mintFACoinToSecondaryStoreTxn = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: `${alice.accountAddress}::fa_coin::mint_secondary`,
        functionArguments: [faSecondaryStoreAddress, 100],
      },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: mintFACoinToSecondaryStoreTxn.hash });

  console.log(`Minted FACoin to secondary store of ${alice.accountAddress}`);

  data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
    options: { where: { owner_address: { _eq: alice.accountAddress.toString() }, asset_type: { _eq: faCoinAddress } } },
  });

  console.log("Alice's FACoin balance", data);

  console.log("\n=== Freeze FACoin ===");

  const freezeBobTxn = await freeze(alice, bob.accountAddress);
  await aptos.waitForTransaction({ transactionHash: freezeBobTxn });

  console.log(`Freezed ${bob.accountAddress}`);

  data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
    options: { where: { owner_address: { _eq: bob.accountAddress.toString() }, asset_type: { _eq: faCoinAddress } } },
  });
  console.log("Bob's FACoin balance", data);
  if (!data[0].is_frozen) throw new Error("Bob's FACoin balance should be frozen");

  console.log("\n=== Unfreeze FACoin ===");

  const unfreezeBobTxn = await unfreeze(alice, bob.accountAddress);
  await aptos.waitForTransaction({ transactionHash: unfreezeBobTxn });

  console.log(`Unfreezed ${bob.accountAddress}`);

  data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
    options: { where: { owner_address: { _eq: bob.accountAddress.toString() }, asset_type: { _eq: faCoinAddress } } },
  });
  console.log("Bob's FACoin balance", data);
  if (data[0].is_frozen) throw new Error("Bob's FACoin balance should not be frozen");

  console.log("\n=== Transfer MoonCoin to Alice ===");

  const transferMoonCoinTxn = await aptos.signAndSubmitTransaction({
    signer: bob,
    transaction: await aptos.transaction.build.simple({
      sender: bob.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer_coins",
        typeArguments: [MOON_COIN_MODULE],
        functionArguments: [alice.accountAddress, 1],
      },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: transferMoonCoinTxn.hash });

  console.log("Transferred MoonCoin to Alice");

  data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
    options: {
      where: { owner_address: { _eq: alice.accountAddress.toString() }, asset_type: { _eq: MOON_COIN_MODULE } },
    },
  });
  console.log("Alice's MoonCoin balance", data);
  if (data[0].amount !== 1) throw new Error("Alice should have 1 MoonCoin");

  console.log("\n=== Transfer FACoin to Alice ===");

  const transferFACoinTxn = await aptos.signAndSubmitTransaction({
    signer: bob,
    transaction: await aptos.transferFungibleAsset({
      sender: bob,
      recipient: alice.accountAddress,
      amount: 1,
      fungibleAssetMetadataAddress: faCoinAddress,
    }),
  });
  await aptos.waitForTransaction({ transactionHash: transferFACoinTxn.hash });

  console.log("Transferred FACoin to Alice");

  data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
    options: { where: { owner_address: { _eq: alice.accountAddress.toString() }, asset_type: { _eq: faCoinAddress } } },
  });
  console.log("Alice's FACoin balance", data);
  if (data.every(({ amount }) => amount !== 1)) throw new Error("Alice should have 1 FACoin");

  console.log("\n=== Transfer FACoin from secondary store to Bob ===");
  const transferSecondaryFACoinToBobTxn = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::fungible_asset::transfer",
        typeArguments: ["0x1::fungible_asset::FungibleStore"],
        functionArguments: [faSecondaryStoreAddress, await getPrimaryStore(bob), 2],
      },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: transferSecondaryFACoinToBobTxn.hash });

  console.log("Transferred FACoin from secondary store to Bob");

  data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
    options: { where: { owner_address: { _eq: bob.accountAddress.toString() }, asset_type: { _eq: faCoinAddress } } },
  });
  console.log("Bob's FACoin balance", data);

  console.log("\n=== Create MoonCoin pairing ===");

  const migrateMoonCoinTxn = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::coin::migrate_to_fungible_store",
        typeArguments: [MOON_COIN_MODULE],
        functionArguments: [],
      },
    }),
  });

  await aptos.waitForTransaction({ transactionHash: migrateMoonCoinTxn.hash });
  console.log("MoonCoin pairing created");

  data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
    options: { where: { asset_type: { _in: [MOON_COIN_MODULE, faCoinAddress] } } },
  });

  console.log("Coins data", data);

  const moonCoinMetadata = await aptos.getFungibleAssetMetadataByAssetType({
    assetType: MOON_COIN_MODULE,
  });

  console.log("MoonCoin metadata ", moonCoinMetadata);

  console.log("\n=== Mint FA MoonCoin and query indexer ===");

  const mintFAMoonCoinTxn = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::managed_coin::mint",
        typeArguments: [MOON_COIN_MODULE],
        functionArguments: [bob.accountAddress, 100],
      },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: mintFAMoonCoinTxn.hash });

  console.log(`Minted MoonCoin to ${bob.accountAddress}`);

  data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
    options: {
      where: { owner_address: { _eq: bob.accountAddress.toString() }, asset_type: { _eq: MOON_COIN_MODULE } },
    },
  });

  console.log("Bob's MoonCoin balance", data);

  console.log("\n=== Transfer FA MoonCoin to Alice ===");

  const transferFAMoonCoinTxn = await aptos.signAndSubmitTransaction({
    signer: bob,
    transaction: await aptos.transaction.build.simple({
      sender: bob.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer_coins",
        typeArguments: [MOON_COIN_MODULE],
        functionArguments: [alice.accountAddress, 1],
      },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: transferFAMoonCoinTxn.hash });

  console.log("Transferred FA MoonCoin to Alice");

  data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
    options: {
      where: { owner_address: { _eq: alice.accountAddress.toString() }, asset_type: { _eq: MOON_COIN_MODULE } },
    },
  });

  console.log("Alice's MoonCoin balance", data);
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

async function getPrimaryStore(admin: Account): Promise<string> {
  const payload: InputViewFunctionData = {
    function: `${alice.accountAddress}::fa_coin::get_primary_store`,
    functionArguments: [admin.accountAddress],
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

/** Admin freezes the primary fungible store of the specified account */
async function freeze(admin: Account, targetAddress: AccountAddress): Promise<string> {
  return (
    await aptos.transaction.signAndSubmitTransaction({
      signer: admin,
      transaction: await aptos.transaction.build.simple({
        sender: admin.accountAddress,
        data: {
          function: `${admin.accountAddress}::fa_coin::freeze_account`,
          functionArguments: [targetAddress],
        },
      }),
    })
  ).hash;
}

/** Admin unfreezes the primary fungible store of the specified account */
async function unfreeze(admin: Account, targetAddress: AccountAddress): Promise<string> {
  return (
    await aptos.transaction.signAndSubmitTransaction({
      signer: admin,
      transaction: await aptos.transaction.build.simple({
        sender: admin.accountAddress,
        data: {
          function: `${admin.accountAddress}::fa_coin::unfreeze_account`,
          functionArguments: [targetAddress],
        },
      }),
    })
  ).hash;
}

main();
