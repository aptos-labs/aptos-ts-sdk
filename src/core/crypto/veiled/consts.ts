/**
 * Number of chunks for veiled balance
 */
export const VEILED_BALANCE_CHUNK_SIZE = 4;

/**
 * Max bits of amount in a chunk for normalized veiled balance
 */
export const CHUNK_BITS = 32;
export const CHUNK_BITS_BI = BigInt(CHUNK_BITS);

export const PROOF_CHUNK_SIZE = 32; // bytes

export const SIGMA_PROOF_WITHDRAW_SIZE = PROOF_CHUNK_SIZE * 21; // bytes

export const SIGMA_PROOF_TRANSFER_SIZE = PROOF_CHUNK_SIZE * 33; // bytes

export const SIGMA_PROOF_KEY_ROTATION_SIZE = PROOF_CHUNK_SIZE * 23; // bytes

export const SIGMA_PROOF_NORMALIZATION_SIZE = PROOF_CHUNK_SIZE * 21; // bytes
