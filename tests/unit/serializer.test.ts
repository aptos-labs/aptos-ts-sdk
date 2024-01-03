// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  MAX_U128_BIG_INT,
  MAX_U16_NUMBER,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U8_NUMBER,
  MAX_U256_BIG_INT,
} from "../../src/bcs/consts";
import { AccountAddress, Serializable, Serializer, outOfRangeErrorMessage } from "../../src";
/* eslint-disable @typescript-eslint/no-shadow */
describe("BCS Serializer", () => {
  let serializer: Serializer;

  beforeEach(() => {
    serializer = new Serializer();
  });

  it("serializes a non-empty string", () => {
    serializer.serializeStr("çå∞≠¢õß∂ƒ∫");
    expect(serializer.toUint8Array()).toEqual(
      new Uint8Array([
        24, 0xc3, 0xa7, 0xc3, 0xa5, 0xe2, 0x88, 0x9e, 0xe2, 0x89, 0xa0, 0xc2, 0xa2, 0xc3, 0xb5, 0xc3, 0x9f, 0xe2, 0x88,
        0x82, 0xc6, 0x92, 0xe2, 0x88, 0xab,
      ]),
    );

    serializer = new Serializer();
    serializer.serializeStr("abcd1234");
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([8, 0x61, 0x62, 0x63, 0x64, 0x31, 0x32, 0x33, 0x34]));
  });

  it("serializes an empty string", () => {
    serializer.serializeStr("");
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0]));
  });

  it("serializes dynamic length bytes", () => {
    serializer.serializeBytes(new Uint8Array([0x41, 0x70, 0x74, 0x6f, 0x73]));
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([5, 0x41, 0x70, 0x74, 0x6f, 0x73]));
  });

  it("serializes dynamic length bytes with zero elements", () => {
    serializer.serializeBytes(new Uint8Array([]));
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0]));
  });

  it("serializes fixed length bytes", () => {
    serializer.serializeFixedBytes(new Uint8Array([0x41, 0x70, 0x74, 0x6f, 0x73]));
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0x41, 0x70, 0x74, 0x6f, 0x73]));
  });

  it("serializes fixed length bytes with zero element", () => {
    serializer.serializeFixedBytes(new Uint8Array([]));
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([]));
  });

  it("serializes a boolean value", () => {
    serializer.serializeBool(true);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0x01]));

    serializer = new Serializer();
    serializer.serializeBool(false);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0x00]));
  });

  it("throws when serializing a boolean value with wrong data type", () => {
    expect(() => {
      // @ts-ignore
      serializer.serializeBool(12);
    }).toThrow(`${12} is not a boolean value`);
  });

  it("serializes a uint8", () => {
    serializer.serializeU8(255);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0xff]));
  });

  it("throws when serializing uint8 with out of range value", () => {
    expect(() => {
      serializer.serializeU8(256);
    }).toThrow(outOfRangeErrorMessage(256, 0, MAX_U8_NUMBER));

    expect(() => {
      serializer = new Serializer();
      serializer.serializeU8(-1);
    }).toThrow(outOfRangeErrorMessage(-1, 0, MAX_U8_NUMBER));
  });

  it("serializes a uint16", () => {
    serializer.serializeU16(65535);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0xff, 0xff]));

    serializer = new Serializer();
    serializer.serializeU16(4660);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0x34, 0x12]));
  });

  it("throws when serializing uint16 with out of range value", () => {
    expect(() => {
      serializer.serializeU16(65536);
    }).toThrow(outOfRangeErrorMessage(65536, 0, MAX_U16_NUMBER));

    expect(() => {
      serializer = new Serializer();
      serializer.serializeU16(-1);
    }).toThrow(outOfRangeErrorMessage(-1, 0, MAX_U16_NUMBER));
  });

  it("serializes a uint32", () => {
    serializer.serializeU32(4294967295);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff]));

    serializer = new Serializer();
    serializer.serializeU32(305419896);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0x78, 0x56, 0x34, 0x12]));
  });

  it("throws when serializing uint32 with out of range value", () => {
    expect(() => {
      serializer.serializeU32(4294967296);
    }).toThrow(outOfRangeErrorMessage(4294967296, 0, MAX_U32_NUMBER));

    expect(() => {
      serializer = new Serializer();
      serializer.serializeU32(-1);
    }).toThrow(outOfRangeErrorMessage(-1, 0, MAX_U32_NUMBER));
  });

  it("serializes a uint64", () => {
    serializer.serializeU64(18446744073709551615n);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));

    serializer = new Serializer();
    serializer.serializeU64(1311768467750121216n);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0x00, 0xef, 0xcd, 0xab, 0x78, 0x56, 0x34, 0x12]));
  });

  it("throws when serializing uint64 with out of range value", () => {
    expect(() => {
      serializer.serializeU64(18446744073709551616n);
    }).toThrow(outOfRangeErrorMessage(18446744073709551616n, 0, MAX_U64_BIG_INT));

    expect(() => {
      serializer = new Serializer();
      serializer.serializeU64(-1);
    }).toThrow(outOfRangeErrorMessage(-1, 0, MAX_U64_BIG_INT));
  });

  it("serializes a uint128", () => {
    serializer.serializeU128(340282366920938463463374607431768211455n);
    expect(serializer.toUint8Array()).toEqual(
      new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
    );

    serializer = new Serializer();
    serializer.serializeU128(1311768467750121216n);
    expect(serializer.toUint8Array()).toEqual(
      new Uint8Array([0x00, 0xef, 0xcd, 0xab, 0x78, 0x56, 0x34, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    );
  });

  it("throws when serializing uint128 with out of range value", () => {
    expect(() => {
      serializer.serializeU128(340282366920938463463374607431768211456n);
    }).toThrow(outOfRangeErrorMessage(340282366920938463463374607431768211456n, 0, MAX_U128_BIG_INT));

    expect(() => {
      serializer = new Serializer();
      serializer.serializeU128(-1);
    }).toThrow(outOfRangeErrorMessage(-1, 0, MAX_U128_BIG_INT));
  });

  it("serializes a uint256", () => {
    serializer.serializeU256(MAX_U256_BIG_INT);
    expect(serializer.toUint8Array()).toEqual(
      new Uint8Array([
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      ]),
    );

    serializer = new Serializer();
    serializer.serializeU256(1311768467750121216n);
    expect(serializer.toUint8Array()).toEqual(
      new Uint8Array([
        0x00, 0xef, 0xcd, 0xab, 0x78, 0x56, 0x34, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
    );
  });

  it("throws when serializing uint256 with out of range value", () => {
    expect(() => {
      serializer.serializeU256(MAX_U256_BIG_INT + 1n);
    }).toThrow(outOfRangeErrorMessage(MAX_U256_BIG_INT + 1n, 0, MAX_U256_BIG_INT));

    expect(() => {
      serializer = new Serializer();
      serializer.serializeU256(-1);
    }).toThrow(outOfRangeErrorMessage(-1, 0, MAX_U256_BIG_INT));
  });

  it("serializes a uleb128", () => {
    serializer.serializeU32AsUleb128(104543565);
    expect(serializer.toUint8Array()).toEqual(new Uint8Array([0xcd, 0xea, 0xec, 0x31]));
  });

  it("throws when serializing uleb128 with out of range value", () => {
    expect(() => {
      serializer.serializeU32AsUleb128(4294967296);
    }).toThrow(outOfRangeErrorMessage(4294967296, 0, MAX_U32_NUMBER));

    expect(() => {
      serializer = new Serializer();
      serializer.serializeU32AsUleb128(-1);
    }).toThrow(outOfRangeErrorMessage(-1, 0, MAX_U32_NUMBER));
  });

  it("serializes multiple types of values", () => {
    const serializer = new Serializer();
    serializer.serializeBytes(new Uint8Array([0x41, 0x70, 0x74, 0x6f, 0x73]));
    serializer.serializeBool(true);
    serializer.serializeBool(false);
    serializer.serializeU8(254);
    serializer.serializeU8(255);
    serializer.serializeU16(65535);
    serializer.serializeU16(4660);
    serializer.serializeU32(4294967295);
    serializer.serializeU32(305419896);
    serializer.serializeU64(18446744073709551615n);
    serializer.serializeU64(1311768467750121216n);
    serializer.serializeU128(340282366920938463463374607431768211455n);
    serializer.serializeU128(1311768467750121216n);
    const serializedBytes = serializer.toUint8Array();
    expect(serializedBytes).toEqual(
      new Uint8Array([
        5, 0x41, 0x70, 0x74, 0x6f, 0x73, 0x01, 0x00, 0xfe, 0xff, 0xff, 0xff, 0x34, 0x12, 0xff, 0xff, 0xff, 0xff, 0x78,
        0x56, 0x34, 0x12, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0xef, 0xcd, 0xab, 0x78, 0x56, 0x34,
        0x12, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00,
        0xef, 0xcd, 0xab, 0x78, 0x56, 0x34, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
    );
  });

  it("serializes values with specified allocated memory", () => {
    const serializer = new Serializer(128);
    serializer.serializeBool(true);
    serializer.serializeU8(254);
    const serializedBytes = serializer.toUint8Array();
    expect(serializedBytes).toEqual(new Uint8Array([0x01, 0xfe]));
  });

  it("throws when specifying 0 or less than 0 allocated bytes for memory", () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new Serializer(0);
    }).toThrow();
    expect(() => {
      // eslint-disable-next-line no-new
      new Serializer(-1);
    }).toThrow();
  });

  it("serializes a vector of Serializable types correctly", () => {
    const addresses = new Array<AccountAddress>(
      AccountAddress.from("0x1"),
      AccountAddress.from("0xa"),
      AccountAddress.from("0x0123456789abcdef"),
    );
    const serializer = new Serializer();
    serializer.serializeVector(addresses);
    const serializedBytes = serializer.toUint8Array();
    expect(serializedBytes).toEqual(
      new Uint8Array([
        3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x01, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x0a, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
      ]),
    );
  });

  it("serializes multiple Serializable values", () => {
    class MoveStructA extends Serializable {
      constructor(
        public name: string,
        public description: string,
        public enabled: boolean,
        public vectorU8: Array<number>,
      ) {
        super();
      }

      serialize(serializer: Serializer): void {
        serializer.serializeStr(this.name);
        serializer.serializeStr(this.description);
        serializer.serializeBool(this.enabled);
        serializer.serializeU32AsUleb128(this.vectorU8.length);
        this.vectorU8.forEach((n) => serializer.serializeU8(n));
      }
    }
    class MoveStructB extends Serializable {
      constructor(
        public moveStructA: MoveStructA,
        public name: string,
        public description: string,
        public vectorU8: Array<number>,
      ) {
        super();
      }

      serialize(serializer: Serializer): void {
        serializer.serialize(this.moveStructA);
        serializer.serializeStr(this.name);
        serializer.serializeStr(this.description);
        serializer.serializeU32AsUleb128(this.vectorU8.length);
        this.vectorU8.forEach((n) => serializer.serializeU8(n));
      }
    }

    const moveStructA = new MoveStructA("abc", "123", false, [1, 2, 3, 4]);
    const moveStructB = new MoveStructB(moveStructA, "def", "456", [5, 6, 7, 8]);

    const serializer = new Serializer();
    serializer.serialize(moveStructB);
    const serializedBytes = serializer.toUint8Array();

    expect(serializedBytes).toEqual(
      new Uint8Array([
        3, 0x61, 0x62, 0x63, 3, 0x31, 0x32, 0x33, 0x00, 4, 0x01, 0x02, 0x03, 0x04, 3, 0x64, 0x65, 0x66, 3, 0x34, 0x35,
        0x36, 4, 0x05, 0x06, 0x07, 0x08,
      ]),
    );
  });
});
