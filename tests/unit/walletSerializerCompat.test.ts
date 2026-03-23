// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Tests that verify cross-version serializer compatibility for the wallet adapter flow.
 *
 * When a wallet (e.g. Petra) bundles an older SDK version and receives a transaction
 * object built with a newer SDK, the wallet's older Serializer may lack newer methods
 * like `serializeAsBytes`. This test simulates that scenario by creating a "legacy"
 * serializer that mirrors the older SDK's Serializer API, then verifying that v6
 * transaction objects can still be serialized through it.
 *
 * See: DVR-143 (Petra fee payer error after upgrading to TS SDK 6.2.0)
 */

import {
  AccountAddress,
  Bool,
  Deserializer,
  EntryFunction,
  MoveOption,
  MoveString,
  MoveVector,
  RawTransaction,
  Serializer,
  SimpleTransaction,
  TransactionPayloadEntryFunction,
  TypeTagAddress,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
  I8,
  I16,
  I32,
  I64,
  I128,
  I256,
  ChainId,
  FeePayerRawTransaction,
} from "../../src";

/**
 * Creates a Serializer instance that mimics an older SDK version's Serializer
 * (one that does NOT have the `serializeAsBytes` method). This simulates what
 * happens when a wallet bundles an older SDK and tries to serialize a transaction
 * built with a newer SDK.
 */
function createLegacySerializer(): Serializer {
  const serializer = new Serializer();
  // Remove the serializeAsBytes method to simulate an older Serializer
  (serializer as Record<string, unknown>).serializeAsBytes = undefined;
  return serializer;
}

