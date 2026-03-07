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
import type { Account, KeylessSigner, SingleKeySignerOrLegacyEd25519Account } from "./types.js";

export class MultiKeyAccount implements Account, KeylessSigner {
  readonly publicKey: MultiKey;
  readonly accountAddress: AccountAddress;
  readonly signingScheme: SigningScheme = SigningScheme.MultiKey;
  readonly signers: Account[];
  readonly signerIndicies: number[];
  readonly signaturesBitmap: Uint8Array;

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
      bitPositions.push(this.publicKey.getIndex((signer as any).getAnyPublicKey()));
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

  static isMultiKeySigner(account: Account): account is MultiKeyAccount {
    return account instanceof MultiKeyAccount;
  }

  async waitForProofFetch(): Promise<void> {
    const keylessSigners = this.signers.filter(
      (signer) => "waitForProofFetch" in signer && typeof signer.waitForProofFetch === "function",
    );
    await Promise.all(keylessSigners.map(async (signer) => (signer as AbstractKeylessAccount).waitForProofFetch()));
  }

  async checkKeylessAccountValidity(...args: any[]): Promise<void> {
    const keylessSigners = this.signers.filter(
      (signer) => "checkKeylessAccountValidity" in signer && typeof signer.checkKeylessAccountValidity === "function",
    );
    await Promise.all(keylessSigners.map((signer) => (signer as any).checkKeylessAccountValidity(...args)));
  }

  signWithAuthenticator(message: HexInput): AccountAuthenticatorMultiKey {
    return new AccountAuthenticatorMultiKey(this.publicKey, this.sign(message));
  }

  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorMultiKey {
    return new AccountAuthenticatorMultiKey(this.publicKey, this.signTransaction(transaction));
  }

  sign(data: HexInput): MultiKeySignature {
    const signatures = [];
    for (const signer of this.signers) {
      signatures.push(signer.sign(data));
    }
    return new MultiKeySignature({ signatures, bitmap: this.signaturesBitmap });
  }

  signTransaction(transaction: AnyRawTransaction): MultiKeySignature {
    const signatures = [];
    for (const signer of this.signers) {
      signatures.push(signer.signTransaction(transaction));
    }
    return new MultiKeySignature({ signatures, bitmap: this.signaturesBitmap });
  }

  verifySignature(args: { message: HexInput; signature: MultiKeySignature }): boolean {
    return this.publicKey.verifySignature(args);
  }
}
