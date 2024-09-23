import { invert, mod } from "@noble/curves/abstract/modular";
import { bytesToNumberLE } from "@noble/curves/abstract/utils";
import { ed25519 } from "@noble/curves/ed25519";
import { randomBytes } from "@noble/hashes/utils";
import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";
import { HexInput } from "../../../types";

/*
 * Number modulo order of curve
 */
export function modN(a: bigint): bigint {
  return mod(a, ed25519.CURVE.n);
}

/*
 * Inverses number over modulo of curve
 */
export function invertN(a: bigint): bigint {
  return invert(a, ed25519.CURVE.n);
}

/*
 * Little-endian random bytes modulo order of curve
 */
export function genModRandom(): bigint {
  return modN(bytesToNumberLE(randomBytes(32)));
}

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