describe("Cross-version serializer compatibility (wallet adapter flow)", () => {
  describe("Move primitives serialize correctly with a legacy serializer", () => {
    const testCases: Array<{
      name: string;
      value: { serializeForEntryFunction(s: Serializer): void; bcsToBytes(): Uint8Array };
    }> = [
      { name: "Bool(true)", value: new Bool(true) },
      { name: "Bool(false)", value: new Bool(false) },
      { name: "U8(42)", value: new U8(42) },
      { name: "U16(1000)", value: new U16(1000) },
      { name: "U32(100000)", value: new U32(100000) },
      { name: "U64(1000000n)", value: new U64(1000000n) },
      { name: "U128(999999999999n)", value: new U128(999999999999n) },
      { name: "U256(12345678901234567890n)", value: new U256(12345678901234567890n) },
      { name: "I8(-42)", value: new I8(-42) },
      { name: "I16(-1000)", value: new I16(-1000) },
      { name: "I32(-100000)", value: new I32(-100000) },
      { name: "I64(-1000000n)", value: new I64(-1000000n) },
      { name: "I128(-999999999999n)", value: new I128(-999999999999n) },
      { name: "I256(-12345678901234567890n)", value: new I256(-12345678901234567890n) },
    ];

    for (const { name, value } of testCases) {
      it(`${name} produces identical bytes with legacy vs modern serializer`, () => {
        const modernSerializer = new Serializer();
        value.serializeForEntryFunction(modernSerializer);
        const modernBytes = modernSerializer.toUint8Array();

        const legacySerializer = createLegacySerializer();
        value.serializeForEntryFunction(legacySerializer);
        const legacyBytes = legacySerializer.toUint8Array();

        expect(legacyBytes).toEqual(modernBytes);
      });
    }
  });

  describe("Complex types serialize correctly with a legacy serializer", () => {
    it("AccountAddress produces identical bytes", () => {
      const addr = AccountAddress.from("0x1");

      const modernSerializer = new Serializer();
      addr.serializeForEntryFunction(modernSerializer);
      const modernBytes = modernSerializer.toUint8Array();

      const legacySerializer = createLegacySerializer();
      addr.serializeForEntryFunction(legacySerializer);
      const legacyBytes = legacySerializer.toUint8Array();

      expect(legacyBytes).toEqual(modernBytes);
    });

    it("MoveVector<U8> produces identical bytes", () => {
      const vec = MoveVector.U8([1, 2, 3, 4, 5]);

      const modernSerializer = new Serializer();
      vec.serializeForEntryFunction(modernSerializer);
      const modernBytes = modernSerializer.toUint8Array();

      const legacySerializer = createLegacySerializer();
      vec.serializeForEntryFunction(legacySerializer);
      const legacyBytes = legacySerializer.toUint8Array();

      expect(legacyBytes).toEqual(modernBytes);
    });

    it("MoveVector<U64> produces identical bytes", () => {
      const vec = MoveVector.U64([100n, 200n, 300n]);

      const modernSerializer = new Serializer();
      vec.serializeForEntryFunction(modernSerializer);
      const modernBytes = modernSerializer.toUint8Array();

      const legacySerializer = createLegacySerializer();
      vec.serializeForEntryFunction(legacySerializer);
      const legacyBytes = legacySerializer.toUint8Array();

      expect(legacyBytes).toEqual(modernBytes);
    });

    it("MoveString produces identical bytes", () => {
      const str = new MoveString("hello world");

      const modernSerializer = new Serializer();
      str.serializeForEntryFunction(modernSerializer);
      const modernBytes = modernSerializer.toUint8Array();

      const legacySerializer = createLegacySerializer();
      str.serializeForEntryFunction(legacySerializer);
      const legacyBytes = legacySerializer.toUint8Array();

      expect(legacyBytes).toEqual(modernBytes);
    });

    it("MoveOption<U64> produces identical bytes", () => {
      const opt = MoveOption.U64(12345n);

      const modernSerializer = new Serializer();
      opt.serializeForEntryFunction(modernSerializer);
      const modernBytes = modernSerializer.toUint8Array();

      const legacySerializer = createLegacySerializer();
      opt.serializeForEntryFunction(legacySerializer);
      const legacyBytes = legacySerializer.toUint8Array();

      expect(legacyBytes).toEqual(modernBytes);
    });
  });

  describe("Full transaction serialization with legacy serializer", () => {
    it("RawTransaction with entry function serializes correctly through a legacy serializer", () => {
      const sender = AccountAddress.from("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      const recipient = AccountAddress.from("0x1");
      const amount = new U64(100);

      const entryFunction = EntryFunction.build(
        "0x1::aptos_account",
        "transfer_coins",
        [new TypeTagAddress()],
        [recipient, amount],
      );
      const payload = new TransactionPayloadEntryFunction(entryFunction);
      const rawTxn = new RawTransaction(
        sender,
        0n,
        payload,
        200000n,
        100n,
        BigInt(Math.floor(Date.now() / 1000) + 600),
        new ChainId(2),
      );

      // Serialize with modern serializer
      const modernSerializer = new Serializer();
      rawTxn.serialize(modernSerializer);
      const modernBytes = modernSerializer.toUint8Array();

      // Simulate what a wallet with an older SDK would do:
      // create its own serializer (missing serializeAsBytes) and serialize the v6 RawTransaction
      const legacySerializer = createLegacySerializer();
      rawTxn.serialize(legacySerializer);
      const legacyBytes = legacySerializer.toUint8Array();

      expect(legacyBytes).toEqual(modernBytes);
    });

    it("SimpleTransaction (no fee payer) serializes correctly through a legacy serializer", () => {
      const sender = AccountAddress.from("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      const recipient = AccountAddress.from("0x1");
      const amount = new U64(100);

      const entryFunction = EntryFunction.build(
        "0x1::aptos_account",
        "transfer_coins",
        [new TypeTagAddress()],
        [recipient, amount],
      );
      const payload = new TransactionPayloadEntryFunction(entryFunction);
      const rawTxn = new RawTransaction(
        sender,
        0n,
        payload,
        200000n,
        100n,
        BigInt(Math.floor(Date.now() / 1000) + 600),
        new ChainId(2),
      );
      const simpleTxn = new SimpleTransaction(rawTxn);

      const modernSerializer = new Serializer();
      simpleTxn.serialize(modernSerializer);
      const modernBytes = modernSerializer.toUint8Array();

      const legacySerializer = createLegacySerializer();
      simpleTxn.serialize(legacySerializer);
      const legacyBytes = legacySerializer.toUint8Array();

      expect(legacyBytes).toEqual(modernBytes);
    });

    it("SimpleTransaction with fee payer serializes correctly through a legacy serializer", () => {
      const sender = AccountAddress.from("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      const recipient = AccountAddress.from("0x1");
      const amount = new U64(100);
      const feePayer = AccountAddress.from("0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321");

      const entryFunction = EntryFunction.build(
        "0x1::aptos_account",
        "transfer_coins",
        [new TypeTagAddress()],
        [recipient, amount],
      );
      const payload = new TransactionPayloadEntryFunction(entryFunction);
      const rawTxn = new RawTransaction(
        sender,
        0n,
        payload,
        200000n,
        100n,
        BigInt(Math.floor(Date.now() / 1000) + 600),
        new ChainId(2),
      );

      const simpleTxn = new SimpleTransaction(rawTxn, feePayer);

      const modernSerializer = new Serializer();
      simpleTxn.serialize(modernSerializer);
      const modernBytes = modernSerializer.toUint8Array();

      const legacySerializer = createLegacySerializer();
      simpleTxn.serialize(legacySerializer);
      const legacyBytes = legacySerializer.toUint8Array();

      expect(legacyBytes).toEqual(modernBytes);
    });

    it("FeePayerRawTransaction serializes correctly through a legacy serializer", () => {
      const sender = AccountAddress.from("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      const recipient = AccountAddress.from("0x1");
      const amount = new U64(100);
      const feePayer = AccountAddress.from("0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321");

      const entryFunction = EntryFunction.build(
        "0x1::aptos_account",
        "transfer_coins",
        [new TypeTagAddress()],
        [recipient, amount],
      );
      const payload = new TransactionPayloadEntryFunction(entryFunction);
      const rawTxn = new RawTransaction(
        sender,
        0n,
        payload,
        200000n,
        100n,
        BigInt(Math.floor(Date.now() / 1000) + 600),
        new ChainId(2),
      );

      const feePayerTxn = new FeePayerRawTransaction(rawTxn, [], feePayer);

      const modernSerializer = new Serializer();
      feePayerTxn.serialize(modernSerializer);
      const modernBytes = modernSerializer.toUint8Array();

      const legacySerializer = createLegacySerializer();
      feePayerTxn.serialize(legacySerializer);
      const legacyBytes = legacySerializer.toUint8Array();

      expect(legacyBytes).toEqual(modernBytes);
    });

    it("bcsToBytes still works correctly on transaction objects (uses internal v6 Serializer)", () => {
      const sender = AccountAddress.from("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      const recipient = AccountAddress.from("0x1");
      const amount = new U64(100);
      const feePayer = AccountAddress.from("0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321");

      const entryFunction = EntryFunction.build(
        "0x1::aptos_account",
        "transfer_coins",
        [new TypeTagAddress()],
        [recipient, amount],
      );
      const payload = new TransactionPayloadEntryFunction(entryFunction);
      const rawTxn = new RawTransaction(
        sender,
        0n,
        payload,
        200000n,
        100n,
        BigInt(Math.floor(Date.now() / 1000) + 600),
        new ChainId(2),
      );
      const simpleTxn = new SimpleTransaction(rawTxn, feePayer);

      // bcsToBytes uses the internal Serializer (which always has serializeAsBytes)
      const bytes = simpleTxn.bcsToBytes();
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);

      // Verify round-trip
      const deserializedTxn = SimpleTransaction.deserialize(new Deserializer(bytes));
      expect(deserializedTxn.rawTransaction.sender.toString()).toBe(sender.toString());
      expect(deserializedTxn.feePayerAddress?.toString()).toBe(feePayer.toString());
    });
  });

  describe("Wallet adapter simulation: wallet with older serializer signs a v6 fee payer transaction", () => {
    it("generates identical signing messages for fee payer transaction when serialized with legacy serializer", () => {
      const sender = AccountAddress.from("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      const recipient = AccountAddress.from("0x1");
      const amount = new U64(100);
      const feePayer = AccountAddress.from("0x0000000000000000000000000000000000000000000000000000000000000000");

      const entryFunction = EntryFunction.build(
        "0x1::aptos_account",
        "transfer_coins",
        [new TypeTagAddress()],
        [recipient, amount],
      );
      const payload = new TransactionPayloadEntryFunction(entryFunction);
      const rawTxn = new RawTransaction(
        sender,
        1n,
        payload,
        200000n,
        100n,
        BigInt(Math.floor(Date.now() / 1000) + 600),
        new ChainId(2),
      );

      // This is what the wallet would do: create a FeePayerRawTransaction from
      // the SimpleTransaction's fields and serialize it for signing
      const feePayerTxn = new FeePayerRawTransaction(rawTxn, [], feePayer);

      // Modern serializer (has serializeAsBytes)
      const modernSerializer = new Serializer();
      feePayerTxn.serialize(modernSerializer);
      const modernBytes = modernSerializer.toUint8Array();

      // Legacy serializer (lacks serializeAsBytes - simulates older wallet SDK)
      const legacySerializer = createLegacySerializer();
      feePayerTxn.serialize(legacySerializer);
      const legacyBytes = legacySerializer.toUint8Array();

      // The signing message must be identical regardless of serializer version
      expect(legacyBytes).toEqual(modernBytes);
    });
  });
});
