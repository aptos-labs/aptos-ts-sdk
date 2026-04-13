// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Registers keyless public key and signature variants with the AnyKey registry.
 * This file is imported by modules that need keyless support, ensuring
 * the keyless deserializers are available without requiring singleKey.ts
 * to have a compile-time dependency on keyless/poseidon.
 */

import { AnyPublicKeyVariant, AnySignatureVariant } from "../../types";
import { registerPublicKeyVariant, registerSignatureVariant } from "./anyKeyRegistry";
import { KeylessPublicKey, KeylessSignature } from "./keyless";
import { FederatedKeylessPublicKey } from "./federatedKeyless";
import type { PublicKey } from "./publicKey";
import type { Signature } from "./signature";

registerPublicKeyVariant(
  AnyPublicKeyVariant.Keyless,
  (deserializer) => KeylessPublicKey.deserialize(deserializer),
  (key: PublicKey) => (key instanceof KeylessPublicKey ? AnyPublicKeyVariant.Keyless : undefined),
);

registerPublicKeyVariant(
  AnyPublicKeyVariant.FederatedKeyless,
  (deserializer) => FederatedKeylessPublicKey.deserialize(deserializer),
  (key: PublicKey) => (key instanceof FederatedKeylessPublicKey ? AnyPublicKeyVariant.FederatedKeyless : undefined),
);

registerSignatureVariant(
  AnySignatureVariant.Keyless,
  (deserializer) => KeylessSignature.deserialize(deserializer),
  (sig: Signature) => (sig instanceof KeylessSignature ? AnySignatureVariant.Keyless : undefined),
);
