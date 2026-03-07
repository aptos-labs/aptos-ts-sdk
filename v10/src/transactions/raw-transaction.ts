// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "../core/account-address.js";
import { ChainId } from "./chain-id.js";
import { TransactionPayload } from "./transaction-payload.js";
import { TransactionVariants } from "./types.js";

// ── RawTransaction ──

export class RawTransaction extends Serializable {
  public readonly sender: AccountAddress;
  public readonly sequence_number: bigint;
  public readonly payload: TransactionPayload;
  public readonly max_gas_amount: bigint;
  public readonly gas_unit_price: bigint;
  public readonly expiration_timestamp_secs: bigint;
  public readonly chain_id: ChainId;

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

// ── RawTransactionWithData ──

export abstract class RawTransactionWithData extends Serializable {
  abstract serialize(serializer: Serializer): void;

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

export class MultiAgentRawTransaction extends RawTransactionWithData {
  public readonly raw_txn: RawTransaction;
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

// ── FeePayerRawTransaction ──

export class FeePayerRawTransaction extends RawTransactionWithData {
  public readonly raw_txn: RawTransaction;
  public readonly secondary_signer_addresses: Array<AccountAddress>;
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
