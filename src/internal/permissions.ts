// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/name}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * name namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { AbstractedEd25519Account, Account, SingleKeyAccount } from "../account";
import { AccountAddress, AccountAddressInput } from "../core";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";
import { Aptos } from "../api";
import { BatchArgument } from "@wgb5445/aptos-intent-npm";
import { MoveString } from "../bcs";

// types

export type Permission = FungibleAssetPermission | GasPermission | NFTPermission | NFTCollectionPermission | GenericPermission;

//  holds permissions
export interface PermissionHandle {
  // Question: Best way to approach time or date here. Date object, Epoch time string, time in milliseconds
  // The contract will have this as an epoch time in seconds as a number
  expiration: number;
  // Question: Should this be a field at all? Should dapps be able to raise their own rate limit?
  // Question: Should this be a number (1, 10, 100, etc) or a string (low, medium, high)?
  transactionsPerSecond: number;
  permissions: Permission[];
}

// Actions that can be granted on NFTs
export enum NFTCapability {
  transfer = "transfer",
  mutate = "mutate",
}

export enum PermissionType {
  FungibleAsset = "FungibleAsset",
  Gas = "Gas",
  NFT = "NFT",
  NFTCollection = "Collection",
}

export enum MoveVMPermissionType {
  FungibleAsset = "0x1::fungible_asset::WithdrawPermission",
  
}

export interface FungibleAssetPermission {
  type: PermissionType.FungibleAsset;
  asset: string;
  // Question: best type here?: number | string | bigint
  balance: string;
}

export interface GasPermission {
  type: PermissionType.Gas;
  amount: number;
}

export interface NFTPermission {
  type: PermissionType.NFT;
  assetAddress: string;
  capabilities: Record<NFTCapability, boolean>;
}

export interface NFTCollectionPermission {
  type: PermissionType.NFTCollection;
  collectionAddress: string;
  capabilities: Record<NFTCollectionCapability, boolean>;
}

export enum NFTCollectionCapability {
  transfer = "transfer",
  mutate = "mutate",
}

export interface GenericPermission {
  type: string;
  [key: string]: string;
}

// revoke permission types
export interface RevokeFungibleAssetPermission {
  type: PermissionType.FungibleAsset;
  asset: string;
}

export interface RevokeNFTPermission {
  type: PermissionType.NFT;
  assetAddress: string;
}

// factories
export function FungibleAssetPermission(args: Omit<FungibleAssetPermission, "type">): FungibleAssetPermission {
  return { type: PermissionType.FungibleAsset, ...args };
}
export function GasPermission(args: Omit<GasPermission, "type">): GasPermission {
  return { type: PermissionType.Gas, ...args };
}
export function NFTPermission(args: Omit<NFTPermission, "type">): NFTPermission {
  return { type: PermissionType.NFT, ...args };
}
export function NFTCollectionPermission(args: Omit<NFTCollectionPermission, "type">): NFTCollectionPermission {
  return { type: PermissionType.NFTCollection, ...args };
}

export function GenericPermission(args: GenericPermission): GenericPermission {
  return {...args}
}

// functions

export interface PermissionTemp{
  asset: string;
  type: string;
  remaining: string;
}
export async function getPermissions<T extends PermissionType>({
  aptosConfig,
  primaryAccount,
  subAccount,
  filter
}: {
  aptosConfig: AptosConfig;
  primaryAccount: SingleKeyAccount;
  subAccount: AbstractedEd25519Account;
  filter?: T;
}): Promise<FilteredPermissions<T>> {
  const handle = await getHandleAddress({ aptosConfig, primaryAccount, subAccount });

  const res = await fetch(`http://127.0.0.1:8080/v1/accounts/${handle}/resources`);
  console.log(res);

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

  console.log(data);

  const permissions = data[0].data.perms.data.map((d) => {
    switch (d.key.type_name) {
      case "FungibleAsset":
        return FungibleAssetPermission({
          asset: d.key.data,
          balance: d.value
        });
      default:
        return GenericPermission({
          type: d.key.type_name,
          data: d.key.data,
          value: d.value
        });
    }
  });

  const filtered = filter ? permissions.filter((p) => filter.includes(p.type as PermissionType)) : permissions;
  return filtered as FilteredPermissions<T>;
}

// export type GrantPermission =
//   | { type: "APT"; limit: number; duration?: number }
//   | { type: "GAS"; limit: number }
//   | { type: "NFT"; address: string }
//   | { type: "NFTC"; address: string };

  // should it return the requested permissions? on success? and when it fails it
