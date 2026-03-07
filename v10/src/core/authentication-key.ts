import { sha3_256 } from "@noble/hashes/sha3";
import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import type { AccountPublicKey } from "../crypto/public-key.js";
import type { AuthenticationKeyScheme } from "../crypto/types.js";
import { Hex, type HexInput } from "../hex/index.js";
import { AccountAddress } from "./account-address.js";

export class AuthenticationKey extends Serializable {
  static readonly LENGTH: number = 32;

  public readonly data: Hex;

  constructor(args: { data: HexInput }) {
    super();
    const { data } = args;
    const hex = Hex.fromHexInput(data);
    if (hex.toUint8Array().length !== AuthenticationKey.LENGTH) {
      throw new Error(`Authentication Key length should be ${AuthenticationKey.LENGTH}`);
    }
    this.data = hex;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.data.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): AuthenticationKey {
    const bytes = deserializer.deserializeFixedBytes(AuthenticationKey.LENGTH);
    return new AuthenticationKey({ data: bytes });
  }

  toUint8Array(): Uint8Array {
    return this.data.toUint8Array();
  }

  static fromSchemeAndBytes(args: { scheme: AuthenticationKeyScheme; input: HexInput }): AuthenticationKey {
    const { scheme, input } = args;
    const inputBytes = Hex.fromHexInput(input).toUint8Array();
    const hashInput = new Uint8Array([...inputBytes, scheme]);
    const hashDigest = sha3_256.create().update(hashInput).digest();
    return new AuthenticationKey({ data: hashDigest });
  }

  static fromPublicKey(args: { publicKey: AccountPublicKey }): AuthenticationKey {
    const { publicKey } = args;
    return publicKey.authKey() as AuthenticationKey;
  }

  derivedAddress(): AccountAddress {
    return new AccountAddress(this.data.toUint8Array());
  }
}
