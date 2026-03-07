import type { Fp2 } from "@noble/curves/abstract/tower";
import { bytesToNumberBE } from "@noble/curves/abstract/utils";
import type { ProjPointType } from "@noble/curves/abstract/weierstrass";
import { bn254 } from "@noble/curves/bn254";
import { sha3_256 } from "@noble/hashes/sha3";
import { Deserializer } from "../bcs/deserializer.js";
import { Serializable, Serializer } from "../bcs/serializer.js";
import { Hex, type HexInput } from "../hex/index.js";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519.js";
import { EphemeralPublicKey, EphemeralSignature } from "./ephemeral.js";
import { bigIntToBytesLE, bytesToBigIntLE, hashStrToField, poseidonHash } from "./poseidon.js";
import { Proof } from "./proof.js";
import { AccountPublicKey, createAuthKey, type PublicKey, type VerifySignatureArgs } from "./public-key.js";
import { Signature } from "./signature.js";
import { EphemeralCertificateVariant, ZkpVariant } from "./types.js";

export const EPK_HORIZON_SECS = 10000000;
export const MAX_AUD_VAL_BYTES = 120;
export const MAX_UID_KEY_BYTES = 30;
export const MAX_UID_VAL_BYTES = 330;
export const MAX_ISS_VAL_BYTES = 120;
export const MAX_EXTRA_FIELD_BYTES = 350;
export const MAX_JWT_HEADER_B64_BYTES = 300;
export const MAX_COMMITED_EPK_BYTES = 93;

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

export class KeylessPublicKey extends AccountPublicKey {
  static readonly ID_COMMITMENT_LENGTH: number = 32;

  readonly iss: string;
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

  authKey(): unknown {
    // Keyless keys are wrapped in AnyPublicKey for on-chain use;
    // the auth key is derived via the SingleKey scheme by the caller.
    // This method is not typically called directly on KeylessPublicKey.
    throw new Error("Keyless auth keys are derived through AnyPublicKey wrapping");
  }

  verifySignature(_args: VerifySignatureArgs): boolean {
    throw new Error("Use verifySignatureAsync to verify Keyless signatures");
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

  static create(args: {
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
  }): KeylessPublicKey {
    return new KeylessPublicKey(args.iss, computeIdCommitment(args));
  }

  static isInstance(publicKey: PublicKey) {
    return (
      "iss" in publicKey &&
      typeof publicKey.iss === "string" &&
      "idCommitment" in publicKey &&
      publicKey.idCommitment instanceof Uint8Array
    );
  }
}

export class KeylessSignature extends Signature {
  readonly ephemeralCertificate: EphemeralCertificate;
  readonly jwtHeader: string;
  readonly expiryDateSecs: number;
  readonly ephemeralPublicKey: EphemeralPublicKey;
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
}

export class EphemeralCertificate extends Signature {
  public readonly signature: Signature;
  readonly variant: EphemeralCertificateVariant;

  constructor(signature: Signature, variant: EphemeralCertificateVariant) {
    super();
    this.signature = signature;
    this.variant = variant;
  }

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

  toArray(): string[] {
    const point = this.toProjectivePoint();
    return [point.x.toString(), point.y.toString(), point.pz.toString()];
  }

  toProjectivePoint(): ProjPointType<bigint> {
    const bytes = new Uint8Array(this.data);
    bytes.reverse();
    const yFlag = (bytes[0] & 0x80) >> 7;
    const { Fp } = bn254.fields;
    const x = Fp.create(bytesToBn254FpBE(bytes));
    const y = Fp.sqrt(Fp.add(Fp.pow(x, 3n), G1Bytes.B));
    const negY = Fp.neg(y);
    const yToUse = y > negY === (yFlag === 1) ? y : negY;
    return bn254.G1.ProjectivePoint.fromAffine({ x, y: yToUse });
  }
}

class G2Bytes extends Serializable {
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

  toArray(): [string, string][] {
    const point = this.toProjectivePoint();
    return [
      [point.x.c0.toString(), point.x.c1.toString()],
      [point.y.c0.toString(), point.y.c1.toString()],
      [point.pz.c0.toString(), point.pz.c1.toString()],
    ];
  }

  toProjectivePoint(): ProjPointType<Fp2> {
    const bytes = new Uint8Array(this.data);
    const x0 = bytes.slice(0, 32).reverse();
    const x1 = bytes.slice(32, 64).reverse();
    const yFlag = (x1[0] & 0x80) >> 7;
    const { Fp2 } = bn254.fields;
    const x = Fp2.fromBigTuple([bytesToBn254FpBE(x0), bytesToBn254FpBE(x1)]);
    const y = Fp2.sqrt(Fp2.add(Fp2.pow(x, 3n), G2Bytes.B));
    const negY = Fp2.neg(y);
    const isYGreaterThanNegY = y.c1 > negY.c1 || (y.c1 === negY.c1 && y.c0 > negY.c0);
    const yToUse = isYGreaterThanNegY === (yFlag === 1) ? y : negY;
    return bn254.G2.ProjectivePoint.fromAffine({ x, y: yToUse });
  }
}

// ── Groth16 Proof Types ──

export class Groth16Zkp extends Proof {
  a: G1Bytes;
  b: G2Bytes;
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

export class Groth16ProofAndStatement extends Serializable {
  proof: Groth16Zkp;
  publicInputsHash: Uint8Array;
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
    // NOTE: Full implementation needs generateSigningMessage from transactions layer.
    // For now, just hash directly with domain separator prefix.
    const bcsBytes = this.bcsToBytes();
    const prefix = sha3_256.create().update(this.domainSeparator).digest();
    return sha3_256.create().update(prefix).update(bcsBytes).digest();
  }
}

export class ZkProof extends Serializable {
  public readonly proof: Proof;
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

export class ZeroKnowledgeSig extends Signature {
  readonly proof: ZkProof;
  readonly expHorizonSecs: number;
  readonly extraField?: string;
  readonly overrideAudVal?: string;
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

// ── KeylessConfiguration (pure data, no network calls) ──

export class KeylessConfiguration {
  readonly verificationKey: Groth16VerificationKey;
  readonly maxExpHorizonSecs: number;
  readonly trainingWheelsPubkey?: EphemeralPublicKey;
  readonly maxExtraFieldBytes: number;
  readonly maxJwtHeaderB64Bytes: number;
  readonly maxIssValBytes: number;
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
}

export class Groth16VerificationKey {
  readonly alphaG1: G1Bytes;
  readonly betaG2: G2Bytes;
  readonly deltaG2: G2Bytes;
  readonly gammaAbcG1: [G1Bytes, G1Bytes];
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

  toScalar(): bigint {
    if (this.alg !== "RS256") {
      throw new Error("Only RSA 256 is supported for JWK to scalar conversion");
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

// ── Helpers ──

function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
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

export function parseJwtHeader(jwtHeader: string): JwtHeader {
  const header = JSON.parse(jwtHeader);
  if (header.kid === undefined) {
    throw new Error("Invalid JWT header: missing kid field");
  }
  return header;
}
