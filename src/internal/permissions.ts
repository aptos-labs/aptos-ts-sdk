// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../api/aptosConfig";
import { AccountAddress, PublicKey } from "../core";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MoveOption, MoveString } from "../bcs";
import {
  MoveVMPermissionType,
  Permission,
  FungibleAssetPermission,
  NFTPermission,
  GasPermission,
} from "../types/permissions";
import { Transaction } from "../api/transaction";
import { view } from "./view";
import { AptosScriptComposer } from "../transactions";
import { CallArgument } from "../types";
import { DelegationKey } from "../types/permissions/delegationKey";
import { RateLimiter } from "../types/permissions/rateLimiter";
import { TokenBucket } from "../types/permissions/tokenBucket";

// functions
export async function getPermissions<T extends Permission>({
  aptosConfig,
  primaryAccountAddress,
  delegationPublicKey,
  filter,
}: {
  aptosConfig: AptosConfig;
  primaryAccountAddress: AccountAddress;
  delegationPublicKey: PublicKey;
  filter?: new (...a: any) => T;
}): Promise<T[]> {
  const handle = await getHandleAddress({ aptosConfig, primaryAccountAddress, delegationPublicKey });

  const res = await fetch(`${aptosConfig.fullnode}/accounts/${handle}/resources`);
  console.log(`${aptosConfig.fullnode}/accounts/${handle}/resources`);

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

  const permissions =
    data?.[0]?.data?.perms?.data?.map((d) => {
      switch (d.key.type_name) {
        case MoveVMPermissionType.FungibleAsset:
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
    }) ?? [];

  const filtered = filter ? permissions.filter((p) => p instanceof filter) : permissions;
  return filtered as T[];
}

// should it return the requested permissions? on success? and when it fails it
export async function requestPermission(args: {
  aptosConfig: AptosConfig;
  primaryAccountAddress: AccountAddress;
  delegationPublicKey: PublicKey;
  permissions: Permission[];
  expiration?: number;
  requestsPerSecond?: number;
}): Promise<SimpleTransaction> {
  const { aptosConfig, primaryAccountAddress, delegationPublicKey, permissions } = args;
  const transaction = new Transaction(aptosConfig);

  // Get or create a handle for the permission account
  const existingHandleAddress = await getHandleAddress({
    aptosConfig,
    primaryAccountAddress,
    delegationPublicKey,
  });
  return transaction.build.scriptComposer({
    sender: primaryAccountAddress,
    builder: async (builder) => {
      // Get the permissioned signer - either create new one or use existing
      const permissionedSigner = await getOrCreatePermissionedSigner(builder, {
        existingHandleAddress,
        delegationPublicKey,
        expirationTime: args.expiration,
        // maxTxnPerMinute: args.requestsPerSecond,
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

      return builder;
    },
  });
}

export async function revokePermissions(args: {
  aptosConfig: AptosConfig;
  primaryAccountAddress: AccountAddress;
  delegationPublicKey: PublicKey;
  permissions: Permission[];
}): Promise<SimpleTransaction> {
  const { aptosConfig, primaryAccountAddress, permissions } = args;
  const delegationPublicKey = new DelegationKey({ publicKey: args.delegationPublicKey });

  const transaction = new Transaction(aptosConfig);
  return transaction.build.scriptComposer({
    sender: primaryAccountAddress,
    builder: async (builder) => {
      const signer = await builder.addBatchedCalls({
        function: "0x1::permissioned_delegation::permissioned_signer_by_key",
        functionArguments: [CallArgument.newSigner(0), delegationPublicKey.bcsToBytes()],
        typeArguments: [],
      });

      const permissionPromises = permissions.map((permission) => {
        if (permission instanceof FungibleAssetPermission) {
          return builder.addBatchedCalls({
            function: "0x1::fungible_asset::revoke_permission",
            functionArguments: [signer[0].borrow(), permission.asset],
            typeArguments: [],
          });
        }
        if (permission instanceof GasPermission) {
          return builder.addBatchedCalls({
            function: "0x1::transaction_validation::revoke_permission",
            functionArguments: [signer[0].borrow()],
            typeArguments: [],
          });
        }
        // TODO: object nft revoke
        if (permission instanceof NFTPermission) {
          return builder.addBatchedCalls({
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
async function getOrCreatePermissionedSigner(
  builder: AptosScriptComposer,
  args: {
    existingHandleAddress: string | null;
    delegationPublicKey: PublicKey;
    expirationTime?: number;
  },
) {
  const { existingHandleAddress, expirationTime = Date.now() + 24 * 60 * 60 * 1000 } = args;
  const delegationPublicKey = new DelegationKey({ publicKey: args.delegationPublicKey });

  if (existingHandleAddress) {
    const signer = await builder.addBatchedCalls({
      function: "0x1::permissioned_delegation::permissioned_signer_by_key",
      functionArguments: [CallArgument.newSigner(0), delegationPublicKey.bcsToBytes()],
      typeArguments: [],
    });
    return { signer };
  }
  const signer = await builder.addBatchedCalls({
    function: "0x1::permissioned_delegation::add_permissioned_handle",
    functionArguments: [
      CallArgument.newSigner(0),
      delegationPublicKey.bcsToBytes(),
      RateLimiter.from({
        tokenBucket: TokenBucket.from({
          capacity: BigInt(1000),
          currentAmount: BigInt(1000),
          refillInterval: BigInt(60),
          lastRefillTimestamp: BigInt(Date.now()),
          fractionalAccumulated: BigInt(0),
        }),
      }).bcsToBytes(),
      // TODO: none
      // MoveOption.U8().bcsToBytes(),
      expirationTime,
    ],
    typeArguments: [],
  });
  await builder.addBatchedCalls({
    function: "0x1::account_abstraction::add_authentication_function",
    functionArguments: [
      CallArgument.newSigner(0),
      AccountAddress.ONE,
      new MoveString("permissioned_delegation"),
      new MoveString("authenticate"),
    ],
    typeArguments: [],
  });

  return { signer };
}

async function grantPermission(
  builder: AptosScriptComposer,
  args: {
    permissionedSigner: CallArgument[];
    permission: Permission;
  },
) {
  if (args.permission instanceof FungibleAssetPermission) {
    return builder.addBatchedCalls({
      function: "0x1::fungible_asset::grant_permission",
      functionArguments: [
        CallArgument.newSigner(0),
        args.permissionedSigner[0].borrow(),
        args.permission.asset,
        args.permission.amount,
      ],
      typeArguments: [],
    });
  }
  if (args.permission instanceof GasPermission) {
    return builder.addBatchedCalls({
      function: "0x1::transaction_validation::grant_gas_permission",
      functionArguments: [CallArgument.newSigner(0), args.permissionedSigner[0].borrow(), args.permission.amount],
      typeArguments: [],
    });
  }
  if (args.permission instanceof NFTPermission) {
    const txn: Promise<CallArgument[]>[] = [];
    if (args.permission.capabilities.transfer) {
      return builder.addBatchedCalls({
        function: "0x1::object::grant_permission",
        functionArguments: [
          CallArgument.newSigner(0),
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

export async function getHandleAddress({
  aptosConfig,
  primaryAccountAddress,
  delegationPublicKey,
}: {
  aptosConfig: AptosConfig;
  primaryAccountAddress: AccountAddress;
  delegationPublicKey: PublicKey;
}) {
  try {
    const delegationKey = new DelegationKey({ publicKey: delegationPublicKey });

    const [handle] = await view<string[]>({
      aptosConfig,
      payload: {
        function: "0x1::permissioned_delegation::handle_address_by_key",
        functionArguments: [primaryAccountAddress, delegationKey.bcsToBytes()],
      },
    });

    return handle;
  } catch {
    return null;
  }
}

