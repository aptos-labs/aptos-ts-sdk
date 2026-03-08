import { Serializable } from "../bcs/serializer.js";
import { Hex } from "../hex/index.js";

/**
 * Abstract base class for all cryptographic signatures in the SDK.
 *
 * Concrete subclasses (e.g. {@link Ed25519Signature}, {@link Secp256k1Signature})
 * must implement `serialize` from {@link Serializable}.  The base class provides
 * default `toUint8Array` and `toString` implementations that delegate to BCS
 * serialization.
 */
export abstract class Signature extends Serializable {
  /**
   * Returns the raw byte representation of the signature.
   *
   * @returns The signature as a `Uint8Array`.
   */
  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  /**
   * Returns a hex-encoded string representation of the signature.
   *
   * @returns A `0x`-prefixed hex string of the signature bytes.
   */
  toString(): string {
    const bytes = this.toUint8Array();
    return Hex.fromHexInput(bytes).toString();
  }
}
