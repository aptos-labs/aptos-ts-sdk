// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "../core/account-address.js";
import { ChainId } from "./chain-id.js";
import { TransactionPayload } from "./transaction-payload.js";
import { TransactionVariants } from "./types.js";

// ── RawTransaction ──

/**
 * The core unsigned transaction structure that is submitted to the Aptos blockchain.
 *
 * A `RawTransaction` contains everything the network needs to execute a transaction: the
 * sender, a monotonically-increasing sequence number, the payload (entry function, script,
 * or multisig), gas limits, an expiry timestamp, and the target chain ID.
 *
 * To create a signable message from a `RawTransaction`, pass it through
 * {@link generateSigningMessageForTransaction}.
 *
 * @example
 * ```typescript
 * const rawTxn = new RawTransaction(
 *   senderAddress,
 *   sequenceNumber,
 *   payload,
 *   maxGasAmount,
 *   gasUnitPrice,
 *   expirationTimestampSecs,
 *   chainId,
 * );
 * const bytes = rawTxn.bcsToBytes();
 * ```
 */
export class RawTransaction extends Serializable {
  /** The account address of the transaction sender. */
  public readonly sender: AccountAddress;

  /**
   * The sender's current sequence number.
   *
   * Each transaction must use the next sequential value to prevent replay attacks and
   * ensure ordering.
   */
  public readonly sequence_number: bigint;

  /** The executable payload of this transaction. */
  public readonly payload: TransactionPayload;

  /** The maximum number of gas units the sender is willing to pay for this transaction. */
  public readonly max_gas_amount: bigint;

  /** The price (in octas) the sender is willing to pay per unit of gas. */
  public readonly gas_unit_price: bigint;

  /**
   * Unix timestamp (seconds) after which the transaction is considered expired and will
   * no longer be accepted by the network.
   */
  public readonly expiration_timestamp_secs: bigint;

  /** Identifies the target Aptos network; prevents cross-chain replay. */
  public readonly chain_id: ChainId;

  /**
   * Creates a new `RawTransaction`.
   *
   * @param sender - The account address of the transaction sender.
   * @param sequence_number - The sender's current on-chain sequence number.
   * @param payload - The transaction payload to execute.
   * @param max_gas_amount - Maximum gas units the sender will pay.
   * @param gas_unit_price - Price per gas unit in octas.
   * @param expiration_timestamp_secs - Unix timestamp (seconds) when the transaction expires.
   * @param chain_id - The target chain's numeric identifier.
   */
  constructor(
    sender: AccountAddress,
    sequence_number: bigint,
    payload: TransactionPayload,
    max_gas_amount: bigint,
    gas_unit_price: bigint,
    expiration_timestamp_secs: bigint,
    chain_id: ChainId,
  ) {
    super();
    this.sender = sender;
    this.sequence_number = sequence_number;
    this.payload = payload;
    this.max_gas_amount = max_gas_amount;
    this.gas_unit_price = gas_unit_price;
    this.expiration_timestamp_secs = expiration_timestamp_secs;
    this.chain_id = chain_id;
  }

  /**
   * Serializes this `RawTransaction` into BCS bytes.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    this.sender.serialize(serializer);
    serializer.serializeU64(this.sequence_number);
    this.payload.serialize(serializer);
    serializer.serializeU64(this.max_gas_amount);
    serializer.serializeU64(this.gas_unit_price);
    serializer.serializeU64(this.expiration_timestamp_secs);
    this.chain_id.serialize(serializer);
  }

  /**
   * Deserializes a `RawTransaction` from BCS bytes.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `RawTransaction` instance.
   */
  static deserialize(deserializer: Deserializer): RawTransaction {
    const sender = AccountAddress.deserialize(deserializer);
    const sequence_number = deserializer.deserializeU64();
    const payload = TransactionPayload.deserialize(deserializer);
    const max_gas_amount = deserializer.deserializeU64();
    const gas_unit_price = deserializer.deserializeU64();
    const expiration_timestamp_secs = deserializer.deserializeU64();
    const chain_id = ChainId.deserialize(deserializer);
    return new RawTransaction(
      sender,
      sequence_number,
      payload,
      max_gas_amount,
      gas_unit_price,
      expiration_timestamp_secs,
      chain_id,
    );
  }
}

// ── RawTransactionWithData ──

/**
 * Abstract base class for raw transactions that carry additional signer metadata alongside
 * the core {@link RawTransaction}.
 *
 * Two concrete variants exist:
 * - {@link MultiAgentRawTransaction} – adds secondary signer addresses.
 * - {@link FeePayerRawTransaction} – adds secondary signer addresses and a fee payer address.
 *
 * The variant is encoded as a ULEB128-prefixed discriminant during BCS serialization.
 */
export abstract class RawTransactionWithData extends Serializable {
  abstract serialize(serializer: Serializer): void;

