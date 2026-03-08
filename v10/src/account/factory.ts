// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AuthenticationKey } from "../core/authentication-key.js";
import { Ed25519PrivateKey } from "../crypto/ed25519.js";
import type { AccountPublicKey } from "../crypto/public-key.js";
import { SigningSchemeInput } from "../crypto/types.js";
import { Ed25519Account } from "./ed25519-account.js";
import { SingleKeyAccount } from "./single-key-account.js";
import type {
  Account,
  CreateAccountFromPrivateKeyArgs,
  CreateEd25519AccountFromPrivateKeyArgs,
  CreateSingleKeyAccountFromPrivateKeyArgs,
  GenerateAccountArgs,
  GenerateEd25519AccountArgs,
  GenerateEd25519SingleKeyAccountArgs,
  GenerateSingleKeyAccountArgs,
  PrivateKeyFromDerivationPathArgs,
} from "./types.js";

// ── generateAccount ──

/**
 * Generates a new Aptos account with a randomly generated private key.
 *
 * The overloads allow callers to obtain the most specific return type based on
 * the combination of `scheme` and `legacy` flags provided:
 *
 * - No args / `legacy: true` → legacy {@link Ed25519Account}
 * - `scheme: Ed25519, legacy: false` → {@link SingleKeyAccount} (Ed25519 key)
 * - `scheme: Secp256k1Ecdsa` → {@link SingleKeyAccount} (Secp256k1 key)
 *
 * @param args - Optional generation arguments controlling scheme and legacy mode.
 * @returns A newly generated {@link Ed25519Account} or {@link SingleKeyAccount}.
 *
 * @example
 * ```typescript
 * // Legacy Ed25519 account (default)
 * const a = generateAccount();
 *
 * // SingleKey Ed25519 account
 * const b = generateAccount({ scheme: SigningSchemeInput.Ed25519, legacy: false });
 *
 * // SingleKey Secp256k1 account
 * const c = generateAccount({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
 * ```
 */
export function generateAccount(args?: GenerateEd25519AccountArgs): Ed25519Account;
export function generateAccount(args: GenerateEd25519SingleKeyAccountArgs): SingleKeyAccount;
export function generateAccount(args: GenerateSingleKeyAccountArgs): SingleKeyAccount;
export function generateAccount(args: GenerateAccountArgs): Account;
export function generateAccount(args: GenerateAccountArgs = {}): Account {
  const { scheme = SigningSchemeInput.Ed25519, legacy = true } = args;
  if (scheme === SigningSchemeInput.Ed25519 && legacy) {
    return Ed25519Account.generate();
  }
  return SingleKeyAccount.generate({ scheme });
}

// ── accountFromPrivateKey ──

/**
 * Creates an Aptos account from an existing private key.
 *
 * The overloads allow callers to obtain the most specific return type based on
 * the key type and `legacy` flag:
 *
 * - `Ed25519PrivateKey` + `legacy: true` (default) → legacy {@link Ed25519Account}
 * - `Ed25519PrivateKey` + `legacy: false` → {@link SingleKeyAccount}
 * - Any other key type → {@link SingleKeyAccount}
 *
 * @param args - Arguments including the private key, optional address, and legacy flag.
 * @returns An {@link Ed25519Account} or {@link SingleKeyAccount}.
 *
 * @example
 * ```typescript
 * const key = new Ed25519PrivateKey("0xabc...");
 *
 * // Legacy Ed25519 account (default)
 * const a = accountFromPrivateKey({ privateKey: key });
 *
 * // SingleKey account from the same Ed25519 key
 * const b = accountFromPrivateKey({ privateKey: key, legacy: false });
 * ```
 */
export function accountFromPrivateKey(args: CreateEd25519AccountFromPrivateKeyArgs): Ed25519Account;
export function accountFromPrivateKey(args: CreateSingleKeyAccountFromPrivateKeyArgs): SingleKeyAccount;
export function accountFromPrivateKey(args: CreateAccountFromPrivateKeyArgs): Account;
export function accountFromPrivateKey(args: CreateAccountFromPrivateKeyArgs): Account {
  const { privateKey, address, legacy = true } = args;
  if (privateKey instanceof Ed25519PrivateKey && legacy) {
    return new Ed25519Account({ privateKey, address });
  }
  return new SingleKeyAccount({ privateKey, address });
}

// ── accountFromDerivationPath ──

/**
 * Derives an Aptos account from a BIP-44 derivation path and a BIP-39 mnemonic phrase.
 *
 * The overloads allow callers to obtain the most specific return type based on
 * the combination of `scheme` and `legacy` flags:
 *
 * - No scheme / `legacy: true` → legacy {@link Ed25519Account}
 * - `scheme: Ed25519, legacy: false` → {@link SingleKeyAccount} (Ed25519 key)
 * - `scheme: Secp256k1Ecdsa` → {@link SingleKeyAccount} (Secp256k1 key)
 *
 * @param args - Derivation arguments including `path`, `mnemonic`, and optional
 *   `scheme` / `legacy` flags.
 * @returns A deterministic {@link Ed25519Account} or {@link SingleKeyAccount}.
 *
 * @example
 * ```typescript
 * const account = accountFromDerivationPath({
 *   path: "m/44'/637'/0'/0'/0'",
 *   mnemonic: "word1 word2 ... word12",
 * });
 * ```
 */
export function accountFromDerivationPath(
  args: GenerateEd25519AccountArgs & PrivateKeyFromDerivationPathArgs,
): Ed25519Account;
export function accountFromDerivationPath(
  args: GenerateEd25519SingleKeyAccountArgs & PrivateKeyFromDerivationPathArgs,
): SingleKeyAccount;
export function accountFromDerivationPath(
  args: GenerateSingleKeyAccountArgs & PrivateKeyFromDerivationPathArgs,
): SingleKeyAccount;
export function accountFromDerivationPath(args: GenerateAccountArgs & PrivateKeyFromDerivationPathArgs): Account;
export function accountFromDerivationPath(args: GenerateAccountArgs & PrivateKeyFromDerivationPathArgs): Account {
  const { scheme = SigningSchemeInput.Ed25519, mnemonic, path, legacy = true } = args;
  if (scheme === SigningSchemeInput.Ed25519 && legacy) {
    return Ed25519Account.fromDerivationPath({ mnemonic, path });
  }
  return SingleKeyAccount.fromDerivationPath({ scheme, mnemonic, path });
}

// ── authKey ──

/**
 * Computes the {@link AuthenticationKey} for a given public key.
 *
 * This is a thin convenience wrapper around `publicKey.authKey()`.
 *
 * @param args.publicKey - Any {@link AccountPublicKey} (Ed25519, SingleKey, MultiKey, etc.).
 * @returns The corresponding {@link AuthenticationKey}.
 *
 * @example
 * ```typescript
 * const account = Ed25519Account.generate();
 * const key = authKey({ publicKey: account.publicKey });
 * ```
 */
export function authKey(args: { publicKey: AccountPublicKey }): AuthenticationKey {
  return args.publicKey.authKey() as AuthenticationKey;
}
