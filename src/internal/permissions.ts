// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/name}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * name namespace and without having a dependency cycle error.
 */

import { BatchArgument } from "@wgb5445/aptos-intent-npm";
import { AptosConfig } from "../api/aptosConfig";
import { AccountAddress, Ed25519PublicKey } from "../core";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";
import { MoveString } from "../bcs";
import { AptosIntentBuilder } from "../transactions";
import { MoveVMPermissionType, Permission, FungibleAssetPermission, NFTPermission } from "../types/permissions";
import { Transaction } from "../api/transaction";
import { view } from "./view";

// functions
export async function getPermissions<T extends Permission>({
  aptosConfig,
  primaryAccountAddress,
  subAccountPublicKey,
  filter,
}: {
  aptosConfig: AptosConfig;
  primaryAccountAddress: AccountAddress;
  subAccountPublicKey: Ed25519PublicKey;
  filter?: new (...a: any) => T;
}): Promise<T[]> {
  const handle = await getHandleAddress({ aptosConfig, primaryAccountAddress, subAccountPublicKey });

  const res = await fetch(`${aptosConfig.fullnode}/accounts/${handle}/resources`);

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

  const permissions = data[0].data.perms.data.map((d) => {
    switch (d.key.type_name) {
      case MoveVMPermissionType.FungibleAsset: // can this be better? i dont rly like this
        return FungibleAssetPermission.from({
          asset: AccountAddress.fromString(d.key.data),
          amount: Number(d.value),
        });
      case MoveVMPermissionType.TransferPermission:
        return NFTPermission.from({
          assetAddress: AccountAddress.fromString(d.key.data),
          capabilities: { transfer: true, mutate: false },
        });
      default:
        // todo throw here
        throw new Error();
    }
  });

  const filtered = filter ? permissions.filter((p) => p instanceof filter) : permissions;
  return filtered as T[];
}

// should it return the requested permissions? on success? and when it fails it
export async function requestPermission(args: {
  aptosConfig: AptosConfig;
  primaryAccountAddress: AccountAddress;
  permissionedAccountPublicKey: Ed25519PublicKey;
  permissions: Permission[];
  expiration?: number;
  requestsPerSecond?: number;
}): Promise<SimpleTransaction> {
  const { aptosConfig, primaryAccountAddress, permissionedAccountPublicKey, permissions } = args;
  const transaction = new Transaction(aptosConfig);

  // Get or create a handle for the permissioned account
  const existingHandleAddress = await getHandleAddress({
    aptosConfig,
    primaryAccountAddress,
    subAccountPublicKey: permissionedAccountPublicKey,
  });

  return transaction.build.batched_intents({
    sender: primaryAccountAddress,
    builder: async (builder) => {
      // Get the permissioned signer - either create new one or use existing
      const permissionedSigner = await getPermissionedSigner(builder, {
        existingHandleAddress,
        permissionedAccountPublicKey,
      });

      // if nft permission has multiple capabilities, we need to add multiple txns
      // For NFT permissions with multiple capabilities, split into separate transactions
      const expandedPermissions = permissions.flatMap((permission) => {
        if (permission instanceof NFTPermission && permission.capabilities) {
          const expanded: Permission[] = [];
          if (permission.capabilities.transfer) {
            expanded.push(
              NFTPermission.from({
                assetAddress: permission.assetAddress,
                capabilities: { transfer: true, mutate: false },
              }),
            );
          }
          if (permission.capabilities.mutate) {
            expanded.push(
              NFTPermission.from({
                assetAddress: permission.assetAddress,
                capabilities: { transfer: false, mutate: true },
              }),
            );
          }
          return expanded;
        }
        return permission;
      });
      // Grant each requested permission
      await Promise.all(
        expandedPermissions
          .map((permission) =>
            grantPermission(builder, {
              permissionedSigner: permissionedSigner.signer,
              permission,
            }),
          )
          .flat(),
      );

      // If we created a new handle, finalize the setup
      if (permissionedSigner.isNewHandle) {
        await finalizeNewHandle(builder, {
          permissionedAccountPublicKey,
          handle: permissionedSigner.handle!,
        });
      }

      return builder;
    },
  });
}

