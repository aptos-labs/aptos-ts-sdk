import { Serializable } from "../../bcs";
import { Hex } from "../hex";

/**
 * An abstract representation of a cryptographic proof associated with specific
 * zero-knowledge proof schemes, such as Groth16 and PLONK.
 * @group Implementation
 * @category Serialization
 */
export abstract class Proof extends Serializable {
  /**
   * Get the proof as a hex string with a 0x prefix.
   *
   * @returns The proof represented as a hex string.
   * @group Implementation
   * @category Serialization
   */
  toString(): string {
    const bytes = this.bcsToBytes();
    return Hex.fromHexInput(bytes).toString();
  }
}
