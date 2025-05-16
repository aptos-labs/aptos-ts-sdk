// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line max-classes-per-file
import { JwtPayload, jwtDecode } from "jwt-decode";
import { sha3_256 } from "@noble/hashes/sha3";
import { AccountPublicKey, PublicKey } from "./publicKey";
import { Signature } from "./signature";
import { Deserializer, Serializable, Serializer } from "../../bcs";
import { Hex, hexToAsciiString } from "../hex";
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
import { bigIntToBytesLE, bytesToBigIntLE, hashStrToField, padAndPackBytesWithLen, poseidonHash } from "./poseidon";
import { AuthenticationKey } from "../authenticationKey";
import { Proof } from "./proof";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519";
import {
  Groth16VerificationKeyResponse,
  KeylessConfigurationResponse,
  MoveAnyStruct,
  PatchedJWKsResponse,
} from "../../types/keyless";
import { AptosConfig } from "../../api/aptosConfig";
import { getAptosFullNode } from "../../client";
import { memoizeAsync } from "../../utils/memoize";
import { AccountAddress, AccountAddressInput } from "../accountAddress";
import { base64UrlToBytes, getErrorMessage, nowInSeconds } from "../../utils";
import { KeylessError, KeylessErrorType } from "../../errors";
import { bn254 } from "@noble/curves/bn254";
import { bytesToNumberBE } from "@noble/curves/abstract/utils";
import { FederatedKeylessPublicKey } from "./federatedKeyless";
import { encode } from "js-base64";
import { generateSigningMessage } from "../..";
import { ProjPointType } from "@noble/curves/abstract/weierstrass";
import { Fp2 } from "@noble/curves/abstract/tower";

/**
 * @group Implementation
 * @category Serialization
 */
export const EPK_HORIZON_SECS = 10000000;
/**
 * @group Implementation
 * @category Serialization
 */
export const MAX_AUD_VAL_BYTES = 120;
/**
 * @group Implementation
 * @category Serialization
 */
export const MAX_UID_KEY_BYTES = 30;
/**
 * @group Implementation
 * @category Serialization
 */
export const MAX_UID_VAL_BYTES = 330;
/**
 * @group Implementation
 * @category Serialization
 */
export const MAX_ISS_VAL_BYTES = 120;
/**
 * @group Implementation
 * @category Serialization
 */
export const MAX_EXTRA_FIELD_BYTES = 350;
/**
 * @group Implementation
 * @category Serialization
 */
export const MAX_JWT_HEADER_B64_BYTES = 300;
/**
 * @group Implementation
 * @category Serialization
 */
export const MAX_COMMITED_EPK_BYTES = 93;

/**
 * Represents a Keyless Public Key used for authentication.
 *
 * This class encapsulates the public key functionality for keyless authentication,
 * including methods for generating and verifying signatures, as well as serialization
 * and deserialization of the key. The KeylessPublicKey is represented in the SDK
 * as `AnyPublicKey`.
 * @group Implementation
 * @category Serialization
 */
export class KeylessPublicKey extends AccountPublicKey {
  /**
   * The number of bytes that `idCommitment` should be
   * @group Implementation
   * @category Serialization
   */
  static readonly ID_COMMITMENT_LENGTH: number = 32;

  /**
   * The value of the 'iss' claim on the JWT which identifies the OIDC provider.
   * @group Implementation
   * @category Serialization
   */
  readonly iss: string;

  /**
   * A value representing a cryptographic commitment to a user identity.
   *
   * It is calculated from the aud, uidKey, uidVal, pepper.
   * @group Implementation
   * @category Serialization
   */
  readonly idCommitment: Uint8Array;

