import { describe, expect, test } from "vitest";
import { Deserializer } from "../../../src/bcs/deserializer.js";
import {
  Bool,
  I8,
  I16,
  I32,
  I64,
  I128,
  I256,
  U8,
  U16,
  U32,
  U64,
  U128,
  U256,
} from "../../../src/bcs/move-primitives.js";
import {
  EntryFunctionBytes,
  FixedBytes,
  MoveOption,
  MoveString,
  MoveVector,
  Serialized,
} from "../../../src/bcs/move-structs.js";
import { Serializer } from "../../../src/bcs/serializer.js";

// ── Move Primitives ──

describe("Bool", () => {
  test("stores value", () => {
    expect(new Bool(true).value).toBe(true);
    expect(new Bool(false).value).toBe(false);
  });

  test("serializes and deserializes", () => {
    const b = new Bool(true);
    const bytes = b.bcsToBytes();
    expect(bytes).toEqual(new Uint8Array([0x01]));
    expect(Bool.deserialize(new Deserializer(bytes)).value).toBe(true);
  });

  test("throws on non-boolean", () => {
    // @ts-expect-error testing invalid input
    expect(() => new Bool(1)).toThrow();
  });
});

describe("Unsigned integers", () => {
  test("U8 round-trip", () => {
    const val = new U8(255);
    expect(val.value).toBe(255);
    const d = new Deserializer(val.bcsToBytes());
    expect(U8.deserialize(d).value).toBe(255);
  });

  test("U16 round-trip", () => {
    const val = new U16(65535);
    const d = new Deserializer(val.bcsToBytes());
    expect(U16.deserialize(d).value).toBe(65535);
  });

  test("U32 round-trip", () => {
    const val = new U32(4294967295);
    const d = new Deserializer(val.bcsToBytes());
    expect(U32.deserialize(d).value).toBe(4294967295);
  });

  test("U64 round-trip", () => {
    const val = new U64(18446744073709551615n);
    const d = new Deserializer(val.bcsToBytes());
    expect(U64.deserialize(d).value).toBe(18446744073709551615n);
  });

  test("U64 accepts number input", () => {
    const val = new U64(100);
    expect(val.value).toBe(100n);
  });

  test("U128 round-trip", () => {
    const val = new U128(340282366920938463463374607431768211455n);
    const d = new Deserializer(val.bcsToBytes());
    expect(U128.deserialize(d).value).toBe(340282366920938463463374607431768211455n);
  });

  test("U256 round-trip", () => {
    const val = new U256(1n);
    const d = new Deserializer(val.bcsToBytes());
    expect(U256.deserialize(d).value).toBe(1n);
  });

  test("U8 throws on out of range", () => {
    expect(() => new U8(256)).toThrow();
    expect(() => new U8(-1)).toThrow();
  });

  test("U64 throws on out of range", () => {
    expect(() => new U64(-1)).toThrow();
  });
});

describe("Signed integers", () => {
  test("I8 round-trip", () => {
    const val = new I8(-128);
    const d = new Deserializer(val.bcsToBytes());
    expect(I8.deserialize(d).value).toBe(-128);
  });

  test("I16 round-trip", () => {
    const val = new I16(-32768);
    const d = new Deserializer(val.bcsToBytes());
    expect(I16.deserialize(d).value).toBe(-32768);
  });

  test("I32 round-trip", () => {
    const val = new I32(-2147483648);
    const d = new Deserializer(val.bcsToBytes());
    expect(I32.deserialize(d).value).toBe(-2147483648);
  });

  test("I64 round-trip", () => {
    const val = new I64(-9223372036854775808n);
    const d = new Deserializer(val.bcsToBytes());
    expect(I64.deserialize(d).value).toBe(-9223372036854775808n);
  });

  test("I128 round-trip", () => {
    const val = new I128(-1n);
    const d = new Deserializer(val.bcsToBytes());
    expect(I128.deserialize(d).value).toBe(-1n);
  });

  test("I256 round-trip", () => {
    const val = new I256(-1n);
    const d = new Deserializer(val.bcsToBytes());
    expect(I256.deserialize(d).value).toBe(-1n);
  });

  test("I8 throws on out of range", () => {
    expect(() => new I8(128)).toThrow();
    expect(() => new I8(-129)).toThrow();
  });
});

