import type { HexInput } from "../hex/index.js";

const HEX_REGEX = /^(?:0x)?[0-9a-fA-F]+$/;
const TEXT_ENCODER = new TextEncoder();

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
    if (message.length >= 2 && message.length % 2 === 0 && HEX_REGEX.test(message)) {
      return message;
    }
    return TEXT_ENCODER.encode(message);
  }
  return message;
};
