// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "../core";
import { getOwnerAddress, registerDomain } from "../internal/ans";
import { InputSingleSignerTransaction, InputGenerateTransactionOptions } from "../transactions/types";
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
   * getOwnerAddress({domainName: "aptos", subdomainName: "test"})
   * // Will return the owner address of "test.aptos.apt" or undefined
   * ```
   *
   * @param args.domainName - A string of the domain name to retrieve
   * @param args.subdomainName - A string of the subdomain name to retrieve
   *
   * @returns MoveAddressType if the name is owned, undefined otherwise
   */
  async getOwnerAddress(args: { domainName: string; subdomainName?: string }): Promise<MoveAddressType | undefined> {
    return getOwnerAddress({ aptosConfig: this.config, ...args });
  }

  /**
   * Registers a new domain name
   *
   * @param args.sender - The sender account
   * @param args.domainName - A string of the domain name to register, will be suffixed with .apt
   * @param args.registrationDuration  - Time in seconds for how long the name will be registered for. This
   * is part of the cost of the transaction. Must be a multiple of one year in seconds.
   * @param args.targetAddress optional - The address the domain name will resolve to. If not provided,
   * the sender's address will be used.
   * @param args.toAddress optional - The address to send the domain name to. If not provided,
   * the transaction will be sent to the router.
   *
   * @returns InputSingleSignerTransaction
   */
  async registerDomain(args: {
    sender: Account;
    domainName: string;
    registrationDuration: 31536000;
    targetAddress?: HexInput;
    toAddress?: HexInput;
    options?: InputGenerateTransactionOptions;
  }): Promise<InputSingleSignerTransaction> {
    return registerDomain({ aptosConfig: this.config, ...args });
  }
}
