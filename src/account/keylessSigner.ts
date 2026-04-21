// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Lightweight keyless signer detection utility.
 * This file has no dependency on poseidon-lite or keyless crypto,
 * making it safe to import from any module.
 */

import type { AptosConfig } from "../api/aptosConfig.js";
import type { Account } from "./Account.js";

/**
 * An interface which defines if an Account utilizes Keyless signing.
 */
export interface KeylessSigner extends Account {
  checkKeylessAccountValidity(aptosConfig: AptosConfig): Promise<void>;
  /**
   * Waits for any proofs on the KeylessAccount to be fetched. Present on
   * `AbstractKeylessAccount` subclasses; exposed here so modules that must
   * avoid a compile-time dependency on the keyless account classes (to keep
   * `poseidon-lite` out of their bundle) can still interact structurally.
   */
  waitForProofFetch(): Promise<void>;
}

export function isKeylessSigner(obj: any): obj is KeylessSigner {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj.checkKeylessAccountValidity === "function" &&
    typeof obj.waitForProofFetch === "function"
  );
}
