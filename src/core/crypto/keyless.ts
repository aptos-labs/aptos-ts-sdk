// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountPublicKey, PublicKey } from "./publicKey";
import { Signature } from "./signature";
import { Deserializer, Serializable, Serializer } from "../../bcs";
import { Hex } from "../hex";
import { HexInput, EphemeralCertificateVariant, AnyPublicKeyVariant, SigningScheme, ZkpVariant } from "../../types";
import { EphemeralPublicKey, EphemeralSignature } from "./ephemeral";
import { bigIntToBytesLE, bytesToBigIntLE, hashASCIIStrToField, poseidonHash } from "./poseidon";
import { AuthenticationKey } from "../authenticationKey";
import { Proof } from "./proof";

export const EPK_HORIZON_SECS = 10000000;
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
  static readonly ID_COMMITMENT_LENGTH: number = 32;

  readonly iss: string;

  readonly idCommitment: Uint8Array;

  constructor(iss: string, idCommitment: HexInput) {
    super();
    const idcBytes = Hex.fromHexInput(idCommitment).toUint8Array();
    if (idcBytes.length !== KeylessPublicKey.ID_COMMITMENT_LENGTH) {
      throw new Error(`Address seed length in bytes should be ${KeylessPublicKey.ID_COMMITMENT_LENGTH}`);
    }
    this.iss = iss;
    this.idCommitment = idcBytes;
  }

  /**
   * Get the authentication key for the keyless public key
   * 
   * @returns AuthenticationKey
   */
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  verifySignature(args: { message: HexInput; signature: KeylessSignature }): boolean {
    throw new Error("Not yet implemented")
  }

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.iss);
    serializer.serializeBytes(this.idCommitment);
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

  /**
   * Creates a KeylessPublicKey from the JWT components plus pepper
   *
   * @param args.iss the iss of the identity
   * @param args.uidKey the key to use to get the uidVal in the JWT token
   * @param args.uidVal the value of the uidKey in the JWT token
   * @param args.aud the client ID of the application
   * @param args.pepper The pepper used to maintain privacy of the account
   * @returns KeylessPublicKey
   */
  static create(args: {
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
  }): KeylessPublicKey {
    computeIdCommitment(args);
    return new KeylessPublicKey(args.iss, computeIdCommitment(args));
  }
}

function computeIdCommitment(args: {
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

  return bigIntToBytesLE(poseidonHash(fields), KeylessPublicKey.ID_COMMITMENT_LENGTH);
}

export class EphemeralCertificate extends Signature {
  public readonly signature: Signature;

  /**
   * Index of the underlying enum variant
   */
  private readonly variant: EphemeralCertificateVariant;

  constructor(signature: Signature, variant: EphemeralCertificateVariant) {
    super();
    this.signature = signature;
    this.variant = variant;
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
    serializer.serializeU32AsUleb128(this.variant);
    this.signature.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): EphemeralCertificate {
    const variant = deserializer.deserializeUleb128AsU32();
    switch (variant) {
      case EphemeralCertificateVariant.ZkProof:
        return new EphemeralCertificate(ZeroKnowledgeSig.deserialize(deserializer), variant);
      default:
        throw new Error(`Unknown variant index for EphemeralCertificate: ${variant}`);
    }
  }
}

export class Groth16Zkp extends Proof {
  
  /**
   * The bytes of proof point a
   */
  a: Uint8Array;

  /**
   * The bytes of proof point b
   */
  b: Uint8Array;

  /**
   * The bytes of proof point c
   */
  c: Uint8Array;

  constructor(args: { a: HexInput; b: HexInput; c: HexInput }) {
    super();
    const { a, b, c } = args;
    this.a = Hex.fromHexInput(a).toUint8Array();
    this.b = Hex.fromHexInput(b).toUint8Array();
    this.c = Hex.fromHexInput(c).toUint8Array();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.a);
    serializer.serializeFixedBytes(this.b);
    serializer.serializeFixedBytes(this.c);
  }

  static deserialize(deserializer: Deserializer): Groth16Zkp {
    const a = deserializer.deserializeFixedBytes(32);
    const b = deserializer.deserializeFixedBytes(64);
    const c = deserializer.deserializeFixedBytes(32);
    return new Groth16Zkp({ a, b, c });
  }
}

export class ZkProof extends Serializable {
  public readonly proof: Proof;

  /**
   * Index of the underlying enum variant
   */
  private readonly variant: ZkpVariant;

  constructor(proof: Proof, variant: ZkpVariant) {
    super();
    this.proof = proof;
    this.variant = variant;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(this.variant);
    this.proof.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): ZkProof {
    const variant = deserializer.deserializeUleb128AsU32();
    switch (variant) {
      case ZkpVariant.Groth16:
        return new ZkProof(Groth16Zkp.deserialize(deserializer), variant);
      default:
        throw new Error(`Unknown variant index for ZkProof: ${variant}`);
    }
  }
}

