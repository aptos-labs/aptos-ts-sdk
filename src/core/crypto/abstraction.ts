import { Deserializer, Serializer } from "../../bcs/index.js";
import { HexInput } from "../../types/index.js";
import { AccountAddress } from "../accountAddress.js";
import { AuthenticationKey } from "../authenticationKey.js";
import { Hex } from "../hex.js";
import { AccountPublicKey, VerifySignatureArgs, VerifySignatureAsyncArgs } from "./publicKey.js";
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
  readonly accountAddress: AccountAddress;

  constructor(accountAddress: AccountAddress) {
    super();
    this.accountAddress = accountAddress;
  }

  authKey(): AuthenticationKey {
    return new AuthenticationKey({ data: this.accountAddress.toUint8Array() });
  }

  verifySignature(args: VerifySignatureArgs): boolean {
    throw new Error("This function is not implemented for AbstractPublicKey.");
  }

  async verifySignatureAsync(args: VerifySignatureAsyncArgs): Promise<boolean> {
    throw new Error("This function is not implemented for AbstractPublicKey.");
  }

  serialize(serializer: Serializer): void {
    throw new Error("This function is not implemented for AbstractPublicKey.");
  }
}
