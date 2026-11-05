// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { SigningSchemeInput } from "../../types/index.js";
import type { PrivateKeyInput } from "./singleKey.js";

export type SingleKeySchemeHandler = {
  generate: () => PrivateKeyInput;
  fromDerivationPath: (path: string, mnemonic: string) => PrivateKeyInput;
  isPrivateKey: (value: unknown) => value is PrivateKeyInput;
};

const singleKeySchemeHandlers = new Map<SigningSchemeInput, SingleKeySchemeHandler>();

export function registerSingleKeyScheme(scheme: SigningSchemeInput, handler: SingleKeySchemeHandler): void {
  singleKeySchemeHandlers.set(scheme, handler);
}

export function getSingleKeySchemeHandler(scheme: SigningSchemeInput): SingleKeySchemeHandler | undefined {
  return singleKeySchemeHandlers.get(scheme);
}

export function isRegisteredSingleKeyPrivateKey(value: unknown): value is PrivateKeyInput {
  return [...singleKeySchemeHandlers.values()].some((handler) => handler.isPrivateKey(value));
}
