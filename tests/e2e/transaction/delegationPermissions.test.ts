// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-lone-blocks */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */


import { BatchArgument } from "@wgb5445/aptos-intent-npm";
import {
  Account,
  SigningSchemeInput,
  MoveString,
  Network,
  AccountAddress,
  Ed25519Account,
  SingleKeyAccount,
  PendingTransactionResponse,
  InputGenerateTransactionPayloadData,
} from "../../../src";
import { longTestTimeout } from "../../unit/helper";
import { getAptosClient } from "../helper";
import { fundAccounts, publishTransferPackage } from "./helper";
import { AbstractedEd25519Account } from "../../../src/account/AbstractedAccount";

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
    await requestPermission({
      primaryAccount,
      permissionedAccount: subAccount,
      permissions: [{ type: "APT", limit: 10 }],
    });

    const perm1 = await getPermissions({ primaryAccount, subAccount });
    expect(perm1.length).toBe(1);
    expect(perm1[0].remaining).toBe("10");

    await requestPermission({
      primaryAccount,
      permissionedAccount: subAccount,
      permissions: [{ type: "APT", limit: 20 }],
    });

    const perm2 = await getPermissions({ primaryAccount, subAccount });
    expect(perm2.length).toBe(1);
    expect(perm2[0].remaining).toBe("30");
  });

  test("Able to grant permissions for NFTs", async () => {
    const nftAddress = await generateNFT({ account: primaryAccount });
    // TODO: Add this back in when Runtian is done with his refactor
    // const nftAddress2 = await generateNFT({ account: primaryAccount });

    await requestPermission({
      primaryAccount,
      permissionedAccount: subAccount,
      permissions: [
        { type: "NFT", address: nftAddress },
        // { type: "NFT", address: nftAddress2 },
      ],
    });

    const perm1 = await getPermissions({ primaryAccount, subAccount });
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

    await requestPermission({
      primaryAccount,
      permissionedAccount: subAccount,
      permissions: [{ type: "APT", limit: 10 }],
    });

    const perm1 = await getPermissions({ primaryAccount, subAccount });
    expect(perm1.length).toBe(1);
    expect(perm1[0].remaining).toBe("10");

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

    const perm2 = await getPermissions({ primaryAccount, subAccount });
    expect(perm2.length).toBe(1);
    expect(perm2[0].remaining).toBe("9");

    await revokePermission({
      permissions: [{ type: "APT" }],
      primaryAccount,
      subAccount,
    });

    const perm3 = await getPermissions({ primaryAccount, subAccount });
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
      permissions: [{ type: "APT", limit: 10 }],
    });

    await revokePermission({ primaryAccount, subAccount, permissions: [{ type: "APT" }] });

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
      permissions: [{ type: "APT", limit: 10 }],
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
});

// ====================================================================
// External API
// ===================================================================

type GrantPermission =
  | { type: "APT"; limit: number; duration?: number }
  | { type: "GAS"; limit: number }
  | { type: "NFT"; address: string }
  | { type: "NFTC"; address: string };