export class ZeroKnowledgeSig extends Signature {
  readonly proof: ZkProof;

  readonly expHorizonSecs: bigint;

  readonly extraField?: string;

  readonly overrideAudVal?: string;

  readonly trainingWheelsSignature?: EphemeralSignature;

  constructor(args: {
    proof: ZkProof;
    expHorizonSecs?: bigint;
    extraField?: string;
    overrideAudVal?: string;
    trainingWheelsSignature?: EphemeralSignature;
  }) {
    super();
    const {
      proof,
      expHorizonSecs = BigInt(EPK_HORIZON_SECS),
      trainingWheelsSignature,
      extraField,
      overrideAudVal,
    } = args;
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

  static deserialize(deserializer: Deserializer): ZeroKnowledgeSig {
    const proof = ZkProof.deserialize(deserializer);
    const expHorizonSecs = deserializer.deserializeU64();
    const hasExtraField = deserializer.deserializeUleb128AsU32();
    const extraField = hasExtraField ? deserializer.deserializeStr() : undefined;
    const hasOverrideAudVal = deserializer.deserializeUleb128AsU32();
    const overrideAudVal = hasOverrideAudVal ? deserializer.deserializeStr() : undefined;
    const [trainingWheelsSignature] = deserializer.deserializeVector(EphemeralSignature);
    return new ZeroKnowledgeSig({ proof, expHorizonSecs, trainingWheelsSignature, extraField, overrideAudVal });
  }

  static load(deserializer: Deserializer): ZeroKnowledgeSig {
    const proof = ZkProof.deserialize(deserializer);
    const expHorizonSecs = deserializer.deserializeU64();
    const hasExtraField = deserializer.deserializeUleb128AsU32();
    const extraField = hasExtraField ? deserializer.deserializeStr() : undefined;
    const hasOverrideAudVal = deserializer.deserializeUleb128AsU32();
    const overrideAudVal = hasOverrideAudVal ? deserializer.deserializeStr() : undefined;
    const [trainingWheelsSignature] = deserializer.deserializeVector(EphemeralSignature);
    return new ZeroKnowledgeSig({ proof, expHorizonSecs, trainingWheelsSignature, extraField, overrideAudVal });
  }
}

/**
 * A signature of a message signed via Keyless Accounnt that uses proofs or the jwt token to authenticate.
 */
export class KeylessSignature extends Signature {
  readonly ephemeralCertificate: EphemeralCertificate;

  readonly jwtHeader: string;

  readonly expiryDateSecs: bigint | number;

  readonly ephemeralPublicKey: EphemeralPublicKey;

  readonly ephemeralSignature: EphemeralSignature;

  /**
   * Create a new KeylessSignature
   *
   * @param args.jwtHeader A HexInput (string or Uint8Array)
   * @param args.ephemeralCertificate A HexInput (string or Uint8Array)
   * @param args.expiryDateSecs A HexInput (string or Uint8Array)
   * @param args.ephemeralPublicKey A HexInput (string or Uint8Array)
   * @param args.ephemeralSignature A HexInput (string or Uint8Array)
  */
  constructor(args: {
    jwtHeader: string;
    ephemeralCertificate: EphemeralCertificate;
    expiryDateSecs: bigint | number;
    ephemeralPublicKey: EphemeralPublicKey;
    ephemeralSignature: EphemeralSignature;
  }) {
    super();
    const { jwtHeader, ephemeralCertificate, expiryDateSecs, ephemeralPublicKey, ephemeralSignature } = args;
    this.jwtHeader = jwtHeader;
    this.ephemeralCertificate = ephemeralCertificate;
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
    return this.bcsToBytes();
  }

  serialize(serializer: Serializer): void {
    this.ephemeralCertificate.serialize(serializer);
    serializer.serializeStr(this.jwtHeader);
    serializer.serializeU64(this.expiryDateSecs);
    this.ephemeralPublicKey.serialize(serializer);
    this.ephemeralSignature.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): KeylessSignature {
    const ephemeralCertificate = EphemeralCertificate.deserialize(deserializer);
    const jwtHeader = deserializer.deserializeStr();
    const expiryDateSecs = deserializer.deserializeU64();
    const ephemeralPublicKey = EphemeralPublicKey.deserialize(deserializer);
    const ephemeralSignature = EphemeralSignature.deserialize(deserializer);
    return new KeylessSignature({
      jwtHeader,
      expiryDateSecs,
      ephemeralCertificate,
      ephemeralPublicKey,
      ephemeralSignature,
    });
  }

