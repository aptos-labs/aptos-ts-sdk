import { SigningScheme } from "../../types";
import { Ed25519PublicKey } from "./ed25519";
import { FederatedKeylessPublicKey } from "./federatedKeyless";
import { KeylessPublicKey } from "./keyless";
import { MultiEd25519PublicKey } from "./multiEd25519";
import { MultiKey } from "./multiKey";
import { AccountPublicKey } from "./publicKey";
import { AnyPublicKey } from "./singleKey";
import { BaseAccountPublicKey } from "./types";

// Re-export for backward compatibility
export { convertSigningMessage } from "./signingUtils";

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
