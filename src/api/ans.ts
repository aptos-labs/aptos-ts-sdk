// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "../account";
import { AccountAddress, AccountAddressInput } from "../core";
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
  getName,
  getAccountDomains,
  GetAccountDomainsArgs,
  GetAccountSubdomainsArgs,
  getAccountSubdomains,
  getAccountNames,
  GetAccountNamesArgs,
  getDomainSubdomains,
  GetDomainSubdomainsArgs,
} from "../internal/ans";
import { GetANSNameResponse } from "../types";
import { InputGenerateTransactionOptions } from "../transactions/types";
import { AptosConfig } from "./aptosConfig";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";

/**
 * A class to handle all `ANS` operations.
 */
export class ANS {
  /**
   * Initializes a new instance of the Aptos class with the provided configuration.
   * This allows you to interact with the Aptos blockchain using the specified network settings.
   *
   * @param config - The configuration settings for the Aptos client.
   * @param config.network - The network to connect to (e.g., mainnet, testnet).
   * @param config.nodeUrl - The URL of the Aptos node to connect to.
   * @param config.faucetUrl - The URL of the faucet to use for funding accounts.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for connecting to the Aptos testnet
   *     const config = new AptosConfig({ network: Network.TESTNET });
   *
   *     // Initialize the Aptos client with the configuration
   *     const aptos = new Aptos(config);
   *
   *     console.log("Aptos client initialized:", aptos);
   * }
   * runExample().catch(console.error);
   * ```
   */
  constructor(readonly config: AptosConfig) {}

