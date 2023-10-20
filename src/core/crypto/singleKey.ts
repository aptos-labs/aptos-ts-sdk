import nacl from "tweetnacl";
import { Serializer, Deserializer } from "../../bcs";
import { HexInput } from "../../types";
import { Hex } from "../hex";
import { PublicKey } from "./asymmetricCrypto";
import { Ed25519Signature, Ed25519PublicKey } from "./ed25519";

export class SingleKey extends PublicKey {
  /**
   * Length of an Ed25519 public key
   */
  static readonly LENGTH: number = 65;

  /**
   * Bytes of the public key
   * @private
   */
  private readonly key: Hex;

  /**
   * Create a new PublicKey instance from a Uint8Array or String.
   *
   * @param hexInput A HexInput (string or Uint8Array)
   */
  constructor(hexInput: HexInput) {
    super();

    const hex = Hex.fromHexInput(hexInput);
    if (hex.toUint8Array().length !== SingleKey.LENGTH) {
      throw new Error(`PublicKey length should be ${SingleKey.LENGTH}`);
    }
    this.key = hex;
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
   * @param args.message a signed message
   * @param args.signature the signature of the message
   */
  verifySignature(args: { message: HexInput; signature: Ed25519Signature }): boolean {
    const { message, signature } = args;
    const rawMessage = Hex.fromHexInput(message).toUint8Array();
    const rawSignature = Hex.fromHexInput(signature.toUint8Array()).toUint8Array();
    return nacl.sign.detached.verify(rawMessage, rawSignature, this.key.toUint8Array());
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Ed25519PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519PublicKey(bytes);
  }

  static load(deserializer: Deserializer): Ed25519PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519PublicKey(bytes);
  }
}
