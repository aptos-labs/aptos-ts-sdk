// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Network } from "./apiEndpoints";

export const DEFAULT_NETWORK = Network.DEVNET;
export const DEFAULT_TXN_TIMEOUT_SEC = 20;

export enum AptosApiType {
  FULLNODE,
  INDEXER,
  FAUCET,
}

export const DEFAULT_MAX_GAS_AMOUNT = 200000;
// Transaction expire timestamp
export const DEFAULT_TXN_EXP_SEC_FROM_NOW = 20;
export const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
export const RAW_TRANSACTION_SALT = "APTOS::RawTransaction";
export const RAW_TRANSACTION_WITH_DATA_SALT = "APTOS::RawTransactionWithData";
