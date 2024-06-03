// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { JwtPayload, jwtDecode } from "jwt-decode";
import { AccountPublicKey, PublicKey } from "./publicKey";
import { Signature } from "./signature";
import { Deserializer, Serializable, Serializer } from "../../bcs";
import { Hex } from "../hex";
import {
  HexInput,
  EphemeralCertificateVariant,
  AnyPublicKeyVariant,
  SigningScheme,
  ZkpVariant,
  LedgerVersionArg,
  MoveResource,
} from "../../types";
import { EphemeralPublicKey, EphemeralSignature } from "./ephemeral";
import { bigIntToBytesLE, bytesToBigIntLE, hashStrToField, poseidonHash } from "./poseidon";
import { AuthenticationKey } from "../authenticationKey";
import { Proof } from "./proof";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519";
import { Groth16VerificationKeyResponse, KeylessConfigurationResponse } from "../../types/keyless";
import { AptosConfig } from "../../api/aptosConfig";
import { getAptosFullNode } from "../../client";
import { memoizeAsync } from "../../utils/memoize";
import { AccountAddress } from "../accountAddress";

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
  /**
   * The number of bytes that `idCommitment` should be
   */
  static readonly ID_COMMITMENT_LENGTH: number = 32;

  /**
   * The value of the 'iss' claim on the JWT which identifies the OIDC provider.
   */
  readonly iss: string;

  /**
   * A value representing a cryptographic commitment to a user identity.
   *
   * It is calculated from the aud, uidKey, uidVal, pepper.
   */
  readonly idCommitment: Uint8Array;

  constructor(iss: string, idCommitment: HexInput) {
    super();
    const idcBytes = Hex.fromHexInput(idCommitment).toUint8Array();
    if (idcBytes.length !== KeylessPublicKey.ID_COMMITMENT_LENGTH) {
      throw new Error(`Id Commitment length in bytes should be ${KeylessPublicKey.ID_COMMITMENT_LENGTH}`);
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
    throw new Error("Not yet implemented");
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

  static fromJwtAndPepper(args: { jwt: string; pepper: HexInput; uidKey?: string }): KeylessPublicKey {
    const { jwt, pepper, uidKey = "sub" } = args;
    const jwtPayload = jwtDecode<JwtPayload & { [key: string]: string }>(jwt);
    const iss = jwtPayload.iss!;
    if (typeof jwtPayload.aud !== "string") {
      throw new Error("aud was not found or an array of values");
    }
    const aud = jwtPayload.aud!;
    const uidVal = jwtPayload[uidKey];
    return KeylessPublicKey.create({ iss, uidKey, uidVal, aud, pepper });
  }
}

function computeIdCommitment(args: { uidKey: string; uidVal: string; aud: string; pepper: HexInput }): Uint8Array {
  const { uidKey, uidVal, aud, pepper } = args;

  const fields = [
    bytesToBigIntLE(Hex.fromHexInput(pepper).toUint8Array()),
    hashStrToField(aud, MAX_AUD_VAL_BYTES),
    hashStrToField(uidVal, MAX_UID_VAL_BYTES),
    hashStrToField(uidKey, MAX_UID_KEY_BYTES),
  ];

  return bigIntToBytesLE(poseidonHash(fields), KeylessPublicKey.ID_COMMITMENT_LENGTH);
}

/**
 * A signature of a message signed via Keyless Accounnt that uses proofs or the jwt token to authenticate.
 */
export class KeylessSignature extends Signature {
  /**
   * The inner signature ZeroKnowledgeSigniature or OpenIdSignature
   */
  readonly ephemeralCertificate: EphemeralCertificate;

  /**
   * The jwt header in the token used to create the proof/signature.  In json string representation.
   */
  readonly jwtHeader: string;

  /**
   * The expiry timestamp in seconds of the EphemeralKeyPair used to sign
   */
  readonly expiryDateSecs: number;

  /**
   * The ephemeral public key used to verify the signature
   */
  readonly ephemeralPublicKey: EphemeralPublicKey;

  /**
   * The signature resulting from signing with the private key of the EphemeralKeyPair
   */
  readonly ephemeralSignature: EphemeralSignature;

  constructor(args: {
    jwtHeader: string;
    ephemeralCertificate: EphemeralCertificate;
    expiryDateSecs: number;
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
      expiryDateSecs: Number(expiryDateSecs),
      ephemeralCertificate,
      ephemeralPublicKey,
      ephemeralSignature,
    });
  }

  static getSimulationSignature(): KeylessSignature {
    return new KeylessSignature({
      jwtHeader: "{}",
      ephemeralCertificate: new EphemeralCertificate(
        new ZeroKnowledgeSig({
          proof: new ZkProof(
            new Groth16Zkp({ a: new Uint8Array(32), b: new Uint8Array(64), c: new Uint8Array(32) }),
            ZkpVariant.Groth16,
          ),
          expHorizonSecs: 0,
        }),
        EphemeralCertificateVariant.ZkProof,
      ),
      expiryDateSecs: 0,
      ephemeralPublicKey: new EphemeralPublicKey(new Ed25519PublicKey(new Uint8Array(32))),
      ephemeralSignature: new EphemeralSignature(new Ed25519Signature(new Uint8Array(64))),
    });
  }

  static isSignature(signature: Signature): signature is KeylessSignature {
    return signature instanceof KeylessSignature;
  }
}

