// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Ed25519PublicKey } from "./ed25519";
import { MultiEd25519PublicKey } from "./multiEd25519";
import { MultiKey } from "./multiKey";
import { AnyPublicKey } from "./singleKey";

export * from "./ed25519";
export * from "./hdKey";
export * from "./multiEd25519";
export * from "./multiKey";
export * from "./secp256k1";
export * from "./singleKey";

export type PublicKeyInput = Ed25519PublicKey | MultiEd25519PublicKey | AnyPublicKey | MultiKey;
