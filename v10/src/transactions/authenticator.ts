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

/**
 * Abstract base class for per-account authenticators.
 *
 * An `AccountAuthenticator` proves that a specific account authorized the transaction.
 * The concrete subclass depends on the key scheme used by the account:
 * - {@link AccountAuthenticatorEd25519} – legacy single Ed25519 key.
 * - {@link AccountAuthenticatorMultiEd25519} – legacy k-of-n Ed25519 multi-key.
 * - {@link AccountAuthenticatorSingleKey} – modern single-key (supports Ed25519, Secp256k1, Keyless, etc.).
 * - {@link AccountAuthenticatorMultiKey} – modern k-of-n multi-key.
 * - {@link AccountAuthenticatorNoAccountAuthenticator} – placeholder when no authentication is required.
 * - {@link AccountAuthenticatorAbstraction} – account abstraction with a custom auth function.
 *
 * The variant is encoded as a ULEB128-prefixed discriminant during BCS serialization.
 */
export abstract class AccountAuthenticator extends Serializable {
  abstract serialize(serializer: Serializer): void;

  /**
   * Deserializes an `AccountAuthenticator` from BCS bytes, dispatching to the correct
   * concrete subclass based on the ULEB128 variant prefix.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns The deserialized authenticator instance.
   * @throws Error if the variant index is unknown.
   */
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

  /**
   * Returns `true` when this authenticator is an {@link AccountAuthenticatorEd25519}.
   *
   * Acts as a type-narrowing predicate.
   *
   * @returns `true` if this is an Ed25519 account authenticator.
   */
  isEd25519(): this is AccountAuthenticatorEd25519 {
    return this instanceof AccountAuthenticatorEd25519;
  }

  /**
   * Returns `true` when this authenticator is an {@link AccountAuthenticatorMultiEd25519}.
   *
   * Acts as a type-narrowing predicate.
   *
   * @returns `true` if this is a MultiEd25519 account authenticator.
   */
  isMultiEd25519(): this is AccountAuthenticatorMultiEd25519 {
    return this instanceof AccountAuthenticatorMultiEd25519;
  }

  /**
   * Returns `true` when this authenticator is an {@link AccountAuthenticatorSingleKey}.
   *
   * Acts as a type-narrowing predicate.
   *
   * @returns `true` if this is a SingleKey account authenticator.
   */
  isSingleKey(): this is AccountAuthenticatorSingleKey {
    return this instanceof AccountAuthenticatorSingleKey;
  }

  /**
   * Returns `true` when this authenticator is an {@link AccountAuthenticatorMultiKey}.
   *
   * Acts as a type-narrowing predicate.
   *
   * @returns `true` if this is a MultiKey account authenticator.
   */
  isMultiKey(): this is AccountAuthenticatorMultiKey {
    return this instanceof AccountAuthenticatorMultiKey;
  }
}

// ── AccountAuthenticatorEd25519 ──

/**
 * Per-account authenticator for legacy Ed25519 single-key accounts.
 *
 * Encapsulates an Ed25519 public key and the corresponding signature over the transaction
 * signing message.
 *
 * @example
 * ```typescript
 * const authenticator = new AccountAuthenticatorEd25519(publicKey, signature);
 * ```
 */
export class AccountAuthenticatorEd25519 extends AccountAuthenticator {
  /** The Ed25519 public key of the signing account. */
  public readonly public_key: Ed25519PublicKey;

  /** The Ed25519 signature over the transaction signing message. */
  public readonly signature: Ed25519Signature;

