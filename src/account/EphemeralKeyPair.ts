// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from "@noble/hashes/utils";


import { EPK_HORIZON_SECS, Ed25519PrivateKey, EphemeralPublicKey, EphemeralSignature, PrivateKey} from "../core/crypto";
import { Hex } from "../core/hex";
import { bytesToBigIntLE, padAndPackBytesWithLen, poseidonHash } from "../core/crypto/poseidon";
import { HexInput, SigningSchemeInput } from "../types";

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
    this.expiryDateSecs = expiryDateSecs || BigInt(floorToWholeHour(currentTimeInSeconds() + EPK_HORIZON_SECS));
    this.blinder = blinder !== undefined ? Hex.fromHexInput(blinder).toUint8Array() : generateBlinder();
    this.nonce = this.generateNonce();
  }

  static generate(args?: {scheme: SigningSchemeInput}): EphemeralKeyPair {
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

function currentTimeInSeconds(): number {
  return Math.floor(new Date().getTime() / 1000)
}

function floorToWholeHour(timestampInSeconds: number): number {
  const date = new Date(timestampInSeconds * 1000);
  // Reset minutes and seconds to zero
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return Math.floor(date.getTime() / 1000);
}
