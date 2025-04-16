// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Account } from "./Account";
import { MultiKey, MultiKeySignature, PublicKey } from "../core/crypto";
import { AccountAddress, AccountAddressInput } from "../core/accountAddress";
import { HexInput, SigningScheme } from "../types";
import { AccountAuthenticatorMultiKey } from "../transactions/authenticator/account";
import { AnyRawTransaction } from "../transactions/types";
import { AbstractKeylessAccount, KeylessSigner } from "./AbstractKeylessAccount";
import { AptosConfig } from "../api/aptosConfig";
import { SingleKeyAccount, SingleKeySigner, SingleKeySignerOrLegacyEd25519Account } from "./SingleKeyAccount";
import { Ed25519Account } from "./Ed25519Account";

/**
 * Arguments required to verify a multi-key signature against a given message.
 *
 * @param message - The original message that was signed.
 * @param signature - The multi-key signature to be verified.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface VerifyMultiKeySignatureArgs {
  message: HexInput;
  signature: MultiKeySignature;
}

/**
 * Signer implementation for the MultiKey authentication scheme.
 *
 * This account utilizes an M of N signing scheme, where M and N are specified in the {@link MultiKey}.
 * It signs messages using an array of M accounts, each corresponding to a public key in the {@link MultiKey}.
 *
 * Note: Generating a signer instance does not create the account on-chain.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export class MultiKeyAccount implements Account, KeylessSigner {
  /**
   * Public key associated with the account
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly publicKey: MultiKey;

  /**
   * Account address associated with the account
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly accountAddress: AccountAddress;

  /**
   * Signing scheme used to sign transactions
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly signingScheme: SigningScheme = SigningScheme.MultiKey;

  /**
   * The signers used to sign messages.  These signers should correspond to public keys in the
   * MultiKeyAccount's public key.  The number of signers should be equal to this.publicKey.signaturesRequired.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly signers: Account[];

  /**
   * An array of indices where for signer[i], signerIndicies[i] is the index of the corresponding public key in
   * publicKey.publicKeys.  Used to derive the right public key to use for verification.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  // TODO: Rename Indicies to Indices
  readonly signerIndicies: number[];

  readonly signaturesBitmap: Uint8Array;

  /**
   * Constructs a MultiKeyAccount instance, which requires multiple signatures for transactions.
   *
   * @param args - The arguments for creating a MultiKeyAccount.
   * @param args.multiKey - The multikey of the account consisting of N public keys and a number M representing the required signatures.
   * @param args.signers - An array of M signers that will be used to sign the transaction.
   * @param args.address - An optional account address input. If not provided, the derived address from the public key will be used.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  constructor(args: {
    multiKey: MultiKey;
    signers: SingleKeySignerOrLegacyEd25519Account[];
    address?: AccountAddressInput;
  }) {
    const { multiKey, address } = args;

    const signers: SingleKeySigner[] = args.signers.map((signer) =>
      signer instanceof Ed25519Account ? SingleKeyAccount.fromEd25519Account(signer) : signer,
    );

    if (multiKey.signaturesRequired > signers.length) {
      throw new Error(
        // eslint-disable-next-line max-len
        `Not enough signers provided to satisfy the required signatures. Need ${multiKey.signaturesRequired} signers, but only ${signers.length} provided`,
      );
    } else if (multiKey.signaturesRequired < signers.length) {
      throw new Error(
        // eslint-disable-next-line max-len
        `More signers provided than required. Need ${multiKey.signaturesRequired} signers, but ${signers.length} provided`,
      );
    }

    this.publicKey = multiKey;

    this.accountAddress = address ? AccountAddress.from(address) : this.publicKey.authKey().derivedAddress();

    // For each signer, find its corresponding position in the MultiKey's public keys array
    const bitPositions: number[] = [];
    for (const signer of signers) {
      bitPositions.push(this.publicKey.getIndex(signer.getAnyPublicKey()));
    }

    // Create pairs of [signer, position] and sort them by position
    // This sorting is critical because:
    // 1. The on-chain verification expects signatures to be in ascending order by bit position
    // 2. The bitmap must match the order of signatures when verifying
    const signersAndBitPosition: [Account, number][] = signers.map((signer, index) => [signer, bitPositions[index]]);
    signersAndBitPosition.sort((a, b) => a[1] - b[1]);

    // Extract the sorted signers and their positions into separate arrays
    this.signers = signersAndBitPosition.map((value) => value[0]);
    this.signerIndicies = signersAndBitPosition.map((value) => value[1]);

    // Create a bitmap representing which public keys from the MultiKey are being used
    // This bitmap is used during signature verification to identify which public keys
    // should be used to verify each signature
    this.signaturesBitmap = this.publicKey.createBitmap({ bits: bitPositions });
  }

  /**
   * Static constructor to create a MultiKeyAccount using the provided public keys and signers.
   *
   * @param args - The arguments for creating a MultiKeyAccount.
   * @param args.publicKeys - The N public keys of the MultiKeyAccount.
   * @param args.signaturesRequired - The number of signatures required to authorize a transaction.
   * @param args.signers - An array of M signers that will be used to sign the transaction.
   * @returns MultiKeyAccount - The newly created MultiKeyAccount.
   * @group Implementation
   * @category Account (On-Chain Model)
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
   * Determines if the provided account is a multi-key account.
   *
   * @param account - The account to check.
   * @returns A boolean indicating whether the account is a multi-key account.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  static isMultiKeySigner(account: Account): account is MultiKeyAccount {
    return account instanceof MultiKeyAccount;
  }

  /**
   * Sign a message using the account's signers and return an AccountAuthenticator containing the signature along with the
   * account's public key.
   * @param message - The signing message, represented as binary input in hexadecimal format.
   * @returns An instance of AccountAuthenticatorMultiKey that includes the signature and the public key.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorMultiKey {
    return new AccountAuthenticatorMultiKey(this.publicKey, this.sign(message));
  }

  /**
   * Sign a transaction using the account's signers, returning an AccountAuthenticator that contains the signature and the
   * account's public key.
   * @param transaction - The raw transaction to be signed.
   * @returns An AccountAuthenticatorMultiKey containing the signature of the transaction along with the account's public key.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorMultiKey {
    return new AccountAuthenticatorMultiKey(this.publicKey, this.signTransaction(transaction));
  }

  /**
   * Waits for any proofs on KeylessAccount signers to be fetched. This ensures that signing with the KeylessAccount does not
   * fail due to missing proofs.
   * @return {Promise<void>} A promise that resolves when all proofs have been fetched.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  async waitForProofFetch(): Promise<void> {
    const keylessSigners = this.signers.filter(
      (signer) => signer instanceof AbstractKeylessAccount,
    ) as AbstractKeylessAccount[];
    const promises = keylessSigners.map(async (signer) => signer.waitForProofFetch());
    await Promise.all(promises);
  }

  /**
   * Validates that the Keyless Account can be used to sign transactions.
   * @return
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  async checkKeylessAccountValidity(aptosConfig: AptosConfig): Promise<void> {
    const keylessSigners = this.signers.filter(
      (signer) => signer instanceof AbstractKeylessAccount,
    ) as AbstractKeylessAccount[];
    const promises = keylessSigners.map((signer) => signer.checkKeylessAccountValidity(aptosConfig));
    await Promise.all(promises);
  }

  /**
   * Sign the given message using the MultiKeyAccount's signers
   * @param data - The data to be signed in HexInput format.
   * @returns MultiKeySignature
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  sign(data: HexInput): MultiKeySignature {
    const signatures = [];
    for (const signer of this.signers) {
      signatures.push(signer.sign(data));
    }
    return new MultiKeySignature({ signatures, bitmap: this.signaturesBitmap });
  }

  /**
   * Sign the given transaction using the MultiKeyAccount's signers.
   * This function aggregates signatures from all signers associated with the MultiKeyAccount.
   *
   * @param transaction - The transaction to be signed.
   * @returns MultiKeySignature - An object containing the aggregated signatures and a bitmap of the signatures.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  signTransaction(transaction: AnyRawTransaction): MultiKeySignature {
    const signatures = [];
    for (const signer of this.signers) {
      signatures.push(signer.signTransaction(transaction));
    }
    return new MultiKeySignature({ signatures, bitmap: this.signaturesBitmap });
  }

  /**
   * Verify the given message and signature with the public keys.
   *
   * This function checks if the provided signatures are valid for the given message using the corresponding public keys.
   * Note: If you are using KeylessAccounts, you must use `verifySignatureAsync` instead.
   *
   * @param args - The arguments for verifying the signature.
   * @param args.message - The raw message data in HexInput format.
   * @param args.signature - The signed message MultiKeySignature containing multiple signatures.
   * @returns A boolean indicating whether the signatures are valid for the message.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  verifySignature(args: { message: HexInput; signature: MultiKeySignature }): boolean {
    return this.publicKey.verifySignature(args);
  }

  /**
   * Verify the given message and signature with the public keys.
   *
   * This function checks if the provided signatures are valid for the given message using the corresponding public keys.
   *
   * @param args - The arguments for verifying the signature.
   * @param args.message - The raw message data in HexInput format.
   * @param args.signature - The signed message MultiKeySignature containing multiple signatures.
   * @param args.options.throwErrorWithReason - Whether to throw an error with the reason for the verification failure.
   * @returns A boolean indicating whether the signatures are valid for the message.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  async verifySignatureAsync(args: {
    aptosConfig: AptosConfig;
    message: HexInput;
    signature: MultiKeySignature;
    options?: { throwErrorWithReason?: boolean };
  }): Promise<boolean> {
    return await this.publicKey.verifySignatureAsync(args);
  }
}
