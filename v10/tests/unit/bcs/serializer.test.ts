import { beforeEach, describe, expect, test } from "vitest";
import {
  ensureBoolean,
  outOfRangeErrorMessage,
  Serializable,
  Serializer,
  validateNumberInRange,
} from "../../../src/bcs/serializer.js";

describe("Serializer", () => {
  let serializer: Serializer;

  beforeEach(() => {
    serializer = new Serializer();
  });

  test("throws on zero-length buffer", () => {
    expect(() => new Serializer(0)).toThrow("Length needs to be greater than 0");
  });

  // ── Boolean ──

  test("serializes true", () => {
    serializer.serializeBool(true);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0x01]));
  });

  test("serializes false", () => {
    serializer.serializeBool(false);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0x00]));
  });

  test("throws on non-boolean", () => {
    // @ts-expect-error testing invalid input
    expect(() => serializer.serializeBool(123)).toThrow("is not a boolean value");
  });

  // ── Unsigned integers ──

  test("serializes U8", () => {
    serializer.serializeU8(255);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0xff]));
  });

  test("throws on U8 out of range", () => {
    expect(() => serializer.serializeU8(256)).toThrow();
    expect(() => serializer.serializeU8(-1)).toThrow();
  });

  test("serializes U16 little-endian", () => {
    serializer.serializeU16(0x1234);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0x34, 0x12]));
  });

  test("serializes U32 little-endian", () => {
    serializer.serializeU32(0x12345678);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0x78, 0x56, 0x34, 0x12]));
  });

  test("serializes U64", () => {
    serializer.serializeU64(BigInt("1311768467750121216"));
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0x00, 0xef, 0xcd, 0xab, 0x78, 0x56, 0x34, 0x12]));
  });

  test("serializes max U64", () => {
    serializer.serializeU64(18446744073709551615n);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));
  });

  test("serializes U128", () => {
    serializer.serializeU128(1n);
    const expected = new Uint8Array(16);
    expected[0] = 1;
    expect(serializer.toUint8Array()).toEqual(expected);
  });

  test("serializes U256", () => {
    serializer.serializeU256(1n);
    const expected = new Uint8Array(32);
    expected[0] = 1;
    expect(serializer.toUint8Array()).toEqual(expected);
  });

  // ── Signed integers ──

  test("serializes I8", () => {
    serializer.serializeI8(-1);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0xff]));
  });

  test("serializes I16", () => {
    serializer.serializeI16(-1);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0xff, 0xff]));
  });

  test("serializes I32", () => {
    serializer.serializeI32(-1);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
  });

  test("serializes I64 positive", () => {
    serializer.serializeI64(1n);
    const expected = new Uint8Array(8);
    expected[0] = 1;
    expect(serializer.toUint8Array()).toEqual(expected);
  });

  test("serializes I64 negative", () => {
    serializer.serializeI64(-1n);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));
  });

  test("serializes I128 negative", () => {
    serializer.serializeI128(-1n);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array(16).fill(0xff));
  });

  test("serializes I256 negative", () => {
    serializer.serializeI256(-1n);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array(32).fill(0xff));
  });

  test("throws on I8 out of range", () => {
    expect(() => serializer.serializeI8(128)).toThrow();
    expect(() => serializer.serializeI8(-129)).toThrow();
  });

  // ── String / Bytes ──

  test("serializes string with length prefix", () => {
    serializer.serializeStr("1234abcd");
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([8, 49, 50, 51, 52, 97, 98, 99, 100]));
  });

  test("serializes empty string", () => {
    serializer.serializeStr("");
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0]));
  });

  test("serializes bytes with length prefix", () => {
    serializer.serializeBytes(new Uint8Array([1, 2, 3]));
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([3, 1, 2, 3]));
  });

  test("serializes fixed bytes without length prefix", () => {
    serializer.serializeFixedBytes(new Uint8Array([1, 2, 3]));
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([1, 2, 3]));
  });

  // ── ULEB128 ──

  test("serializes ULEB128", () => {
    serializer.serializeU32AsUleb128(0);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0]));
  });

  test("serializes ULEB128 multi-byte", () => {
    serializer.serializeU32AsUleb128(128);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0x80, 0x01]));
  });

  // ── Composable ──

  test("serializes vector", () => {
    class SimpleU8 extends Serializable {
      constructor(public val: number) {
        super();
      }
      serialize(s: Serializer): void {
        s.serializeU8(this.val);
      }
    }
    serializer.serializeVector([new SimpleU8(1), new SimpleU8(2), new SimpleU8(3)]);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([3, 1, 2, 3]));
  });

  test("serializeAsBytes wraps with length prefix", () => {
    class SimpleU16 extends Serializable {
      constructor(public val: number) {
        super();
      }
      serialize(s: Serializer): void {
        s.serializeU16(this.val);
      }
    }
    serializer.serializeAsBytes(new SimpleU16(0x0102));
    // U16 serializes as 2 bytes, so length prefix is 2, then the LE bytes
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([2, 0x02, 0x01]));
  });

  test("serializeOption with value", () => {
    serializer.serializeOption("hello");
    const expected = new Uint8Array([1, 5, 104, 101, 108, 108, 111]);
    expect(serializer.toUint8Array()).toEqual(expected);
  });

  test("serializeOption without value", () => {
    serializer.serializeOption(undefined);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0]));
  });

  // ── Buffer management ──

  test("grows buffer when needed", () => {
    const small = new Serializer(4);
    small.serializeFixedBytes(new Uint8Array(100));
    expect(small.toUint8Array().length).toBe(100);
  });

  test("reset clears buffer", () => {
    serializer.serializeU8(42);
    serializer.reset();
    expect(serializer.getOffset()).toBe(0);
  });

  test("toUint8ArrayView returns a view", () => {
    serializer.serializeU8(1);
    const view = serializer.toUint8ArrayView();
    expect(view.length).toBe(1);
    expect(view[0]).toBe(1);
  });
});

describe("Validation helpers", () => {
  test("ensureBoolean passes for boolean", () => {
    expect(() => ensureBoolean(true)).not.toThrow();
    expect(() => ensureBoolean(false)).not.toThrow();
  });

  test("ensureBoolean throws for non-boolean", () => {
    expect(() => ensureBoolean(1)).toThrow();
    expect(() => ensureBoolean("true")).toThrow();
  });

  test("validateNumberInRange passes for valid range", () => {
    expect(() => validateNumberInRange(5, 0, 10)).not.toThrow();
    expect(() => validateNumberInRange(0n, 0n, 100n)).not.toThrow();
  });

  test("validateNumberInRange throws for out of range", () => {
    expect(() => validateNumberInRange(11, 0, 10)).toThrow();
    expect(() => validateNumberInRange(-1, 0, 10)).toThrow();
  });

  test("outOfRangeErrorMessage formats correctly", () => {
    expect(outOfRangeErrorMessage(5, 0, 3)).toBe("5 is out of range: [0, 3]");
  });
});
