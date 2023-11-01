import nacl from "tweetnacl";
import { Deserializer, Serializer } from "../../bcs";
import { HexInput, SigningScheme as AuthenticationKeyScheme } from "../../types";
import { Hex } from "../hex";
import { AuthenticationKey } from "./authenticationKey";
import type { PrivateKey, PublicKey } from "./interfaces";

export class Ed25519Signature {
  /**
   * Length of an Ed25519 signature
   */
  static readonly LENGTH = 64;

  public readonly data: Hex;

  constructor(data: HexInput) {
    this.data = Hex.fromHexInput(data);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.data.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Ed25519Signature {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519Signature(bytes);
  }
}

export class Ed25519PublicKey implements PublicKey<Ed25519Signature> {
  /**
   * Length of an Ed25519 public key
   */
  static readonly LENGTH: number = 32;

  public readonly key: Hex;

  constructor(key: HexInput) {
    this.key = Hex.fromHexInput(key);
  }

  verifySignature(message: HexInput, signature: Ed25519Signature): boolean {
    const rawMessage = Hex.fromHexInput(message).toUint8Array();
    return nacl.sign.detached.verify(rawMessage, signature.data.toUint8Array(), this.key.toUint8Array());
  }

  authKey() {
    return AuthenticationKey.fromSchemeAndBytes({
      scheme: AuthenticationKeyScheme.Ed25519,
      input: this.key.toUint8Array(),
    });
  }

  serialize(serializer: Serializer) {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Ed25519PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519PublicKey(bytes);
  }
}

export class Ed25519PrivateKey implements PrivateKey<Ed25519Signature, Ed25519PublicKey> {
  private readonly signingKeyPair: nacl.SignKeyPair;

  constructor(seed: HexInput) {
    const seedBytes = Hex.fromHexInput(seed).toUint8Array();
    this.signingKeyPair = nacl.sign.keyPair.fromSeed(seedBytes.slice(0, 32));
  }

  sign(message: HexInput) {
    const messageBytes = Hex.fromHexInput(message).toUint8Array();
    const signature = nacl.sign.detached(messageBytes, this.signingKeyPair.secretKey);
    return new Ed25519Signature(signature);
  }

  publicKey(): Ed25519PublicKey {
    const bytes = this.signingKeyPair.publicKey;
    return new Ed25519PublicKey(bytes);
  }

  static generate(): Ed25519PrivateKey {
    const keyPair = nacl.sign.keyPair();
    const seed = keyPair.secretKey.slice(0, 32);
    return new Ed25519PrivateKey(seed);
  }
}