  /**
   * Constructs an instance with the specified parameters for cryptographic operations.
   *
   * @param args - The parameters required to initialize the instance.
   * @param args.alphaG1 - The hex representation of the alpha G1 value.
   * @param args.betaG2 - The hex representation of the beta G2 value.
   * @param args.deltaG2 - The hex representation of the delta G2 value.
   * @param args.gammaAbcG1 - An array containing two hex representations for gamma ABC G1 values.
   * @param args.gammaG2 - The hex representation of the gamma G2 value.
   * @group Implementation
   * @category Serialization
   */
  // TODO: Fix the JSDoc for the below values
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
   * Get the authentication key for the keyless public key.
   *
   * @returns AuthenticationKey - The authentication key derived from the keyless public key.
   * @group Implementation
   * @category Serialization
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
   * Verifies the validity of a signature for a given message.
   *
   * @param args - The arguments for signature verification.
   * @param args.message - The message that was signed.
   * @param args.signature - The signature to verify against the message.
   * @param args.jwk - The JWK to use for verification.
   * @param args.keylessConfig - The keyless configuration to use for verification.
   * @returns true if the signature is valid; otherwise, false.
   * @group Implementation
   * @category Serialization
   */
  verifySignature(args: {
    message: HexInput;
    signature: Signature;
    jwk: MoveJWK;
    keylessConfig: KeylessConfiguration;
  }): boolean {
    try {
      verifyKeylessSignatureWithJwkAndConfig({ ...args, publicKey: this });
      return true;
    } catch (error) {
      if (error instanceof KeylessError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Verifies a keyless signature for a given message.  It will fetch the keyless configuration and the JWK to
   * use for verification from the appropriate network as defined by the aptosConfig.
   *
   * @param args.aptosConfig The aptos config to use for fetching the keyless configuration.
   * @param args.message The message to verify the signature against.
   * @param args.signature The signature to verify.
   * @param args.options.throwErrorWithReason Whether to throw an error with the reason for the failure instead of returning false.
   * @returns true if the signature is valid
   */
  async verifySignatureAsync(args: {
    aptosConfig: AptosConfig;
    message: HexInput;
    signature: Signature;
    options?: { throwErrorWithReason?: boolean };
  }): Promise<boolean> {
    return verifyKeylessSignature({
      ...args,
      publicKey: this,
    });
  }

  /**
   * Serializes the current instance into a format suitable for transmission or storage.
   * This function ensures that all relevant fields are properly serialized, including the proof and optional fields.
   *
   * @param serializer - The serializer instance used to perform the serialization.
   * @param serializer.proof - The proof to be serialized.
   * @param serializer.expHorizonSecs - The expiration horizon in seconds.
   * @param serializer.extraField - An optional additional field for serialization.
   * @param serializer.overrideAudVal - An optional override value for auditing.
   * @param serializer.trainingWheelsSignature - An optional signature for training wheels.
   * @group Implementation
   * @category Serialization
   */
  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.iss);
    serializer.serializeBytes(this.idCommitment);
  }

  /**
   * Deserializes a ZeroKnowledgeSig object from the provided deserializer.
   * This function allows you to reconstruct a ZeroKnowledgeSig instance from its serialized form.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   * @returns A new instance of ZeroKnowledgeSig.
   * @group Implementation
   * @category Serialization
   */
  static deserialize(deserializer: Deserializer): KeylessPublicKey {
    const iss = deserializer.deserializeStr();
    const addressSeed = deserializer.deserializeBytes();
    return new KeylessPublicKey(iss, addressSeed);
  }

  /**
   * Loads a KeylessPublicKey instance from the provided deserializer.
   * This function is used to deserialize the necessary components to create a KeylessPublicKey.
   *
   * @param deserializer - The deserializer used to extract the string and byte data.
   * @param deserializer.deserializeStr - A method to deserialize a string value.
   * @param deserializer.deserializeBytes - A method to deserialize byte data.
   * @returns A new instance of KeylessPublicKey.
   * @group Implementation
   * @category Serialization
   */
  static load(deserializer: Deserializer): KeylessPublicKey {
    const iss = deserializer.deserializeStr();
    const addressSeed = deserializer.deserializeBytes();
    return new KeylessPublicKey(iss, addressSeed);
  }

  /**
   * Determines if the provided public key is an instance of KeylessPublicKey.
   *
   * @param publicKey - The public key to check.
   * @returns A boolean indicating whether the public key is a KeylessPublicKey instance.
   * @group Implementation
   * @category Serialization
   */
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
   * @group Implementation
   * @category Serialization
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

  /**
   * Creates a KeylessPublicKey instance from a JWT and a pepper value.
   * This function is useful for generating a public key that can be used for authentication based on the provided JWT claims and pepper.
   *
   * @param args - The arguments for creating the KeylessPublicKey.
   * @param args.jwt - The JSON Web Token to decode.
   * @param args.pepper - The pepper value used in the key creation process.
   * @param args.uidKey - An optional key to retrieve the unique identifier from the JWT payload, defaults to "sub".
   * @returns A KeylessPublicKey instance created from the provided JWT and pepper.
   * @group Implementation
   * @category Serialization
   */
  static fromJwtAndPepper(args: { jwt: string; pepper: HexInput; uidKey?: string }): KeylessPublicKey {
    const { jwt, pepper, uidKey = "sub" } = args;
    const jwtPayload = jwtDecode<JwtPayload & { [key: string]: string }>(jwt);
    if (typeof jwtPayload.iss !== "string") {
      throw new Error("iss was not found");
    }
    if (typeof jwtPayload.aud !== "string") {
      throw new Error("aud was not found or an array of values");
    }
    const uidVal = jwtPayload[uidKey];
    return KeylessPublicKey.create({ iss: jwtPayload.iss, uidKey, uidVal, aud: jwtPayload.aud, pepper });
  }

  /**
   * Checks if the provided public key is a valid instance by verifying its structure and types.
   *
   * @param publicKey - The public key to validate.
   * @returns A boolean indicating whether the public key is a valid instance.
   * @group Implementation
   * @category Serialization
   */
  static isInstance(publicKey: PublicKey) {
    return (
      "iss" in publicKey &&
      typeof publicKey.iss === "string" &&
      "idCommitment" in publicKey &&
      publicKey.idCommitment instanceof Uint8Array
    );
  }
}

export async function verifyKeylessSignature(args: {
  publicKey: KeylessPublicKey | FederatedKeylessPublicKey;
  aptosConfig: AptosConfig;
  message: HexInput;
  signature: Signature;
  keylessConfig?: KeylessConfiguration;
  jwk?: MoveJWK;
  options?: { throwErrorWithReason?: boolean };
}): Promise<boolean> {
  const {
    aptosConfig,
    publicKey,
    message,
    signature,
    jwk,
    keylessConfig = await getKeylessConfig({ aptosConfig }),
    options,
  } = args;
  try {
    if (!(signature instanceof KeylessSignature)) {
      throw KeylessError.fromErrorType({
        type: KeylessErrorType.SIGNATURE_TYPE_INVALID,
        details: "Not a keyless signature",
      });
    }
    verifyKeylessSignatureWithJwkAndConfig({
      message,
      publicKey,
      signature,
      jwk: jwk ? jwk : await fetchJWK({ aptosConfig, publicKey, kid: signature.getJwkKid() }),
      keylessConfig,
    });
    return true;
  } catch (error) {
    if (options?.throwErrorWithReason) {
      throw error;
    }
    return false;
  }
}

/**
 * Syncronously verifies a keyless signature for a given message.  You need to provide the keyless configuration and the
 * JWK to use for verification.
 *
 * @param args.message The message to verify the signature against.
 * @param args.signature The signature to verify.
 * @param args.keylessConfig The keyless configuration.
 * @param args.jwk The JWK to use for verification.
 * @returns true if the signature is valid
 * @throws KeylessError if the signature is invalid
 */
export function verifyKeylessSignatureWithJwkAndConfig(args: {
  publicKey: KeylessPublicKey | FederatedKeylessPublicKey;
  message: HexInput;
  signature: Signature;
  keylessConfig: KeylessConfiguration;
  jwk: MoveJWK;
}): void {
  const { publicKey, message, signature, keylessConfig, jwk } = args;
  const { verificationKey, maxExpHorizonSecs, trainingWheelsPubkey } = keylessConfig;
  if (!(signature instanceof KeylessSignature)) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.SIGNATURE_TYPE_INVALID,
      details: "Not a keyless signature",
    });
  }
  if (!(signature.ephemeralCertificate.signature instanceof ZeroKnowledgeSig)) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.SIGNATURE_TYPE_INVALID,
      details: "Unsupported ephemeral certificate variant",
    });
  }
  const zkSig = signature.ephemeralCertificate.signature;
  if (!(zkSig.proof.proof instanceof Groth16Zkp)) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.SIGNATURE_TYPE_INVALID,
      details: "Unsupported proof variant for ZeroKnowledgeSig",
    });
  }
  const groth16Proof = zkSig.proof.proof;
  if (signature.expiryDateSecs < nowInSeconds()) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.SIGNATURE_EXPIRED,
      details: "The expiryDateSecs is in the past",
    });
  }
  if (zkSig.expHorizonSecs > maxExpHorizonSecs) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.MAX_EXPIRY_HORIZON_EXCEEDED,
    });
  }
  if (!signature.ephemeralPublicKey.verifySignature({ message, signature: signature.ephemeralSignature })) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.EPHEMERAL_SIGNATURE_VERIFICATION_FAILED,
    });
  }
  const publicInputsHash = getPublicInputsHash({ publicKey, signature, jwk, keylessConfig });
  if (!verificationKey.verifyProof({ publicInputsHash, groth16Proof })) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.PROOF_VERIFICATION_FAILED,
    });
  }
  if (trainingWheelsPubkey) {
    if (!zkSig.trainingWheelsSignature) {
      throw KeylessError.fromErrorType({
        type: KeylessErrorType.TRAINING_WHEELS_SIGNATURE_MISSING,
      });
    }
    const proofAndStatement = new Groth16ProofAndStatement(groth16Proof, publicInputsHash);
    if (
      !trainingWheelsPubkey.verifySignature({
        message: proofAndStatement.hash(),
        signature: zkSig.trainingWheelsSignature,
      })
    ) {
      throw KeylessError.fromErrorType({
        type: KeylessErrorType.TRAINING_WHEELS_SIGNATURE_VERIFICATION_FAILED,
      });
    }
  }
}

