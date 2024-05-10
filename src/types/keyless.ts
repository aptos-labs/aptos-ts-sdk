export type ProverResponse = {
  proof: { a: string; b: string; c: string };
  public_inputs_hash: string;
  training_wheels_signature: string;
};
export type PepperFetchResponse = { signature: string; pepper: string; address: string };
