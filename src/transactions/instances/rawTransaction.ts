// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/naming-convention */

import { Deserializer } from "../../bcs/deserializer";
import { Serializable, Serializer } from "../../bcs/serializer";
import { ChainId } from "./chainId";
import { AccountAddress } from "../../core";
import { TransactionPayload } from "./transactionPayload";
import { TransactionVariants } from "../../types";
import { TypeTag } from "../typeTag";

/**
 * Represents a raw transaction that can be serialized and deserialized.
 * Raw transactions contain the metadata and payloads that can be submitted to the Cedra chain for execution.
 * They must be signed before the Cedra chain can execute them.
 * @group Implementation
 * @category Transactions
 */
export class RawTransaction extends Serializable {
  public readonly sender: AccountAddress;

  public readonly sequence_number: bigint;

  public readonly payload: TransactionPayload;

  public readonly max_gas_amount: bigint;

  public readonly gas_unit_price: bigint;

  public readonly expiration_timestamp_secs: bigint;

  public readonly chain_id: ChainId;

  public readonly fa_address: TypeTag;

  /**
   * RawTransactions contain the metadata and payloads that can be submitted to Cedra chain for execution.
   * RawTransactions must be signed before Cedra chain can execute them.
   *
   * @param sender The sender Account Address
   * @param sequence_number Sequence number of this transaction. This must match the sequence number stored in
   *   the sender's account at the time the transaction executes.
   * @param payload Instructions for the Cedra Blockchain, including publishing a module,
   *   execute an entry function or execute a script payload.
   * @param max_gas_amount Maximum total gas to spend for this transaction. The account must have more
   *   than this gas or the transaction will be discarded during validation.
   * @param gas_unit_price Price to be paid per gas unit.
   * @param expiration_timestamp_secs The blockchain timestamp at which the blockchain would discard this transaction.
   * @param chain_id The chain ID of the blockchain that this transaction is intended to be run on.
   * @group Implementation
   * @category Transactions
   */
  constructor(
    sender: AccountAddress,
    sequence_number: bigint,
    payload: TransactionPayload,
    max_gas_amount: bigint,
    gas_unit_price: bigint,
    expiration_timestamp_secs: bigint,
    chain_id: ChainId,
    fa_address: TypeTag,
  ) {
    super();
    this.sender = sender;
    this.sequence_number = sequence_number;
    this.payload = payload;
    this.max_gas_amount = max_gas_amount;
    this.gas_unit_price = gas_unit_price;
    this.expiration_timestamp_secs = expiration_timestamp_secs;
    this.chain_id = chain_id;
    this.fa_address = fa_address;
  }

  /**
   * Serializes the transaction data, including the fee payer transaction type, raw transaction, secondary signer addresses,
   * and fee payer address.
   * This function is essential for preparing the transaction for transmission or storage in a serialized format.
   *
   * @param serializer - The serializer instance used to serialize the transaction data.
   * @group Implementation
   * @category Transactions
   */
  serialize(serializer: Serializer): void {
    this.sender.serialize(serializer);
    serializer.serializeU64(this.sequence_number);
    this.payload.serialize(serializer);
    serializer.serializeU64(this.max_gas_amount);
    serializer.serializeU64(this.gas_unit_price);
    serializer.serializeU64(this.expiration_timestamp_secs);
    this.chain_id.serialize(serializer);
    this.fa_address.serialize(serializer);
  }

  /**
   * Deserialize a Raw Transaction With Data.
   * This function retrieves the appropriate raw transaction based on the variant index provided by the deserializer.
   *
   * @param deserializer - An instance of the Deserializer used to read the serialized data.
   * @group Implementation
   * @category Transactions
   */
  static deserialize(deserializer: Deserializer): RawTransaction {
    const sender = AccountAddress.deserialize(deserializer);
    const sequence_number = deserializer.deserializeU64();
    const payload = TransactionPayload.deserialize(deserializer);
    const max_gas_amount = deserializer.deserializeU64();
    const gas_unit_price = deserializer.deserializeU64();
    const expiration_timestamp_secs = deserializer.deserializeU64();
    const chain_id = ChainId.deserialize(deserializer);
    const fa_address = TypeTag.deserialize(deserializer);
    return new RawTransaction(
      sender,
      sequence_number,
      payload,
      max_gas_amount,
      gas_unit_price,
      expiration_timestamp_secs,
      chain_id,
      fa_address,
    );
  }
}

