/* eslint-disable no-lone-blocks */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import {
  Account,
  AccountAddress,
  AccountAddressInput,
  Aptos,
  AptosConfig,
  InputViewFunctionData,
  Network,
  NetworkToNetworkName,
  sleep,
} from "@aptos-labs/ts-sdk";
import { compilePackage, getPackageBytesToPublish } from "./utils";

const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.MAINNET];
const aptos = new Aptos(new AptosConfig({ network: APTOS_NETWORK }));

const alice = Account.generate();
const bob = Account.generate();

let data;

const moonModule = `${alice.accountAddress}::moon_coin::MoonCoin` as const;
let moonMetadata: string;
let aliceMoonSecondaryStore: string;

async function main() {
  console.log("=== Addresses ===");
  console.log(`Alice: ${alice.accountAddress.toString()}, PK: ${alice.privateKey.toString()}`);
  console.log(`Bob: ${bob.accountAddress.toString()}, PK: ${bob.privateKey.toString()}`);

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
  console.log(`MoonCoin package published on chain ${moonModule}`);

  console.log("\n=== Mint 100 MoonCoin to Alice and Bob ===");
  {
    await registerCoin(moonModule, alice);
    await registerCoin(moonModule, bob);

    console.log("Registered MoonCoin for Bob and Alice");

    await mintCoin(alice.accountAddress, 100);
    await mintCoin(bob.accountAddress, 100);

    console.log("Minted MoonCoin to Bob and Alice");

    const bobCoinAmount = await aptos.getAccountCoinAmount({
      accountAddress: bob.accountAddress,
      coinType: `${alice.accountAddress}::moon_coin::MoonCoin`,
    });
    const aliceCoinAmount = await aptos.getAccountCoinAmount({
      accountAddress: alice.accountAddress,
      coinType: `${alice.accountAddress}::moon_coin::MoonCoin`,
    });

    console.log(`Bob has ${bobCoinAmount} MoonCoin`);
    console.log(`Alice has ${aliceCoinAmount} MoonCoin`);
    if (bobCoinAmount !== 100 || aliceCoinAmount !== 100) {
      throw new Error("Bob and Alice's MoonCoin balance should be 100");
    }
  }

  console.log("\n=== Migrate Alice's MoonCoin balance and expect 100 FA and 0 Module ===");
  {
    await migrateCoin(moonModule, alice);
    moonMetadata = await getModulePairedMetadata(moonModule);
    console.log("Migrated Alice's MoonCoin to FA with metadata", moonMetadata);

    data = await aptos.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: alice.accountAddress.toString() },
          asset_type: { _in: [moonMetadata, moonModule] },
        },
      },
    });

    console.log("Alice's FA balances", data);
    if (data.length !== 1 || data[0].amount !== 100) {
      throw new Error("Alice's FA and Module balance should be 100 and 0");
    }
  }

  console.log("\n=== Transfer 50 FA MoonCoin from Alice to Bob and expected 50 FA and 50 Module ===");
  {
    await transferPrimaryStoreCoin(moonMetadata, alice, bob.accountAddress, 50);

    data = await aptos.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: bob.accountAddress.toString() },
          asset_type: { _in: [moonMetadata, moonModule] },
        },
      },
    });

    console.log("Bob's MoonCoin balance", data);
    if (data.length !== 1 || data[0].amount !== 150) {
      throw new Error("Bob's FA and Module balance should be 50 and 100");
    }
  }

  console.log("\n=== Freeze Alice's FACoin ===");
  {
    await freeze(alice.accountAddress);
    await sleep(1000);

    data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: alice.accountAddress.toString() },
          asset_type: { _in: [moonMetadata, moonModule] },
        },
      },
    });

    console.log("Alice's FACoin balance", data);
    if (!data[0].is_frozen) throw new Error("Alice's FACoin balance should be frozen");
  }

  console.log("\n=== Unfreeze Alice's FACoin ===");
  {
    await unfreeze(alice.accountAddress);
    await sleep(1000);

    data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: alice.accountAddress.toString() },
          asset_type: { _in: [moonMetadata, moonModule] },
        },
      },
    });

    console.log("Alice's FACoin balance", data);
    if (data[0].is_frozen) throw new Error("Alice's FACoin balance should not be frozen");
  }

  console.log("\n=== Create MoonCoin secondary store for Alice ===");
  {
    aliceMoonSecondaryStore = await createSecondaryStore(alice, "2");
    console.log("MoonCoin secondary store created");
    data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: alice.accountAddress.toString() },
          asset_type: { _in: [moonMetadata, moonModule, aliceMoonSecondaryStore] },
        },
      },
    });
    console.log("Alice's MoonCoin balance", data);
    if (data.length !== 2) throw new Error("Alice's MoonCoin balance should be 2");
  }

  console.log("\n=== Mint MoonCoin to Alice and deposit to secondary store ===");
  {
    await mintFACoin(aliceMoonSecondaryStore, 200);
    data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: alice.accountAddress.toString() },
          asset_type: { _in: [moonMetadata, moonModule, aliceMoonSecondaryStore] },
        },
      },
    });
    console.log("Alice's MoonCoin balance", data);
    if (!data.find((e) => e.amount === 200)) throw new Error("Alice's Secondary MoonCoin balance should be 200");
  }

  console.log("\n=== Final Balances ===");
  {
    data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: alice.accountAddress.toString() },
          asset_type: { _in: [moonMetadata, moonModule, aliceMoonSecondaryStore] },
        },
      },
    });

    console.log("Alice's MoonCoin balance", data);

    data = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: bob.accountAddress.toString() },
          asset_type: { _in: [moonMetadata, moonModule, aliceMoonSecondaryStore] },
        },
      },
    });

    console.log("Bob's MoonCoin balance", data);
  }
}

