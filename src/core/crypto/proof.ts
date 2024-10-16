import { Serializable } from "../../bcs";
import { Hex } from "../hex";

/**
 * An abstract representation of a cryptographic proof associated with specific
 * zero-knowledge proof schemes, such as Groth16 and PLONK.
 */
export abstract class Proof extends Serializable {
  /**
   * Get the proof as a hex string with a 0x prefix.
   *
   * @returns The proof represented as a hex string.
   */
  toString(): string {
    const bytes = this.bcsToBytes();
    return Hex.fromHexInput(bytes).toString();
  }
}
