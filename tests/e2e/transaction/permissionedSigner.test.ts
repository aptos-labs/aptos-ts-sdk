// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AccountAddress,
  Ed25519Account,
  PendingTransactionResponse,
  InputGenerateTransactionPayloadData,
  Serializer,
  Deserializer,
  AbstractedAccount,
  SimpleTransaction,
} from "../../../src";
import { longTestTimeout } from "../../unit/helper";
import { getAptosClient } from "../helper";
import { fundAccounts } from "./helper";
import {
  FungibleAssetPermission,
  GasPermission,
  NFTPermission,
  Permission,
  NFTPermissionCapability,
} from "../../../src/types/permissions";

const { aptos } = getAptosClient();

describe("transaction submission", () => {
  let primaryAccount: Ed25519Account;
  let permissionedAccount1: Ed25519Account;
  let permissionedAccount2: Ed25519Account;
  let abstractAccount: AbstractedAccount;
  let receiverAccounts: Ed25519Account[];

  beforeEach(async () => {
    primaryAccount = Account.generate();
    permissionedAccount1 = Ed25519Account.generate();
    permissionedAccount2 = Ed25519Account.generate();
    abstractAccount = AbstractedAccount.fromPermissionedSigner({ signer: permissionedAccount1 });
    receiverAccounts = [Account.generate(), Account.generate()];
    await fundAccounts(aptos, [primaryAccount, ...receiverAccounts]);
  }, longTestTimeout);

  test("Able to grant permissions to multiple sub accounts with the same primary account", async () => {
    const APT_PERMISSION = FungibleAssetPermission.from({
      asset: AccountAddress.A, // apt address
      amount: 10,
    });

    try {
      await signSubmitAndWait({
        sender: primaryAccount,
        transaction: await aptos.permissions.requestPermissions({
          primaryAccountAddress: primaryAccount.accountAddress,
          delegationPublicKey: permissionedAccount1.publicKey,
          permissions: [APT_PERMISSION],
        }),
      });

      const perm1 = await aptos.getPermissions({
        primaryAccountAddress: primaryAccount.accountAddress,
        delegationPublicKey: permissionedAccount1.publicKey,
        filter: FungibleAssetPermission,
      });
      expect(perm1.length).toBe(1);
    } catch (e) {
      console.log("Error: ", e);
      expect(false).toBeTruthy();
    }

    try {
      await signSubmitAndWait({
        sender: primaryAccount,
        transaction: await aptos.permissions.requestPermissions({
          primaryAccountAddress: primaryAccount.accountAddress,
          delegationPublicKey: permissionedAccount2.publicKey,
          permissions: [APT_PERMISSION],
        }),
      });

      const perm2 = await aptos.getPermissions({
        primaryAccountAddress: primaryAccount.accountAddress,
        delegationPublicKey: permissionedAccount2.publicKey,
        filter: FungibleAssetPermission,
      });
      expect(perm2.length).toBe(1);
    } catch (e) {
      console.log("Error: ", e);
      expect(false).toBeTruthy();
    }
  });

  test("Able to re-grant permissions for the same subaccount", async () => {
    // account
    const APT_PERMISSION = FungibleAssetPermission.from({
      asset: AccountAddress.A, // apt address
      amount: 10,
    });
    await signSubmitAndWait({
      sender: primaryAccount,
      transaction: await aptos.permissions.requestPermissions({
        primaryAccountAddress: primaryAccount.accountAddress,
        delegationPublicKey: permissionedAccount1.publicKey,
        permissions: [APT_PERMISSION],
      }),
    });

    const perm1 = await aptos.getPermissions({
      primaryAccountAddress: primaryAccount.accountAddress,
      delegationPublicKey: permissionedAccount1.publicKey,
      filter: FungibleAssetPermission,
    });
    expect(perm1.length).toBe(1);
    expect(perm1[0].amount).toEqual(BigInt(10));

    const APT_PERMISSION2 = FungibleAssetPermission.from({
      asset: AccountAddress.A,
      amount: 20,
    });
    await signSubmitAndWait({
      sender: primaryAccount,
      transaction: await aptos.permissions.requestPermissions({
        primaryAccountAddress: primaryAccount.accountAddress,
        delegationPublicKey: permissionedAccount1.publicKey,
        permissions: [APT_PERMISSION2],
      }),
    });

    const perm2 = await aptos.getPermissions({
      primaryAccountAddress: primaryAccount.accountAddress,
      delegationPublicKey: permissionedAccount1.publicKey,
      filter: FungibleAssetPermission,
    });
    expect(perm2.length).toBe(1);
    expect(perm2[0].amount).toEqual(BigInt(30));
  });

  test("Able to grant permissions for NFTs", async () => {
    const nftAddress = await generateNFT({ account: primaryAccount });
    // TODO: Add this back in when Runtian is done with his refactor
    // const nftAddress2 = await generateNFT({ account: primaryAccount });

    await signSubmitAndWait({
      sender: primaryAccount,
      transaction: await aptos.permissions.requestPermissions({
        primaryAccountAddress: primaryAccount.accountAddress,
        delegationPublicKey: permissionedAccount1.publicKey,
        permissions: [
          NFTPermission.from({
            assetAddress: nftAddress,
            capabilities: {
              [NFTPermissionCapability.transfer]: true,
              [NFTPermissionCapability.mutate]: false,
            },
          }),
        ],
      }),
    });

    const perm1 = await aptos.getPermissions({
      primaryAccountAddress: primaryAccount.accountAddress,
      delegationPublicKey: permissionedAccount1.publicKey,
      filter: NFTPermission,
    });
    expect(perm1.length).toBe(1);

    const txn1 = await signSubmitAndWait({
      sender: primaryAccount,
      signer: abstractAccount,
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
    await signSubmitAndWait({
      sender: primaryAccount,
      transaction: await aptos.permissions.requestPermissions({
        primaryAccountAddress: primaryAccount.accountAddress,
        delegationPublicKey: permissionedAccount1.publicKey,
        permissions: [APT_PERMISSION],
      }),
    });

    const perm1 = await aptos.getPermissions({
      primaryAccountAddress: primaryAccount.accountAddress,
      delegationPublicKey: permissionedAccount1.publicKey,
      filter: FungibleAssetPermission,
    });
    expect(perm1.length).toBe(1);
    expect(perm1[0].amount).toEqual(BigInt(10));

    const txn1 = await signSubmitAndWait({
      sender: primaryAccount,
      signer: abstractAccount,
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
      delegationPublicKey: permissionedAccount1.publicKey,
      filter: FungibleAssetPermission,
    });
    expect(perm2.length).toBe(1);
    expect(perm2[0].amount).toEqual(BigInt(9));

    await signSubmitAndWait({
      sender: primaryAccount,
      transaction: await aptos.permissions.revokePermission({
        primaryAccountAddress: primaryAccount.accountAddress,
        delegationPublicKey: permissionedAccount1.publicKey,
        permissions: [APT_PERMISSION],
      }),
    });

    const perm3 = await aptos.getPermissions({
      primaryAccountAddress: primaryAccount.accountAddress,
      delegationPublicKey: permissionedAccount1.publicKey,
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

    await signSubmitAndWait({
      sender: primaryAccount,
      transaction: await aptos.permissions.requestPermissions({
        primaryAccountAddress: primaryAccount.accountAddress,
        delegationPublicKey: permissionedAccount1.publicKey,
        permissions: [FungibleAssetPermission.from({ asset: AccountAddress.A, amount: 10 })],
      }),
    });

    await signSubmitAndWait({
      sender: primaryAccount,
      transaction: await aptos.permissions.revokePermission({
        primaryAccountAddress: primaryAccount.accountAddress,
        delegationPublicKey: permissionedAccount1.publicKey,
        permissions: [FungibleAssetPermission.revoke({ asset: AccountAddress.A })],
      }),
    });

    const txn1 = await signSubmitAndWait({
      sender: primaryAccount,
      signer: abstractAccount,
      data: {
        function: "0x1::primary_fungible_store::transfer",
        functionArguments: [AccountAddress.A, receiverAccounts[0].accountAddress, 10],
        typeArguments: ["0x1::fungible_asset::Metadata"],
      },
    });
    expect(txn1.response.signature?.type).toBe("single_sender");
    expect(txn1.submittedTransaction.success).toBe(false);
  });

  test.only("Basic test case", async () => {
    await signSubmitAndWait({
      sender: primaryAccount,
      data: {
        function: "0x1::coin::migrate_to_fungible_store",
        functionArguments: [],
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
      },
    });
    await signSubmitAndWait({
      sender: primaryAccount,
      transaction: await aptos.permissions.requestPermissions({
        primaryAccountAddress: primaryAccount.accountAddress,
        delegationPublicKey: permissionedAccount1.publicKey,
        permissions: [FungibleAssetPermission.from({ asset: AccountAddress.A, amount: 10 })],
      }),
    });
    const txn1 = await signSubmitAndWait({
      sender: primaryAccount,
      signer: abstractAccount,
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
      signer: abstractAccount,
      data: {
        function: "0x1::primary_fungible_store::transfer",
        functionArguments: [AccountAddress.A, receiverAccounts[0].accountAddress, 1],
        typeArguments: ["0x1::fungible_asset::Metadata"],
      },
    });
    expect(txn2.response.signature?.type).toBe("single_sender");
    expect(txn2.submittedTransaction.success).toBe(false);
  });

  describe("Serializer", () => {
    const APT_PERMISSION = FungibleAssetPermission.from({
      asset: AccountAddress.A,
      amount: 10,
    });
    const GAS_PERMISSION = GasPermission.from({
      amount: 1,
    });
    const NFT_PERMISSION = NFTPermission.from({
      assetAddress: AccountAddress.A,
      capabilities: {
        [NFTPermissionCapability.transfer]: true,
        [NFTPermissionCapability.mutate]: false,
      },
    });

    test("Serialize permissions individually", () => {
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

    test("Serialize permissions as an array", () => {
      const permissions: Permission[] = [APT_PERMISSION, GAS_PERMISSION, NFT_PERMISSION];
      const serializer = new Serializer();
      serializer.serializeVector(permissions);
      const serialized = serializer.toUint8Array();
      const deserializer = new Deserializer(serialized);
      expect(deserializer.deserializeVector(Permission)).toEqual(permissions);
    });
  });
});

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
  transaction: userTransaction,
}: {
  sender: Ed25519Account;
  signer?: AbstractedAccount | Ed25519Account;
  checkSuccess?: boolean;
  data?: InputGenerateTransactionPayloadData;
  transaction?: SimpleTransaction;
}) {
  const transaction =
    userTransaction ??
    (await aptos.transaction.build.simple({
      sender: sender.accountAddress,
      data: data as InputGenerateTransactionPayloadData,
    }));

  if (!transaction) {
    throw new Error("Transaction is undefined");
  }

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
