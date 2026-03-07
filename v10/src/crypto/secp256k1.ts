import { secp256k1 } from "@noble/curves/secp256k1";
import { sha3_256 } from "@noble/hashes/sha3";
import { HDKey } from "@scure/bip32";
import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import { isValidBIP44Path, mnemonicToSeed } from "./hd-key.js";
import { type PrivateKey, PrivateKeyUtils } from "./private-key.js";
import { PublicKey, type VerifySignatureArgs } from "./public-key.js";
import { Signature } from "./signature.js";
import { PrivateKeyVariants } from "./types.js";
import { convertSigningMessage } from "./utils.js";

export class Secp256k1PublicKey extends PublicKey {
  static readonly LENGTH: number = 65;
  static readonly COMPRESSED_LENGTH: number = 33;

  private readonly key: Hex;

  constructor(hexInput: HexInput) {
    super();
    const hex = Hex.fromHexInput(hexInput);
    const { length } = hex.toUint8Array();
    if (length === Secp256k1PublicKey.LENGTH) {
      this.key = hex;
    } else if (length === Secp256k1PublicKey.COMPRESSED_LENGTH) {
      const point = secp256k1.ProjectivePoint.fromHex(hex.toUint8Array());
      this.key = Hex.fromHexInput(point.toRawBytes(false));
    } else {
      throw new Error(
        `PublicKey length should be ${Secp256k1PublicKey.LENGTH} or ${Secp256k1PublicKey.COMPRESSED_LENGTH}, received ${length}`,
      );
    }
  }

  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    const messageToVerify = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToVerify).toUint8Array();
    const messageSha3Bytes = sha3_256(messageBytes);
    const signatureBytes = signature.toUint8Array();
    return secp256k1.verify(signatureBytes, messageSha3Bytes, this.key.toUint8Array(), { lowS: true });
  }

  toUint8Array(): Uint8Array {
    return this.key.toUint8Array();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Secp256k1PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256k1PublicKey(bytes);
  }
}

export class Secp256k1PrivateKey extends Serializable implements PrivateKey {
  static readonly LENGTH: number = 32;

  private key: Hex;
  private cleared: boolean = false;

  constructor(hexInput: HexInput, strict?: boolean) {
    super();
    const privateKeyHex = PrivateKeyUtils.parseHexInput(hexInput, PrivateKeyVariants.Secp256k1, strict);
    if (privateKeyHex.toUint8Array().length !== Secp256k1PrivateKey.LENGTH) {
      throw new Error(`PrivateKey length should be ${Secp256k1PrivateKey.LENGTH}`);
    }
    this.key = privateKeyHex;
  }

  static generate(): Secp256k1PrivateKey {
    const hexInput = secp256k1.utils.randomPrivateKey();
    return new Secp256k1PrivateKey(hexInput, false);
  }

  static fromDerivationPath(path: string, mnemonics: string): Secp256k1PrivateKey {
    if (!isValidBIP44Path(path)) {
      throw new Error(`Invalid derivation path ${path}`);
    }
    return Secp256k1PrivateKey.fromDerivationPathInner(path, mnemonicToSeed(mnemonics));
  }

  private static fromDerivationPathInner(path: string, seed: Uint8Array): Secp256k1PrivateKey {
    const { privateKey } = HDKey.fromMasterSeed(seed).derive(path);
    if (privateKey === null) {
      throw new Error("Invalid key");
    }
    return new Secp256k1PrivateKey(privateKey, false);
  }

  private ensureNotCleared(): void {
    if (this.cleared) {
      throw new Error("Private key has been cleared from memory and can no longer be used");
    }
  }

  clear(): void {
    if (!this.cleared) {
      const keyBytes = this.key.toUint8Array();
      crypto.getRandomValues(keyBytes);
      keyBytes.fill(0xff);
      crypto.getRandomValues(keyBytes);
      keyBytes.fill(0);
      this.cleared = true;
    }
  }

  isCleared(): boolean {
    return this.cleared;
  }

  sign(message: HexInput): Secp256k1Signature {
    this.ensureNotCleared();
    const messageToSign = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToSign);
    const messageHashBytes = sha3_256(messageBytes.toUint8Array());
    const signature = secp256k1.sign(messageHashBytes, this.key.toUint8Array(), { lowS: true });
    return new Secp256k1Signature(signature.toCompactRawBytes());
  }

  publicKey(): Secp256k1PublicKey {
    this.ensureNotCleared();
    const bytes = secp256k1.getPublicKey(this.key.toUint8Array(), false);
    return new Secp256k1PublicKey(bytes);
  }

  toUint8Array(): Uint8Array {
    this.ensureNotCleared();
    return this.key.toUint8Array();
  }

  toString(): string {
    this.ensureNotCleared();
    return this.toAIP80String();
  }

  toHexString(): string {
    this.ensureNotCleared();
    return this.key.toString();
  }

  toAIP80String(): string {
    this.ensureNotCleared();
    return PrivateKeyUtils.formatPrivateKey(this.key.toString(), PrivateKeyVariants.Secp256k1);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Secp256k1PrivateKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256k1PrivateKey(bytes, false);
  }
}

export class Secp256k1Signature extends Signature {
  static readonly LENGTH = 64;

  private readonly data: Hex;

  constructor(hexInput: HexInput) {
    super();
    const data = Hex.fromHexInput(hexInput);
    if (data.toUint8Array().length !== Secp256k1Signature.LENGTH) {
      throw new Error(
        `Signature length should be ${Secp256k1Signature.LENGTH}, received ${data.toUint8Array().length}`,
      );
    }
    this.data = data;
  }

  toUint8Array(): Uint8Array {
    return this.data.toUint8Array();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.data.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Secp256k1Signature {
    const hex = deserializer.deserializeBytes();
    return new Secp256k1Signature(hex);
  }
}