/**
 * A container for a signature that is a ZeroKnowledgeSig.  Can be expanded to support OpenIdSignature.
 */
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

class G1Bytes extends Serializable {
  data: Uint8Array;

  constructor(data: HexInput) {
    super();
    this.data = Hex.fromHexInput(data).toUint8Array();
    if (this.data.length !== 32) {
      throw new Error("Input needs to be 32 bytes");
    }
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.data);
  }

  static deserialize(deserializer: Deserializer): G1Bytes {
    const bytes = deserializer.deserializeFixedBytes(32);
    return new G1Bytes(bytes);
  }
}

class G2Bytes extends Serializable {
  data: Uint8Array;

  constructor(data: HexInput) {
    super();
    this.data = Hex.fromHexInput(data).toUint8Array();
    if (this.data.length !== 64) {
      throw new Error("Input needs to be 64 bytes");
    }
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.data);
  }

  static deserialize(deserializer: Deserializer): G2Bytes {
    const bytes = deserializer.deserializeFixedBytes(64);
    return new G2Bytes(bytes);
  }
}

/**
 * A representation of a Groth16 proof.  The points are the compressed serialization of affine reprentation of the proof.
 */
export class Groth16Zkp extends Proof {
  /**
   * The bytes of G1 proof point a
   */
  a: G1Bytes;

  /**
   * The bytes of G2 proof point b
   */
  b: G2Bytes;

  /**
   * The bytes of G1 proof point c
   */
  c: G1Bytes;

  constructor(args: { a: HexInput; b: HexInput; c: HexInput }) {
    super();
    const { a, b, c } = args;
    this.a = new G1Bytes(a);
    this.b = new G2Bytes(b);
    this.c = new G1Bytes(c);
  }

  serialize(serializer: Serializer): void {
    this.a.serialize(serializer);
    this.b.serialize(serializer);
    this.c.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): Groth16Zkp {
    const a = G1Bytes.deserialize(deserializer).bcsToBytes();
    const b = G2Bytes.deserialize(deserializer).bcsToBytes();
    const c = G1Bytes.deserialize(deserializer).bcsToBytes();
    return new Groth16Zkp({ a, b, c });
  }
}

/**
 * A container for a different zero knowledge proof types
 */
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

/**
 * The signature representation of a proof
 */
export class ZeroKnowledgeSig extends Signature {
  /**
   * The proof
   */
  readonly proof: ZkProof;

  /**
   * The max lifespan of the proof
   */
  readonly expHorizonSecs: number;

  /**
   * A key value pair on the JWT token that can be specified on the signature which would reveal the value on chain.
   * Can be used to assert identity or other attributes.
   */
  readonly extraField?: string;

  /**
   * The 'aud' value of the recovery service which is set when recovering an account.
   */
  readonly overrideAudVal?: string;

  /**
   * The training wheels signature
   */
  readonly trainingWheelsSignature?: EphemeralSignature;

  constructor(args: {
    proof: ZkProof;
    expHorizonSecs: number;
    extraField?: string;
    overrideAudVal?: string;
    trainingWheelsSignature?: EphemeralSignature;
  }) {
    super();
    const { proof, expHorizonSecs, trainingWheelsSignature, extraField, overrideAudVal } = args;
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
    return this.bcsToBytes();
  }

  /**
   * Return a ZeroKnowledgeSig object from its bcs serialization in bytes.
   *
   * @returns ZeroKnowledgeSig
   */
  static fromBytes(bytes: Uint8Array): ZeroKnowledgeSig {
    return ZeroKnowledgeSig.deserialize(new Deserializer(bytes));
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
    const expHorizonSecs = Number(deserializer.deserializeU64());
    const extraField = deserializer.deserializeOptionStr();
    const overrideAudVal = deserializer.deserializeOptionStr();
    const trainingWheelsSignature = deserializer.deserializeOption(EphemeralSignature);
    return new ZeroKnowledgeSig({ proof, expHorizonSecs, trainingWheelsSignature, extraField, overrideAudVal });
  }
}

/**
 * A class which represents the on-chain configuration for how Keyless accounts work
 */
export class KeylessConfiguration {
  /**
   * The verification key used to verify Groth16 proofs on chain
   */
  readonly verficationKey: Groth16VerificationKey;

  /**
   * The maximum lifespan of an ephemeral key pair.  This is configured on chain.
   */
  readonly maxExpHorizonSecs: number;

  constructor(verficationKey: Groth16VerificationKey, maxExpHorizonSecs: number) {
    this.verficationKey = verficationKey;
    this.maxExpHorizonSecs = maxExpHorizonSecs;
  }

