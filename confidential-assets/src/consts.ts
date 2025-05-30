export const PROOF_CHUNK_SIZE = 32; // bytes

export const SIGMA_PROOF_WITHDRAW_SIZE = PROOF_CHUNK_SIZE * 21; // bytes

export const SIGMA_PROOF_TRANSFER_SIZE = PROOF_CHUNK_SIZE * 33; // bytes

export const SIGMA_PROOF_KEY_ROTATION_SIZE = PROOF_CHUNK_SIZE * 23; // bytes

export const SIGMA_PROOF_NORMALIZATION_SIZE = PROOF_CHUNK_SIZE * 21; // bytes

/** For now we only deploy to devnet as part of cedra-experimental, which lives at 0x7. */
export const DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS = "0x7";
export const MODULE_NAME = "confidential_asset";
