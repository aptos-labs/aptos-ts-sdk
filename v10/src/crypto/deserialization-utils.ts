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
