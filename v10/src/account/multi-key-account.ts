// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, type AccountAddressInput } from "../core/account-address.js";
import { AuthenticationKey } from "../core/authentication-key.js";
import { MultiKey, MultiKeySignature } from "../crypto/multi-key.js";
import type { PublicKey } from "../crypto/public-key.js";
import { SigningScheme } from "../crypto/types.js";
import type { HexInput } from "../hex/index.js";
import { AccountAuthenticatorMultiKey } from "../transactions/authenticator.js";
import type { AnyRawTransaction } from "../transactions/types.js";
import type { AbstractKeylessAccount } from "./abstract-keyless-account.js";
import { Ed25519Account } from "./ed25519-account.js";
import { SingleKeyAccount } from "./single-key-account.js";
import type { Account, KeylessSigner, SingleKeySigner, SingleKeySignerOrLegacyEd25519Account } from "./types.js";

/**
 * A multi-key account that requires M-of-N signatures to authorise transactions.
 *
 * Each signer is either a {@link SingleKeyAccount} or a legacy {@link Ed25519Account}
 * (which is silently promoted to a {@link SingleKeyAccount} internally).  The number
 * of signers provided at construction time must equal the `signaturesRequired`
 * threshold declared in the accompanying {@link MultiKey}.
 *
 * Implements {@link KeylessSigner} so that keyless sub-signers are supported.
 *
 * @example
 * ```typescript
 * const alice = SingleKeyAccount.generate();
 * const bob   = SingleKeyAccount.generate();
 *
 * const account = MultiKeyAccount.fromPublicKeysAndSigners({
 *   publicKeys: [alice.publicKey.publicKey, bob.publicKey.publicKey],
 *   signaturesRequired: 2,
 *   signers: [alice, bob],
 * });
 * ```
 */
export class MultiKeyAccount implements Account, KeylessSigner {
  /** The {@link MultiKey} holding the set of public keys and the threshold. */
  readonly publicKey: MultiKey;
  /** The on-chain address of this account. */
  readonly accountAddress: AccountAddress;
  /** Always `SigningScheme.MultiKey` for this account type. */
  readonly signingScheme: SigningScheme = SigningScheme.MultiKey;
  /**
   * The active signers, sorted in ascending bit-position order as required by
   * on-chain verification.
   */
  readonly signers: Account[];
  /**
   * The indices of each signer within the {@link MultiKey}'s public key array,
   * sorted in ascending order.
   */
  readonly signerIndicies: number[];
  /**
   * The pre-computed bitmap indicating which key positions in the {@link MultiKey}
   * have provided a signature.
   */
  readonly signaturesBitmap: Uint8Array;

  /**
   * Creates a {@link MultiKeyAccount} from an existing {@link MultiKey} and the
   * corresponding active signers.
   *
   * The number of `signers` must exactly equal `multiKey.signaturesRequired`.
   * Legacy {@link Ed25519Account} signers are automatically promoted to
   * {@link SingleKeyAccount}.
   *
   * @param args.multiKey - The {@link MultiKey} containing all public keys and the threshold.
   * @param args.signers - The subset of signers (must equal the threshold in count).
   * @param args.address - Optional explicit on-chain address; derived from the MultiKey when omitted.
   *
   * @throws Error if the number of signers does not match `multiKey.signaturesRequired`.
   */
  constructor(args: {
    multiKey: MultiKey;
    signers: SingleKeySignerOrLegacyEd25519Account[];
    address?: AccountAddressInput;
  }) {
    const { multiKey, address } = args;

    const signers = args.signers.map((signer) =>
      signer instanceof Ed25519Account ? SingleKeyAccount.fromEd25519Account(signer) : signer,
    );

    if (multiKey.signaturesRequired > signers.length) {
      throw new Error(
        `Not enough signers provided to satisfy the required signatures. Need ${multiKey.signaturesRequired} signers, but only ${signers.length} provided`,
      );
    } else if (multiKey.signaturesRequired < signers.length) {
      throw new Error(
        `More signers provided than required. Need ${multiKey.signaturesRequired} signers, but ${signers.length} provided`,
      );
    }

    this.publicKey = multiKey;
    this.accountAddress = address
      ? AccountAddress.from(address)
      : AuthenticationKey.fromSchemeAndBytes({
          scheme: SigningScheme.MultiKey,
          input: this.publicKey.bcsToBytes(),
        }).derivedAddress();

    // For each signer, find its corresponding position in the MultiKey's public keys array
    const bitPositions: number[] = [];
    for (const signer of signers) {
      bitPositions.push(this.publicKey.getIndex((signer as SingleKeySigner).getAnyPublicKey()));
    }

    // Sort signers by bit position (on-chain verification requires ascending order)
    const signersAndBitPosition: [Account, number][] = signers.map((signer, index) => [
      signer as Account,
      bitPositions[index],
    ]);
    signersAndBitPosition.sort((a, b) => a[1] - b[1]);

    this.signers = signersAndBitPosition.map((value) => value[0]);
    this.signerIndicies = signersAndBitPosition.map((value) => value[1]);
    this.signaturesBitmap = this.publicKey.createBitmap({ bits: bitPositions });
  }

