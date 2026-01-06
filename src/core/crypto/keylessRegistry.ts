// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Keyless type registration for AnyPublicKey/AnySignature deserialization.
 *
 * This module registers the keyless types with the anyKey registry, enabling
 * deserialization of keyless public keys and signatures in AnyPublicKey/AnySignature.
 *
 * This file is automatically imported when using the main SDK entry point,
 * but NOT when using the lite entry point (for tree-shaking).
 *
 * @internal
 */

import { AnyPublicKeyVariant, AnySignatureVariant } from "../../types";
import { registerPublicKeyType, registerSignatureType } from "./anyKeyRegistry";
import { KeylessPublicKey, KeylessSignature } from "./keyless";
import { FederatedKeylessPublicKey } from "./federatedKeyless";

// Register Keyless public key type
registerPublicKeyType({
  variant: AnyPublicKeyVariant.Keyless,
  deserialize: (deserializer) => KeylessPublicKey.deserialize(deserializer),
  isInstance: (obj): obj is KeylessPublicKey => obj instanceof KeylessPublicKey,
});

// Register FederatedKeyless public key type
registerPublicKeyType({
  variant: AnyPublicKeyVariant.FederatedKeyless,
  deserialize: (deserializer) => FederatedKeylessPublicKey.deserialize(deserializer),
  isInstance: (obj): obj is FederatedKeylessPublicKey => obj instanceof FederatedKeylessPublicKey,
});

// Register Keyless signature type
registerSignatureType({
  variant: AnySignatureVariant.Keyless,
  deserialize: (deserializer) => KeylessSignature.deserialize(deserializer),
  isInstance: (obj): obj is KeylessSignature => obj instanceof KeylessSignature,
});
