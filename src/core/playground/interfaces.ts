import type { Serializer } from "../../bcs";
import type { HexInput } from "../../types";
import type { AccountAuthenticator } from "./accountAuthenticator";

export interface Serializable {
  serialize(serializer: Serializer): void;
}

export interface PublicKey<TSignature> extends Serializable {
  verifySignature(message: HexInput, signature: TSignature): boolean;
}

export interface PrivateKey<TSignature, TPublicKey extends PublicKey<TSignature>> {
  sign(message: HexInput): TSignature;

  publicKey(): TPublicKey;
}

export interface BaseSigner<TAccountAuthenticator extends AccountAuthenticator = AccountAuthenticator> {
  sign(message: HexInput): TAccountAuthenticator;
}
