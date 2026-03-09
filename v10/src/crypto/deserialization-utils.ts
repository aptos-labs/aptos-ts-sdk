import { Deserializer } from "../bcs/deserializer.js";
import type { HexInput } from "../hex/index.js";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519.js";
import { FederatedKeylessPublicKey } from "./federated-keyless.js";
import { KeylessPublicKey, KeylessSignature } from "./keyless.js";
import { MultiEd25519PublicKey, MultiEd25519Signature } from "./multi-ed25519.js";
import { MultiKey, MultiKeySignature } from "./multi-key.js";
import type { PublicKey } from "./public-key.js";
import { Secp256k1PublicKey, Secp256k1Signature } from "./secp256k1.js";
import type { Signature } from "./signature.js";
import { AnyPublicKey, AnySignature } from "./single-key.js";

const MULTIPLE_DESERIALIZATIONS_ERROR_MSG = "Multiple possible deserializations found";
const MAX_ERROR_INPUT_LENGTH = 128;
function truncateForError(input: HexInput): string {
  const str = typeof input === "string" ? input : `Uint8Array(${input.length})`;
  return str.length > MAX_ERROR_INPUT_LENGTH ? `${str.slice(0, MAX_ERROR_INPUT_LENGTH)}...` : str;
}

/**
 * Attempts to deserialise a `PublicKey` from hex-encoded BCS bytes by trying
 * each known public-key type in order.
 *
 * The function succeeds if exactly one type deserialises the bytes without
 * error and consumes all input.  If no type matches, or if more than one type
 * matches, an error is thrown.
 *
 * Supported types (tried in order):
 * `Ed25519PublicKey`, `AnyPublicKey`, `MultiEd25519PublicKey`, `MultiKey`,
 * `KeylessPublicKey`, `FederatedKeylessPublicKey`, `Secp256k1PublicKey`.
 *
 * @param publicKey - The BCS-encoded public key as a hex string or `Uint8Array`.
 * @returns The deserialised {@link PublicKey}.
 * @throws If the bytes match no known public-key type.
 * @throws If the bytes match more than one public-key type (ambiguous).
 *
 * @example
 * ```ts
 * const key = deserializePublicKey("0x...");
 * ```
 */
export function deserializePublicKey(publicKey: HexInput): PublicKey {
  const publicKeyTypes = [
    Ed25519PublicKey,
    AnyPublicKey,
    MultiEd25519PublicKey,
    MultiKey,
    KeylessPublicKey,
    FederatedKeylessPublicKey,
    Secp256k1PublicKey,
  ];

  let result: PublicKey | undefined;
  for (const KeyType of publicKeyTypes) {
    try {
      const deserializer = Deserializer.fromHex(publicKey);
      const key = KeyType.deserialize(deserializer);
      deserializer.assertFinished();
      if (result) {
        throw new Error(`${MULTIPLE_DESERIALIZATIONS_ERROR_MSG}: ${truncateForError(publicKey)}`);
      }
      result = key;
    } catch (error) {
      if (error instanceof Error && error.message.includes(MULTIPLE_DESERIALIZATIONS_ERROR_MSG)) {
        throw error;
      }
    }
  }

  if (!result) {
    throw new Error(`Failed to deserialize public key: ${truncateForError(publicKey)}`);
  }

  return result;
}

/**
 * Attempts to deserialise a `Signature` from hex-encoded BCS bytes by trying
 * each known signature type in order.
 *
 * The function succeeds if exactly one type deserialises the bytes without
 * error and consumes all input.  If no type matches, or if more than one type
 * matches, an error is thrown.
 *
 * Supported types (tried in order):
 * `Ed25519Signature`, `AnySignature`, `MultiEd25519Signature`,
 * `MultiKeySignature`, `KeylessSignature`, `Secp256k1Signature`.
 *
 * @param signature - The BCS-encoded signature as a hex string or `Uint8Array`.
 * @returns The deserialised {@link Signature}.
 * @throws If the bytes match no known signature type.
 * @throws If the bytes match more than one signature type (ambiguous).
 *
 * @example
 * ```ts
 * const sig = deserializeSignature("0x...");
 * ```
 */
export function deserializeSignature(signature: HexInput): Signature {
  const signatureTypes = [
    Ed25519Signature,
    AnySignature,
    MultiEd25519Signature,
    MultiKeySignature,
    KeylessSignature,
    Secp256k1Signature,
  ];

  let result: Signature | undefined;
  for (const SignatureType of signatureTypes) {
    try {
      const deserializer = Deserializer.fromHex(signature);
      const sig = SignatureType.deserialize(deserializer);
      deserializer.assertFinished();
      if (result) {
        throw new Error(`${MULTIPLE_DESERIALIZATIONS_ERROR_MSG}: ${truncateForError(signature)}`);
      }
      result = sig;
    } catch (error) {
      if (error instanceof Error && error.message.includes(MULTIPLE_DESERIALIZATIONS_ERROR_MSG)) {
        throw error;
      }
    }
  }

  if (!result) {
    throw new Error(`Failed to deserialize signature: ${truncateForError(signature)}`);
  }

  return result;
}
