// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AuthenticationKey } from "../core/authentication-key.js";
import { Ed25519PrivateKey } from "../crypto/ed25519.js";
import type { AccountPublicKey } from "../crypto/public-key.js";
import { SigningSchemeInput } from "../crypto/types.js";
import { Ed25519Account } from "./ed25519-account.js";
import { SingleKeyAccount } from "./single-key-account.js";
import type {
  Account,
  CreateAccountFromPrivateKeyArgs,
  CreateEd25519AccountFromPrivateKeyArgs,
  CreateSingleKeyAccountFromPrivateKeyArgs,
  GenerateAccountArgs,
  GenerateEd25519AccountArgs,
  GenerateEd25519SingleKeyAccountArgs,
  GenerateSingleKeyAccountArgs,
  PrivateKeyFromDerivationPathArgs,
} from "./types.js";

// ── generateAccount ──

export function generateAccount(args?: GenerateEd25519AccountArgs): Ed25519Account;
export function generateAccount(args: GenerateEd25519SingleKeyAccountArgs): SingleKeyAccount;
export function generateAccount(args: GenerateSingleKeyAccountArgs): SingleKeyAccount;
export function generateAccount(args: GenerateAccountArgs): Account;
export function generateAccount(args: GenerateAccountArgs = {}): Account {
  const { scheme = SigningSchemeInput.Ed25519, legacy = true } = args;
  if (scheme === SigningSchemeInput.Ed25519 && legacy) {
    return Ed25519Account.generate();
  }
  return SingleKeyAccount.generate({ scheme });
}

// ── accountFromPrivateKey ──

export function accountFromPrivateKey(args: CreateEd25519AccountFromPrivateKeyArgs): Ed25519Account;
export function accountFromPrivateKey(args: CreateSingleKeyAccountFromPrivateKeyArgs): SingleKeyAccount;
export function accountFromPrivateKey(args: CreateAccountFromPrivateKeyArgs): Account;
export function accountFromPrivateKey(args: CreateAccountFromPrivateKeyArgs): Account {
  const { privateKey, address, legacy = true } = args;
  if (privateKey instanceof Ed25519PrivateKey && legacy) {
    return new Ed25519Account({ privateKey, address });
  }
  return new SingleKeyAccount({ privateKey, address });
}

// ── accountFromDerivationPath ──

export function accountFromDerivationPath(
  args: GenerateEd25519AccountArgs & PrivateKeyFromDerivationPathArgs,
): Ed25519Account;
export function accountFromDerivationPath(
  args: GenerateEd25519SingleKeyAccountArgs & PrivateKeyFromDerivationPathArgs,
): SingleKeyAccount;
export function accountFromDerivationPath(
  args: GenerateSingleKeyAccountArgs & PrivateKeyFromDerivationPathArgs,
): SingleKeyAccount;
export function accountFromDerivationPath(args: GenerateAccountArgs & PrivateKeyFromDerivationPathArgs): Account;
export function accountFromDerivationPath(args: GenerateAccountArgs & PrivateKeyFromDerivationPathArgs): Account {
  const { scheme = SigningSchemeInput.Ed25519, mnemonic, path, legacy = true } = args;
  if (scheme === SigningSchemeInput.Ed25519 && legacy) {
    return Ed25519Account.fromDerivationPath({ mnemonic, path });
  }
  return SingleKeyAccount.fromDerivationPath({ scheme, mnemonic, path });
}

// ── authKey ──

export function authKey(args: { publicKey: AccountPublicKey }): AuthenticationKey {
  return args.publicKey.authKey() as AuthenticationKey;
}
