import { Serializable } from "../../bcs";
import { Hex } from "../hex";

/**
 * An abstract representation of a crypto proof.
 * associated to a specific zero knowledge proof schemes e.g. Groth16, PLONK
 */
export abstract class Proof extends Serializable {
  /**
   * Get the proof as a hex string with a 0x prefix e.g. 0x123456...
   */
  toString(): string {
    const bytes = this.bcsToBytes();
    return Hex.fromHexInput(bytes).toString();
  }
}
