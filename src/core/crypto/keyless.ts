// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountPublicKey, PublicKey } from "./publicKey";
import { Signature } from "./signature";
import { Deserializer, Serializable, Serializer } from "../../bcs";
import { Hex } from "../hex";
import { HexInput, EphemeralCertificate, AnyPublicKeyVariant, SigningScheme } from "../../types";
import { EphemeralPublicKey, EphemeralSignature } from "./ephemeral";
import { bigIntToBytesLE, bytesToBigIntLE, hashASCIIStrToField, poseidonHash } from "./poseidon";
import { AuthenticationKey } from "../authenticationKey";

export const EPK_LIFESPAN = 10000000;
export const MAX_AUD_VAL_BYTES = 120;
export const MAX_UID_KEY_BYTES = 30;
export const MAX_UID_VAL_BYTES = 330;
export const MAX_ISS_VAL_BYTES = 120;
export const MAX_EXTRA_FIELD_BYTES = 350;
export const MAX_JWT_HEADER_B64_BYTES = 300;
export const MAX_COMMITED_EPK_BYTES = 93;

/**
 * Represents the KeylessPublicKey public key
 *
 * KeylessPublicKey authentication key is represented in the SDK as `AnyPublicKey`.
 */
export class KeylessPublicKey extends AccountPublicKey {
  static readonly ADDRESS_SEED_LENGTH: number = 32;

  readonly iss: string;

  readonly addressSeed: Uint8Array;

  constructor(iss: string, addressSeed: HexInput) {
    super();
    const addressSeedBytes = Hex.fromHexInput(addressSeed).toUint8Array();
    if (addressSeedBytes.length !== KeylessPublicKey.ADDRESS_SEED_LENGTH) {
      throw new Error(`Address seed length in bytes should be ${KeylessPublicKey.ADDRESS_SEED_LENGTH}`);
    }

    this.iss = iss;
    this.addressSeed = addressSeedBytes;
  }

  authKey(): AuthenticationKey {
    const serializer = new Serializer();
    serializer.serializeU32AsUleb128(AnyPublicKeyVariant.Keyless);
    serializer.serializeFixedBytes(this.bcsToBytes());
    return AuthenticationKey.fromSchemeAndBytes({
      scheme: SigningScheme.SingleKey,
      input: serializer.toUint8Array(),
    });
  }

  /**
   * Get the public key in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the public key
   */
  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  /**
   * Get the public key as a hex string with the 0x prefix.
   *
   * @returns string representation of the public key
   */
  toString(): string {
    return Hex.fromHexInput(this.toUint8Array()).toString();
  }

  /**
   * Verifies a signed data with a public key
   *
   * @param args.message message
   * @param args.signature The signature
   * @returns true if the signature is valid
   */
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  verifySignature(args: { message: HexInput; signature: KeylessSignature }): boolean {
    // TODO
    return true;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.iss);
    serializer.serializeBytes(this.addressSeed);
  }

  static deserialize(deserializer: Deserializer): KeylessPublicKey {
    const iss = deserializer.deserializeStr();
    const addressSeed = deserializer.deserializeBytes();
    return new KeylessPublicKey(iss, addressSeed);
  }

  static load(deserializer: Deserializer): KeylessPublicKey {
    const iss = deserializer.deserializeStr();
    const addressSeed = deserializer.deserializeBytes();
    return new KeylessPublicKey(iss, addressSeed);
  }

  static isPublicKey(publicKey: PublicKey): publicKey is KeylessPublicKey {
    return publicKey instanceof KeylessPublicKey;
  }

  static create(args: {
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
  }): KeylessPublicKey {
    computeAddressSeed(args);
    return new KeylessPublicKey(args.iss, computeAddressSeed(args));
  }
}

export function computeAddressSeed(args: {
  uidKey: string;
  uidVal: string;
  aud: string;
  pepper: HexInput;
}): Uint8Array {
  const { uidKey, uidVal, aud, pepper } = args;

  const fields = [
    bytesToBigIntLE(Hex.fromHexInput(pepper).toUint8Array()),
    hashASCIIStrToField(aud, MAX_AUD_VAL_BYTES),
    hashASCIIStrToField(uidVal, MAX_UID_VAL_BYTES),
    hashASCIIStrToField(uidKey, MAX_UID_KEY_BYTES),
  ];

  return bigIntToBytesLE(poseidonHash(fields), KeylessPublicKey.ADDRESS_SEED_LENGTH);
}

