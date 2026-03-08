// Crypto-related enums and types

/**
 * Variants of private key types supported by the SDK.
 */
export enum PrivateKeyVariants {
  Ed25519 = "ed25519",
  Secp256k1 = "secp256k1",
  Secp256r1 = "secp256r1",
}

/**
 * Numeric discriminants for the `AnyPublicKey` enum on-chain.
 * Each variant corresponds to a supported public key algorithm.
 */
export enum AnyPublicKeyVariant {
  Ed25519 = 0,
  Secp256k1 = 1,
  Secp256r1 = 2,
  Keyless = 3,
  FederatedKeyless = 4,
  SlhDsaSha2_128s = 5,
}

/**
 * Converts an {@link AnyPublicKeyVariant} enum value to its canonical string name.
 *
 * @param variant - The public key variant to convert.
 * @returns A lowercase string identifier for the variant (e.g. `"ed25519"`, `"keyless"`).
 * @throws If the variant is not recognized.
 *
 * @example
 * ```ts
 * anyPublicKeyVariantToString(AnyPublicKeyVariant.Ed25519); // "ed25519"
 * anyPublicKeyVariantToString(AnyPublicKeyVariant.Keyless);  // "keyless"
 * ```
 */
export function anyPublicKeyVariantToString(variant: AnyPublicKeyVariant): string {
  switch (variant) {
    case AnyPublicKeyVariant.Ed25519:
      return "ed25519";
    case AnyPublicKeyVariant.Secp256k1:
      return "secp256k1";
    case AnyPublicKeyVariant.Secp256r1:
      return "secp256r1";
    case AnyPublicKeyVariant.Keyless:
      return "keyless";
    case AnyPublicKeyVariant.FederatedKeyless:
      return "federated_keyless";
    case AnyPublicKeyVariant.SlhDsaSha2_128s:
      return "slh_dsa_sha2_128s";
    default:
      throw new Error("Unknown public key variant");
  }
}

/**
 * Numeric discriminants for the `AnySignature` enum on-chain.
 * Each variant identifies the algorithm used to produce the signature.
 */
export enum AnySignatureVariant {
  Ed25519 = 0,
  Secp256k1 = 1,
  WebAuthn = 2,
  Keyless = 3,
  SlhDsaSha2_128s = 4,
}

/**
 * Numeric discriminants for the ephemeral public key type used in
 * Keyless authentication.
 */
export enum EphemeralPublicKeyVariant {
  Ed25519 = 0,
}

/**
 * Numeric discriminants for the ephemeral signature type used in
 * Keyless authentication.
 */
export enum EphemeralSignatureVariant {
  Ed25519 = 0,
}

/**
 * Numeric discriminants for the ephemeral certificate type embedded
 * inside a {@link KeylessSignature}.
 */
export enum EphemeralCertificateVariant {
  ZkProof = 0,
}

/**
 * Numeric discriminants for the zero-knowledge proof variant used
 * in Keyless authentication.
 */
export enum ZkpVariant {
  Groth16 = 0,
}

/**
 * On-chain signing scheme discriminants.  The value is serialised into the
 * authentication key derivation path to identify which key scheme is in use.
 */
export enum SigningScheme {
  Ed25519 = 0,
  MultiEd25519 = 1,
  SingleKey = 2,
  MultiKey = 3,
}

/**
 * Input-facing signing scheme selector used when constructing accounts or
 * specifying the desired key algorithm.
 */
export enum SigningSchemeInput {
  Ed25519 = 0,
  Secp256k1Ecdsa = 2,
}

/**
 * Scheme discriminants used when deriving special-purpose addresses (object
 * addresses, resource-account addresses, etc.).
 */
export enum DeriveScheme {
  DeriveAuid = 251,
  DeriveObjectAddressFromObject = 252,
  DeriveObjectAddressFromGuid = 253,
  DeriveObjectAddressFromSeed = 254,
  DeriveResourceAccountAddress = 255,
}

/**
 * Union of {@link SigningScheme} and {@link DeriveScheme} values that can
 * appear as the scheme byte in an authentication key.
 */
export type AuthenticationKeyScheme = SigningScheme | DeriveScheme;
