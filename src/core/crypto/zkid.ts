// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { bytesToHex } from "@noble/curves/abstract/utils";
import { PublicKey, Signature } from "./asymmetricCrypto";
import { Deserializer, Serializable, Serializer } from "../../bcs";
import { Hex } from "../hex";
import { HexInput, OpenIdSignatureOrZkProofVariant } from "../../types";
import { EphemeralPublicKey } from "./ephermeralPublicKey";
import { EphemeralSignature } from "./ephemeralSignature";
import { bigIntToBytesLE, bytesToBigIntLE, hashASCIIStrToField, poseidonHash } from "./poseidon";

export const EPK_LIFESPAN = 10000000;

/**
 * Represents the ZkIDPublicKey public key
 *
 * ZkIDPublicKey authentication key is represented in the SDK as `AnyPublicKey`.
 */
export class ZkIDPublicKey extends PublicKey {
  static readonly ADDRESS_SEED_LENGTH: number = 32;

  readonly iss: string;

  readonly addressSeed: Uint8Array;

  constructor(iss: string, addressSeed: HexInput) {
    super();
    const addressSeedBytes = Hex.fromHexInput(addressSeed).toUint8Array();
    if (addressSeedBytes.length !== ZkIDPublicKey.ADDRESS_SEED_LENGTH) {
      throw new Error(`Address seed length in bytes should be ${ZkIDPublicKey.ADDRESS_SEED_LENGTH}`);
    }

    this.iss = iss;
    this.addressSeed = addressSeedBytes;
  }

  /**
   * Get the public key in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the public key
   */
  toUint8Array(): Uint8Array {
    return this.addressSeed; // TODO
  }

  /**
   * Get the public key as a hex string with the 0x prefix.
   *
   * @returns string representation of the public key
   */
  toString(): string {
    return `${this.iss  }.${  bytesToHex(this.addressSeed)}`;
  }

  /**
   * Verifies a signed data with a public key
   *
   * @param args.message message
   * @param args.signature The signature
   * @returns true if the signature is valid
   */
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  verifySignature(args: { message: HexInput; signature: ZkIDSignature }): boolean {
    // TODO
    return true;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.iss);
    serializer.serializeBytes(this.addressSeed);
  }

  static deserialize(deserializer: Deserializer): ZkIDPublicKey {
    const iss = deserializer.deserializeStr();
    const addressSeed = deserializer.deserializeBytes();
    return new ZkIDPublicKey(iss, addressSeed);
  }

  static load(deserializer: Deserializer): ZkIDPublicKey {
    const iss = deserializer.deserializeStr();
    const addressSeed = deserializer.deserializeBytes();
    return new ZkIDPublicKey(iss, addressSeed);
  }

  static isPublicKey(publicKey: PublicKey): publicKey is ZkIDPublicKey {
    return publicKey instanceof ZkIDPublicKey;
  }

  static create(args: {
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
  }): ZkIDPublicKey {
    computeAddressSeed(args);
    return new ZkIDPublicKey(args.iss,computeAddressSeed(args));
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
    hashASCIIStrToField(aud, 4*31),
    hashASCIIStrToField(uidVal, 11*31),
    hashASCIIStrToField(uidKey, 1*31),
  ];

  return bigIntToBytesLE(poseidonHash(fields), ZkIDPublicKey.ADDRESS_SEED_LENGTH);
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
      serializer.serializeU32AsUleb128(OpenIdSignatureOrZkProofVariant.OpenIdSignature);
      this.signature.serialize(serializer);
    } else if (this.signature instanceof SignedGroth16Signature) {
      serializer.serializeU32AsUleb128(OpenIdSignatureOrZkProofVariant.ZkProof);
      this.signature.serialize(serializer);
    } else {
      throw new Error("Not a valid signature for zkID");
    }
  }

  static deserialize(deserializer: Deserializer): OpenIdSignatureOrZkProof {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      // case OpenIdSignatureOrZkProofVariant.ZkProof:
      //   return new AnySignature(Ed25519Signature.load(deserializer));
      case OpenIdSignatureOrZkProofVariant.OpenIdSignature:
        return new OpenIdSignatureOrZkProof(OpenIdSignature.load(deserializer));
      default:
        throw new Error(`Unknown variant index for OpenIdSignatureOrZkProofVariant: ${index}`);
    }
  }
}

export class Groth16Zkp extends Serializable{
  a: Uint8Array;

  b: Uint8Array;

  c: Uint8Array;

  constructor(args: {
    a: HexInput,
    b: HexInput,
    c: HexInput,
  }) {
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
    serializer.serializeFixedBytes(this.a); // Should this be fixedBytes??
    serializer.serializeFixedBytes(this.b);
    serializer.serializeFixedBytes(this.c);
  }

  static deserialize(deserializer: Deserializer): Groth16Zkp {
    const a = deserializer.deserializeBytes();
    const b = deserializer.deserializeBytes();
    const c = deserializer.deserializeBytes();
    return new Groth16Zkp({ a, b, c });
  }
}

export class SignedGroth16Signature extends Signature {
  readonly proof: Groth16Zkp;

  readonly nonMalleabilitySignature: EphemeralSignature;

  readonly extraField?: string;

  readonly overrideAudVal?: string;

  readonly trainingWheelsSignature?: EphemeralSignature;


