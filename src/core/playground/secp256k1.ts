import { secp256k1 } from "@noble/curves/secp256k1";
import { sha3_256 } from "@noble/hashes/sha3";
import { Deserializer, Serializer } from "../../bcs";
import { HexInput } from "../../types";
import { Hex } from "../hex";
import type { PrivateKey, PublicKey, Serializable } from "./interfaces";

export class Secp256k1Signature implements Serializable {
  public readonly data: Hex;

  constructor(data: HexInput) {
    this.data = Hex.fromHexInput(data);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.data.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Secp256k1Signature {
    const bytes = deserializer.deserializeBytes();
    return new Secp256k1Signature(bytes);
  }
}

export class Secp256k1PublicKey implements PublicKey<Secp256k1Signature> {
  public readonly key: Hex;

  constructor(key: HexInput) {
    this.key = Hex.fromHexInput(key);
  }

  verifySignature(message: HexInput, signature: Secp256k1Signature): boolean {
    const msgHex = Hex.fromHexInput(message).toUint8Array();
    const sha3Message = sha3_256(msgHex);
    const rawSignature = signature.data.toUint8Array();
    return secp256k1.verify(rawSignature, sha3Message, this.key.toUint8Array());
  }

  serialize(serializer: Serializer) {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Secp256k1PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256k1PublicKey(bytes);
  }
}

export class Secp256k1PrivateKey implements PrivateKey<Secp256k1Signature, Secp256k1PublicKey> {
  private readonly key: Hex;

  constructor(key: HexInput) {
    this.key = Hex.fromHexInput(key);
  }

  sign(message: HexInput) {
    const messageBytes = Hex.fromHexInput(message).toUint8Array();
    const messageHashBytes = sha3_256(messageBytes);
    const signature = secp256k1.sign(messageHashBytes, this.key.toUint8Array());
    return new Secp256k1Signature(signature.toCompactRawBytes());
  }

  publicKey(): Secp256k1PublicKey {
    const bytes = secp256k1.getPublicKey(this.key.toUint8Array(), false);
    return new Secp256k1PublicKey(bytes);
  }

  static generate(): Secp256k1PrivateKey {
    const hexInput = secp256k1.utils.randomPrivateKey();
    return new Secp256k1PrivateKey(hexInput);
  }
}
