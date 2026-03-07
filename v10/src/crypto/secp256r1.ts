import { p256 } from "@noble/curves/nist";
import { sha3_256 } from "@noble/hashes/sha3";
import type { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import { type PrivateKey, PrivateKeyUtils } from "./private-key.js";
import { PublicKey, type VerifySignatureArgs } from "./public-key.js";
import { Signature } from "./signature.js";
import { PrivateKeyVariants } from "./types.js";

export class Secp256r1PublicKey extends PublicKey {
  static readonly LENGTH: number = 65;
  static readonly COMPRESSED_LENGTH: number = 33;

  private readonly key: Hex;

  constructor(hexInput: HexInput) {
    super();
    const hex = Hex.fromHexInput(hexInput);
    const keyLength = hex.toUint8Array().length;
    if (keyLength !== Secp256r1PublicKey.LENGTH && keyLength !== Secp256r1PublicKey.COMPRESSED_LENGTH) {
      throw new Error(
        `PublicKey length should be ${Secp256r1PublicKey.LENGTH} or ${Secp256r1PublicKey.COMPRESSED_LENGTH}, received ${keyLength}`,
      );
    }
    if (keyLength === Secp256r1PublicKey.COMPRESSED_LENGTH) {
      const point = p256.ProjectivePoint.fromHex(hex.toUint8Array());
      this.key = Hex.fromHexInput(point.toRawBytes(false));
    } else {
      this.key = hex;
    }
  }

  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    const msgHex = Hex.fromHexInput(message).toUint8Array();
    const sha3Message = sha3_256(msgHex);
    const rawSignature = signature.toUint8Array();
    return p256.verify(rawSignature, sha3Message, this.toUint8Array());
  }

  toUint8Array(): Uint8Array {
    return this.key.toUint8Array();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Secp256r1PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256r1PublicKey(bytes);
  }
}

export class Secp256r1PrivateKey implements PrivateKey {
  static readonly LENGTH: number = 32;

  private readonly key: Hex;

  constructor(hexInput: HexInput, strict?: boolean) {
    const privateKeyHex = PrivateKeyUtils.parseHexInput(hexInput, PrivateKeyVariants.Secp256r1, strict);
    const keyLength = privateKeyHex.toUint8Array().length;
    if (keyLength !== Secp256r1PrivateKey.LENGTH) {
      throw new Error(`PrivateKey length should be ${Secp256r1PrivateKey.LENGTH}, received ${keyLength}`);
    }
    this.key = privateKeyHex;
  }

  static generate(): Secp256r1PrivateKey {
    const hexInput = p256.utils.randomPrivateKey();
    return new Secp256r1PrivateKey(hexInput);
  }

  sign(message: HexInput): Secp256r1Signature {
    const msgHex = Hex.fromHexInput(message);
    const sha3Message = sha3_256(msgHex.toUint8Array());
    const signature = p256.sign(sha3Message, this.key.toUint8Array());
    return new Secp256r1Signature(signature.toCompactRawBytes());
  }

  publicKey(): Secp256r1PublicKey {
    const bytes = p256.getPublicKey(this.key.toUint8Array(), false);
    return new Secp256r1PublicKey(bytes);
  }

  toUint8Array(): Uint8Array {
    return this.key.toUint8Array();
  }

  toString(): string {
    return PrivateKeyUtils.formatPrivateKey(this.key.toString(), PrivateKeyVariants.Secp256r1);
  }

  toHexString(): string {
    return this.key.toString();
  }
}

export class WebAuthnSignature extends Signature {
  signature: Hex;
  authenticatorData: Hex;
  clientDataJSON: Hex;

  constructor(signature: HexInput, authenticatorData: HexInput, clientDataJSON: HexInput) {
    super();
    this.signature = Hex.fromHexInput(signature);
    this.authenticatorData = Hex.fromHexInput(authenticatorData);
    this.clientDataJSON = Hex.fromHexInput(clientDataJSON);
  }

  toUint8Array() {
    return this.signature.toUint8Array();
  }

  serialize(serializer: Serializer) {
    serializer.serializeU32AsUleb128(0);
    serializer.serializeBytes(this.signature.toUint8Array());
    serializer.serializeBytes(this.authenticatorData.toUint8Array());
    serializer.serializeBytes(this.clientDataJSON.toUint8Array());
  }

  static deserialize(deserializer: Deserializer) {
    const id = deserializer.deserializeUleb128AsU32();
    if (id !== 0) {
      throw new Error(`Invalid id for WebAuthnSignature: ${id}`);
    }
    const signature = deserializer.deserializeBytes();
    const authenticatorData = deserializer.deserializeBytes();
    const clientDataJSON = deserializer.deserializeBytes();
    return new WebAuthnSignature(signature, authenticatorData, clientDataJSON);
  }
}

export class Secp256r1Signature extends Signature {
  static readonly LENGTH = 64;

  private readonly data: Hex;

  constructor(hexInput: HexInput) {
    super();
    const hex = Hex.fromHexInput(hexInput);
    const signatureLength = hex.toUint8Array().length;
    if (signatureLength !== Secp256r1Signature.LENGTH) {
      throw new Error(`Signature length should be ${Secp256r1Signature.LENGTH}, received ${signatureLength}`);
    }
    const signature = p256.Signature.fromCompact(hex.toUint8Array()).normalizeS().toCompactRawBytes();
    this.data = Hex.fromHexInput(signature);
  }

  toUint8Array(): Uint8Array {
    return this.data.toUint8Array();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.data.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Secp256r1Signature {
    const hex = deserializer.deserializeBytes();
    return new Secp256r1Signature(hex);
  }
}