  constructor(args: {
    proof: Groth16Zkp;
    nonMalleabilitySignature: EphemeralSignature;
    extraField?: string;
    overrideAudVal?: string;
    trainingWheelsSignature?: EphemeralSignature;

  }) {
    super();
    const { proof, nonMalleabilitySignature, trainingWheelsSignature, extraField, overrideAudVal } = args;
    this.proof = proof;
    this.nonMalleabilitySignature = nonMalleabilitySignature;
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
    this.nonMalleabilitySignature.serialize(serializer);
    serializer.serializeU64(EPK_LIFESPAN);
    serializer.serializeOptionStr(this.extraField);
    serializer.serializeOptionStr(this.overrideAudVal);
    serializer.serializeOption(this.trainingWheelsSignature);
    
  }

  static deserialize(deserializer: Deserializer): SignedGroth16Signature {
    const proof = Groth16Zkp.deserialize(deserializer);
    const nonMalleabilitySignature = EphemeralSignature.deserialize(deserializer);
    const trainingWheelsSignature = EphemeralSignature.deserialize(deserializer);
    const extraField = deserializer.deserializeStr();
    return new SignedGroth16Signature({ proof, nonMalleabilitySignature, trainingWheelsSignature, extraField });
  }

  static load(deserializer: Deserializer): SignedGroth16Signature {
    const proof = Groth16Zkp.deserialize(deserializer);
    const nonMalleabilitySignature = EphemeralSignature.deserialize(deserializer);
    const trainingWheelsSignature = EphemeralSignature.deserialize(deserializer);
    const extraField = deserializer.deserializeStr();
    return new SignedGroth16Signature({ proof, nonMalleabilitySignature, trainingWheelsSignature, extraField });
  }

  // static isSignature(signature: Signature): signature is OpenIdSignature {
  //   return signature instanceof OpenIdSignature;
  // }
}

/**
 * A OpenId signature which contains the private inputs to a ZkID proof.
 */
export class OpenIdSignature extends Signature {
  readonly jwtSignature: string;

  readonly uidKey: string;

  readonly jwtPayloadJson: string;

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
    serializer.serializeBytes(this.epkBlinder);
    serializer.serializeFixedBytes(this.pepper);
    serializer.serializeOptionStr(this.overrideAudValue);
  }

  static deserialize(deserializer: Deserializer): OpenIdSignature {
    const jwtSignature = deserializer.deserializeStr();
    const jwtPayloadJson = deserializer.deserializeStr();
    const uidKey = deserializer.deserializeStr();
    const epkBlinder = deserializer.deserializeFixedBytes(31);
    const pepper = deserializer.deserializeFixedBytes(31);
    return new OpenIdSignature({ jwtSignature, jwtPayloadJson, uidKey, epkBlinder, pepper });
  }

  static load(deserializer: Deserializer): OpenIdSignature {
    const jwtSignature = deserializer.deserializeStr();
    const jwtPayloadJson = deserializer.deserializeStr();
    const uidKey = deserializer.deserializeStr();
    const epkBlinder = deserializer.deserializeFixedBytes(31);
    const pepper = deserializer.deserializeFixedBytes(31);
    return new OpenIdSignature({ jwtSignature, jwtPayloadJson, uidKey, epkBlinder, pepper });
  }

  static isSignature(signature: Signature): signature is OpenIdSignature {
    return signature instanceof OpenIdSignature;
  }
}

/**
 * A signature of a message signed via OIDC that uses proofs or the jwt token to authenticate.
 */
export class ZkIDSignature extends Signature {
  readonly openIdSignatureOrZkProof: OpenIdSignatureOrZkProof;

  readonly jwtHeader: string;

  readonly expiryTimestamp: bigint;

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
    expiryTimestamp: bigint;
    ephemeralPublicKey: EphemeralPublicKey;
    ephemeralSignature: EphemeralSignature;
  }) {
    super();
    const { jwtHeader, openIdSignatureOrZkProof, expiryTimestamp, ephemeralPublicKey, ephemeralSignature } = args;
    this.jwtHeader = jwtHeader;
    this.openIdSignatureOrZkProof = openIdSignatureOrZkProof;
    this.expiryTimestamp = expiryTimestamp;
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
    serializer.serializeU64(this.expiryTimestamp);
    this.ephemeralPublicKey.serialize(serializer);
    this.ephemeralSignature.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): ZkIDSignature {
    const jwtHeader = deserializer.deserializeStr();
    const expiryTimestamp = deserializer.deserializeU64();
    const openIdSignatureOrZkProof = OpenIdSignatureOrZkProof.deserialize(deserializer);
    const ephemeralPublicKey = EphemeralPublicKey.deserialize(deserializer);
    const ephemeralSignature = EphemeralSignature.deserialize(deserializer);
    return new ZkIDSignature({
      jwtHeader,
      expiryTimestamp,
      openIdSignatureOrZkProof,
      ephemeralPublicKey,
      ephemeralSignature,
    });
  }

  static load(deserializer: Deserializer): ZkIDSignature {
    const jwtHeader = deserializer.deserializeStr();
    const expiryTimestamp = deserializer.deserializeU64();
    const openIdSignatureOrZkProof = OpenIdSignatureOrZkProof.deserialize(deserializer);
    const ephemeralPublicKey = EphemeralPublicKey.deserialize(deserializer);
    const ephemeralSignature = EphemeralSignature.deserialize(deserializer);
    return new ZkIDSignature({
      jwtHeader,
      expiryTimestamp,
      openIdSignatureOrZkProof,
      ephemeralPublicKey,
      ephemeralSignature,
    });
  }

  static isSignature(signature: Signature): signature is ZkIDSignature {
    return signature instanceof ZkIDSignature;
  }
}
