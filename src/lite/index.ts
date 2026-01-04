// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Lite SDK Module (without Keyless Authentication)
 *
 * This module provides core Aptos SDK functionality without the keyless
 * authentication feature. Use this entry point if you don't need keyless
 * authentication to significantly reduce your bundle size.
 *
 * @module lite
 */

// Core exports only
export { AccountAddress } from "../core/accountAddress";
export type { AccountAddressInput } from "../core/accountAddress";
export { AuthenticationKey } from "../core/authenticationKey";
export { Hex } from "../core/hex";
export * from "../core/common";

// Core crypto (without keyless)
export { Ed25519PrivateKey, Ed25519PublicKey, Ed25519Signature } from "../core/crypto/ed25519";
export { Secp256k1PrivateKey, Secp256k1PublicKey, Secp256k1Signature } from "../core/crypto/secp256k1";
export { Secp256r1PrivateKey, Secp256r1PublicKey, Secp256r1Signature } from "../core/crypto/secp256r1";
export { MultiEd25519PublicKey, MultiEd25519Signature } from "../core/crypto/multiEd25519";
export { AnyPublicKey, AnySignature } from "../core/crypto/singleKey";
export type { PrivateKeyInput } from "../core/crypto/singleKey";
export { PublicKey, AccountPublicKey } from "../core/crypto/publicKey";
export { PrivateKey } from "../core/crypto/privateKey";
export { Signature } from "../core/crypto/signature";

// BCS serialization
export * from "../bcs";

// Network and config types
export {
  Network,
  NetworkToNodeAPI,
  NetworkToFaucetAPI,
  NetworkToIndexerAPI,
  NetworkToChainId,
} from "../utils/apiEndpoints";
export {
  AptosApiType,
  DEFAULT_MAX_GAS_AMOUNT,
  DEFAULT_TXN_EXP_SEC_FROM_NOW,
  DEFAULT_TXN_TIMEOUT_SEC,
  APTOS_COIN,
  APTOS_FA,
  RAW_TRANSACTION_SALT,
  RAW_TRANSACTION_WITH_DATA_SALT,
} from "../utils/const";

// Essential types - import directly to avoid pulling in transactions
export type {
  HexInput,
  SigningScheme,
  SigningSchemeInput,
  AnyNumber,
  MoveAddressType,
  MoveObjectType,
  MoveStructId,
  MoveFunctionId,
  MoveModuleId,
  MoveType,
  MoveValue,
  AnyPublicKeyVariant,
  AnySignatureVariant,
  PrivateKeyVariants,
  DeriveScheme,
  AuthenticationKeyScheme,
} from "../types/types";
