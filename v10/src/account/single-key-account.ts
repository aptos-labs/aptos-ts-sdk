// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, type AccountAddressInput } from "../core/account-address.js";
import { AuthenticationKey } from "../core/authentication-key.js";
import { Ed25519PrivateKey } from "../crypto/ed25519.js";
import type { PrivateKey } from "../crypto/private-key.js";
import { Secp256k1PrivateKey } from "../crypto/secp256k1.js";
import { AnyPublicKey, AnySignature, type PrivateKeyInput } from "../crypto/single-key.js";
import { SigningScheme, SigningSchemeInput } from "../crypto/types.js";
import type { HexInput } from "../hex/index.js";
import { AccountAuthenticatorSingleKey } from "../transactions/authenticator.js";
import { generateSigningMessageForTransaction } from "../transactions/signing-message.js";
import type { AnyRawTransaction } from "../transactions/types.js";
import type { Ed25519Account } from "./ed25519-account.js";
import type { Account, SingleKeySigner } from "./types.js";

/**
 * Constructor arguments for {@link SingleKeyAccount}.
 */
export interface SingleKeySignerConstructorArgs {
  /** Any supported private key (Ed25519 or Secp256k1). */
  privateKey: PrivateKeyInput;
  /**
   * Optional explicit on-chain address.  When omitted the address is derived
   * from the SingleKey authentication key.
   */
  address?: AccountAddressInput;
}

/**
 * Arguments for {@link SingleKeyAccount.generate}.
 */
export interface SingleKeySignerGenerateArgs {
  /**
   * The signing scheme to use when generating the key pair.
   * Defaults to `SigningSchemeInput.Ed25519`.
   */
  scheme?: SigningSchemeInput;
}

/**
 * Arguments for {@link SingleKeyAccount.fromDerivationPath}.
 *
 * Combines {@link SingleKeySignerGenerateArgs} with BIP-39/BIP-44 derivation
 * path parameters.
 */
export type SingleKeySignerFromDerivationPathArgs = SingleKeySignerGenerateArgs & {
  /** BIP-44 derivation path string (e.g. `"m/44'/637'/0'/0'/0'"`). */
  path: string;
  /** Space-separated BIP-39 mnemonic phrase. */
  mnemonic: string;
};

/**
 * An account that uses the unified `SingleKey` authentication scheme.
 *
 * Unlike the legacy {@link Ed25519Account}, this account wraps its public key
 * in an {@link AnyPublicKey} envelope, enabling support for multiple key types
 * (Ed25519, Secp256k1) under a single on-chain scheme.
 *
 * @example
 * ```typescript
 * // Generate a new SingleKey account backed by Ed25519
 * const account = SingleKeyAccount.generate();
 *
 * // Generate a SingleKey account backed by Secp256k1
 * const secp = SingleKeyAccount.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
 *
 * // Wrap an existing private key
 * const key = new Ed25519PrivateKey("0xabc...");
 * const account2 = new SingleKeyAccount({ privateKey: key });
 * ```
 */
export class SingleKeyAccount implements Account, SingleKeySigner {
  /** The underlying private key (Ed25519 or Secp256k1). */
  readonly privateKey: PrivateKey;
  /** The {@link AnyPublicKey} wrapper around this account's public key. */
  readonly publicKey: AnyPublicKey;
  /** The on-chain address of this account. */
  readonly accountAddress: AccountAddress;
  /** Always `SigningScheme.SingleKey` for this account type. */
  readonly signingScheme = SigningScheme.SingleKey;

  /**
   * Creates a {@link SingleKeyAccount} from an existing private key and an
   * optional explicit address.
   *
   * @param args - {@link SingleKeySignerConstructorArgs}
   */
  constructor(args: SingleKeySignerConstructorArgs) {
    const { privateKey, address } = args;
    this.privateKey = privateKey;
    this.publicKey = new AnyPublicKey(privateKey.publicKey());
    this.accountAddress = address
      ? AccountAddress.from(address)
      : AuthenticationKey.fromSchemeAndBytes({
          scheme: SigningScheme.SingleKey,
          input: this.publicKey.bcsToBytes(),
        }).derivedAddress();
  }

  /**
   * Returns the {@link AnyPublicKey} associated with this account.
   *
   * @returns The {@link AnyPublicKey} wrapping the underlying public key.
   */
  getAnyPublicKey(): AnyPublicKey {
    return this.publicKey;
  }

