// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  SigningSchemeInput,
  Network,
  AccountAddress,
  Ed25519Account,
  SingleKeyAccount,
  PendingTransactionResponse,
  InputGenerateTransactionPayloadData,
  Serializer,
  Deserializer,
} from "../../../src";
import { longTestTimeout } from "../../unit/helper";
import { getAptosClient } from "../helper";
import { fundAccounts, publishTransferPackage } from "./helper";
import { AbstractedEd25519Account } from "../../../src/account/AbstractedAccount";
import { FungibleAssetPermission, GasPermission, NFTPermission, Permission } from "../../../src/types/permissions";

const LOCAL_NET = getAptosClient();
const CUSTOM_NET = getAptosClient({
  network: Network.CUSTOM,
  fullnode: "http://127.0.0.1:8080/v1",
  faucet: "http://127.0.0.1:8081",
  indexer: "http://127.0.0.1:8090",
});

const { aptos } = CUSTOM_NET;

describe("transaction submission", () => {
  let contractPublisherAccount: Ed25519Account;
  let primaryAccount: SingleKeyAccount;
  let subAccount: AbstractedEd25519Account;
  let receiverAccounts: Ed25519Account[];

  beforeAll(async () => {
    contractPublisherAccount = Account.generate();
    await fundAccounts(LOCAL_NET.aptos, [contractPublisherAccount]);
    await publishTransferPackage(LOCAL_NET.aptos, contractPublisherAccount);
  });

  beforeEach(async () => {
    primaryAccount = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
    subAccount = AbstractedEd25519Account.generate();
    receiverAccounts = [Account.generate(), Account.generate()];
    await fundAccounts(LOCAL_NET.aptos, [primaryAccount, ...receiverAccounts]);
  }, longTestTimeout);

  test("Able to re-grant permissions for the same subaccount", async () => {
    // account
    const APT_PERMISSION = FungibleAssetPermission.from({
      asset: AccountAddress.A, // apt address
      amount: 10,
    });
    await requestPermission({
      primaryAccount,
      permissionedAccount: subAccount,
      permissions: [APT_PERMISSION],
    });

    const perm1 = await aptos.getPermissions({
      primaryAccountAddress: primaryAccount.accountAddress,
      subAccountPublicKey: subAccount.publicKey,
      filter: FungibleAssetPermission,
    });
    expect(perm1.length).toBe(1);
    expect(perm1[0].amount).toEqual(BigInt(10));

    const APT_PERMISSION2 = FungibleAssetPermission.from({
      asset: AccountAddress.A,
      amount: 20,
    });
    await requestPermission({
      primaryAccount,
      permissionedAccount: subAccount,
      permissions: [APT_PERMISSION2],
    });

    const perm2 = await aptos.getPermissions({
      primaryAccountAddress: primaryAccount.accountAddress,
      subAccountPublicKey: subAccount.publicKey,
      filter: FungibleAssetPermission,
    });
    expect(perm2.length).toBe(1);
    expect(perm2[0].amount).toEqual(BigInt(30));
  });

  test("Able to grant permissions for NFTs", async () => {
    const nftAddress = await generateNFT({ account: primaryAccount });
    // TODO: Add this back in when Runtian is done with his refactor
    // const nftAddress2 = await generateNFT({ account: primaryAccount });

    await requestPermission({
      primaryAccount,
      permissionedAccount: subAccount,
      permissions: [NFTPermission.from({ assetAddress: nftAddress, capabilities: { transfer: true, mutate: false } })],
    });

    const perm1 = await aptos.getPermissions({
      primaryAccountAddress: primaryAccount.accountAddress,
      subAccountPublicKey: subAccount.publicKey,
      filter: NFTPermission,
    });
    expect(perm1.length).toBe(1);

    const txn1 = await signSubmitAndWait({
      sender: primaryAccount,
      signer: subAccount,
      data: {
        function: "0x1::object::transfer",
        typeArguments: ["0x4::token::Token"],
        functionArguments: [nftAddress, receiverAccounts[0].accountAddress],
      },
    });
    expect(txn1.submittedTransaction.success).toBe(true);
  });

  test("Able to view active permissions and remaining balances for APT", async () => {
    // Convert APT to FA
    await signSubmitAndWait({
      sender: primaryAccount,
      data: {
        function: "0x1::coin::migrate_to_fungible_store",
        functionArguments: [],
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
      },
    });

    const APT_PERMISSION = FungibleAssetPermission.from({
      asset: AccountAddress.A,
      amount: 10,
    });
    await requestPermission({
      primaryAccount,
      permissionedAccount: subAccount,
      permissions: [APT_PERMISSION],
    });

    const perm1 = await aptos.getPermissions({
      primaryAccountAddress: primaryAccount.accountAddress,
      subAccountPublicKey: subAccount.publicKey,
      filter: FungibleAssetPermission,
    });
    expect(perm1.length).toBe(1);
    expect(perm1[0].amount).toEqual(BigInt(10));

    const txn1 = await signSubmitAndWait({
      sender: primaryAccount,
      signer: subAccount,
      data: {
        function: "0x1::primary_fungible_store::transfer",
        functionArguments: [AccountAddress.A, receiverAccounts[0].accountAddress, 1],
        typeArguments: ["0x1::fungible_asset::Metadata"],
      },
    });
    expect(txn1.response.signature?.type).toBe("single_sender");
    expect(txn1.submittedTransaction.success).toBe(true);

    const perm2 = await aptos.getPermissions({
      primaryAccountAddress: primaryAccount.accountAddress,
      subAccountPublicKey: subAccount.publicKey,
      filter: FungibleAssetPermission,
    });
    expect(perm2.length).toBe(1);
    expect(perm2[0].amount).toEqual(BigInt(9));

    await revokePermission({
      permissions: [APT_PERMISSION],
      primaryAccount,
      subAccount,
    });

    const perm3 = await aptos.getPermissions({
      primaryAccountAddress: primaryAccount.accountAddress,
      subAccountPublicKey: subAccount.publicKey,
    });
    expect(perm3.length).toBe(0);
  });

  test("Revoking transactions", async () => {
    // Convert APT to FA
    await signSubmitAndWait({
      sender: primaryAccount,
      data: {
        function: "0x1::coin::migrate_to_fungible_store",
        functionArguments: [],
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
      },
    });

    await requestPermission({
      primaryAccount,
      permissionedAccount: subAccount,
      permissions: [FungibleAssetPermission.from({ asset: AccountAddress.A, amount: 10 })],
    });

    await revokePermission({
      primaryAccount,
      subAccount,
      permissions: [FungibleAssetPermission.from({ asset: AccountAddress.A, amount: 0 })],
    });

    const txn1 = await signSubmitAndWait({
      sender: primaryAccount,
      signer: subAccount,
      data: {
        function: "0x1::primary_fungible_store::transfer",
        functionArguments: [AccountAddress.A, receiverAccounts[0].accountAddress, 10],
        typeArguments: ["0x1::fungible_asset::Metadata"],
      },
    });
    expect(txn1.response.signature?.type).toBe("single_sender");
    expect(txn1.submittedTransaction.success).toBe(false);
  });

  test("Aaron's test case", async () => {
    await signSubmitAndWait({
      sender: primaryAccount,
      data: {
        function: "0x1::coin::migrate_to_fungible_store",
        functionArguments: [],
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
      },
    });

    await requestPermission({
      primaryAccount,
      permissionedAccount: subAccount,
      permissions: [FungibleAssetPermission.from({ asset: AccountAddress.A, amount: 10 })],
    });

    const txn1 = await signSubmitAndWait({
      sender: primaryAccount,
      signer: subAccount,
      data: {
        function: "0x1::primary_fungible_store::transfer",
        functionArguments: [AccountAddress.A, receiverAccounts[0].accountAddress, 10],
        typeArguments: ["0x1::fungible_asset::Metadata"],
      },
    });
    expect(txn1.response.signature?.type).toBe("single_sender");
    expect(txn1.submittedTransaction.success).toBe(true);

    // step 3: use AA to send APT FA again. should fail.
    const txn2 = await signSubmitAndWait({
      sender: primaryAccount,
      signer: subAccount,
      data: {
        function: "0x1::primary_fungible_store::transfer",
        functionArguments: [AccountAddress.A, receiverAccounts[0].accountAddress, 1],
        typeArguments: ["0x1::fungible_asset::Metadata"],
      },
    });
    expect(txn2.response.signature?.type).toBe("single_sender");
    expect(txn2.submittedTransaction.success).toBe(false);
  });

  test("Serializer", async () => {
    const test = GasPermission.from({ amount: 2 });
    console.log(typeof test.amount);

    const APT_PERMISSION = FungibleAssetPermission.from({
      asset: AccountAddress.A,
      amount: 10,
    });
    const GAS_PERMISSION = GasPermission.from({
      amount: 1,
    });
    const NFT_PERMISSION = NFTPermission.from({
      assetAddress: AccountAddress.A,
      capabilities: { transfer: true, mutate: false },
    });

    const serializer = new Serializer();
    APT_PERMISSION.serialize(serializer);
    GAS_PERMISSION.serialize(serializer);
    NFT_PERMISSION.serialize(serializer);
    const serialized = serializer.toUint8Array();

    const deserializer = new Deserializer(serialized);
    expect(FungibleAssetPermission.deserialize(deserializer)).toEqual(APT_PERMISSION);
    expect(GasPermission.deserialize(deserializer)).toEqual(GAS_PERMISSION);
    expect(NFTPermission.deserialize(deserializer)).toEqual(NFT_PERMISSION);
  });
});

