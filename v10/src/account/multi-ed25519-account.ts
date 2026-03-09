// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, type AccountAddressInput } from "../core/account-address.js";
import { AuthenticationKey } from "../core/authentication-key.js";
import type { Ed25519PrivateKey, Ed25519Signature } from "../crypto/ed25519.js";
import { type MultiEd25519PublicKey, MultiEd25519Signature } from "../crypto/multi-ed25519.js";
import { SigningScheme } from "../crypto/types.js";
import type { HexInput } from "../hex/index.js";
import { AccountAuthenticatorMultiEd25519 } from "../transactions/authenticator.js";
import { generateSigningMessageForTransaction } from "../transactions/signing-message.js";
import type { AnyRawTransaction } from "../transactions/types.js";
import type { Account } from "./types.js";

/**
 * Constructor arguments for {@link MultiEd25519Account}.
 */
export interface MultiEd25519SignerConstructorArgs {
  /** The {@link MultiEd25519PublicKey} containing all public keys and the threshold. */
  publicKey: MultiEd25519PublicKey;
  /**
   * The active Ed25519 private keys.  The count must equal
   * `publicKey.threshold`.
   */
  signers: Ed25519PrivateKey[];
  /**
   * Optional explicit on-chain address.  When omitted the address is derived
   * from the MultiEd25519 authentication key.
   */
  address?: AccountAddressInput;
}

/**
 * A legacy multi-signature account that requires M-of-N Ed25519 signatures.
 *
 * This class implements the original Aptos multi-Ed25519 authentication scheme.
 * For new accounts, prefer {@link MultiKeyAccount} with individual
 * {@link SingleKeyAccount} signers, which supports heterogeneous key types.
 *
 * The number of private keys provided must exactly equal the
 * `publicKey.threshold`.
 *
 * @example
 * ```typescript
 * const keys = [Ed25519PrivateKey.generate(), Ed25519PrivateKey.generate()];
 * const multiKey = new MultiEd25519PublicKey({
 *   publicKeys: keys.map((k) => k.publicKey()),
 *   threshold: 2,
 * });
 * const account = new MultiEd25519Account({ publicKey: multiKey, signers: keys });
 * ```
 */
export class MultiEd25519Account implements Account {
  /** The {@link MultiEd25519PublicKey} holding all public keys and the threshold. */
  readonly publicKey: MultiEd25519PublicKey;
  /** The on-chain address of this account. */
  readonly accountAddress: AccountAddress;
  /** Always `SigningScheme.MultiEd25519` for this account type. */
  readonly signingScheme = SigningScheme.MultiEd25519;
  /**
   * The active private keys, sorted in ascending index order as required by
   * on-chain verification.
   */
  readonly signers: Ed25519PrivateKey[];
  /**
   * The indices of each signer within the public key array, sorted in
   * ascending order.
   */
  readonly signerIndices: number[];
  /**
   * The pre-computed bitmap indicating which key positions have provided a
   * signature.
   */
  readonly signaturesBitmap: Uint8Array;

  /**
   * Creates a {@link MultiEd25519Account}.
   *
   * @param args - {@link MultiEd25519SignerConstructorArgs}
   *
   * @throws Error if the number of signers does not match `publicKey.threshold`.
   */
  constructor(args: MultiEd25519SignerConstructorArgs) {
    const { signers, publicKey, address } = args;
    this.publicKey = publicKey;
    this.accountAddress = address
      ? AccountAddress.from(address)
      : AuthenticationKey.fromSchemeAndBytes({
          scheme: SigningScheme.MultiEd25519,
          input: this.publicKey.bcsToBytes(),
        }).derivedAddress();

    if (publicKey.threshold > signers.length) {
      throw new Error(
        `Not enough signers provided to satisfy the required signatures. Need ${publicKey.threshold} signers, but only ${signers.length} provided`,
      );
    } else if (publicKey.threshold < signers.length) {
      throw new Error(
        `More signers provided than required. Need ${publicKey.threshold} signers, but ${signers.length} provided`,
      );
    }

    const bitPositions: number[] = [];
    for (const signer of signers) {
      bitPositions.push(this.publicKey.getIndex(signer.publicKey()));
    }

    const signersAndBitPosition: [Ed25519PrivateKey, number][] = signers.map((signer, index) => [
      signer,
      bitPositions[index],
    ]);
    signersAndBitPosition.sort((a, b) => a[1] - b[1]);

    this.signers = signersAndBitPosition.map((value) => value[0]);
    this.signerIndices = signersAndBitPosition.map((value) => value[1]);
    this.signaturesBitmap = this.publicKey.createBitmap({ bits: this.signerIndices });
  }

  /**
   * Verifies that the given multi-Ed25519 signature is valid for the given message.
   *
   * @param args - An object with the `message` (hex input) and the
   *   `signature` ({@link MultiEd25519Signature}) to verify.
   * @returns `true` if the signature is valid, `false` otherwise.
   */
  verifySignature(args: { message: HexInput; signature: MultiEd25519Signature }): boolean {
    return this.publicKey.verifySignature(args);
  }

  /**
   * Signs a message with all active keys and returns an
   * {@link AccountAuthenticatorMultiEd25519}.
   *
   * @param message - The message bytes to sign, in any supported hex input format.
   * @returns An {@link AccountAuthenticatorMultiEd25519} ready for use in a transaction.
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorMultiEd25519 {
    return new AccountAuthenticatorMultiEd25519(this.publicKey, this.sign(message));
  }

  /**
   * Signs a raw transaction with all active keys and returns an
   * {@link AccountAuthenticatorMultiEd25519}.
   *
   * @param transaction - The raw transaction to sign.
   * @returns An {@link AccountAuthenticatorMultiEd25519} containing all signatures.
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorMultiEd25519 {
    return new AccountAuthenticatorMultiEd25519(this.publicKey, this.signTransaction(transaction));
  }

  /**
   * Signs a message with all active keys and returns the raw
   * {@link MultiEd25519Signature}.
   *
   * @param message - The message bytes to sign, in any supported hex input format.
   * @returns A {@link MultiEd25519Signature} containing all individual signatures and the bitmap.
   */
  sign(message: HexInput): MultiEd25519Signature {
    const signatures = [];
    for (const signer of this.signers) {
      signatures.push(signer.sign(message) as Ed25519Signature);
    }
    return new MultiEd25519Signature({ signatures, bitmap: this.signaturesBitmap });
  }

  /**
   * Signs a raw transaction with all active keys and returns the raw
   * {@link MultiEd25519Signature}.
   *
   * @param transaction - The raw transaction to sign.
   * @returns A {@link MultiEd25519Signature} containing all individual signatures and the bitmap.
   */
  signTransaction(transaction: AnyRawTransaction): MultiEd25519Signature {
    return this.sign(generateSigningMessageForTransaction(transaction));
  }
}
