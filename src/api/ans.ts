// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "../core";
import {
  RegisterNameParameters,
  getExpiration,
  getOwnerAddress,
  registerName,
  getPrimaryName,
  setPrimaryName,
  getTargetAddress,
  setTargetAddress,
  renewDomain,
} from "../internal/ans";
import { InputGenerateTransactionOptions, InputSingleSignerTransaction } from "../transactions/types";
import { HexInput, MoveAddressType } from "../types";
import { AptosConfig } from "./aptosConfig";

/**
 * A class to handle all `ANS` operations
 */
export class ANS {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Retrieve the owner address of a domain name or subdomain name.
   *
   * ```ts
   * getOwnerAddress({name: "test.aptos"})
   * // Will return the owner address of "test.aptos.apt" or undefined
   * ```
   *
   * @param args.name - A string of the name to retrieve
   *
   * @returns MoveAddressType if the name is owned, undefined otherwise
   */
  async getOwnerAddress(args: { name: string }): Promise<MoveAddressType | undefined> {
    return getOwnerAddress({ aptosConfig: this.config, ...args });
  }

  /**
   * Retrieve the expiration time of a domain name or subdomain name.
   *
   * @param args.name - A string of the name to retrieve
   *
   * @returns number as a unix timestamp in seconds.
   */
  async getExpiration(args: { name: string }): ReturnType<typeof getExpiration> {
    return getExpiration({ aptosConfig: this.config, ...args });
  }

  /**
   * Retrieve the expiration time of a domain name or subdomain name.
   *
   * @param args.name - A string of the name: primary, primary.apt, secondary.primary, secondary.primary.apt, etc.
   *
   * @returns MoveAddressType if the name has a target, undefined otherwise
   */
  async getTargetAddress(args: { name: string }): ReturnType<typeof getTargetAddress> {
    return getTargetAddress({ aptosConfig: this.config, ...args });
  }

  /**
   * Sets the target address for a domain name or subdomain name.
   *
   * @param args.name - A string of the name: primary, primary.apt, secondary.primary, secondary.primary.apt, etc.
   * @param args.address - A HexInput of the address to set the domain or subdomain to
   *
   * @returns SingleSignerTransaction
   */
  async setTargetAddress(args: {
    sender: Account;
    name: string;
    address: HexInput;
  }): ReturnType<typeof setTargetAddress> {
    return setTargetAddress({ aptosConfig: this.config, ...args });
  }

  /**
   * Retrieve the primary name for an account address. Note, with the recent migration from
   * ANS v1 to ANS v2, it is possible for an account to have two primary names, one for each version.
   *
   * For example, if the account address `0x1` has the primary name `aptos` in ANS v1 and `test` in ANS v2,
   * this function will return `{v1: "aptos", v2: "test"}`.
   *
   * Similarly, if the account has a subdomain as their primary name in v2 without a primary name in v1
   * (e.g. `test.aptos.apt`), this function will return `{v2: "test.aptos"}`.
   *
   * @param args.address - A HexInput (address) of the account
   *
   * @returns null if no primary name is set
   * and an object {domainName: string, subdomainName?: string} if a primary name is set
   *
   */
  async getPrimaryName(args: { address: HexInput }): ReturnType<typeof getPrimaryName> {
    return getPrimaryName({ aptosConfig: this.config, ...args });
  }

  /**
   * Sets the primary name for the sender's account.
   *
   * @param args.sender - The sender account
   * @param args.name - A string of the name: primary, primary.apt, secondary.primary, secondary.primary.apt, etc.
   *
   * @returns SingleSignerTransaction
   */
  async setPrimaryName(args: {
    sender: Account;
    name: string;
    options?: InputGenerateTransactionOptions;
  }): ReturnType<typeof setPrimaryName> {
    return setPrimaryName({ aptosConfig: this.config, ...args });
  }

  /**
   * Registers a new name
   *
   * ```ts
   * // An example of registering a subdomain name assuming def.apt is already registered
   * // and belongs to the sender alice.
   *  const txn = aptos.registerName({
   *    sender: alice,
   *    name: "abc.def.apt",
   *    expiration: {
   *      policy: "subdomain:independent",
   *      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
   *    },
   *  });
   * ```
   *
   * @param args.sender - The sender account
   * @param args.name - A string of the name to register. This can be inclusive or exclusive of the .apt suffix.
   * Examples include: "xyz", "xyz.apt", "xyz.kyc.apt", etc.
   * @param args.expiration  - An object with the expiration policy of the name.
   * @param args.expiration.policy - 'domain' | 'subdomain:follow-domain' | 'subdomain:independent'
   * - domain: Years is required and the name will expire after the given number of years.
   * - subdomain:follow-domain: The name will expire at the same time as the domain name.
   * - subdomain:independent: The name will expire at the given date.
   * @param args.expiration.expirationDate - A javascript date of when the subdomain will expire. Only applicable when
   * the policy is set to 'subdomain:independent'.
   * @param args.transferable  - Determines if the subdomain being minted is soul-bound. Applicable only to subdomains.
   * @param args.targetAddress optional - The address the domain name will resolve to. If not provided,
   * the sender's address will be used.
   * @param args.toAddress optional - The address to send the domain name to. If not provided,
   * the transaction will be sent to the router.
   *
   * @returns InputSingleSignerTransaction
   */
  async registerName(args: Omit<RegisterNameParameters, "aptosConfig">): Promise<InputSingleSignerTransaction> {
    return registerName({ aptosConfig: this.config, ...args });
  }

  /**
   * Renews a domain name
   *
   * Note: If a domain name was minted with V1 of the contract, it will automatically be upgraded to V2 via this transaction.
   *
   * @param args.sender - The sender account
   * @param args.name - A string of the domain the subdomain will be under. The signer must be the domain owner.
   * Subdomains cannot be renewed.
   * @param args.years - The number of years to renew the name. Currently only one year is permitted.
   *
   * @returns SingleSignerTransaction
   */
  async renewDomain(args: { sender: Account; name: string; years: 1 }): Promise<InputSingleSignerTransaction> {
    return renewDomain({ aptosConfig: this.config, ...args });
  }
}
