export enum AptosApiType {
  FULLNODE = "Fullnode",
  INDEXER = "Indexer",
  FAUCET = "Faucet",
  PEPPER = "Pepper",
  PROVER = "Prover",
}

export const DEFAULT_MAX_GAS_AMOUNT = 200000;
export const MIN_MAX_GAS_AMOUNT = 2000;
export const DEFAULT_TXN_EXP_SEC_FROM_NOW = 20;
export const DEFAULT_TXN_TIMEOUT_SEC = 20;

export const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
export const APTOS_FA = "0x000000000000000000000000000000000000000000000000000000000000000a";

export const RAW_TRANSACTION_SALT = "APTOS::RawTransaction";
export const RAW_TRANSACTION_WITH_DATA_SALT = "APTOS::RawTransactionWithData";
export const ACCOUNT_ABSTRACTION_SIGNING_DATA_SALT = "APTOS::AASigningData";

export enum ProcessorType {
  ACCOUNT_RESTORATION_PROCESSOR = "account_restoration_processor",
  ACCOUNT_TRANSACTION_PROCESSOR = "account_transactions_processor",
  DEFAULT = "default_processor",
  EVENTS_PROCESSOR = "events_processor",
  FUNGIBLE_ASSET_PROCESSOR = "fungible_asset_processor",
  STAKE_PROCESSOR = "stake_processor",
  TOKEN_V2_PROCESSOR = "token_v2_processor",
  USER_TRANSACTION_PROCESSOR = "user_transaction_processor",
  OBJECT_PROCESSOR = "objects_processor",
}

export const FIREBASE_AUTH_ISS_PATTERN = /^https:\/\/securetoken\.google\.com\/[a-zA-Z0-9-_]+$/;
