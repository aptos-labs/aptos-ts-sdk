import type { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import type { HexInput } from "../hex/index.js";
import { KeylessPublicKey } from "./keyless.js";
import { AccountPublicKey, type PublicKey, type VerifySignatureArgs } from "./public-key.js";

// Forward-declared: AccountAddress lives in core (L2), so we use lazy registration.
// registerAccountAddressForKeyless() is called from core/index.ts during module init.
let _AccountAddress: any;

export function registerAccountAddressForKeyless(accountAddress: any): void {
  _AccountAddress = accountAddress;
}

export class FederatedKeylessPublicKey extends AccountPublicKey {
  /** The address that contains the JWK set to be used for verification. */
  readonly jwkAddress: unknown; // AccountAddress at runtime

  /** The inner public key which contains the standard Keyless public key. */
  readonly keylessPublicKey: KeylessPublicKey;

  constructor(jwkAddress: unknown, keylessPublicKey: KeylessPublicKey) {
    super();
    if (_AccountAddress) {
      this.jwkAddress = _AccountAddress.from(jwkAddress);
    } else {
      this.jwkAddress = jwkAddress;
    }
    this.keylessPublicKey = keylessPublicKey;
  }

  authKey(): unknown {
    // FederatedKeyless keys are wrapped in AnyPublicKey for on-chain use;
    // the auth key is derived via the SingleKey scheme by the caller.
    throw new Error("FederatedKeyless auth keys are derived through AnyPublicKey wrapping");
  }

  verifySignature(_args: VerifySignatureArgs): boolean {
    throw new Error("Use verifySignatureAsync to verify FederatedKeyless signatures");
  }

  serialize(serializer: Serializer): void {
    if (!_AccountAddress) {
      throw new Error("AccountAddress not registered. Import core module first.");
    }
    (this.jwkAddress as any).serialize(serializer);
    this.keylessPublicKey.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): FederatedKeylessPublicKey {
    if (!_AccountAddress) {
      throw new Error("AccountAddress not registered. Import core module first.");
    }
    const jwkAddress = _AccountAddress.deserialize(deserializer);
    const keylessPublicKey = KeylessPublicKey.deserialize(deserializer);
    return new FederatedKeylessPublicKey(jwkAddress, keylessPublicKey);
  }

  static create(args: {
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
    jwkAddress: unknown;
  }): FederatedKeylessPublicKey {
    return new FederatedKeylessPublicKey(args.jwkAddress, KeylessPublicKey.create(args));
  }

  static isInstance(publicKey: PublicKey) {
    return (
      "jwkAddress" in publicKey &&
      "keylessPublicKey" in publicKey &&
      publicKey.keylessPublicKey instanceof KeylessPublicKey
    );
  }
}
