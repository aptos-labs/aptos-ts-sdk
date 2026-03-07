// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from "@noble/hashes/utils";
import { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { Ed25519PrivateKey } from "../crypto/ed25519.js";
import { EphemeralPublicKey, EphemeralSignature } from "../crypto/ephemeral.js";
import { bytesToBigIntLE, padAndPackBytesWithLen, poseidonHash } from "../crypto/poseidon.js";
import type { PrivateKey } from "../crypto/private-key.js";
import { EphemeralPublicKeyVariant } from "../crypto/types.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";

const TWO_WEEKS_IN_SECONDS = 1_209_600;

function floorToWholeHour(timestampInSeconds: number): number {
  return Math.floor(timestampInSeconds / 3600) * 3600;
}

function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export class EphemeralKeyPair extends Serializable {
  static readonly BLINDER_LENGTH: number = 31;

  readonly blinder: Uint8Array;
  readonly expiryDateSecs: number;
  readonly nonce: string;

  private privateKey: PrivateKey;
  private publicKey: EphemeralPublicKey;
  private cleared: boolean = false;

  constructor(args: { privateKey: PrivateKey; expiryDateSecs?: number; blinder?: HexInput }) {
    super();
    const { privateKey, expiryDateSecs, blinder } = args;
    this.privateKey = privateKey;
    this.publicKey = new EphemeralPublicKey(privateKey.publicKey());
    this.expiryDateSecs = expiryDateSecs || floorToWholeHour(nowInSeconds() + TWO_WEEKS_IN_SECONDS);
    this.blinder =
      blinder !== undefined ? Hex.fromHexInput(blinder).toUint8Array() : randomBytes(EphemeralKeyPair.BLINDER_LENGTH);

    // Calculate the nonce
    const fields = padAndPackBytesWithLen(this.publicKey.bcsToBytes(), 93);
    fields.push(BigInt(this.expiryDateSecs));
    fields.push(bytesToBigIntLE(this.blinder));
    this.nonce = poseidonHash(fields).toString();
  }

  getPublicKey(): EphemeralPublicKey {
    return this.publicKey;
  }

  isExpired(): boolean {
    return Math.floor(Date.now() / 1000) > this.expiryDateSecs;
  }

  clear(): void {
    if (!this.cleared) {
      if ("clear" in this.privateKey && typeof this.privateKey.clear === "function") {
        this.privateKey.clear();
      } else {
        const keyBytes = this.privateKey.toUint8Array();
        crypto.getRandomValues(keyBytes);
        keyBytes.fill(0xff);
        crypto.getRandomValues(keyBytes);
        keyBytes.fill(0);
      }
      crypto.getRandomValues(this.blinder);
      this.blinder.fill(0xff);
      crypto.getRandomValues(this.blinder);
      this.blinder.fill(0);
      this.cleared = true;
    }
  }

  isCleared(): boolean {
    return this.cleared;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(this.publicKey.variant);
    serializer.serializeBytes(this.privateKey.toUint8Array());
    serializer.serializeU64(this.expiryDateSecs);
    serializer.serializeFixedBytes(this.blinder);
  }

  static deserialize(deserializer: Deserializer): EphemeralKeyPair {
    const variantIndex = deserializer.deserializeUleb128AsU32();
    let privateKey: PrivateKey;
    switch (variantIndex) {
      case EphemeralPublicKeyVariant.Ed25519:
        privateKey = Ed25519PrivateKey.deserialize(deserializer);
        break;
      default:
        throw new Error(`Unknown variant index for EphemeralPublicKey: ${variantIndex}`);
    }
    const expiryDateSecs = deserializer.deserializeU64();
    const blinder = deserializer.deserializeFixedBytes(31);
    return new EphemeralKeyPair({ privateKey, expiryDateSecs: Number(expiryDateSecs), blinder });
  }

  static fromBytes(bytes: Uint8Array): EphemeralKeyPair {
    return EphemeralKeyPair.deserialize(new Deserializer(bytes));
  }

  static generate(args?: { scheme?: EphemeralPublicKeyVariant; expiryDateSecs?: number }): EphemeralKeyPair {
    // Only Ed25519 is supported for now
    return new EphemeralKeyPair({ privateKey: Ed25519PrivateKey.generate(), expiryDateSecs: args?.expiryDateSecs });
  }

  sign(data: HexInput): EphemeralSignature {
    if (this.cleared) {
      throw new Error("EphemeralKeyPair has been cleared from memory and can no longer be used");
    }
    if (this.isExpired()) {
      throw new Error("EphemeralKeyPair has expired");
    }
    return new EphemeralSignature(this.privateKey.sign(data));
  }
}
