// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "./Account";
import { MultiKey, MultiKeySignature, PublicKey } from "../core/crypto";
import { AccountAddress, AccountAddressInput } from "../core/accountAddress";
import { HexInput, SigningScheme } from "../types";
import { AccountAuthenticatorMultiKey } from "../transactions/authenticator/account";
import { AnyRawTransaction } from "../transactions/types";
import { AbstractKeylessAccount } from "./AbstractKeylessAccount";

/**
 * Arguments required to verify a multi-key signature against a given message.
 *
 * @param message - The original message that was signed.
 * @param signature - The multi-key signature to be verified.
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
 */
export class MultiKeyAccount implements Account {
  /**
   * Public key associated with the account
   */
  readonly publicKey: MultiKey;

  /**
   * Account address associated with the account
   */
  readonly accountAddress: AccountAddress;

  /**
   * Signing scheme used to sign transactions
   */
  readonly signingScheme: SigningScheme;

  /**
   * The signers used to sign messages.  These signers should correspond to public keys in the
   * MultiKeyAccount's public key.  The number of signers should be equal or greater
   * than this.publicKey.signaturesRequired
   */
  readonly signers: Account[];

  /**
   * An array of indices where for signer[i], signerIndicies[i] is the index of the corresponding public key in
   * publicKey.publicKeys.  Used to derive the right public key to use for verification.
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
   */
  constructor(args: { multiKey: MultiKey; signers: Account[]; address?: AccountAddressInput }) {
    const { multiKey, signers, address } = args;

    this.publicKey = multiKey;
    this.signingScheme = SigningScheme.MultiKey;

    this.accountAddress = address ? AccountAddress.from(address) : this.publicKey.authKey().derivedAddress();

    // Get the index of each respective signer in the bitmap
    const bitPositions: number[] = [];
    for (const signer of signers) {
      bitPositions.push(this.publicKey.getIndex(signer.publicKey));
    }
    // Zip signers and bit positions and sort signers by bit positions in order
    // to ensure the signature is signed in ascending order according to the bitmap.
    // Authentication on chain will fail otherwise.
    const signersAndBitPosition: [Account, number][] = signers.map((signer, index) => [signer, bitPositions[index]]);
    signersAndBitPosition.sort((a, b) => a[1] - b[1]);
    this.signers = signersAndBitPosition.map((value) => value[0]);
    this.signerIndicies = signersAndBitPosition.map((value) => value[1]);
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
   */
  static fromPublicKeysAndSigners(args: {
    publicKeys: PublicKey[];
    signaturesRequired: number;
    signers: Account[];
  }): MultiKeyAccount {
    const { publicKeys, signaturesRequired, signers } = args;
    const multiKey = new MultiKey({ publicKeys, signaturesRequired });
    return new MultiKeyAccount({ multiKey, signers });
  }

  /**
   * Determines if the provided account is a multi-key account.
   *
   * @param account - The account to check.
   * @returns A boolean indicating whether the account is a multi-key account.
   */
  static isMultiKeySigner(account: Account): account is MultiKeyAccount {
    return account instanceof MultiKeyAccount;
  }

  /**
   * Sign a message using the account's signers and return an AccountAuthenticator containing the signature along with the
   * account's public key.
   * @param message - The signing message, represented as binary input in hexadecimal format.
   * @returns An instance of AccountAuthenticatorMultiKey that includes the signature and the public key.
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorMultiKey {
    return new AccountAuthenticatorMultiKey(this.publicKey, this.sign(message));
  }

  /**
   * Sign a transaction using the account's signers, returning an AccountAuthenticator that contains the signature and the
   * account's public key.
   * @param transaction - The raw transaction to be signed.
   * @returns An AccountAuthenticatorMultiKey containing the signature of the transaction along with the account's public key.
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorMultiKey {
    return new AccountAuthenticatorMultiKey(this.publicKey, this.signTransaction(transaction));
  }

  /**
   * Waits for any proofs on KeylessAccount signers to be fetched. This ensures that signing with the KeylessAccount does not
   * fail due to missing proofs.
   * @return {Promise<void>} A promise that resolves when all proofs have been fetched.
   */
  async waitForProofFetch(): Promise<void> {
    const keylessSigners = this.signers.filter(
      (signer) => signer instanceof AbstractKeylessAccount,
    ) as AbstractKeylessAccount[];
    const promises = keylessSigners.map(async (signer) => signer.waitForProofFetch());
    await Promise.all(promises);
  }

  /**
   * Sign the given data using the MultiKeyAccount's signers.
   * @param data - The data to be signed in HexInput format.
   * @returns MultiKeySignature - The resulting multi-key signature.
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
   *
   * @param args - The arguments for verifying the signature.
   * @param args.message - The raw message data in HexInput format.
   * @param args.signature - The signed message MultiKeySignature containing multiple signatures.
   * @returns A boolean indicating whether the signatures are valid for the message.
   */
  verifySignature(args: VerifyMultiKeySignatureArgs): boolean {
    const { message, signature } = args;
    const isSignerIndicesSorted = this.signerIndicies.every(
      (value, i) => i === 0 || value >= this.signerIndicies[i - 1],
    );
    if (!isSignerIndicesSorted) {
      return false;
    }
    for (let i = 0; i < signature.signatures.length; i += 1) {
      const singleSignature = signature.signatures[i];
      const publicKey = this.publicKey.publicKeys[this.signerIndicies[i]];
      if (!publicKey.verifySignature({ message, signature: singleSignature })) {
        return false;
      }
    }
    return true;
  }
}