export async function requestPermission(args: {
  aptosConfig: AptosConfig;
  primaryAccount: SingleKeyAccount;
  permissionedAccount: AbstractedEd25519Account;
  permissions: Permission[];
  expiration?: number;
  requestsPerSecond?: number;
}): Promise<SimpleTransaction> {
  const { aptosConfig, primaryAccount, permissionedAccount, permissions } = args;
  const aptos = new Aptos(aptosConfig);

  // Get or create a handle for the permissioned account
  const existingHandleAddress = await getHandleAddress({ aptosConfig, primaryAccount, subAccount: permissionedAccount });
  console.log("debug, all arguments", aptosConfig, primaryAccount, permissionedAccount, permissions, existingHandleAddress);
  
  return aptos.transaction.build.batched_intents({
    sender: primaryAccount.accountAddress,
    builder: async (builder) => {
      // Get the permissioned signer - either create new one or use existing
      const permissionedSigner = await getPermissionedSigner(builder, {
        existingHandleAddress,
        primaryAccount: primaryAccount,
        permissionedAccount: permissionedAccount
      });

      // Grant each requested permission
      await Promise.all(permissions.map((permission) => 
        grantPermission(builder, {
          permissionedSigner: permissionedSigner.signer,
          permission
        })
      ));

      // If we created a new handle, finalize the setup
      if (permissionedSigner.isNewHandle) {
        await finalizeNewHandle(builder, {
          permissionedAccount,
          handle: permissionedSigner.handle!
        });
      }

      return builder;
    },
  });
}


export type RevokePermission = RevokeFungibleAssetPermission | RevokeNFTPermission | Permission;

export async function revokePermissions(args: {
  aptosConfig: AptosConfig;
  primaryAccount: SingleKeyAccount;
  subAccount: AbstractedEd25519Account;
  permissions: RevokePermission[];
}): Promise<SimpleTransaction> {
  const { aptosConfig, primaryAccount, subAccount, permissions } = args;

  const aptos = new Aptos(aptosConfig);
  const transaction = await aptos.transaction.build.batched_intents({
    sender: primaryAccount.accountAddress,
    builder: async (builder) => {
      const signer = await builder.add_batched_calls({
        function: "0x1::permissioned_delegation::permissioned_signer_by_key",
        functionArguments: [BatchArgument.new_signer(0), subAccount.publicKey.toUint8Array()],
        typeArguments: [],
      });

      const permissionPromises = permissions.map((permission) => {
        switch (permission.type) {
          case PermissionType.FungibleAsset: {
            return builder.add_batched_calls({
              function: "0x1::fungible_asset::revoke_permission",
              functionArguments: [signer[0].borrow(), permission.asset],
              typeArguments: [],
            });
          }
          // TODO: object nft revoke
          // case PermissionType.NFT: {
          //   return builder.add_batched_calls({
          //     function: "0x1::object::revoke_permission",
          //     functionArguments: [signer[0].borrow(), permission.assetAddress],
          //     typeArguments: ["0x4::token::Token"],
          //   });
          // }
          default: {
            console.log("Not implemented");
            return Promise.resolve();
          }
        }
      });

      await Promise.all(permissionPromises);
      return builder;
    },
  });

  return transaction;
}

//  helper functions

async function getPermissionedSigner(builder: any, args: {
  existingHandleAddress: string | null,
  primaryAccount: SingleKeyAccount,
  permissionedAccount: AbstractedEd25519Account
}) {
  if (args.existingHandleAddress) {
    const signer = await builder.add_batched_calls({
      function: "0x1::permissioned_delegation::permissioned_signer_by_key",
      functionArguments: [BatchArgument.new_signer(0), args.permissionedAccount.publicKey.toUint8Array()],
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

async function grantPermission(builder: any, args: {
  permissionedSigner: BatchArgument[],
  permission: Permission
}) {
  switch (args.permission.type) {
    case PermissionType.FungibleAsset:
      return builder.add_batched_calls({
        function: "0x1::fungible_asset::grant_permission",
        functionArguments: [
          BatchArgument.new_signer(0),
          args.permissionedSigner[0].borrow(),
          args.permission.asset, // do i need to convert this to AccountAddress?
          args.permission.balance,
        ],
        typeArguments: [],
      });
    case PermissionType.NFT:
      return builder.add_batched_calls({
        function: "0x1::object::grant_permission",
        functionArguments: [
          BatchArgument.new_signer(0), 
          args.permissionedSigner[0].borrow(), 
          args.permission.assetAddress
        ],
        typeArguments: ["0x4::token::Token"],
      });
    default:
      console.log("Not implemented");
      throw new Error(`${args.permission.type} not implemented`)
      return Promise.resolve();
  }
}

async function finalizeNewHandle(builder: any, args: {
  permissionedAccount: AbstractedEd25519Account,
  handle: BatchArgument[]
}) {
  await builder.add_batched_calls({
    function: "0x1::permissioned_delegation::add_permissioned_handle",
    functionArguments: [
      BatchArgument.new_signer(0),
      args.permissionedAccount.publicKey.toUint8Array(),
      args.handle[0],
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



export async function getHandleAddress({
  aptosConfig,
  primaryAccount,
  subAccount,
}: {
  aptosConfig: AptosConfig;
  primaryAccount: SingleKeyAccount;
  subAccount: AbstractedEd25519Account;
}) {
  const aptos = new Aptos(aptosConfig);
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

// Define a type alias to make it clearer
export type FilteredPermissions<T extends PermissionType> = Array<
  Extract<Permission, { type: T }>
>;