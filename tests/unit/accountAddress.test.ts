// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AddressInvalidReason, Deserializer, Serializer } from "../../src";

type Addresses = {
  shortWith0x: string;
  shortWithout0x: string;
  longWith0x: string;
  longWithout0x: string;
  bytes: Uint8Array;
};

// Special addresses.

const ADDRESS_ZERO: Addresses = {
  shortWith0x: "0x0",
  shortWithout0x: "0",
  longWith0x: "0x0000000000000000000000000000000000000000000000000000000000000000",
  longWithout0x: "0000000000000000000000000000000000000000000000000000000000000000",
  bytes: new Uint8Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]),
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

const ADDRESS_TWO: Addresses = {
  shortWith0x: "0x2",
  shortWithout0x: "2",
  longWith0x: "0x0000000000000000000000000000000000000000000000000000000000000002",
  longWithout0x: "0000000000000000000000000000000000000000000000000000000000000002",
  bytes: new Uint8Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
  ]),
};

const ADDRESS_THREE: Addresses = {
  shortWith0x: "0x3",
  shortWithout0x: "3",
  longWith0x: "0x0000000000000000000000000000000000000000000000000000000000000003",
  longWithout0x: "0000000000000000000000000000000000000000000000000000000000000003",
  bytes: new Uint8Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3,
  ]),
};

const ADDRESS_FOUR: Addresses = {
  shortWith0x: "0x4",
  shortWithout0x: "4",
  longWith0x: "0x0000000000000000000000000000000000000000000000000000000000000004",
  longWithout0x: "0000000000000000000000000000000000000000000000000000000000000004",
  bytes: new Uint8Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4,
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

const ADDRESS_F_PADDED_SHORT_FORM: Addresses = {
  shortWith0x: "0x0f",
  shortWithout0x: "0f",
  longWith0x: "0x000000000000000000000000000000000000000000000000000000000000000f",
  longWithout0x: "000000000000000000000000000000000000000000000000000000000000000f",
  bytes: new Uint8Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15,
  ]),
};

// Non-special addresses.

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
  // These are the same as the short variants.
  longWith0x: "0xca843279e3427144cead5e4d5999a3d0ca843279e3427144cead5e4d5999a3d0",
  longWithout0x: "ca843279e3427144cead5e4d5999a3d0ca843279e3427144cead5e4d5999a3d0",
  bytes: new Uint8Array([
    202, 132, 50, 121, 227, 66, 113, 68, 206, 173, 94, 77, 89, 153, 163, 208, 202, 132, 50, 121, 227, 66, 113, 68, 206,
    173, 94, 77, 89, 153, 163, 208,
  ]),
};

