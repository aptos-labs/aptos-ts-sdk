import { invert, mod } from "@noble/curves/abstract/modular";
import { bytesToNumberBE } from "@noble/curves/abstract/utils";
import { ed25519 } from "@noble/curves/ed25519";
import { randomBytes } from "@noble/hashes/utils";
import { Hex } from "../hex";
import { HexInput } from "../../types";

/**
 * Helper function to convert a message to sign or to verify to a valid message input
 *
 * @param message a message as a string or Uint8Array
 *
 * @returns a valid HexInput - string or Uint8Array
 */
export const convertSigningMessage = (message: HexInput): HexInput => {
  // if message is of type string, verify it is a valid Hex string
  if (typeof message === "string") {
    const isValid = Hex.isValid(message);
    // If message is not a valid Hex string, convert it into a Buffer
    if (!isValid.valid) {
      return Buffer.from(message, "utf8");
    }
    // If message is a valid Hex string, return it
    return message;
  }
  // message is a Uint8Array
  return message;
};

/*
 * Number modulo order of curve ed25519
 */
export function ed25519modN(a: bigint): bigint {
  return mod(a, ed25519.CURVE.n);
}

/*
 * Inverses number over modulo of curve ed25519
 */
export function ed25519InvertN(a: bigint): bigint {
  return invert(a, ed25519.CURVE.n);
}

/*
 * Generate random number less then order of curve ed25519
 */
export function ed25519GenRandom(): bigint {
  let rand: bigint;
  do {
    rand = bytesToNumberBE(randomBytes(32))
  } while (rand >= ed25519.CURVE.n)

  return rand;
}
