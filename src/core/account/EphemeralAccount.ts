// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from "@noble/hashes/utils";


import { Ed25519PrivateKey, EphemeralPublicKey, EphemeralSignature, PrivateKey} from "../crypto";
import { Hex } from "../hex";
import { bytesToBigIntLE, padAndPackBytesWithLen, poseidonHash } from "../crypto/poseidon";
import { GenerateAccount, HexInput, SigningSchemeInput } from "../../types";

export class EphemeralAccount {
  readonly blinder: Uint8Array;

  readonly expiryTimestamp: bigint;

  readonly nonce: string;

  readonly privateKey: PrivateKey;

  readonly publicKey: EphemeralPublicKey;

  constructor(args: { privateKey: PrivateKey; expiryTimestamp?: bigint; blinder?: HexInput }) {
    const { privateKey, expiryTimestamp, blinder } = args;
    this.privateKey = privateKey;
    this.publicKey = new EphemeralPublicKey(privateKey.publicKey());
    const currentDate = new Date();
    const currentTimeInSeconds = Math.floor(currentDate.getTime() / 1000) + 10000;
    this.expiryTimestamp = expiryTimestamp || BigInt(currentTimeInSeconds);
    this.blinder = blinder !== undefined ? Hex.fromHexInput(blinder).toUint8Array() : generateBlinder();
    this.nonce = this.generateNonce();
  }

  static generate(args?: GenerateAccount): EphemeralAccount {
    let privateKey: PrivateKey;

    switch (args?.scheme) {
      case SigningSchemeInput.Ed25519:
      default:
        privateKey = Ed25519PrivateKey.generate();
    }

    const expiryTimestamp = BigInt(123); // TODO

    return new EphemeralAccount({ privateKey, expiryTimestamp });
  }

  generateNonce(): string {
    const fields = padAndPackBytesWithLen(this.publicKey.bcsToBytes(), 93);
    fields.push(BigInt(this.expiryTimestamp))
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