/**
 * Get the public inputs hash for the keyless signature.
 *
 * @param args.signature The signature
 * @param args.jwk The JWK to use for the public inputs hash
 * @param args.keylessConfig The keyless configuration which defines the byte lengths to use when hashing fields.
 * @returns The public inputs hash
 */
function getPublicInputsHash(args: {
  publicKey: KeylessPublicKey | FederatedKeylessPublicKey;
  signature: KeylessSignature;
  jwk: MoveJWK;
  keylessConfig: KeylessConfiguration;
}): bigint {
  const { publicKey, signature, jwk, keylessConfig } = args;
  const innerKeylessPublicKey = publicKey instanceof KeylessPublicKey ? publicKey : publicKey.keylessPublicKey;
  if (!(signature.ephemeralCertificate.signature instanceof ZeroKnowledgeSig)) {
    throw new Error("Signature is not a ZeroKnowledgeSig");
  }
  const proof = signature.ephemeralCertificate.signature;
  const fields = [];
  fields.push(
    ...padAndPackBytesWithLen(signature.ephemeralPublicKey.toUint8Array(), keylessConfig.maxCommitedEpkBytes),
  );
  fields.push(bytesToBigIntLE(innerKeylessPublicKey.idCommitment));
  fields.push(signature.expiryDateSecs);
  fields.push(proof.expHorizonSecs);
  fields.push(hashStrToField(innerKeylessPublicKey.iss, keylessConfig.maxIssValBytes));
  if (!proof.extraField) {
    fields.push(0n);
    fields.push(hashStrToField(" ", keylessConfig.maxExtraFieldBytes));
  } else {
    fields.push(1n);
    fields.push(hashStrToField(proof.extraField, keylessConfig.maxExtraFieldBytes));
  }
  fields.push(hashStrToField(encode(signature.jwtHeader, true) + ".", keylessConfig.maxJwtHeaderB64Bytes));
  fields.push(jwk.toScalar());
  if (!proof.overrideAudVal) {
    fields.push(hashStrToField("", MAX_AUD_VAL_BYTES));
    fields.push(0n);
  } else {
    fields.push(hashStrToField(proof.overrideAudVal, MAX_AUD_VAL_BYTES));
    fields.push(1n);
  }
  return poseidonHash(fields);
}

/**
 * Fetches the JWK from the issuer's well-known JWKS endpoint.
 *
 * @param args.publicKey The keyless public key which contains the issuer the address to fetch the JWK from (0x1 if not federated).
 * @param args.kid The kid of the JWK to fetch
 * @returns A JWK matching the `kid` in the JWT header.
 * @throws {KeylessError} If the JWK cannot be fetched
 */
export async function fetchJWK(args: {
  aptosConfig: AptosConfig;
  publicKey: KeylessPublicKey | FederatedKeylessPublicKey;
  kid: string;
}): Promise<MoveJWK> {
  const { aptosConfig, publicKey, kid } = args;
  const keylessPubKey = publicKey instanceof KeylessPublicKey ? publicKey : publicKey.keylessPublicKey;
  const { iss } = keylessPubKey;

  let allJWKs: Map<string, MoveJWK[]>;
  const jwkAddr = publicKey instanceof FederatedKeylessPublicKey ? publicKey.jwkAddress : undefined;
  try {
    allJWKs = await getKeylessJWKs({ aptosConfig, jwkAddr });
  } catch (error) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.FULL_NODE_JWKS_LOOKUP_ERROR,
      error,
      details: `Failed to fetch ${jwkAddr ? "Federated" : "Patched"}JWKs ${jwkAddr ? `for address ${jwkAddr}` : "0x1"}`,
    });
  }

  // Find the corresponding JWK set by `iss`
  const jwksForIssuer = allJWKs.get(iss);

  if (jwksForIssuer === undefined) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.INVALID_JWT_ISS_NOT_RECOGNIZED,
      details: `JWKs for issuer ${iss} not found.`,
    });
  }

  // Find the corresponding JWK by `kid`
  const jwk = jwksForIssuer.find((key) => key.kid === kid);

  if (jwk === undefined) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.INVALID_JWT_JWK_NOT_FOUND,
      details: `JWK with kid '${kid}' for issuer '${iss}' not found.`,
    });
  }

  return jwk;
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
 * Represents a signature of a message signed via a Keyless Account, utilizing proofs or a JWT token for authentication.
 * @group Implementation
 * @category Serialization
 */
