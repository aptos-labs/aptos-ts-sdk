// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AccountAddress, AccountAddressInput } from "../core/account-address.js";
import type { Ed25519PrivateKey } from "../crypto/ed25519.js";
import type { AccountPublicKey } from "../crypto/public-key.js";
import type { Signature } from "../crypto/signature.js";
import type { AnyPublicKey, PrivateKeyInput } from "../crypto/single-key.js";
import type { SigningScheme, SigningSchemeInput } from "../crypto/types.js";
import type { HexInput } from "../hex/index.js";
import type { AccountAuthenticator } from "../transactions/authenticator.js";
import type { AnyRawTransaction } from "../transactions/types.js";

// ── Account interface ──

/**
 * Core interface that every Aptos account implementation must satisfy.
 *
 * An account holds a public key and an on-chain address, and is capable of
 * signing arbitrary messages as well as raw transactions in both bare-signature
 * and authenticator-wrapped forms.
 *
 * @example
 * ```typescript
 * const account: Account = Ed25519Account.generate();
 * const sig = account.sign(new TextEncoder().encode("hello"));
 * ```
 */
export interface Account {
  /** The public key associated with this account. */
  readonly publicKey: AccountPublicKey;
  /** The on-chain address of this account. */
  readonly accountAddress: AccountAddress;
  /** The signing scheme used by this account (e.g. Ed25519, SingleKey, MultiKey). */
  readonly signingScheme: SigningScheme;

  /**
   * Signs a raw message and wraps the result in an {@link AccountAuthenticator}.
   *
   * @param message - The message bytes to sign, in any supported hex input format.
   * @returns An {@link AccountAuthenticator} containing the public key and signature.
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticator;

  /**
   * Signs a raw transaction and wraps the result in an {@link AccountAuthenticator}.
   *
   * @param transaction - The raw transaction to sign.
   * @returns An {@link AccountAuthenticator} containing the public key and signature.
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticator;

  /**
   * Signs a raw message and returns the bare {@link Signature}.
   *
   * @param message - The message bytes to sign, in any supported hex input format.
   * @returns The raw {@link Signature} over the message.
   */
  sign(message: HexInput): Signature;

  /**
   * Signs a raw transaction and returns the bare {@link Signature}.
   *
   * @param transaction - The raw transaction to sign.
   * @returns The raw {@link Signature} over the transaction signing message.
   */
  signTransaction(transaction: AnyRawTransaction): Signature;
}

// ── SingleKeySigner ──

/**
 * Extension of {@link Account} for accounts whose on-chain representation uses
 * the `SingleKey` authentication scheme.
 *
 * Exposes `getAnyPublicKey()` to retrieve the wrapped {@link AnyPublicKey}.
 */
export interface SingleKeySigner extends Account {
  /**
   * Returns the {@link AnyPublicKey} wrapper around this account's public key.
   *
   * @returns The {@link AnyPublicKey} associated with this signer.
   */
  getAnyPublicKey(): AnyPublicKey;
}

/**
 * Type-guard that checks whether an unknown value implements the
 * {@link SingleKeySigner} interface.
 *
 * @param obj - The value to test.
 * @returns `true` if `obj` has a callable `getAnyPublicKey` method.
 */
export function isSingleKeySigner(obj: unknown): obj is SingleKeySigner {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "getAnyPublicKey" in obj &&
    typeof (obj as Record<string, unknown>).getAnyPublicKey === "function"
  );
}

// ── KeylessSigner ──

/**
 * Extension of {@link Account} for keyless accounts (both standard and federated).
 *
 * Adds `checkKeylessAccountValidity()` which validates that the ephemeral key
 * has not expired and that a zero-knowledge proof is available before signing.
 */
export interface KeylessSigner extends Account {
  /**
   * Validates the keyless account state prior to signing.
   *
   * Throws a {@link KeylessError} if the ephemeral key pair has expired or if
   * the proof has not yet been fetched.
   *
   * @param args - Optional additional arguments accepted by concrete implementations.
   * @returns A promise that resolves when the account is valid, or rejects with a
   *   {@link KeylessError}.
   */
  checkKeylessAccountValidity(...args: unknown[]): Promise<void>;
}

/**
 * Type-guard that checks whether an unknown value implements the
 * {@link KeylessSigner} interface.
 *
 * @param obj - The value to test.
 * @returns `true` if `obj` has a callable `checkKeylessAccountValidity` method.
 */
export function isKeylessSigner(obj: unknown): obj is KeylessSigner {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "checkKeylessAccountValidity" in obj &&
    typeof (obj as Record<string, unknown>).checkKeylessAccountValidity === "function"
  );
}

// ── Argument types for Account factory methods ──

/**
 * Arguments for creating a legacy Ed25519 account from a private key.
 *
 * The resulting account uses the legacy Ed25519 signing scheme and derives its
 * address from the Ed25519 authentication key.
 */
