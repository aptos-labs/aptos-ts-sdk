// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha512 } from "@noble/hashes/sha512";
import { bytesToNumberLE, concatBytes } from "@noble/curves/abstract/utils";
import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";
import { HexInput } from "../../../types";
import { ed25519modN } from "../utils";

/*
 * Transform public keys to Uint8Array
 */
export function publicKeyToU8(pk: TwistedEd25519PublicKey | HexInput): Uint8Array {
  const publicKey = ArrayBuffer.isView(pk) || typeof pk === "string" ? new TwistedEd25519PublicKey(pk) : pk;
  return publicKey.toUint8Array();
}

/*
 * Transform private keys to TwistedEd25519PrivateKey
 */
export function toTwistedEd25519PrivateKey(pk: TwistedEd25519PrivateKey | HexInput): TwistedEd25519PrivateKey {
  return ArrayBuffer.isView(pk) || typeof pk === "string" ? new TwistedEd25519PrivateKey(pk) : pk;
}

export function toTwistedEd25519PublicKey(pk: TwistedEd25519PublicKey | HexInput): TwistedEd25519PublicKey {
  return ArrayBuffer.isView(pk) || typeof pk === "string" ? new TwistedEd25519PublicKey(pk) : pk;
}

/*
 * Generate Fiat-Shamir challenge
 */
export function genFiatShamirChallenge(...arrays: Uint8Array[]): bigint {
  const hash = sha512(concatBytes(...arrays));
  return ed25519modN(bytesToNumberLE(hash));
}