export class KeylessSignature extends Signature {
  /**
   * The inner signature ZeroKnowledgeSignature or OpenIdSignature
   * @group Implementation
   * @category Serialization
   */
  readonly ephemeralCertificate: EphemeralCertificate;

  /**
   * The jwt header in the token used to create the proof/signature.  In json string representation.
   * @group Implementation
   * @category Serialization
   */
  readonly jwtHeader: string;

  /**
   * The expiry timestamp in seconds of the EphemeralKeyPair used to sign
   * @group Implementation
   * @category Serialization
   */
  readonly expiryDateSecs: number;

  /**
   * The ephemeral public key used to verify the signature
   * @group Implementation
   * @category Serialization
   */
  readonly ephemeralPublicKey: EphemeralPublicKey;

  /**
   * The signature resulting from signing with the private key of the EphemeralKeyPair
   * @group Implementation
   * @category Serialization
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
   * Get the kid of the JWT used to derive the Keyless Account used to sign.
   *
   * @returns the kid as a string
   */
  getJwkKid(): string {
    return parseJwtHeader(this.jwtHeader).kid;
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
 * Represents an ephemeral certificate containing a signature, specifically a ZeroKnowledgeSig.
 * This class can be extended to support additional signature types, such as OpenIdSignature.
 *
 * @extends Signature
 * @group Implementation
 * @category Serialization
 */
export class EphemeralCertificate extends Signature {
  public readonly signature: Signature;

  /**
   * Index of the underlying enum variant
   * @group Implementation
   * @category Serialization
   */
  readonly variant: EphemeralCertificateVariant;

  constructor(signature: Signature, variant: EphemeralCertificateVariant) {
    super();
    this.signature = signature;
    this.variant = variant;
  }

  /**
   * Get the public key in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the public key
   * @group Implementation
   * @category Serialization
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

/**
 * Represents a fixed-size byte array of 32 bytes, extending the Serializable class.
 * This class is used for handling and serializing G1 bytes in cryptographic operations.
 *
 * @extends Serializable
 * @group Implementation
 * @category Serialization
 */
class G1Bytes extends Serializable {
  private static readonly B = bn254.fields.Fp.create(3n);

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

  // Convert the projective coordinates to strings
  toArray(): string[] {
    const point = this.toProjectivePoint();
    return [point.x.toString(), point.y.toString(), point.pz.toString()];
  }

  /**
   * Converts the G1 bytes to a projective point.
   * @returns The projective point.
   */
  toProjectivePoint(): ProjPointType<bigint> {
    const bytes = new Uint8Array(this.data);
    // Reverse the bytes to convert from little-endian to big-endian.
    bytes.reverse();
    // This gets the flag bit to determine which y to use.
    const yFlag = (bytes[0] & 0x80) >> 7;
    const { Fp } = bn254.fields;
    const x = Fp.create(bytesToBn254FpBE(bytes));
    const y = Fp.sqrt(Fp.add(Fp.pow(x, 3n), G1Bytes.B));
    const negY = Fp.neg(y);
    const yToUse = y > negY === (yFlag === 1) ? y : negY;
    return bn254.G1.ProjectivePoint.fromAffine({
      x: x,
      y: yToUse,
    });
  }
}

function bytesToBn254FpBE(bytes: Uint8Array): bigint {
  if (bytes.length !== 32) {
    throw new Error("Input should be 32 bytes");
  }
  // Clear the first two bits of the first byte which removes any flags.
  const result = new Uint8Array(bytes);
  result[0] = result[0] & 0x3f; // 0x3F = 00111111 in binary
  return bytesToNumberBE(result);
}

/**
 * Represents a 64-byte G2 element in a cryptographic context.
 * This class provides methods for serialization and deserialization of G2 bytes.
 *
 * @extends Serializable
 * @group Implementation
 * @category Serialization
 */
class G2Bytes extends Serializable {
  /**
   * The constant b value used in G2 point calculations
   */
  private static readonly B = bn254.fields.Fp2.fromBigTuple([
    19485874751759354771024239261021720505790618469301721065564631296452457478373n,
    266929791119991161246907387137283842545076965332900288569378510910307636690n,
  ]);

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

  // Convert the projective coordinates to strings
  toArray(): [string, string][] {
    const point = this.toProjectivePoint();
    return [
      [
        point.x.c0.toString(), // x real part
        point.x.c1.toString(),
      ], // x imaginary part
      [
        point.y.c0.toString(), // y real part
        point.y.c1.toString(),
      ], // y imaginary part
      [
        point.pz.c0.toString(), // z real part
        point.pz.c1.toString(),
      ], // z imaginary part
    ];
  }

  toProjectivePoint(): ProjPointType<Fp2> {
    const bytes = new Uint8Array(this.data);
    // Reverse the bytes to convert from little-endian to big-endian for each part of x.
    const x0 = bytes.slice(0, 32).reverse();
    const x1 = bytes.slice(32, 64).reverse();
    // This gets the flag bit to determine which y to use.
    const yFlag = (x1[0] & 0x80) >> 7;
    const { Fp2 } = bn254.fields;
    const x = Fp2.fromBigTuple([bytesToBn254FpBE(x0), bytesToBn254FpBE(x1)]);
    const y = Fp2.sqrt(Fp2.add(Fp2.pow(x, 3n), G2Bytes.B));
    const negY = Fp2.neg(y);
    const isYGreaterThanNegY = y.c1 > negY.c1 || (y.c1 === negY.c1 && y.c0 > negY.c0);
    const yToUse = isYGreaterThanNegY === (yFlag === 1) ? y : negY;
    return bn254.G2.ProjectivePoint.fromAffine({
      x: x,
      y: yToUse,
    });
  }
}

/**
 * Represents a Groth16 zero-knowledge proof, consisting of three proof points in compressed serialization format.
 * The points are the compressed serialization of affine representation of the proof.
 *
 * @extends Proof
 * @group Implementation
 * @category Serialization
 */
export class Groth16Zkp extends Proof {
  /**
   * The bytes of G1 proof point a
   * @group Implementation
   * @category Serialization
   */
  a: G1Bytes;

  /**
   * The bytes of G2 proof point b
   * @group Implementation
   * @category Serialization
   */
  b: G2Bytes;

  /**
   * The bytes of G1 proof point c
   * @group Implementation
   * @category Serialization
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

  toSnarkJsJson() {
    return {
      protocol: "groth16",
      curve: "bn128",
      pi_a: this.a.toArray(),
      pi_b: this.b.toArray(),
      pi_c: this.c.toArray(),
    };
  }
}

/**
 * Represents a Groth16 proof and statement, consisting of a Groth16 proof and a public inputs hash.
 * This is used to generate the signing message for the training wheels signature.
 *
 * @extends Serializable
 * @group Implementation
 * @category Serialization
 */
export class Groth16ProofAndStatement extends Serializable {
  /**
   * The Groth16 proof
   * @group Implementation
   * @category Serialization
   */
  proof: Groth16Zkp;

  /**
   * The public inputs hash as a 32 byte Uint8Array
   * @group Implementation
   * @category Serialization
   */
  publicInputsHash: Uint8Array;

  /**
   * The domain separator prefix used when hashing.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly domainSeparator = "APTOS::Groth16ProofAndStatement";

  constructor(proof: Groth16Zkp, publicInputsHash: HexInput | bigint) {
    super();
    this.proof = proof;
    this.publicInputsHash =
      typeof publicInputsHash === "bigint"
        ? bigIntToBytesLE(publicInputsHash, 32)
        : Hex.fromHexInput(publicInputsHash).toUint8Array();
    if (this.publicInputsHash.length !== 32) {
      throw new Error("Invalid public inputs hash");
    }
  }

  serialize(serializer: Serializer): void {
    this.proof.serialize(serializer);
    serializer.serializeFixedBytes(this.publicInputsHash);
  }

  static deserialize(deserializer: Deserializer): Groth16ProofAndStatement {
    return new Groth16ProofAndStatement(Groth16Zkp.deserialize(deserializer), deserializer.deserializeFixedBytes(32));
  }

  hash(): Uint8Array {
    return generateSigningMessage(this.bcsToBytes(), this.domainSeparator);
  }
}

/**
 * Represents a container for different types of zero-knowledge proofs.
 *
 * @extends Serializable
 * @group Implementation
 * @category Serialization
 */
export class ZkProof extends Serializable {
  public readonly proof: Proof;

  /**
   * Index of the underlying enum variant
   * @group Implementation
   * @category Serialization
   */
  readonly variant: ZkpVariant;

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
 * Represents a zero-knowledge signature, encapsulating the proof and its associated metadata.
 *
 * @extends Signature
 * @group Implementation
 * @category Serialization
 */
export class ZeroKnowledgeSig extends Signature {
  /**
   * The proof
   * @group Implementation
   * @category Serialization
   */
  readonly proof: ZkProof;

  /**
   * The max lifespan of the proof
   * @group Implementation
   * @category Serialization
   */
  readonly expHorizonSecs: number;

  /**
   * A key value pair on the JWT token that can be specified on the signature which would reveal the value on chain.
   * Can be used to assert identity or other attributes.
   * @group Implementation
   * @category Serialization
   */
  readonly extraField?: string;

  /**
   * The 'aud' value of the recovery service which is set when recovering an account.
   * @group Implementation
   * @category Serialization
   */
  readonly overrideAudVal?: string;

  /**
   * The training wheels signature
   * @group Implementation
   * @category Serialization
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
   * Deserialize a ZeroKnowledgeSig object from its BCS serialization in bytes.
   *
   * @param bytes - The bytes representing the serialized ZeroKnowledgeSig.
   * @returns ZeroKnowledgeSig - The deserialized ZeroKnowledgeSig object.
   * @group Implementation
   * @category Serialization
   */
  static fromBytes(bytes: Uint8Array): ZeroKnowledgeSig {
    return ZeroKnowledgeSig.deserialize(new Deserializer(bytes));
  }

  serialize(serializer: Serializer): void {
    this.proof.serialize(serializer);
    serializer.serializeU64(this.expHorizonSecs);
    serializer.serializeOption(this.extraField);
    serializer.serializeOption(this.overrideAudVal);
    serializer.serializeOption(this.trainingWheelsSignature);
  }

  static deserialize(deserializer: Deserializer): ZeroKnowledgeSig {
    const proof = ZkProof.deserialize(deserializer);
    const expHorizonSecs = Number(deserializer.deserializeU64());
    const extraField = deserializer.deserializeOption("string");
    const overrideAudVal = deserializer.deserializeOption("string");
    const trainingWheelsSignature = deserializer.deserializeOption(EphemeralSignature);
    return new ZeroKnowledgeSig({ proof, expHorizonSecs, trainingWheelsSignature, extraField, overrideAudVal });
  }
}

/**
 * Represents the on-chain configuration for how Keyless accounts operate.
 *
 * @remarks
 * This class encapsulates the verification key and the maximum lifespan of ephemeral key pairs,
 * which are essential for the functionality of Keyless accounts.
 * @group Implementation
 * @category Serialization
 */
export class KeylessConfiguration {
  /**
   * The verification key used to verify Groth16 proofs on chain
   * @group Implementation
   * @category Serialization
   */
  readonly verificationKey: Groth16VerificationKey;

  /**
   * The maximum lifespan of an ephemeral key pair.  This is configured on chain.
   * @group Implementation
   * @category Serialization
   */
  readonly maxExpHorizonSecs: number;

  /**
   * The public key of the training wheels account.
   * @group Implementation
   * @category Serialization
   */
  readonly trainingWheelsPubkey?: EphemeralPublicKey;

  /**
   * The maximum number of bytes that can be used for the extra field.
   * @group Implementation
   * @category Serialization
   */
  readonly maxExtraFieldBytes: number;

  /**
   * The maximum number of bytes that can be used for the JWT header.
   * @group Implementation
   * @category Serialization
   */
  readonly maxJwtHeaderB64Bytes: number;

  /**
   * The maximum number of bytes that can be used for the issuer value.
   * @group Implementation
   * @category Serialization
   */
  readonly maxIssValBytes: number;

  /**
   * The maximum number of bytes that can be used for the committed ephemeral public key.
   * @group Implementation
   * @category Serialization
   */
  readonly maxCommitedEpkBytes: number;

  constructor(args: {
    verificationKey: Groth16VerificationKey;
    trainingWheelsPubkey?: HexInput;
    maxExpHorizonSecs?: number;
    maxExtraFieldBytes?: number;
    maxJwtHeaderB64Bytes?: number;
    maxIssValBytes?: number;
    maxCommitedEpkBytes?: number;
  }) {
    const {
      verificationKey,
      trainingWheelsPubkey,
      maxExpHorizonSecs = EPK_HORIZON_SECS,
      maxExtraFieldBytes = MAX_EXTRA_FIELD_BYTES,
      maxJwtHeaderB64Bytes = MAX_JWT_HEADER_B64_BYTES,
      maxIssValBytes = MAX_ISS_VAL_BYTES,
      maxCommitedEpkBytes = MAX_COMMITED_EPK_BYTES,
    } = args;

    this.verificationKey = verificationKey;
    this.maxExpHorizonSecs = maxExpHorizonSecs;
    if (trainingWheelsPubkey) {
      this.trainingWheelsPubkey = new EphemeralPublicKey(new Ed25519PublicKey(trainingWheelsPubkey));
    }
    this.maxExtraFieldBytes = maxExtraFieldBytes;
    this.maxJwtHeaderB64Bytes = maxJwtHeaderB64Bytes;
    this.maxIssValBytes = maxIssValBytes;
    this.maxCommitedEpkBytes = maxCommitedEpkBytes;
  }

  /**
   * Creates a new KeylessConfiguration instance from a Groth16VerificationKeyResponse and a KeylessConfigurationResponse.
   * @param res - The Groth16VerificationKeyResponse object containing the verification key data.
   * @param config - The KeylessConfigurationResponse object containing the configuration data.
   * @returns A new KeylessConfiguration instance.
   */
  static create(res: Groth16VerificationKeyResponse, config: KeylessConfigurationResponse): KeylessConfiguration {
    return new KeylessConfiguration({
      verificationKey: new Groth16VerificationKey({
        alphaG1: res.alpha_g1,
        betaG2: res.beta_g2,
        deltaG2: res.delta_g2,
        gammaAbcG1: res.gamma_abc_g1,
        gammaG2: res.gamma_g2,
      }),
      maxExpHorizonSecs: Number(config.max_exp_horizon_secs),
      trainingWheelsPubkey: config.training_wheels_pubkey.vec[0],
      maxExtraFieldBytes: config.max_extra_field_bytes,
      maxJwtHeaderB64Bytes: config.max_jwt_header_b64_bytes,
      maxIssValBytes: config.max_iss_val_bytes,
      maxCommitedEpkBytes: config.max_commited_epk_bytes,
    });
  }
}

/**
 * Represents the verification key stored on-chain used to verify Groth16 proofs.
 * @group Implementation
 * @category Serialization
 */
export class Groth16VerificationKey {
  // The docstrings below are borrowed from ark-groth16

  /**
   * The `alpha * G`, where `G` is the generator of G1
   * @group Implementation
   * @category Serialization
   */
  readonly alphaG1: G1Bytes;

  /**
   * The `alpha * H`, where `H` is the generator of G2
   * @group Implementation
   * @category Serialization
   */
  readonly betaG2: G2Bytes;

  /**
   * The `delta * H`, where `H` is the generator of G2
   * @group Implementation
   * @category Serialization
   */
  readonly deltaG2: G2Bytes;

  /**
   * The `gamma^{-1} * (beta * a_i + alpha * b_i + c_i) * H`, where H is the generator of G1
   * @group Implementation
   * @category Serialization
   */
  readonly gammaAbcG1: [G1Bytes, G1Bytes];

  /**
   * The `gamma * H`, where `H` is the generator of G2
   * @group Implementation
   * @category Serialization
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

  /**
   * Calculates the hash of the serialized form of the verification key.
   * This is useful for comparing verification keys or using them as unique identifiers.
   *
   * @returns The SHA3-256 hash of the serialized verification key as a Uint8Array
   */
  public hash(): Uint8Array {
    const serializer = new Serializer();
    this.serialize(serializer);
    return sha3_256.create().update(serializer.toUint8Array()).digest();
  }

  serialize(serializer: Serializer): void {
    this.alphaG1.serialize(serializer);
    this.betaG2.serialize(serializer);
    this.deltaG2.serialize(serializer);
    this.gammaAbcG1[0].serialize(serializer);
    this.gammaAbcG1[1].serialize(serializer);
    this.gammaG2.serialize(serializer);
  }

  /**
   * Converts a Groth16VerificationKeyResponse object into a Groth16VerificationKey instance.
   *
   * @param res - The Groth16VerificationKeyResponse object containing the verification key data.
   * @param res.alpha_g1 - The alpha G1 value from the response.
   * @param res.beta_g2 - The beta G2 value from the response.
   * @param res.delta_g2 - The delta G2 value from the response.
   * @param res.gamma_abc_g1 - The gamma ABC G1 value from the response.
   * @param res.gamma_g2 - The gamma G2 value from the response.
   * @returns A Groth16VerificationKey instance constructed from the provided response data.
   * @group Implementation
   * @category Serialization
   */
  static fromGroth16VerificationKeyResponse(res: Groth16VerificationKeyResponse): Groth16VerificationKey {
    return new Groth16VerificationKey({
      alphaG1: res.alpha_g1,
      betaG2: res.beta_g2,
      deltaG2: res.delta_g2,
      gammaAbcG1: res.gamma_abc_g1,
      gammaG2: res.gamma_g2,
    });
  }

  /**
   * Verifies a Groth16 proof using the verification key given the public inputs hash and the proof.
   *
   * @param args.publicInputsHash The public inputs hash
   * @param args.groth16Proof The Groth16 proof
   * @returns true if the proof is valid
   */
  verifyProof(args: { publicInputsHash: bigint; groth16Proof: Groth16Zkp }): boolean {
    const { publicInputsHash, groth16Proof } = args;

    try {
      // Get proof points
      const proofA = groth16Proof.a.toProjectivePoint();
      const proofB = groth16Proof.b.toProjectivePoint();
      const proofC = groth16Proof.c.toProjectivePoint();

      // Get verification key points
      const vkAlpha1 = this.alphaG1.toProjectivePoint();
      const vkBeta2 = this.betaG2.toProjectivePoint();
      const vkGamma2 = this.gammaG2.toProjectivePoint();
      const vkDelta2 = this.deltaG2.toProjectivePoint();
      const vkIC = this.gammaAbcG1.map((g1) => g1.toProjectivePoint());

      const { Fp12 } = bn254.fields;

      // Check that the following pairing equation holds:
      // e(A_1, B_2) = e(\alpha_1, \beta_2) + e(\ic_0 + public_inputs_hash \ic_1, \gamma_2) + e(C_1, \delta_2)
      // Where A_1, B_2, C_1 are the proof points and \alpha_1, \beta_2, \gamma_2, \delta_2, \ic_0, \ic_1
      // are the verification key points

      // \ic_0 + public_inputs_hash \ic_1
      let accum = vkIC[0].add(vkIC[1].multiply(publicInputsHash));
      // e(\ic_0 + public_inputs_hash \ic_1, \gamma_2)
      const pairingAccumGamma = bn254.pairing(accum, vkGamma2);
      // e(A_1, B_2)
      const pairingAB = bn254.pairing(proofA, proofB);
      // e(\alpha_1, \beta_2)
      const pairingAlphaBeta = bn254.pairing(vkAlpha1, vkBeta2);
      // e(C_1, \delta_2)
      const pairingCDelta = bn254.pairing(proofC, vkDelta2);
      // Get the result of the right hand side of the pairing equation
      const product = Fp12.mul(pairingAlphaBeta, Fp12.mul(pairingAccumGamma, pairingCDelta));
      // Check if the left hand side equals the right hand side
      return Fp12.eql(pairingAB, product);
    } catch (error) {
      throw KeylessError.fromErrorType({
        type: KeylessErrorType.PROOF_VERIFICATION_FAILED,
        error,
        details: "Error encountered when checking zero knowledge relation",
      });
    }
  }

  /**
   * Converts the verification key to a JSON format compatible with snarkjs groth16.verify
   *
   * @returns An object containing the verification key in snarkjs format
   * @group Implementation
   * @category Serialization
   */
  toSnarkJsJson() {
    return {
      protocol: "groth16",
      curve: "bn128",
      nPublic: 1,
      vk_alpha_1: this.alphaG1.toArray(),
      vk_beta_2: this.betaG2.toArray(),
      vk_gamma_2: this.gammaG2.toArray(),
      vk_delta_2: this.deltaG2.toArray(),
      IC: this.gammaAbcG1.map((g1) => g1.toArray()),
    };
  }
}

/**
 * Retrieves the configuration parameters for Keyless Accounts on the blockchain, including the verifying key and the maximum
 * expiry horizon.
 *
 * @param args - The arguments for retrieving the keyless configuration.
 * @param args.aptosConfig - The Aptos configuration object containing network details.
 * @param args.options - Optional parameters for the request.
 * @param args.options.ledgerVersion - The ledger version to query; if not provided, the latest version will be used.
 * @returns KeylessConfiguration - The configuration object containing the verifying key and maximum expiry horizon.
 * @group Implementation
 * @category Serialization
 */
export async function getKeylessConfig(args: {
  aptosConfig: AptosConfig;
  options?: LedgerVersionArg;
}): Promise<KeylessConfiguration> {
  const { aptosConfig } = args;
  try {
    return await memoizeAsync(
      async () => {
        const [config, vk] = await Promise.all([
          getKeylessConfigurationResource(args),
          getGroth16VerificationKeyResource(args),
        ]);
        return KeylessConfiguration.create(vk, config);
      },
      `keyless-configuration-${aptosConfig.network}`,
      1000 * 60 * 5, // 5 minutes
    )();
  } catch (error) {
    if (error instanceof KeylessError) {
      throw error;
    }
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.FULL_NODE_OTHER,
      error,
    });
  }
}

/**
 * Parses a JWT and returns the 'iss', 'aud', and 'uid' values.
 *
 * @param args - The arguments for parsing the JWT.
 * @param args.jwt - The JWT to parse.
 * @param args.uidKey - The key to use for the 'uid' value; defaults to 'sub'.
 * @returns The 'iss', 'aud', and 'uid' values from the JWT.
 */
export function getIssAudAndUidVal(args: { jwt: string; uidKey?: string }): {
  iss: string;
  aud: string;
  uidVal: string;
} {
  const { jwt, uidKey = "sub" } = args;
  let jwtPayload: JwtPayload & { [key: string]: string };
  try {
    jwtPayload = jwtDecode<JwtPayload & { [key: string]: string }>(jwt);
  } catch (error) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.JWT_PARSING_ERROR,
      details: `Failed to parse JWT - ${getErrorMessage(error)}`,
    });
  }
  if (typeof jwtPayload.iss !== "string") {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.JWT_PARSING_ERROR,
      details: "JWT is missing 'iss' in the payload. This should never happen.",
    });
  }
  if (typeof jwtPayload.aud !== "string") {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.JWT_PARSING_ERROR,
      details: "JWT is missing 'aud' in the payload or 'aud' is an array of values.",
    });
  }
  const uidVal = jwtPayload[uidKey];
  return { iss: jwtPayload.iss, aud: jwtPayload.aud, uidVal };
}

