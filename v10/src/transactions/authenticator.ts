// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "../core/account-address.js";
import { Ed25519PublicKey, Ed25519Signature } from "../crypto/ed25519.js";
import { MultiEd25519PublicKey, MultiEd25519Signature } from "../crypto/multi-ed25519.js";
import { MultiKey, MultiKeySignature } from "../crypto/multi-key.js";
import { AnyPublicKey, AnySignature } from "../crypto/single-key.js";
import type { HexInput } from "../hex/hex.js";
import { Hex } from "../hex/hex.js";
import type { MoveFunctionId } from "./types.js";
import {
  AASigningDataVariant,
  AbstractAuthenticationDataVariant,
  AccountAuthenticatorVariant,
  TransactionAuthenticatorVariant,
} from "./types.js";

// ── Helper functions ──

function getFunctionParts(functionArg: MoveFunctionId) {
  const funcNameParts = functionArg.split("::");
  if (funcNameParts.length !== 3) {
    throw new Error(`Invalid function ${functionArg}`);
  }
  return {
    moduleAddress: funcNameParts[0],
    moduleName: funcNameParts[1],
    functionName: funcNameParts[2],
  };
}

function isValidFunctionInfo(functionInfo: string): boolean {
  const parts = functionInfo.split("::");
  return parts.length === 3 && AccountAddress.isValid({ input: parts[0] }).valid;
}

// ── AccountAuthenticator ──

export abstract class AccountAuthenticator extends Serializable {
  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): AccountAuthenticator {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case AccountAuthenticatorVariant.Ed25519:
        return AccountAuthenticatorEd25519.load(deserializer);
      case AccountAuthenticatorVariant.MultiEd25519:
        return AccountAuthenticatorMultiEd25519.load(deserializer);
      case AccountAuthenticatorVariant.SingleKey:
        return AccountAuthenticatorSingleKey.load(deserializer);
      case AccountAuthenticatorVariant.MultiKey:
        return AccountAuthenticatorMultiKey.load(deserializer);
      case AccountAuthenticatorVariant.NoAccountAuthenticator:
        return AccountAuthenticatorNoAccountAuthenticator.load(deserializer);
      case AccountAuthenticatorVariant.Abstraction:
        return AccountAuthenticatorAbstraction.load(deserializer);
      default:
        throw new Error(`Unknown variant index for AccountAuthenticator: ${index}`);
    }
  }

  isEd25519(): this is AccountAuthenticatorEd25519 {
    return this instanceof AccountAuthenticatorEd25519;
  }

  isMultiEd25519(): this is AccountAuthenticatorMultiEd25519 {
    return this instanceof AccountAuthenticatorMultiEd25519;
  }

  isSingleKey(): this is AccountAuthenticatorSingleKey {
    return this instanceof AccountAuthenticatorSingleKey;
  }

  isMultiKey(): this is AccountAuthenticatorMultiKey {
    return this instanceof AccountAuthenticatorMultiKey;
  }
}

// ── AccountAuthenticatorEd25519 ──

export class AccountAuthenticatorEd25519 extends AccountAuthenticator {
  public readonly public_key: Ed25519PublicKey;
  public readonly signature: Ed25519Signature;

  constructor(public_key: Ed25519PublicKey, signature: Ed25519Signature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.Ed25519);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): AccountAuthenticatorEd25519 {
    const public_key = Ed25519PublicKey.deserialize(deserializer);
    const signature = Ed25519Signature.deserialize(deserializer);
    return new AccountAuthenticatorEd25519(public_key, signature);
  }
}

// ── AccountAuthenticatorMultiEd25519 ──

export class AccountAuthenticatorMultiEd25519 extends AccountAuthenticator {
  public readonly public_key: MultiEd25519PublicKey;
  public readonly signature: MultiEd25519Signature;

  constructor(public_key: MultiEd25519PublicKey, signature: MultiEd25519Signature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.MultiEd25519);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): AccountAuthenticatorMultiEd25519 {
    const public_key = MultiEd25519PublicKey.deserialize(deserializer);
    const signature = MultiEd25519Signature.deserialize(deserializer);
    return new AccountAuthenticatorMultiEd25519(public_key, signature);
  }
}

// ── AccountAuthenticatorSingleKey ──

