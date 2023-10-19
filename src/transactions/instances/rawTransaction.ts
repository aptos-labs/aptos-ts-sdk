// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/naming-convention */

import { Deserializer } from "../../bcs/deserializer";
import { Serializable, Serializer } from "../../bcs/serializer";
import { ChainId } from "./chainId";
import { AccountAddress } from "../../core";
import { TransactionPayload } from "./transactionPayload";
import { TransactionVariants } from "../../types";

/**
 * Representation of a Raw Transaction that can serialized and deserialized
 */
export class RawTransaction extends Serializable {
  public readonly sender: AccountAddress;

  public readonly sequence_number: bigint;

  public readonly payload: TransactionPayload;

  public readonly max_gas_amount: bigint;

  public readonly gas_unit_price: bigint;

  public readonly expiration_timestamp_secs: bigint;

  public readonly chain_id: ChainId;

  /**
   * RawTransactions contain the metadata and payloads that can be submitted to Aptos chain for execution.
   * RawTransactions must be signed before Aptos chain can execute them.
   *
   * @param sender The sender Account Address
   * @param sequence_number Sequence number of this transaction. This must match the sequence number stored in
   *   the sender's account at the time the transaction executes.
   * @param payload Instructions for the Aptos Blockchain, including publishing a module,
   *   execute an entry function or execute a script payload.
   * @param max_gas_amount Maximum total gas to spend for this transaction. The account must have more
   *   than this gas or the transaction will be discarded during validation.
   * @param gas_unit_price Price to be paid per gas unit.
   * @param expiration_timestamp_secs The blockchain timestamp at which the blockchain would discard this transaction.
   * @param chain_id The chain ID of the blockchain that this transaction is intended to be run on.
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

  serialize(serializer: Serializer): void {
    this.sender.serialize(serializer);
    serializer.serializeU64(this.sequence_number);
    this.payload.serialize(serializer);
    serializer.serializeU64(this.max_gas_amount);
    serializer.serializeU64(this.gas_unit_price);
    serializer.serializeU64(this.expiration_timestamp_secs);
    this.chain_id.serialize(serializer);
  }

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

/**
 * Representation of a Raw Transaction With Data that can serialized and deserialized
 */
export abstract class RawTransactionWithData extends Serializable {
  /**
   * Serialize a Raw Transaction With Data
   */
  abstract serialize(serializer: Serializer): void;

  /**
   * Deserialize a Raw Transaction With Data
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
 * Representation of a Multi Agent Transaction that can serialized and deserialized
 */
export class MultiAgentRawTransaction extends RawTransactionWithData {
  /**
   * The raw transaction
   */
  public readonly raw_txn: RawTransaction;

  /**
   * The secondary signers on this transaction
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

  static load(deserializer: Deserializer): MultiAgentRawTransaction {
    const rawTxn = RawTransaction.deserialize(deserializer);
    const secondarySignerAddresses = deserializer.deserializeVector(AccountAddress);

    return new MultiAgentRawTransaction(rawTxn, secondarySignerAddresses);
  }
}

/**
 * Representation of a Fee Payer Transaction that can serialized and deserialized
 */
export class FeePayerRawTransaction extends RawTransactionWithData {
  /**
   * The raw transaction
   */
  public readonly raw_txn: RawTransaction;

  /**
   * The secondary signers on this transaction - optional and can be empty
   */
  public readonly secondary_signer_addresses: Array<AccountAddress>;

  /**
   * The fee payer account address
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