export async function requestPermission({
  primaryAccount,
  permissionedAccount,
  permissions,
}: {
  primaryAccount: SingleKeyAccount;
  permissionedAccount: AbstractedEd25519Account;
  permissions: Permission[];
  expiration?: number;
  requestsPerSecond?: number;
}) {
  const transaction = await aptos.permissions.requestPermissions({
    primaryAccountAddress: primaryAccount.accountAddress,
    permissionedAccountPublicKey: permissionedAccount.publicKey,
    permissions,
  });

  const response = await aptos.signAndSubmitTransaction({
    signer: primaryAccount,
    transaction,
  });

  await aptos.waitForTransaction({
    transactionHash: response.hash,
  });

  return response;
}

export async function revokePermission({
  primaryAccount,
  subAccount,
  permissions,
}: {
  primaryAccount: SingleKeyAccount;
  subAccount: AbstractedEd25519Account;
  permissions: Permission[];
}) {
  const transaction = await aptos.permissions.revokePermission({
    primaryAccountAddress: primaryAccount.accountAddress,
    subAccountPublicKey: subAccount.publicKey,
    permissions,
  });

  const response = await aptos.signAndSubmitTransaction({
    signer: primaryAccount,
    transaction,
  });

  await aptos.waitForTransaction({
    transactionHash: response.hash,
    options: {
      checkSuccess: true,
    },
  });

  return response;
}

