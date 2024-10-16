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
 * Validate if a given fragment is a valid ANS segment.
 * This function checks the length and character constraints of the fragment to ensure it meets the ANS standards.
 *
 * @param fragment - A fragment of a name, either the domain or subdomain.
 * @returns A boolean indicating if the fragment is a valid fragment.
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
 * Checks if an ANS name is valid or not.
 *
 * @param name - A string of the domain name, which can include or exclude the .apt suffix.
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

/**
 * Policy for determining how subdomains expire in relation to their parent domain.
 */
export enum SubdomainExpirationPolicy {
  Independent = 0,
  FollowsDomain = 1,
}

/**
 * Determine if a given ANS name is considered active based on its expiration dates.
 * Domains are active if their expiration date is in the future, while subdomains may
 * follow their parent's expiration policy (1) or expire independently (0).
 * If the subdomain is expiring independently, it can expire before their parent, but not after.
 *
 * @param name - An ANS name returned from one of the functions of the SDK.
 * @returns A boolean indicating whether the contract considers the name active or not.
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

/**
 * Retrieves the address of the ANS contract based on the specified Aptos network configuration.
 *
 * @param aptosConfig - The configuration object for the Aptos network.
 * @param aptosConfig.network - The network for which to retrieve the ANS contract address.
 *
 * @throws Throws an error if the ANS contract is not deployed to the specified network.
 */
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

/**
 * Retrieve the owner address of a specified domain or subdomain.
 *
 * @param args - The arguments for retrieving the owner address.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.name - The name of the domain or subdomain to query.
 * @returns The account address of the owner, or undefined if not found.
 */