async function registerCoin(coinModule: string, account: Account) {
  const registerCoinTxn = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction: await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: { function: "0x1::managed_coin::register", typeArguments: [coinModule], functionArguments: [] },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: registerCoinTxn.hash });
}

async function mintCoin(to: AccountAddressInput, amount: number) {
  const mintCoinTxn = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: `${alice.accountAddress}::moon_coin::mint`,
        typeArguments: [],
        functionArguments: [to, amount],
      },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: mintCoinTxn.hash });
}

async function migrateCoin(coinModule: string, account: Account) {
  const migrateMoonCoinTxn = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction: await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: "0x1::coin::migrate_to_fungible_store",
        typeArguments: [coinModule],
        functionArguments: [],
      },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: migrateMoonCoinTxn.hash });
}

async function mintFACoin(store: string, amount: number) {
  const mintCoinTxn = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: `${alice.accountAddress}::moon_coin::mint_fa_and_deposit`,
        functionArguments: [store, amount],
      },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: mintCoinTxn.hash });
}

async function transferPrimaryStoreCoin(metadata: string, account: Account, to: AccountAddressInput, amount: number) {
  const transferCoinTxn = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction: await aptos.transferFungibleAsset({
      sender: account,
      fungibleAssetMetadataAddress: metadata,
      recipient: to,
      amount,
    }),
  });
  await aptos.waitForTransaction({ transactionHash: transferCoinTxn.hash });
  return transferCoinTxn;
}

async function getModulePairedMetadata(coinModule: string): Promise<string> {
  const payload: InputViewFunctionData = {
    function: "0x1::coin::paired_metadata",
    typeArguments: [coinModule],
    functionArguments: [],
  };
  return (await aptos.view<[{ vec: [{ inner: string }] }]>({ payload }))[0].vec[0].inner;
}

async function createSecondaryStore(account: Account, seed: string): Promise<string> {
  const txn = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction: await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${account.accountAddress}::moon_coin::create_secondary_store`,
        typeArguments: [],
        functionArguments: [seed],
      },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: txn.hash });
  const payload: InputViewFunctionData = {
    function: `${account.accountAddress}::moon_coin::get_secondary_store`,
    functionArguments: [account.accountAddress, seed],
  };
  return (await aptos.view<[{ inner: string }]>({ payload }))[0].inner;
}

/** Admin freezes the primary fungible store of the specified account */
async function freeze(targetAddress: AccountAddress): Promise<string> {
  return (
    await aptos.transaction.signAndSubmitTransaction({
      signer: alice,
      transaction: await aptos.transaction.build.simple({
        sender: alice.accountAddress,
        data: {
          function: `${alice.accountAddress}::moon_coin::freeze_account`,
          functionArguments: [targetAddress],
        },
      }),
    })
  ).hash;
}

/** Admin unfreezes the primary fungible store of the specified account */
async function unfreeze(targetAddress: AccountAddress): Promise<string> {
  return (
    await aptos.transaction.signAndSubmitTransaction({
      signer: alice,
      transaction: await aptos.transaction.build.simple({
        sender: alice.accountAddress,
        data: {
          function: `${alice.accountAddress}::moon_coin::unfreeze_account`,
          functionArguments: [targetAddress],
        },
      }),
    })
  ).hash;
}

main();