  /**
   * Creates a new `AccountAuthenticatorEd25519`.
   *
   * @param public_key - The signer's Ed25519 public key.
   * @param signature - The Ed25519 signature over the signing message.
   */
  constructor(public_key: Ed25519PublicKey, signature: Ed25519Signature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  /**
   * Serializes this authenticator with its variant prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.Ed25519);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  /**
   * Deserializes an `AccountAuthenticatorEd25519` from BCS bytes (after the variant prefix
   * has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `AccountAuthenticatorEd25519` instance.
   */
  static load(deserializer: Deserializer): AccountAuthenticatorEd25519 {
    const public_key = Ed25519PublicKey.deserialize(deserializer);
    const signature = Ed25519Signature.deserialize(deserializer);
    return new AccountAuthenticatorEd25519(public_key, signature);
  }
}

// ── AccountAuthenticatorMultiEd25519 ──

/**
 * Per-account authenticator for legacy k-of-n MultiEd25519 accounts.
 *
 * Encapsulates a `MultiEd25519PublicKey` (which describes the threshold and all participant
 * keys) and the corresponding aggregate signature.
 *
 * @example
 * ```typescript
 * const authenticator = new AccountAuthenticatorMultiEd25519(multiPublicKey, multiSignature);
 * ```
 */
export class AccountAuthenticatorMultiEd25519 extends AccountAuthenticator {
  /** The multi-party Ed25519 public key descriptor. */
  public readonly public_key: MultiEd25519PublicKey;

  /** The aggregate Ed25519 signature. */
  public readonly signature: MultiEd25519Signature;

  /**
   * Creates a new `AccountAuthenticatorMultiEd25519`.
   *
   * @param public_key - The multi-party Ed25519 public key descriptor.
   * @param signature - The aggregate Ed25519 signature.
   */
  constructor(public_key: MultiEd25519PublicKey, signature: MultiEd25519Signature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  /**
   * Serializes this authenticator with its variant prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.MultiEd25519);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  /**
   * Deserializes an `AccountAuthenticatorMultiEd25519` from BCS bytes (after the variant
   * prefix has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `AccountAuthenticatorMultiEd25519` instance.
   */
  static load(deserializer: Deserializer): AccountAuthenticatorMultiEd25519 {
    const public_key = MultiEd25519PublicKey.deserialize(deserializer);
    const signature = MultiEd25519Signature.deserialize(deserializer);
    return new AccountAuthenticatorMultiEd25519(public_key, signature);
  }
}

// ── AccountAuthenticatorSingleKey ──

/**
 * Per-account authenticator for modern single-key accounts.
 *
 * Uses {@link AnyPublicKey} and {@link AnySignature} wrappers that support multiple key
 * schemes (Ed25519, Secp256k1, Keyless, etc.) under a single authenticator type.
 *
 * @example
 * ```typescript
 * const authenticator = new AccountAuthenticatorSingleKey(anyPublicKey, anySignature);
 * ```
 */
export class AccountAuthenticatorSingleKey extends AccountAuthenticator {
  /** The scheme-agnostic public key of the signing account. */
  public readonly public_key: AnyPublicKey;

  /** The scheme-agnostic signature over the transaction signing message. */
  public readonly signature: AnySignature;

  /**
   * Creates a new `AccountAuthenticatorSingleKey`.
   *
   * @param public_key - The scheme-agnostic public key.
   * @param signature - The scheme-agnostic signature.
   */
  constructor(public_key: AnyPublicKey, signature: AnySignature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  /**
   * Serializes this authenticator with its variant prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.SingleKey);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  /**
   * Deserializes an `AccountAuthenticatorSingleKey` from BCS bytes (after the variant
   * prefix has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `AccountAuthenticatorSingleKey` instance.
   */
  static load(deserializer: Deserializer): AccountAuthenticatorSingleKey {
    const public_key = AnyPublicKey.deserialize(deserializer);
    const signature = AnySignature.deserialize(deserializer);
    return new AccountAuthenticatorSingleKey(public_key, signature);
  }
}

// ── AccountAuthenticatorMultiKey ──

/**
 * Per-account authenticator for modern k-of-n multi-key accounts.
 *
 * Uses {@link MultiKey} (which holds multiple {@link AnyPublicKey} instances and a threshold)
 * and {@link MultiKeySignature} (which holds the collected signatures).
 *
 * @example
 * ```typescript
 * const authenticator = new AccountAuthenticatorMultiKey(multiKey, multiKeySignature);
 * ```
 */
export class AccountAuthenticatorMultiKey extends AccountAuthenticator {
  /** The multi-key descriptor with threshold and participant public keys. */
  public readonly public_keys: MultiKey;

