import { Deserializer } from "../../bcs";
import { AnyPublicKeyVariant, HexInput, SigningScheme } from "../../types";
import { Hex } from "../hex";
import { Ed25519PublicKey } from "./ed25519";
import { FederatedKeylessPublicKey } from "./federatedKeyless";
import { KeylessPublicKey } from "./keyless";
import { MultiEd25519PublicKey } from "./multiEd25519";
import { MultiKey } from "./multiKey";
import { AccountPublicKey, PublicKey } from "./publicKey";
import { Secp256k1PublicKey } from "./secp256k1";
import { Secp256r1PublicKey } from "./secp256r1";
import { AnyPublicKey } from "./singleKey";
import { BaseAccountPublicKey } from "./types";

/**
 * Helper function to convert a message to sign or to verify to a valid message input
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
      return new TextEncoder().encode(message);
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
  if (publicKey instanceof KeylessPublicKey || publicKey instanceof FederatedKeylessPublicKey) {
    return new AnyPublicKey(publicKey);
  }
  throw new Error(`Unknown account public key: ${publicKey}`);
};

export const accountPublicKeyToSigningScheme = (publicKey: AccountPublicKey): SigningScheme => {
  const baseAccountPublicKey = accountPublicKeyToBaseAccountPublicKey(publicKey);
  if (baseAccountPublicKey instanceof Ed25519PublicKey) {
    return SigningScheme.Ed25519;
  } else if (baseAccountPublicKey instanceof AnyPublicKey) {
    return SigningScheme.SingleKey;
  } else if (baseAccountPublicKey instanceof MultiEd25519PublicKey) {
    return SigningScheme.MultiEd25519;
  } else if (baseAccountPublicKey instanceof MultiKey) {
    return SigningScheme.MultiKey;
  }
  throw new Error(`Unknown signing scheme: ${baseAccountPublicKey}`);
};

/**
 * Deserializes an AnyPublicKey from the provided deserializer.
 * This function reconstructs the AnyPublicKey object from its serialized data,
 * enabling further processing or validation.
 *
 * @param deserializer - The deserializer instance used to read the serialized data.
 * @group Implementation
 * @category Serialization
 */

export function deserializeAnyPublicKey(deserializer: Deserializer): AnyPublicKey {
  const variantIndex = deserializer.deserializeUleb128AsU32();
  let publicKey: PublicKey;
  switch (variantIndex) {
    case AnyPublicKeyVariant.Ed25519:
      publicKey = Ed25519PublicKey.deserialize(deserializer);
      break;
    case AnyPublicKeyVariant.Secp256k1:
      publicKey = Secp256k1PublicKey.deserialize(deserializer);
      break;
    case AnyPublicKeyVariant.Secp256r1:
      publicKey = Secp256r1PublicKey.deserialize(deserializer);
      break;
    case AnyPublicKeyVariant.Keyless:
      publicKey = KeylessPublicKey.deserialize(deserializer);
      break;
    case AnyPublicKeyVariant.FederatedKeyless:
      publicKey = FederatedKeylessPublicKey.deserialize(deserializer);
      break;
    default:
      throw new Error(`Unknown variant index for AnyPublicKey: ${variantIndex}`);
  }
  return new AnyPublicKey(publicKey);
}