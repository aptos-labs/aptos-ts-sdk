// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/name}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * name namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { Account } from "../account";
import { AccountAddress, AccountAddressInput } from "../core";
import { InputGenerateTransactionOptions } from "../transactions/types";
import { GetANSNameResponse, MoveAddressType, OrderByArg, PaginationArgs, WhereArg } from "../types";
import { GetNamesQuery } from "../types/generated/operations";
import { GetNames } from "../types/generated/queries";
import { CurrentAptosNamesBoolExp } from "../types/generated/types";
import { Network } from "../utils/apiEndpoints";
import { queryIndexer } from "./general";
import { view } from "./view";
import { generateTransaction } from "./transactionSubmission";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";

export const VALIDATION_RULES_DESCRIPTION = [
  "A name must be between 3 and 63 characters long,",
  "and can only contain lowercase a-z, 0-9, and hyphens.",
  "A name may not start or end with a hyphen.",
].join(" ");

/**
 *
 * @param fragment A fragment of a name, either the domain or subdomain
 * @returns boolean indicating if the fragment is a valid fragment
 */
export function isValidANSSegment(fragment: string): boolean {
  if (!fragment) return false;
  if (fragment.length < 3) return false;
  if (fragment.length > 63) return false;
  // only lowercase a-z and 0-9 are allowed, along with -. a domain may not start or end with a hyphen
  if (!/^[a-z\d][a-z\d-]{1,61}[a-z\d]$/.test(fragment)) return false;
  return true;
}

/**
 * Checks if an ANS name is valid or not
 *
 * @param name A string of the domain name, can include or exclude the .apt suffix
 */
export function isValidANSName(name: string): { domainName: string; subdomainName?: string } {
  const [first, second, ...rest] = name.replace(/\.apt$/, "").split(".");

  if (rest.length > 0) {
    throw new Error(`${name} is invalid. A name can only have two parts, a domain and a subdomain separated by a "."`);
  }

  if (!isValidANSSegment(first)) {
    throw new Error(`${first} is not valid. ${VALIDATION_RULES_DESCRIPTION}`);
  }

  if (second && !isValidANSSegment(second)) {
    throw new Error(`${second} is not valid. ${VALIDATION_RULES_DESCRIPTION}`);
  }

  return {
    domainName: second || first,
    subdomainName: second ? first : undefined,
  };
}

export enum SubdomainExpirationPolicy {
  Independent = 0,
  FollowsDomain = 1,
}

/**
 * A helper function to determine if a given ANS name is considered active or
 * not. Domains are considered active if their expiration date is in the
 * future. Subdomains have two policies which modify their behavior. They can
 * follow their parent's expiration (1) in which they ignore their own
 * expiration timestamp or they can expire independently (0) in which they can
 * expire before their parent but not afterwards.
 *
 * @param name - An ANS name returned from one of the functions of the SDK
 * @returns A boolean representing if the contract considers the name active or not
 */
export function isActiveANSName(name: GetANSNameResponse[0]): boolean {
  if (!name) return false;

  const isTLDExpired = new Date(name.domain_expiration_timestamp).getTime() < Date.now();
  const isExpired = new Date(name.expiration_timestamp).getTime() < Date.now();

  // If we are a subdomain, if our parent is expired we are always expired
  if (name.subdomain && isTLDExpired) return false;

  // If we are a subdomain and our expiration policy is to follow the domain, we
  // are active (since we know our parent is not expired by this point)
  if (name.subdomain && name.subdomain_expiration_policy === SubdomainExpirationPolicy.FollowsDomain) return true;

  // At this point, we are either a TLD or a subdomain with an independent
  // expiration policy, we are active as long as we the expiration timestamp
  return !isExpired;
}

export const LOCAL_ANS_ACCOUNT_PK =
  process.env.ANS_TEST_ACCOUNT_PRIVATE_KEY ?? "0x37368b46ce665362562c6d1d4ec01a08c8644c488690df5a17e13ba163e20221";
export const LOCAL_ANS_ACCOUNT_ADDRESS =
  process.env.ANS_TEST_ACCOUNT_ADDRESS ?? "0x585fc9f0f0c54183b039ffc770ca282ebd87307916c215a3e692f2f8e4305e82";