// TODO: Refactor this for clarity. It is unclear what paths are executed for repeat requests vs new requests
export async function requestPermission({
  primaryAccount,
  permissionedAccount,
  permissions,
}: {
  primaryAccount: SingleKeyAccount;
  permissionedAccount: AbstractedEd25519Account;
  permissions: GrantPermission[];
  expiration?: number;
  requestsPerSecond?: number;
}) {
  const existingHandleAddress = await getHandleAddress({ primaryAccount, subAccount: permissionedAccount });
  let handleAddress: BatchArgument | string | null = existingHandleAddress;
  let permissionedSingerHandle: BatchArgument[] | null;
  let permissionedSigner: BatchArgument[] | null;

  const transaction = await aptos.transaction.build.batched_intents({
    sender: primaryAccount.accountAddress,
    builder: async (builder) => {
      // Create a handle if one doesn't already exist
      if (!existingHandleAddress) {
        permissionedSingerHandle = await builder.add_batched_calls({
          function: "0x1::permissioned_signer::create_storable_permissioned_handle",
          functionArguments: [BatchArgument.new_signer(0), 360],
          typeArguments: [],
        });
        handleAddress = permissionedSingerHandle[0].borrow();

        permissionedSigner = await builder.add_batched_calls({
          function: "0x1::permissioned_signer::signer_from_storable_permissioned",
          functionArguments: [handleAddress],
          typeArguments: [],
        });
      } else {
        permissionedSigner = await builder.add_batched_calls({
          function: "0x1::permissioned_delegation::permissioned_signer_by_key",
          functionArguments: [BatchArgument.new_signer(0), permissionedAccount.publicKey.toUint8Array()],
          typeArguments: [],
        });
      }

      for (const permission of permissions) {
        switch (permission.type) {
          case "APT": {
            await builder.add_batched_calls({
              function: "0x1::fungible_asset::grant_permission",
              functionArguments: [
                BatchArgument.new_signer(0),
                permissionedSigner[0].borrow(),
                AccountAddress.A,
                permission.limit,
              ],
              typeArguments: [],
            });
            break;
          }
          case "NFT": {
            await builder.add_batched_calls({
              function: "0x1::object::grant_permission",
              // TODO: Need to figure out if this is token id or something else
              functionArguments: [BatchArgument.new_signer(0), permissionedSigner[0].borrow(), permission.address],
              // TODO: Need to figure out the type argument here
              typeArguments: ["0x4::token::Token"],
            });
            break;
          }

          default: {
            console.log("Not implemented");
            break;
          }
        }
      }

      // If we needed to create a brand new handle, then we need to attach it to finalize it
      if (permissionedSingerHandle) {
        await builder.add_batched_calls({
          function: "0x1::permissioned_delegation::add_permissioned_handle",
          functionArguments: [
            BatchArgument.new_signer(0),
            permissionedAccount.publicKey.toUint8Array(),
            permissionedSingerHandle[0],
          ],
          typeArguments: [],
        });
        await builder.add_batched_calls({
          function: "0x1::lite_account::add_dispatchable_authentication_function",
          functionArguments: [
            BatchArgument.new_signer(0),
            AccountAddress.ONE,
            new MoveString("permissioned_delegation"),
            new MoveString("authenticate"),
          ],
          typeArguments: [],
        });
      }
      return builder;
    },
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

type RevokePermission = { type: "APT" } | { type: "NFT" };

export async function revokePermission({
  primaryAccount,
  subAccount,
  permissions,
}: {
  primaryAccount: SingleKeyAccount;
  subAccount: AbstractedEd25519Account;
  permissions: RevokePermission[];
}) {
  const transaction = await aptos.transaction.build.batched_intents({
    sender: primaryAccount.accountAddress,
    builder: async (builder) => {
      const signer = await builder.add_batched_calls({
        function: "0x1::permissioned_delegation::permissioned_signer_by_key",
        functionArguments: [BatchArgument.new_signer(0), subAccount.publicKey.toUint8Array()],
        typeArguments: [],
      });

      for (const permission of permissions) {
        switch (permission.type) {
          case "APT": {
            await builder.add_batched_calls({
              function: "0x1::fungible_asset::revoke_permission",
              functionArguments: [signer[0].borrow(), AccountAddress.A],
              typeArguments: [],
            });
            break;
          }

          default: {
            console.log("Not implemented");
            break;
          }
        }
      }

      return builder;
    },
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

interface Permission {
  asset: string;
  type: string;
  remaining: string;
}

export async function getPermissions({
  primaryAccount,
  subAccount,
}: {
  primaryAccount: SingleKeyAccount;
  subAccount: AbstractedEd25519Account;
}): Promise<Permission[]> {
  const handle = await getHandleAddress({ primaryAccount, subAccount });

  const res = await fetch(`http://127.0.0.1:8080/v1/accounts/${handle}/resources`);

  type NodeDataResponse = Array<{
    type: string;
    data: {
      perms: {
        data: Array<{
          key: { data: string; type_name: string };
          value: string;
        }>;
      };
    };
  }>;

  const data = (await res.json()) as NodeDataResponse;

  return data[0].data.perms.data.map((d) => ({
    asset: d.key.data,
    type: d.key.type_name,
    remaining: d.value,
  }));
}

// ====================================================================
// Internal API Helper Functions
// ===================================================================
async function getHandleAddress({
  primaryAccount,
  subAccount,
}: {
  primaryAccount: SingleKeyAccount;
  subAccount: AbstractedEd25519Account;
}) {
  try {
    const [handle] = await aptos.view<string[]>({
      payload: {
        function: "0x1::permissioned_delegation::handle_address_by_key",
        functionArguments: [primaryAccount.accountAddress, subAccount.publicKey.toUint8Array()],
      },
    });

    return handle;
  } catch {
    return null;
  }
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
