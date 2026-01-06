// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Registry for optional crypto types (like Keyless) to enable tree-shaking.
 *
 * This registry allows optional modules (like keyless authentication) to register
 * their deserializers at runtime, enabling the core SDK to be used without
 * pulling in heavy dependencies like poseidon-lite when keyless is not needed.
 *
 * @internal
 */

import type { Deserializer } from "../../bcs";
import type { PublicKey } from "./publicKey";
import type { Signature } from "./signature";
import { AnyPublicKeyVariant, AnySignatureVariant } from "../../types";

/**
 * Type for a public key deserializer function
 * @internal
 */
export type PublicKeyDeserializer = (deserializer: Deserializer) => PublicKey;

/**
 * Type for a signature deserializer function
 * @internal
 */
export type SignatureDeserializer = (deserializer: Deserializer) => Signature;

/**
 * Type for an instanceof checker function
 * @internal
 */
export type InstanceChecker<T> = (obj: unknown) => obj is T;

/**
 * Registry entry for a public key type
 * @internal
 */
export interface PublicKeyRegistryEntry {
  deserialize: PublicKeyDeserializer;
  isInstance: InstanceChecker<PublicKey>;
  variant: AnyPublicKeyVariant;
}

/**
 * Registry entry for a signature type
 * @internal
 */
export interface SignatureRegistryEntry {
  deserialize: SignatureDeserializer;
  isInstance: InstanceChecker<Signature>;
  variant: AnySignatureVariant;
}

// Registries for optional crypto types
const publicKeyRegistry = new Map<AnyPublicKeyVariant, PublicKeyRegistryEntry>();
const signatureRegistry = new Map<AnySignatureVariant, SignatureRegistryEntry>();

// Instance checkers (for determining variant in constructor)
const publicKeyInstanceCheckers: Array<{
  check: InstanceChecker<PublicKey>;
  variant: AnyPublicKeyVariant;
}> = [];
const signatureInstanceCheckers: Array<{
  check: InstanceChecker<Signature>;
  variant: AnySignatureVariant;
}> = [];

/**
 * Register a public key type for deserialization
 * @internal
 */
export function registerPublicKeyType(entry: PublicKeyRegistryEntry): void {
  publicKeyRegistry.set(entry.variant, entry);
  publicKeyInstanceCheckers.push({ check: entry.isInstance, variant: entry.variant });
}

/**
 * Register a signature type for deserialization
 * @internal
 */
export function registerSignatureType(entry: SignatureRegistryEntry): void {
  signatureRegistry.set(entry.variant, entry);
  signatureInstanceCheckers.push({ check: entry.isInstance, variant: entry.variant });
}

/**
 * Get the registered deserializer for a public key variant
 * @internal
 */
export function getPublicKeyDeserializer(variant: AnyPublicKeyVariant): PublicKeyDeserializer | undefined {
  return publicKeyRegistry.get(variant)?.deserialize;
}

/**
 * Get the registered deserializer for a signature variant
 * @internal
 */
export function getSignatureDeserializer(variant: AnySignatureVariant): SignatureDeserializer | undefined {
  return signatureRegistry.get(variant)?.deserialize;
}

/**
 * Check if a public key is a registered optional type and return its variant
 * @internal
 */
export function getRegisteredPublicKeyVariant(publicKey: PublicKey): AnyPublicKeyVariant | undefined {
  for (const { check, variant } of publicKeyInstanceCheckers) {
    if (check(publicKey)) {
      return variant;
    }
  }
  return undefined;
}

/**
 * Check if a signature is a registered optional type and return its variant
 * @internal
 */
export function getRegisteredSignatureVariant(signature: Signature): AnySignatureVariant | undefined {
  for (const { check, variant } of signatureInstanceCheckers) {
    if (check(signature)) {
      return variant;
    }
  }
  return undefined;
}
