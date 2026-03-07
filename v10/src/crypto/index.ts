export * from "./abstraction.js";
export * from "./deserialization-utils.js";
export * from "./ed25519.js";
export * from "./ephemeral.js";
export * from "./federated-keyless.js";
export * from "./hd-key.js";
export * from "./keyless.js";
export * from "./multi-ed25519.js";
export * from "./multi-key.js";
export * from "./poseidon.js";
export * from "./private-key.js";
export * from "./proof.js";
export * from "./public-key.js";
export * from "./secp256k1.js";
export * from "./secp256r1.js";
export * from "./signature.js";
export * from "./single-key.js";
export * from "./types.js";
export * from "./utils.js";

import { FederatedKeylessPublicKey } from "./federated-keyless.js";
import { KeylessPublicKey, KeylessSignature } from "./keyless.js";
// Register keyless types so that single-key.ts can deserialize them
// without circular imports. This side-effect runs once when
// `@aptos-labs/ts-sdk/crypto` is imported.
import { registerKeylessTypes } from "./single-key.js";

registerKeylessTypes(KeylessPublicKey, FederatedKeylessPublicKey, KeylessSignature);