export class OpenIdSignatureOrZkProof extends Signature {
  public readonly signature: Signature;

  constructor(signature: Signature) {
    super();
    this.signature = signature;
  }

  /**
   * Get the public key in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the public key
   */
  toUint8Array(): Uint8Array {
    return this.signature.toUint8Array();
  }

  /**
   * Get the public key as a hex string with the 0x prefix.
   *
   * @returns string representation of the public key
   */
  toString(): string {
    return this.signature.toString();
  }

  serialize(serializer: Serializer): void {
    if (this.signature instanceof OpenIdSignature) {
      serializer.serializeU32AsUleb128(EphemeralCertificate.OpenIdSignature);
      this.signature.serialize(serializer);
    } else if (this.signature instanceof SignedGroth16Signature) {
      serializer.serializeU32AsUleb128(EphemeralCertificate.ZkProof);
      this.signature.serialize(serializer);
    } else {
      throw new Error("Not a valid OIDB signature");
    }
  }

  static deserialize(deserializer: Deserializer): OpenIdSignatureOrZkProof {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case EphemeralCertificate.ZkProof:
        return new OpenIdSignatureOrZkProof(SignedGroth16Signature.load(deserializer));
      case EphemeralCertificate.OpenIdSignature:
        return new OpenIdSignatureOrZkProof(OpenIdSignature.load(deserializer));
      default:
        throw new Error(`Unknown variant index for EphemeralCertificate: ${index}`);
    }
  }
}

export class Groth16Zkp extends Serializable {
  a: Uint8Array;

  b: Uint8Array;

  c: Uint8Array;

  constructor(args: { a: HexInput; b: HexInput; c: HexInput }) {
    super();
    const { a, b, c } = args;
    this.a = Hex.fromHexInput(a).toUint8Array();
    this.b = Hex.fromHexInput(b).toUint8Array();
    this.c = Hex.fromHexInput(c).toUint8Array();
  }

  toUint8Array(): Uint8Array {
    const serializer = new Serializer();
    this.serialize(serializer);
    return serializer.toUint8Array();
  }

  serialize(serializer: Serializer): void {
    // There's currently only one variant
    serializer.serializeU32AsUleb128(0);
    serializer.serializeFixedBytes(this.a);
    serializer.serializeFixedBytes(this.b);
    serializer.serializeFixedBytes(this.c);
  }

  static deserialize(deserializer: Deserializer): Groth16Zkp {
    // Ignored, as there's currently only one possible ZKP variant
    deserializer.deserializeUleb128AsU32();
    const a = deserializer.deserializeFixedBytes(32);
    const b = deserializer.deserializeFixedBytes(64);
    const c = deserializer.deserializeFixedBytes(32);
    return new Groth16Zkp({ a, b, c });
  }
}

export class SignedGroth16Signature extends Signature {
  readonly proof: Groth16Zkp;

  readonly expHorizonSecs: bigint;

  readonly extraField?: string;

  readonly overrideAudVal?: string;

  readonly trainingWheelsSignature?: EphemeralSignature;

  constructor(args: {
    proof: Groth16Zkp;
    expHorizonSecs?: bigint;
    extraField?: string;
    overrideAudVal?: string;
    trainingWheelsSignature?: EphemeralSignature;
  }) {
    super();
    const { proof, expHorizonSecs = BigInt(EPK_LIFESPAN), trainingWheelsSignature, extraField, overrideAudVal } = args;
    this.proof = proof;
    this.expHorizonSecs = expHorizonSecs;
    this.trainingWheelsSignature = trainingWheelsSignature;
    this.extraField = extraField;
    this.overrideAudVal = overrideAudVal;
  }

  /**
   * Get the signature in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the signature
   */
  toUint8Array(): Uint8Array {
    const serializer = new Serializer();
    this.serialize(serializer);
    return serializer.toUint8Array();
  }

  /**
   * Get the signature as a hex string with the 0x prefix.
   *
   * @returns string representation of the signature
   */
  toString(): string {
    return this.toString();
  }

  serialize(serializer: Serializer): void {
    this.proof.serialize(serializer);
    serializer.serializeU64(this.expHorizonSecs);
    serializer.serializeOptionStr(this.extraField);
    serializer.serializeOptionStr(this.overrideAudVal);
    serializer.serializeOption(this.trainingWheelsSignature);
  }

