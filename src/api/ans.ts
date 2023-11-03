// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { RegisterNameParameters, getOwnerAddress, registerName } from "../internal/ans";
import { InputSingleSignerTransaction } from "../transactions/types";
import { MoveAddressType } from "../types";
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
   * Registers a new domain or subdomain name
   *
   * @param args.sender - The sender account
   * @param args.name - A string or {domainName: string, subdomainName?: string} of the name to register. This
   * can be inclusive or exclusive of the .apt suffix.
   * Examples include: "xyz", "xyz.apt", "xyz.kyc.apt", {domainName: "xyz"}, {domainName: "kyc", subdomainName: "xyz"}.
   * @param args.expiration  - An object with the expiration policy of the name.
   * @param args.expiration.policy - 'domain' | 'subdomain:follow-domain' | 'subdomain:independent'
   * - domain: Years is required and the name will expire after the given number of years.
   * - subdomain:follow-domain: The name will expire at the same time as the domain name.
   * - subdomain:independent: The name will expire at the given date.
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
}