  /** The collected signatures from the threshold number of participants. */
  public readonly signatures: MultiKeySignature;

  /**
   * Creates a new `AccountAuthenticatorMultiKey`.
   *
   * @param public_keys - The multi-key descriptor.
   * @param signatures - The collected threshold signatures.
   */
  constructor(public_keys: MultiKey, signatures: MultiKeySignature) {
    super();
    this.public_keys = public_keys;
    this.signatures = signatures;
  }

  /**
   * Serializes this authenticator with its variant prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.MultiKey);
    this.public_keys.serialize(serializer);
    this.signatures.serialize(serializer);
  }

  /**
   * Deserializes an `AccountAuthenticatorMultiKey` from BCS bytes (after the variant prefix
   * has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `AccountAuthenticatorMultiKey` instance.
   */
  static load(deserializer: Deserializer): AccountAuthenticatorMultiKey {
    const public_keys = MultiKey.deserialize(deserializer);
    const signatures = MultiKeySignature.deserialize(deserializer);
    return new AccountAuthenticatorMultiKey(public_keys, signatures);
  }
}

// ── AccountAuthenticatorNoAccountAuthenticator ──

/**
 * A placeholder per-account authenticator that carries no cryptographic proof.
 *
 * Used in fee-payer transactions before the fee payer has signed, acting as a sentinel
 * value that the fee payer's authenticator slot is intentionally empty.
 */
export class AccountAuthenticatorNoAccountAuthenticator extends AccountAuthenticator {
  /**
   * Serializes this authenticator with its variant prefix (no additional bytes).
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.NoAccountAuthenticator);
  }

  /**
   * Deserializes an `AccountAuthenticatorNoAccountAuthenticator` from BCS bytes (after the
   * variant prefix has already been consumed).
   *
   * @param _deserializer - The BCS deserializer (not read from, included for interface consistency).
   * @returns A new `AccountAuthenticatorNoAccountAuthenticator` instance.
   */
  static load(_deserializer: Deserializer): AccountAuthenticatorNoAccountAuthenticator {
    return new AccountAuthenticatorNoAccountAuthenticator();
  }
}

// ── AccountAuthenticatorAbstraction ──

/**
 * Per-account authenticator for account abstraction (AA) accounts.
 *
 * Account abstraction allows on-chain Move functions to define custom authentication logic.
 * The authenticator captures:
 * - The Move function (`functionInfo`) that will verify the signature.
 * - A digest of the original signing message.
 * - The raw bytes produced by the custom signing logic.
 * - Optionally, an `accountIdentity` byte string used by derivable AA accounts.
 *
 * @example
 * ```typescript
 * const authenticator = new AccountAuthenticatorAbstraction(
 *   "0x1::permissioned_signer::authenticate",
 *   signingMessageDigest,
 *   abstractionSignatureBytes,
 * );
 * ```
 */
export class AccountAuthenticatorAbstraction extends AccountAuthenticator {
  /**
   * The fully-qualified Move function identifier in `<address>::<module>::<function>` format.
   *
   * This function is invoked on-chain to verify the `abstractionSignature`.
   */
  public readonly functionInfo: string;

  /** A hex-encoded digest of the original signing message. */
  public readonly signingMessageDigest: Hex;

  /** The raw signature bytes produced by the custom abstraction signing logic. */
  public readonly abstractionSignature: Uint8Array;

  /**
   * An optional byte string that identifies the abstract account.
   *
   * When present the authenticator uses the `DerivableV1` abstract authentication data
   * variant, which allows the account identity to be derived from the public key material.
   */
  public readonly accountIdentity?: Uint8Array;

