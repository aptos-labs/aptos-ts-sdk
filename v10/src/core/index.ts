export * from "./account-address.js";
export * from "./authentication-key.js";
export * from "./constants.js";
export {
  AptosApiError,
  KeylessError,
  KeylessErrorCategory,
  KeylessErrorResolutionTip,
  KeylessErrorType,
} from "./errors.js";
export * from "./network.js";
export * from "./type-tag.js";

// Register auth key derivation factory for crypto module.
// This breaks the circular dep: crypto can't import core, but core can import crypto.
import { registerAuthKeyFactory } from "../crypto/public-key.js";
import { AuthenticationKey } from "./authentication-key.js";

registerAuthKeyFactory((scheme, publicKeyBytes) =>
  AuthenticationKey.fromSchemeAndBytes({ scheme, input: publicKeyBytes }),
);
