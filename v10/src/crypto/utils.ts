import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";

/**
 * Normalises a signing message so that it is always in a form that can be
 * converted to bytes for cryptographic operations.
 *
 * If `message` is a plain string that is **not** valid hex it is encoded as
 * UTF-8 bytes.  If it is a valid hex string or already a `Uint8Array` /
 * `ArrayBuffer` it is returned unchanged.
 *
 * @param message - The message to normalise, either as raw bytes or a string.
 * @returns The message in a form accepted by `Hex.fromHexInput`.
 *
 * @example
 * ```ts
 * // Plain text → UTF-8 bytes
 * convertSigningMessage("hello"); // Uint8Array([104, 101, 108, 108, 111])
 *
 * // Valid hex string → returned as-is
 * convertSigningMessage("0xdeadbeef"); // "0xdeadbeef"
 * ```
 */
export const convertSigningMessage = (message: HexInput): HexInput => {
  if (typeof message === "string") {
    const isValid = Hex.isValid(message);
    if (!isValid.valid) {
      return new TextEncoder().encode(message);
    }
    return message;
  }
  return message;
};
