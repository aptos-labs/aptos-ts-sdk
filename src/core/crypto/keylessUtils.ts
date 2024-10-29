import { KeylessError, KeylessErrorType } from "../../types";
import { FederatedKeylessPublicKey } from "./federatedKeyless";
import { KeylessPublicKey } from "./keyless";

export interface JWK {
  kty: string; // Key type
  kid: string; // Key ID
  alg: string; // Algorithm used with the key
  n: string; // Modulus (for RSA keys)
  e: string; // Exponent (for RSA keys)
}

export interface JWKS {
  keys: JWK[];
}

/**
 * Fetches the JWK from the issuer's well-known JWKS endpoint.
 *
 * @param args.publicKey The keyless public key to query
 * @param args.kid The kid of the JWK to fetch
 * @returns A JWK matching the `kid` in the JWT header.
 */
export async function fetchJWK(args: {
  publicKey: KeylessPublicKey | FederatedKeylessPublicKey;
  kid: string;
}): Promise<JWK> {
  const { publicKey, kid } = args;
  const keylessPubKey = publicKey instanceof KeylessPublicKey ? publicKey : publicKey.keylessPublicKey;
  const { iss } = keylessPubKey;

  const jwksUrl = getJWKSUrl(iss);

  // Fetch the JWKS
  const response = await fetch(jwksUrl);
  if (!response.ok) {
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.JWK_FETCH_FAILED,
      details: `Failed to fetch JWKS from ${jwksUrl}: ${response.status} ${response.statusText}`,
    });
  }

  const jwks: JWKS = await response.json();

  // Find the corresponding JWK by `kid`
  const jwk = jwks.keys.find((key) => key.kid === kid);

  if (!jwk) {
    // throw new Error(`JWK with kid ${kid} not found in the fetched JWKS.`);
    throw KeylessError.fromErrorType({
      type: KeylessErrorType.INVALID_JWT_JWK_NOT_FOUND,
      details: `JWK with kid ${kid} for issuer ${iss} not found.`,
    });
  }

  return jwk;
}

/**
 * Constructs the JWKS URL based on the issuer (iss).
 * @param iss The issuer from the keyless public key
 * @returns The complete URL to fetch the JWKS.
 */
function getJWKSUrl(iss: string): string {
  switch (iss) {
    case "https://accounts.google.com":
      return "https://www.googleapis.com/oauth2/v3/certs";
    case "https://appleid.apple.com":
      return "https://appleid.apple.com/auth/keys";
    case "test.oidc.provider":
    case "test.federated.oidc.provider":
      return "https://github.com/aptos-labs/aptos-core/raw/main/types/src/jwks/rsa/secure_test_jwk.json";
    default:
      return iss.endsWith("/") ? `${iss}.well-known/jwks.json` : `${iss}/.well-known/jwks.json`;
  }
}
