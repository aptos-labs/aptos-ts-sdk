import {
  EntryFunction,
  Hex,
  TransactionExecutableEntryFunction,
  TransactionExtraConfigV1,
  TransactionInnerPayloadV1,
  TransactionPayload,
} from "@aptos-labs/ts-sdk";
import { Serializer, Deserializer } from "@aptos-labs/ts-sdk";

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
