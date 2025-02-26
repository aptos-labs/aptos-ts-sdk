// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../api/aptosConfig";
import { Transaction } from "../api/transaction";
import { AccountAddress, PublicKey } from "../core";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";
import {
  Permission,
  FungibleAssetPermission,
  NFTPermission,
  GasPermission,
  NFTPermissionCapability,
  FungibleAssetPermissionCapability,
  GasPermissionCapability,
} from "../types/permissions";
import { CallArgument } from "../types";
import { DelegationKey } from "../types/permissions/delegationKey";
import { RateLimiter } from "../types/permissions/rateLimiter";
import { view } from "./view";

/**
 * Resource structure returned by the Aptos API for permissions
 */
type PermissionResource = {
  type: string;
  data: {
    perms: {
      data: Array<{
        key: { data: string; type_name: string };
        value: string;
      }>;
    };
  };
};

/**
 * TODO: We should be fetching this from the indexer, not the fullnode.
 * With the current refactor to a unified class, this function is broken.
 */
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
  if (!handle) return [];

  const res = await fetch(`${aptosConfig.fullnode}/accounts/${handle}/resources`);
  if (!res.ok) {
    throw new Error(`Failed to fetch permissions: ${res.statusText}`);
  }

  const data = (await res.json()) as PermissionResource[];
  const permissions =
    data?.[0]?.data?.perms?.data?.reduce((acc, d) => {
      const address = AccountAddress.fromString(d.key.data);

      switch (d.key.type_name) {
        case FungibleAssetPermissionCapability.Withdraw: {
          acc.push(
            FungibleAssetPermission.from({
              asset: address,
              amount: Number(d.value),
            }),
          );
          break;
        }

        case GasPermissionCapability.Withdraw: {
          acc.push(
            GasPermission.from({
              amount: Number(d.value),
            }),
          );
          break;
        }

        case NFTPermissionCapability.transfer:
        case NFTPermissionCapability.mutate: {
          const existingIndex = acc.findIndex(
            (p): p is NFTPermission => p instanceof NFTPermission && p.assetAddress.equals(address),
          );

          if (existingIndex !== -1) {
            const existingNFT = acc[existingIndex] as NFTPermission;
            // Create new NFT permission with merged capabilities
            acc[existingIndex] = NFTPermission.from({
              assetAddress: address,
              capabilities: {
                [NFTPermissionCapability.transfer]:
                  existingNFT.capabilities[NFTPermissionCapability.transfer] ||
                  d.key.type_name === NFTPermissionCapability.transfer,
                [NFTPermissionCapability.mutate]:
                  existingNFT.capabilities[NFTPermissionCapability.mutate] ||
                  d.key.type_name === NFTPermissionCapability.mutate,
              },
            });
          } else {
            // Create new NFT permission
            acc.push(
              NFTPermission.from({
                assetAddress: address,
                capabilities: {
                  [NFTPermissionCapability.transfer]: d.key.type_name === NFTPermissionCapability.transfer,
                  [NFTPermissionCapability.mutate]: d.key.type_name === NFTPermissionCapability.mutate,
                },
              }),
            );
          }
          break;
        }

        default:
          throw new Error(`Unknown permission type: ${d.key.type_name}`);
      }
      return acc;
    }, [] as Permission[]) ?? [];

  return filter ? (permissions.filter((p) => p instanceof filter) as unknown as T[]) : (permissions as unknown as T[]);
}