export class AccountAuthenticatorSingleKey extends AccountAuthenticator {
  public readonly public_key: AnyPublicKey;
  public readonly signature: AnySignature;

  constructor(public_key: AnyPublicKey, signature: AnySignature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.SingleKey);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): AccountAuthenticatorSingleKey {
    const public_key = AnyPublicKey.deserialize(deserializer);
    const signature = AnySignature.deserialize(deserializer);
    return new AccountAuthenticatorSingleKey(public_key, signature);
  }
}

// ── AccountAuthenticatorMultiKey ──

export class AccountAuthenticatorMultiKey extends AccountAuthenticator {
  public readonly public_keys: MultiKey;
  public readonly signatures: MultiKeySignature;

  constructor(public_keys: MultiKey, signatures: MultiKeySignature) {
    super();
    this.public_keys = public_keys;
    this.signatures = signatures;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.MultiKey);
    this.public_keys.serialize(serializer);
    this.signatures.serialize(serializer);
  }

  static load(deserializer: Deserializer): AccountAuthenticatorMultiKey {
    const public_keys = MultiKey.deserialize(deserializer);
    const signatures = MultiKeySignature.deserialize(deserializer);
    return new AccountAuthenticatorMultiKey(public_keys, signatures);
  }
}

// ── AccountAuthenticatorNoAccountAuthenticator ──

export class AccountAuthenticatorNoAccountAuthenticator extends AccountAuthenticator {
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.NoAccountAuthenticator);
  }

  static load(_deserializer: Deserializer): AccountAuthenticatorNoAccountAuthenticator {
    return new AccountAuthenticatorNoAccountAuthenticator();
  }
}

// ── AccountAuthenticatorAbstraction ──

export class AccountAuthenticatorAbstraction extends AccountAuthenticator {
  public readonly functionInfo: string;
  public readonly signingMessageDigest: Hex;
  public readonly abstractionSignature: Uint8Array;
  public readonly accountIdentity?: Uint8Array;

  constructor(
    functionInfo: string,
    signingMessageDigest: HexInput,
    abstractionSignature: Uint8Array,
    accountIdentity?: Uint8Array,
  ) {
    super();
    if (!isValidFunctionInfo(functionInfo)) {
      throw new Error(`Invalid function info ${functionInfo} passed into AccountAuthenticatorAbstraction`);
    }
    this.functionInfo = functionInfo;
    this.abstractionSignature = abstractionSignature;
    this.signingMessageDigest = Hex.fromHexInput(Hex.fromHexInput(signingMessageDigest).toUint8Array());
    this.accountIdentity = accountIdentity;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.Abstraction);
    const { moduleAddress, moduleName, functionName } = getFunctionParts(this.functionInfo as MoveFunctionId);
    AccountAddress.fromString(moduleAddress).serialize(serializer);
    serializer.serializeStr(moduleName);
    serializer.serializeStr(functionName);
    if (this.accountIdentity) {
      serializer.serializeU32AsUleb128(AbstractAuthenticationDataVariant.DerivableV1);
    } else {
      serializer.serializeU32AsUleb128(AbstractAuthenticationDataVariant.V1);
    }
    serializer.serializeBytes(this.signingMessageDigest.toUint8Array());
    if (this.accountIdentity) {
      serializer.serializeBytes(this.abstractionSignature);
    } else {
      serializer.serializeFixedBytes(this.abstractionSignature);
    }
    if (this.accountIdentity) {
      serializer.serializeBytes(this.accountIdentity);
    }
  }

  static load(deserializer: Deserializer): AccountAuthenticatorAbstraction {
    const moduleAddress = AccountAddress.deserialize(deserializer);
    const moduleName = deserializer.deserializeStr();
    const functionName = deserializer.deserializeStr();
    const variant = deserializer.deserializeUleb128AsU32();
    const signingMessageDigest = deserializer.deserializeBytes();

    if (variant === AbstractAuthenticationDataVariant.V1) {
      const abstractionSignature = deserializer.deserializeFixedBytes(deserializer.remaining());
      return new AccountAuthenticatorAbstraction(
        `${moduleAddress}::${moduleName}::${functionName}`,
        signingMessageDigest,
        abstractionSignature,
      );
    }
    if (variant === AbstractAuthenticationDataVariant.DerivableV1) {
      const abstractionSignature = deserializer.deserializeBytes();
      const abstractPublicKey = deserializer.deserializeBytes();
      return new AccountAuthenticatorAbstraction(
        `${moduleAddress}::${moduleName}::${functionName}`,
        signingMessageDigest,
        abstractionSignature,
        abstractPublicKey,
      );
    }
    throw new Error(`Unknown variant index for AccountAuthenticatorAbstraction: ${variant}`);
  }
}

