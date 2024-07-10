import { Serializer } from "../../bcs";
import { AnyPublicKeyVariant, SigningScheme as AuthenticationKeyScheme, HexInput } from "../../types";
import { AuthenticationKey } from "../authenticationKey";
import { AccountPublicKey, VerifySignatureArgs } from "./publicKey";
import { Secp256k1PublicKey } from "./secp256k1";

/**
 * Represents the Passkey public key
 *
 * Passkey public keys are Secp256r1 ecdsa public keys.
 */
export class PasskeyPublicKey extends AccountPublicKey {
  // Passkey ecdsa public keys are 65 bytes long.
  private readonly key: Secp256k1PublicKey;

  /**
   * Create a new PublicKey instance from a Uint8Array or String.
   *
   * @param hexInput A HexInput (string or Uint8Array)
   */
  constructor(hexInput: HexInput) {
    super();

    const key = new Secp256k1PublicKey(hexInput);
    this.key = key;
  }

  /**
   * Get the public key in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the public key
   */
  toUint8Array(): Uint8Array {
    return this.key.toUint8Array();
  }

  /**
   * Get the public key as a hex string with the 0x prefix.
   *
   * @returns string representation of the public key
   */
  toString(): string {
    return this.key.toString();
  }

  /**
   * Verifies a signed data with a public key
   *
   * @param args.message message
   * @param args.signature The signature
   * @returns true if the signature is valid
   */
  verifySignature(args: VerifySignatureArgs): boolean {
    return this.key.verifySignature(args);
  }

  /**
   * Get the authentication key associated with this public key
   */
  authKey(): AuthenticationKey {
    const serializer = new Serializer();
    serializer.serializeU32AsUleb128(AnyPublicKeyVariant.Secp256r1);
    serializer.serializeFixedBytes(this.bcsToBytes());
    return AuthenticationKey.fromSchemeAndBytes({
      scheme: AuthenticationKeyScheme.SingleKey,
      input: serializer.toUint8Array(),
    });
  }

  serialize(serializer: Serializer): void {
    return this.key.serialize(serializer);
  }
}
