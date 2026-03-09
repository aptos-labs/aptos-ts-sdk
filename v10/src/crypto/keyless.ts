import type { Fp2 } from "@noble/curves/abstract/tower.js";
import type { WeierstrassPoint } from "@noble/curves/abstract/weierstrass.js";
import { bn254 } from "@noble/curves/bn254.js";
import { bytesToNumberBE } from "@noble/curves/utils.js";
import { sha3_256 } from "@noble/hashes/sha3.js";
import { Deserializer } from "../bcs/deserializer.js";
import { Serializable, Serializer } from "../bcs/serializer.js";
import { Hex, type HexInput } from "../hex/index.js";
import { generateSigningMessage } from "../transactions/signing-message.js";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519.js";
import { EphemeralPublicKey, EphemeralSignature } from "./ephemeral.js";
import { bigIntToBytesLE, bytesToBigIntLE, hashStrToField, poseidonHash } from "./poseidon.js";
import { Proof } from "./proof.js";
import { AccountPublicKey, type PublicKey, type VerifySignatureArgs } from "./public-key.js";
import { Signature } from "./signature.js";
import { EphemeralCertificateVariant, ZkpVariant } from "./types.js";

const TEXT_ENCODER = new TextEncoder();

/** Maximum seconds in the future an ephemeral key may expire. */
export const EPK_HORIZON_SECS = 10000000;
/** Maximum byte length of an `aud` (audience) value. */
export const MAX_AUD_VAL_BYTES = 120;
/** Maximum byte length of a UID key (e.g. `"sub"`). */
export const MAX_UID_KEY_BYTES = 30;
/** Maximum byte length of a UID value. */
export const MAX_UID_VAL_BYTES = 330;
/** Maximum byte length of an `iss` (issuer) value. */
export const MAX_ISS_VAL_BYTES = 120;
/** Maximum byte length of an extra JWT field. */
export const MAX_EXTRA_FIELD_BYTES = 350;
/** Maximum byte length of the base64-URL encoded JWT header. */
export const MAX_JWT_HEADER_B64_BYTES = 300;
/** Maximum byte length of the committed ephemeral public key. */
export const MAX_COMMITED_EPK_BYTES = 93;

/**
 * Computes the identity commitment (IdC) used in Keyless public keys.
 *
 * The commitment is a Poseidon hash of the pepper, audience, UID value, and
 * UID key, binding the ephemeral key to the user's JWT identity without
 * revealing it on-chain.
 *
 * @param args - The inputs to the commitment.
 * @param args.uidKey - The JWT claim name used as the user identifier (e.g.
 *   `"sub"`).
 * @param args.uidVal - The value of the UID claim.
 * @param args.aud - The `aud` (audience) claim of the JWT.
 * @param args.pepper - A secret random value that hides the identity on-chain.
 * @returns The 32-byte identity commitment as a `Uint8Array`.
 *
 * @example
 * ```ts
 * const idc = computeIdCommitment({
 *   uidKey: "sub",
 *   uidVal: "1234567890",
 *   aud: "my-app-client-id",
 *   pepper: pepperBytes,
 * });
 * ```
 */
