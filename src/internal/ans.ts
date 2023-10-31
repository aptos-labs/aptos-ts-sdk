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
  if (!address) throw new Error("The ANS contract is not deployed to your network");
  return address;
}

function validateMultipleOfYearInSeconds(seconds: number): void {
  if (seconds % 31536000 !== 0 || seconds === 0) {
    throw new Error("Registration duration must be a multiple of 1 year in seconds, greater than 0");
  }
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

export async function registerDomain({
  aptosConfig,
  sender,
  domainName,
  registrationDuration,
  targetAddress,
  toAddress,
  options,
}: {
  aptosConfig: AptosConfig;
  sender: Account;
  domainName: string;
  registrationDuration: 31536000;
  targetAddress?: HexInput;
  toAddress?: HexInput;
  options?: InputGenerateTransactionOptions;
}): Promise<InputSingleSignerTransaction> {
  const routerAddress = getRouterAddress(aptosConfig);
  validateMultipleOfYearInSeconds(registrationDuration);

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

export async function getOwnerAddress({
  aptosConfig,
  domainName,
  subdomainName,
}: {
  aptosConfig: AptosConfig;
  domainName: string;
  subdomainName?: string;
}): Promise<AccountAddress | undefined> {
  const routerAddress = getRouterAddress(aptosConfig);

  const res = await view({
    aptosConfig,
    payload: {
      function: `${routerAddress}::router::get_owner_addr`,
      functionArguments: [domainName, Option(subdomainName)],
    },
  });

  const owner = unwrapOption(res[0]) as MoveAddressType | undefined;

  return owner ? AccountAddress.fromHexInput(owner) : undefined;
}
