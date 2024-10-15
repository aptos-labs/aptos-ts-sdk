// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-lone-blocks */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

// 1. remove batched calls
// 2. make mini functions to do the individual calls
// 3. test revoking permissions

import { BatchArgument } from "@wgb5445/aptos-intent-npm";
import {
  Account,
  SigningSchemeInput,
  MoveString,
  Network,
  AccountAddress,
  Ed25519Account,
  SingleKeyAccount,
  SimpleTransaction,
  PendingTransactionResponse,
  InputGenerateTransactionPayloadData,
} from "../../../src";
import { longTestTimeout } from "../../unit/helper";
import { getAptosClient } from "../helper";
import { fundAccounts, publishTransferPackage } from "./helper";
import { AbstractedEd25519Account } from "../../../src/account/AbstractedAccount";

const LOCAL_NET = getAptosClient();
const { aptos } = getAptosClient({
  network: Network.CUSTOM,
  fullnode: "http://127.0.0.1:8080/v1",
  faucet: "http://127.0.0.1:8081",
  indexer: "http://127.0.0.1:8090",
});

describe("transaction submission", () => {
  let contractPublisherAccount: Ed25519Account;
  let primaryAccount: SingleKeyAccount;
  let subAccount: AbstractedEd25519Account;
  let receiverAccounts: Ed25519Account[];

  let transaction: SimpleTransaction;
  let response: PendingTransactionResponse;

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

  test(
    "New Test Case",
    async () => {
      console.log("Primary Account:", primaryAccount.accountAddress.toString());
      console.log("Secondary Account:", subAccount.accountAddress.toString());

      // Convert APT to FA
      await transact({
        sender: primaryAccount,
        data: {
          function: "0x1::coin::migrate_to_fungible_store",
          functionArguments: [],
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
        },
      });

      await grantPermission({
        primaryAccount,
        subAccount,
        permissions: [{ type: "APT", limit: 10 }],
      });

      const revokeTxn = await revokePermission({ primaryAccount, subAccount });
      console.log("Revoked Transaction: ", revokeTxn.hash);

      // step 2: use AA to send APT FA.
      const txn1 = await transact({
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
      console.log("Transfer transaction: ", txn1.submittedTransaction.hash);

      // step 3: use AA to send APT FA again. should fail.
      // const txn2 = await transact({
      //   sender: primaryAccount,
      //   signer: subAccount,
      //   data: {
      //     function: "0x1::primary_fungible_store::transfer",
      //     functionArguments: [AccountAddress.A, receiverAccounts[0].accountAddress, 1],
      //     typeArguments: ["0x1::fungible_asset::Metadata"],
      //   },
      // });
      // expect(txn2.response.signature?.type).toBe("single_sender");
      // expect(txn2.submittedTransaction.success).toBe(false);
    },
    longTestTimeout,
  );

  xtest("Aaron's test case", async () => {
    // step 1: setup.
    transaction = await aptos.transaction.build.batched_intents({
      sender: primaryAccount.accountAddress,
      builder: async (builder) => {
        // convert apt to fa
        await builder.add_batched_calls({
          function: "0x1::coin::migrate_to_fungible_store",
          functionArguments: [BatchArgument.new_signer(0)],
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
        });
        // Creates the handle
        const permissionedSignerhandle = await builder.add_batched_calls({
          function: "0x1::permissioned_signer::create_permissioned_handle",
          functionArguments: [BatchArgument.new_signer(0)],
          typeArguments: [],
        });
        // Creates the signer for the delegated account from the handle
        const permissionedSigner = await builder.add_batched_calls({
          function: "0x1::permissioned_signer::signer_from_permissioned",
          functionArguments: [permissionedSignerhandle[0].borrow()],
          typeArguments: [],
        });
        // Start granting permissions to the handle
        await builder.add_batched_calls({
          function: "0x1::fungible_asset::grant_permission",
          functionArguments: [
            BatchArgument.new_signer(0),
            permissionedSigner[0].borrow(),
            AccountAddress.A,
            10 /* limit */,
          ],
          typeArguments: [],
        });
        // Associating the granted handle to the delegation rule
        await builder.add_batched_calls({
          function: "0x1::permissioned_delegation::add_permissioned_handle",
          functionArguments: [
            BatchArgument.new_signer(0),
            subAccount.publicKey.toUint8Array(),
            permissionedSignerhandle[0],
          ],
          typeArguments: [],
        });
        // Activate the delegation account for the main account
        // Delegating our authentication
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
        return builder;
      },
    });
    response = await aptos.signAndSubmitTransaction({
      signer: primaryAccount,
      transaction,
    });

    await aptos.waitForTransaction({
      transactionHash: response.hash,
    });
    expect(response.signature?.type).toBe("single_sender");

    // step 2: use AA to send APT FA.
    transaction = await aptos.transaction.build.simple({
      sender: primaryAccount.accountAddress,
      data: {
        function: "0x1::primary_fungible_store::transfer",
        functionArguments: [AccountAddress.A, receiverAccounts[0].accountAddress, 10],
        typeArguments: ["0x1::fungible_asset::Metadata"],
      },
    });
    response = await aptos.signAndSubmitTransaction({
      signer: subAccount,
      transaction,
    });
    expect(response.signature?.type).toBe("single_sender");

    let submittedTransaction = await aptos.waitForTransaction({
      transactionHash: response.hash,
    });
    expect(submittedTransaction.success).toBe(true);

    // step 3: use AA to send APT FA again. should fail.
    transaction = await aptos.transaction.build.simple({
      sender: primaryAccount.accountAddress,
      data: {
        function: "0x1::primary_fungible_store::transfer",
        functionArguments: [AccountAddress.A, receiverAccounts[0].accountAddress, 1],
        typeArguments: ["0x1::fungible_asset::Metadata"],
      },
    });
    response = await aptos.signAndSubmitTransaction({
      signer: subAccount,
      transaction,
    });
    expect(response.signature?.type).toBe("single_sender");
    submittedTransaction = await aptos.waitForTransaction({
      transactionHash: response.hash,
      options: {
        checkSuccess: false,
      },
    });
    expect(submittedTransaction.success).toBe(false);
  });
});

export async function transact({
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

interface APTPermissions {
  type: "APT";
  limit: number;
  durration?: number;
}

interface NFPermissions {
  type: "NFT";
}

type Permissions = APTPermissions | NFPermissions;

export async function grantPermission({
  primaryAccount,
  subAccount,
  permissions,
}: {
  primaryAccount: SingleKeyAccount;
  subAccount: AbstractedEd25519Account;
  permissions: Permissions[];
}) {
  const transaction = await aptos.transaction.build.batched_intents({
    sender: primaryAccount.accountAddress,
    builder: async (builder) => {
      // set up aa with permissioned signer
      const permissionedSignerHandle = await builder.add_batched_calls({
        function: "0x1::permissioned_signer::create_permissioned_handle",
        functionArguments: [BatchArgument.new_signer(0)],
        typeArguments: [],
      });
      const permissionedSigner = await builder.add_batched_calls({
        function: "0x1::permissioned_signer::signer_from_permissioned",
        functionArguments: [permissionedSignerHandle[0].borrow()],
        typeArguments: [],
      });

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

          default: {
            console.log("Not implemented");
            break;
          }
        }
      }

      await builder.add_batched_calls({
        function: "0x1::permissioned_delegation::add_permissioned_handle",
        functionArguments: [
          BatchArgument.new_signer(0),
          subAccount.publicKey.toUint8Array(),
          permissionedSignerHandle[0],
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

export async function revokePermission({
  primaryAccount,
  subAccount,
}: {
  primaryAccount: SingleKeyAccount;
  subAccount: AbstractedEd25519Account;
  // Accept other permissions
}) {
  const transaction = await aptos.transaction.build.batched_intents({
    sender: primaryAccount.accountAddress,
    builder: async (builder) => {
      const val = await builder.add_batched_calls({
        function: "0x1::permissioned_delegation::remove_permissioned_handle",
        functionArguments: [BatchArgument.new_signer(0), subAccount.publicKey.toUint8Array()],
        typeArguments: [],
      });
      const signer = await builder.add_batched_calls({
        function: "0x1::permissioned_signer::signer_from_permissioned",
        functionArguments: [val[0].borrow()],
        typeArguments: [],
      });
      // INSERT other revokes here
      await builder.add_batched_calls({
        function: "0x1::fungible_asset::revoke_permission",
        functionArguments: [signer[0].borrow(), AccountAddress.A],
        typeArguments: [],
      });
      await builder.add_batched_calls({
        function: "0x1::permissioned_delegation::add_permissioned_handle",
        functionArguments: [BatchArgument.new_signer(0), subAccount.publicKey.toUint8Array(), val[0]],
        typeArguments: [],
      });
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
