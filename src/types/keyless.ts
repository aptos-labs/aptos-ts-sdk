export type ProverRequest = {
  jwt_b64: string;
  epk: string;
  exp_date_secs: number;
  exp_horizon_secs: number;
  epk_blinder: string;
  uid_key: string;
  pepper: string;
};
export type ProverResponse = {
  proof: { a: string; b: string; c: string };
  public_inputs_hash: string;
  training_wheels_signature: string;
};
export type PepperFetchRequest = {
  jwt_b64: number;
  epk: string;
  exp_date_secs: number;
  epk_blinder: string;
  uid_key: string;
  derivation_path: string;
};
export type PepperFetchResponse = { pepper: string; address: string };

export type KeylessConfigurationResponse = {
  max_commited_epk_bytes: number;
  max_exp_horizon_secs: string;
  max_extra_field_bytes: number;
  max_iss_val_bytes: number;
  max_jwt_header_b64_bytes: number;
  max_signatures_per_txn: number;
  override_aud_vals: string[];
  training_wheels_pubkey: { vec: string[] };
};

export type Groth16VerificationKeyResponse = {
  alpha_g1: string;
  beta_g2: string;
  delta_g2: string;
  gamma_abc_g1: [string, string];
  gamma_g2: string;
};
