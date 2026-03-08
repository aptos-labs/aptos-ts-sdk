// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, type AccountAddressInput } from "../core/account-address.js";
import { AuthenticationKey } from "../core/authentication-key.js";
import { Ed25519PrivateKey, type Ed25519PublicKey, type Ed25519Signature } from "../crypto/ed25519.js";
import { SigningScheme } from "../crypto/types.js";
import type { HexInput } from "../hex/index.js";
import { AccountAuthenticatorEd25519 } from "../transactions/authenticator.js";
import { generateSigningMessageForTransaction } from "../transactions/signing-message.js";
import type { AnyRawTransaction } from "../transactions/types.js";
import type { Account } from "./types.js";

/**
 * Constructor arguments for {@link Ed25519Account}.
 */
export interface Ed25519SignerConstructorArgs {
  /** The Ed25519 private key used for signing. */
  privateKey: Ed25519PrivateKey;
  /**
   * Optional explicit on-chain address.  When omitted the address is derived
   * from the Ed25519 authentication key.
   */
  address?: AccountAddressInput;
}

/**
 * Arguments for {@link Ed25519Account.fromDerivationPath}.
 */
export interface Ed25519SignerFromDerivationPathArgs {
  /** BIP-44 derivation path string (e.g. `"m/44'/637'/0'/0'/0'"`). */
  path: string;
  /** Space-separated BIP-39 mnemonic phrase. */
  mnemonic: string;
}

/**
 * A legacy Ed25519 account that signs using the `Ed25519` scheme.
 *
 * This is the original Aptos signing scheme.  For accounts created after the
 * `SingleKey` scheme was introduced, prefer {@link SingleKeyAccount} instead.
 *
 * @example
 * ```typescript
 * // Generate a brand-new account
 * const account = Ed25519Account.generate();
 *
 * // Reconstruct from an existing private key
 * const key = new Ed25519PrivateKey("0xabc123...");
 * const account2 = new Ed25519Account({ privateKey: key });
 * ```
 */
export class Ed25519Account implements Account {
  /** The Ed25519 private key held by this account. */
  readonly privateKey: Ed25519PrivateKey;
  /** The Ed25519 public key derived from {@link privateKey}. */
  readonly publicKey: Ed25519PublicKey;
  /** The on-chain address of this account. */
  readonly accountAddress: AccountAddress;
  /** Always `SigningScheme.Ed25519` for this account type. */
  readonly signingScheme = SigningScheme.Ed25519;

  /**
   * Creates an {@link Ed25519Account} from an existing private key and an
   * optional explicit address.
   *
   * @param args - {@link Ed25519SignerConstructorArgs}
   */
  constructor(args: Ed25519SignerConstructorArgs) {
    const { privateKey, address } = args;
    this.privateKey = privateKey;
    this.publicKey = privateKey.publicKey() as Ed25519PublicKey;
    this.accountAddress = address
      ? AccountAddress.from(address)
      : AuthenticationKey.fromSchemeAndBytes({
          scheme: SigningScheme.Ed25519,
          input: this.publicKey.toUint8Array(),
        }).derivedAddress();
  }

  /**
   * Generates a new {@link Ed25519Account} with a randomly generated private key.
   *
   * @returns A new {@link Ed25519Account} instance.
   *
   * @example
   * ```typescript
   * const account = Ed25519Account.generate();
   * ```
   */
  static generate(): Ed25519Account {
    return new Ed25519Account({ privateKey: Ed25519PrivateKey.generate() });
  }

  /**
   * Derives an {@link Ed25519Account} from a BIP-44 derivation path and a
   * BIP-39 mnemonic phrase.
   *
   * @param args - {@link Ed25519SignerFromDerivationPathArgs}
   * @returns A deterministic {@link Ed25519Account} for the given path and mnemonic.
   *
   * @example
   * ```typescript
   * const account = Ed25519Account.fromDerivationPath({
   *   path: "m/44'/637'/0'/0'/0'",
   *   mnemonic: "word1 word2 ... word12",
   * });
   * ```
   */
  static fromDerivationPath(args: Ed25519SignerFromDerivationPathArgs): Ed25519Account {
    const { path, mnemonic } = args;
    return new Ed25519Account({ privateKey: Ed25519PrivateKey.fromDerivationPath(path, mnemonic) });
  }

  /**
   * Verifies that the given signature is valid for the given message under this
   * account's public key.
   *
   * @param args - An object containing the `message` (hex input) and the
   *   `signature` ({@link Ed25519Signature}) to verify.
   * @returns `true` if the signature is valid, `false` otherwise.
   */
  verifySignature(args: { message: HexInput; signature: Ed25519Signature }): boolean {
    return this.publicKey.verifySignature(args);
  }

  /**
   * Signs a message and returns an {@link AccountAuthenticatorEd25519} wrapping
   * the public key and the signature.
   *
   * @param message - The message bytes to sign, in any supported hex input format.
   * @returns An {@link AccountAuthenticatorEd25519} ready for use in a transaction.
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorEd25519 {
    return new AccountAuthenticatorEd25519(this.publicKey, this.privateKey.sign(message) as Ed25519Signature);
  }

  /**
   * Signs a raw transaction and returns an {@link AccountAuthenticatorEd25519}.
   *
   * @param transaction - The raw transaction to sign.
   * @returns An {@link AccountAuthenticatorEd25519} containing the signature.
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorEd25519 {
    return new AccountAuthenticatorEd25519(this.publicKey, this.signTransaction(transaction));
  }

  /**
   * Signs a message and returns the raw {@link Ed25519Signature}.
   *
   * @param message - The message bytes to sign, in any supported hex input format.
   * @returns The {@link Ed25519Signature} over the message.
   */
  sign(message: HexInput): Ed25519Signature {
    return this.privateKey.sign(message) as Ed25519Signature;
  }

  /**
   * Signs a raw transaction and returns the raw {@link Ed25519Signature}.
   *
   * The signing message is derived from the transaction according to the Aptos
   * signing message specification.
   *
   * @param transaction - The raw transaction to sign.
   * @returns The {@link Ed25519Signature} over the transaction signing message.
   */
  signTransaction(transaction: AnyRawTransaction): Ed25519Signature {
    return this.sign(generateSigningMessageForTransaction(transaction));
  }
}