  static create(res: Groth16VerificationKeyResponse, maxExpHorizonSecs: number): KeylessConfiguration {
    return new KeylessConfiguration(
      new Groth16VerificationKey({
        alphaG1: res.alpha_g1,
        betaG2: res.beta_g2,
        deltaG2: res.delta_g2,
        gammaAbcG1: res.gamma_abc_g1,
        gammaG2: res.gamma_g2,
      }),
      maxExpHorizonSecs,
    );
  }
}

/**
 * A representation of the verification key stored on chain used to verify Groth16 proofs
 */
class Groth16VerificationKey {
  // The docstrings below are borrowed from ark-groth16

  /**
   * The `alpha * G`, where `G` is the generator of G1
   */
  readonly alphaG1: G1Bytes;

  /**
   * The `alpha * H`, where `H` is the generator of G2
   */
  readonly betaG2: G2Bytes;

  /**
   * The `delta * H`, where `H` is the generator of G2
   */
  readonly deltaG2: G2Bytes;

  /**
   * The `gamma^{-1} * (beta * a_i + alpha * b_i + c_i) * H`, where H is the generator of G1
   */
  readonly gammaAbcG1: G1Bytes[];

  /**
   * The `gamma * H`, where `H` is the generator of G2
   */
  readonly gammaG2: G2Bytes;

  constructor(args: {
    alphaG1: HexInput;
    betaG2: HexInput;
    deltaG2: HexInput;
    gammaAbcG1: [HexInput, HexInput];
    gammaG2: HexInput;
  }) {
    const { alphaG1, betaG2, deltaG2, gammaAbcG1, gammaG2 } = args;
    this.alphaG1 = new G1Bytes(alphaG1);
    this.betaG2 = new G2Bytes(betaG2);
    this.deltaG2 = new G2Bytes(deltaG2);
    this.gammaAbcG1 = [new G1Bytes(gammaAbcG1[0]), new G1Bytes(gammaAbcG1[1])];
    this.gammaG2 = new G2Bytes(gammaG2);
  }

  static fromGroth16VerificationKeyResponse(res: Groth16VerificationKeyResponse): Groth16VerificationKey {
    return new Groth16VerificationKey({
      alphaG1: res.alpha_g1,
      betaG2: res.beta_g2,
      deltaG2: res.delta_g2,
      gammaAbcG1: res.gamma_abc_g1,
      gammaG2: res.gamma_g2,
    });
  }
}

/**
 * Gets the parameters of how Keyless Accounts are configured on chain including the verifying key and the max expiry horizon
 *
 * @param args.options.ledgerVersion The ledger version to query, if not provided it will get the latest version
 * @returns KeylessConfiguration
 */
export async function getKeylessConfig(args: {
  aptosConfig: AptosConfig;
  options?: LedgerVersionArg;
}): Promise<KeylessConfiguration> {
  const { aptosConfig } = args;
  return memoizeAsync(
    async () => {
      const config = await getKeylessConfigurationResource(args);
      const vk = await getGroth16VerificationKeyResource(args);
      return KeylessConfiguration.create(vk, Number(config.max_exp_horizon_secs));
    },
    `keyless-configuration-${aptosConfig.network}`,
    1000 * 60 * 5, // 5 minutes
  )();
}

/**
 * Gets the KeylessConfiguration set on chain
 *
 * @param args.options.ledgerVersion The ledger version to query, if not provided it will get the latest version
 * @returns KeylessConfigurationResponse
 */
async function getKeylessConfigurationResource(args: {
  aptosConfig: AptosConfig;
  options?: LedgerVersionArg;
}): Promise<KeylessConfigurationResponse> {
  const { aptosConfig, options } = args;
  const resourceType = "0x1::keyless_account::Configuration";
  const { data } = await getAptosFullNode<{}, MoveResource<KeylessConfigurationResponse>>({
    aptosConfig,
    originMethod: "getKeylessConfigurationResource",
    path: `accounts/${AccountAddress.from("0x1").toString()}/resource/${resourceType}`,
    params: { ledger_version: options?.ledgerVersion },
  });

  return data.data;
}

/**
 * Gets the Groth16VerificationKey set on chain
 *
 * @param args.options.ledgerVersion The ledger version to query, if not provided it will get the latest version
 * @returns Groth16VerificationKeyResponse
 */
async function getGroth16VerificationKeyResource(args: {
  aptosConfig: AptosConfig;
  options?: LedgerVersionArg;
}): Promise<Groth16VerificationKeyResponse> {
  const { aptosConfig, options } = args;
  const resourceType = "0x1::keyless_account::Groth16VerificationKey";
  const { data } = await getAptosFullNode<{}, MoveResource<Groth16VerificationKeyResponse>>({
    aptosConfig,
    originMethod: "getGroth16VerificationKeyResource",
    path: `accounts/${AccountAddress.from("0x1").toString()}/resource/${resourceType}`,
    params: { ledger_version: options?.ledgerVersion },
  });

  return data.data;
}
