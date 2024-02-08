import { Hex } from "../hex";
import { HexInput } from "../../types";
import { Deserializer } from "../../bcs/deserializer";
import { Serializer } from "../../bcs/serializer";
import { AnySignature } from "./anySignature";
import { Signature } from "./asymmetricCrypto";

export class MultiSignature extends Signature {
  public readonly signatures: Array<AnySignature>;

  constructor(signatures: Array<Signature>) {
    super();

    const sigs: AnySignature[] = [];
    signatures.forEach((sig) => {
      if (sig instanceof AnySignature) {
        sigs.push(sig);
      } else {
        // if signature is instance of a legacy account, i.e
        // Legacy Ed25519, convert it into AnySignature
        sigs.push(new AnySignature(sig));
      }
    });

    this.signatures = sigs;
  }

  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  /**
   * Hex string representation the multi key bytes
   *
   * @returns string
   */
  toString(): string {
    return Hex.fromHexInput(this.toUint8Array()).toString();
  }

  // TODO
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  verifySignature(args: { message: HexInput; signature: AnySignature }): boolean {
    throw new Error("not implemented");
  }

  serialize(serializer: Serializer): void {
    serializer.serializeVector<AnySignature>(this.signatures);
  }

  static deserialize(deserializer: Deserializer): MultiSignature {
    const signatures = deserializer.deserializeVector(AnySignature);
    return new MultiSignature(signatures);
  }

  static isMultiSig(signature: Signature): signature is MultiSignature {
    return signature instanceof MultiSignature;
  }

}
