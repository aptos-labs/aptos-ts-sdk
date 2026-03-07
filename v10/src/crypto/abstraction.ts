import type { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import { Hex, type HexInput } from "../hex/index.js";
import { AccountPublicKey, type VerifySignatureArgs } from "./public-key.js";
import { Signature } from "./signature.js";

export class AbstractSignature extends Signature {
  readonly value: Uint8Array;

  constructor(value: HexInput) {
    super();
    this.value = Hex.fromHexInput(value).toUint8Array();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.value);
  }

  static deserialize(deserializer: Deserializer): AbstractSignature {
    return new AbstractSignature(deserializer.deserializeBytes());
  }
}

export class AbstractPublicKey extends AccountPublicKey {
  /** The account address — typed as `unknown` because AccountAddress is in core (L2). */
  readonly accountAddress: unknown;

  constructor(accountAddress: unknown) {
    super();
    this.accountAddress = accountAddress;
  }

  authKey(): unknown {
    throw new Error("authKey() not yet available; port the core module first");
  }

  verifySignature(_args: VerifySignatureArgs): boolean {
    throw new Error("This function is not implemented for AbstractPublicKey.");
  }

  serialize(_serializer: Serializer): void {
    throw new Error("This function is not implemented for AbstractPublicKey.");
  }
}