export interface CreateEd25519AccountFromPrivateKeyArgs {
  /** The Ed25519 private key to use. */
  privateKey: Ed25519PrivateKey;
  /** Optional explicit account address; defaults to the derived authentication key address. */
  address?: AccountAddressInput;
  /** When `true` (the default), creates a legacy Ed25519 account. */
  legacy?: true;
}

/**
 * Arguments for creating a SingleKey-scheme Ed25519 account from a private key.
 *
 * Setting `legacy: false` opts into the unified `SingleKey` authentication scheme
 * even though the underlying key type is Ed25519.
 */
export interface CreateEd25519SingleKeyAccountFromPrivateKeyArgs {
  /** The Ed25519 private key to use. */
  privateKey: Ed25519PrivateKey;
  /** Optional explicit account address; defaults to the derived authentication key address. */
  address?: AccountAddressInput;
  /** Must be `false` to select the SingleKey scheme for an Ed25519 key. */
  legacy: false;
}

/**
 * Arguments for creating a SingleKey account from any supported private key type.
 *
 * Use this when `privateKey` is not an {@link Ed25519PrivateKey} or when you
 * explicitly want the `SingleKey` authentication scheme.
 */
export interface CreateSingleKeyAccountFromPrivateKeyArgs {
  /** Any supported private key (Ed25519 or Secp256k1). */
  privateKey: PrivateKeyInput;
  /** Optional explicit account address; defaults to the derived authentication key address. */
  address?: AccountAddressInput;
  /** Must be `false` (or omitted) to use the SingleKey scheme. */
  legacy?: false;
}

/**
 * General-purpose arguments accepted by the {@link accountFromPrivateKey} factory.
 *
 * Prefer the more specific overload argument types when the exact output type
 * matters, and use this interface only when the distinction is dynamic.
 */
export interface CreateAccountFromPrivateKeyArgs {
  /** Any supported private key (Ed25519 or Secp256k1). */
  privateKey: PrivateKeyInput;
  /** Optional explicit account address; defaults to the derived authentication key address. */
  address?: AccountAddressInput;
  /** Whether to use the legacy Ed25519 scheme (`true`) or the SingleKey scheme (`false`). */
  legacy?: boolean;
}

/**
 * Arguments for generating a new legacy Ed25519 account.
 */
export interface GenerateEd25519AccountArgs {
  /** Must be `SigningSchemeInput.Ed25519` or omitted. */
  scheme?: SigningSchemeInput.Ed25519;
  /** When `true` (the default), generates a legacy Ed25519 account. */
  legacy?: true;
}

/**
 * Arguments for generating a new SingleKey-scheme Ed25519 account.
 *
 * Setting `legacy: false` opts into the `SingleKey` authentication scheme.
 */
export interface GenerateEd25519SingleKeyAccountArgs {
  /** Must be `SigningSchemeInput.Ed25519` or omitted. */
  scheme?: SigningSchemeInput.Ed25519;
  /** Must be `false` to select the SingleKey scheme. */
  legacy: false;
}

/**
 * Arguments for generating a new SingleKey account with a non-Ed25519 scheme.
 *
 * Use this when you want to generate an account backed by e.g. Secp256k1.
 */
export interface GenerateSingleKeyAccountArgs {
  /** A signing scheme that is not Ed25519 (e.g. `SigningSchemeInput.Secp256k1Ecdsa`). */
  scheme: Exclude<SigningSchemeInput, SigningSchemeInput.Ed25519>;
  /** Must be `false` (or omitted) to use the SingleKey scheme. */
  legacy?: false;
}

/**
 * General-purpose arguments accepted by the {@link generateAccount} factory.
 *
 * Prefer the more specific overload argument types when the exact output type
 * matters, and use this interface only when the distinction is dynamic.
 */
export interface GenerateAccountArgs {
  /** The desired signing scheme. Defaults to `SigningSchemeInput.Ed25519`. */
  scheme?: SigningSchemeInput;
  /** Whether to use the legacy Ed25519 scheme (`true`) or the SingleKey scheme (`false`). */
  legacy?: boolean;
}

/**
 * Arguments for deriving a private key from a BIP-39 mnemonic phrase and a
 * BIP-44 derivation path.
 */
export interface PrivateKeyFromDerivationPathArgs {
  /** BIP-44 derivation path string (e.g. `"m/44'/637'/0'/0'/0'"`). */
  path: string;
  /** Space-separated BIP-39 mnemonic phrase. */
  mnemonic: string;
}

// ── Union types ──

/**
 * Union of {@link SingleKeySigner} and the legacy {@link import("./ed25519-account.js").Ed25519Account}.
 *
 * Used in places such as {@link MultiKeyAccount} where both account types can
 * serve as individual signers within a multi-key setup.
 */
export type SingleKeySignerOrLegacyEd25519Account = SingleKeySigner | import("./ed25519-account.js").Ed25519Account;
