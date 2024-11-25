// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AbstractedEd25519Account, Account, SingleKeyAccount } from "../account";
import { AccountAddressInput } from "../core";
import { FilteredPermissions, getPermissions, Permission, PermissionTemp, PermissionType, requestPermission, RevokePermission, revokePermissions } from "../internal/permissions";
import { InputGenerateTransactionOptions } from "../transactions/types";
import { AptosConfig } from "./aptosConfig";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";

/**
 * A class to handle all permission-related operations
 */
export class Permissions {
  constructor(readonly config: AptosConfig) {}

  /**
   * Gets the current permissions granted to a sub-account by a primary account
   * 
   * @example
   * ```typescript
   * const permissions = await aptos.permissions.getPermissions({
   *   primaryAccount: alice,
   *   subAccount: bob
   * });
   * // permissions = [{asset: "0x1::aptos_coin::AptosCoin", type: "FungibleAsset", remaining: "10"}]
   * ```
   * 
   * @param args.primaryAccount - The primary account that granted permissions
   * @param args.subAccount - The sub-account that received permissions
   * 
   * @returns An array of current permissions and their remaining balances
   */
  async getPermissions<T extends PermissionType>(args: {
    primaryAccount: SingleKeyAccount;
    subAccount: AbstractedEd25519Account;
    filter?: T;
  }): Promise<FilteredPermissions<T>> {
    return getPermissions({ aptosConfig: this.config, ...args });
  }

  /**
   * Requests new permissions for a sub-account from a primary account
   * 
   * @example
   * ```typescript
   * const permission = FungibleAssetPermission = FungibleAssetPermission({
      asset: "0x1::aptos_coin::AptosCoin",
      balance: "10",
    });

   * const txn = await aptos.permissions.requestPermissions({
   *   primaryAccount: alice,
   *   permissionedAccount: bob,
   *   permissions: [permission]
   * });
   * ```
   * 
   * @param args.primaryAccount - The primary account granting permissions
   * @param args.permissionedAccount - The sub-account receiving permissions
   * @param args.permissions - Array of permission requests (APT, GAS, NFT, or NFTC)
   * @param args.expiration - Optional expiration time in seconds
   * @param args.requestsPerSecond - Optional rate limit for transactions
   * 
   * @returns A transaction that can be signed and submitted
   */
  async requestPermissions(args: {
    primaryAccount: SingleKeyAccount;
    permissionedAccount: AbstractedEd25519Account;
    permissions: Permission[];
    expiration?: number;
    requestsPerSecond?: number;
  }): Promise<SimpleTransaction> {
    return requestPermission({ aptosConfig: this.config, ...args });
  }

  /**
   * Revokes existing permissions from a sub-account
   * 
   * @example
   * ```typescript
   * const txn = await aptos.permissions.revokePermission({
   *   primaryAccount: alice,
   *   subAccount: bob,
   *   permissions: [{ type: "APT" }]
   * });
   * ```
   * 
   * @param args.primaryAccount - The primary account revoking permissions
   * @param args.subAccount - The sub-account losing permissions
   * @param args.permissions - Array of permissions to revoke (APT or NFT)
   * 
   * @returns A transaction that can be signed and submitted
   */
  async revokePermission(args: {
    primaryAccount: SingleKeyAccount;
    subAccount: AbstractedEd25519Account;
    permissions: RevokePermission[];
  }): Promise<SimpleTransaction> {
    return revokePermissions({ aptosConfig: this.config, ...args });
  }


}