  /**
   * Generates a new {@link SingleKeyAccount} with a randomly generated private key.
   *
   * @param args - Optional {@link SingleKeySignerGenerateArgs} to specify the key scheme.
   * @returns A new {@link SingleKeyAccount} instance.
   *
   * @example
   * ```typescript
   * const account = SingleKeyAccount.generate();
   * const secp = SingleKeyAccount.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
   * ```
   */
  static generate(args: SingleKeySignerGenerateArgs = {}): SingleKeyAccount {
    const { scheme = SigningSchemeInput.Ed25519 } = args;
    let privateKey: PrivateKeyInput;
    switch (scheme) {
      case SigningSchemeInput.Ed25519:
        privateKey = Ed25519PrivateKey.generate();
        break;
      case SigningSchemeInput.Secp256k1Ecdsa:
        privateKey = Secp256k1PrivateKey.generate();
        break;
      default:
        throw new Error(`Unsupported signature scheme ${scheme}`);
    }
    return new SingleKeyAccount({ privateKey });
  }

  /**
   * Derives a {@link SingleKeyAccount} from a BIP-44 derivation path and a
   * BIP-39 mnemonic phrase.
   *
   * @param args - {@link SingleKeySignerFromDerivationPathArgs}
   * @returns A deterministic {@link SingleKeyAccount} for the given path and mnemonic.
   *
   * @example
   * ```typescript
   * const account = SingleKeyAccount.fromDerivationPath({
   *   path: "m/44'/637'/0'/0'/0'",
   *   mnemonic: "word1 word2 ... word12",
   * });
   * ```
   */
  static fromDerivationPath(args: SingleKeySignerFromDerivationPathArgs): SingleKeyAccount {
    const { scheme = SigningSchemeInput.Ed25519, path, mnemonic } = args;
    let privateKey: PrivateKeyInput;
    switch (scheme) {
      case SigningSchemeInput.Ed25519:
        privateKey = Ed25519PrivateKey.fromDerivationPath(path, mnemonic);
        break;
      case SigningSchemeInput.Secp256k1Ecdsa:
        privateKey = Secp256k1PrivateKey.fromDerivationPath(path, mnemonic);
        break;
      default:
        throw new Error(`Unsupported signature scheme ${scheme}`);
    }
    return new SingleKeyAccount({ privateKey });
  }

  /**
   * Wraps a legacy {@link Ed25519Account} in a {@link SingleKeyAccount} using the
   * same underlying private key and address.
   *
   * Useful when migrating from the legacy Ed25519 scheme to the SingleKey scheme
   * without changing the account's on-chain address.
   *
   * @param account - The legacy {@link Ed25519Account} to convert.
   * @returns A new {@link SingleKeyAccount} with the same key and address.
   */
  static fromEd25519Account(account: Ed25519Account): SingleKeyAccount {
    return new SingleKeyAccount({ privateKey: account.privateKey, address: account.accountAddress });
  }

  /**
   * Verifies that the given signature is valid for the given message under this
   * account's public key.
   *
   * @param args - An object containing the `message` (hex input) and the
   *   `signature` ({@link AnySignature}) to verify.
   * @returns `true` if the signature is valid, `false` otherwise.
   */
  verifySignature(args: { message: HexInput; signature: AnySignature }): boolean {
    return this.publicKey.verifySignature(args);
  }

  /**
   * Signs a message and returns an {@link AccountAuthenticatorSingleKey} wrapping
   * the public key and the signature.
   *
   * @param message - The message bytes to sign, in any supported hex input format.
   * @returns An {@link AccountAuthenticatorSingleKey} ready for use in a transaction.
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorSingleKey {
    return new AccountAuthenticatorSingleKey(this.publicKey, this.sign(message));
  }

  /**
   * Signs a raw transaction and returns an {@link AccountAuthenticatorSingleKey}.
   *
   * @param transaction - The raw transaction to sign.
   * @returns An {@link AccountAuthenticatorSingleKey} containing the signature.
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorSingleKey {
    return new AccountAuthenticatorSingleKey(this.publicKey, this.signTransaction(transaction));
  }

  /**
   * Signs a message and returns the raw {@link AnySignature}.
   *
   * @param message - The message bytes to sign, in any supported hex input format.
   * @returns The {@link AnySignature} over the message.
   */
  sign(message: HexInput): AnySignature {
    return new AnySignature(this.privateKey.sign(message));
  }

  /**
   * Signs a raw transaction and returns the raw {@link AnySignature}.
   *
   * @param transaction - The raw transaction to sign.
   * @returns The {@link AnySignature} over the transaction signing message.
   */
  signTransaction(transaction: AnyRawTransaction): AnySignature {
    return this.sign(generateSigningMessageForTransaction(transaction));
  }
}
