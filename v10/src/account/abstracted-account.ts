// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 } from "@noble/hashes/sha3.js";
import { Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "../core/account-address.js";
import { ACCOUNT_ABSTRACTION_SIGNING_DATA_SALT } from "../core/constants.js";
import { AbstractPublicKey, AbstractSignature } from "../crypto/abstraction.js";
import { SigningScheme } from "../crypto/types.js";
import { Hex, type HexInput } from "../hex/index.js";
import { AccountAbstractionMessage, AccountAuthenticatorAbstraction } from "../transactions/authenticator.js";
import { generateSigningMessage, generateSigningMessageForTransaction } from "../transactions/signing-message.js";
import type { AnyRawTransaction } from "../transactions/types.js";
import type { Ed25519Account } from "./ed25519-account.js";
import type { Account } from "./types.js";

function isValidFunctionInfo(functionInfo: string): boolean {
  const parts = functionInfo.split("::");
  return parts.length === 3 && AccountAddress.isValid({ input: parts[0] }).valid;
}

/**
 * An account that delegates authentication to an arbitrary on-chain Move function.
 *
 * Account Abstraction (AA) allows any smart contract to define the authentication
 * logic for an account.  Instead of verifying a fixed signature scheme on-chain,
 * the Aptos framework calls a user-supplied `authenticationFunction` with the
 * signing digest and the bytes returned by the `signer` callback.
 *
 * The `authenticationFunction` must be a fully-qualified Move function of the
 * form `<address>::<module>::<function>` and must match a Move function that
 * accepts a `&signer`, a digest, and the abstraction signature bytes.
 *
 * @example
 * ```typescript
 * const account = new AbstractedAccount({
 *   accountAddress: AccountAddress.fromString("0x1"),
 *   signer: (digest) => myCustomSigner(digest),
 *   authenticationFunction: "0x1::my_auth::authenticate",
 * });
 * ```
 */
export class AbstractedAccount implements Account {
  /** The abstract public key that holds the account address. */
  readonly publicKey: AbstractPublicKey;
  /** The on-chain address of the abstracted account. */
  readonly accountAddress: AccountAddress;
  /**
   * The fully-qualified Move function used for authentication
   * (e.g. `"0x1::permissioned_delegation::authenticate"`).
   */
  readonly authenticationFunction: string;
  /** Always `SigningScheme.SingleKey` for abstracted accounts. */
  readonly signingScheme = SigningScheme.SingleKey;

  /**
   * The signing function.  It receives a digest and returns the raw bytes that
   * will be passed to the on-chain `authenticationFunction`.
   *
   * Can be replaced at runtime via {@link setSigner}.
   */
  sign: (message: HexInput) => AbstractSignature;

  /**
   * Creates an {@link AbstractedAccount}.
   *
   * @param args.accountAddress - The on-chain address of the account.
   * @param args.signer - A function that takes a digest and returns the raw
   *   authentication bytes expected by `authenticationFunction`.
   * @param args.authenticationFunction - Fully-qualified Move function for
   *   on-chain authentication (format: `<address>::<module>::<function>`).
   *
   * @throws Error if `authenticationFunction` is not a valid fully-qualified
   *   Move function identifier.
   */
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

  /**
   * Creates an {@link AbstractedAccount} pre-configured to use the
   * `0x1::permissioned_delegation::authenticate` authentication function.
   *
   * The signer serializes the Ed25519 public key followed by the Ed25519
   * signature, which is the format expected by the permissioned delegation
   * Move module.
   *
   * @param args.signer - An {@link Ed25519Account} used to produce the inner signature.
   * @param args.accountAddress - Optional explicit account address; defaults to
   *   the `signer`'s own address.
   * @returns A new {@link AbstractedAccount} backed by permissioned delegation.
   */
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

  /**
   * Constructs the final signing message for account abstraction by wrapping
   * the transaction signing message inside an {@link AccountAbstractionMessage}
   * envelope and hashing with the domain separator.
   *
   * @param message - The inner signing message (e.g. from
   *   `generateSigningMessageForTransaction`).
   * @param functionInfo - The fully-qualified authentication function identifier.
   * @returns The bytes that the `signer` callback should sign.
   */
  static generateAccountAbstractionMessage(message: HexInput, functionInfo: string): HexInput {
    const accountAbstractionMessage = new AccountAbstractionMessage(message, functionInfo);
    return generateSigningMessage(accountAbstractionMessage.bcsToBytes(), ACCOUNT_ABSTRACTION_SIGNING_DATA_SALT);
  }

  /**
   * Signs a message and returns an {@link AccountAuthenticatorAbstraction}.
   *
   * The message is first hashed with SHA3-256 before being passed to the signer.
   *
   * @param message - The message bytes to sign, in any supported hex input format.
   * @returns An {@link AccountAuthenticatorAbstraction} ready for use in a transaction.
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorAbstraction {
    const messageBytes = Hex.fromHexInput(message).toUint8Array();
    const digest = sha3_256(messageBytes);
    return new AccountAuthenticatorAbstraction(this.authenticationFunction, digest, this.sign(digest).toUint8Array());
  }

  /**
   * Signs a raw transaction and returns an {@link AccountAuthenticatorAbstraction}.
   *
   * The signing message is wrapped in an account abstraction envelope before
   * being passed to the signer.
   *
   * @param transaction - The raw transaction to sign.
   * @returns An {@link AccountAuthenticatorAbstraction} containing the signature.
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorAbstraction {
    const digest = Hex.fromHexInput(
      AbstractedAccount.generateAccountAbstractionMessage(
        generateSigningMessageForTransaction(transaction),
        this.authenticationFunction,
      ),
    ).toUint8Array();
    return new AccountAuthenticatorAbstraction(this.authenticationFunction, digest, this.sign(digest).toUint8Array());
  }

  /**
   * Signs a raw transaction and returns the raw {@link AbstractSignature}.
   *
   * @param transaction - The raw transaction to sign.
   * @returns The {@link AbstractSignature} over the transaction signing message.
   */
  signTransaction(transaction: AnyRawTransaction): AbstractSignature {
    return this.sign(generateSigningMessageForTransaction(transaction));
  }

  /**
   * Replaces the signer function at runtime.
   *
   * Useful when the underlying credential needs to be rotated without
   * re-creating the account instance.
   *
   * @param signer - The new signing function.  Receives a digest and returns
   *   raw authentication bytes.
   */
  setSigner(signer: (digest: HexInput) => HexInput): void {
    this.sign = (digest: HexInput) => new AbstractSignature(signer(digest));
  }
}

// ── DerivableAbstractedAccount ──

/**
 * An abstracted account whose on-chain address is deterministically derived
 * from the authentication function and an abstract public key.
 *
 * Unlike {@link AbstractedAccount}, which requires an explicit account address,
 * `DerivableAbstractedAccount` computes the address from the function identifier
 * and a byte-string "abstract public key" using the domain-separated hash
 * defined by the Aptos account abstraction specification.
 *
 * @example
 * ```typescript
 * const account = new DerivableAbstractedAccount({
 *   abstractPublicKey: myPublicKeyBytes,
 *   authenticationFunction: "0x1::my_auth::authenticate",
 *   signer: (digest) => myCustomSigner(digest),
 * });
 * ```
 */
export class DerivableAbstractedAccount extends AbstractedAccount {
  /**
   * The abstract public key bytes that, together with the authentication
   * function, uniquely identify and address this account.
   */
  readonly abstractPublicKey: Uint8Array;
  /**
   * The domain separator byte appended to the hash input during address
   * derivation.  Fixed at `5` by the Aptos account abstraction specification.
   */
  static readonly ADDRESS_DOMAIN_SEPARATOR: number = 5;

  /**
   * Creates a {@link DerivableAbstractedAccount}.
   *
   * The on-chain address is computed from `authenticationFunction` and
   * `abstractPublicKey` using {@link DerivableAbstractedAccount.computeAccountAddress}.
   *
   * @param args.signer - A function that takes a digest and returns authentication bytes.
   * @param args.authenticationFunction - Fully-qualified Move function for
   *   on-chain authentication.
   * @param args.abstractPublicKey - Byte string used to derive the account address.
   *
   * @throws Error if `authenticationFunction` is not a valid fully-qualified
   *   Move function identifier.
   */
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

  /**
   * Computes the deterministic on-chain address for a derivable abstracted account.
   *
   * The address is derived as:
   * ```
   * SHA3-256(BCS(moduleAddress) || BCS(moduleName) || BCS(functionName)
   *          || BCS(abstractPublicKey) || [ADDRESS_DOMAIN_SEPARATOR])
   * ```
   *
   * @param functionInfo - Fully-qualified Move function identifier
   *   (e.g. `"0x1::my_auth::authenticate"`).
   * @param accountIdentifier - The abstract public key bytes.
   * @returns A 32-byte `Uint8Array` representing the derived account address.
   *
   * @throws Error if `functionInfo` is not a valid fully-qualified Move function identifier.
   */
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

  /**
   * Signs a message and returns an {@link AccountAuthenticatorAbstraction} that
   * includes the abstract public key bytes.
   *
   * @param message - The message bytes to sign, in any supported hex input format.
   * @returns An {@link AccountAuthenticatorAbstraction} including the
   *   `abstractPublicKey` required for on-chain verification.
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorAbstraction {
    const messageBytes = Hex.fromHexInput(message).toUint8Array();
    const digest = sha3_256(messageBytes);
    return new AccountAuthenticatorAbstraction(
      this.authenticationFunction,
      digest,
      this.sign(digest).value,
      this.abstractPublicKey,
    );
  }

  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorAbstraction {
    const digest = Hex.fromHexInput(
      AbstractedAccount.generateAccountAbstractionMessage(
        generateSigningMessageForTransaction(transaction),
        this.authenticationFunction,
      ),
    ).toUint8Array();
    return new AccountAuthenticatorAbstraction(
      this.authenticationFunction,
      digest,
      this.sign(digest).value,
      this.abstractPublicKey,
    );
  }
}