export async function requestPermission(args: {
  aptosConfig: AptosConfig;
  primaryAccountAddress: AccountAddress;
  delegationPublicKey: PublicKey;
  permissions: Permission[];
  expiration: number;
  refreshInterval: number | bigint;
  maxTransactionsPerInterval: number | bigint;
}): Promise<SimpleTransaction> {
  const {
    aptosConfig,
    primaryAccountAddress,
    delegationPublicKey,
    permissions,
    expiration,
    refreshInterval,
    maxTransactionsPerInterval,
  } = args;
  const transaction = new Transaction(aptosConfig);
  const existingHandleAddress = await getHandleAddress({ aptosConfig, primaryAccountAddress, delegationPublicKey });

  return transaction.build.scriptComposer({
    sender: primaryAccountAddress,
    builder: async (builder) => {
      // Get or create permissioned signer
      const delegationKey = new DelegationKey({ publicKey: delegationPublicKey });
      let signer;

      // Use existing permissioned signer if it exists
      if (existingHandleAddress) {
        signer = await builder.addBatchedCalls({
          function: "0x1::permissioned_delegation::permissioned_signer_by_key",
          functionArguments: [CallArgument.newSigner(0), delegationKey.bcsToBytes()],
          typeArguments: [],
        });
      }
      // Create a new permissioned signer with rate limiting
      else {
        signer = await builder.addBatchedCalls({
          function: "0x1::permissioned_delegation::add_permissioned_handle",
          functionArguments: [
            CallArgument.newSigner(0),
            delegationKey.bcsToBytes(),
            RateLimiter.fromDefaultTokenBucket({
              capacity: maxTransactionsPerInterval,
              refillInterval: refreshInterval,
            }).bcsToBytes(),
            expiration,
          ],
          typeArguments: [],
        });

        // Add authentication function for new signer
        await builder.addBatchedCalls({
          function: "0x1::account_abstraction::add_authentication_function",
          functionArguments: [CallArgument.newSigner(0), AccountAddress.ONE, "permissioned_delegation", "authenticate"],
          typeArguments: [],
        });
      }

      // Each capability (mutate, transfer, etc) is a separate permission, we need to expand them
      const expandedPermissions = permissions.flatMap((permission) => {
        if (permission instanceof NFTPermission && permission.capabilities) {
          const expanded: Permission[] = [];
          if (permission.capabilities[NFTPermissionCapability.transfer]) {
            expanded.push(
              NFTPermission.from({
                assetAddress: permission.assetAddress,
                capabilities: {
                  [NFTPermissionCapability.transfer]: true,
                  [NFTPermissionCapability.mutate]: false,
                },
              }),
            );
          }
          if (permission.capabilities.mutate) {
            expanded.push(
              NFTPermission.from({
                assetAddress: permission.assetAddress,
                capabilities: {
                  [NFTPermissionCapability.transfer]: false,
                  [NFTPermissionCapability.mutate]: true,
                },
              }),
            );
          }
          return expanded;
        }
        return permission;
      });

      await Promise.all(
        expandedPermissions.map(async (permission) => {
          const signerBorrow = signer[0].borrow();

          if (permission instanceof FungibleAssetPermission) {
            return builder.addBatchedCalls({
              function: "0x1::fungible_asset::grant_permission_by_store",
              functionArguments: [CallArgument.newSigner(0), signerBorrow, permission.asset, permission.amount],
              typeArguments: ["0x1::fungible_asset::Metadata"],
            });
          }

          if (permission instanceof GasPermission) {
            return builder.addBatchedCalls({
              function: "0x1::transaction_validation::grant_gas_permission",
              functionArguments: [CallArgument.newSigner(0), signerBorrow, permission.amount],
              typeArguments: [],
            });
          }

          if (permission instanceof NFTPermission) {
            if (permission.capabilities[NFTPermissionCapability.transfer]) {
              return builder.addBatchedCalls({
                function: "0x1::object::grant_permission",
                functionArguments: [CallArgument.newSigner(0), signerBorrow, permission.assetAddress],
                typeArguments: ["0x4::token::Token"],
              });
            }
            if (permission.capabilities.mutate) {
              throw new Error("NFT mutate permission not implemented");
            }
            return Promise.resolve([]);
          }

          throw new Error(`Unknown permission type: ${permission}`);
        }),
      );

      return builder;
    },
  });
}

export async function revokePermissions({
  aptosConfig,
  primaryAccountAddress,
  delegationPublicKey,
  permissions,
}: {
  aptosConfig: AptosConfig;
  primaryAccountAddress: AccountAddress;
  delegationPublicKey: PublicKey;
  permissions: Permission[];
}): Promise<SimpleTransaction> {
  const transaction = new Transaction(aptosConfig);
  const delegationKey = new DelegationKey({ publicKey: delegationPublicKey });

  return transaction.build.scriptComposer({
    sender: primaryAccountAddress,
    builder: async (builder) => {
      // Get the permissioned signer
      const [signer] = await builder.addBatchedCalls({
        function: "0x1::permissioned_delegation::permissioned_signer_by_key",
        functionArguments: [CallArgument.newSigner(0), delegationKey.bcsToBytes()],
        typeArguments: [],
      });

      const signerBorrow = signer.borrow();

      // Revoke each permission
      await Promise.all(
        permissions.map(async (permission) => {
          if (permission instanceof FungibleAssetPermission) {
            return builder.addBatchedCalls({
              function: "0x1::fungible_asset::revoke_permission",
              functionArguments: [signerBorrow, permission.asset],
              typeArguments: [],
            });
          }

          if (permission instanceof GasPermission) {
            return builder.addBatchedCalls({
              function: "0x1::transaction_validation::revoke_permission",
              functionArguments: [signerBorrow],
              typeArguments: [],
            });
          }

          if (permission instanceof NFTPermission) {
            return builder.addBatchedCalls({
              function: "0x1::object::revoke_permission",
              functionArguments: [signerBorrow, permission.assetAddress],
              typeArguments: ["0x4::token::Token"],
            });
          }

          throw new Error(`Unknown permission type: ${permission}`);
        }),
      );

      return builder;
    },
  });
}

async function getHandleAddress({
  aptosConfig,
  primaryAccountAddress,
  delegationPublicKey,
}: {
  aptosConfig: AptosConfig;
  primaryAccountAddress: AccountAddress;
  delegationPublicKey: PublicKey;
}): Promise<string | null> {
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