// These tests show that fromString parses special addresses, long addresses, and short addresses adhereing to the max missing chars.
describe("AccountAddress fromString", () => {
  it("parses special address: 0x0", () => {
    expect(AccountAddress.fromString(ADDRESS_ZERO.longWith0x).toString()).toBe(ADDRESS_ZERO.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_ZERO.longWithout0x).toString()).toBe(ADDRESS_ZERO.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_ZERO.shortWith0x).toString()).toBe(ADDRESS_ZERO.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_ZERO.shortWithout0x).toString()).toBe(ADDRESS_ZERO.shortWith0x);
  });

  it("parses special address: 0x1", () => {
    expect(AccountAddress.fromString(ADDRESS_ONE.longWith0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_ONE.longWithout0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_ONE.shortWith0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_ONE.shortWithout0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
  });

  it("parses special address: 0x2", () => {
    expect(AccountAddress.fromString(ADDRESS_TWO.longWith0x).toString()).toBe(ADDRESS_TWO.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_TWO.longWithout0x).toString()).toBe(ADDRESS_TWO.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_TWO.shortWith0x).toString()).toBe(ADDRESS_TWO.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_TWO.shortWithout0x).toString()).toBe(ADDRESS_TWO.shortWith0x);
  });

  it("parses special address: 0x3", () => {
    expect(AccountAddress.fromString(ADDRESS_THREE.longWith0x).toString()).toBe(ADDRESS_THREE.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_THREE.longWithout0x).toString()).toBe(ADDRESS_THREE.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_THREE.shortWith0x).toString()).toBe(ADDRESS_THREE.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_THREE.shortWithout0x).toString()).toBe(ADDRESS_THREE.shortWith0x);
  });

  it("parses special address: 0x4", () => {
    expect(AccountAddress.fromString(ADDRESS_FOUR.longWith0x).toString()).toBe(ADDRESS_FOUR.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_FOUR.longWithout0x).toString()).toBe(ADDRESS_FOUR.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_FOUR.shortWith0x).toString()).toBe(ADDRESS_FOUR.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_FOUR.shortWithout0x).toString()).toBe(ADDRESS_FOUR.shortWith0x);
  });

  it("parses special address: 0xf", () => {
    expect(AccountAddress.fromString(ADDRESS_F.longWith0x).toString()).toBe(ADDRESS_F.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_F.longWithout0x).toString()).toBe(ADDRESS_F.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_F.shortWith0x).toString()).toBe(ADDRESS_F.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_F.shortWithout0x).toString()).toBe(ADDRESS_F.shortWith0x);
  });

  it("parses special address with padded short form: 0x0f", () => {
    expect(AccountAddress.fromString(ADDRESS_F_PADDED_SHORT_FORM.shortWith0x).toString()).toBe(ADDRESS_F.shortWith0x);
    expect(AccountAddress.fromString(ADDRESS_F_PADDED_SHORT_FORM.shortWithout0x).toString()).toBe(
      ADDRESS_F.shortWith0x,
    );
  });

  it("parses non-special address: 0x10", () => {
    expect(AccountAddress.fromString(ADDRESS_TEN.longWith0x).toString()).toBe(ADDRESS_TEN.longWith0x);
    expect(AccountAddress.fromString(ADDRESS_TEN.longWithout0x).toString()).toBe(ADDRESS_TEN.longWith0x);
    expect(() => AccountAddress.fromString(ADDRESS_TEN.shortWith0x).toString()).toThrow();
    expect(() => AccountAddress.fromString(ADDRESS_TEN.shortWithout0x).toString()).toThrow();
  });

  it("parses non-special address: 0xca843279e3427144cead5e4d5999a3d0ca843279e3427144cead5e4d5999a3d0", () => {
    expect(AccountAddress.fromString(ADDRESS_OTHER.longWith0x).toString()).toBe(ADDRESS_OTHER.longWith0x);
    expect(AccountAddress.fromString(ADDRESS_OTHER.longWithout0x).toString()).toBe(ADDRESS_OTHER.longWith0x);
  });

  it("parses values in range of maxMissingChars", () => {
    expect(AccountAddress.fromString("0x0123456789abcdef", { maxMissingChars: 63 }));
    expect(() => AccountAddress.fromString("0x0123456789abcdef", { maxMissingChars: 0 })).toThrow();
  });
});

// These tests ensure that the constant special addresses in the static AccountAddress class are correct.
describe("AccountAddress static special addresses", () => {
  expect(AccountAddress.ZERO.toString()).toBe(ADDRESS_ZERO.shortWith0x);
  expect(AccountAddress.ONE.toString()).toBe(ADDRESS_ONE.shortWith0x);
  expect(AccountAddress.TWO.toString()).toBe(ADDRESS_TWO.shortWith0x);
  expect(AccountAddress.THREE.toString()).toBe(ADDRESS_THREE.shortWith0x);
  expect(AccountAddress.FOUR.toString()).toBe(ADDRESS_FOUR.shortWith0x);
});

