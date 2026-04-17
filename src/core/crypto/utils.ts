import { HexInput, SigningScheme } from "../../types/index.js";
import { TEXT_ENCODER } from "../../utils/const.js";
import { Hex } from "../hex.js";
import { Ed25519PublicKey } from "./ed25519.js";
import { FederatedKeylessPublicKey } from "./federatedKeyless.js";
import { KeylessPublicKey } from "./keyless.js";
import { MultiEd25519PublicKey } from "./multiEd25519.js";
import { MultiKey } from "./multiKey.js";
import { AccountPublicKey } from "./publicKey.js";
import { AnyPublicKey } from "./singleKey.js";
import { BaseAccountPublicKey } from "./types.js";

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
  if (publicKey instanceof KeylessPublicKey || publicKey instanceof FederatedKeylessPublicKey) {
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
