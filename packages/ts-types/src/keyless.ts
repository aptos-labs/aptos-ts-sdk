/**
 * The payload for a prover request, containing a Base64-encoded JWT.
 * @group Implementation
 * @category Types
 */
export type ProverRequest = {
  jwt_b64: string;
  epk: string;
  exp_date_secs: number;
  exp_horizon_secs: number;
  epk_blinder: string;
  uid_key: string;
  pepper: string;
};

/**
 * The response from the prover containing the proof data.
 * @group Implementation
 * @category Types
 */
export type ProverResponse = {
  proof: { a: string; b: string; c: string };
  public_inputs_hash: string;
  training_wheels_signature: string;
};

/**
 * The request payload for fetching data, containing a base64 encoded JWT.
 * @group Implementation
 * @category Types
 */
export type PepperFetchRequest = {
  jwt_b64: number;
  epk: string;
  exp_date_secs: number;
  epk_blinder: string;
  uid_key: string;
  derivation_path: string;
};

/**
 * The response object containing the fetched pepper string.
 * @group Implementation
 * @category Types
 */
export type PepperFetchResponse = { pepper: string; address: string };

/**
 * The response for keyless configuration containing the maximum committed EPK bytes.
 * @group Implementation
 * @category Types
 */
export type KeylessConfigurationResponse = {
  max_commited_epk_bytes: number;
  max_exp_horizon_secs: string;
  max_extra_field_bytes: number;
  max_iss_val_bytes: number;
  max_jwt_header_b64_bytes: number;
  max_signatures_per_txn: number;
  override_aud_vals: string[];
  training_wheels_pubkey: { vec: [string] };
};

/**
 * The response containing the Groth16 verification key, including the alpha_g1 component.
 * @group Implementation
 * @category Types
 */
export type Groth16VerificationKeyResponse = {
  alpha_g1: string;
  beta_g2: string;
  delta_g2: string;
  gamma_abc_g1: [string, string];
  gamma_g2: string;
};

/**
 * The response containing the Groth16 verification key, including the alpha_g1 component.
 */
export type PatchedJWKsResponse = {
  jwks: { entries: [IssuerJWKS] };
};

/**
 * The response containing the Groth16 verification key, including the alpha_g1 component.
 */
export type IssuerJWKS = {
  issuer: string;
  jwks: [MoveAnyStruct];
};

export type MoveAnyStruct = {
  variant: { data: string; type_name: string };
};