  /**
   * Retrieve the owner address of a specified domain name or subdomain name from the contract.
   *
   * @param args - The arguments for retrieving the owner address.
   * @param args.name - A string representing the name of the domain or subdomain to retrieve the owner address for.
   *
   * @returns AccountAddress if the name is owned, undefined otherwise.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Retrieve the owner address of "test.aptos"
   *   const owner = await aptos.getOwnerAddress({ name: "test.aptos" });
   *   console.log(owner); // Logs the owner address or undefined if not owned
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getOwnerAddress(args: { name: string }): Promise<AccountAddress | undefined> {
    return getOwnerAddress({ aptosConfig: this.config, ...args });
  }

  /**
   * Retrieve the expiration time of a domain name or subdomain name from the contract.
   *
   * @param args - The arguments for retrieving the expiration.
   * @param args.name - A string of the name to retrieve.
   *
   * @returns number as a unix timestamp in milliseconds.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Get the expiration time for the domain "test.aptos"
   *   const exp = await aptos.getExpiration({ name: "test.aptos" });
   *
   *   // Log the expiration date
   *   console.log(new Date(exp)); // Outputs the expiration date
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getExpiration(args: { name: string }): Promise<number | undefined> {
    return getExpiration({ aptosConfig: this.config, ...args });
  }

  /**
   * Retrieve the target address of a domain or subdomain name, which indicates the address the name points to for use on-chain.
   * Note that the target address can point to addresses that do not own the name.
   *
   * @param args - The arguments for retrieving the target address.
   * @param args.name - A string representing the name, which can be a primary name, a subdomain, or a combination (e.g.,
   * "primary", "primary.apt", "secondary.primary", "secondary.primary.apt").
   *
   * @returns AccountAddress if the name has a target, undefined otherwise.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Retrieve the target address for the specified domain name
   *   const targetAddr = await aptos.getTargetAddress({ name: "test.aptos" });
   *
   *   console.log(targetAddr); // Logs the target address, e.g., 0x123...
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getTargetAddress(args: { name: string }): Promise<AccountAddress | undefined> {
    return getTargetAddress({ aptosConfig: this.config, ...args });
  }

  /**
   * Sets the target address of a domain or subdomain name, pointing it to a specified address for use on-chain.
   * The target address can be different from the owner of the name.
   *
   * @param args - The arguments for setting the target address.
   * @param args.sender - The account initiating the transaction.
   * @param args.name - A string representing the domain or subdomain name (e.g., "test.aptos").
   * @param args.address - The AccountAddressInput of the address to set the domain or subdomain to.
   * @param args.options - Optional settings for generating the transaction.
   *
   * @returns SimpleTransaction
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Setting the target address for a domain name
   *   const sender = Account.generate(); // replace with a real account
   *   const address = "0x1"; // replace with a real account address
   *
   *   await aptos.setTargetAddress({
   *     sender: sender,
   *     name: "test.aptos",
   *     address: address,
   *   });
   *
   *   const targetAddress = await aptos.getTargetAddress({ name: "test.aptos" });
   *   console.log(targetAddress); // Should log the address set for "test.aptos"
   * }
   * runExample().catch(console.error);
   * ```
   */
  async setTargetAddress(args: {
    sender: Account;
    name: string;
    address: AccountAddressInput;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return setTargetAddress({ aptosConfig: this.config, ...args });
  }

  /**
   * Retrieve the primary name for an account. An account can have multiple names, but only one primary name, which may not exist.
   *
   * @param args - The arguments for retrieving the primary name.
   * @param args.address - An AccountAddressInput (address) of the account.
   *
   * @returns A string if the account has a primary name, undefined otherwise.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Retrieve the primary name for the specified account address
   *   const name = await aptos.getPrimaryName({ address: "0x1" }); // replace with a real account address
   *   console.log(name);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getPrimaryName(args: { address: AccountAddressInput }): Promise<string | undefined> {
    return getPrimaryName({ aptosConfig: this.config, ...args });
  }

  /**
   * Sets the primary name for the sender account, allowing them to designate a single primary name among potentially multiple
   * names. An account may not have a primary name.
   *
   * @param args - The arguments for setting the primary name.
   * @param args.sender - The sender account.
   * @param args.name - A string representing the name to set as primary (e.g., "test.aptos").
   * @param args.options - Optional transaction options.
   *
   * @returns SimpleTransaction
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Set the primary name for the sender account
   *   const sender = Account.generate(); // replace with a real account
   *   await aptos.setPrimaryName({ sender, name: "test.aptos" });
   *
   *   const primaryName = await aptos.getPrimaryName({ address: sender.accountAddress });
   *   console.log("Primary Name:", primaryName); // Should log: "Primary Name: test.aptos"
   * }
   * runExample().catch(console.error);
   * ```
   */
  async setPrimaryName(args: {
    sender: Account;
    name?: string;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return setPrimaryName({ aptosConfig: this.config, ...args });
  }

  /**
   * Registers a new name.
   *
   * This function allows you to register a domain or subdomain name with specific expiration policies and options.
   *
   * @param args.sender - The sender account.
   * @param args.name - A string of the name to register. This can be inclusive or exclusive of the .apt suffix. Examples include:
   * "test", "test.apt", "test.aptos.apt", etc.
   * @param args.expiration  - An object with the expiration policy of the name.
   * @param args.expiration.policy - 'domain' | 'subdomain:follow-domain' | 'subdomain:independent'.
   * - domain: Years is required and the name will expire after the given number of years.
   * - subdomain:follow-domain: The name will expire at the same time as the domain name.
   * - subdomain:independent: The name will expire at the given date.
   * @param args.expiration.expirationDate - An epoch number in milliseconds of the date when the subdomain will expire. Only
   * applicable when the policy is set to 'subdomain:independent'.
   * @param args.transferable  - Determines if the subdomain being minted is soul-bound. Applicable only to subdomains.
   * @param args.targetAddress optional - The address the domain name will resolve to. If not provided, the sender's address will
   * be used.
   * @param args.toAddress optional - The address to send the domain name to. If not provided, the transaction will be sent to the
   * router.
   *
   * @returns SimpleTransaction
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Registering a subdomain name assuming def.apt is already registered and belongs to the sender alice.
   *   const txn = await aptos.registerName({
   *     sender: "0x1", // replace with a real sender account
   *     name: "test.aptos.apt",
   *     expiration: {
   *       policy: "subdomain:independent",
   *       expirationDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // expires in 30 days
   *     },
   *   });
   *
   *   console.log("Transaction:", txn);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async registerName(args: Omit<RegisterNameParameters, "aptosConfig">): Promise<SimpleTransaction> {
    return registerName({ aptosConfig: this.config, ...args });
  }

  /**
   * Renews a domain name for one year.
   * If a domain name was minted with V1 of the contract, it will automatically be upgraded to V2 via this transaction.
   *
   * @param args - The arguments for renewing the domain.
   * @param args.sender - The sender account, which must be the domain owner.
   * @param args.name - A string representing the domain to renew. Subdomains cannot be renewed.
   * @param args.years - The number of years to renew the name. Currently, only one year is permitted.
   * @param args.options - Optional transaction options.
   *
   * @returns SimpleTransaction
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Renew the domain "test" for one year
   *   const transaction = await aptos.renewDomain({
   *     sender: Account.generate(), // replace with a real account
   *     name: "test"
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async renewDomain(args: {
    sender: Account;
    name: string;
    years?: 1;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return renewDomain({ aptosConfig: this.config, ...args });
  }

  /**
   * Fetches a single name from the indexer based on the provided name argument.
   *
   * @param args - The arguments for retrieving the name.
   * @param args.name - A string of the name to retrieve, e.g. "test.aptos.apt" or "test.apt" or "test".
   *                    Can be inclusive or exclusive of the .apt suffix and can be a subdomain.
   *
   * @returns A promise of an ANSName or undefined if the name is not active.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *     // Fetching a name from the indexer
   *     const name = await aptos.getName({ name: "test.aptos" }); // replace with a real name
   *     console.log(name);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getName(args: { name: string }): Promise<GetANSNameResponse[0] | undefined> {
    return getName({ aptosConfig: this.config, ...args });
  }

  /**
   * Fetches all names for an account, including both top-level domains and subdomains.
   *
   * @param args - The arguments for fetching account names.
   * @param args.accountAddress - An AccountAddressInput of the address to retrieve names for.
   * @param args.options - Optional parameters for fetching names.
   * @param args.options.offset - Optional, the offset to start from when fetching names.
   * @param args.options.limit - Optional, a number of the names to fetch per request.
   * @param args.options.orderBy - The order to sort the names by.
   * @param args.options.where - Additional filters to apply to the query.
   *
   * @returns A promise of an array of ANSName.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Fetch account names for a specific address
   *   const accountNames = await aptos.getAccountNames({
   *     accountAddress: "0x1", // replace with a real account address
   *     options: {
   *       limit: 10, // specify how many names to fetch
   *       orderBy: "name", // specify the order by which to sort the names
   *     },
   *   });
   *
   *   console.log(accountNames);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getAccountNames(args: GetAccountNamesArgs): Promise<GetANSNameResponse> {
    return getAccountNames({ aptosConfig: this.config, ...args });
  }

  /**
   * Fetches all top-level domain names for a specified account.
   *
   * @param args - The arguments for retrieving account domains.
   * @param args.accountAddress - An AccountAddressInput of the address to retrieve domain names for.
   * @param args.options.offset - Optional, the offset to start from when fetching names.
   * @param args.options.limit - Optional, a number of the names to fetch per request.
   * @param args.options.orderBy - The order to sort the names by.
   * @param args.options.where - Additional filters to apply to the query.
   *
   * @returns A promise of an array of ANSName.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Fetching all top-level domain names for a specific account
   *   const domains = await aptos.getAccountDomains({
   *     accountAddress: "0x1", // replace with a real account address
   *     options: {
   *       limit: 10, // specify the number of names to fetch
   *       offset: 0, // specify the offset for pagination
   *       orderBy: "created_at", // specify the order by which to sort the names
   *       where: {
   *         // additional filters can be specified here
   *       },
   *     },
   *   });
   *
   *   console.log(domains);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getAccountDomains(args: GetAccountDomainsArgs): Promise<GetANSNameResponse> {
    return getAccountDomains({ aptosConfig: this.config, ...args });
  }

  /**
   * Fetches all subdomain names for a specified account.
   *
   * @param args - The arguments for retrieving subdomains.
   * @param args.accountAddress - The address to retrieve subdomain names for.
   * @param args.options - Optional parameters for fetching subdomains.
   * @param args.options.offset - The offset to start from when fetching names.
   * @param args.options.limit - The number of names to fetch per request.
   * @param args.options.orderBy - The order to sort the names by.
   * @param args.options.where - Additional filters to apply to the query.
   *
   * @returns A promise of an array of ANSName.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *     // Fetching subdomain names for a specific account
   *     const subdomains = await aptos.getAccountSubdomains({
   *         accountAddress: "0x1", // replace with a real account address
   *         options: {
   *             limit: 10, // specify the number of subdomains to fetch
   *             offset: 0, // specify the offset for pagination
   *             orderBy: "name", // specify the order by which to sort the names
   *         },
   *     });
   *
   *     console.log(subdomains);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getAccountSubdomains(args: GetAccountSubdomainsArgs): Promise<GetANSNameResponse> {
    return getAccountSubdomains({ aptosConfig: this.config, ...args });
  }

  /**
   * Fetches all subdomain names for a given domain, excluding the domain itself.
   *
   * @param args - The arguments for fetching subdomains.
   * @param args.domain - A string of the domain name, e.g., "test.apt" or "test" (without the suffix of .apt).
   * @param args.options - Optional parameters for fetching subdomains.
   * @param args.options.offset - Optional, the offset to start from when fetching names.
   * @param args.options.limit - Optional, the number of names to fetch per request.
   * @param args.options.orderBy - The order to sort the names by.
   * @param args.options.where - Additional filters to apply to the query.
   *
   * @returns A promise that resolves to an array of ANSName.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * const config = new AptosConfig({ network: Network.TESTNET });
   * const aptos = new Aptos(config);
   *
   * async function runExample() {
   *   // Fetching subdomains for a specific domain
   *   const subdomains = await aptos.getDomainSubdomains({
   *     domain: "test", // replace with your domain
   *     options: {
   *       limit: 10, // specify the number of subdomains to fetch
   *       offset: 0, // specify the starting point for fetching
   *       orderBy: "name", // specify the order by which to sort the results
   *     },
   *   });
   *
   *   console.log(subdomains);
   * }
   * runExample().catch(console.error);
   * ```
   */
  async getDomainSubdomains(args: GetDomainSubdomainsArgs): Promise<GetANSNameResponse> {
    return getDomainSubdomains({ aptosConfig: this.config, ...args });
  }
}
