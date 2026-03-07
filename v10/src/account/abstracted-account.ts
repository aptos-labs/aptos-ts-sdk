// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 } from "@noble/hashes/sha3";
import { Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "../core/account-address.js";
import { ACCOUNT_ABSTRACTION_SIGNING_DATA_SALT } from "../core/constants.js";
import { AbstractPublicKey, AbstractSignature } from "../crypto/abstraction.js";
import { SigningScheme } from "../crypto/types.js";
import type { HexInput } from "../hex/index.js";
import { AccountAbstractionMessage, AccountAuthenticatorAbstraction } from "../transactions/authenticator.js";
import { generateSigningMessage, generateSigningMessageForTransaction } from "../transactions/signing-message.js";
import type { AnyRawTransaction } from "../transactions/types.js";
import type { Ed25519Account } from "./ed25519-account.js";
import type { Account } from "./types.js";

function isValidFunctionInfo(functionInfo: string): boolean {
  const parts = functionInfo.split("::");
  return parts.length === 3 && AccountAddress.isValid({ input: parts[0] }).valid;
}

export class AbstractedAccount implements Account {
  readonly publicKey: AbstractPublicKey;
  readonly accountAddress: AccountAddress;
  readonly authenticationFunction: string;
  readonly signingScheme = SigningScheme.SingleKey;

  sign: (message: HexInput) => AbstractSignature;

  constructor(args: {
    accountAddress: AccountAddress;
    signer: (digest: HexInput) => Uint8Array;
    authenticationFunction: string;
  }) {
    const { signer, accountAddress, authenticationFunction } = args;

    if (!isValidFunctionInfo(authenticationFunction)) {
      throw new Error(`Invalid authentication function ${authenticationFunction} passed into AbstractedAccount`);
    }

    this.authenticationFunction = authenticationFunction;
    this.accountAddress = accountAddress;
    this.publicKey = new AbstractPublicKey(this.accountAddress);
    this.sign = (digest: HexInput) => new AbstractSignature(signer(digest));
  }

  static fromPermissionedSigner(args: { signer: Ed25519Account; accountAddress?: AccountAddress }): AbstractedAccount {
    const { signer, accountAddress } = args;
    return new AbstractedAccount({
      signer: (digest: HexInput) => {
        const serializer = new Serializer();
        signer.publicKey.serialize(serializer);
        signer.sign(digest).serialize(serializer);
        return serializer.toUint8Array();
      },
      accountAddress: accountAddress ?? signer.accountAddress,
      authenticationFunction: "0x1::permissioned_delegation::authenticate",
    });
  }

  static generateAccountAbstractionMessage(message: HexInput, functionInfo: string): HexInput {
    const accountAbstractionMessage = new AccountAbstractionMessage(message, functionInfo);
    return generateSigningMessage(accountAbstractionMessage.bcsToBytes(), ACCOUNT_ABSTRACTION_SIGNING_DATA_SALT);
  }

  signWithAuthenticator(message: HexInput): AccountAuthenticatorAbstraction {
    return new AccountAuthenticatorAbstraction(
      this.authenticationFunction,
      sha3_256(message),
      this.sign(sha3_256(message)).toUint8Array(),
    );
  }

  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorAbstraction {
    const message = AbstractedAccount.generateAccountAbstractionMessage(
      generateSigningMessageForTransaction(transaction),
      this.authenticationFunction,
    );
    return this.signWithAuthenticator(message);
  }

  signTransaction(transaction: AnyRawTransaction): AbstractSignature {
    return this.sign(generateSigningMessageForTransaction(transaction));
  }

  setSigner(signer: (digest: HexInput) => HexInput): void {
    this.sign = (digest: HexInput) => new AbstractSignature(signer(digest));
  }
}

// ── DerivableAbstractedAccount ──

export class DerivableAbstractedAccount extends AbstractedAccount {
  readonly abstractPublicKey: Uint8Array;
  static readonly ADDRESS_DOMAIN_SEPARATOR: number = 5;

  constructor(args: {
    signer: (digest: HexInput) => Uint8Array;
    authenticationFunction: string;
    abstractPublicKey: Uint8Array;
  }) {
    const { signer, authenticationFunction, abstractPublicKey } = args;
    const daaAccountAddress = new AccountAddress(
      DerivableAbstractedAccount.computeAccountAddress(authenticationFunction, abstractPublicKey),
    );
    super({ accountAddress: daaAccountAddress, signer, authenticationFunction });
    this.abstractPublicKey = abstractPublicKey;
  }

  static computeAccountAddress(functionInfo: string, accountIdentifier: Uint8Array): Uint8Array {
    if (!isValidFunctionInfo(functionInfo)) {
      throw new Error(`Invalid authentication function ${functionInfo} passed into DerivableAbstractedAccount`);
    }
    const [moduleAddress, moduleName, functionName] = functionInfo.split("::");

    const hash = sha3_256.create();
    const serializer = new Serializer();
    AccountAddress.fromString(moduleAddress).serialize(serializer);
    serializer.serializeStr(moduleName);
    serializer.serializeStr(functionName);
    hash.update(serializer.toUint8Array());

    const s2 = new Serializer();
    s2.serializeBytes(accountIdentifier);
    hash.update(s2.toUint8Array());

    hash.update(new Uint8Array([DerivableAbstractedAccount.ADDRESS_DOMAIN_SEPARATOR]));

    return hash.digest();
  }

  signWithAuthenticator(message: HexInput): AccountAuthenticatorAbstraction {
    return new AccountAuthenticatorAbstraction(
      this.authenticationFunction,
      sha3_256(message),
      this.sign(sha3_256(message)).value,
      this.abstractPublicKey,
    );
  }
}