// These tests show that fromString only parses addresses with a leading 0x and only
// SHORT if it is a special address.
describe("AccountAddress fromString", () => {
  it("parses special address: 0x0", () => {
    expect(AccountAddress.fromStringStrict(ADDRESS_ZERO.longWith0x).toString()).toBe(ADDRESS_ZERO.shortWith0x);
    expect(() => AccountAddress.fromStringStrict(ADDRESS_ZERO.longWithout0x)).toThrow();
    expect(AccountAddress.fromStringStrict(ADDRESS_ZERO.shortWith0x).toString()).toBe(ADDRESS_ZERO.shortWith0x);
    expect(() => AccountAddress.fromStringStrict(ADDRESS_ZERO.shortWithout0x)).toThrow();
  });

  it("parses special address: 0x1", () => {
    expect(AccountAddress.fromStringStrict(ADDRESS_ONE.longWith0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(() => AccountAddress.fromStringStrict(ADDRESS_ONE.longWithout0x)).toThrow();
    expect(AccountAddress.fromStringStrict(ADDRESS_ONE.shortWith0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(() => AccountAddress.fromStringStrict(ADDRESS_ONE.shortWithout0x)).toThrow();
  });

  it("parses special address: 0xf", () => {
    expect(AccountAddress.fromStringStrict(ADDRESS_F.longWith0x).toString()).toBe(ADDRESS_F.shortWith0x);
    expect(() => AccountAddress.fromStringStrict(ADDRESS_F.longWithout0x)).toThrow();
    expect(AccountAddress.fromStringStrict(ADDRESS_F.shortWith0x).toString()).toBe(ADDRESS_F.shortWith0x);
    expect(() => AccountAddress.fromStringStrict(ADDRESS_F.shortWithout0x)).toThrow();
  });

  it("throws when parsing special address with padded short form: 0x0f", () => {
    expect(() => AccountAddress.fromStringStrict(ADDRESS_F_PADDED_SHORT_FORM.shortWith0x)).toThrow();
    expect(() => AccountAddress.fromStringStrict(ADDRESS_F_PADDED_SHORT_FORM.shortWithout0x)).toThrow();
  });

  it("parses non-special address: 0x10", () => {
    expect(AccountAddress.fromStringStrict(ADDRESS_TEN.longWith0x).toString()).toBe(ADDRESS_TEN.longWith0x);
    expect(() => AccountAddress.fromStringStrict(ADDRESS_TEN.longWithout0x)).toThrow();
    expect(() => AccountAddress.fromStringStrict(ADDRESS_TEN.shortWith0x)).toThrow();
    expect(() => AccountAddress.fromStringStrict(ADDRESS_TEN.shortWithout0x)).toThrow();
  });

  it("parses non-special address: 0xca843279e3427144cead5e4d5999a3d0ca843279e3427144cead5e4d5999a3d0", () => {
    expect(AccountAddress.fromStringStrict(ADDRESS_OTHER.longWith0x).toString()).toBe(ADDRESS_OTHER.longWith0x);
    expect(() => AccountAddress.fromStringStrict(ADDRESS_OTHER.longWithout0x)).toThrow();
  });
});

describe("AccountAddress from", () => {
  it("parses special address: 0x1", () => {
    expect(AccountAddress.fromStrict(ADDRESS_ONE.longWith0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(() => AccountAddress.fromStrict(ADDRESS_ONE.longWithout0x)).toThrow();
    expect(AccountAddress.fromStrict(ADDRESS_ONE.shortWith0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(() => AccountAddress.fromStrict(ADDRESS_ONE.shortWithout0x)).toThrow();
    expect(AccountAddress.fromStrict(ADDRESS_ONE.bytes).toString()).toBe(ADDRESS_ONE.shortWith0x);
  });

  it("parses non-special address: 0x10", () => {
    expect(AccountAddress.fromStrict(ADDRESS_TEN.longWith0x).toString()).toBe(ADDRESS_TEN.longWith0x);
    expect(() => AccountAddress.fromStrict(ADDRESS_TEN.longWithout0x)).toThrow();
    expect(() => AccountAddress.fromStrict(ADDRESS_TEN.shortWith0x)).toThrow();
    expect(() => AccountAddress.fromStrict(ADDRESS_TEN.shortWithout0x)).toThrow();
    expect(AccountAddress.fromStrict(ADDRESS_TEN.bytes).toString()).toBe(ADDRESS_TEN.longWith0x);
  });
  it("parses non-special address: 0xca843279e3427144cead5e4d5999a3d0ca843279e3427144cead5e4d5999a3d0", () => {
    expect(AccountAddress.fromStrict(ADDRESS_OTHER.longWith0x).toString()).toBe(ADDRESS_OTHER.longWith0x);
    expect(() => AccountAddress.fromStrict(ADDRESS_OTHER.longWithout0x)).toThrow();
    expect(AccountAddress.fromStrict(ADDRESS_OTHER.bytes).toString()).toBe(ADDRESS_OTHER.shortWith0x);
  });
});

describe("AccountAddress fromRelaxed", () => {
  it("parses special address: 0x1", () => {
    expect(AccountAddress.from(ADDRESS_ONE.longWith0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(AccountAddress.from(ADDRESS_ONE.longWithout0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(AccountAddress.from(ADDRESS_ONE.shortWith0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(AccountAddress.from(ADDRESS_ONE.shortWithout0x).toString()).toBe(ADDRESS_ONE.shortWith0x);
    expect(AccountAddress.from(ADDRESS_ONE.bytes).toString()).toBe(ADDRESS_ONE.shortWith0x);
  });

  it("parses non-special address: 0x10", () => {
    expect(AccountAddress.from(ADDRESS_TEN.longWith0x).toString()).toBe(ADDRESS_TEN.longWith0x);
    expect(AccountAddress.from(ADDRESS_TEN.longWithout0x).toString()).toBe(ADDRESS_TEN.longWith0x);
    expect(() => AccountAddress.from(ADDRESS_TEN.shortWith0x).toString()).toThrow();
    expect(() => AccountAddress.from(ADDRESS_TEN.shortWithout0x).toString()).toThrow();
    expect(AccountAddress.from(ADDRESS_TEN.bytes).toString()).toBe(ADDRESS_TEN.longWith0x);
  });

  it("parses non-special address: 0xca843279e3427144cead5e4d5999a3d0ca843279e3427144cead5e4d5999a3d0", () => {
    expect(AccountAddress.from(ADDRESS_OTHER.longWith0x).toString()).toBe(ADDRESS_OTHER.longWith0x);
    expect(AccountAddress.from(ADDRESS_OTHER.longWithout0x).toString()).toBe(ADDRESS_OTHER.longWith0x);
    expect(AccountAddress.from(ADDRESS_OTHER.bytes).toString()).toBe(ADDRESS_OTHER.longWith0x);
  });
});

describe("AccountAddress toUint8Array", () => {
  it("correctly returns bytes for special address: 0x1", () => {
    expect(AccountAddress.fromStrict(ADDRESS_ONE.longWith0x).toUint8Array()).toEqual(ADDRESS_ONE.bytes);
  });

  it("correctly returns bytes for  non-special address: 0x10", () => {
    expect(AccountAddress.fromStrict(ADDRESS_TEN.longWith0x).toUint8Array()).toEqual(ADDRESS_TEN.bytes);
  });

  it("correctly returns bytes for  non-special address: 0xca84...a3d0", () => {
    expect(AccountAddress.fromStrict(ADDRESS_OTHER.longWith0x).toUint8Array()).toEqual(ADDRESS_OTHER.bytes);
  });
});

describe("AccountAddress toStringWithoutPrefix", () => {
  it("formats special address correctly: 0x0", () => {
    const addr = AccountAddress.fromStringStrict(ADDRESS_ZERO.shortWith0x);
    expect(addr.toStringWithoutPrefix()).toBe(ADDRESS_ZERO.shortWithout0x);
  });

  it("formats non-special address correctly: 0x10", () => {
    const addr = AccountAddress.fromStringStrict(ADDRESS_TEN.longWith0x);
    expect(addr.toStringWithoutPrefix()).toBe(ADDRESS_TEN.longWithout0x);
  });
});

describe("AccountAddress toStringLong", () => {
  it("formats special address correctly: 0x0", () => {
    const addr = AccountAddress.fromStringStrict(ADDRESS_ZERO.shortWith0x);
    expect(addr.toStringLong()).toBe(ADDRESS_ZERO.longWith0x);
  });

  it("formats non-special address correctly: 0x10", () => {
    const addr = AccountAddress.fromStringStrict(ADDRESS_TEN.longWith0x);
    expect(addr.toStringLong()).toBe(ADDRESS_TEN.longWith0x);
  });
});

describe("AccountAddress toStringLongWithoutPrefix", () => {
  it("formats special address correctly: 0x0", () => {
    const addr = AccountAddress.fromStringStrict(ADDRESS_ZERO.shortWith0x);
    expect(addr.toStringLongWithoutPrefix()).toBe(ADDRESS_ZERO.longWithout0x);
  });

  it("formats non-special address correctly: 0x10", () => {
    const addr = AccountAddress.fromStringStrict(ADDRESS_TEN.longWith0x);
    expect(addr.toStringLongWithoutPrefix()).toBe(ADDRESS_TEN.longWithout0x);
  });
});

describe("AccountAddress other parsing", () => {
  it("throws exception when initiating from too long hex string", () => {
    expect(() => {
      AccountAddress.fromStringStrict(`${ADDRESS_ONE.longWith0x}1`);
    }).toThrow("Hex string is too long, must be 1 to 64 chars long, excluding the leading 0x.");
  });

  test("throws when parsing invalid hex char", () => {
    expect(() => AccountAddress.fromStringStrict("0xxyz")).toThrow();
  });

  test("throws when parsing account address of length zero", () => {
    expect(() => AccountAddress.fromStringStrict("0x")).toThrow();
    expect(() => AccountAddress.fromStringStrict("")).toThrow();
  });

  test("throws when parsing invalid prefix", () => {
    expect(() => AccountAddress.fromStringStrict("0za")).toThrow();
  });

  it("isValid is false if too long with 0xf", () => {
    const { valid, invalidReason, invalidReasonMessage } = AccountAddress.isValid({
      input: `0x00${ADDRESS_F.longWithout0x}`,
      strict: true,
    });
    expect(valid).toBe(false);
    expect(invalidReason).toBe(AddressInvalidReason.TOO_LONG);
    expect(invalidReasonMessage).toBe("Hex string is too long, must be 1 to 64 chars long, excluding the leading 0x.");
  });

  it("isValid is true if account address string is valid", () => {
    const { valid, invalidReason, invalidReasonMessage } = AccountAddress.isValid({
      input: ADDRESS_F.longWith0x,
      strict: true,
    });
    expect(valid).toBe(true);
    expect(invalidReason).toBeUndefined();
    expect(invalidReasonMessage).toBeUndefined();
  });

  it("compares equality with equals as expected", () => {
    const addressOne = AccountAddress.fromString("0x1");
    const addressTwo = AccountAddress.fromString("0x1");
    expect(addressOne.equals(addressTwo)).toBeTruthy();
  });
});

describe("AccountAddress serialization and deserialization", () => {
  const serializeAndCheckEquality = (address: AccountAddress) => {
    const serializer = new Serializer();
    serializer.serialize(address);
    expect(serializer.toUint8Array()).toEqual(address.toUint8Array());
    expect(serializer.toUint8Array()).toEqual(address.bcsToBytes());
  };

  it("serializes an unpadded, full, and reserved address correctly", () => {
    const address1 = AccountAddress.fromString("0x0102030a0b0c", { maxMissingChars: 63 });
    const address2 = AccountAddress.fromString(ADDRESS_OTHER.longWith0x);
    const address3 = AccountAddress.fromString(ADDRESS_ZERO.shortWithout0x);
    serializeAndCheckEquality(address1);
    serializeAndCheckEquality(address2);
    serializeAndCheckEquality(address3);
  });

  it("deserializes a byte buffer into an address correctly", () => {
    const { bytes } = ADDRESS_TEN;
    const deserializer = new Deserializer(bytes);
    const deserializedAddress = AccountAddress.deserialize(deserializer);
    expect(deserializedAddress.toUint8Array()).toEqual(bytes);
  });

  it("deserializes an unpadded, full, and reserved address correctly", () => {
    const serializer = new Serializer();
    const address1 = AccountAddress.fromString("0x123abc", { maxMissingChars: 63 });
    const address2 = AccountAddress.fromString(ADDRESS_OTHER.longWith0x);
    const address3 = AccountAddress.fromString(ADDRESS_ZERO.shortWithout0x);
    serializer.serialize(address1);
    serializer.serialize(address2);
    serializer.serialize(address3);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedAddress1 = AccountAddress.deserialize(deserializer);
    const deserializedAddress2 = AccountAddress.deserialize(deserializer);
    const deserializedAddress3 = AccountAddress.deserialize(deserializer);
    expect(deserializedAddress1.toUint8Array()).toEqual(address1.toUint8Array());
    expect(deserializedAddress2.toUint8Array()).toEqual(address2.toUint8Array());
    expect(deserializedAddress3.toUint8Array()).toEqual(address3.toUint8Array());
  });

  it("serializes and deserializes an address correctly", () => {
    const address = AccountAddress.fromString("0x0102030a0b0c", { maxMissingChars: 63 });
    const serializer = new Serializer();
    serializer.serialize(address);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedAddress = AccountAddress.deserialize(deserializer);
    expect(deserializedAddress.toUint8Array()).toEqual(address.toUint8Array());
    const bytes = new Uint8Array([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 10, 11, 12,
    ]);
    expect(deserializedAddress.toUint8Array()).toEqual(bytes);
  });
});
