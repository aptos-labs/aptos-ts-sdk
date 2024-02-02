// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { bytesToHex } from "@noble/curves/abstract/utils";
import { PublicKey, Signature } from "./asymmetricCrypto";
import { Deserializer, Serializer } from "../../bcs";
import { Hex } from "../hex";
import { HexInput, OpenIdSignatureOrZkProofVariant } from "../../types";
import { EphemeralPublicKey } from "./ephermeralPublicKey";
import { EphemeralSignature } from "./ephemeralSignature";
import { bigIntToBytesLE, bytesToBigIntLE, hashASCIIStrToField, poseidonHash } from "./poseidon";

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
    serializer.serializeFixedBytes(this.addressSeed);
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
    hashASCIIStrToField(uidVal, 4*31),
    hashASCIIStrToField(uidKey, 2*31),
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

/**
 * A OpenId signature which contains the private inputs to a ZkID proof.
 */
export class OpenIdSignature extends Signature {
  readonly jwtSignature: string;

  readonly uidKey: string;

  readonly jwtPayloadJson: string;

  readonly epkBlinder: Uint8Array;

  readonly pepper: Uint8Array;

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
  }) {
    super();
    const { jwtSignature, uidKey, jwtPayloadJson, epkBlinder, pepper } = args;
    this.jwtSignature = jwtSignature;
    this.jwtPayloadJson = jwtPayloadJson;
    this.uidKey = uidKey ?? "sub";
    this.epkBlinder = epkBlinder;
    this.pepper = pepper;
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
