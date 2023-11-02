// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/name}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * name namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { MoveOption, MoveString, U64 } from "../bcs";
import { Account, AccountAddress } from "../core";
import { InputGenerateTransactionOptions, InputSingleSignerTransaction } from "../transactions/types";
import { HexInput, MoveAddressType, MoveValue } from "../types";
import { Network } from "../utils/apiEndpoints";
import { view } from "./general";
import { generateTransaction } from "./transactionSubmission";

export type ANSName = string | { domainName: string; subdomainName?: string };

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
export function isValidANSName(_name: ANSName): { domainName: string; subdomainName?: string } {
  const name = typeof _name === "string" ? _name : `${_name.subdomainName}.${_name.domainName}.apt`;
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

export const LOCAL_ANS_ACCOUNT_PK =
  (process.env.ANS_TEST_ACCOUNT_PRIVATE_KEY as MoveAddressType) ||
  "0x37368b46ce665362562c6d1d4ec01a08c8644c488690df5a17e13ba163e20221";
export const LOCAL_ANS_ACCOUNT_ADDRESS =
  (process.env.ANS_TEST_ACCOUNT_ADDRESS as MoveAddressType) ||
  "0x585fc9f0f0c54183b039ffc770ca282ebd87307916c215a3e692f2f8e4305e82";

const NetworkToAnsContract: Record<Network, MoveAddressType | null> = {
  [Network.TESTNET]: "0x5f8fd2347449685cf41d4db97926ec3a096eaf381332be4f1318ad4d16a8497c",
  [Network.MAINNET]: "0x867ed1f6bf916171b1de3ee92849b8978b7d1b9e0a8cc982a3d19d535dfd9c0c",
  [Network.LOCAL]: LOCAL_ANS_ACCOUNT_ADDRESS,
  [Network.CUSTOM]: null,
  [Network.DEVNET]: null,
};

function getRouterAddress(aptosConfig: AptosConfig): MoveAddressType {
  const address = NetworkToAnsContract[aptosConfig.network];
  if (!address) throw new Error(`The ANS contract is not deployed to ${aptosConfig.network}`);
  return address;
}

const Some = <T>(value: T): MoveValue => ({ vec: [value] } as any);
const None = (): MoveValue => ({ vec: [] } as any);
// != here is intentional, we want to check for null and undefined
// eslint-disable-next-line eqeqeq
const Option = <T>(value: T | undefined | null): MoveValue => (value != undefined ? Some(value) : None());

const unwrapOption = <T>(option: any): T | undefined => {
  if (!!option && typeof option === "object" && "vec" in option && Array.isArray(option.vec)) {
    return option.vec[0];
  }

  return undefined;
};

export async function getOwnerAddress({
  aptosConfig,
  name,
}: {
  aptosConfig: AptosConfig;
  name: ANSName;
}): Promise<MoveAddressType | undefined> {
  const routerAddress = getRouterAddress(aptosConfig);
  const { domainName, subdomainName } = isValidANSName(name);

  const res = await view({
    aptosConfig,
    payload: {
      function: `${routerAddress}::router::get_owner_addr`,
      functionArguments: [domainName, Option(subdomainName)],
    },
  });

  const owner = unwrapOption<MoveAddressType>(res[0]);

  return owner ? AccountAddress.fromHexInput(owner).toString() : undefined;
}

export interface RegisterNameParameters {
  aptosConfig: AptosConfig;
  sender: Account;
  name: ANSName;
  expiration:
    | { policy: "domain"; years: 1 }
    | { policy: "subdomain:follow-domain" }
    | { policy: "subdomain:independent"; expirationDate: Date };
  transferable?: boolean;
  toAddress?: HexInput;
  targetAddress?: HexInput;
  options?: InputGenerateTransactionOptions;
}

export async function registerName({
  aptosConfig,
  sender,
  name,
  expiration,
  toAddress,
  targetAddress,
  options,
}: RegisterNameParameters): Promise<InputSingleSignerTransaction> {
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
    if (expiration.years !== 1) {
      throw new Error("For now, names can only be registered for 1 year at a time");
    }

    const registrationDuration = expiration.years * 31536000;

    const transaction = await generateTransaction({
      aptosConfig,
      sender: sender.accountAddress.toString(),
      data: {
        function: `${routerAddress}::router::register_domain`,
        functionArguments: [
          new MoveString(domainName),
          new U64(registrationDuration),
          new MoveOption(targetAddress ? AccountAddress.fromHexInput(targetAddress) : null),
          new MoveOption(toAddress ? AccountAddress.fromHexInput(toAddress) : null),
        ],
      },
      options,
    });

    return transaction as InputSingleSignerTransaction;
  }

  throw new Error(`Policy ${expiration.policy} is not supported yet`);
}