const NetworkToAnsContract: Record<Network, string | null> = {
  [Network.TESTNET]: "0x5f8fd2347449685cf41d4db97926ec3a096eaf381332be4f1318ad4d16a8497c",
  [Network.MAINNET]: "0x867ed1f6bf916171b1de3ee92849b8978b7d1b9e0a8cc982a3d19d535dfd9c0c",
  [Network.LOCAL]: LOCAL_ANS_ACCOUNT_ADDRESS,
  [Network.CUSTOM]: null,
  [Network.DEVNET]: null,
};

function getRouterAddress(aptosConfig: AptosConfig): string {
  const address = NetworkToAnsContract[aptosConfig.network];
  if (!address) throw new Error(`The ANS contract is not deployed to ${aptosConfig.network}`);
  return address;
}

const unwrapOption = <T>(option: any): T | undefined => {
  if (!!option && typeof option === "object" && "vec" in option && Array.isArray(option.vec)) {
    return option.vec[0];
  }

  return undefined;
};

export async

/**
 * Retrieves the owner address for a specified domain or subdomain name.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.name - The domain or subdomain name to query.
 * @returns The owner address of the specified domain or subdomain, or undefined if not found.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch the owner address for a given domain name
 *   const ownerAddress = await aptos.ans.getOwnerAddress({
 *     aptosConfig: config,
 *     name: "example.apt"
 *   });
 * 
 *   console.log("Owner Address:", ownerAddress?.toString());
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getOwnerAddress(args: {
  aptosConfig: AptosConfig;
  name: string;
}): Promise<AccountAddress | undefined> {
  const { aptosConfig, name } = args;
  const routerAddress = getRouterAddress(aptosConfig);
  const { domainName, subdomainName } = isValidANSName(name);

  const res = await view({
    aptosConfig,
    payload: {
      function: `${routerAddress}::router::get_owner_addr`,
      functionArguments: [domainName, subdomainName],
    },
  });

  const owner = unwrapOption<MoveAddressType>(res[0]);

  return owner ? AccountAddress.from(owner) : undefined;
}

export interface RegisterNameParameters {
  aptosConfig: AptosConfig;
  sender: Account;
  name: string;
  expiration:
    | { policy: "domain"; years?: 1 }
    | { policy: "subdomain:follow-domain" }
    | { policy: "subdomain:independent"; expirationDate: number };
  transferable?: boolean;
  toAddress?: AccountAddressInput;
  targetAddress?: AccountAddressInput;
  options?: InputGenerateTransactionOptions;
}

export async

/**
 * Registers a domain name or subdomain on the Aptos blockchain.
 * This function allows users to register a new domain or subdomain with specified expiration policies and transferability options.
 * 
 * @param args - The parameters for registering the name.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.expiration - The expiration details for the name registration.
 * @param args.expiration.policy - The policy for expiration, which can be "domain", "subdomain:independent", or "subdomain:follow-domain".
 * @param args.expiration.years - The number of years for which the domain is registered (only applicable for domain registrations).
 * @param args.expiration.expirationDate - The expiration date in milliseconds since epoch (used for subdomains).
 * @param args.name - The name to be registered, which can be a domain or a subdomain.
 * @param args.sender - The account initiating the registration.
 * @param args.targetAddress - The target address for the registration.
 * @param args.toAddress - The address to which the name will be transferred.
 * @param args.options - Additional options for the transaction.
 * @param args.transferable - Indicates whether the name can be transferred.
 * 
 * @returns A transaction object for the registration.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const sender = { accountAddress: "0x1" }; // replace with a real account address
 *   const args = {
 *     aptosConfig: config,
 *     expiration: {
 *       policy: "domain",
 *       years: 1,
 *     },
 *     name: "example.apt",
 *     sender,
 *     targetAddress: "0x2", // replace with a real target address
 *     toAddress: "0x3", // replace with a real address for transfer
 *     options: {},
 *     transferable: true,
 *   };
 * 
 *   // Registering a domain name
 *   const transaction = await aptos.registerName(args);
 *   console.log("Transaction registered:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function registerName(args: RegisterNameParameters): Promise<SimpleTransaction> {
  const { aptosConfig, expiration, name, sender, targetAddress, toAddress, options, transferable } = args;
  const routerAddress = getRouterAddress(aptosConfig);
  const { domainName, subdomainName } = isValidANSName(name);

  const hasSubdomainPolicy =
    expiration.policy === "subdomain:independent" || expiration.policy === "subdomain:follow-domain";

  if (subdomainName && !hasSubdomainPolicy) {
    throw new Error(
      "Subdomains must have an expiration policy of either 'subdomain:independent' or 'subdomain:follow-domain'",
    );
  }

  if (hasSubdomainPolicy && !subdomainName) {
    throw new Error(`Policy is set to ${expiration.policy} but no subdomain was provided`);
  }

  if (expiration.policy === "domain") {
    const years = expiration.years ?? 1;
    if (years !== 1) {
      throw new Error("For now, names can only be registered for 1 year at a time");
    }

    const secondsInYear = 31536000;
    const registrationDuration = years * secondsInYear;

    const transaction = await generateTransaction({
      aptosConfig,
      sender: sender.accountAddress.toString(),
      data: {
        function: `${routerAddress}::router::register_domain`,
        functionArguments: [domainName, registrationDuration, targetAddress, toAddress],
      },
      options,
    });

    return transaction;
  }

  // We are a subdomain
  if (!subdomainName) {
    throw new Error(`${expiration.policy} requires a subdomain to be provided.`);
  }

  const tldExpiration = await getExpiration({ aptosConfig, name: domainName });
  if (!tldExpiration) {
    throw new Error("The domain does not exist");
  }

  const expirationDateInMillisecondsSinceEpoch =
    expiration.policy === "subdomain:independent" ? expiration.expirationDate : tldExpiration;

  if (expirationDateInMillisecondsSinceEpoch > tldExpiration) {
    throw new Error("The subdomain expiration time cannot be greater than the domain expiration time");
  }

  const transaction = await generateTransaction({
    aptosConfig,
    sender: sender.accountAddress.toString(),
    data: {
      function: `${routerAddress}::router::register_subdomain`,
      functionArguments: [
        domainName,
        subdomainName,
        Math.round(expirationDateInMillisecondsSinceEpoch / 1000),
        expiration.policy === "subdomain:follow-domain" ? 1 : 0,
        !!transferable,
        targetAddress,
        toAddress,
      ],
    },
    options,
  });

  return transaction;
}

export async

/**
 * Retrieves the expiration time of a specified domain name in epoch milliseconds.
 * 
 * @param args - The arguments for retrieving the expiration.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.name - The name of the domain whose expiration is being queried.
 * @returns The expiration time in epoch milliseconds, or undefined if an error occurs.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch the expiration time for a domain name
 *   const expirationTime = await aptos.ans.getExpiration({
 *     aptosConfig: config,
 *     name: "example.apt"
 *   });
 * 
 *   console.log("Expiration Time:", expirationTime);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getExpiration(args: { aptosConfig: AptosConfig; name: string }): Promise<number | undefined> {
  const { aptosConfig, name } = args;
  const routerAddress = getRouterAddress(aptosConfig);
  const { domainName, subdomainName } = isValidANSName(name);

  try {
    const res = await view({
      aptosConfig,
      payload: {
        function: `${routerAddress}::router::get_expiration`,
        functionArguments: [domainName, subdomainName],
      },
    });

    // Normalize expiration time from epoch seconds to epoch milliseconds
    return Number(res[0]) * 1000;
  } catch (e) {
    return undefined;
  }
}

export async

/**
 * Retrieves the primary name associated with a given account address.
 * This function helps you obtain the primary domain name and subdomain name for an account.
 * 
 * @param args - The arguments for retrieving the primary name.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.address - The account address for which to retrieve the primary name.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const primaryName = await aptos.ans.getPrimaryName({
 *     aptosConfig: config,
 *     address: "0x1" // replace with a real account address
 *   });
 * 
 *   console.log("Primary Name:", primaryName);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getPrimaryName(args: {
  aptosConfig: AptosConfig;
  address: AccountAddressInput;
}): Promise<string | undefined> {
  const { aptosConfig, address } = args;
  const routerAddress = getRouterAddress(aptosConfig);

  const res = await view({
    aptosConfig,
    payload: {
      function: `${routerAddress}::router::get_primary_name`,
      functionArguments: [AccountAddress.from(address).toString()],
    },
  });

  const domainName = unwrapOption<MoveAddressType>(res[1]);
  const subdomainName = unwrapOption<MoveAddressType>(res[0]);

  if (!domainName) return undefined;

  return [subdomainName, domainName].filter(Boolean).join(".");
}

export async

/**
 * Sets the primary name for the specified account or clears it if no name is provided.
 * This function allows you to manage the primary name associated with an account in the Aptos network.
 * 
 * @param args - The arguments for setting the primary name.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.sender - The account that will be sending the transaction.
 * @param args.name - The name to set as the primary name. If omitted, the primary name will be cleared.
 * @param args.options - Optional parameters for generating the transaction.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const sender = Account.generate(); // Generate a new account for the example
 * 
 * async function runExample() {
 *   // Setting a primary name for the account
 *   const transaction = await aptos.setPrimaryName({
 *     aptosConfig: config,
 *     sender: sender,
 *     name: "example.apt", // Specify your desired primary name
 *   });
 * 
 *   console.log("Transaction sent:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function setPrimaryName(args: {
  aptosConfig: AptosConfig;
  sender: Account;
  name?: string;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, sender, name, options } = args;
  const routerAddress = getRouterAddress(aptosConfig);

  if (!name) {
    const transaction = await generateTransaction({
      aptosConfig,
      sender: sender.accountAddress.toString(),
      data: {
        function: `${routerAddress}::router::clear_primary_name`,
        functionArguments: [],
      },
      options,
    });

    return transaction;
  }

  const { domainName, subdomainName } = isValidANSName(name);

  const transaction = await generateTransaction({
    aptosConfig,
    sender: sender.accountAddress.toString(),
    data: {
      function: `${routerAddress}::router::set_primary_name`,
      functionArguments: [domainName, subdomainName],
    },
    options,
  });

  return transaction;
}

export async

/**
 * Retrieves the target address associated with a given domain name and subdomain name.
 * 
 * @param args - The arguments for retrieving the target address.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.name - The name which includes the domain and optional subdomain.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve the target address for a specific domain name
 *   const targetAddress = await aptos.getTargetAddress({
 *     aptosConfig: config,
 *     name: "example.test" // replace with a real domain name
 *   });
 * 
 *   console.log("Target Address:", targetAddress?.toString());
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getTargetAddress(args: {
  aptosConfig: AptosConfig;
  name: string;
}): Promise<AccountAddress | undefined> {
  const { aptosConfig, name } = args;
  const routerAddress = getRouterAddress(aptosConfig);
  const { domainName, subdomainName } = isValidANSName(name);

  const res = await view({
    aptosConfig,
    payload: {
      function: `${routerAddress}::router::get_target_addr`,
      functionArguments: [domainName, subdomainName],
    },
  });

  const target = unwrapOption<MoveAddressType>(res[0]);
  return target ? AccountAddress.from(target) : undefined;
}

export async

/**
 * Sets the target address for a specified domain and subdomain name in the Aptos network.
 * This function allows you to associate a target address with a domain and subdomain, enabling routing to the specified address.
 * 
 * @param args - The parameters required to set the target address.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.sender - The account that is sending the transaction.
 * @param args.name - The domain name to be set.
 * @param args.address - The target address to associate with the domain name.
 * @param args.options - Optional parameters for generating the transaction.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const sender = Account.generate(); // Generate a new account for sending the transaction
 * const domainName = "example"; // Specify your domain name
 * const targetAddress = "0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"; // replace with a real address
 * 
 * async function runExample() {
 *   const transaction = await aptos.setTargetAddress({
 *     aptosConfig: config,
 *     sender: sender,
 *     name: domainName,
 *     address: targetAddress,
 *   });
 * 
 *   console.log("Transaction submitted:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function setTargetAddress(args: {
  aptosConfig: AptosConfig;
  sender: Account;
  name: string;
  address: AccountAddressInput;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, sender, name, address, options } = args;
  const routerAddress = getRouterAddress(aptosConfig);
  const { domainName, subdomainName } = isValidANSName(name);

  const transaction = await generateTransaction({
    aptosConfig,
    sender: sender.accountAddress.toString(),
    data: {
      function: `${routerAddress}::router::set_target_addr`,
      functionArguments: [domainName, subdomainName, address],
    },
    options,
  });

  return transaction;
}

export async

/**
 * Retrieves the active Aptos name associated with the specified domain and subdomain.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for Aptos, which includes network settings.
 * @param args.name - The full name to query, which may include a domain and subdomain.
 * 
 * @returns The active Aptos name if found, otherwise undefined.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve the active Aptos name for the specified domain and subdomain
 *   const name = await aptos.getName({
 *     aptosConfig: config,
 *     name: "example.apt"
 *   });
 * 
 *   console.log(name); // Output the retrieved name
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getName(args: {
  aptosConfig: AptosConfig;
  name: string;
}): Promise<GetANSNameResponse[0] | undefined> {
  const { aptosConfig, name } = args;
  const { domainName, subdomainName = "" } = isValidANSName(name);

  const where: CurrentAptosNamesBoolExp = {
    domain: { _eq: domainName },
    subdomain: { _eq: subdomainName },
  };

  const data = await queryIndexer<GetNamesQuery>({
    aptosConfig,
    query: {
      query: GetNames,
      variables: {
        where_condition: where,
        limit: 1,
      },
    },
    originMethod: "getName",
  });

  // Convert the expiration_timestamp from an ISO string to milliseconds since epoch
  let res = data.current_aptos_names[0];
  if (res) {
    res = sanitizeANSName(res);
  }

  return isActiveANSName(res) ? res : undefined;
}

interface QueryNamesOptions {
  options?: PaginationArgs & OrderByArg<GetANSNameResponse[0]> & WhereArg<CurrentAptosNamesBoolExp>;
}

export interface GetAccountNamesArgs extends QueryNamesOptions {
  accountAddress: AccountAddressInput;
}

export async

/**
 * Retrieves the current Aptos names associated with a specified account address.
 * This function allows users to query the names owned by a specific account, filtered by expiration date.
 * 
 * @param args - The arguments for retrieving account names.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account for which to retrieve names.
 * @param args.options - Optional parameters for querying names.
 * @param args.options.limit - The maximum number of names to return.
 * @param args.options.offset - The number of names to skip before starting to collect the result set.
 * @param args.options.orderBy - The order in which to return the names.
 * @param args.options.where - Additional filtering conditions for the query.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const accountAddress = "0x1"; // replace with a real account address
 *   const names = await aptos.getAccountNames({
 *     aptosConfig: config,
 *     accountAddress,
 *     options: {
 *       limit: 10, // specify the limit as needed
 *       orderBy: "created_at", // specify the order as needed
 *     },
 *   });
 * 
 *   console.log(names);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountNames(
  args: { aptosConfig: AptosConfig } & GetAccountNamesArgs,
): Promise<GetANSNameResponse> {
  const { aptosConfig, options, accountAddress } = args;

  const expirationDate = await getANSExpirationDate({ aptosConfig });

  const data = await queryIndexer<GetNamesQuery>({
    aptosConfig,
    originMethod: "getAccountNames",
    query: {
      query: GetNames,
      variables: {
        limit: options?.limit,
        offset: options?.offset,
        order_by: options?.orderBy,
        where_condition: {
          ...(args.options?.where ?? {}),
          owner_address: { _eq: accountAddress.toString() },
          expiration_timestamp: { _gte: expirationDate },
        },
      },
    },
  });

  return data.current_aptos_names.map(sanitizeANSName);
}

export interface GetAccountDomainsArgs extends QueryNamesOptions {
  accountAddress: AccountAddressInput;
}

export async

/**
 * Retrieves the domains associated with a specific account address.
 * This function allows you to query the domains owned by an account that are not expired.
 * 
 * @param args - The arguments for retrieving account domains.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.accountAddress - The address of the account whose domains are being queried.
 * @param args.options - Optional parameters for pagination and filtering.
 * @param args.options.limit - The maximum number of domains to retrieve.
 * @param args.options.offset - The number of domains to skip before starting to collect the result set.
 * @param args.options.orderBy - The field by which to order the results.
 * @param args.options.where - Additional conditions to filter the domains.
 * 
 * @returns An array of sanitized domain names owned by the specified account.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve domains for a specific account address
 *   const accountAddress = "0x1"; // replace with a real account address
 *   const domains = await aptos.getAccountDomains({
 *     aptosConfig: config,
 *     accountAddress,
 *     options: {
 *       limit: 10, // specify the number of domains to retrieve
 *       orderBy: "name", // specify the field to order by
 *     },
 *   });
 * 
 *   console.log(domains);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountDomains(
  args: { aptosConfig: AptosConfig } & GetAccountDomainsArgs,
): Promise<GetANSNameResponse> {
  const { aptosConfig, options, accountAddress } = args;

  const expirationDate = await getANSExpirationDate({ aptosConfig });

  const data = await queryIndexer<GetNamesQuery>({
    aptosConfig,
    originMethod: "getAccountDomains",
    query: {
      query: GetNames,
      variables: {
        limit: options?.limit,
        offset: options?.offset,
        order_by: options?.orderBy,
        where_condition: {
          ...(args.options?.where ?? {}),
          owner_address: { _eq: accountAddress.toString() },
          expiration_timestamp: { _gte: expirationDate },
          subdomain: { _eq: "" },
        },
      },
    },
  });

  return data.current_aptos_names.map(sanitizeANSName);
}

export interface GetAccountSubdomainsArgs extends QueryNamesOptions {
  accountAddress: AccountAddressInput;
}

export async

/**
 * Retrieves the subdomains associated with a specified account address.
 * This function helps you to identify all subdomains owned by a particular account that are not expired.
 * 
 * @param args - The arguments for retrieving account subdomains.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * @param args.options - Optional parameters for pagination and filtering.
 * @param args.options.limit - The maximum number of subdomains to retrieve.
 * @param args.options.offset - The number of subdomains to skip before starting to collect the result set.
 * @param args.options.orderBy - The field by which to order the results.
 * @param args.options.where - Additional filtering conditions for the query.
 * @param args.accountAddress - The account address for which to retrieve subdomains.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve subdomains for a specific account
 *   const subdomains = await aptos.getAccountSubdomains({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *     options: {
 *       limit: 10, // specify the maximum number of subdomains to retrieve
 *       orderBy: "created_at", // specify the field to order by
 *     },
 *   });
 * 
 *   console.log(subdomains);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountSubdomains(
  args: { aptosConfig: AptosConfig } & GetAccountSubdomainsArgs,
): Promise<GetANSNameResponse> {
  const { aptosConfig, options, accountAddress } = args;

  const expirationDate = await getANSExpirationDate({ aptosConfig });

  const data = await queryIndexer<GetNamesQuery>({
    aptosConfig,
    originMethod: "getAccountSubdomains",
    query: {
      query: GetNames,
      variables: {
        limit: options?.limit,
        offset: options?.offset,
        order_by: options?.orderBy,
        where_condition: {
          ...(args.options?.where ?? {}),
          owner_address: { _eq: accountAddress.toString() },
          expiration_timestamp: { _gte: expirationDate },
          subdomain: { _neq: "" },
        },
      },
    },
  });

  return data.current_aptos_names.map(sanitizeANSName);
}

export interface GetDomainSubdomainsArgs extends QueryNamesOptions {
  domain: string;
}

export async

/**
 * Retrieves the subdomains associated with a specified domain.
 * This function helps you to find all active subdomains under a given domain.
 * 
 * @param args - The arguments for fetching subdomains.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.domain - The domain for which to retrieve subdomains.
 * @param args.options - Optional parameters for pagination and filtering.
 * @param args.options.limit - The maximum number of subdomains to return.
 * @param args.options.offset - The number of subdomains to skip before starting to collect the result set.
 * @param args.options.orderBy - The field by which to order the results.
 * @param args.options.where - Additional conditions to filter the results.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch subdomains for the specified domain
 *   const subdomains = await aptos.getDomainSubdomains({
 *     aptosConfig: config,
 *     domain: "example.apt",
 *     options: {
 *       limit: 10, // Specify the maximum number of subdomains to return
 *       offset: 0, // Start from the first subdomain
 *       orderBy: "created_at", // Order by creation date
 *     },
 *   });
 * 
 *   console.log(subdomains); // Output the retrieved subdomains
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getDomainSubdomains(
  args: { aptosConfig: AptosConfig } & GetDomainSubdomainsArgs,
): Promise<GetANSNameResponse> {
  const { aptosConfig, options, domain } = args;

  const data = await queryIndexer<GetNamesQuery>({
    aptosConfig,
    originMethod: "getDomainSubdomains",
    query: {
      query: GetNames,
      variables: {
        limit: options?.limit,
        offset: options?.offset,
        order_by: options?.orderBy,
        where_condition: {
          ...(args.options?.where ?? {}),
          domain: { _eq: domain },
          subdomain: { _neq: "" },
        },
      },
    },
  });

  return data.current_aptos_names.map(sanitizeANSName).filter(isActiveANSName);
}

/**
 * This function returns the expiration date in which a name is fully expired as
 * defined by the contract.  The grace period allows for names to be past
 * expiration for a certain amount of time before they are released to the
 * public. The names will not function as normal, but the owner can renew
 * without others taking ownership of the name. At the time of writing, the
 * contract specified 30 days.
 *
 * @param args.aptosConfig an AptosConfig object
 * @returns
 */
