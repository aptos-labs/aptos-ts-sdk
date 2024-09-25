// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";
import { HexInput } from "../../../types";


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
