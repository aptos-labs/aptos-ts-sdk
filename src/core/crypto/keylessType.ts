import { bytesToNumberBE } from "@noble/curves/abstract/utils";
import { ProjPointType } from "@noble/curves/abstract/weierstrass";
import { bn254 } from "@noble/curves/bn254";
import { Deserializer, Serializable, Serializer } from "../../bcs";
import { AnyPublicKeyVariant, EphemeralCertificateVariant, HexInput, SigningScheme, ZkpVariant } from "../../types";
import { Hex } from "../hex";
import { Proof } from "./proof";
import { sha3_256 } from "@noble/hashes/sha3";
import { KeylessError, KeylessErrorType } from "../../errors";
import { Groth16VerificationKeyResponse } from "../../types/keyless";
import { Fp2 } from "@noble/curves/abstract/tower";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519";
import { EphemeralPublicKey, EphemeralSignature } from "./ephemeral";
import { Signature } from "./signature";
import { AccountPublicKey, PublicKey } from "./publicKey";
import { AptosConfig } from "../../api";
import { AuthenticationKey } from "../authenticationKey";

/**
 * Represents a fixed-size byte array of 32 bytes, extending the Serializable class.
 * This class is used for handling and serializing G1 bytes in cryptographic operations.
 *
 * @extends Serializable
 * @group Implementation
 * @category Serialization
 */
export class G1Bytes extends Serializable {
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

  export function bytesToBn254FpBE(bytes: Uint8Array): bigint {
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
export class G2Bytes extends Serializable {
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