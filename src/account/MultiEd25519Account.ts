import { AptosConfig } from "../api";
import { AccountAddress, AccountAddressInput } from "../core/accountAddress";
import { Ed25519PrivateKey, Signature } from "../core/crypto";
import { MultiEd25519PublicKey, MultiEd25519Signature } from "../core/crypto/multiEd25519";
import { AccountAuthenticatorMultiEd25519 } from "../transactions/authenticator/account";
import { generateSigningMessageForTransaction } from "../transactions/transactionBuilder/signingMessage";
import { AnyRawTransaction } from "../transactions/types";
import { HexInput, SigningScheme } from "../types";
import type { Account } from "./Account";

export interface MultiEd25519SignerConstructorArgs {
  publicKey: MultiEd25519PublicKey;
  signers: Ed25519PrivateKey[];
  address?: AccountAddressInput;
}

export interface VerifyMultiEd25519SignatureArgs {
  message: HexInput;
  signature: MultiEd25519Signature;
}

/**
 * Signer implementation for the Multi-Ed25519 authentication scheme.
 *
 * Note: This authentication scheme is a legacy authentication scheme.  Prefer using MultiKeyAccounts as a
 * MultiKeyAccount can support any type of signer, not just Ed25519.  Generating a signer instance does not
 * create the account on-chain.
 */
export class MultiEd25519Account implements Account {
  readonly publicKey: MultiEd25519PublicKey;

  readonly accountAddress: AccountAddress;

  readonly signingScheme = SigningScheme.MultiEd25519;

  /**
   * The signers used to sign messages.  These signers should correspond to public keys in the
   * MultiEd25519Account.  The number of signers should be equal to this.publicKey.threshold.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly signers: Ed25519PrivateKey[];

  /**
   * An array of indices where for signer[i], signerIndicies[i] is the index of the corresponding public key in
   * publicKey.publicKeys.  Used to derive the right public key to use for verification.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly signerIndices: number[];

  readonly signaturesBitmap: Uint8Array;

  // region Constructors

  constructor(args: MultiEd25519SignerConstructorArgs) {
    const { signers, publicKey, address } = args;
    this.publicKey = publicKey;
    this.accountAddress = address ? AccountAddress.from(address) : this.publicKey.authKey().derivedAddress();

    if (publicKey.threshold > signers.length) {
      throw new Error(
        // eslint-disable-next-line max-len
        `Not enough signers provided to satisfy the required signatures. Need ${publicKey.threshold} signers, but only ${signers.length} provided`,
      );
    } else if (publicKey.threshold < signers.length) {
      throw new Error(
        // eslint-disable-next-line max-len
        `More signers provided than required. Need ${publicKey.threshold} signers, but ${signers.length} provided`,
      );
    }

    // For each signer, find its corresponding position in the public keys array
    const bitPositions: number[] = [];
    for (const signer of signers) {
      bitPositions.push(this.publicKey.getIndex(signer.publicKey()));
    }

    // Create pairs of [signer, position] and sort them by position
    // This sorting is critical because:
    // 1. The on-chain verification expects signatures to be in ascending order by bit position
    // 2. The bitmap must match the order of signatures when verifying
    const signersAndBitPosition: [Ed25519PrivateKey, number][] = signers.map((signer, index) => [
      signer,
      bitPositions[index],
    ]);
    signersAndBitPosition.sort((a, b) => a[1] - b[1]);

    // Extract the sorted signers and their positions into separate arrays
    this.signers = signersAndBitPosition.map((value) => value[0]);
    this.signerIndices = signersAndBitPosition.map((value) => value[1]);

    // Create a bitmap representing which public keys from the MultiEd25519PublicKey are being used
    // This bitmap is used during signature verification to identify which public keys
    // should be used to verify each signature
    this.signaturesBitmap = this.publicKey.createBitmap({ bits: bitPositions });
  }

  // endregion

  // region Account

  /**
   * Verify the given message and signature with the public key.
   *
   * @param args.message raw message data in HexInput format
   * @param args.signature signed message Signature
   * @returns
   */
  verifySignature(args: VerifyMultiEd25519SignatureArgs): boolean {
    return this.publicKey.verifySignature(args);
  }

  /**
   * Verify the given message and signature with the public key.
   *
   * MultiEd25519 signatures do not depend on chain state, so this function is
   * equivalent to the synchronous verifySignature method.
   *
   * @param args - The arguments for verifying the signature.
   * @param args.aptosConfig - The configuration object for connecting to the Aptos network
   * @param args.message - Raw message data in HexInput format.
   * @param args.signature - Signed message signature.
   * @returns A boolean indicating whether the signature is valid.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  async verifySignatureAsync(args: {
    aptosConfig: AptosConfig;
    message: HexInput;
    signature: Signature;
    options?: { throwErrorWithReason?: boolean };
  }): Promise<boolean> {
    return this.publicKey.verifySignatureAsync({
      ...args,
      signature: args.signature,
    });
  }

  /**
   * Sign a message using the account's Ed25519 private key.
   * @param message the signing message, as binary input
   * @return the AccountAuthenticator containing the signature, together with the account's public key
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorMultiEd25519 {
    return new AccountAuthenticatorMultiEd25519(this.publicKey, this.sign(message));
  }

  /**
   * Sign a transaction using the account's Ed25519 private keys.
   * @param transaction the raw transaction
   * @return the AccountAuthenticator containing the signature of the transaction, together with the account's public key
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorMultiEd25519 {
    return new AccountAuthenticatorMultiEd25519(this.publicKey, this.signTransaction(transaction));
  }

  /**
   * Sign the given message using the account's Ed25519 private keys.
   * @param message in HexInput format
   * @returns MultiEd25519Signature
   */
  sign(message: HexInput): MultiEd25519Signature {
    const signatures = [];
    for (const signer of this.signers) {
      signatures.push(signer.sign(message));
    }
    return new MultiEd25519Signature({ signatures, bitmap: this.signaturesBitmap });
  }

  /**
   * Sign the given transaction using the available signing capabilities.
   * @param transaction the transaction to be signed
   * @returns Signature
   */
  signTransaction(transaction: AnyRawTransaction): MultiEd25519Signature {
    return this.sign(generateSigningMessageForTransaction(transaction));
  }

  // endregion
}
