import { describe, expect, it } from "vitest";
import { Deserializer } from "../../../src/bcs/deserializer.js";
import { Serializer } from "../../../src/bcs/serializer.js";
import { AccountAddress, AddressInvalidReason } from "../../../src/core/account-address.js";

type Addresses = {
  shortWith0x: string;
  shortWithout0x: string;
  longWith0x: string;
  longWithout0x: string;
  bytes: Uint8Array;
};

const ADDRESS_ZERO: Addresses = {
  shortWith0x: "0x0",
  shortWithout0x: "0",
  longWith0x: "0x0000000000000000000000000000000000000000000000000000000000000000",
  longWithout0x: "0000000000000000000000000000000000000000000000000000000000000000",
  bytes: new Uint8Array(32),
};

const ADDRESS_ONE: Addresses = {
  shortWith0x: "0x1",
  shortWithout0x: "1",
  longWith0x: "0x0000000000000000000000000000000000000000000000000000000000000001",
  longWithout0x: "0000000000000000000000000000000000000000000000000000000000000001",
  bytes: new Uint8Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
  ]),
};

const ADDRESS_F: Addresses = {
  shortWith0x: "0xf",
  shortWithout0x: "f",
  longWith0x: "0x000000000000000000000000000000000000000000000000000000000000000f",
  longWithout0x: "000000000000000000000000000000000000000000000000000000000000000f",
  bytes: new Uint8Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15,
  ]),
};

const ADDRESS_TEN: Addresses = {
  shortWith0x: "0x10",
  shortWithout0x: "10",
  longWith0x: "0x0000000000000000000000000000000000000000000000000000000000000010",
  longWithout0x: "0000000000000000000000000000000000000000000000000000000000000010",
  bytes: new Uint8Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16,
  ]),
};

const ADDRESS_OTHER: Addresses = {
  shortWith0x: "0xca843279e3427144cead5e4d5999a3d0ca843279e3427144cead5e4d5999a3d0",
  shortWithout0x: "ca843279e3427144cead5e4d5999a3d0ca843279e3427144cead5e4d5999a3d0",
  longWith0x: "0xca843279e3427144cead5e4d5999a3d0ca843279e3427144cead5e4d5999a3d0",
  longWithout0x: "ca843279e3427144cead5e4d5999a3d0ca843279e3427144cead5e4d5999a3d0",
  bytes: new Uint8Array([
    202, 132, 50, 121, 227, 66, 113, 68, 206, 173, 94, 77, 89, 153, 163, 208, 202, 132, 50, 121, 227, 66, 113, 68, 206,
    173, 94, 77, 89, 153, 163, 208,
  ]),
};

describe("AccountAddress fromString", () => {
  it("parses special address: 0x0", () => {
    expect(AccountAddress.fromString(ADDRESS_ZERO.longWith0x).toString()).toBe(ADDRESS_ZERO.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_ZERO.longWithout0x).toString()).toBe(ADDRESS_ZERO.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_ZERO.shortWith0x).toString()).toBe(ADDRESS_ZERO.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_ZERO.shortWithout0x).toString()).toBe(ADDRESS_ZERO.shortWith0x);
  });

  it("parses special address: 0x1", () => {
    expect(AccountAddress.fromString(ADDRESS_ONE.longWith0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_ONE.shortWith0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
  });

  it("parses special address: 0xf", () => {
    expect(AccountAddress.fromString(ADDRESS_F.longWith0x).toString()).toBe(ADDRESS_F.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_F.shortWith0x).toString()).toBe(ADDRESS_F.shortWith0x);
  });

  it("parses padded short form: 0x0f", () => {
    expect(AccountAddress.fromString("0x0f").toString()).toBe(ADDRESS_F.shortWith0x);
  });

  it("parses non-special address: 0x10 (long form)", () => {
    expect(AccountAddress.fromString(ADDRESS_TEN.longWith0x).toString()).toBe(ADDRESS_TEN.longWith0x);
    expect(AccountAddress.fromString(ADDRESS_TEN.longWithout0x).toString()).toBe(ADDRESS_TEN.longWith0x);
  });

  it("throws for non-special address in short form", () => {
    expect(() => AccountAddress.fromString(ADDRESS_TEN.shortWith0x)).toThrow();
    expect(() => AccountAddress.fromString(ADDRESS_TEN.shortWithout0x)).toThrow();
  });

  it("parses non-special full-length address", () => {
    expect(AccountAddress.fromString(ADDRESS_OTHER.longWith0x).toString()).toBe(ADDRESS_OTHER.longWith0x);
  });

  it("parses values with custom maxMissingChars", () => {
    expect(AccountAddress.fromString("0x0123456789abcdef", { maxMissingChars: 63 }));
    expect(() => AccountAddress.fromString("0x0123456789abcdef", { maxMissingChars: 0 })).toThrow();
  });
});

