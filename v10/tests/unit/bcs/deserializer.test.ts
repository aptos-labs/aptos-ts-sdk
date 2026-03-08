import { describe, expect, test } from "vitest";
import { Deserializer } from "../../../src/bcs/deserializer.js";
import { Serializable, Serializer } from "../../../src/bcs/serializer.js";

describe("Deserializer", () => {
  // ── Boolean ──

  test("deserializes true", () => {
    const d = new Deserializer(new Uint8Array([0x01]));
    expect(d.deserializeBool()).toBe(true);
  });

  test("deserializes false", () => {
    const d = new Deserializer(new Uint8Array([0x00]));
    expect(d.deserializeBool()).toBe(false);
  });

  test("throws on invalid boolean", () => {
    const d = new Deserializer(new Uint8Array([0x02]));
    expect(() => d.deserializeBool()).toThrow("Invalid boolean value");
  });

  // ── Unsigned integers ──

  test("deserializes U8", () => {
    const d = new Deserializer(new Uint8Array([0xff]));
    expect(d.deserializeU8()).toBe(255);
  });

  test("deserializes U16", () => {
    const d = new Deserializer(new Uint8Array([0x34, 0x12]));
    expect(d.deserializeU16()).toBe(0x1234);
  });

  test("deserializes U32", () => {
    const d = new Deserializer(new Uint8Array([0x78, 0x56, 0x34, 0x12]));
    expect(d.deserializeU32()).toBe(0x12345678);
  });

  test("deserializes U64", () => {
    const d = new Deserializer(new Uint8Array([0x00, 0xef, 0xcd, 0xab, 0x78, 0x56, 0x34, 0x12]));
    expect(d.deserializeU64()).toBe(BigInt("1311768467750121216"));
  });

  test("deserializes max U64", () => {
    const d = new Deserializer(new Uint8Array(8).fill(0xff));
    expect(d.deserializeU64()).toBe(18446744073709551615n);
  });

  test("deserializes U128", () => {
    const bytes = new Uint8Array(16);
    bytes[0] = 1;
    const d = new Deserializer(bytes);
    expect(d.deserializeU128()).toBe(1n);
  });

  test("deserializes U256", () => {
    const bytes = new Uint8Array(32);
    bytes[0] = 1;
    const d = new Deserializer(bytes);
    expect(d.deserializeU256()).toBe(1n);
  });

  // ── Signed integers ──

  test("deserializes I8 negative", () => {
    const d = new Deserializer(new Uint8Array([0xff]));
    expect(d.deserializeI8()).toBe(-1);
  });

  test("deserializes I8 positive", () => {
    const d = new Deserializer(new Uint8Array([0x7f]));
    expect(d.deserializeI8()).toBe(127);
  });

  test("deserializes I16 negative", () => {
    const d = new Deserializer(new Uint8Array([0xff, 0xff]));
    expect(d.deserializeI16()).toBe(-1);
  });

  test("deserializes I32 negative", () => {
    const d = new Deserializer(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
    expect(d.deserializeI32()).toBe(-1);
  });

  test("deserializes I64 negative", () => {
    const d = new Deserializer(new Uint8Array(8).fill(0xff));
    expect(d.deserializeI64()).toBe(-1n);
  });

  test("deserializes I64 positive", () => {
    const bytes = new Uint8Array(8);
    bytes[0] = 1;
    const d = new Deserializer(bytes);
    expect(d.deserializeI64()).toBe(1n);
  });

  test("deserializes I128 negative", () => {
    const d = new Deserializer(new Uint8Array(16).fill(0xff));
    expect(d.deserializeI128()).toBe(-1n);
  });

  test("deserializes I256 negative", () => {
    const d = new Deserializer(new Uint8Array(32).fill(0xff));
    expect(d.deserializeI256()).toBe(-1n);
  });

  // ── String / Bytes ──

  test("deserializes string", () => {
    const d = new Deserializer(new Uint8Array([8, 49, 50, 51, 52, 97, 98, 99, 100]));
    expect(d.deserializeStr()).toBe("1234abcd");
  });

  test("deserializes empty string", () => {
    const d = new Deserializer(new Uint8Array([0]));
    expect(d.deserializeStr()).toBe("");
  });

  test("deserializes bytes", () => {
    const d = new Deserializer(new Uint8Array([3, 1, 2, 3]));
    expect(d.deserializeBytes()).toEqual(new Uint8Array([1, 2, 3]));
  });

  test("deserializes fixed bytes", () => {
    const d = new Deserializer(new Uint8Array([1, 2, 3]));
    expect(d.deserializeFixedBytes(3)).toEqual(new Uint8Array([1, 2, 3]));
  });

  test("deserialized bytes are a copy", () => {
    const d = new Deserializer(new Uint8Array([3, 1, 2, 3]));
    const bytes = d.deserializeBytes();
    bytes[0] = 99; // modifying should not affect deserializer
    const d2 = new Deserializer(new Uint8Array([3, 1, 2, 3]));
    expect(d2.deserializeBytes()).toEqual(new Uint8Array([1, 2, 3]));
  });

  // ── ULEB128 ──

  test("deserializes ULEB128 single byte", () => {
    const d = new Deserializer(new Uint8Array([0x00]));
    expect(d.deserializeUleb128AsU32()).toBe(0);
  });

  test("deserializes ULEB128 multi-byte", () => {
    const d = new Deserializer(new Uint8Array([0x80, 0x01]));
    expect(d.deserializeUleb128AsU32()).toBe(128);
  });

  // ── Composable ──

  test("deserializes vector", () => {
    class SimpleU8 extends Serializable {
      constructor(public val: number) {
        super();
      }
      serialize(s: Serializer): void {
        s.serializeU8(this.val);
      }
      static deserialize(d: Deserializer): SimpleU8 {
        return new SimpleU8(d.deserializeU8());
      }
    }
    const d = new Deserializer(new Uint8Array([3, 1, 2, 3]));
    const vec = d.deserializeVector(SimpleU8);
    expect(vec.map((v) => v.val)).toEqual([1, 2, 3]);
  });

  test("deserializeOption with value", () => {
    const d = new Deserializer(new Uint8Array([1, 5, 104, 101, 108, 108, 111]));
    expect(d.deserializeOption("string")).toBe("hello");
  });

  test("deserializeOption without value", () => {
    const d = new Deserializer(new Uint8Array([0]));
    expect(d.deserializeOption("string")).toBeUndefined();
  });

  test("deserializeOption bytes", () => {
    const d = new Deserializer(new Uint8Array([1, 3, 1, 2, 3]));
    expect(d.deserializeOption("bytes")).toEqual(new Uint8Array([1, 2, 3]));
  });

  test("deserializeOption fixedBytes", () => {
    const d = new Deserializer(new Uint8Array([1, 1, 2, 3]));
    expect(d.deserializeOption("fixedBytes", 3)).toEqual(new Uint8Array([1, 2, 3]));
  });

  test("deserializeOption fixedBytes throws without length", () => {
    const d = new Deserializer(new Uint8Array([1, 1, 2, 3]));
    // @ts-expect-error testing missing length
    expect(() => d.deserializeOption("fixedBytes")).toThrow("Fixed bytes length not provided");
  });

  // ── Buffer management ──

  test("remaining() tracks position", () => {
    const d = new Deserializer(new Uint8Array([1, 2, 3]));
    expect(d.remaining()).toBe(3);
    d.deserializeU8();
    expect(d.remaining()).toBe(2);
  });

  test("assertFinished passes when buffer is consumed", () => {
    const d = new Deserializer(new Uint8Array([1]));
    d.deserializeU8();
    expect(() => d.assertFinished()).not.toThrow();
  });

  test("assertFinished throws when buffer has remaining bytes", () => {
    const d = new Deserializer(new Uint8Array([1, 2]));
    d.deserializeU8();
    expect(() => d.assertFinished()).toThrow("Buffer has remaining bytes");
  });

  test("throws when reading past end of buffer", () => {
    const d = new Deserializer(new Uint8Array([1]));
    d.deserializeU8();
    expect(() => d.deserializeU8()).toThrow("Reached to the end of buffer");
  });

  test("fromHex creates from hex string", () => {
    const d = Deserializer.fromHex("0x01ff");
    expect(d.deserializeU8()).toBe(1);
    expect(d.deserializeU8()).toBe(255);
  });
});

describe("Serializer/Deserializer round-trip", () => {
  test("round-trips all unsigned types", () => {
    const s = new Serializer();
    s.serializeU8(42);
    s.serializeU16(1234);
    s.serializeU32(123456789);
    s.serializeU64(9876543210n);
    s.serializeU128(99999999999999999999n);
    s.serializeU256(1n);

    const d = new Deserializer(s.toUint8Array());
    expect(d.deserializeU8()).toBe(42);
    expect(d.deserializeU16()).toBe(1234);
    expect(d.deserializeU32()).toBe(123456789);
    expect(d.deserializeU64()).toBe(9876543210n);
    expect(d.deserializeU128()).toBe(99999999999999999999n);
    expect(d.deserializeU256()).toBe(1n);
    d.assertFinished();
  });

  test("round-trips all signed types", () => {
    const s = new Serializer();
    s.serializeI8(-42);
    s.serializeI16(-1234);
    s.serializeI32(-123456789);
    s.serializeI64(-9876543210n);
    s.serializeI128(-99999999999999999999n);
    s.serializeI256(-1n);

    const d = new Deserializer(s.toUint8Array());
    expect(d.deserializeI8()).toBe(-42);
    expect(d.deserializeI16()).toBe(-1234);
    expect(d.deserializeI32()).toBe(-123456789);
    expect(d.deserializeI64()).toBe(-9876543210n);
    expect(d.deserializeI128()).toBe(-99999999999999999999n);
    expect(d.deserializeI256()).toBe(-1n);
    d.assertFinished();
  });

  test("round-trips string and bytes", () => {
    const s = new Serializer();
    s.serializeStr("Hello, World!");
    s.serializeBytes(new Uint8Array([1, 2, 3, 4, 5]));
    s.serializeBool(true);

    const d = new Deserializer(s.toUint8Array());
    expect(d.deserializeStr()).toBe("Hello, World!");
    expect(d.deserializeBytes()).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    expect(d.deserializeBool()).toBe(true);
    d.assertFinished();
  });
});