describe("serializeForEntryFunction", () => {
  test("U8 serializes as bytes with length prefix", () => {
    const s = new Serializer();
    new U8(42).serializeForEntryFunction(s);
    // Length prefix (1) + value (42)
    expect(s.toUint8Array()).toEqual(new Uint8Array([1, 42]));
  });

  test("Bool serializes as bytes with length prefix", () => {
    const s = new Serializer();
    new Bool(true).serializeForEntryFunction(s);
    expect(s.toUint8Array()).toEqual(new Uint8Array([1, 1]));
  });
});

describe("serializeForScriptFunction", () => {
  test("U8 serializes with variant tag", () => {
    const s = new Serializer();
    new U8(42).serializeForScriptFunction(s);
    // Variant tag (0 = U8) + value (42)
    expect(s.toUint8Array()).toEqual(new Uint8Array([0, 42]));
  });

  test("Bool serializes with variant tag", () => {
    const s = new Serializer();
    new Bool(true).serializeForScriptFunction(s);
    // Variant tag (5 = Bool) + value (1)
    expect(s.toUint8Array()).toEqual(new Uint8Array([5, 1]));
  });
});

// ── Move Structs ──

describe("MoveString", () => {
  test("round-trip", () => {
    const str = new MoveString("hello world");
    const d = new Deserializer(str.bcsToBytes());
    expect(MoveString.deserialize(d).value).toBe("hello world");
  });

  test("bcsToHex returns hex representation", () => {
    const str = new MoveString("hi");
    expect(str.bcsToHex().toString()).toMatch(/^0x/);
  });
});

describe("MoveVector", () => {
  test("U8 factory from number array", () => {
    const vec = MoveVector.U8([1, 2, 3]);
    expect(vec.values.length).toBe(3);
    expect(vec.values[0].value).toBe(1);
  });

  test("U8 factory from Uint8Array", () => {
    const vec = MoveVector.U8(new Uint8Array([4, 5, 6]));
    expect(vec.values.length).toBe(3);
  });

  test("U8 factory from hex string", () => {
    const vec = MoveVector.U8("0x0102");
    expect(vec.values.length).toBe(2);
    expect(vec.values[0].value).toBe(1);
    expect(vec.values[1].value).toBe(2);
  });

  test("U8 factory from empty array", () => {
    const vec = MoveVector.U8([]);
    expect(vec.values.length).toBe(0);
  });

  test("Bool factory", () => {
    const vec = MoveVector.Bool([true, false, true]);
    expect(vec.values.length).toBe(3);
    expect(vec.values[1].value).toBe(false);
  });

  test("U64 factory", () => {
    const vec = MoveVector.U64([1n, 2n, 3n]);
    expect(vec.values.length).toBe(3);
  });

  test("I8 factory", () => {
    const vec = MoveVector.I8([-1, 0, 127]);
    expect(vec.values[0].value).toBe(-1);
  });

  test("MoveString factory", () => {
    const vec = MoveVector.MoveString(["hello", "world"]);
    expect(vec.values.length).toBe(2);
  });

  test("serializes and deserializes", () => {
    const vec = MoveVector.U8([10, 20, 30]);
    const bytes = vec.bcsToBytes();
    const d = new Deserializer(bytes);
    const result = MoveVector.deserialize(d, U8);
    expect(result.values.length).toBe(3);
    expect(result.values[0].value).toBe(10);
    expect(result.values[2].value).toBe(30);
  });

  test("serializeForEntryFunction wraps with length prefix", () => {
    const s = new Serializer();
    const vec = MoveVector.U8([1, 2]);
    vec.serializeForEntryFunction(s);
    // Length of BCS bytes + the BCS vector data
    const result = s.toUint8Array();
    expect(result[0]).toBe(3); // BCS vector [2, 1, 2] is 3 bytes
  });
});