async

/**
 * Retrieves the expiration date for a name based on the contract's defined grace period. 
 * The grace period allows names to remain in a non-functional state for a specified duration 
 * after expiration, during which the owner can renew the name without risk of losing it.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - An AptosConfig object containing network configuration.
 * @returns The expiration date in ISO format.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Get the expiration date for a name
 *   const expirationDate = await aptos.getANSExpirationDate({ aptosConfig: config });
 * 
 *   console.log("Expiration Date:", expirationDate);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getANSExpirationDate(args: { aptosConfig: AptosConfig }): Promise<string> {
  const { aptosConfig } = args;
  const routerAddress = getRouterAddress(aptosConfig);

  const [gracePeriodInSeconds] = await view<[number]>({
    aptosConfig,
    payload: {
      function: `${routerAddress}::config::reregistration_grace_sec`,
      functionArguments: [],
    },
  });

  const gracePeriodInDays = gracePeriodInSeconds / 60 / 60 / 24;
  const now = () => new Date();
  return new Date(now().setDate(now().getDate() - gracePeriodInDays)).toISOString();
}

export async

/**
 * Renews a domain for a specified number of years. Currently, only 1-year renewals are supported.
 * 
 * @param args - The arguments for renewing the domain.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.sender - The account that is sending the renewal request.
 * @param args.name - The name of the domain to renew.
 * @param args.years - The number of years to renew the domain for (default is 1).
 * @param args.options - Additional options for generating the transaction.
 * @throws Error if attempting to renew a subdomain or if years is not equal to 1.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const sender = Account.generate(); // Generate a new account for sending the renewal
 * 
 * async function runExample() {
 *   const transaction = await aptos.renewDomain({
 *     aptosConfig: config,
 *     sender: sender,
 *     name: "example.ans", // Specify the domain name to renew
 *   });
 * 
 *   console.log("Transaction for renewing domain:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function renewDomain(args: {
  aptosConfig: AptosConfig;
  sender: Account;
  name: string;
  years?: 1;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, sender, name, years = 1, options } = args;
  const routerAddress = getRouterAddress(aptosConfig);
  const renewalDuration = years * 31536000;
  const { domainName, subdomainName } = isValidANSName(name);

  if (subdomainName) {
    throw new Error("Subdomains cannot be renewed");
  }

  if (years !== 1) {
    throw new Error("Currently, only 1 year renewals are supported");
  }

  const transaction = await generateTransaction({
    aptosConfig,
    sender: sender.accountAddress.toString(),
    data: {
      function: `${routerAddress}::router::renew_domain`,
      functionArguments: [domainName, renewalDuration],
    },
    options,
  });

  return transaction;
}

/**
 * The indexer returns ISO strings for expiration, however the contract works in
 * epoch milliseconds. This function converts the ISO string to epoch
 * milliseconds. In the future, if other properties need sanitization, this can
 * be extended.
 */
function sanitizeANSName(name: GetANSNameResponse[0]): GetANSNameResponse[0] {
  return {
    ...name,
    expiration_timestamp: new Date(name.expiration_timestamp).getTime(),
  };
}