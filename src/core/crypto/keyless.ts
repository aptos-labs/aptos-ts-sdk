// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line max-classes-per-file
import { JwtPayload, jwtDecode } from "jwt-decode";
import { Signature } from "./signature";
import { Deserializer, Serializable, Serializer } from "../../bcs";
import { Hex, hexToAsciiString } from "../hex";
import {
  AnyPublicKeyVariant,
  HexInput,
  LedgerVersionArg,
  MoveResource,
  SigningScheme,
} from "../../types";
import { EphemeralPublicKey } from "./ephemeral";
import { bytesToBigIntLE } from "./poseidon";
import { Ed25519PublicKey } from "./ed25519";
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
import { FederatedKeylessPublicKey } from "./federatedKeyless";
import { encode } from "js-base64";
import { AccountPublicKey, AuthenticationKey, generateSigningMessage, PublicKey } from "../..";
import { Groth16VerificationKey, Groth16Zkp, KeylessSignature, ZeroKnowledgeSig } from "./keylessType";
import { bigIntToBytesLE, hashStrToField, padAndPackBytesWithLen, poseidonHash } from "./poseidonHash";

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