describe("MoveOption", () => {
  test("U8 with value", () => {
    const opt = MoveOption.U8(42);
    expect(opt.isSome()).toBe(true);
    expect(opt.unwrap().value).toBe(42);
    expect(opt.value?.value).toBe(42);
  });

  test("U8 without value", () => {
    const opt = MoveOption.U8(undefined);
    expect(opt.isSome()).toBe(false);
    expect(opt.value).toBeUndefined();
  });

  test("U8 with null", () => {
    const opt = MoveOption.U8(null);
    expect(opt.isSome()).toBe(false);
  });

  test("unwrap throws when empty", () => {
    const opt = MoveOption.U8(undefined);
    expect(() => opt.unwrap()).toThrow("Called unwrap on a MoveOption with no value");
  });

  test("Bool factory", () => {
    const opt = MoveOption.Bool(true);
    expect(opt.isSome()).toBe(true);
    expect(opt.unwrap().value).toBe(true);
  });

  test("MoveString factory", () => {
    const opt = MoveOption.MoveString("hello");
    expect(opt.isSome()).toBe(true);
    expect(opt.unwrap().value).toBe("hello");
  });

  test("serializes some value", () => {
    const opt = MoveOption.U8(5);
    const bytes = opt.bcsToBytes();
    // MoveOption serializes as MoveVector: [length=1, value]
    expect(bytes).toEqual(new Uint8Array([1, 5]));
  });

  test("serializes none value", () => {
    const opt = MoveOption.U8(undefined);
    const bytes = opt.bcsToBytes();
    // MoveOption serializes as MoveVector: [length=0]
    expect(bytes).toEqual(new Uint8Array([0]));
  });

  test("round-trip with deserialization", () => {
    const opt = MoveOption.U64(12345n);
    const bytes = opt.bcsToBytes();
    const d = new Deserializer(bytes);
    const result = MoveOption.deserialize(d, U64);
    expect(result.isSome()).toBe(true);
    expect(result.unwrap().value).toBe(12345n);
  });

  test("signed integer factories", () => {
    expect(MoveOption.I8(-1)?.isSome()).toBe(true);
    expect(MoveOption.I16(-1)?.isSome()).toBe(true);
    expect(MoveOption.I32(-1)?.isSome()).toBe(true);
    expect(MoveOption.I64(-1n)?.isSome()).toBe(true);
    expect(MoveOption.I128(-1n)?.isSome()).toBe(true);
    expect(MoveOption.I256(-1n)?.isSome()).toBe(true);
  });
});

describe("Serialized", () => {
  test("serializes bytes with length prefix", () => {
    const s = new Serialized(new Uint8Array([1, 2, 3]));
    const bytes = s.bcsToBytes();
    expect(bytes).toEqual(new Uint8Array([3, 1, 2, 3]));
  });

  test("round-trip", () => {
    const s = new Serialized(new Uint8Array([10, 20]));
    const d = new Deserializer(s.bcsToBytes());
    const result = Serialized.deserialize(d);
    expect(result.value).toEqual(new Uint8Array([10, 20]));
  });

  test("accepts hex string", () => {
    const s = new Serialized("0x0102");
    expect(s.value).toEqual(new Uint8Array([1, 2]));
  });
});

describe("FixedBytes", () => {
  test("serializes without length prefix", () => {
    const fb = new FixedBytes(new Uint8Array([1, 2, 3]));
    expect(fb.bcsToBytes()).toEqual(new Uint8Array([1, 2, 3]));
  });

  test("accepts hex string", () => {
    const fb = new FixedBytes("0x0102");
    expect(fb.value).toEqual(new Uint8Array([1, 2]));
  });

  test("round-trip", () => {
    const fb = new FixedBytes(new Uint8Array([10, 20, 30]));
    const d = new Deserializer(fb.bcsToBytes());
    const result = FixedBytes.deserialize(d, 3);
    expect(result.value).toEqual(new Uint8Array([10, 20, 30]));
  });
});

describe("EntryFunctionBytes", () => {
  test("deserialize and re-serialize", () => {
    // Simulate creating EntryFunctionBytes via deserialization
    const d = new Deserializer(new Uint8Array([0xab, 0xcd]));
    const efb = EntryFunctionBytes.deserialize(d, 2);
    expect(efb.value.value).toEqual(new Uint8Array([0xab, 0xcd]));
  });

  test("serializeForEntryFunction adds length prefix", () => {
    const d = new Deserializer(new Uint8Array([0x01, 0x02]));
    const efb = EntryFunctionBytes.deserialize(d, 2);
    const s = new Serializer();
    efb.serializeForEntryFunction(s);
    // Length prefix (2) + the 2 bytes
    expect(s.toUint8Array()).toEqual(new Uint8Array([2, 0x01, 0x02]));
  });
});
