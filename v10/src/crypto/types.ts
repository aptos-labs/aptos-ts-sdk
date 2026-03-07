// Crypto-related enums and types

export enum PrivateKeyVariants {
  Ed25519 = "ed25519",
  Secp256k1 = "secp256k1",
  Secp256r1 = "secp256r1",
}

export enum AnyPublicKeyVariant {
  Ed25519 = 0,
  Secp256k1 = 1,
  Secp256r1 = 2,
  Keyless = 3,
  FederatedKeyless = 4,
  SlhDsaSha2_128s = 5,
}

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

export enum AnySignatureVariant {
  Ed25519 = 0,
  Secp256k1 = 1,
  WebAuthn = 2,
  Keyless = 3,
  SlhDsaSha2_128s = 4,
}

export enum EphemeralPublicKeyVariant {
  Ed25519 = 0,
}

export enum EphemeralSignatureVariant {
  Ed25519 = 0,
}

export enum EphemeralCertificateVariant {
  ZkProof = 0,
}

export enum ZkpVariant {
  Groth16 = 0,
}

export enum SigningScheme {
  Ed25519 = 0,
  MultiEd25519 = 1,
  SingleKey = 2,
  MultiKey = 3,
}

export enum SigningSchemeInput {
  Ed25519 = 0,
  Secp256k1Ecdsa = 2,
}

export enum DeriveScheme {
  DeriveAuid = 251,
  DeriveObjectAddressFromObject = 252,
  DeriveObjectAddressFromGuid = 253,
  DeriveObjectAddressFromSeed = 254,
  DeriveResourceAccountAddress = 255,
}

export type AuthenticationKeyScheme = SigningScheme | DeriveScheme;