/**
 * Retrieves the KeylessConfiguration set on chain.
 *
 * @param args - The arguments for retrieving the configuration.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.options - Optional parameters for the request.
 * @param args.options.ledgerVersion - The ledger version to query; if not provided, it will get the latest version.
 * @returns KeylessConfigurationResponse - The response containing the keyless configuration data.
 * @group Implementation
 * @category Serialization
 */
async function getKeylessConfigurationResource(args: {
  aptosConfig: AptosConfig;
  options?: LedgerVersionArg;
}): Promise<KeylessConfigurationResponse> {
  const { aptosConfig, options } = args;
  const resourceType = "0x1::keyless_account::Configuration";
  try {
    const { data } = await getAptosFullNode<{}, MoveResource<KeylessConfigurationResponse>>({
      aptosConfig,
      originMethod: "getKeylessConfigurationResource",
      path: `accounts/${AccountAddress.from("0x1").toString()}/resource/${resourceType}`,
      params: { ledger_version: options?.ledgerVersion },
    });
    return data.data;
  } catch (error) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.FULL_NODE_CONFIG_LOOKUP_ERROR,
      error,
    });
  }
}

/**
 * Retrieves the Groth16VerificationKey set on the blockchain.
 *
 * @param args - The arguments for retrieving the verification key.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.options - Optional parameters for the request.
 * @param args.options.ledgerVersion - The ledger version to query; if not provided, it will get the latest version.
 * @returns Groth16VerificationKeyResponse - The response containing the Groth16 verification key data.
 * @group Implementation
 * @category Serialization
 */