// ====================================================================
// Test Helper Functions
// ===================================================================
async function generateNFT({ account }: { account: Account }) {
  let pendingTxn: PendingTransactionResponse;

  const str = () => (Math.random() * 100000000).toString().slice(4, 16);

  const COLLECTION_NAME = str();

  pendingTxn = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction: await aptos.createCollectionTransaction({
      creator: account,
      description: str(),
      name: COLLECTION_NAME,
      uri: "https://aptos.dev",
    }),
  });
  await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });

  pendingTxn = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction: await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: "0x4::aptos_token::mint",
        functionArguments: [COLLECTION_NAME, "my token description", "my token", "https://aptos.dev/nft", [], [], []],
      },
    }),
  });
  await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });

  const txn: any = await aptos.transaction.getTransactionByHash({ transactionHash: pendingTxn.hash });

  return txn.events?.find((e: any) => e.type === "0x4::collection::Mint")?.data.token;
}

async function signSubmitAndWait({
  sender,
  signer,
  checkSuccess = false,
  data,
}: {
  sender: SingleKeyAccount;
  signer?: AbstractedEd25519Account | SingleKeyAccount;
  checkSuccess?: boolean;
  data: InputGenerateTransactionPayloadData;
}) {
  const transaction = await aptos.transaction.build.simple({
    sender: sender.accountAddress,
    data,
  });
  const response = await aptos.signAndSubmitTransaction({
    signer: signer || sender,
    transaction,
  });
  const submittedTransaction = await aptos.waitForTransaction({
    transactionHash: response.hash,
    options: {
      checkSuccess,
    },
  });

  return {
    transaction,
    response,
    submittedTransaction,
  };
}
