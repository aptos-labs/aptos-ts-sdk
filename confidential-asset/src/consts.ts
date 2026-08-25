/** The confidential asset module is deployed as part of aptos-framework at 0x1. */
export const DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS = "0x1";
export const MODULE_NAME = "confidential_asset";

/**
 * The framework address hosting the `account` and `keyless_account` modules used by the keyless
 * decryption-key (DK) backup entry/view functions. This is ALWAYS `0x1` and is intentionally kept
 * separate from {@link DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS}, which is configurable per
 * deployment — the `account`/`keyless_account` modules always live in the real framework.
 */
export const FRAMEWORK_MODULE_ADDRESS = "0x1";
export const ACCOUNT_MODULE_NAME = "account";
export const KEYLESS_ACCOUNT_MODULE_NAME = "keyless_account";

/**
 * Mirror of the on-chain `aptos_framework::account::MAX_ENCRYPTED_DK_BYTES`. The encrypted DK
 * ciphertext stored on-chain must not exceed this many bytes. A 32-byte DK encrypted with the
 * XChaCha20-Poly1305 AEAD is `24 (nonce) + 32 (plaintext) + 16 (tag) = 72` bytes, well under the
 * limit. Kept here as a client-side guard so over-large ciphertexts fail before submission rather
 * than as an opaque Move abort. Re-sync this if the framework constant changes.
 */
export const MAX_ENCRYPTED_DK_BYTES = 128;