async function getGroth16VerificationKeyResource(args: {
  aptosConfig: AptosConfig;
  options?: LedgerVersionArg;
}): Promise<Groth16VerificationKeyResponse> {
  const { aptosConfig, options } = args;
  const resourceType = "0x1::keyless_account::Groth16VerificationKey";
  try {
    const { data } = await getAptosFullNode<{}, MoveResource<Groth16VerificationKeyResponse>>({
      aptosConfig,
      originMethod: "getGroth16VerificationKeyResource",
      path: `accounts/${AccountAddress.from("0x1").toString()}/resource/${resourceType}`,
      params: { ledger_version: options?.ledgerVersion },
    });
    return data.data;
  } catch (error) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.FULL_NODE_VERIFICATION_KEY_LOOKUP_ERROR,
      error,
    });
  }
}

export async function getKeylessJWKs(args: {
  aptosConfig: AptosConfig;
  jwkAddr?: AccountAddressInput;
  options?: LedgerVersionArg;
}): Promise<Map<string, MoveJWK[]>> {
  const { aptosConfig, jwkAddr, options } = args;
  let resource: MoveResource<PatchedJWKsResponse>;
  if (!jwkAddr) {
    const resourceType = "0x1::jwks::PatchedJWKs";
    const { data } = await getAptosFullNode<{}, MoveResource<PatchedJWKsResponse>>({
      aptosConfig,
      originMethod: "getKeylessJWKs",
      path: `accounts/0x1/resource/${resourceType}`,
      params: { ledger_version: options?.ledgerVersion },
    });
    resource = data;
  } else {
    const resourceType = "0x1::jwks::FederatedJWKs";
    const { data } = await getAptosFullNode<{}, MoveResource<PatchedJWKsResponse>>({
      aptosConfig,
      originMethod: "getKeylessJWKs",
      path: `accounts/${AccountAddress.from(jwkAddr).toString()}/resource/${resourceType}`,
      params: { ledger_version: options?.ledgerVersion },
    });
    resource = data;
  }

  // Create a map of issuer to JWK arrays
  const jwkMap = new Map<string, MoveJWK[]>();
  for (const entry of resource.data.jwks.entries) {
    const jwks: MoveJWK[] = [];
    for (const jwkStruct of entry.jwks) {
      const { data: jwkData } = jwkStruct.variant;
      const deserializer = new Deserializer(Hex.fromHexInput(jwkData).toUint8Array());
      const jwk = MoveJWK.deserialize(deserializer);
      jwks.push(jwk);
    }
    jwkMap.set(hexToAsciiString(entry.issuer), jwks);
  }

  return jwkMap;
}

