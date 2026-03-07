// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { Deserializer } from "../../../src/bcs/deserializer.js";
import { Serializer } from "../../../src/bcs/serializer.js";
import { AccountAddress } from "../../../src/core/account-address.js";
import { ChainId } from "../../../src/transactions/chain-id.js";
import {
  FeePayerRawTransaction,
  MultiAgentRawTransaction,
  RawTransaction,
  RawTransactionWithData,
} from "../../../src/transactions/raw-transaction.js";
import { generateSigningMessage } from "../../../src/transactions/signing-message.js";
import {
  EntryFunction,
  TransactionPayload,
  TransactionPayloadEntryFunction,
} from "../../../src/transactions/transaction-payload.js";

// ── ChainId ──

describe("ChainId", () => {
  it("serializes and deserializes", () => {
    const chainId = new ChainId(4);
    const serializer = new Serializer();
    chainId.serialize(serializer);
    const bytes = serializer.toUint8Array();

    const deserialized = ChainId.deserialize(new Deserializer(bytes));
    expect(deserialized.chainId).toBe(4);
  });
});

// ── RawTransaction ──

describe("RawTransaction", () => {
  it("serializes and deserializes a basic transaction", () => {
    const sender = AccountAddress.fromString("0x1");
    const payload = new TransactionPayloadEntryFunction(EntryFunction.build("0x1::aptos_account", "transfer", [], []));
    const rawTxn = new RawTransaction(sender, 1n, payload, 200000n, 100n, 100n, new ChainId(4));

    const serializer = new Serializer();
    rawTxn.serialize(serializer);
    const bytes = serializer.toUint8Array();

    const deserialized = RawTransaction.deserialize(new Deserializer(bytes));
    expect(deserialized.sender.toString()).toEqual(sender.toString());
    expect(deserialized.sequence_number).toEqual(1n);
    expect(deserialized.max_gas_amount).toEqual(200000n);
    expect(deserialized.gas_unit_price).toEqual(100n);
    expect(deserialized.expiration_timestamp_secs).toEqual(100n);
    expect(deserialized.chain_id.chainId).toEqual(4);
  });
});

// ── FeePayerRawTransaction ──

describe("FeePayerRawTransaction", () => {
  it("serializes and deserializes via RawTransactionWithData", () => {
    const sender = AccountAddress.fromString("0x1");
    const feePayer = AccountAddress.fromString("0x2");
    const payload = new TransactionPayloadEntryFunction(EntryFunction.build("0x1::aptos_account", "transfer", [], []));
    const rawTxn = new RawTransaction(sender, 0n, payload, 200000n, 100n, 100n, new ChainId(4));
    const feePayerTxn = new FeePayerRawTransaction(rawTxn, [], feePayer);

    const serializer = new Serializer();
    feePayerTxn.serialize(serializer);
    const bytes = serializer.toUint8Array();

    // Deserialize goes through RawTransactionWithData which consumes the variant
    const deserialized = RawTransactionWithData.deserialize(new Deserializer(bytes));
    expect(deserialized).toBeInstanceOf(FeePayerRawTransaction);
    const fptxn = deserialized as FeePayerRawTransaction;
    expect(fptxn.raw_txn.sender.toString()).toEqual(sender.toString());
    expect(fptxn.fee_payer_address.toString()).toEqual(feePayer.toString());
    expect(fptxn.secondary_signer_addresses.length).toBe(0);
  });
});

// ── MultiAgentRawTransaction ──

describe("MultiAgentRawTransaction", () => {
  it("serializes and deserializes via RawTransactionWithData", () => {
    const sender = AccountAddress.fromString("0x1");
    const secondary = AccountAddress.fromString("0x3");
    const payload = new TransactionPayloadEntryFunction(EntryFunction.build("0x1::aptos_account", "transfer", [], []));
    const rawTxn = new RawTransaction(sender, 0n, payload, 200000n, 100n, 100n, new ChainId(4));
    const multiAgentTxn = new MultiAgentRawTransaction(rawTxn, [secondary]);

    const serializer = new Serializer();
    multiAgentTxn.serialize(serializer);
    const bytes = serializer.toUint8Array();

    const deserialized = RawTransactionWithData.deserialize(new Deserializer(bytes));
    expect(deserialized).toBeInstanceOf(MultiAgentRawTransaction);
    const matxn = deserialized as MultiAgentRawTransaction;
    expect(matxn.raw_txn.sender.toString()).toEqual(sender.toString());
    expect(matxn.secondary_signer_addresses.length).toBe(1);
    expect(matxn.secondary_signer_addresses[0].toString()).toEqual(secondary.toString());
  });
});

// ── TransactionPayload ──

describe("TransactionPayload", () => {
  it("serializes and deserializes EntryFunction payload with no type args", () => {
    const payload = new TransactionPayloadEntryFunction(EntryFunction.build("0x1::aptos_account", "transfer", [], []));

    const serializer = new Serializer();
    payload.serialize(serializer);
    const bytes = serializer.toUint8Array();

    const deserialized = TransactionPayload.deserialize(new Deserializer(bytes));
    expect(deserialized).toBeInstanceOf(TransactionPayloadEntryFunction);
  });
});

// ── generateSigningMessage ──

describe("generateSigningMessage", () => {
  it("generates signing message with valid domain separator", () => {
    const data = new Uint8Array([1, 2, 3]);
    const message = generateSigningMessage(data, "APTOS::RawTransaction");
    expect(message).toBeInstanceOf(Uint8Array);
    // generateSigningMessage returns SHA3-256(domain_separator) || data
    // = 32 bytes prefix + 3 bytes data = 35 bytes
    expect(message.length).toBe(35);
  });

  it("throws on invalid domain separator", () => {
    const data = new Uint8Array([1, 2, 3]);
    expect(() => generateSigningMessage(data, "Invalid::Separator")).toThrow("APTOS::");
  });
});

// ── EntryFunction.build ──

describe("EntryFunction.build", () => {
  it("parses module ID correctly", () => {
    const ef = EntryFunction.build("0x1::aptos_account", "transfer", [], []);
    // AccountAddress.toString() returns short form
    expect(ef.module_name.address.toString()).toEqual("0x1");
    expect(ef.module_name.name.identifier).toEqual("aptos_account");
    expect(ef.function_name.identifier).toEqual("transfer");
  });

  it("serializes and deserializes", () => {
    const ef = EntryFunction.build("0x1::aptos_account", "transfer", [], []);
    const serializer = new Serializer();
    ef.serialize(serializer);
    const bytes = serializer.toUint8Array();

    const deserialized = EntryFunction.deserialize(new Deserializer(bytes));
    expect(deserialized.module_name.name.identifier).toBe("aptos_account");
    expect(deserialized.function_name.identifier).toBe("transfer");
  });
});
