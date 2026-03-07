import { ed25519 } from "@noble/curves/ed25519";
import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import { CKDPriv, deriveKey, HARDENED_OFFSET, isValidHardenedPath, mnemonicToSeed, splitPath } from "./hd-key.js";
import { type PrivateKey, PrivateKeyUtils } from "./private-key.js";
import { AccountPublicKey, createAuthKey, type VerifySignatureArgs } from "./public-key.js";
import { Signature } from "./signature.js";
import { PrivateKeyVariants, SigningScheme } from "./types.js";
import { convertSigningMessage } from "./utils.js";

const L: number[] = [
  0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10,
];

export function isCanonicalEd25519Signature(signature: Signature): boolean {
  const s = signature.toUint8Array().slice(32);
  for (let i = L.length - 1; i >= 0; i -= 1) {
    if (s[i] < L[i]) return true;
    if (s[i] > L[i]) return false;
  }
  return false;
}

export class Ed25519PublicKey extends AccountPublicKey {
  static readonly LENGTH: number = 32;

  private readonly key: Hex;

  constructor(hexInput: HexInput) {
    super();
    const hex = Hex.fromHexInput(hexInput);
    if (hex.toUint8Array().length !== Ed25519PublicKey.LENGTH) {
      throw new Error(`PublicKey length should be ${Ed25519PublicKey.LENGTH}`);
    }
    this.key = hex;
  }

  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    if (!isCanonicalEd25519Signature(signature)) return false;
    const messageToVerify = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToVerify).toUint8Array();
    const signatureBytes = signature.toUint8Array();
    const publicKeyBytes = this.key.toUint8Array();
    return ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
  }

  authKey(): unknown {
    return createAuthKey(SigningScheme.Ed25519, this.toUint8Array());
  }

  toUint8Array(): Uint8Array {
    return this.key.toUint8Array();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Ed25519PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519PublicKey(bytes);
  }
}

export class Ed25519PrivateKey extends Serializable implements PrivateKey {
  static readonly LENGTH: number = 32;
  static readonly SLIP_0010_SEED = "ed25519 seed";

  private signingKey: Hex;
  private cleared: boolean = false;

  constructor(hexInput: HexInput, strict?: boolean) {
    super();
    const privateKeyHex = PrivateKeyUtils.parseHexInput(hexInput, PrivateKeyVariants.Ed25519, strict);
    if (privateKeyHex.toUint8Array().length !== Ed25519PrivateKey.LENGTH) {
      throw new Error(`PrivateKey length should be ${Ed25519PrivateKey.LENGTH}`);
    }
    this.signingKey = privateKeyHex;
  }

  static generate(): Ed25519PrivateKey {
    const keyPair = ed25519.utils.randomPrivateKey();
    return new Ed25519PrivateKey(keyPair, false);
  }

  static fromDerivationPath(path: string, mnemonics: string): Ed25519PrivateKey {
    if (!isValidHardenedPath(path)) {
      throw new Error(`Invalid derivation path ${path}`);
    }
    return Ed25519PrivateKey.fromDerivationPathInner(path, mnemonicToSeed(mnemonics));
  }

  private static fromDerivationPathInner(path: string, seed: Uint8Array, offset = HARDENED_OFFSET): Ed25519PrivateKey {
    const { key, chainCode } = deriveKey(Ed25519PrivateKey.SLIP_0010_SEED, seed);
    const segments = splitPath(path).map((el) => parseInt(el, 10));
    const { key: privateKey } = segments.reduce((parentKeys, segment) => CKDPriv(parentKeys, segment + offset), {
      key,
      chainCode,
    });
    return new Ed25519PrivateKey(privateKey, false);
  }

  private ensureNotCleared(): void {
    if (this.cleared) {
      throw new Error("Private key has been cleared from memory and can no longer be used");
    }
  }

  clear(): void {
    if (!this.cleared) {
      const keyBytes = this.signingKey.toUint8Array();
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

  publicKey(): Ed25519PublicKey {
    this.ensureNotCleared();
    const bytes = ed25519.getPublicKey(this.signingKey.toUint8Array());
    return new Ed25519PublicKey(bytes);
  }

  sign(message: HexInput): Ed25519Signature {
    this.ensureNotCleared();
    const messageToSign = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToSign).toUint8Array();
    const signatureBytes = ed25519.sign(messageBytes, this.signingKey.toUint8Array());
    return new Ed25519Signature(signatureBytes);
  }

  toUint8Array(): Uint8Array {
    this.ensureNotCleared();
    return this.signingKey.toUint8Array();
  }

  toString(): string {
    this.ensureNotCleared();
    return this.toAIP80String();
  }

  toHexString(): string {
    this.ensureNotCleared();
    return this.signingKey.toString();
  }

  toAIP80String(): string {
    this.ensureNotCleared();
    return PrivateKeyUtils.formatPrivateKey(this.signingKey.toString(), PrivateKeyVariants.Ed25519);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Ed25519PrivateKey {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519PrivateKey(bytes, false);
  }
}

export class Ed25519Signature extends Signature {
  static readonly LENGTH = 64;

  private readonly data: Hex;

  constructor(hexInput: HexInput) {
    super();
    const data = Hex.fromHexInput(hexInput);
    if (data.toUint8Array().length !== Ed25519Signature.LENGTH) {
      throw new Error(`Signature length should be ${Ed25519Signature.LENGTH}`);
    }
    this.data = data;
  }

  toUint8Array(): Uint8Array {
    return this.data.toUint8Array();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.data.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Ed25519Signature {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519Signature(bytes);
  }
}
