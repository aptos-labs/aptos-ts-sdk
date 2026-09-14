import { HexInput, SigningScheme } from "../../types/index.js";
import { TEXT_ENCODER } from "../../utils/const.js";
import { Hex } from "../hex.js";
import { Ed25519PublicKey } from "./ed25519.js";
import { MultiEd25519PublicKey } from "./multiEd25519.js";
import { MultiKey } from "./multiKey.js";
import { AccountPublicKey } from "./publicKey.js";
import { AnyPublicKey } from "./singleKey.js";
import { BaseAccountPublicKey } from "./types.js";
import { detectPublicKeyVariant } from "./anyKeyRegistry.js";

/**
 * Normalizes a sign/verify message into a {@link HexInput} that downstream
 * callers can pass to `Hex.fromHexInput()`.
 *
 * Behavior — be aware before passing a string:
 * - `Uint8Array` → returned as-is (used as raw bytes).
 * - String that parses as hex via `Hex.isValid()` (with or without a `0x`
 *   prefix) → returned as the original hex string, which downstream
 *   `Hex.fromHexInput()` decodes to its byte form.
 * - Any other string → returned as the UTF-8 byte encoding of the string.
 *
 * **AMBIGUITY**: a bare even-length string of hex characters is *always*
 * interpreted as hex, even when the caller intended it as text. For example:
 *
 * ```ts
 * sign("cafe")       // signs 2 bytes: [0xCA, 0xFE]
 * sign("decade")     // signs 3 bytes: [0xDE, 0xCA, 0xDE]
 * sign("0xcafe")     // signs 2 bytes: [0xCA, 0xFE]   (explicit hex)
 * sign("hello")      // signs 5 bytes: UTF-8 "hello"  (not valid hex)
 * sign(new TextEncoder().encode("cafe"))  // signs 4 bytes: UTF-8 "cafe"
 * ```
 *
 * If you mean *text*, pass `TextEncoder.encode(text)` or any `Uint8Array`.
 * If you mean *hex bytes*, the most explicit form is also a `Uint8Array`
 * (`Hex.fromHexInput("0x...").toUint8Array()`), or a string prefixed with
 * `0x` for clarity. The heuristic is preserved as-is for backwards
 * compatibility — changing it would silently re-interpret bytes signed by
 * existing dApps and wallets — but new code should treat string inputs to
 * `sign()` / `verifySignature()` as untyped and prefer `Uint8Array`.
 *
 * @param message a message as a string or Uint8Array
 *
 * @returns a valid HexInput - string or Uint8Array
 * @group Implementation
 * @category Serialization
 */
export const convertSigningMessage = (message: HexInput): HexInput => {
  // if message is of type string, verify it is a valid Hex string
  if (typeof message === "string") {
    const isValid = Hex.isValid(message);
    // If message is not a valid Hex string, convert it
    if (!isValid.valid) {
      return TEXT_ENCODER.encode(message);
    }
    // If message is a valid Hex string, return it
    return message;
  }
  // message is a Uint8Array
  return message;
};

export const accountPublicKeyToBaseAccountPublicKey = (publicKey: AccountPublicKey): BaseAccountPublicKey => {
  if (
    publicKey instanceof Ed25519PublicKey ||
    publicKey instanceof AnyPublicKey ||
    publicKey instanceof MultiEd25519PublicKey ||
    publicKey instanceof MultiKey
  ) {
    return publicKey;
  }
  // Keyless / FederatedKeyless public keys register themselves in the variant
  // registry when imported. Using the registry lets us wrap them in
  // `AnyPublicKey` here without a compile-time dependency on the keyless
  // module (which would pull poseidon-lite into the `/account` sub-path).
  if (detectPublicKeyVariant(publicKey) !== undefined) {
    return new AnyPublicKey(publicKey);
  }
  throw new Error(`Unknown account public key: ${publicKey}`);
};

export const accountPublicKeyToSigningScheme = (publicKey: AccountPublicKey): SigningScheme => {
  const baseAccountPublicKey = accountPublicKeyToBaseAccountPublicKey(publicKey);
  if (baseAccountPublicKey instanceof Ed25519PublicKey) {
    return SigningScheme.Ed25519;
  }
  if (baseAccountPublicKey instanceof AnyPublicKey) {
    return SigningScheme.SingleKey;
  }
  if (baseAccountPublicKey instanceof MultiEd25519PublicKey) {
    return SigningScheme.MultiEd25519;
  }
  if (baseAccountPublicKey instanceof MultiKey) {
    return SigningScheme.MultiKey;
  }
  throw new Error(`Unknown signing scheme: ${baseAccountPublicKey}`);
};