  static deserialize(deserializer: Deserializer): SignedGroth16Signature {
    const proof = Groth16Zkp.deserialize(deserializer);
    const expHorizonSecs = deserializer.deserializeU64();
    const hasExtraField = deserializer.deserializeUleb128AsU32();
    const extraField = hasExtraField ? deserializer.deserializeStr() : undefined;
    const hasOverrideAudVal = deserializer.deserializeUleb128AsU32();
    const overrideAudVal = hasOverrideAudVal ? deserializer.deserializeStr() : undefined;
    const [trainingWheelsSignature] = deserializer.deserializeVector(EphemeralSignature);
    return new SignedGroth16Signature({ proof, expHorizonSecs, trainingWheelsSignature, extraField, overrideAudVal });
  }

  static load(deserializer: Deserializer): SignedGroth16Signature {
    const proof = Groth16Zkp.deserialize(deserializer);
    const expHorizonSecs = deserializer.deserializeU64();
    const hasExtraField = deserializer.deserializeUleb128AsU32();
    const extraField = hasExtraField ? deserializer.deserializeStr() : undefined;
    const hasOverrideAudVal = deserializer.deserializeUleb128AsU32();
    const overrideAudVal = hasOverrideAudVal ? deserializer.deserializeStr() : undefined;
    const [trainingWheelsSignature] = deserializer.deserializeVector(EphemeralSignature);
    return new SignedGroth16Signature({ proof, expHorizonSecs, trainingWheelsSignature, extraField, overrideAudVal });
  }

  // static isSignature(signature: Signature): signature is OpenIdSignature {
  //   return signature instanceof OpenIdSignature;
  // }
}

/**
 * A OpenId signature which contains the private inputs to an OIDB proof.
 */
export class OpenIdSignature extends Signature {
  readonly jwtSignature: string;

  readonly jwtPayloadJson: string;

  readonly uidKey: string;

  readonly epkBlinder: Uint8Array;

  readonly pepper: Uint8Array;

  readonly overrideAudValue?: string;

  /**
   * Create a new Signature instance from a Uint8Array or String.
   *
   * @param hexInput A HexInput (string or Uint8Array)
   */
  constructor(args: {
    jwtSignature: string;
    jwtPayloadJson: string;
    uidKey?: string;
    epkBlinder: Uint8Array;
    pepper: Uint8Array;
    overrideAudValue?: string;
  }) {
    super();
    const { jwtSignature, uidKey, jwtPayloadJson, epkBlinder, pepper, overrideAudValue } = args;
    this.jwtSignature = jwtSignature;
    this.jwtPayloadJson = jwtPayloadJson;
    this.uidKey = uidKey ?? "sub";
    this.epkBlinder = epkBlinder;
    this.pepper = pepper;
    this.overrideAudValue = overrideAudValue;
  }

  /**
   * Get the signature in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the signature
   */
  toUint8Array(): Uint8Array {
    // const textEncoder = new TextEncoder();
    // const jwtSigBytes = textEncoder.encode(this.jwtSignature);
    // const jwtPayloadJsonBytes = textEncoder.encode(this.jwtPayloadJson);
    // const uidKeyBytes = textEncoder.encode(this.jwtSignature);
    // const uidKeyBytes = textEncoder.encode(this.jwtSignature);

    return this.epkBlinder;
  }

