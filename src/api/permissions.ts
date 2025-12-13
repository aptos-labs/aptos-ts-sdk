// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { getPermissions, requestPermission, revokePermissions } from "../internal/permissions";
import { AptosConfig } from "./aptosConfig";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";
import { Permission } from "../types/permissions";
import { AccountAddress, PublicKey } from "../core";

/**
 * Manages permission operations for delegated accounts.
 * Handles granting, revoking, and querying permissions for fungible assets, gas, and NFTs.
 */
export class Permissions {
  constructor(readonly config: AptosConfig) {}

  /**
   * Gets current permissions for a delegation key
   *
   * @example
   * ```typescript
   * const permissions = await aptos.permissions.getPermissions({
   *   primaryAccountAddress: AccountAddress.fromString("0x1"),
   *   delegationPublicKey: delegatedAccount.publicKey
   *   filter: FungibleAssetPermission
   * });
   * ```
   */
  async getPermissions<T extends Permission>(args: {
    primaryAccountAddress: AccountAddress;
    delegationPublicKey: PublicKey;
    filter?: new (...a: any) => T;
  }): Promise<T[]> {
    return getPermissions({
      aptosConfig: this.config,
      primaryAccountAddress: args.primaryAccountAddress,
      delegationPublicKey: args.delegationPublicKey,
      filter: args.filter,
    });
  }

  /**
   * Requests permissions for a delegation key
   *
   * @param args
   * @param args.primaryAccountAddress - The primary account address
   * @param args.delegationPublicKey - The delegation public key
   * @param args.permissions - The permissions to request
   * @param args.expiration - The expiration time of the permissions, in epoch seconds. Defaults to 1 day from now.
   * @param args.refreshInterval - The refresh interval of the permissions, in seconds. Defaults to 60 seconds.
   * @param args.maxTransactionsPerInterval - The maximum number of transactions per interval. Defaults to 1000.
   *
   * @example
   * ```typescript
   * const txn = await aptos.permissions.requestPermissions({
   *   primaryAccountAddress: AccountAddress.fromString("0x1"),
   *   delegationPublicKey: delegatedAccount.publicKey,
   *   permissions: [
   *     FungibleAssetPermission.from({ asset: AccountAddress.A, amount: 100 })
   *   ]
   * });
   *
   * await aptos.signAndSubmitTransaction({
   *   signer: primaryAccount,
   *   transaction: txn,
   * });
   * ```
   */
  async requestPermissions(args: {
    primaryAccountAddress: AccountAddress;
    delegationPublicKey: PublicKey;
    permissions: Permission[];
    expiration?: number;
    refreshInterval?: number;
    maxTransactionsPerInterval?: number;
  }): Promise<SimpleTransaction> {
    return requestPermission({
      aptosConfig: this.config,
      primaryAccountAddress: args.primaryAccountAddress,
      delegationPublicKey: args.delegationPublicKey,
      permissions: args.permissions,
      expiration: args.expiration ?? Date.now() + 24 * 60 * 60 * 1000,
      refreshInterval: args.refreshInterval ?? 60,
      maxTransactionsPerInterval: args.maxTransactionsPerInterval ?? 1000,
    });
  }

  /**
   * Revokes permissions from a delegation key. Note: You can pass an entire permission you get back from `getPermissions`
   * or call the static `revoke` function on the permission.
   *
   * @example
   * ```typescript
   * const txn = await aptos.permissions.revokePermission({
   *   primaryAccountAddress: AccountAddress.fromString("0x1"),
   *   delegationPublicKey: delegatedAccount.publicKey,
   *   permissions: [
   *     FungibleAssetPermission.revoke({ asset: AccountAddress.A })
   *   ]
   * });
   *
   * await aptos.signAndSubmitTransaction({
   *   signer: primaryAccount,
   *   transaction: txn,
   * });
   * ```
   */
  async revokePermission(args: {
    primaryAccountAddress: AccountAddress;
    delegationPublicKey: PublicKey;
    permissions: Permission[];
  }): Promise<SimpleTransaction> {
    return revokePermissions({
      aptosConfig: this.config,
      primaryAccountAddress: args.primaryAccountAddress,
      delegationPublicKey: args.delegationPublicKey,
      permissions: args.permissions,
    });
  }
}