  /**
   * Creates a new `AccountAuthenticatorAbstraction`.
   *
   * @param functionInfo - Fully-qualified Move function identifier used to verify the signature.
   * @param signingMessageDigest - Hex-encoded digest of the original signing message.
   * @param abstractionSignature - Raw bytes from the custom signing logic.
   * @param accountIdentity - Optional account identity bytes (enables `DerivableV1` variant).
   * @throws Error if `functionInfo` is not a valid `<address>::<module>::<function>` string.
   */
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

  /**
   * Serializes this authenticator with its variant prefix and all fields.
   *
   * The serialization format differs depending on whether `accountIdentity` is present:
   * - Without `accountIdentity`: uses the `V1` abstract authentication data variant.
   * - With `accountIdentity`: uses the `DerivableV1` variant and appends the identity bytes.
   *
   * @param serializer - The BCS serializer to write into.
   */
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
    serializer.serializeBytes(this.abstractionSignature);
    if (this.accountIdentity) {
      serializer.serializeBytes(this.accountIdentity);
    }
  }

  /**
   * Deserializes an `AccountAuthenticatorAbstraction` from BCS bytes (after the variant
   * prefix has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `AccountAuthenticatorAbstraction` instance.
   * @throws Error if the abstract authentication data variant is unknown.
   */
  static load(deserializer: Deserializer): AccountAuthenticatorAbstraction {
    const moduleAddress = AccountAddress.deserialize(deserializer);
    const moduleName = deserializer.deserializeStr();
    const functionName = deserializer.deserializeStr();
    const variant = deserializer.deserializeUleb128AsU32();
    const signingMessageDigest = deserializer.deserializeBytes();

    if (variant === AbstractAuthenticationDataVariant.V1) {
      const abstractionSignature = deserializer.deserializeBytes();
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

/**
 * The BCS-serializable signing message passed to an account abstraction auth function.
 *
 * When an account uses account abstraction, the Move `authenticate` function receives an
 * `AccountAbstractionMessage` rather than the raw transaction signing message.  It wraps
 * the original signing message bytes together with the fully-qualified Move function info
 * of the auth function itself.
 *
 * @example
 * ```typescript
 * const aaMessage = new AccountAbstractionMessage(
 *   originalSigningMessageBytes,
 *   "0x1::permissioned_signer::authenticate",
 * );
 * const digest = sha3_256(aaMessage.bcsToBytes());
 * ```
 */
export class AccountAbstractionMessage extends Serializable {
  /** The original signing message (before account abstraction wrapping). */
  public readonly originalSigningMessage: Hex;

  /**
   * The fully-qualified Move function identifier that will verify this message.
   *
   * Format: `<address>::<module>::<function>`.
   */
  public readonly functionInfo: string;

  /**
   * Creates a new `AccountAbstractionMessage`.
   *
   * @param originalSigningMessage - The raw signing message bytes (hex or Uint8Array).
   * @param functionInfo - The fully-qualified Move auth function identifier.
   */
  constructor(originalSigningMessage: HexInput, functionInfo: string) {
    super();
    this.originalSigningMessage = Hex.fromHexInput(Hex.fromHexInput(originalSigningMessage).toUint8Array());
    this.functionInfo = functionInfo;
  }

  /**
   * Serializes this message with the `V1` signing data variant prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AASigningDataVariant.V1);
    serializer.serializeBytes(this.originalSigningMessage.toUint8Array());
    const { moduleAddress, moduleName, functionName } = getFunctionParts(this.functionInfo as MoveFunctionId);
    AccountAddress.fromString(moduleAddress).serialize(serializer);
    serializer.serializeStr(moduleName);
    serializer.serializeStr(functionName);
  }

  /**
   * Deserializes an `AccountAbstractionMessage` from BCS bytes.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `AccountAbstractionMessage` instance.
   * @throws Error if the signing data variant is not `V1`.
   */
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

/**
 * Abstract base class for top-level transaction authenticators.
 *
 * A `TransactionAuthenticator` proves that all required parties have signed the transaction.
 * The concrete subclass depends on the transaction structure:
 * - {@link TransactionAuthenticatorEd25519} – single legacy Ed25519 sender.
 * - {@link TransactionAuthenticatorMultiEd25519} – single legacy MultiEd25519 sender.
 * - {@link TransactionAuthenticatorMultiAgent} – transaction with secondary signers.
 * - {@link TransactionAuthenticatorFeePayer} – transaction with a fee payer.
 * - {@link TransactionAuthenticatorSingleSender} – single modern-key sender.
 *
 * The variant is encoded as a ULEB128-prefixed discriminant during BCS serialization.
 */
export abstract class TransactionAuthenticator extends Serializable {
  abstract serialize(serializer: Serializer): void;

  /**
   * Deserializes a `TransactionAuthenticator` from BCS bytes, dispatching to the correct
   * concrete subclass based on the ULEB128 variant prefix.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns The deserialized authenticator instance.
   * @throws Error if the variant index is unknown.
   */
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

  /**
   * Returns `true` when this authenticator is a {@link TransactionAuthenticatorEd25519}.
   *
   * Acts as a type-narrowing predicate.
   *
   * @returns `true` if this is an Ed25519 transaction authenticator.
   */
  isEd25519(): this is TransactionAuthenticatorEd25519 {
    return this instanceof TransactionAuthenticatorEd25519;
  }

  /**
   * Returns `true` when this authenticator is a {@link TransactionAuthenticatorMultiEd25519}.
   *
   * Acts as a type-narrowing predicate.
   *
   * @returns `true` if this is a MultiEd25519 transaction authenticator.
   */
  isMultiEd25519(): this is TransactionAuthenticatorMultiEd25519 {
    return this instanceof TransactionAuthenticatorMultiEd25519;
  }

  /**
   * Returns `true` when this authenticator is a {@link TransactionAuthenticatorMultiAgent}.
   *
   * Acts as a type-narrowing predicate.
   *
   * @returns `true` if this is a multi-agent transaction authenticator.
   */
  isMultiAgent(): this is TransactionAuthenticatorMultiAgent {
    return this instanceof TransactionAuthenticatorMultiAgent;
  }

  /**
   * Returns `true` when this authenticator is a {@link TransactionAuthenticatorFeePayer}.
   *
   * Acts as a type-narrowing predicate.
   *
   * @returns `true` if this is a fee-payer transaction authenticator.
   */
  isFeePayer(): this is TransactionAuthenticatorFeePayer {
    return this instanceof TransactionAuthenticatorFeePayer;
  }

  /**
   * Returns `true` when this authenticator is a {@link TransactionAuthenticatorSingleSender}.
   *
   * Acts as a type-narrowing predicate.
   *
   * @returns `true` if this is a single-sender transaction authenticator.
   */
  isSingleSender(): this is TransactionAuthenticatorSingleSender {
    return this instanceof TransactionAuthenticatorSingleSender;
  }
}

// ── TransactionAuthenticatorEd25519 ──

/**
 * Top-level transaction authenticator for a single legacy Ed25519 sender.
 *
 * @example
 * ```typescript
 * const authenticator = new TransactionAuthenticatorEd25519(publicKey, signature);
 * ```
 */
export class TransactionAuthenticatorEd25519 extends TransactionAuthenticator {
  /** The Ed25519 public key of the sender. */
  public readonly public_key: Ed25519PublicKey;

  /** The Ed25519 signature over the transaction signing message. */
  public readonly signature: Ed25519Signature;

  /**
   * Creates a new `TransactionAuthenticatorEd25519`.
   *
   * @param public_key - The sender's Ed25519 public key.
   * @param signature - The Ed25519 signature over the signing message.
   */
  constructor(public_key: Ed25519PublicKey, signature: Ed25519Signature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  /**
   * Serializes this authenticator with its variant prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionAuthenticatorVariant.Ed25519);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  /**
   * Deserializes a `TransactionAuthenticatorEd25519` from BCS bytes (after the variant
   * prefix has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `TransactionAuthenticatorEd25519` instance.
   */
  static load(deserializer: Deserializer): TransactionAuthenticatorEd25519 {
    const public_key = Ed25519PublicKey.deserialize(deserializer);
    const signature = Ed25519Signature.deserialize(deserializer);
    return new TransactionAuthenticatorEd25519(public_key, signature);
  }
}

// ── TransactionAuthenticatorMultiEd25519 ──

/**
 * Top-level transaction authenticator for a single legacy MultiEd25519 sender.
 *
 * @example
 * ```typescript
 * const authenticator = new TransactionAuthenticatorMultiEd25519(multiPublicKey, multiSignature);
 * ```
 */
export class TransactionAuthenticatorMultiEd25519 extends TransactionAuthenticator {
  /** The multi-party Ed25519 public key descriptor. */
  public readonly public_key: MultiEd25519PublicKey;

  /** The aggregate Ed25519 signature. */
  public readonly signature: MultiEd25519Signature;

  /**
   * Creates a new `TransactionAuthenticatorMultiEd25519`.
   *
   * @param public_key - The multi-party Ed25519 public key descriptor.
   * @param signature - The aggregate Ed25519 signature.
   */
  constructor(public_key: MultiEd25519PublicKey, signature: MultiEd25519Signature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  /**
   * Serializes this authenticator with its variant prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionAuthenticatorVariant.MultiEd25519);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  /**
   * Deserializes a `TransactionAuthenticatorMultiEd25519` from BCS bytes (after the variant
   * prefix has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `TransactionAuthenticatorMultiEd25519` instance.
   */
  static load(deserializer: Deserializer): TransactionAuthenticatorMultiEd25519 {
    const public_key = MultiEd25519PublicKey.deserialize(deserializer);
    const signature = MultiEd25519Signature.deserialize(deserializer);
    return new TransactionAuthenticatorMultiEd25519(public_key, signature);
  }
}

// ── TransactionAuthenticatorMultiAgent ──

/**
 * Top-level transaction authenticator for multi-agent transactions.
 *
 * Carries the primary sender's authenticator as well as the authenticators for each
 * secondary signer.  The secondary signer addresses are also included to bind each
 * authenticator to its corresponding account.
 *
 * @example
 * ```typescript
 * const authenticator = new TransactionAuthenticatorMultiAgent(
 *   senderAuthenticator,
 *   [secondaryAddress],
 *   [secondaryAuthenticator],
 * );
 * ```
 */
export class TransactionAuthenticatorMultiAgent extends TransactionAuthenticator {
  /** The primary sender's per-account authenticator. */
  public readonly sender: AccountAuthenticator;

  /** Ordered list of secondary signer addresses (matches `secondary_signers`). */
  public readonly secondary_signer_addresses: Array<AccountAddress>;

  /** Ordered list of secondary signer per-account authenticators. */
  public readonly secondary_signers: Array<AccountAuthenticator>;

  /**
   * Creates a new `TransactionAuthenticatorMultiAgent`.
   *
   * @param sender - The primary sender's authenticator.
   * @param secondary_signer_addresses - Addresses of the secondary signers.
   * @param secondary_signers - Per-account authenticators for each secondary signer.
   */
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

  /**
   * Serializes this authenticator with its variant prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionAuthenticatorVariant.MultiAgent);
    this.sender.serialize(serializer);
    serializer.serializeVector<AccountAddress>(this.secondary_signer_addresses);
    serializer.serializeVector<AccountAuthenticator>(this.secondary_signers);
  }

  /**
   * Deserializes a `TransactionAuthenticatorMultiAgent` from BCS bytes (after the variant
   * prefix has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `TransactionAuthenticatorMultiAgent` instance.
   */
  static load(deserializer: Deserializer): TransactionAuthenticatorMultiAgent {
    const sender = AccountAuthenticator.deserialize(deserializer);
    const secondary_signer_addresses = deserializer.deserializeVector(AccountAddress);
    const secondary_signers = deserializer.deserializeVector(AccountAuthenticator);
    return new TransactionAuthenticatorMultiAgent(sender, secondary_signer_addresses, secondary_signers);
  }
}

// ── TransactionAuthenticatorFeePayer ──

/**
 * Top-level transaction authenticator for fee-payer (sponsored) transactions.
 *
 * Carries the primary sender's authenticator, optional secondary signer authenticators,
 * and the fee payer's address together with its authenticator.
 *
 * @example
 * ```typescript
 * const authenticator = new TransactionAuthenticatorFeePayer(
 *   senderAuthenticator,
 *   [],
 *   [],
 *   { address: feePayerAddress, authenticator: feePayerAuthenticator },
 * );
 * ```
 */
export class TransactionAuthenticatorFeePayer extends TransactionAuthenticator {
  /** The primary sender's per-account authenticator. */
  public readonly sender: AccountAuthenticator;

  /** Ordered list of secondary signer addresses (matches `secondary_signers`). */
  public readonly secondary_signer_addresses: Array<AccountAddress>;

  /** Ordered list of secondary signer per-account authenticators. */
  public readonly secondary_signers: Array<AccountAuthenticator>;

  /** The fee payer account address and its per-account authenticator. */
  public readonly fee_payer: {
    address: AccountAddress;
    authenticator: AccountAuthenticator;
  };

  /**
   * Creates a new `TransactionAuthenticatorFeePayer`.
   *
   * @param sender - The primary sender's authenticator.
   * @param secondary_signer_addresses - Addresses of the secondary signers.
   * @param secondary_signers - Per-account authenticators for each secondary signer.
   * @param fee_payer - Object containing the fee payer address and authenticator.
   */
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

  /**
   * Serializes this authenticator with its variant prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionAuthenticatorVariant.FeePayer);
    this.sender.serialize(serializer);
    serializer.serializeVector<AccountAddress>(this.secondary_signer_addresses);
    serializer.serializeVector<AccountAuthenticator>(this.secondary_signers);
    this.fee_payer.address.serialize(serializer);
    this.fee_payer.authenticator.serialize(serializer);
  }

  /**
   * Deserializes a `TransactionAuthenticatorFeePayer` from BCS bytes (after the variant
   * prefix has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `TransactionAuthenticatorFeePayer` instance.
   */
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

/**
 * Top-level transaction authenticator for a single modern-key sender.
 *
 * Wraps a single {@link AccountAuthenticator} and is used when the transaction has one
 * sender with a modern key scheme (e.g. SingleKey or MultiKey).
 *
 * @example
 * ```typescript
 * const authenticator = new TransactionAuthenticatorSingleSender(senderAuthenticator);
 * ```
 */
export class TransactionAuthenticatorSingleSender extends TransactionAuthenticator {
  /** The sender's per-account authenticator. */
  public readonly sender: AccountAuthenticator;

  /**
   * Creates a new `TransactionAuthenticatorSingleSender`.
   *
   * @param sender - The sender's per-account authenticator.
   */
  constructor(sender: AccountAuthenticator) {
    super();
    this.sender = sender;
  }

  /**
   * Serializes this authenticator with its variant prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionAuthenticatorVariant.SingleSender);
    this.sender.serialize(serializer);
  }

  /**
   * Deserializes a `TransactionAuthenticatorSingleSender` from BCS bytes (after the variant
   * prefix has already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `TransactionAuthenticatorSingleSender` instance.
   */
  static load(deserializer: Deserializer): TransactionAuthenticatorSingleSender {
    const sender = AccountAuthenticator.deserialize(deserializer);
    return new TransactionAuthenticatorSingleSender(sender);
  }
}