describe("AccountAddress fromStringStrict", () => {
  it("parses special address: 0x0", () => {
    expect(AccountAddress.fromStringStrict(ADDRESS_ZERO.longWith0x).toString()).toBe(ADDRESS_ZERO.shortWith0x);
    expect(() => AccountAddress.fromStringStrict(ADDRESS_ZERO.longWithout0x)).toThrow();
    expect(AccountAddress.fromStringStrict(ADDRESS_ZERO.shortWith0x).toString()).toBe(ADDRESS_ZERO.shortWith0x);
    expect(() => AccountAddress.fromStringStrict(ADDRESS_ZERO.shortWithout0x)).toThrow();
  });

  it("throws for padded short form: 0x0f", () => {
    expect(() => AccountAddress.fromStringStrict("0x0f")).toThrow();
  });

  it("parses non-special address: 0x10 (only long form with prefix)", () => {
    expect(AccountAddress.fromStringStrict(ADDRESS_TEN.longWith0x).toString()).toBe(ADDRESS_TEN.longWith0x);
    expect(() => AccountAddress.fromStringStrict(ADDRESS_TEN.longWithout0x)).toThrow();
    expect(() => AccountAddress.fromStringStrict(ADDRESS_TEN.shortWith0x)).toThrow();
  });
});

describe("AccountAddress static constants", () => {
  it("has correct values", () => {
    expect(AccountAddress.ZERO.toString()).toBe("0x0");
    expect(AccountAddress.ONE.toString()).toBe("0x1");
    expect(AccountAddress.TWO.toString()).toBe("0x2");
    expect(AccountAddress.THREE.toString()).toBe("0x3");
    expect(AccountAddress.FOUR.toString()).toBe("0x4");
  });
});

