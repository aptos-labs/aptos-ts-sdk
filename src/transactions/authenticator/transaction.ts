// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/naming-convention */

import { AccountAuthenticator } from "./account";
import { Deserializer, Serializable, Serializer } from "../../bcs";
import { AccountAddress } from "../../core";
import { Ed25519PublicKey, Ed25519Signature } from "../../core/crypto/ed25519";
import { MultiEd25519PublicKey, MultiEd25519Signature } from "../../core/crypto/multiEd25519";
import { TransactionAuthenticatorVariant } from "../../types";

/**
 * Represents an abstract base class for transaction authenticators.
 * This class provides methods for serializing and deserializing different types of transaction authenticators.
 *
 * @extends Serializable
 * @group Implementation
 * @category Transactions
 */
export abstract class TransactionAuthenticator extends Serializable {
  abstract serialize(serializer: Serializer): void;

  /**
   * Deserializes a TransactionAuthenticator from the provided deserializer.
   * This function helps in reconstructing the TransactionAuthenticator based on the variant index found in the serialized data.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   * @group Implementation
   * @category Transactions
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

/**
 * Represents a transaction authenticator using Ed25519 for a single signer transaction.
 * This class encapsulates the client's public key and the Ed25519 signature of a raw transaction.
 *
 * @param public_key - The client's public key.
 * @param signature - The Ed25519 signature of a raw transaction.
 * @see {@link https://aptos.dev/integration/creating-a-signed-transaction | Creating a Signed Transaction}
 * for details about generating a signature.
 * @group Implementation
 * @category Transactions
 */
export class TransactionAuthenticatorEd25519 extends TransactionAuthenticator {
  public readonly public_key: Ed25519PublicKey;

  public readonly signature: Ed25519Signature;

  /**
   * Creates an instance of the class with the specified account authenticator.
   *
   * @param public_key - The Ed25519PublicKey that will be used for authentication.
   * @param signature - The Ed25519Signature that will be used for authentication.
   * @group Implementation
   * @category Transactions
   */
  constructor(public_key: Ed25519PublicKey, signature: Ed25519Signature) {
    super();
    this.public_key = public_key;
    this.signature = signature;
  }

  /**
   * Serializes the transaction authenticator by encoding the sender information.
   *
   * @param serializer - The serializer instance used to perform the serialization.
   * @group Implementation
   * @category Transactions
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionAuthenticatorVariant.Ed25519);
    this.public_key.serialize(serializer);
    this.signature.serialize(serializer);
  }

  /**
   * Loads a TransactionAuthenticatorSingleSender instance from the provided deserializer.
   * This function helps in deserializing the sender information to create a transaction authenticator.
   *
   * @param deserializer - The deserializer used to extract the sender data.
   * @group Implementation
   * @category Transactions
   */
  static load(deserializer: Deserializer): TransactionAuthenticatorEd25519 {
    const public_key = Ed25519PublicKey.deserialize(deserializer);
    const signature = Ed25519Signature.deserialize(deserializer);
    return new TransactionAuthenticatorEd25519(public_key, signature);
  }
}

/**
 * Represents a transaction authenticator for multi-signature transactions using Ed25519.
 * This class is used to validate transactions that require multiple signatures from different signers.
 *
 * @param public_key - The public key of the client involved in the transaction.
 * @param signature - The multi-signature of the raw transaction.
 * @group Implementation
 * @category Transactions
 */
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

/**
 * Represents a transaction authenticator for a multi-agent transaction.
 *
 * This class manages the authentication process involving a primary sender and multiple secondary signers.
 *
 * @param sender - The authenticator for the sender account.
 * @param secondary_signer_addresses - An array of addresses for the secondary signers.
 * @param secondary_signers - An array of authenticators for the secondary signer accounts.
 * @group Implementation
 * @category Transactions
 */
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

/**
 * Represents a transaction authenticator specifically for fee payer transactions.
 * It encapsulates the sender's account authenticator, addresses of secondary signers,
 * their respective authenticators, and the fee payer's account information.
 *
 * @param sender - The authenticator for the sender's account.
 * @param secondary_signer_addresses - An array of addresses for secondary signers.
 * @param secondary_signers - An array of authenticators for secondary signers' accounts.
 * @param fee_payer - An object containing the fee payer's account address and authenticator.
 * @group Implementation
 * @category Transactions
 */
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

  static load(deserializer: Deserializer): TransactionAuthenticatorMultiAgent {
    const sender = AccountAuthenticator.deserialize(deserializer);
    const secondary_signer_addresses = deserializer.deserializeVector(AccountAddress);
    const secondary_signers = deserializer.deserializeVector(AccountAuthenticator);
    const address = AccountAddress.deserialize(deserializer);
    const authenticator = AccountAuthenticator.deserialize(deserializer);
    const fee_payer = { address, authenticator };
    return new TransactionAuthenticatorFeePayer(sender, secondary_signer_addresses, secondary_signers, fee_payer);
  }
}

/**
 * Represents a single sender authenticator for transactions that require a single signer.
 * This class is responsible for managing the authentication of a transaction initiated by a single sender.
 *
 * @param sender - An instance of AccountAuthenticator that represents the account of the sender.
 * @group Implementation
 * @category Transactions
 */
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