  static load(deserializer: Deserializer): KeylessSignature {
    const ephemeralCertificate = EphemeralCertificate.deserialize(deserializer);
    const jwtHeader = deserializer.deserializeStr();
    const expiryDateSecs = deserializer.deserializeU64();
    const ephemeralPublicKey = EphemeralPublicKey.deserialize(deserializer);
    const ephemeralSignature = EphemeralSignature.deserialize(deserializer);
    return new KeylessSignature({
      jwtHeader,
      expiryDateSecs,
      ephemeralCertificate,
      ephemeralPublicKey,
      ephemeralSignature,
    });
  }

  static isSignature(signature: Signature): signature is KeylessSignature {
    return signature instanceof KeylessSignature;
  }
}









// /**
//  * A OpenId signature which contains the private inputs to an OIDB proof.
//  */
// export class OpenIdSignature extends Signature {
//   readonly jwtSignature: string;

//   readonly jwtPayloadJson: string;

//   readonly uidKey: string;

//   readonly epkBlinder: Uint8Array;

//   readonly pepper: Uint8Array;

//   readonly overrideAudValue?: string;

//   /**
//    * Create a new Signature instance from a Uint8Array or String.
//    *
//    * @param hexInput A HexInput (string or Uint8Array)
//    */
//   constructor(args: {
//     jwtSignature: string;
//     jwtPayloadJson: string;
//     uidKey?: string;
//     epkBlinder: Uint8Array;
//     pepper: Uint8Array;
//     overrideAudValue?: string;
//   }) {
//     super();
//     const { jwtSignature, uidKey, jwtPayloadJson, epkBlinder, pepper, overrideAudValue } = args;
//     this.jwtSignature = jwtSignature;
//     this.jwtPayloadJson = jwtPayloadJson;
//     this.uidKey = uidKey ?? "sub";
//     this.epkBlinder = epkBlinder;
//     this.pepper = pepper;
//     this.overrideAudValue = overrideAudValue;
//   }

//   /**
//    * Get the signature in bytes (Uint8Array).
//    *
//    * @returns Uint8Array representation of the signature
//    */
//   toUint8Array(): Uint8Array {
//     // const textEncoder = new TextEncoder();
//     // const jwtSigBytes = textEncoder.encode(this.jwtSignature);
//     // const jwtPayloadJsonBytes = textEncoder.encode(this.jwtPayloadJson);
//     // const uidKeyBytes = textEncoder.encode(this.jwtSignature);
//     // const uidKeyBytes = textEncoder.encode(this.jwtSignature);

//     return this.epkBlinder;
//   }

//   /**
//    * Get the signature as a hex string with the 0x prefix.
//    *
//    * @returns string representation of the signature
//    */
//   toString(): string {
//     return this.toString();
//   }

//   serialize(serializer: Serializer): void {
//     serializer.serializeStr(this.jwtSignature);
//     serializer.serializeStr(this.jwtPayloadJson);
//     serializer.serializeStr(this.uidKey);
//     serializer.serializeFixedBytes(this.epkBlinder);
//     serializer.serializeFixedBytes(this.pepper);
//     serializer.serializeOptionStr(this.overrideAudValue);
//   }

//   static deserialize(deserializer: Deserializer): OpenIdSignature {
//     const jwtSignature = deserializer.deserializeStr();
//     const jwtPayloadJson = deserializer.deserializeStr();
//     const uidKey = deserializer.deserializeStr();
//     const epkBlinder = deserializer.deserializeFixedBytes(31);
//     const pepper = deserializer.deserializeFixedBytes(31);
//     const hasOverrideAudValue = deserializer.deserializeUleb128AsU32();
//     const overrideAudValue = hasOverrideAudValue ? deserializer.deserializeStr() : undefined;
//     return new OpenIdSignature({ jwtSignature, jwtPayloadJson, uidKey, epkBlinder, pepper, overrideAudValue });
//   }

//   static load(deserializer: Deserializer): OpenIdSignature {
//     const jwtSignature = deserializer.deserializeStr();
//     const jwtPayloadJson = deserializer.deserializeStr();
//     const uidKey = deserializer.deserializeStr();
//     const epkBlinder = deserializer.deserializeFixedBytes(31);
//     const pepper = deserializer.deserializeFixedBytes(31);
//     const hasOverrideAudValue = deserializer.deserializeUleb128AsU32();
//     const overrideAudValue = hasOverrideAudValue ? deserializer.deserializeStr() : undefined;
//     return new OpenIdSignature({ jwtSignature, jwtPayloadJson, uidKey, epkBlinder, pepper, overrideAudValue });
//   }

//   static isSignature(signature: Signature): signature is OpenIdSignature {
//     return signature instanceof OpenIdSignature;
//   }
// }

