import { Serializable } from "../bcs/serializer.js";
import { Hex } from "../hex/index.js";

export abstract class Signature extends Serializable {
  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  toString(): string {
    const bytes = this.toUint8Array();
    return Hex.fromHexInput(bytes).toString();
  }
}
