import { AnyPublicKey, AnySignature } from "./singleKey";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519";
import { MultiKey, MultiKeySignature } from "./multiKey";
import { KeylessPublicKey, KeylessSignature } from "./keyless";
import { MultiEd25519PublicKey, MultiEd25519Signature } from "./multiEd25519";
import { FederatedKeylessPublicKey } from "./federatedKeyless";
import { Secp256k1PublicKey, Secp256k1Signature } from "./secp256k1";
import { PublicKey } from "./publicKey";
import { Signature } from "./signature";
import { Deserializer } from "../../bcs/deserializer";
import { HexInput } from "../../types";

const MULTIPLE_DESERIALIZATIONS_ERROR_MSG = "Multiple possible deserializations found";

/**
 * Deserializes a public key from a hex string.
 * Attempts to deserialize using various public key types in sequence until one succeeds.
 *
 * @param publicKey - The hex string representation of the public key to deserialize
 * @returns The deserialized public key
 * @throws Error if deserialization fails for all supported key types or if multiple deserializations are found
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
        throw new Error(`${MULTIPLE_DESERIALIZATIONS_ERROR_MSG}: ${publicKey}`);
      }
      result = key;
    } catch (error) {
      if (error instanceof Error && error.message.includes(MULTIPLE_DESERIALIZATIONS_ERROR_MSG)) {
        throw error;
      }
    }
  }

  if (!result) {
    throw new Error(`Failed to deserialize public key: ${publicKey}`);
  }

  return result;
}

/**
 * Deserializes a signature from a hex string.
 * Attempts to deserialize using various signature types in sequence until one succeeds.
 *
 * @param signature - The hex string representation of the signature to deserialize
 * @returns The deserialized signature
 * @throws Error if deserialization fails for all supported signature types or if multiple deserializations are found
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
        throw new Error(`${MULTIPLE_DESERIALIZATIONS_ERROR_MSG}: ${signature}`);
      }
      result = sig;
    } catch (error) {
      if (error instanceof Error && error.message.includes(MULTIPLE_DESERIALIZATIONS_ERROR_MSG)) {
        throw error;
      }
    }
  }

  if (!result) {
    throw new Error(`Failed to deserialize signature: ${signature}`);
  }

  return result;
}