  /**
   * Deserializes a `RawTransactionWithData` from BCS bytes, dispatching to the correct
   * concrete subclass based on the ULEB128 variant prefix.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns Either a {@link MultiAgentRawTransaction} or a {@link FeePayerRawTransaction}.
   * @throws Error if the variant index is unknown.
   */
  static deserialize(deserializer: Deserializer): RawTransactionWithData {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case TransactionVariants.MultiAgentTransaction:
        return MultiAgentRawTransaction.load(deserializer);
      case TransactionVariants.FeePayerTransaction:
        return FeePayerRawTransaction.load(deserializer);
      default:
        throw new Error(`Unknown variant index for RawTransactionWithData: ${index}`);
    }
  }
}

// ── MultiAgentRawTransaction ──

/**
 * A raw transaction that includes one or more secondary signers in addition to the primary sender.
 *
 * All secondary signer addresses must be present in the BCS bytes before the transaction is
 * signed by any party.  This is the low-level representation used when computing the signing
 * message; the high-level wrapper is {@link MultiAgentTransaction}.
 *
 * @example
 * ```typescript
 * const multiAgentRawTxn = new MultiAgentRawTransaction(rawTxn, [secondaryAddress]);
 * const signingMessage = generateSigningMessageForTransaction(multiAgentTxn);
 * ```
 */
export class MultiAgentRawTransaction extends RawTransactionWithData {
  /** The underlying unsigned transaction. */
  public readonly raw_txn: RawTransaction;

  /** Ordered list of secondary signer addresses that must co-sign this transaction. */
  public readonly secondary_signer_addresses: Array<AccountAddress>;

  /**
   * Creates a new `MultiAgentRawTransaction`.
   *
   * @param raw_txn - The core unsigned transaction.
   * @param secondary_signer_addresses - Addresses of the required secondary signers.
   */
  constructor(raw_txn: RawTransaction, secondary_signer_addresses: Array<AccountAddress>) {
    super();
    this.raw_txn = raw_txn;
    this.secondary_signer_addresses = secondary_signer_addresses;
  }

  /**
   * Serializes this transaction with its variant prefix and secondary signer addresses.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionVariants.MultiAgentTransaction);
    this.raw_txn.serialize(serializer);
    serializer.serializeVector(this.secondary_signer_addresses);
  }

  /**
   * Deserializes a `MultiAgentRawTransaction` from BCS bytes (after the variant prefix has
   * already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `MultiAgentRawTransaction` instance.
   */
  static load(deserializer: Deserializer): MultiAgentRawTransaction {
    const rawTxn = RawTransaction.deserialize(deserializer);
    const secondarySignerAddresses = deserializer.deserializeVector(AccountAddress);
    return new MultiAgentRawTransaction(rawTxn, secondarySignerAddresses);
  }
}

// ── FeePayerRawTransaction ──

/**
 * A raw transaction that designates a separate account to pay the gas fees.
 *
 * In addition to the primary sender and optional secondary signers, this variant carries
 * the address of the fee payer account.  The fee payer must also sign the transaction.
 * This is the low-level representation; the high-level wrapper is {@link SimpleTransaction}
 * or {@link MultiAgentTransaction} with a `feePayerAddress` set.
 *
 * @example
 * ```typescript
 * const feePayerRawTxn = new FeePayerRawTransaction(rawTxn, [], feePayerAddress);
 * const signingMessage = generateSigningMessageForTransaction(simpleTxn);
 * ```
 */
export class FeePayerRawTransaction extends RawTransactionWithData {
  /** The underlying unsigned transaction. */
  public readonly raw_txn: RawTransaction;

  /** Ordered list of secondary signer addresses (may be empty). */
  public readonly secondary_signer_addresses: Array<AccountAddress>;

  /** The address of the account that will pay gas fees for this transaction. */
  public readonly fee_payer_address: AccountAddress;

  /**
   * Creates a new `FeePayerRawTransaction`.
   *
   * @param raw_txn - The core unsigned transaction.
   * @param secondary_signer_addresses - Addresses of any required secondary signers.
   * @param fee_payer_address - The address of the fee payer account.
   */
  constructor(
    raw_txn: RawTransaction,
    secondary_signer_addresses: Array<AccountAddress>,
    fee_payer_address: AccountAddress,
  ) {
    super();
    this.raw_txn = raw_txn;
    this.secondary_signer_addresses = secondary_signer_addresses;
    this.fee_payer_address = fee_payer_address;
  }

  /**
   * Serializes this transaction with its variant prefix, secondary signer addresses, and
   * fee payer address.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionVariants.FeePayerTransaction);
    this.raw_txn.serialize(serializer);
    serializer.serializeVector(this.secondary_signer_addresses);
    this.fee_payer_address.serialize(serializer);
  }

  /**
   * Deserializes a `FeePayerRawTransaction` from BCS bytes (after the variant prefix has
   * already been consumed).
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `FeePayerRawTransaction` instance.
   */
  static load(deserializer: Deserializer): FeePayerRawTransaction {
    const rawTxn = RawTransaction.deserialize(deserializer);
    const secondarySignerAddresses = deserializer.deserializeVector(AccountAddress);
    const feePayerAddress = AccountAddress.deserialize(deserializer);
    return new FeePayerRawTransaction(rawTxn, secondarySignerAddresses, feePayerAddress);
  }
}
