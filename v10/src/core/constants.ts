/** The type of Aptos API service being called. Used for error reporting and endpoint routing. */
export enum AptosApiType {
  /** The full node REST API. */
  FULLNODE = "Fullnode",
  /** The GraphQL indexer API. */
  INDEXER = "Indexer",
  /** The faucet API for funding test accounts. */
  FAUCET = "Faucet",
  /** The Keyless pepper service API. */
  PEPPER = "Pepper",
  /** The Keyless prover service API. */
  PROVER = "Prover",
}

/** Default maximum gas amount for transactions (in gas units). */
export const DEFAULT_MAX_GAS_AMOUNT = 200000;
/** Minimum value allowed for the max gas amount field. */
export const MIN_MAX_GAS_AMOUNT = 2000;
/** Default transaction expiration in seconds from now. */
export const DEFAULT_TXN_EXP_SEC_FROM_NOW = 20;
/** Default timeout in seconds when waiting for a transaction to be committed. */
export const DEFAULT_TXN_TIMEOUT_SEC = 20;

/** The fully qualified type string for the native Aptos coin (`0x1::aptos_coin::AptosCoin`). */
export const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
/** The fungible asset metadata address for the native APT token. */
export const APTOS_FA = "0x000000000000000000000000000000000000000000000000000000000000000a";

/** Domain separation salt used for hashing raw transactions before signing. */
export const RAW_TRANSACTION_SALT = "APTOS::RawTransaction";
/** Domain separation salt used for hashing raw transactions with additional data (e.g., multi-agent). */
export const RAW_TRANSACTION_WITH_DATA_SALT = "APTOS::RawTransactionWithData";
/** Domain separation salt used for hashing account abstraction signing data. */
export const ACCOUNT_ABSTRACTION_SIGNING_DATA_SALT = "APTOS::AASigningData";

/** Indexer processor types, used when waiting for a specific indexer processor to sync. */
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

/** Regex pattern for matching Firebase Auth JWT issuer URLs (used in Keyless federated authentication). */
export const FIREBASE_AUTH_ISS_PATTERN = /^https:\/\/securetoken\.google\.com\/[a-zA-Z0-9-_]+$/;