export async function getOwnerAddress(args: {
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

/**
 * Parameters for registering a name in the Aptos network.
 *
 * @param aptosConfig - Configuration settings for the Aptos network.
 * @param sender - The account initiating the name registration.
 * @param name - The name to be registered.
 * @param expiration - The expiration policy for the name registration.
 */
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

/**
 * Registers a domain or subdomain with the specified parameters. This function ensures that the provided names and expiration
 * policies are valid before proceeding with the registration process.
 *
 * @param args - The parameters required for registering a name.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.expiration - The expiration details for the registration.
 * @param args.name - The name to be registered, which can be a domain or subdomain.
 * @param args.sender - The account details of the sender initiating the registration.
 * @param args.targetAddress - The target address for the registration.
 * @param args.toAddress - The address to which the registration is associated.
 * @param args.options - Additional options for the registration process.
 * @param args.transferable - Indicates whether the registered name is transferable.
 *
 * @throws Error if the provided expiration policy is invalid for subdomains.
 * @throws Error if the domain does not exist.
 * @throws Error if the subdomain expiration time exceeds the domain expiration time.
 *
 * @returns A transaction object representing the registration process.
 */
export async function registerName(args: RegisterNameParameters): Promise<SimpleTransaction> {
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

/**
 * Retrieves the expiration time of a specified domain or subdomain in epoch milliseconds.
 *
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for Aptos.
 * @param args.name - The name of the domain or subdomain to check.
 * @returns The expiration time in epoch milliseconds, or undefined if an error occurs.
 */
export async function getExpiration(args: { aptosConfig: AptosConfig; name: string }): Promise<number | undefined> {
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

/**
 * Retrieves the primary name associated with a given account address.
 * This function helps in obtaining the complete domain name by combining the subdomain and domain names.
 *
 * @param args - The arguments for retrieving the primary name.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.address - The account address for which to retrieve the primary name.
 * @returns The primary name as a string, or undefined if no domain name exists.
 */
export async function getPrimaryName(args: {
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

/**
 * Sets the primary name for the specified account, allowing for the association of a domain or subdomain with the account.
 * If no name is provided, it clears the existing primary name.
 *
 * @param args - The arguments for setting the primary name.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.sender - The account that is sending the transaction.
 * @param args.name - The name to set as the primary name. If omitted, the function will clear the primary name.
 * @param args.options - Optional transaction generation options.
 * @returns A transaction object representing the operation.
 */
export async function setPrimaryName(args: {
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

/**
 * Retrieves the target address associated with a given domain name and subdomain name.
 *
 * @param args - The arguments for retrieving the target address.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.name - The name of the domain, which may include a subdomain.
 * @returns The target address as an AccountAddress, or undefined if not found.
 */
export async function getTargetAddress(args: {
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

/**
 * Sets the target address for a specified domain and subdomain in the Aptos network.
 * This function helps to associate a given address with a domain name, allowing for easier access and management of resources.
 *
 * @param args - The arguments for setting the target address.
 * @param args.aptosConfig - The configuration settings for the Aptos network.
 * @param args.sender - The account that is sending the transaction.
 * @param args.name - The name of the domain or subdomain to be set.
 * @param args.address - The address to be associated with the domain or subdomain.
 * @param args.options - Optional parameters for generating the transaction.
 *
 * @returns A transaction object representing the set target address operation.
 */
export async function setTargetAddress(args: {
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

/**
 * Retrieves the active Aptos name associated with the specified domain and subdomain.
 *
 * @param args - The parameters for the function.
 * @param args.aptosConfig - The configuration object for Aptos.
 * @param args.name - The name to look up, which includes the domain and optional subdomain.
 * @returns The active Aptos name if it exists; otherwise, returns undefined.
 */
export async function getName(args: {
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

/**
 * Options for querying names, including pagination, ordering, and filtering criteria.
 *
 * @param options - Pagination and filtering options for the query.
 */
interface QueryNamesOptions {
  options?: PaginationArgs & OrderByArg<GetANSNameResponse[0]> & WhereArg<CurrentAptosNamesBoolExp>;
}

/**
 * Arguments for retrieving account names based on the specified account address.
 *
 * @param accountAddress - The address of the account for which names are to be retrieved.
 */
export interface GetAccountNamesArgs extends QueryNamesOptions {
  accountAddress: AccountAddressInput;
}

/**
 * Retrieves the current Aptos names associated with a specific account address.
 *
 * @param args - The arguments for retrieving account names.
 * @param args.aptosConfig - The configuration object for Aptos.
 * @param args.options - Optional parameters for querying account names.
 * @param args.options.limit - The maximum number of names to retrieve.
 * @param args.options.offset - The number of names to skip before starting to collect the result set.
 * @param args.options.orderBy - The field by which to order the results.
 * @param args.options.where - Additional conditions to filter the results.
 * @param args.accountAddress - The address of the account for which to retrieve names.
 *
 * @returns An array of sanitized Aptos names associated with the specified account address.
 */
export async function getAccountNames(
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

/**
 * Arguments for retrieving the domains associated with a specific account.
 *
 * @param accountAddress - The address of the account for which to fetch domains.
 */
export interface GetAccountDomainsArgs extends QueryNamesOptions {
  accountAddress: AccountAddressInput;
}

/**
 * Retrieves the list of top-level domains owned by a specified account.
 *
 * @param args - The arguments for retrieving account domains.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.options - Optional parameters for the query.
 * @param args.options.limit - The maximum number of results to return.
 * @param args.options.offset - The number of results to skip before starting to collect the result set.
 * @param args.options.orderBy - The field by which to order the results.
 * @param args.options.where - Additional conditions to filter the results.
 * @param args.options.where.owner_address - The address of the account whose domains are being queried.
 * @param args.options.where.expiration_timestamp - The minimum expiration timestamp for the domains.
 * @param args.options.where.subdomain - The specific subdomain to filter by.
 *
 * @returns An array of sanitized domain names owned by the specified account.
 */
export async function getAccountDomains(
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

/**
 * Arguments for retrieving subdomains associated with a specific account.
 *
 * @param accountAddress - The address of the account for which to fetch subdomains.
 */
export interface GetAccountSubdomainsArgs extends QueryNamesOptions {
  accountAddress: AccountAddressInput;
}

/**
 * Retrieves a list of subdomains owned by a specified account address.
 * This function helps you identify all subdomains associated with a given account.
 *
 * @param args - The arguments for retrieving account subdomains.
 * @param args.aptosConfig - The configuration object for Aptos.
 * @param args.options - Optional parameters for the query.
 * @param args.options.limit - The maximum number of results to return.
 * @param args.options.offset - The number of results to skip before starting to collect the result set.
 * @param args.options.orderBy - The field by which to order the results.
 * @param args.options.where - Additional conditions to filter the results.
 * @param args.options.where.owner_address - The address of the account to filter by.
 * @param args.options.where.expiration_timestamp - The expiration timestamp to filter by.
 * @param args.options.where.subdomain - The subdomain condition to filter by.
 * @param args.accountAddress - The address of the account whose subdomains are being queried.
 */
export async function getAccountSubdomains(
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

/**
 * Arguments for retrieving subdomains associated with a specific domain.
 *
 * @param domain - The domain for which to fetch subdomains.
 */
export interface GetDomainSubdomainsArgs extends QueryNamesOptions {
  domain: string;
}

/**
 * Retrieve the active subdomains associated with a specified domain.
 *
 * @param args - The arguments for retrieving subdomains.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.options - Optional parameters for the query.
 * @param args.options.limit - The maximum number of results to return.
 * @param args.options.offset - The number of results to skip before starting to collect the results.
 * @param args.options.orderBy - The field by which to order the results.
 * @param args.options.where - Additional conditions to filter the results.
 * @param args.domain - The domain for which to retrieve subdomains.
 *
 * @returns An array of active subdomain names.
 */
export async function getDomainSubdomains(
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
 * @param args - The arguments for the function.
 * @param args.aptosConfig - An AptosConfig object containing the configuration settings.
 * @returns The expiration date in ISO 8601 format.
 */
async function getANSExpirationDate(args: { aptosConfig: AptosConfig }): Promise<string> {
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

/**
 * Renews a domain for a specified duration. This function allows you to extend the registration of a domain for one year.
 *
 * @param args - The parameters required to renew the domain.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.sender - The account that is sending the renewal transaction.
 * @param args.name - The name of the domain to renew.
 * @param args.years - The number of years to renew the domain for. Currently, only 1 year renewals are supported. (optional, default is 1)
 * @param args.options - Additional options for generating the transaction. (optional)
 * @throws Error if the name contains a subdomain or if the years parameter is not equal to 1.
 */
export async function renewDomain(args: {
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
 *
 * @param name - The ANS name response to sanitize.
 * @param name.expiration_timestamp - The expiration timestamp in ISO string format.
 */
function sanitizeANSName(name: GetANSNameResponse[0]): GetANSNameResponse[0] {
  return {
    ...name,
    expiration_timestamp: new Date(name.expiration_timestamp).getTime(),
  };
}