export async function revokePermissions(args: {
  aptosConfig: AptosConfig;
  primaryAccountAddress: AccountAddress;
  subAccountPublicKey: Ed25519PublicKey;
  permissions: Permission[];
}): Promise<SimpleTransaction> {
  const { aptosConfig, primaryAccountAddress, subAccountPublicKey, permissions } = args;

  const transaction = new Transaction(aptosConfig);
  return transaction.build.batched_intents({
    sender: primaryAccountAddress,
    builder: async (builder) => {
      const signer = await builder.add_batched_calls({
        function: "0x1::permissioned_delegation::permissioned_signer_by_key",
        functionArguments: [BatchArgument.new_signer(0), subAccountPublicKey.toUint8Array()],
        typeArguments: [],
      });

      const permissionPromises = permissions.map((permission) => {
        if (permission instanceof FungibleAssetPermission) {
          return builder.add_batched_calls({
            function: "0x1::fungible_asset::revoke_permission",
            functionArguments: [signer[0].borrow(), permission.asset],
            typeArguments: [],
          });
        }
        // TODO: object nft revoke
        if (permission instanceof NFTPermission) {
          return builder.add_batched_calls({
            function: "0x1::object::revoke_permission",
            functionArguments: [signer[0].borrow(), permission.assetAddress],
            typeArguments: ["0x4::token::Token"],
          });
        }

        console.log("Not implemented");
        return Promise.resolve();
      });

      await Promise.all(permissionPromises);
      return builder;
    },
  });
}

//  helper functions
async function getPermissionedSigner(
  builder: AptosIntentBuilder,
  args: {
    existingHandleAddress: string | null;
    permissionedAccountPublicKey: Ed25519PublicKey;
  },
) {
  if (args.existingHandleAddress) {
    const signer = await builder.add_batched_calls({
      function: "0x1::permissioned_delegation::permissioned_signer_by_key",
      functionArguments: [BatchArgument.new_signer(0), args.permissionedAccountPublicKey.toUint8Array()],
      typeArguments: [],
    });
    return { signer, isNewHandle: false };
  }

  // Create new handle and signer
  const handle = await builder.add_batched_calls({
    function: "0x1::permissioned_signer::create_storable_permissioned_handle",
    functionArguments: [BatchArgument.new_signer(0), 360],
    typeArguments: [],
  });

  const signer = await builder.add_batched_calls({
    function: "0x1::permissioned_signer::signer_from_storable_permissioned",
    functionArguments: [handle[0].borrow()],
    typeArguments: [],
  });

  return { signer, handle, isNewHandle: true };
}

async function grantPermission(
  builder: AptosIntentBuilder,
  args: {
    permissionedSigner: BatchArgument[];
    permission: Permission;
  },
) {
  if (args.permission instanceof FungibleAssetPermission) {
    return builder.add_batched_calls({
      function: "0x1::fungible_asset::grant_permission",
      functionArguments: [
        BatchArgument.new_signer(0),
        args.permissionedSigner[0].borrow(),
        args.permission.asset,
        args.permission.amount,
      ],
      typeArguments: [],
    });
  }
  if (args.permission instanceof NFTPermission) {
    const txn: Promise<BatchArgument[]>[] = [];
    if (args.permission.capabilities.transfer) {
      return builder.add_batched_calls({
        function: "0x1::object::grant_permission",
        functionArguments: [
          BatchArgument.new_signer(0),
          args.permissionedSigner[0].borrow(),
          args.permission.assetAddress,
        ],
        typeArguments: ["0x4::token::Token"],
      });
    }
    if (args.permission.capabilities.mutate) {
      console.log("mutate not implemented");
      throw new Error("mutate not implemented");
    }
    return txn;
  }

  console.log("Not implemented");
  throw new Error(`${args.permission} not implemented`);
  return Promise.resolve();
}

async function finalizeNewHandle(
  builder: AptosIntentBuilder,
  args: {
    permissionedAccountPublicKey: Ed25519PublicKey;
    handle: BatchArgument[];
  },
) {
  await builder.add_batched_calls({
    function: "0x1::permissioned_delegation::add_permissioned_handle",
    functionArguments: [BatchArgument.new_signer(0), args.permissionedAccountPublicKey.toUint8Array(), args.handle[0]],
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

export async function getHandleAddress({
  aptosConfig,
  primaryAccountAddress,
  subAccountPublicKey,
}: {
  aptosConfig: AptosConfig;
  primaryAccountAddress: AccountAddress;
  subAccountPublicKey: Ed25519PublicKey;
}) {
  try {
    const [handle] = await view<string[]>({
      aptosConfig,
      payload: {
        function: "0x1::permissioned_delegation::handle_address_by_key",
        functionArguments: [primaryAccountAddress, subAccountPublicKey.toUint8Array()],
      },
    });

    return handle;
  } catch {
    return null;
  }
}