  /**
   * Convenience factory that constructs a {@link MultiKey} from raw public keys
   * and a threshold, then creates a {@link MultiKeyAccount} from it.
   *
   * @param args.publicKeys - The full set of public keys for this multi-key account.
   * @param args.signaturesRequired - The minimum number of signatures needed.
   * @param args.signers - The active signers (count must equal `signaturesRequired`).
   * @param args.address - Optional explicit on-chain address.
   * @returns A new {@link MultiKeyAccount}.
   *
   * @example
   * ```typescript
   * const account = MultiKeyAccount.fromPublicKeysAndSigners({
   *   publicKeys: [alice.publicKey.publicKey, bob.publicKey.publicKey],
   *   signaturesRequired: 2,
   *   signers: [alice, bob],
   * });
   * ```
   */
  static fromPublicKeysAndSigners(args: {
    address?: AccountAddressInput;
    publicKeys: PublicKey[];
    signaturesRequired: number;
    signers: SingleKeySignerOrLegacyEd25519Account[];
  }): MultiKeyAccount {
    const { address, publicKeys, signaturesRequired, signers } = args;
    const multiKey = new MultiKey({ publicKeys, signaturesRequired });
    return new MultiKeyAccount({ multiKey, signers, address });
  }

  /**
   * Type-guard that checks whether an {@link Account} is a {@link MultiKeyAccount}.
   *
   * @param account - The account to check.
   * @returns `true` if `account` is an instance of {@link MultiKeyAccount}.
   */
  static isMultiKeySigner(account: Account): account is MultiKeyAccount {
    return account instanceof MultiKeyAccount;
  }

  /**
   * Waits for any keyless sub-signers to finish fetching their zero-knowledge proofs.
   *
   * @returns A promise that resolves once all pending proof fetches have completed.
   */
  async waitForProofFetch(): Promise<void> {
    const keylessSigners = this.signers.filter(
      (signer) => "waitForProofFetch" in signer && typeof signer.waitForProofFetch === "function",
    );
    await Promise.all(keylessSigners.map(async (signer) => (signer as AbstractKeylessAccount).waitForProofFetch()));
  }

  /**
   * Validates all keyless sub-signers by calling their `checkKeylessAccountValidity`
   * method.
   *
   * Throws a {@link KeylessError} if any sub-signer is expired or missing a proof.
   *
   * @param args - Additional arguments forwarded to each keyless signer's validity check.
   * @returns A promise that resolves when all keyless signers are valid.
   */
  async checkKeylessAccountValidity(...args: unknown[]): Promise<void> {
    const keylessSigners = this.signers.filter(
      (signer) => "checkKeylessAccountValidity" in signer && typeof signer.checkKeylessAccountValidity === "function",
    );
    await Promise.all(keylessSigners.map((signer) => (signer as KeylessSigner).checkKeylessAccountValidity(...args)));
  }

  /**
   * Signs a message with all active signers and returns an
   * {@link AccountAuthenticatorMultiKey}.
   *
   * @param message - The message bytes to sign, in any supported hex input format.
   * @returns An {@link AccountAuthenticatorMultiKey} containing all signatures and the bitmap.
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorMultiKey {
    return new AccountAuthenticatorMultiKey(this.publicKey, this.sign(message));
  }

  /**
   * Signs a raw transaction with all active signers and returns an
   * {@link AccountAuthenticatorMultiKey}.
   *
   * @param transaction - The raw transaction to sign.
   * @returns An {@link AccountAuthenticatorMultiKey} containing all signatures and the bitmap.
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorMultiKey {
    return new AccountAuthenticatorMultiKey(this.publicKey, this.signTransaction(transaction));
  }

  /**
   * Signs a message with all active signers and returns the raw
   * {@link MultiKeySignature}.
   *
   * @param data - The message bytes to sign, in any supported hex input format.
   * @returns A {@link MultiKeySignature} containing all individual signatures and the bitmap.
   */
  sign(data: HexInput): MultiKeySignature {
    const signatures = [];
    for (const signer of this.signers) {
      signatures.push(signer.sign(data));
    }
    return new MultiKeySignature({ signatures, bitmap: this.signaturesBitmap });
  }

  /**
   * Signs a raw transaction with all active signers and returns the raw
   * {@link MultiKeySignature}.
   *
   * @param transaction - The raw transaction to sign.
   * @returns A {@link MultiKeySignature} containing all individual signatures and the bitmap.
   */
  signTransaction(transaction: AnyRawTransaction): MultiKeySignature {
    const signatures = [];
    for (const signer of this.signers) {
      signatures.push(signer.signTransaction(transaction));
    }
    return new MultiKeySignature({ signatures, bitmap: this.signaturesBitmap });
  }

  /**
   * Verifies that the given multi-key signature is valid for the given message.
   *
   * @param args - An object containing the `message` (hex input) and the
   *   `signature` ({@link MultiKeySignature}) to verify.
   * @returns `true` if the signature is valid, `false` otherwise.
   */
  verifySignature(args: { message: HexInput; signature: MultiKeySignature }): boolean {
    return this.publicKey.verifySignature(args);
  }
}
