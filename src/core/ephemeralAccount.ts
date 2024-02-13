// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { base64url } from "jose";
import { randomBytes } from "@noble/hashes/utils";
import { PrivateKey } from "./crypto/asymmetricCrypto";
import { Ed25519PrivateKey } from "./crypto/ed25519";


import { Hex } from "./hex";
import { GenerateAccount, HexInput, SigningSchemeInput } from "../types";
import { EphemeralPublicKey } from "./crypto/ephermeralPublicKey";
import { bigIntToBytesLE, bytesToBigIntLE, padAndPackBytesWithLen, poseidonHash } from "./crypto/poseidon";
import { EphemeralSignature } from "./crypto/ephemeralSignature";

export class EphemeralAccount {
  readonly blinder: Uint8Array;

  readonly expiryTimestamp: bigint;

  readonly nonce: string;

  readonly privateKey: PrivateKey;

  readonly publicKey: EphemeralPublicKey;

  constructor(args: { privateKey: PrivateKey; expiryTimestamp: bigint; blinder?: HexInput }) {
    const { privateKey, expiryTimestamp, blinder } = args;
    this.privateKey = privateKey;
    this.publicKey = new EphemeralPublicKey(privateKey.publicKey());
    this.expiryTimestamp = expiryTimestamp;
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
