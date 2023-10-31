/**
 * Transaction Authenticator enum as they are represented in Rust
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/types/src/transaction/authenticator.rs#L414}
 */
export enum AccountAuthenticatorVariant {
  LegacyEd25519 = 0,
  LegacyMultiEd25519 = 1,
  SingleKey = 2,
  MultiKey = 3,
}