/**
 * Represents a raw transaction that can be serialized and deserialized.
 * Raw transactions contain the metadata and payloads that can be submitted to the Cedra chain for execution.
 * They must be signed before the Cedra chain can execute them.
 * @group Implementation
 * @category Transactions
 */
export class CommissionRawTransaction extends Serializable {
  public readonly sender: AccountAddress;

  public readonly sequence_number: bigint;

  public readonly payload: TransactionPayload;

  public readonly max_gas_amount: bigint;

  public readonly gas_unit_price: bigint;

  public readonly expiration_timestamp_secs: bigint;

  public readonly chain_id: ChainId;

  public readonly fa_address: TypeTag;

  /**
   * RawTransactions contain the metadata and payloads that can be submitted to Cedra chain for execution.
   * RawTransactions must be signed before Cedra chain can execute them.
   *
   * @param sender The sender Account Address
   * @param sequence_number Sequence number of this transaction. This must match the sequence number stored in
   *   the sender's account at the time the transaction executes.
   * @param payload Instructions for the Cedra Blockchain, including publishing a module,
   *   execute an entry function or execute a script payload.
   * @param max_gas_amount Maximum total gas to spend for this transaction. The account must have more
   *   than this gas or the transaction will be discarded during validation.
   * @param gas_unit_price Price to be paid per gas unit.
   * @param expiration_timestamp_secs The blockchain timestamp at which the blockchain would discard this transaction.
   * @param chain_id The chain ID of the blockchain that this transaction is intended to be run on.
   * @group Implementation
   * @category Transactions
   */
  constructor(
    sender: AccountAddress,
    sequence_number: bigint,
    payload: TransactionPayload,
    max_gas_amount: bigint,
    gas_unit_price: bigint,
    expiration_timestamp_secs: bigint,
    chain_id: ChainId,
    fa_address: TypeTag,
  ) {
    super();
    this.sender = sender;
    this.sequence_number = sequence_number;
    this.payload = payload;
    this.max_gas_amount = max_gas_amount;
    this.gas_unit_price = gas_unit_price;
    this.expiration_timestamp_secs = expiration_timestamp_secs;
    this.chain_id = chain_id;
    this.fa_address = fa_address;
  }

  /**
   * Serializes the transaction data, including the fee payer transaction type, raw transaction, secondary signer addresses,
   * and fee payer address.
   * This function is essential for preparing the transaction for transmission or storage in a serialized format.
   *
   * @param serializer - The serializer instance used to serialize the transaction data.
   * @group Implementation
   * @category Transactions
   */
  serialize(serializer: Serializer): void {
    this.sender.serialize(serializer);
    serializer.serializeU64(this.sequence_number);
    this.payload.serialize(serializer);
    serializer.serializeU64(this.max_gas_amount);
    serializer.serializeU64(this.gas_unit_price);
    serializer.serializeU64(this.expiration_timestamp_secs);
    this.chain_id.serialize(serializer);
    this.fa_address.serialize(serializer);
  }

  /**
   * Deserialize a Raw Transaction With Data.
   * This function retrieves the appropriate raw transaction based on the variant index provided by the deserializer.
   *
   * @param deserializer - An instance of the Deserializer used to read the serialized data.
   * @group Implementation
   * @category Transactions
   */
  static deserialize(deserializer: Deserializer): RawTransaction {
    const sender = AccountAddress.deserialize(deserializer);
    const sequence_number = deserializer.deserializeU64();
    const payload = TransactionPayload.deserialize(deserializer);
    const max_gas_amount = deserializer.deserializeU64();
    const gas_unit_price = deserializer.deserializeU64();
    const expiration_timestamp_secs = deserializer.deserializeU64();
    const chain_id = ChainId.deserialize(deserializer);
    const fa_address = TypeTag.deserialize(deserializer);
    return new CommissionRawTransaction(
      sender,
      sequence_number,
      payload,
      max_gas_amount,
      gas_unit_price,
      expiration_timestamp_secs,
      chain_id,
      fa_address,
    );
  }
}

