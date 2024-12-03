import { HexInput } from "../../types";
import { isHexInput } from "../../utils";
import { Secp256k1Signature } from "./secp256k1";
import { AnySignature } from "./singleKey";

export function toSecp256k1Signature(signature: HexInput | Secp256k1Signature | AnySignature): Secp256k1Signature {
  if (isHexInput(signature)) {
    return new Secp256k1Signature(signature);
  }
  if (AnySignature.isInstance(signature)) {
    if (Secp256k1Signature.isInstance(signature.signature)) {
      return signature.signature;
    }
    throw new Error("AnySignature variant is not Secp256k1");
  }
  return signature;
}