  /**
   * Get the signature as a hex string with the 0x prefix.
   *
   * @returns string representation of the signature
   */
  toString(): string {
    return this.toString();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.jwtSignature);
    serializer.serializeStr(this.jwtPayloadJson);
    serializer.serializeStr(this.uidKey);
    serializer.serializeFixedBytes(this.epkBlinder);
    serializer.serializeFixedBytes(this.pepper);
    serializer.serializeOptionStr(this.overrideAudValue);
  }

  static deserialize(deserializer: Deserializer): OpenIdSignature {
    const jwtSignature = deserializer.deserializeStr();
    const jwtPayloadJson = deserializer.deserializeStr();
    const uidKey = deserializer.deserializeStr();
    const epkBlinder = deserializer.deserializeFixedBytes(31);
    const pepper = deserializer.deserializeFixedBytes(31);
    const hasOverrideAudValue = deserializer.deserializeUleb128AsU32();
    const overrideAudValue = hasOverrideAudValue ? deserializer.deserializeStr() : undefined;
    return new OpenIdSignature({ jwtSignature, jwtPayloadJson, uidKey, epkBlinder, pepper, overrideAudValue });
  }

  static load(deserializer: Deserializer): OpenIdSignature {
    const jwtSignature = deserializer.deserializeStr();
    const jwtPayloadJson = deserializer.deserializeStr();
    const uidKey = deserializer.deserializeStr();
    const epkBlinder = deserializer.deserializeFixedBytes(31);
    const pepper = deserializer.deserializeFixedBytes(31);
    const hasOverrideAudValue = deserializer.deserializeUleb128AsU32();
    const overrideAudValue = hasOverrideAudValue ? deserializer.deserializeStr() : undefined;
    return new OpenIdSignature({ jwtSignature, jwtPayloadJson, uidKey, epkBlinder, pepper, overrideAudValue });
  }

  static isSignature(signature: Signature): signature is OpenIdSignature {
    return signature instanceof OpenIdSignature;
  }
}

/**
 * A signature of a message signed via OIDC that uses proofs or the jwt token to authenticate.
 */
export class KeylessSignature extends Signature {
  readonly openIdSignatureOrZkProof: OpenIdSignatureOrZkProof;

  readonly jwtHeader: string;

  readonly expiryDateSecs: bigint;

  readonly ephemeralPublicKey: EphemeralPublicKey;

  readonly ephemeralSignature: EphemeralSignature;

  /**
   * Create a new Signature instance from a Uint8Array or String.
   *
   * @param hexInput A HexInput (string or Uint8Array)
   */
  constructor(args: {
    jwtHeader: string;
    openIdSignatureOrZkProof: OpenIdSignatureOrZkProof;
    expiryDateSecs: bigint;
    ephemeralPublicKey: EphemeralPublicKey;
    ephemeralSignature: EphemeralSignature;
  }) {
    super();
    const { jwtHeader, openIdSignatureOrZkProof, expiryDateSecs, ephemeralPublicKey, ephemeralSignature } = args;
    this.jwtHeader = jwtHeader;
    this.openIdSignatureOrZkProof = openIdSignatureOrZkProof;
    this.expiryDateSecs = expiryDateSecs;
    this.ephemeralPublicKey = ephemeralPublicKey;
    this.ephemeralSignature = ephemeralSignature;
  }

  /**
   * Get the signature in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the signature
   */
  toUint8Array(): Uint8Array {
    return this.ephemeralSignature.toUint8Array();
  }

  /**
   * Get the signature as a hex string with the 0x prefix.
   *
   * @returns string representation of the signature
   */
  toString(): string {
    return this.toString();
  }

  serialize(serializer: Serializer): void {
    this.openIdSignatureOrZkProof.serialize(serializer);
    serializer.serializeStr(this.jwtHeader);
    serializer.serializeU64(this.expiryDateSecs);
    this.ephemeralPublicKey.serialize(serializer);
    this.ephemeralSignature.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): KeylessSignature {
    const openIdSignatureOrZkProof = OpenIdSignatureOrZkProof.deserialize(deserializer);
    const jwtHeader = deserializer.deserializeStr();
    const expiryDateSecs = deserializer.deserializeU64();
    const ephemeralPublicKey = EphemeralPublicKey.deserialize(deserializer);
    const ephemeralSignature = EphemeralSignature.deserialize(deserializer);
    return new KeylessSignature({
      jwtHeader,
      expiryDateSecs,
      openIdSignatureOrZkProof,
      ephemeralPublicKey,
      ephemeralSignature,
    });
  }

  static load(deserializer: Deserializer): KeylessSignature {
    const jwtHeader = deserializer.deserializeStr();
    const expiryDateSecs = deserializer.deserializeU64();
    const openIdSignatureOrZkProof = OpenIdSignatureOrZkProof.deserialize(deserializer);
    const ephemeralPublicKey = EphemeralPublicKey.deserialize(deserializer);
    const ephemeralSignature = EphemeralSignature.deserialize(deserializer);
    return new KeylessSignature({
      jwtHeader,
      expiryDateSecs,
      openIdSignatureOrZkProof,
      ephemeralPublicKey,
      ephemeralSignature,
    });
  }

  static isSignature(signature: Signature): signature is KeylessSignature {
    return signature instanceof KeylessSignature;
  }
}