/**
 * Represents a raw transaction with associated data that can be serialized and deserialized.
 *
 * @extends Serializable
 * @group Implementation
 * @category Transactions
 */
export abstract class RawTransactionWithData extends Serializable {
  /**
   * Serialize a Raw Transaction With Data
   * @group Implementation
   * @category Transactions
   */
  abstract serialize(serializer: Serializer): void;

  /**
   * Deserialize a Raw Transaction With Data
   * @group Implementation
   * @category Transactions
   */
  static deserialize(deserializer: Deserializer): RawTransactionWithData {
    // index enum variant
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

/**
 * Represents a multi-agent transaction that can be serialized and deserialized.
 *
 * @extends RawTransactionWithData
 * @group Implementation
 * @category Transactions
 */
export class MultiAgentRawTransaction extends RawTransactionWithData {
  /**
   * The raw transaction
   * @group Implementation
   * @category Transactions
   */
  public readonly raw_txn: RawTransaction;

  /**
   * The secondary signers on this transaction
   * @group Implementation
   * @category Transactions
   */
  public readonly secondary_signer_addresses: Array<AccountAddress>;

  constructor(raw_txn: RawTransaction, secondary_signer_addresses: Array<AccountAddress>) {
    super();
    this.raw_txn = raw_txn;
    this.secondary_signer_addresses = secondary_signer_addresses;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionVariants.MultiAgentTransaction);
    this.raw_txn.serialize(serializer);
    serializer.serializeVector(this.secondary_signer_addresses);
  }

  /**
   * Deserializes a Fee Payer Raw Transaction from the provided deserializer.
   * This function allows you to reconstruct a Fee Payer Raw Transaction object, which includes the raw transaction data,
   * secondary signer addresses, and the fee payer address.
   *
   * @param deserializer - The deserializer used to read the raw transaction data.
   * @returns A FeePayerRawTransaction object constructed from the deserialized data.
   * @group Implementation
   * @category Transactions
   */
  static load(deserializer: Deserializer): MultiAgentRawTransaction {
    const rawTxn = RawTransaction.deserialize(deserializer);
    const secondarySignerAddresses = deserializer.deserializeVector(AccountAddress);

    return new MultiAgentRawTransaction(rawTxn, secondarySignerAddresses);
  }
}

/**
 * Represents a Fee Payer Transaction that can be serialized and deserialized.
 * @group Implementation
 * @category Transactions
 */
export class FeePayerRawTransaction extends RawTransactionWithData {
  /**
   * The raw transaction
   * @group Implementation
   * @category Transactions
   */
  public readonly raw_txn: RawTransaction;

  /**
   * The secondary signers on this transaction - optional and can be empty
   * @group Implementation
   * @category Transactions
   */
  public readonly secondary_signer_addresses: Array<AccountAddress>;

  /**
   * The fee payer account address
   * @group Implementation
   * @category Transactions
   */
  public readonly fee_payer_address: AccountAddress;

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

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TransactionVariants.FeePayerTransaction);
    this.raw_txn.serialize(serializer);
    serializer.serializeVector(this.secondary_signer_addresses);
    this.fee_payer_address.serialize(serializer);
  }

  static load(deserializer: Deserializer): FeePayerRawTransaction {
    const rawTxn = RawTransaction.deserialize(deserializer);
    const secondarySignerAddresses = deserializer.deserializeVector(AccountAddress);
    const feePayerAddress = AccountAddress.deserialize(deserializer);

    return new FeePayerRawTransaction(rawTxn, secondarySignerAddresses, feePayerAddress);
  }
}
