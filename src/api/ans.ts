// Copyright © Cedra Foundation
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
import { CedraConfig } from "./cedraConfig";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";

/**
 * A class to handle all `ANS` operations.
 * @group ANS
 */
export class ANS {
  /**
   * Initializes a new instance of the Cedra class with the provided configuration.
   * This allows you to interact with the Cedra blockchain using the specified network settings.
   *
   * @param config - The configuration settings for the Cedra client.
   * @param config.network - The network to connect to (e.g., mainnet, testnet).
   * @param config.nodeUrl - The URL of the Cedra node to connect to.
   * @param config.faucetUrl - The URL of the faucet to use for funding accounts.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for connecting to the Cedra testnet
   *     const config = new CedraConfig({ network: Network.TESTNET });
   *
   *     // Initialize the Cedra client with the configuration
   *     const cedra = new Cedra(config);
   *
   *     console.log("Cedra client initialized:", cedra);
   * }
   * runExample().catch(console.error);
   * ```
   * @group ANS
   */
  constructor(readonly config: CedraConfig) {}

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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Retrieve the owner address of "test.cedra"
   *   const owner = await cedra.getOwnerAddress({ name: "test.cedra" });
   *   console.log(owner); // Logs the owner address or undefined if not owned
   * }
   * runExample().catch(console.error);
   * ```
   * @group ANS
   */
  async getOwnerAddress(args: { name: string }): Promise<AccountAddress | undefined> {
    return getOwnerAddress({ cedraConfig: this.config, ...args });
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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Get the expiration time for the domain "test.cedra"
   *   const exp = await cedra.getExpiration({ name: "test.cedra" });
   *
   *   // Log the expiration date
   *   console.log(new Date(exp)); // Outputs the expiration date
   * }
   * runExample().catch(console.error);
   * ```
   * @group ANS
   */
  async getExpiration(args: { name: string }): Promise<number | undefined> {
    return getExpiration({ cedraConfig: this.config, ...args });
  }

  /**
   * Retrieve the target address of a domain or subdomain name, which indicates the address the name points to for use on-chain.
   * Note that the target address can point to addresses that do not own the name.
   *
   * @param args - The arguments for retrieving the target address.
   * @param args.name - A string representing the name, which can be a primary name, a subdomain, or a combination (e.g.,
   * "primary", "primary.cedra", "secondary.primary", "secondary.primary.cedra").
   *
   * @returns AccountAddress if the name has a target, undefined otherwise.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Retrieve the target address for the specified domain name
   *   const targetAddr = await cedra.getTargetAddress({ name: "test.cedra" });
   *
   *   console.log(targetAddr); // Logs the target address, e.g., 0x123...
   * }
   * runExample().catch(console.error);
   * ```
   * @group ANS
   */
  async getTargetAddress(args: { name: string }): Promise<AccountAddress | undefined> {
    return getTargetAddress({ cedraConfig: this.config, ...args });
  }

  /**
   * Sets the target address of a domain or subdomain name, pointing it to a specified address for use on-chain.
   * The target address can be different from the owner of the name.
   *
   * @param args - The arguments for setting the target address.
   * @param args.sender - The account initiating the transaction.
   * @param args.name - A string representing the domain or subdomain name (e.g., "test.cedra").
   * @param args.address - The AccountAddressInput of the address to set the domain or subdomain to.
   * @param args.options - Optional settings for generating the transaction.
   *
   * @returns SimpleTransaction
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Setting the target address for a domain name
   *   const sender = Account.generate(); // replace with a real account
   *   const address = "0x1"; // replace with a real account address
   *
   *   await cedra.setTargetAddress({
   *     sender: sender,
   *     name: "test.cedra",
   *     address: address,
   *   });
   *
   *   const targetAddress = await cedra.getTargetAddress({ name: "test.cedra" });
   *   console.log(targetAddress); // Should log the address set for "test.cedra"
   * }
   * runExample().catch(console.error);
   * ```
   * @group ANS
   */
  async setTargetAddress(args: {
    sender: Account;
    name: string;
    address: AccountAddressInput;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return setTargetAddress({ cedraConfig: this.config, ...args });
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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Retrieve the primary name for the specified account address
   *   const name = await cedra.getPrimaryName({ address: "0x1" }); // replace with a real account address
   *   console.log(name);
   * }
   * runExample().catch(console.error);
   * ```
   * @group ANS
   */
  async getPrimaryName(args: { address: AccountAddressInput }): Promise<string | undefined> {
    return getPrimaryName({ cedraConfig: this.config, ...args });
  }

  /**
   * Sets the primary name for the sender account, allowing them to designate a single primary name among potentially multiple
   * names. An account may not have a primary name.
   *
   * @param args - The arguments for setting the primary name.
   * @param args.sender - The sender account.
   * @param args.name - A string representing the name to set as primary (e.g., "test.cedra").
   * @param args.options - Optional transaction options.
   *
   * @returns SimpleTransaction
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Set the primary name for the sender account
   *   const sender = Account.generate(); // replace with a real account
   *   await cedra.setPrimaryName({ sender, name: "test.cedra" });
   *
   *   const primaryName = await cedra.getPrimaryName({ address: sender.accountAddress });
   *   console.log("Primary Name:", primaryName); // Should log: "Primary Name: test.cedra"
   * }
   * runExample().catch(console.error);
   * ```
   * @group ANS
   */
  async setPrimaryName(args: {
    sender: Account;
    name?: string;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return setPrimaryName({ cedraConfig: this.config, ...args });
  }

  /**
   * Registers a new name.
   *
   * This function allows you to register a domain or subdomain name with specific expiration policies and options.
   *
   * @param args.sender - The sender account.
   * @param args.name - A string of the name to register. This can be inclusive or exclusive of the .cedra suffix. Examples include:
   * "test", "test.cedra", "test.cedra.cedra", etc.
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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Registering a subdomain name assuming def.cedra is already registered and belongs to the sender alice.
   *   const txn = await cedra.registerName({
   *     sender: "0x1", // replace with a real sender account
   *     name: "test.cedra.cedra",
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
   * @group ANS
   */
  async registerName(args: Omit<RegisterNameParameters, "cedraConfig">): Promise<SimpleTransaction> {
    return registerName({ cedraConfig: this.config, ...args });
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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Renew the domain "test" for one year
   *   const transaction = await cedra.renewDomain({
   *     sender: Account.generate(), // replace with a real account
   *     name: "test"
   *   });
   *
   *   console.log(transaction);
   * }
   * runExample().catch(console.error);
   * ```
   * @group ANS
   */
  async renewDomain(args: {
    sender: Account;
    name: string;
    years?: 1;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return renewDomain({ cedraConfig: this.config, ...args });
  }

  /**
   * Fetches a single name from the indexer based on the provided name argument.
   *
   * @param args - The arguments for retrieving the name.
   * @param args.name - A string of the name to retrieve, e.g. "test.cedra.cedra" or "test.cedra" or "test".
   *                    Can be inclusive or exclusive of the .cedra suffix and can be a subdomain.
   *
   * @returns A promise of an ANSName or undefined if the name is not active.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *     // Fetching a name from the indexer
   *     const name = await cedra.getName({ name: "test.cedra" }); // replace with a real name
   *     console.log(name);
   * }
   * runExample().catch(console.error);
   * ```
   * @group ANS
   */
  async getName(args: { name: string }): Promise<GetANSNameResponse[0] | undefined> {
    return getName({ cedraConfig: this.config, ...args });
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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Fetch account names for a specific address
   *   const accountNames = await cedra.getAccountNames({
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
   * @group ANS
   */
  async getAccountNames(args: GetAccountNamesArgs): Promise<GetANSNameResponse> {
    return getAccountNames({ cedraConfig: this.config, ...args });
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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Fetching all top-level domain names for a specific account
   *   const domains = await cedra.getAccountDomains({
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
   * @group ANS
   */
  async getAccountDomains(args: GetAccountDomainsArgs): Promise<GetANSNameResponse> {
    return getAccountDomains({ cedraConfig: this.config, ...args });
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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *     // Fetching subdomain names for a specific account
   *     const subdomains = await cedra.getAccountSubdomains({
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
   * @group ANS
   */
  async getAccountSubdomains(args: GetAccountSubdomainsArgs): Promise<GetANSNameResponse> {
    return getAccountSubdomains({ cedraConfig: this.config, ...args });
  }

  /**
   * Fetches all subdomain names for a given domain, excluding the domain itself.
   *
   * @param args - The arguments for fetching subdomains.
   * @param args.domain - A string of the domain name, e.g., "test.cedra" or "test" (without the suffix of .cedra).
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
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Fetching subdomains for a specific domain
   *   const subdomains = await cedra.getDomainSubdomains({
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
   * @group ANS
   */
  async getDomainSubdomains(args: GetDomainSubdomainsArgs): Promise<GetANSNameResponse> {
    return getDomainSubdomains({ cedraConfig: this.config, ...args });
  }
}