// ── AccountAbstractionMessage ──

export class AccountAbstractionMessage extends Serializable {
  public readonly originalSigningMessage: Hex;
  public readonly functionInfo: string;

  constructor(originalSigningMessage: HexInput, functionInfo: string) {
    super();
    this.originalSigningMessage = Hex.fromHexInput(Hex.fromHexInput(originalSigningMessage).toUint8Array());
    this.functionInfo = functionInfo;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AASigningDataVariant.V1);
    serializer.serializeBytes(this.originalSigningMessage.toUint8Array());
    const { moduleAddress, moduleName, functionName } = getFunctionParts(this.functionInfo as MoveFunctionId);
    AccountAddress.fromString(moduleAddress).serialize(serializer);
    serializer.serializeStr(moduleName);
    serializer.serializeStr(functionName);
  }

  static deserialize(deserializer: Deserializer): AccountAbstractionMessage {
    const variant = deserializer.deserializeUleb128AsU32();
    if (variant !== AASigningDataVariant.V1) {
      throw new Error(`Unknown variant index for AccountAbstractionMessage: ${variant}`);
    }
    const originalSigningMessage = deserializer.deserializeBytes();
    const functionInfoModuleAddress = AccountAddress.deserialize(deserializer);
    const functionInfoModuleName = deserializer.deserializeStr();
    const functionInfoFunctionName = deserializer.deserializeStr();
    const functionInfo = `${functionInfoModuleAddress}::${functionInfoModuleName}::${functionInfoFunctionName}`;
    return new AccountAbstractionMessage(originalSigningMessage, functionInfo);
  }
}

// ── TransactionAuthenticator ──

export abstract class TransactionAuthenticator extends Serializable {
  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): TransactionAuthenticator {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case TransactionAuthenticatorVariant.Ed25519:
        return TransactionAuthenticatorEd25519.load(deserializer);
      case TransactionAuthenticatorVariant.MultiEd25519:
        return TransactionAuthenticatorMultiEd25519.load(deserializer);
      case TransactionAuthenticatorVariant.MultiAgent:
        return TransactionAuthenticatorMultiAgent.load(deserializer);
      case TransactionAuthenticatorVariant.FeePayer:
        return TransactionAuthenticatorFeePayer.load(deserializer);
      case TransactionAuthenticatorVariant.SingleSender:
        return TransactionAuthenticatorSingleSender.load(deserializer);
      default:
        throw new Error(`Unknown variant index for TransactionAuthenticator: ${index}`);
    }
  }

  isEd25519(): this is TransactionAuthenticatorEd25519 {
    return this instanceof TransactionAuthenticatorEd25519;
  }

  isMultiEd25519(): this is TransactionAuthenticatorMultiEd25519 {
    return this instanceof TransactionAuthenticatorMultiEd25519;
  }

  isMultiAgent(): this is TransactionAuthenticatorMultiAgent {
    return this instanceof TransactionAuthenticatorMultiAgent;
  }

  isFeePayer(): this is TransactionAuthenticatorFeePayer {
    return this instanceof TransactionAuthenticatorFeePayer;
  }

  isSingleSender(): this is TransactionAuthenticatorSingleSender {
    return this instanceof TransactionAuthenticatorSingleSender;
  }
}

// ── TransactionAuthenticatorEd25519 ──

export class TransactionAuthenticatorEd25519 extends TransactionAuthenticator {
  public readonly public_key: Ed25519PublicKey;
  public readonly signature: Ed25519Signature;

  constructor(public_key: Ed25519PublicKey, signature: Ed25519Signature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionAuthenticatorVariant.Ed25519);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionAuthenticatorEd25519 {
    const public_key = Ed25519PublicKey.deserialize(deserializer);
    const signature = Ed25519Signature.deserialize(deserializer);
    return new TransactionAuthenticatorEd25519(public_key, signature);
  }
}

// ── TransactionAuthenticatorMultiEd25519 ──

