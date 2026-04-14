// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Keyless standalone functions. NOT included in the main entry point
 * to avoid pulling in poseidon-lite. Import from '@aptos-labs/ts-sdk/keyless'.
 */

export {
  getPepper,
  getProof,
  deriveKeylessAccount,
  updateFederatedKeylessJwkSetTransaction,
} from "../internal/keyless.js";

export { Keyless } from "../api/keyless.js";
export { AptosConfig } from "../api/aptosConfig.js";
