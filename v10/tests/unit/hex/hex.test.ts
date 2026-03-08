import { describe, expect, test } from "vitest";
import { Hex, HexInvalidReason, hexToAsciiString, ParsingError } from "../../../src/hex/index.js";

describe("Hex", () => {
  test("creates from Uint8Array", () => {
    const hex = new Hex(new Uint8Array([0xab, 0xcd]));
    expect(hex.toUint8Array()).toEqual(new Uint8Array([0xab, 0xcd]));
  });

  test("converts to string with 0x prefix", () => {
    const hex = new Hex(new Uint8Array([0x41, 0x42]));
    expect(hex.toString()).toBe("0x4142");
  });

  test("converts to string without 0x prefix", () => {
    const hex = new Hex(new Uint8Array([0x41, 0x42]));
    expect(hex.toStringWithoutPrefix()).toBe("4142");
  });

  test("fromHexString with 0x prefix", () => {
    const hex = Hex.fromHexString("0xabcd");
    expect(hex.toUint8Array()).toEqual(new Uint8Array([0xab, 0xcd]));
  });

  test("fromHexString without 0x prefix", () => {
    const hex = Hex.fromHexString("abcd");
    expect(hex.toUint8Array()).toEqual(new Uint8Array([0xab, 0xcd]));
  });

  test("fromHexString throws on empty string", () => {
    expect(() => Hex.fromHexString("0x")).toThrow(ParsingError);
    expect(() => Hex.fromHexString("")).toThrow(ParsingError);
  });

  test("fromHexString throws on odd-length string", () => {
    expect(() => Hex.fromHexString("abc")).toThrow(ParsingError);
  });

  test("fromHexString throws on invalid hex chars", () => {
    expect(() => Hex.fromHexString("0xgg")).toThrow(ParsingError);
  });

  test("fromHexInput handles string", () => {
    const hex = Hex.fromHexInput("0x1234");
    expect(hex.toUint8Array()).toEqual(new Uint8Array([0x12, 0x34]));
  });

  test("fromHexInput handles Uint8Array", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const hex = Hex.fromHexInput(bytes);
    expect(hex.toUint8Array()).toBe(bytes);
  });

  test("hexInputToUint8Array", () => {
    expect(Hex.hexInputToUint8Array("0x0102")).toEqual(new Uint8Array([1, 2]));
    const bytes = new Uint8Array([5, 6]);
    expect(Hex.hexInputToUint8Array(bytes)).toBe(bytes);
  });

  test("hexInputToString", () => {
    expect(Hex.hexInputToString("abcd")).toBe("0xabcd");
    expect(Hex.hexInputToString(new Uint8Array([0xab, 0xcd]))).toBe("0xabcd");
  });

  test("hexInputToStringWithoutPrefix", () => {
    expect(Hex.hexInputToStringWithoutPrefix("0xabcd")).toBe("abcd");
  });

  test("isValid returns valid for good input", () => {
    const result = Hex.isValid("0xabcd");
    expect(result.valid).toBe(true);
  });

  test("isValid returns invalid reason for bad input", () => {
    const result = Hex.isValid("0x");
    expect(result.valid).toBe(false);
    expect(result.invalidReason).toBe(HexInvalidReason.TOO_SHORT);
  });

  test("isValid detects odd length", () => {
    const result = Hex.isValid("abc");
    expect(result.valid).toBe(false);
    expect(result.invalidReason).toBe(HexInvalidReason.INVALID_LENGTH);
  });

  test("isValid detects invalid chars", () => {
    const result = Hex.isValid("0xzzzz");
    expect(result.valid).toBe(false);
    expect(result.invalidReason).toBe(HexInvalidReason.INVALID_HEX_CHARS);
  });

  test("equals compares correctly", () => {
    const a = Hex.fromHexString("0x1234");
    const b = Hex.fromHexString("1234");
    const c = Hex.fromHexString("0x5678");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  test("equals returns false for different lengths", () => {
    const a = Hex.fromHexString("0x12");
    const b = Hex.fromHexString("0x1234");
    expect(a.equals(b)).toBe(false);
  });
});

describe("hexToAsciiString", () => {
  test("converts hex to ASCII", () => {
    expect(hexToAsciiString("0x48656c6c6f")).toBe("Hello");
  });
});