export function computeIdCommitment(args: {
  uidKey: string;
  uidVal: string;
  aud: string;
  pepper: HexInput;
}): Uint8Array {
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
 * The public key used by Aptos Keyless accounts.
 *
 * A `KeylessPublicKey` consists of an `iss` (OIDC issuer) and an identity
 * commitment (`idCommitment`) that cryptographically binds the on-chain key to
 * the user's off-chain JWT identity without revealing it publicly.
 *
 * Keyless signatures must be verified asynchronously — the synchronous
 * {@link verifySignature} method always throws.
 *
 * @example
 * ```ts
 * const pubKey = KeylessPublicKey.create({
 *   iss: "https://accounts.google.com",
 *   uidKey: "sub",
 *   uidVal: "1234567890",
 *   aud: "my-app-client-id",
 *   pepper: pepperBytes,
 * });
 * ```
 */
export class KeylessPublicKey extends AccountPublicKey {
  /** Byte length of the identity commitment. */
  static readonly ID_COMMITMENT_LENGTH: number = 32;

  /** The OIDC issuer URL (e.g. `"https://accounts.google.com"`). */
  readonly iss: string;
  /** The 32-byte identity commitment. */
  readonly idCommitment: Uint8Array;

  /**
   * Creates a `KeylessPublicKey` from an issuer URL and a raw identity
   * commitment.
   *
   * @param iss - The OIDC issuer URL.
   * @param idCommitment - The 32-byte identity commitment as bytes or hex.
   * @throws If `idCommitment` is not exactly 32 bytes.
   */
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
   * Not supported for Keyless keys — auth keys are derived through
   * `AnyPublicKey` wrapping.
   *
   * @throws Always throws.
   */
  authKey(): unknown {
    // Keyless keys are wrapped in AnyPublicKey for on-chain use;
    // the auth key is derived via the SingleKey scheme by the caller.
    // This method is not typically called directly on KeylessPublicKey.
    throw new Error("Keyless auth keys are derived through AnyPublicKey wrapping");
  }

  /**
   * Not supported synchronously — use `verifySignatureAsync` instead.
   *
   * @throws Always throws.
   */
  verifySignature(_args: VerifySignatureArgs): boolean {
    throw new Error("Use verifySignatureAsync to verify Keyless signatures");
  }

  /**
   * BCS-serialises the public key by writing the issuer string followed by
   * the identity commitment bytes.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.iss);
    serializer.serializeBytes(this.idCommitment);
  }

  /**
   * Deserialises a `KeylessPublicKey` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `KeylessPublicKey`.
   */
  static deserialize(deserializer: Deserializer): KeylessPublicKey {
    const iss = deserializer.deserializeStr();
    const addressSeed = deserializer.deserializeBytes();
    return new KeylessPublicKey(iss, addressSeed);
  }

  /**
   * Alias for {@link deserialize} — deserialises a `KeylessPublicKey` from a
   * BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `KeylessPublicKey`.
   */
  static load(deserializer: Deserializer): KeylessPublicKey {
    const iss = deserializer.deserializeStr();
    const addressSeed = deserializer.deserializeBytes();
    return new KeylessPublicKey(iss, addressSeed);
  }

  /**
   * Convenience factory that creates a `KeylessPublicKey` by computing the
   * identity commitment from the provided JWT claims and pepper.
   *
   * @param args - The JWT identity parameters.
   * @param args.iss - The OIDC issuer URL.
   * @param args.uidKey - The JWT claim name used as the user identifier.
   * @param args.uidVal - The value of the UID claim.
   * @param args.aud - The `aud` (audience) claim.
   * @param args.pepper - The secret pepper bytes.
   * @returns A new `KeylessPublicKey`.
   */
  static create(args: {
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
  }): KeylessPublicKey {
    return new KeylessPublicKey(args.iss, computeIdCommitment(args));
  }

  /**
   * Duck-type check that returns `true` if `publicKey` has the shape of a
   * `KeylessPublicKey`.
   *
   * @param publicKey - The public key to inspect.
   * @returns `true` if the key looks like a `KeylessPublicKey`.
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

/**
 * The on-chain signature produced by a Keyless account.
 *
 * A `KeylessSignature` bundles together:
 * - An {@link EphemeralCertificate} (the zero-knowledge proof or training-
 *   wheels signature that authorises the ephemeral key).
 * - The base64-encoded JWT header.
 * - The ephemeral key expiry timestamp.
 * - The {@link EphemeralPublicKey} used for the inner signature.
 * - The {@link EphemeralSignature} over the transaction.
 */
export class KeylessSignature extends Signature {
  /** The zero-knowledge proof (or training-wheels certificate) for the ephemeral key. */
  readonly ephemeralCertificate: EphemeralCertificate;
  /** The base64-URL encoded JWT header. */
  readonly jwtHeader: string;
  /** Unix timestamp (seconds) at which the ephemeral key expires. */
  readonly expiryDateSecs: number;
  /** The ephemeral public key used to sign the transaction. */
  readonly ephemeralPublicKey: EphemeralPublicKey;
  /** The signature over the transaction produced by the ephemeral private key. */
  readonly ephemeralSignature: EphemeralSignature;

  /**
   * Creates a `KeylessSignature`.
   *
   * @param args - The components of the Keyless signature.
   * @param args.jwtHeader - The base64-URL encoded JWT header string.
   * @param args.ephemeralCertificate - The ZK proof or training-wheels cert.
   * @param args.expiryDateSecs - Expiry of the ephemeral key in Unix seconds.
   * @param args.ephemeralPublicKey - The ephemeral public key.
   * @param args.ephemeralSignature - The signature over the transaction.
   */
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
   * Parses the JWT header and returns the `kid` (key ID) field.
   *
   * @returns The `kid` value from the JWT header.
   * @throws If the header does not contain a `kid` field.
   */
  getJwkKid(): string {
    return parseJwtHeader(this.jwtHeader).kid;
  }

  /**
   * BCS-serialises the Keyless signature.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    this.ephemeralCertificate.serialize(serializer);
    serializer.serializeStr(this.jwtHeader);
    serializer.serializeU64(this.expiryDateSecs);
    this.ephemeralPublicKey.serialize(serializer);
    this.ephemeralSignature.serialize(serializer);
  }

  /**
   * Deserialises a `KeylessSignature` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `KeylessSignature`.
   */
  static deserialize(deserializer: Deserializer): KeylessSignature {
    const ephemeralCertificate = EphemeralCertificate.deserialize(deserializer);
    const jwtHeader = deserializer.deserializeStr();
    if (TEXT_ENCODER.encode(jwtHeader).length > MAX_JWT_HEADER_B64_BYTES) {
      throw new Error(`JWT header exceeds maximum length of ${MAX_JWT_HEADER_B64_BYTES} bytes`);
    }
    const expiryDateSecsBig = deserializer.deserializeU64();
    if (expiryDateSecsBig > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(`expiryDateSecs ${expiryDateSecsBig} exceeds safe integer range`);
    }
    const expiryDateSecs = Number(expiryDateSecsBig);
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

  /**
   * Returns a placeholder `KeylessSignature` suitable for transaction
   * simulation (all proof and signature bytes are zeroed).
   *
   * @returns A zeroed-out `KeylessSignature`.
   */
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
}

/**
 * A type-tagged certificate that authorises an ephemeral key for use in a
 * Keyless signature.
 *
 * Currently only the `ZkProof` (zero-knowledge proof) variant is supported.
 */
export class EphemeralCertificate extends Signature {
  /** The underlying certificate (currently a {@link ZeroKnowledgeSig}). */
  public readonly signature: Signature;
  /** The variant discriminant. */
  readonly variant: EphemeralCertificateVariant;

  /**
   * Creates an `EphemeralCertificate`.
   *
   * @param signature - The proof or signature that certifies the ephemeral key.
   * @param variant - The variant discriminant (currently only `ZkProof`).
   */
  constructor(signature: Signature, variant: EphemeralCertificateVariant) {
    super();
    this.signature = signature;
    this.variant = variant;
  }

  /**
   * Returns the raw bytes of the inner certificate signature.
   *
   * @returns The certificate bytes as a `Uint8Array`.
   */
  toUint8Array(): Uint8Array {
    return this.signature.toUint8Array();
  }

  /**
   * BCS-serialises the certificate by writing the ULEB128 variant index
   * followed by the inner signature.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(this.variant);
    this.signature.serialize(serializer);
  }

  /**
   * Deserialises an `EphemeralCertificate` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `EphemeralCertificate`.
   * @throws If the variant index is not recognised.
   */
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

// ── BN254 G1/G2 Helpers ──

function bytesToBn254FpBE(bytes: Uint8Array): bigint {
  if (bytes.length !== 32) {
    throw new Error("Input should be 32 bytes");
  }
  const result = new Uint8Array(bytes);
  result[0] &= 0x3f;
  return bytesToNumberBE(result);
}

class G1Bytes extends Serializable {
  private static readonly B = bn254.fields.Fp.create(3n);

  readonly data: Uint8Array;

  constructor(data: HexInput) {
    super();
    const bytes = Hex.fromHexInput(data).toUint8Array();
    if (bytes.length !== 32) {
      throw new Error("Input needs to be 32 bytes");
    }
    this.data = bytes.slice();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.data);
  }

  static deserialize(deserializer: Deserializer): G1Bytes {
    const bytes = deserializer.deserializeFixedBytes(32);
    return new G1Bytes(bytes);
  }

  toArray(): string[] {
    const point = this.toProjectivePoint();
    return [point.x.toString(), point.y.toString(), point.Z.toString()];
  }

  toProjectivePoint(): WeierstrassPoint<bigint> {
    const bytes = new Uint8Array(this.data);
    bytes.reverse();
    const yFlag = (bytes[0] & 0x80) >> 7;
    const { Fp } = bn254.fields;
    const x = Fp.create(bytesToBn254FpBE(bytes));
    const y = Fp.sqrt(Fp.add(Fp.pow(x, 3n), G1Bytes.B));
    const negY = Fp.neg(y);
    const yToUse = y > negY === (yFlag === 1) ? y : negY;
    return bn254.G1.Point.fromAffine({ x, y: yToUse });
  }
}

class G2Bytes extends Serializable {
  private static readonly B = bn254.fields.Fp2.fromBigTuple([
    19485874751759354771024239261021720505790618469301721065564631296452457478373n,
    266929791119991161246907387137283842545076965332900288569378510910307636690n,
  ]);

  readonly data: Uint8Array;

  constructor(data: HexInput) {
    super();
    const bytes = Hex.fromHexInput(data).toUint8Array();
    if (bytes.length !== 64) {
      throw new Error("Input needs to be 64 bytes");
    }
    this.data = bytes.slice();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.data);
  }

  static deserialize(deserializer: Deserializer): G2Bytes {
    const bytes = deserializer.deserializeFixedBytes(64);
    return new G2Bytes(bytes);
  }

  toArray(): [string, string][] {
    const point = this.toProjectivePoint();
    return [
      [point.x.c0.toString(), point.x.c1.toString()],
      [point.y.c0.toString(), point.y.c1.toString()],
      [point.Z.c0.toString(), point.Z.c1.toString()],
    ];
  }

  toProjectivePoint(): WeierstrassPoint<Fp2> {
    const bytes = new Uint8Array(this.data);
    const x0 = bytes.subarray(0, 32);
    const x1 = bytes.subarray(32, 64);
    x0.reverse();
    x1.reverse();
    const yFlag = (x1[0] & 0x80) >> 7;
    const { Fp2 } = bn254.fields;
    const x = Fp2.fromBigTuple([bytesToBn254FpBE(x0), bytesToBn254FpBE(x1)]);
    const y = Fp2.sqrt(Fp2.add(Fp2.pow(x, 3n), G2Bytes.B));
    const negY = Fp2.neg(y);
    const isYGreaterThanNegY = y.c1 > negY.c1 || (y.c1 === negY.c1 && y.c0 > negY.c0);
    const yToUse = isYGreaterThanNegY === (yFlag === 1) ? y : negY;
    return bn254.G2.Point.fromAffine({ x, y: yToUse });
  }
}

// ── Groth16 Proof Types ──

/**
 * A Groth16 zero-knowledge proof, consisting of three BN254 elliptic curve
 * points: `a` (G1), `b` (G2), and `c` (G1).
 *
 * @example
 * ```ts
 * const proof = new Groth16Zkp({ a: aBytes, b: bBytes, c: cBytes });
 * ```
 */
export class Groth16Zkp extends Proof {
  /** The `a` point of the proof (BN254 G1, 32 bytes). */
  a: G1Bytes;
  /** The `b` point of the proof (BN254 G2, 64 bytes). */
  b: G2Bytes;
  /** The `c` point of the proof (BN254 G1, 32 bytes). */
  c: G1Bytes;

  /**
   * Creates a `Groth16Zkp` from its three constituent point byte arrays.
   *
   * @param args - Object with `a` (32 bytes), `b` (64 bytes), `c` (32 bytes).
   */
  constructor(args: { a: HexInput; b: HexInput; c: HexInput }) {
    super();
    const { a, b, c } = args;
    this.a = new G1Bytes(a);
    this.b = new G2Bytes(b);
    this.c = new G1Bytes(c);
  }

  /**
   * BCS-serialises the proof by writing `a`, `b`, and `c` in order.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    this.a.serialize(serializer);
    this.b.serialize(serializer);
    this.c.serialize(serializer);
  }

  /**
   * Deserialises a `Groth16Zkp` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `Groth16Zkp`.
   */
  static deserialize(deserializer: Deserializer): Groth16Zkp {
    const a = G1Bytes.deserialize(deserializer).data;
    const b = G2Bytes.deserialize(deserializer).data;
    const c = G1Bytes.deserialize(deserializer).data;
    return new Groth16Zkp({ a, b, c });
  }

  /**
   * Returns the proof formatted as a SnarkJS-compatible JSON object.
   *
   * @returns A plain object with `protocol`, `curve`, `pi_a`, `pi_b`, and
   *   `pi_c` fields.
   */
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
 * Bundles a {@link Groth16Zkp} together with the hash of its public inputs,
 * for use in domain-separated signing and verification.
 */
export class Groth16ProofAndStatement extends Serializable {
  /** The Groth16 proof. */
  proof: Groth16Zkp;
  /** The 32-byte hash of the public inputs. */
  publicInputsHash: Uint8Array;
  /** Domain separator used in the signing message construction. */
  readonly domainSeparator = "APTOS::Groth16ProofAndStatement";

  /**
   * Creates a `Groth16ProofAndStatement`.
   *
   * @param proof - The Groth16 proof.
   * @param publicInputsHash - The 32-byte public-inputs hash as bytes, a hex
   *   string, or a `bigint` (encoded as 32-byte little-endian).
   * @throws If the public-inputs hash is not 32 bytes.
   */
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

  /**
   * BCS-serialises the proof and its public-inputs hash.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    this.proof.serialize(serializer);
    serializer.serializeFixedBytes(this.publicInputsHash);
  }

  /**
   * Deserialises a `Groth16ProofAndStatement` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `Groth16ProofAndStatement`.
   */
  static deserialize(deserializer: Deserializer): Groth16ProofAndStatement {
    return new Groth16ProofAndStatement(Groth16Zkp.deserialize(deserializer), deserializer.deserializeFixedBytes(32));
  }

  /**
   * Computes a domain-separated SHA3-256 hash of the BCS-encoded proof and
   * statement, suitable for use as a signing message.
   *
   * @returns A 32-byte hash `Uint8Array`.
   */
  hash(): Uint8Array {
    return generateSigningMessage(this.bcsToBytes(), this.domainSeparator);
  }
}

/**
 * A type-tagged zero-knowledge proof container.
 *
 * `ZkProof` wraps a concrete {@link Proof} implementation (currently only
 * {@link Groth16Zkp}) with a variant discriminant for BCS serialisation.
 */
export class ZkProof extends Serializable {
  /** The underlying ZK proof. */
  public readonly proof: Proof;
  /** The variant discriminant identifying the proof system. */
  readonly variant: ZkpVariant;

  /**
   * Creates a `ZkProof`.
   *
   * @param proof - The concrete proof object.
   * @param variant - The ZK proof system variant.
   */
  constructor(proof: Proof, variant: ZkpVariant) {
    super();
    this.proof = proof;
    this.variant = variant;
  }

  /**
   * BCS-serialises the proof by writing the ULEB128 variant index followed by
   * the inner proof bytes.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(this.variant);
    this.proof.serialize(serializer);
  }

  /**
   * Deserialises a `ZkProof` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `ZkProof`.
   * @throws If the variant index is not recognised.
   */
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
 * A zero-knowledge signature that certifies an ephemeral key.
 *
 * `ZeroKnowledgeSig` contains the ZK proof and expiry horizon, and optionally
 * an extra JWT field, an audience override, and a training-wheels signature.
 */
export class ZeroKnowledgeSig extends Signature {
  /** The ZK proof that certifies the ephemeral key. */
  readonly proof: ZkProof;
  /** The maximum expiry horizon (in seconds) accepted by the chain. */
  readonly expHorizonSecs: number;
  /** An optional extra JWT field included in the proof statement. */
  readonly extraField?: string;
  /** An optional audience value override used during recovery. */
  readonly overrideAudVal?: string;
  /** An optional training-wheels ephemeral signature from the OIDC provider. */
  readonly trainingWheelsSignature?: EphemeralSignature;

  /**
   * Creates a `ZeroKnowledgeSig`.
   *
   * @param args - The ZK signature components.
   * @param args.proof - The ZK proof.
   * @param args.expHorizonSecs - The accepted expiry horizon in seconds.
   * @param args.extraField - Optional extra JWT field.
   * @param args.overrideAudVal - Optional audience override.
   * @param args.trainingWheelsSignature - Optional training-wheels signature.
   */
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
   * Constructs a `ZeroKnowledgeSig` by deserialising BCS bytes.
   *
   * @param bytes - The raw BCS-encoded bytes.
   * @returns A new `ZeroKnowledgeSig`.
   */
  static fromBytes(bytes: Uint8Array): ZeroKnowledgeSig {
    return ZeroKnowledgeSig.deserialize(new Deserializer(bytes));
  }

  /**
   * BCS-serialises the ZK signature.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    this.proof.serialize(serializer);
    serializer.serializeU64(this.expHorizonSecs);
    serializer.serializeOption(this.extraField);
    serializer.serializeOption(this.overrideAudVal);
    serializer.serializeOption(this.trainingWheelsSignature);
  }

  /**
   * Deserialises a `ZeroKnowledgeSig` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `ZeroKnowledgeSig`.
   */
  static deserialize(deserializer: Deserializer): ZeroKnowledgeSig {
    const proof = ZkProof.deserialize(deserializer);
    const expHorizonSecsBig = deserializer.deserializeU64();
    if (expHorizonSecsBig > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(`expHorizonSecs ${expHorizonSecsBig} exceeds safe integer range`);
    }
    const expHorizonSecs = Number(expHorizonSecsBig);
    const extraField = deserializer.deserializeOption("string");
    const overrideAudVal = deserializer.deserializeOption("string");
    const trainingWheelsSignature = deserializer.deserializeOption(EphemeralSignature);
    return new ZeroKnowledgeSig({ proof, expHorizonSecs, trainingWheelsSignature, extraField, overrideAudVal });
  }
}

// ── KeylessConfiguration (pure data, no network calls) ──

/**
 * Immutable configuration for the Keyless authentication scheme, typically
 * fetched from the on-chain configuration resource.
 *
 * Includes the Groth16 verification key and various byte-length limits used
 * during proof verification.
 */
export class KeylessConfiguration {
  /** The Groth16 verification key. */
  readonly verificationKey: Groth16VerificationKey;
  /** The maximum accepted ephemeral key expiry horizon in seconds. */
  readonly maxExpHorizonSecs: number;
  /** Optional training-wheels ephemeral public key from the OIDC provider. */
  readonly trainingWheelsPubkey?: EphemeralPublicKey;
  /** Maximum byte length of extra JWT fields. */
  readonly maxExtraFieldBytes: number;
  /** Maximum byte length of the base64-URL encoded JWT header. */
  readonly maxJwtHeaderB64Bytes: number;
  /** Maximum byte length of the `iss` (issuer) value. */
  readonly maxIssValBytes: number;
  /** Maximum byte length of the committed ephemeral public key. */
  readonly maxCommitedEpkBytes: number;

  /**
   * Creates a `KeylessConfiguration`.
   *
   * @param args - Configuration parameters.
   * @param args.verificationKey - The Groth16 verification key.
   * @param args.trainingWheelsPubkey - Optional training-wheels Ed25519 public key
   *   bytes.
   * @param args.maxExpHorizonSecs - Maximum ephemeral key expiry horizon.
   * @param args.maxExtraFieldBytes - Maximum extra JWT field byte length.
   * @param args.maxJwtHeaderB64Bytes - Maximum JWT header base64 byte length.
   * @param args.maxIssValBytes - Maximum issuer value byte length.
   * @param args.maxCommitedEpkBytes - Maximum committed EPK byte length.
   */
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
}

/**
 * The Groth16 verification key used to verify Keyless ZK proofs on-chain.
 *
 * Contains the five BN254 elliptic-curve elements that define the verification
 * key: `alphaG1`, `betaG2`, `deltaG2`, `gammaAbcG1`, and `gammaG2`.
 */
export class Groth16VerificationKey {
  /** The `alpha_1` G1 element of the verification key. */
  readonly alphaG1: G1Bytes;
  /** The `beta_2` G2 element of the verification key. */
  readonly betaG2: G2Bytes;
  /** The `delta_2` G2 element of the verification key. */
  readonly deltaG2: G2Bytes;
  /** The `gamma_abc_1` G1 elements (IC) of the verification key. */
  readonly gammaAbcG1: [G1Bytes, G1Bytes];
  /** The `gamma_2` G2 element of the verification key. */
  readonly gammaG2: G2Bytes;

  /**
   * Creates a `Groth16VerificationKey`.
   *
   * @param args - The verification key elements.
   * @param args.alphaG1 - The 32-byte alpha G1 element.
   * @param args.betaG2 - The 64-byte beta G2 element.
   * @param args.deltaG2 - The 64-byte delta G2 element.
   * @param args.gammaAbcG1 - Tuple of two 32-byte gamma-ABC G1 elements.
   * @param args.gammaG2 - The 64-byte gamma G2 element.
   */
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
   * Computes a SHA3-256 hash of the BCS-serialised verification key.
   *
   * Useful for fingerprinting or comparing verification keys.
   *
   * @returns A 32-byte hash of the verification key.
   */
  public hash(): Uint8Array {
    const serializer = new Serializer();
    this.serialize(serializer);
    return sha3_256.create().update(serializer.toUint8Array()).digest();
  }

  /**
   * BCS-serialises the verification key by writing its five elements in order.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    this.alphaG1.serialize(serializer);
    this.betaG2.serialize(serializer);
    this.deltaG2.serialize(serializer);
    this.gammaAbcG1[0].serialize(serializer);
    this.gammaAbcG1[1].serialize(serializer);
    this.gammaG2.serialize(serializer);
  }

  /**
   * Verifies a Groth16 proof against this verification key using BN254
   * bilinear pairings.
   *
   * Checks the pairing equation:
   * `e(A, B) == e(alpha, beta) * e(IC_0 + hash * IC_1, gamma) * e(C, delta)`
   *
   * @param args - Object containing `publicInputsHash` (bigint) and
   *   `groth16Proof` ({@link Groth16Zkp}).
   * @returns `true` if the proof verifies, `false` otherwise.
   */
  verifyProof(args: { publicInputsHash: bigint; groth16Proof: Groth16Zkp }): boolean {
    const { publicInputsHash, groth16Proof } = args;

    const proofA = groth16Proof.a.toProjectivePoint();
    const proofB = groth16Proof.b.toProjectivePoint();
    const proofC = groth16Proof.c.toProjectivePoint();

    const vkAlpha1 = this.alphaG1.toProjectivePoint();
    const vkBeta2 = this.betaG2.toProjectivePoint();
    const vkGamma2 = this.gammaG2.toProjectivePoint();
    const vkDelta2 = this.deltaG2.toProjectivePoint();
    const vkIC = this.gammaAbcG1.map((g1) => g1.toProjectivePoint());

    const { Fp12 } = bn254.fields;

    // e(A_1, B_2) = e(alpha_1, beta_2) * e(ic_0 + public_inputs_hash * ic_1, gamma_2) * e(C_1, delta_2)
    const accum = vkIC[0].add(vkIC[1].multiply(publicInputsHash));
    const pairingAccumGamma = bn254.pairing(accum, vkGamma2);
    const pairingAB = bn254.pairing(proofA, proofB);
    const pairingAlphaBeta = bn254.pairing(vkAlpha1, vkBeta2);
    const pairingCDelta = bn254.pairing(proofC, vkDelta2);
    const product = Fp12.mul(pairingAlphaBeta, Fp12.mul(pairingAccumGamma, pairingCDelta));
    return Fp12.eql(pairingAB, product);
  }

  /**
   * Returns the verification key formatted as a SnarkJS-compatible JSON
   * object.
   *
   * @returns A plain object with `protocol`, `curve`, `nPublic`, and the five
   *   verification key elements.
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

// ── MoveJWK ──

/**
 * Represents a JSON Web Key (JWK) as stored in the Aptos Move state.
 *
 * Used to verify OIDC provider signatures on JWT tokens during Keyless
 * authentication.
 */
export class MoveJWK extends Serializable {
  /** The key ID (`kid`) field from the JWK. */
  public kid: string;
  /** The key type (`kty`) field, e.g. `"RSA"`. */
  public kty: string;
  /** The algorithm (`alg`) field, e.g. `"RS256"`. */
  public alg: string;
  /** The RSA public exponent (`e`) in base64-URL encoding. */
  public e: string;
  /** The RSA modulus (`n`) in base64-URL encoding. */
  public n: string;

  /**
   * Creates a `MoveJWK`.
   *
   * @param args - The JWK fields.
   * @param args.kid - Key ID.
   * @param args.kty - Key type (e.g. `"RSA"`).
   * @param args.alg - Algorithm (e.g. `"RS256"`).
   * @param args.e - RSA public exponent in base64-URL encoding.
   * @param args.n - RSA modulus in base64-URL encoding.
   */
  constructor(args: { kid: string; kty: string; alg: string; e: string; n: string }) {
    super();
    const { kid, kty, alg, e, n } = args;
    this.kid = kid;
    this.kty = kty;
    this.alg = alg;
    this.e = e;
    this.n = n;
  }

  /**
   * BCS-serialises the JWK by writing each field as a string.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.kid);
    serializer.serializeStr(this.kty);
    serializer.serializeStr(this.alg);
    serializer.serializeStr(this.e);
    serializer.serializeStr(this.n);
  }

  /**
   * Converts this JWK to a Poseidon field element for use in ZK circuits.
   *
   * Only RSA-256 (`alg === "RS256"`) keys are supported.  The modulus `n`
   * is decoded from base64-URL, reversed, chunked into 24-byte scalars, and
   * hashed with Poseidon together with the modulus size.
   *
   * @returns The Poseidon hash of the JWK as a `bigint`.
   * @throws If the algorithm is not `"RS256"`.
   */
  toScalar(): bigint {
    if (this.alg !== "RS256") {
      throw new Error("Only RSA 256 is supported for JWK to scalar conversion");
    }
    const uint8Array = base64UrlToBytes(this.n);
    // RSA-4096 has a 512-byte modulus; reject anything larger to prevent DoS
    if (uint8Array.length > 512) {
      throw new Error(`RSA modulus too large: ${uint8Array.length} bytes (max 512)`);
    }
    const modulusBits = uint8Array.length * 8;
    const chunks = chunkInto24Bytes(uint8Array.reverse());
    const scalars = chunks.map((chunk) => bytesToBigIntLE(chunk));
    scalars.push(BigInt(modulusBits));
    return poseidonHash(scalars);
  }

  /**
   * Deserialises a `MoveJWK` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `MoveJWK`.
   */
  static deserialize(deserializer: Deserializer): MoveJWK {
    const kid = deserializer.deserializeStr();
    const kty = deserializer.deserializeStr();
    const alg = deserializer.deserializeStr();
    const e = deserializer.deserializeStr();
    const n = deserializer.deserializeStr();
    return new MoveJWK({ kid, kty, alg, n, e });
  }
}

// ── Helpers ──

function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Error("Invalid base64url encoding");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function chunkInto24Bytes(data: Uint8Array): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < data.length; i += 24) {
    const chunk = data.slice(i, Math.min(i + 24, data.length));
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
  kid: string;
}

/**
 * Parses a base64-decoded JWT header JSON string and returns the header
 * fields.
 *
 * @param jwtHeader - The JWT header as a JSON string (already base64-decoded).
 * @returns An object with the `kid` field.
 * @throws If the header does not contain a `kid` field.
 *
 * @example
 * ```ts
 * const header = parseJwtHeader('{"alg":"RS256","kid":"abc123"}');
 * console.log(header.kid); // "abc123"
 * ```
 */
const MAX_JWT_HEADER_JSON_BYTES = 4096;

export function parseJwtHeader(jwtHeader: string): JwtHeader {
  if (jwtHeader.length > MAX_JWT_HEADER_JSON_BYTES) {
    throw new Error(`JWT header exceeds maximum size of ${MAX_JWT_HEADER_JSON_BYTES} bytes`);
  }
  const header = JSON.parse(jwtHeader);
  if (typeof header.kid !== "string") {
    throw new Error("Invalid JWT header: missing or non-string kid field");
  }
  return { kid: header.kid };
}
