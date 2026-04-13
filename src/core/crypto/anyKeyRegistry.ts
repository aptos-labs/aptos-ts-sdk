// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Registry for AnyPublicKey and AnySignature variant handlers.
 *
 * This allows keyless (and future) variants to register themselves at runtime,
 * so that singleKey.ts does not need a compile-time dependency on keyless/poseidon.
 * When the keyless module is imported, it registers its deserializers and instanceof
 * checkers here. If keyless is never imported, these variants remain unregistered
 * and deserialization will throw a clear error.
 */

import type { Deserializer } from "../../bcs/deserializer";
import type { PublicKey } from "./publicKey";
import type { Signature } from "./signature";

export type PublicKeyDeserializer = (deserializer: Deserializer) => PublicKey;
export type SignatureDeserializer = (deserializer: Deserializer) => Signature;
export type VariantDetector = (key: PublicKey) => number | undefined;
export type SignatureVariantDetector = (sig: Signature) => number | undefined;

const publicKeyDeserializers = new Map<number, PublicKeyDeserializer>();
const signatureDeserializers = new Map<number, SignatureDeserializer>();
const publicKeyVariantDetectors: VariantDetector[] = [];
const signatureVariantDetectors: SignatureVariantDetector[] = [];

/**
 * Register a deserializer for a public key variant.
 * Called by modules that define new AnyPublicKey variants (e.g., keyless).
 */
export function registerPublicKeyVariant(
  variant: number,
  deserializer: PublicKeyDeserializer,
  detector: VariantDetector,
): void {
  publicKeyDeserializers.set(variant, deserializer);
  publicKeyVariantDetectors.push(detector);
}

/**
 * Register a deserializer for a signature variant.
 * Called by modules that define new AnySignature variants (e.g., keyless).
 */
export function registerSignatureVariant(
  variant: number,
  deserializer: SignatureDeserializer,
  detector: SignatureVariantDetector,
): void {
  signatureDeserializers.set(variant, deserializer);
  signatureVariantDetectors.push(detector);
}

/**
 * Look up a registered public key deserializer by variant index.
 */
export function getPublicKeyDeserializer(variant: number): PublicKeyDeserializer | undefined {
  return publicKeyDeserializers.get(variant);
}

/**
 * Look up a registered signature deserializer by variant index.
 */
export function getSignatureDeserializer(variant: number): SignatureDeserializer | undefined {
  return signatureDeserializers.get(variant);
}

/**
 * Detect the variant for a public key using registered detectors.
 * Returns the variant number, or undefined if no detector matches.
 */
export function detectPublicKeyVariant(key: PublicKey): number | undefined {
  for (const detector of publicKeyVariantDetectors) {
    const variant = detector(key);
    if (variant !== undefined) return variant;
  }
  return undefined;
}

/**
 * Detect the variant for a signature using registered detectors.
 * Returns the variant number, or undefined if no detector matches.
 */
export function detectSignatureVariant(sig: Signature): number | undefined {
  for (const detector of signatureVariantDetectors) {
    const variant = detector(sig);
    if (variant !== undefined) return variant;
  }
  return undefined;
}
