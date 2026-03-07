import { Serializable } from "../bcs/serializer.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import type { Signature } from "./signature.js";

export interface VerifySignatureArgs {
  message: HexInput;
  signature: Signature;
}

export abstract class PublicKey extends Serializable {
  abstract verifySignature(args: VerifySignatureArgs): boolean;

  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  toString(): string {
    const bytes = this.toUint8Array();
    return Hex.fromHexInput(bytes).toString();
  }
}

// ── Auth key derivation (registered by core module to break circular dep) ──

type AuthKeyFactory = (scheme: number, publicKeyBytes: Uint8Array) => unknown;
let _authKeyFactory: AuthKeyFactory | null = null;

export function registerAuthKeyFactory(factory: AuthKeyFactory): void {
  _authKeyFactory = factory;
}

export function createAuthKey(scheme: number, publicKeyBytes: Uint8Array): unknown {
  if (!_authKeyFactory) {
    throw new Error("AuthKey factory not registered. Import core module first.");
  }
  return _authKeyFactory(scheme, publicKeyBytes);
}

export abstract class AccountPublicKey extends PublicKey {
  abstract authKey(): unknown;
}