describe("AccountAddress from", () => {
  it("parses from string", () => {
    expect(AccountAddress.from(ADDRESS_ONE.longWith0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(AccountAddress.from(ADDRESS_ONE.shortWith0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
  });

  it("parses from Uint8Array", () => {
    expect(AccountAddress.from(ADDRESS_ONE.bytes).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(AccountAddress.from(ADDRESS_TEN.bytes).toString()).toBe(ADDRESS_TEN.longWith0x);
  });

  it("returns same instance for AccountAddress input", () => {
    const addr = AccountAddress.from("0x1");
    expect(AccountAddress.from(addr)).toBe(addr);
  });
});

describe("AccountAddress fromStrict", () => {
  it("parses special address: 0x1", () => {
    expect(AccountAddress.fromStrict(ADDRESS_ONE.longWith0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(() => AccountAddress.fromStrict(ADDRESS_ONE.longWithout0x)).toThrow();
    expect(AccountAddress.fromStrict(ADDRESS_ONE.bytes).toString()).toBe(ADDRESS_ONE.shortWith0x);
  });

  it("throws for short non-special address", () => {
    expect(() => AccountAddress.fromStrict(ADDRESS_TEN.shortWith0x)).toThrow();
  });
});

describe("AccountAddress toString variants", () => {
  it("toStringWithoutPrefix for special address", () => {
    expect(AccountAddress.fromStringStrict("0x0").toStringWithoutPrefix()).toBe("0");
  });

  it("toStringWithoutPrefix for non-special address", () => {
    expect(AccountAddress.fromStringStrict(ADDRESS_TEN.longWith0x).toStringWithoutPrefix()).toBe(
      ADDRESS_TEN.longWithout0x,
    );
  });

  it("toStringLong for special address", () => {
    expect(AccountAddress.fromStringStrict("0x0").toStringLong()).toBe(ADDRESS_ZERO.longWith0x);
  });

  it("toStringLong for non-special address", () => {
    expect(AccountAddress.fromStringStrict(ADDRESS_TEN.longWith0x).toStringLong()).toBe(ADDRESS_TEN.longWith0x);
  });

  it("toStringShort strips leading zeros", () => {
    expect(AccountAddress.fromString(ADDRESS_TEN.longWith0x).toStringShort()).toBe("0x10");
  });

  it("toStringShort for zero address", () => {
    expect(AccountAddress.fromString("0x0").toStringShort()).toBe("0x0");
  });
});

describe("AccountAddress isValid", () => {
  it("returns valid for correct input", () => {
    const result = AccountAddress.isValid({ input: ADDRESS_F.longWith0x, strict: true });
    expect(result.valid).toBe(true);
  });

  it("returns invalid for too long input", () => {
    const result = AccountAddress.isValid({
      input: `0x00${ADDRESS_F.longWithout0x}`,
      strict: true,
    });
    expect(result.valid).toBe(false);
    expect(result.invalidReason).toBe(AddressInvalidReason.TOO_LONG);
  });
});

describe("AccountAddress equals", () => {
  it("compares equal addresses", () => {
    const a = AccountAddress.fromString("0x1");
    const b = AccountAddress.fromString("0x1");
    expect(a.equals(b)).toBe(true);
  });

  it("compares unequal addresses", () => {
    const a = AccountAddress.fromString("0x1");
    const b = AccountAddress.fromString("0x2");
    expect(a.equals(b)).toBe(false);
  });
});

describe("AccountAddress serialization", () => {
  it("serializes correctly (raw 32 bytes)", () => {
    const address = AccountAddress.fromString(ADDRESS_OTHER.longWith0x);
    const serializer = new Serializer();
    serializer.serialize(address);
    expect(serializer.toUint8Array()).toEqual(ADDRESS_OTHER.bytes);
  });

  it("deserializes correctly", () => {
    const deserializer = new Deserializer(ADDRESS_TEN.bytes);
    const address = AccountAddress.deserialize(deserializer);
    expect(address.toUint8Array()).toEqual(ADDRESS_TEN.bytes);
  });

  it("round-trips through serialization", () => {
    const address = AccountAddress.fromString("0x0102030a0b0c", { maxMissingChars: 63 });
    const serializer = new Serializer();
    serializer.serialize(address);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = AccountAddress.deserialize(deserializer);
    expect(deserialized.toUint8Array()).toEqual(address.toUint8Array());
  });
});

describe("AccountAddress error cases", () => {
  it("throws on too long hex string", () => {
    expect(() => AccountAddress.fromStringStrict(`${ADDRESS_ONE.longWith0x}1`)).toThrow("too long");
  });

  it("throws on invalid hex chars", () => {
    expect(() => AccountAddress.fromStringStrict("0xxyz")).toThrow();
  });

  it("throws on empty string", () => {
    expect(() => AccountAddress.fromStringStrict("0x")).toThrow();
    expect(() => AccountAddress.fromStringStrict("")).toThrow();
  });

  it("throws on missing 0x prefix in strict mode", () => {
    expect(() => AccountAddress.fromStringStrict("0za")).toThrow();
  });

  it("throws on incorrect byte length for constructor", () => {
    expect(() => new AccountAddress(new Uint8Array(31))).toThrow("exactly 32 bytes");
  });
});
