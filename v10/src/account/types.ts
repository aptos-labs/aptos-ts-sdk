// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AccountAddress, AccountAddressInput } from "../core/account-address.js";
import type { Ed25519PrivateKey } from "../crypto/ed25519.js";
import type { AccountPublicKey } from "../crypto/public-key.js";
import type { Signature } from "../crypto/signature.js";
import type { AnyPublicKey, PrivateKeyInput } from "../crypto/single-key.js";
import type { SigningScheme, SigningSchemeInput } from "../crypto/types.js";
import type { HexInput } from "../hex/index.js";
import type { AccountAuthenticator } from "../transactions/authenticator.js";
import type { AnyRawTransaction } from "../transactions/types.js";

// ── Account interface ──

export interface Account {
  readonly publicKey: AccountPublicKey;
  readonly accountAddress: AccountAddress;
  readonly signingScheme: SigningScheme;

  signWithAuthenticator(message: HexInput): AccountAuthenticator;
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticator;
  sign(message: HexInput): Signature;
  signTransaction(transaction: AnyRawTransaction): Signature;
}

// ── SingleKeySigner ──

export interface SingleKeySigner extends Account {
  getAnyPublicKey(): AnyPublicKey;
}

export function isSingleKeySigner(obj: unknown): obj is SingleKeySigner {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "getAnyPublicKey" in obj &&
    typeof (obj as any).getAnyPublicKey === "function"
  );
}

// ── KeylessSigner ──

export interface KeylessSigner extends Account {
  checkKeylessAccountValidity(...args: any[]): Promise<void>;
}

export function isKeylessSigner(obj: unknown): obj is KeylessSigner {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "checkKeylessAccountValidity" in obj &&
    typeof (obj as any).checkKeylessAccountValidity === "function"
  );
}

// ── Argument types for Account factory methods ──

export interface CreateEd25519AccountFromPrivateKeyArgs {
  privateKey: Ed25519PrivateKey;
  address?: AccountAddressInput;
  legacy?: true;
}

export interface CreateEd25519SingleKeyAccountFromPrivateKeyArgs {
  privateKey: Ed25519PrivateKey;
  address?: AccountAddressInput;
  legacy: false;
}

export interface CreateSingleKeyAccountFromPrivateKeyArgs {
  privateKey: PrivateKeyInput;
  address?: AccountAddressInput;
  legacy?: false;
}

export interface CreateAccountFromPrivateKeyArgs {
  privateKey: PrivateKeyInput;
  address?: AccountAddressInput;
  legacy?: boolean;
}

export interface GenerateEd25519AccountArgs {
  scheme?: SigningSchemeInput.Ed25519;
  legacy?: true;
}

export interface GenerateEd25519SingleKeyAccountArgs {
  scheme?: SigningSchemeInput.Ed25519;
  legacy: false;
}

export interface GenerateSingleKeyAccountArgs {
  scheme: Exclude<SigningSchemeInput, SigningSchemeInput.Ed25519>;
  legacy?: false;
}

export interface GenerateAccountArgs {
  scheme?: SigningSchemeInput;
  legacy?: boolean;
}

export interface PrivateKeyFromDerivationPathArgs {
  path: string;
  mnemonic: string;
}

// ── Union types ──

export type SingleKeySignerOrLegacyEd25519Account = SingleKeySigner | import("./ed25519-account.js").Ed25519Account;