export class TransactionAuthenticatorMultiEd25519 extends TransactionAuthenticator {
  public readonly public_key: MultiEd25519PublicKey;
  public readonly signature: MultiEd25519Signature;

  constructor(public_key: MultiEd25519PublicKey, signature: MultiEd25519Signature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionAuthenticatorVariant.MultiEd25519);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionAuthenticatorMultiEd25519 {
    const public_key = MultiEd25519PublicKey.deserialize(deserializer);
    const signature = MultiEd25519Signature.deserialize(deserializer);
    return new TransactionAuthenticatorMultiEd25519(public_key, signature);
  }
}

// ── TransactionAuthenticatorMultiAgent ──

export class TransactionAuthenticatorMultiAgent extends TransactionAuthenticator {
  public readonly sender: AccountAuthenticator;
  public readonly secondary_signer_addresses: Array<AccountAddress>;
  public readonly secondary_signers: Array<AccountAuthenticator>;

  constructor(
    sender: AccountAuthenticator,
    secondary_signer_addresses: Array<AccountAddress>,
    secondary_signers: Array<AccountAuthenticator>,
  ) {
    super();
    this.sender = sender;
    this.secondary_signer_addresses = secondary_signer_addresses;
    this.secondary_signers = secondary_signers;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionAuthenticatorVariant.MultiAgent);
    this.sender.serialize(serializer);
    serializer.serializeVector<AccountAddress>(this.secondary_signer_addresses);
    serializer.serializeVector<AccountAuthenticator>(this.secondary_signers);
  }

  static load(deserializer: Deserializer): TransactionAuthenticatorMultiAgent {
    const sender = AccountAuthenticator.deserialize(deserializer);
    const secondary_signer_addresses = deserializer.deserializeVector(AccountAddress);
    const secondary_signers = deserializer.deserializeVector(AccountAuthenticator);
    return new TransactionAuthenticatorMultiAgent(sender, secondary_signer_addresses, secondary_signers);
  }
}

// ── TransactionAuthenticatorFeePayer ──

export class TransactionAuthenticatorFeePayer extends TransactionAuthenticator {
  public readonly sender: AccountAuthenticator;
  public readonly secondary_signer_addresses: Array<AccountAddress>;
  public readonly secondary_signers: Array<AccountAuthenticator>;
  public readonly fee_payer: {
    address: AccountAddress;
    authenticator: AccountAuthenticator;
  };

  constructor(
    sender: AccountAuthenticator,
    secondary_signer_addresses: Array<AccountAddress>,
    secondary_signers: Array<AccountAuthenticator>,
    fee_payer: { address: AccountAddress; authenticator: AccountAuthenticator },
  ) {
    super();
    this.sender = sender;
    this.secondary_signer_addresses = secondary_signer_addresses;
    this.secondary_signers = secondary_signers;
    this.fee_payer = fee_payer;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionAuthenticatorVariant.FeePayer);
    this.sender.serialize(serializer);
    serializer.serializeVector<AccountAddress>(this.secondary_signer_addresses);
    serializer.serializeVector<AccountAuthenticator>(this.secondary_signers);
    this.fee_payer.address.serialize(serializer);
    this.fee_payer.authenticator.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionAuthenticatorFeePayer {
    const sender = AccountAuthenticator.deserialize(deserializer);
    const secondary_signer_addresses = deserializer.deserializeVector(AccountAddress);
    const secondary_signers = deserializer.deserializeVector(AccountAuthenticator);
    const address = AccountAddress.deserialize(deserializer);
    const authenticator = AccountAuthenticator.deserialize(deserializer);
    const fee_payer = { address, authenticator };
    return new TransactionAuthenticatorFeePayer(sender, secondary_signer_addresses, secondary_signers, fee_payer);
  }
}

// ── TransactionAuthenticatorSingleSender ──

export class TransactionAuthenticatorSingleSender extends TransactionAuthenticator {
  public readonly sender: AccountAuthenticator;

  constructor(sender: AccountAuthenticator) {
    super();
    this.sender = sender;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionAuthenticatorVariant.SingleSender);
    this.sender.serialize(serializer);
  }

  static load(deserializer: Deserializer): TransactionAuthenticatorSingleSender {
    const sender = AccountAuthenticator.deserialize(deserializer);
    return new TransactionAuthenticatorSingleSender(sender);
  }
}
