// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from "@noble/hashes/utils";


import { Ed25519PrivateKey, EphemeralPublicKey, EphemeralSignature, PrivateKey} from "../core/crypto";
import { Hex } from "../core/hex";
import { bytesToBigIntLE, padAndPackBytesWithLen, poseidonHash } from "../core/crypto/poseidon";
import { GenerateAccount, HexInput, SigningSchemeInput } from "../types";

export class EphemeralKeyPair {
  readonly blinder: Uint8Array;

  readonly expiryDateSecs: bigint;

  readonly nonce: string;

  readonly privateKey: PrivateKey;

  readonly publicKey: EphemeralPublicKey;

  constructor(args: { privateKey: PrivateKey; expiryDateSecs?: bigint; blinder?: HexInput }) {
    const { privateKey, expiryDateSecs, blinder } = args;
    this.privateKey = privateKey;
    this.publicKey = new EphemeralPublicKey(privateKey.publicKey());
    const currentDate = new Date();
    const currentTimeInSeconds = Math.floor(currentDate.getTime() / 1000) + 100000;
    this.expiryDateSecs = expiryDateSecs || BigInt(currentTimeInSeconds);
    this.blinder = blinder !== undefined ? Hex.fromHexInput(blinder).toUint8Array() : generateBlinder();
    this.nonce = this.generateNonce();
  }

  static generate(args?: GenerateAccount): EphemeralKeyPair {
    let privateKey: PrivateKey;

    switch (args?.scheme) {
      case SigningSchemeInput.Ed25519:
      default:
        privateKey = Ed25519PrivateKey.generate();
    }

    return new EphemeralKeyPair({ privateKey });
  }

  generateNonce(): string {
    const fields = padAndPackBytesWithLen(this.publicKey.bcsToBytes(), 93);
    fields.push(BigInt(this.expiryDateSecs))
    fields.push(bytesToBigIntLE(this.blinder))
    const nonceHash = poseidonHash(fields);
    return nonceHash.toString();
  }

  /**
   * Sign the given message with the private key.
   *   *
   * @param data in HexInput format
   * @returns EphemeralSignature
   */
  sign(data: HexInput): EphemeralSignature {
    return new EphemeralSignature(this.privateKey.sign(data));
  }
}

function generateBlinder(): Uint8Array {
  return randomBytes(31);
}
