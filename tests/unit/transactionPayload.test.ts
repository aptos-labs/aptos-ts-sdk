import {
  AccountAddress,
  EntryFunction,
  Hex,
  MultiSig,
  MultiSigTransactionPayload,
  Script,
  TransactionExecutableEntryFunction,
  TransactionExecutableScript,
  TransactionExtraConfigV1,
  TransactionInnerPayloadV1,
  TransactionPayload,
  TransactionPayloadMultiSig,
  Serializer,
  Deserializer,
  U64,
} from "../../src/index.js";

const TURBO_TXN =
  "0x04000100000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e74087472616e73666572000220bd3c821fc733b9e0a022c7fa2fe24e5a5a0c5b66c9624d5a63ea735628818f1008e8030000000000000000010001000000000000";

// This is specifically to ensure compatibility with other SDKs and nodes
describe("parseEncodedTransactions", () => {
  test("parse a valid orderless transaction", () => {
    const des = new Deserializer(Hex.fromHexInput(TURBO_TXN).toUint8Array());
    const payload = TransactionPayload.deserialize(des);
    expect(payload).toBeDefined();
  });

  test("serializes and deserializes a orderless transaction", () => {
    const input = Hex.fromHexInput(TURBO_TXN).toUint8Array();
    const des = new Deserializer(input);
    const payload = TransactionPayload.deserialize(des);
    const ser = new Serializer();
    ser.serialize(payload);
    const serialized = ser.toUint8Array();
    expect(serialized).toEqual(input);

    const reDes = new Deserializer(serialized);
    const rePayload = TransactionPayload.deserialize(reDes);
    expect(rePayload).toEqual(payload);
  });

  test("building a orderless transaction payload", () => {
    const payload = new TransactionInnerPayloadV1(
      new TransactionExecutableEntryFunction(EntryFunction.build("0x1::aptos_account", "transfer", [], [])),
      new TransactionExtraConfigV1(),
    );

    const ser = new Serializer();
    ser.serialize(payload);
    const serialized = ser.toUint8Array();

    const reDes = new Deserializer(serialized);
    const rePayload = TransactionPayload.deserialize(reDes);
    expect(rePayload).toEqual(payload);
  });
});

describe("MultiSigTransactionPayload", () => {
  test("serializes and deserializes with EntryFunction (variant 0)", () => {
    const entryFunction = EntryFunction.build("0x1::aptos_account", "transfer", [], []);
    const payload = new MultiSigTransactionPayload(entryFunction);

    const ser = new Serializer();
    payload.serialize(ser);
    const bytes = ser.toUint8Array();

    const des = new Deserializer(bytes);
    const deserialized = MultiSigTransactionPayload.deserialize(des);
    expect(deserialized.transaction_payload).toBeInstanceOf(EntryFunction);
  });

  test("serializes and deserializes with Script (variant 1)", () => {
    const script = new Script(new Uint8Array([0xde, 0xad]), [], [new U64(42)]);
    const payload = new MultiSigTransactionPayload(script);

    const ser = new Serializer();
    payload.serialize(ser);
    const bytes = ser.toUint8Array();

    // Verify variant byte is 1 (Script)
    expect(bytes[0]).toBe(1);

    const des = new Deserializer(bytes);
    const deserialized = MultiSigTransactionPayload.deserialize(des);
    expect(deserialized.transaction_payload).toBeInstanceOf(Script);
  });

  test("EntryFunction variant byte is 0", () => {
    const entryFunction = EntryFunction.build("0x1::aptos_account", "transfer", [], []);
    const payload = new MultiSigTransactionPayload(entryFunction);

    const ser = new Serializer();
    payload.serialize(ser);
    const bytes = ser.toUint8Array();

    expect(bytes[0]).toBe(0);
  });

  test("round-trips a full multisig script payload through TransactionPayloadMultiSig", () => {
    const script = new Script(new Uint8Array([0xca, 0xfe]), [], []);
    const multisigAddress = AccountAddress.ONE;
    const multisig = new MultiSig(multisigAddress, new MultiSigTransactionPayload(script));
    const txPayload = new TransactionPayloadMultiSig(multisig);

    const ser = new Serializer();
    txPayload.serialize(ser);
    const bytes = ser.toUint8Array();

    const des = new Deserializer(bytes);
    const deserialized = TransactionPayload.deserialize(des);
    expect(deserialized).toBeInstanceOf(TransactionPayloadMultiSig);
    const msPayload = deserialized as TransactionPayloadMultiSig;
    expect(msPayload.multiSig.transaction_payload?.transaction_payload).toBeInstanceOf(Script);
  });

  test("building an orderless multisig script payload", () => {
    const script = new Script(new Uint8Array([0xbe, 0xef]), [], []);
    const payload = new TransactionInnerPayloadV1(
      new TransactionExecutableScript(script),
      new TransactionExtraConfigV1(AccountAddress.ONE),
    );

    const ser = new Serializer();
    ser.serialize(payload);
    const serialized = ser.toUint8Array();

    const reDes = new Deserializer(serialized);
    const rePayload = TransactionPayload.deserialize(reDes);
    expect(rePayload).toEqual(payload);
  });
});