export class MoveJWK extends Serializable {
  public kid: string;

  public kty: string;

  public alg: string;

  public e: string;

  public n: string;

  constructor(args: { kid: string; kty: string; alg: string; e: string; n: string }) {
    super();
    const { kid, kty, alg, e, n } = args;
    this.kid = kid;
    this.kty = kty;
    this.alg = alg;
    this.e = e;
    this.n = n;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.kid);
    serializer.serializeStr(this.kty);
    serializer.serializeStr(this.alg);
    serializer.serializeStr(this.e);
    serializer.serializeStr(this.n);
  }

  static fromMoveStruct(struct: MoveAnyStruct): MoveJWK {
    const { data } = struct.variant;
    const deserializer = new Deserializer(Hex.fromHexInput(data).toUint8Array());
    return MoveJWK.deserialize(deserializer);
  }

  toScalar(): bigint {
    if (this.alg !== "RS256") {
      throw KeylessError.fromErrorType({
        type: KeylessErrorType.PROOF_VERIFICATION_FAILED,
        details:
          "Failed to convert JWK to scalar when calculating the public inputs hash. Only RSA 256 is supported currently",
      });
    }
    const uint8Array = base64UrlToBytes(this.n);
    const chunks = chunkInto24Bytes(uint8Array.reverse());
    const scalars = chunks.map((chunk) => bytesToBigIntLE(chunk));
    scalars.push(256n); // Add the modulus size
    return poseidonHash(scalars);
  }

  static deserialize(deserializer: Deserializer): MoveJWK {
    const kid = deserializer.deserializeStr();
    const kty = deserializer.deserializeStr();
    const alg = deserializer.deserializeStr();
    const e = deserializer.deserializeStr();
    const n = deserializer.deserializeStr();
    return new MoveJWK({ kid, kty, alg, n, e });
  }
}

function chunkInto24Bytes(data: Uint8Array): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < data.length; i += 24) {
    const chunk = data.slice(i, Math.min(i + 24, data.length));
    // Pad last chunk with zeros if needed
    if (chunk.length < 24) {
      const paddedChunk = new Uint8Array(24);
      paddedChunk.set(chunk);
      chunks.push(paddedChunk);
    } else {
      chunks.push(chunk);
    }
  }
  return chunks;
}

interface JwtHeader {
  kid: string; // Key ID
}
/**
 * Safely parses the JWT header.
 * @param jwtHeader The JWT header string
 * @returns Parsed JWT header as an object.
 */
export function parseJwtHeader(jwtHeader: string): JwtHeader {
  try {
    const header = JSON.parse(jwtHeader);
    if (header.kid === undefined) {
      throw new Error("JWT header missing kid");
    }
    return header;
  } catch (error) {
    throw new Error("Failed to parse JWT header.");
  }
}
