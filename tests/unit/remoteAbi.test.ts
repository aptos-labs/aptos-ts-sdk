import {
  Account,
  AccountAddress,
  Bool,
  checkOrConvertArgument,
  deserializeArgument,
  Deserializer,
  Identifier,
  MoveOption,
  MoveString,
  MoveVector,
  parseTypeTag,
  StructTag,
  TypeTagAddress,
  TypeTagBool,
  TypeTagStruct,
  TypeTagU128,
  TypeTagU16,
  TypeTagU256,
  TypeTagU32,
  TypeTagU64,
  TypeTagU8,
  TypeTagVector,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
} from "../../src";

const MAX_U8 = 255;
const MAX_U16 = 65535;
const MAX_U32 = 4_294_967_295;
const MAX_U64 = 18_446_744_073_709_551_615n;
const MAX_U128 = 340_282_366_920_938_463_463_374_607_431_768_211_455n;
const MAX_U256 =
  115_792_089_237_316_195_423_570_985_008_687_907_853_269_984_665_640_564_039_457_584_007_913_129_639_935n;

describe("Remote ABI", () => {
  describe("Parse", () => {
    it("should parse a primitive simple arguments", () => {
      // Addresses can be passed as strings only
      expect(checkOrConvertArgument("0x1", parseTypeTag("address"), 0, [])).toEqual(AccountAddress.ONE);

      // Booleans must be boolean
      expect(checkOrConvertArgument(true, parseTypeTag("bool"), 0, [])).toEqual(new Bool(true));

      // Small numbers can only be passed as numbers
      expect(checkOrConvertArgument(MAX_U8, parseTypeTag("u8"), 0, [])).toEqual(new U8(MAX_U8));
      expect(checkOrConvertArgument(MAX_U16, parseTypeTag("u16"), 0, [])).toEqual(new U16(MAX_U16));
      expect(checkOrConvertArgument(MAX_U16, parseTypeTag("u32"), 0, [])).toEqual(new U32(MAX_U16));
      expect(checkOrConvertArgument(MAX_U32, parseTypeTag("u32"), 0, [])).toEqual(new U32(MAX_U32));
      expect(checkOrConvertArgument(MAX_U16, parseTypeTag("u64"), 0, [])).toEqual(new U64(MAX_U16));

      // Large numbers can be passed as strings, bigints, and numbrers
      expect(checkOrConvertArgument(MAX_U64, parseTypeTag("u64"), 0, [])).toEqual(new U64(MAX_U64));
      expect(checkOrConvertArgument(MAX_U64.toString(), parseTypeTag("u64"), 0, [])).toEqual(new U64(MAX_U64));
      expect(checkOrConvertArgument(MAX_U16, parseTypeTag("u128"), 0, [])).toEqual(new U128(MAX_U16));
      expect(checkOrConvertArgument(MAX_U128, parseTypeTag("u128"), 0, [])).toEqual(new U128(MAX_U128));
      expect(checkOrConvertArgument(MAX_U128.toString(), parseTypeTag("u128"), 0, [])).toEqual(new U128(MAX_U128));
      expect(checkOrConvertArgument(MAX_U16, parseTypeTag("u256"), 0, [])).toEqual(new U256(MAX_U16));
      expect(checkOrConvertArgument(MAX_U256, parseTypeTag("u256"), 0, [])).toEqual(new U256(MAX_U256));
      expect(checkOrConvertArgument(MAX_U256.toString(), parseTypeTag("u256"), 0, [])).toEqual(new U256(MAX_U256));
    });

    it("should parse a typed arguments", () => {
      expect(checkOrConvertArgument(AccountAddress.ONE, parseTypeTag("address"), 0, [])).toEqual(AccountAddress.ONE);
      expect(checkOrConvertArgument(new Bool(true), parseTypeTag("bool"), 0, [])).toEqual(new Bool(true));
      expect(checkOrConvertArgument(new U8(MAX_U8), parseTypeTag("u8"), 0, [])).toEqual(new U8(MAX_U8));
      expect(checkOrConvertArgument(new U16(MAX_U16), parseTypeTag("u16"), 0, [])).toEqual(new U16(MAX_U16));
      expect(checkOrConvertArgument(new U32(MAX_U32), parseTypeTag("u32"), 0, [])).toEqual(new U32(MAX_U32));
      expect(checkOrConvertArgument(new U64(MAX_U64), parseTypeTag("u64"), 0, [])).toEqual(new U64(MAX_U64));
      expect(checkOrConvertArgument(new U128(MAX_U128), parseTypeTag("u128"), 0, [])).toEqual(new U128(MAX_U128));
      expect(checkOrConvertArgument(new U256(MAX_U256), parseTypeTag("u256"), 0, [])).toEqual(new U256(MAX_U256));
    });

    it("should parse a complex simple arguments", () => {
      expect(checkOrConvertArgument(["0x1", "0x2"], parseTypeTag("vector<address>"), 0, [])).toEqual(
        new MoveVector<AccountAddress>([AccountAddress.ONE, AccountAddress.TWO]),
      );
      expect(checkOrConvertArgument([true, false], parseTypeTag("vector<bool>"), 0, [])).toEqual(
        MoveVector.Bool([true, false]),
      );

      // vector<u8> supports Array<number>, Uint8Array, ArrayBuffer, and utf-8 strings
      expect(checkOrConvertArgument([0, 255], parseTypeTag("vector<u8>"), 0, [])).toEqual(MoveVector.U8([0, 255]));
      expect(checkOrConvertArgument(new Uint8Array([0, 255]), parseTypeTag("vector<u8>"), 0, [])).toEqual(
        MoveVector.U8([0, 255]),
      );
      expect(checkOrConvertArgument(new Uint8Array([0, 255]).buffer, parseTypeTag("vector<u8>"), 0, [])).toEqual(
        MoveVector.U8([0, 255]),
      );
      // When using strings, it should be exactly the same as a Move String, but it should be a MoveVector
      const convertedString = checkOrConvertArgument("0xFF", parseTypeTag("vector<u8>"), 0, []);
      expect(convertedString).toBeInstanceOf(MoveVector<U8>);
      expect(convertedString.bcsToBytes()).toEqual(new MoveString("0xFF").bcsToBytes());
      expect(checkOrConvertArgument("Hello", parseTypeTag("vector<u8>"), 0, []).bcsToBytes()).toEqual(
        new MoveString("Hello").bcsToBytes(),
      );

      expect(checkOrConvertArgument("Hello", parseTypeTag("0x1::string::String"), 0, [])).toEqual(
        new MoveString("Hello"),
      );

      expect(checkOrConvertArgument(["hello", "goodbye"], parseTypeTag("vector<0x1::string::String>"), 0, [])).toEqual(
        MoveVector.MoveString(["hello", "goodbye"]),
      );

      // Undefined and null work as "no value" for options
      expect(checkOrConvertArgument(0, parseTypeTag("0x1::option::Option<u8>"), 0, [])).toEqual(
        new MoveOption(new U8(0)),
      );
      expect(checkOrConvertArgument(255, parseTypeTag("0x1::option::Option<u8>"), 0, [])).toEqual(
        new MoveOption(new U8(255)),
      );
      expect(checkOrConvertArgument(undefined, parseTypeTag("0x1::option::Option<u8>"), 0, [])).toEqual(
        new MoveOption<U8>(),
      );
      expect(checkOrConvertArgument(null, parseTypeTag("0x1::option::Option<u8>"), 0, [])).toEqual(
        new MoveOption<U8>(),
      );

      // Objects are account addresses, and it doesn't matter about the type used
      expect(checkOrConvertArgument("0x1", parseTypeTag("0x1::object::Object<0x1::string::String>"), 0, [])).toEqual(
        AccountAddress.ONE,
      );
    });

    it("should support generics", () => {
      expect(
        checkOrConvertArgument(255, parseTypeTag("0x1::option::Option<T0>", { allowGenerics: true }), 0, [
          new TypeTagU8(),
        ]),
      ).toEqual(new MoveOption<U8>(new U8(255)));
      expect(
        checkOrConvertArgument(
          AccountAddress.ONE,
          parseTypeTag("0x1::object::Object<T0>", { allowGenerics: true }),
          0,
          [new TypeTagU8()],
        ),
      ).toEqual(AccountAddress.ONE);
      expect(
        checkOrConvertArgument(
          AccountAddress.ONE,
          parseTypeTag("0x1::object::Object<T0>", { allowGenerics: true }),
          0,
          [new TypeTagVector(new TypeTagU256())],
        ),
      ).toEqual(AccountAddress.ONE);
    });

    it("should parse a complex typed arguments", () => {
      expect(
        checkOrConvertArgument(
          new MoveVector<AccountAddress>([AccountAddress.ONE, AccountAddress.TWO]),
          parseTypeTag("vector<address>"),
          0,
          [],
        ),
      ).toEqual(new MoveVector<AccountAddress>([AccountAddress.ONE, AccountAddress.TWO]));
      expect(checkOrConvertArgument([true, false], parseTypeTag("vector<bool>"), 0, [])).toEqual(
        MoveVector.Bool([true, false]),
      );

      expect(checkOrConvertArgument(MoveVector.U8([0, 255]), parseTypeTag("vector<u8>"), 0, [])).toEqual(
        MoveVector.U8([0, 255]),
      );
      expect(
        checkOrConvertArgument(
          MoveVector.MoveString(["hello", "goodbye"]),
          parseTypeTag("vector<0x1::string::String>"),
          0,
          [],
        ),
      ).toEqual(MoveVector.MoveString(["hello", "goodbye"]));

      expect(checkOrConvertArgument(new MoveString("Hello"), parseTypeTag("0x1::string::String"), 0, [])).toEqual(
        new MoveString("Hello"),
      );

      // You cannot provide `new U8(0)` without MoveOption
      expect(
        checkOrConvertArgument(new MoveOption(new U8(255)), parseTypeTag("0x1::option::Option<u8>"), 0, []),
      ).toEqual(new MoveOption(new U8(255)));
      expect(checkOrConvertArgument(new MoveOption<U8>(), parseTypeTag("0x1::option::Option<u8>"), 0, [])).toEqual(
        new MoveOption<U8>(),
      );

      // Objects are account addresses, and it doesn't matter about the type used
      expect(
        checkOrConvertArgument(AccountAddress.ONE, parseTypeTag("0x1::object::Object<0x1::string::String>"), 0, []),
      ).toEqual(AccountAddress.ONE);
    });

    it("should allow mixed arguments", () => {
      expect(checkOrConvertArgument([AccountAddress.ONE, "0x2"], parseTypeTag("vector<address>"), 0, [])).toEqual(
        new MoveVector<AccountAddress>([AccountAddress.ONE, AccountAddress.TWO]),
      );
      expect(checkOrConvertArgument([0, 0n, "0"], parseTypeTag("vector<u256>"), 0, [])).toEqual(
        MoveVector.U256([0, 0, 0]),
      );
    });

    it("should fail on invalid simple inputs", () => {
      expect(() => checkOrConvertArgument(false, parseTypeTag("address"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(0, parseTypeTag("bool"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("u8"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("u16"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("u32"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("u64"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("u128"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("u256"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("0x1::string::String"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("0x1::option::Option<u8>"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("0x1::object::Object<u8>"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("vector<u8>"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument([0], parseTypeTag("vector<T0>"), 0, [])).toThrowError();

      // Invalid struct
      expect(() => checkOrConvertArgument(false, parseTypeTag("0x1::account::Account"), 0, [])).toThrowError();

      // Unsupported type
      expect(() => checkOrConvertArgument(false, parseTypeTag("signer"), 0, [])).toThrowError();
    });

    it("should fail on typed inputs", () => {
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("address"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new U8(0), parseTypeTag("bool"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("u8"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("u16"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("u32"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("u64"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("u128"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("u256"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("0x1::string::String"), 0, [])).toThrowError();
      expect(() =>
        checkOrConvertArgument(new Bool(true), parseTypeTag("0x1::option::Option<u8>"), 0, []),
      ).toThrowError();
      expect(() =>
        checkOrConvertArgument(new Bool(true), parseTypeTag("0x1::object::Object<u8>"), 0, []),
      ).toThrowError();
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("vector<u8>"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(MoveVector.U8([0]), parseTypeTag("vector<T0>"), 0, [])).toThrowError();

      // Invalid struct
      expect(() => checkOrConvertArgument(false, parseTypeTag("0x1::account::Account"), 0, [])).toThrowError();

      // Unsupported type
      expect(() => checkOrConvertArgument(false, parseTypeTag("signer"), 0, [])).toThrowError();
    });

    it("should not support unsupported vector conversions", () => {
      // These are not supported currently, but could in the future
      expect(() =>
        checkOrConvertArgument(new Uint16Array([1, 2, 3]), parseTypeTag("vector<u16>"), 0, []),
      ).toThrowError();
      expect(() =>
        checkOrConvertArgument(new Uint32Array([1, 2, 3]), parseTypeTag("vector<u32>"), 0, []),
      ).toThrowError();
      expect(() =>
        checkOrConvertArgument(new BigUint64Array([1n, 2n, 3n]), parseTypeTag("vector<u64>"), 0, []),
      ).toThrowError();

      // Signed arrays shouldn't work though
      expect(() => checkOrConvertArgument(new Int8Array([1, 2, 3]), parseTypeTag("vector<u8>"), 0, [])).toThrowError();
      expect(() =>
        checkOrConvertArgument(new Int16Array([1, 2, 3]), parseTypeTag("vector<u16>"), 0, []),
      ).toThrowError();
      expect(() =>
        checkOrConvertArgument(new Int32Array([1, 2, 3]), parseTypeTag("vector<u32>"), 0, []),
      ).toThrowError();
      expect(() =>
        checkOrConvertArgument(new BigInt64Array([1n, 2n, 3n]), parseTypeTag("vector<u64>"), 0, []),
      ).toThrowError();

      // Below u64 can't support bigints
      expect(() => checkOrConvertArgument([1n, 2n], parseTypeTag("vector<u8>"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument([1n, 2n], parseTypeTag("vector<u16>"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument([1n, 2n], parseTypeTag("vector<u32>"), 0, [])).toThrowError();

      // Can't mix types that don't match
      expect(() => checkOrConvertArgument([1n, new U64(2)], parseTypeTag("vector<u8>"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument([1n, new U64(2)], parseTypeTag("vector<u16>"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument([1n, new U64(2)], parseTypeTag("vector<u32>"), 0, [])).toThrowError();

      // TODO: Verify string behavior on u64 and above
    });
  });
  describe("deserialize", () => {
    describe("primitives", () => {
      test("should deserialize TypeTagBool", () => {
        const bool = new Bool(true).bcsToBytes();
        const typeTagBool = new TypeTagBool();

        const deserializer = new Deserializer(bool);
        const data = deserializeArgument([typeTagBool], deserializer);
        expect(data[0]).toEqual(true);
      });
      test("should deserialize TypeTagU8", () => {
        const u8 = new U8(MAX_U8).bcsToBytes();
        const typeTagBool = new TypeTagU8();

        const deserializer = new Deserializer(u8);
        const data = deserializeArgument([typeTagBool], deserializer);
        expect(data[0]).toEqual(MAX_U8);
      });
      test("should deserialize TypeTagU16", () => {
        const u16 = new U16(MAX_U16).bcsToBytes();
        const typeTagBool = new TypeTagU16();

        const deserializer = new Deserializer(u16);
        const data = deserializeArgument([typeTagBool], deserializer);
        expect(data[0]).toEqual(MAX_U16);
      });
      test("should deserialize TypeTagU32", () => {
        const u32 = new U32(MAX_U32).bcsToBytes();
        const typeTagBool = new TypeTagU32();

        const deserializer = new Deserializer(u32);
        const data = deserializeArgument([typeTagBool], deserializer);
        expect(data[0]).toEqual(MAX_U32);
      });
      test("should deserialize TypeTagU64", () => {
        const u64 = new U64(MAX_U64).bcsToBytes();
        const typeTagBool = new TypeTagU64();

        const deserializer = new Deserializer(u64);
        const data = deserializeArgument([typeTagBool], deserializer);
        expect(data[0]).toEqual(MAX_U64);
      });
      test("should deserialize TypeTagU128", () => {
        const u128 = new U128(MAX_U128).bcsToBytes();
        const typeTagBool = new TypeTagU128();

        const deserializer = new Deserializer(u128);
        const data = deserializeArgument([typeTagBool], deserializer);
        expect(data[0]).toEqual(MAX_U128);
      });
      test("should deserialize TypeTagU256", () => {
        const u256 = new U256(MAX_U256).bcsToBytes();
        const typeTagBool = new TypeTagU256();

        const deserializer = new Deserializer(u256);
        const data = deserializeArgument([typeTagBool], deserializer);
        expect(data[0]).toEqual(MAX_U256);
      });
    });

    describe("address", () => {
      test("should deserialize TypeTagAddress", () => {
        const address = AccountAddress.ONE.bcsToBytes();
        const typeTagAddress = new TypeTagAddress();

        const deserializer = new Deserializer(address);
        const data = deserializeArgument([typeTagAddress], deserializer);
        expect(data[0]).toEqual(AccountAddress.ONE.toString());
      });
    });

    describe("struct", () => {
      test("should deserialize TypeTagStruct string", () => {
        const string = new MoveString("Hello Aptos").bcsToBytes();
        const structTag = new StructTag(AccountAddress.ONE, new Identifier("string"), new Identifier("String"), []);
        const typeTagStruct = new TypeTagStruct(structTag);

        const deserializer = new Deserializer(string);
        const data = deserializeArgument([typeTagStruct], deserializer);
        expect(data[0]).toEqual("Hello Aptos");
      });
      test("should deserialize TypeTagStruct object", () => {
        const object = AccountAddress.ONE.bcsToBytes();
        const structTag = new StructTag(AccountAddress.ONE, new Identifier("object"), new Identifier("Object"), []);
        const typeTagStruct = new TypeTagStruct(structTag);

        const deserializer = new Deserializer(object);
        const data = deserializeArgument([typeTagStruct], deserializer);
        expect(data[0]).toEqual(AccountAddress.ONE.toString());
      });

      test("should deserialize TypeTagStruct struct", () => {
        const struct = new MoveString("0x123::aptos:SDK").bcsToBytes();

        const structTag = new StructTag(
          AccountAddress.from("0x123"),
          new Identifier("aptos"),
          new Identifier("SDK"),
          [],
        );
        const typeTagStruct = new TypeTagStruct(structTag);

        const deserializer = new Deserializer(struct);
        const data = deserializeArgument([typeTagStruct], deserializer);
        expect(data[0]).toEqual("0x123::aptos:SDK");
      });
    });

    describe.only("vector", () => {
      test("should deserialize vector of U8", () => {
        const u8 = new MoveVector([new U8(MAX_U8)]).bcsToBytes();
        const typeTagVector = new TypeTagVector(new TypeTagU8());

        const deserializer = new Deserializer(u8);
        const data = deserializeArgument([typeTagVector], deserializer);
        expect(data[0]).toEqual([MAX_U8]);
      });

      test("should deserialize ed25519 public key as a vector of U8", () => {
        const account = Account.generate();
        const publicKeyArray = MoveVector.U8(account.publicKey.toUint8Array()).bcsToBytes();
        const typeTagVector = new TypeTagVector(new TypeTagU8());

        const deserializer = new Deserializer(publicKeyArray);
        const data = deserializeArgument([typeTagVector], deserializer);
        expect(data[0]).toEqual(account.publicKey.toString());
      });

      test("should deserialize vector of U16", () => {
        const u16 = new MoveVector([new U16(MAX_U16)]).bcsToBytes();
        const typeTagVector = new TypeTagVector(new TypeTagU16());

        const deserializer = new Deserializer(u16);
        const data = deserializeArgument([typeTagVector], deserializer);
        expect(data[0]).toEqual([MAX_U16]);
      });

      test("should deserialize vector of U32", () => {
        const u32 = new MoveVector([new U32(MAX_U32)]).bcsToBytes();
        const typeTagVector = new TypeTagVector(new TypeTagU32());

        const deserializer = new Deserializer(u32);
        const data = deserializeArgument([typeTagVector], deserializer);
        expect(data[0]).toEqual([MAX_U32]);
      });

      test("should deserialize vector of U64", () => {
        const u64 = new MoveVector([new U64(MAX_U64)]).bcsToBytes();
        const typeTagVector = new TypeTagVector(new TypeTagU64());

        const deserializer = new Deserializer(u64);
        const data = deserializeArgument([typeTagVector], deserializer);
        expect(data[0]).toEqual([MAX_U64]);
      });

      test("should deserialize vector of U128", () => {
        const u128 = new MoveVector([new U128(MAX_U128)]).bcsToBytes();
        const typeTagVector = new TypeTagVector(new TypeTagU128());

        const deserializer = new Deserializer(u128);
        const data = deserializeArgument([typeTagVector], deserializer);
        expect(data[0]).toEqual([MAX_U128]);
      });

      test("should deserialize vector of U256", () => {
        const u256 = new MoveVector([new U256(MAX_U256)]).bcsToBytes();
        const typeTagVector = new TypeTagVector(new TypeTagU256());

        const deserializer = new Deserializer(u256);
        const data = deserializeArgument([typeTagVector], deserializer);
        expect(data[0]).toEqual([MAX_U256]);
      });

      test("should deserialize vector of bool", () => {
        const bool = new MoveVector([new Bool(true)]).bcsToBytes();
        const typeTagBool = new TypeTagVector(new TypeTagBool());

        const deserializer = new Deserializer(bool);
        const data = deserializeArgument([typeTagBool], deserializer);
        expect(data[0]).toEqual([true]);
      });

      test("should deserialize vector of address", () => {
        const account = Account.generate();
        const address = new MoveVector([new AccountAddress(account.accountAddress.toUint8Array())]).bcsToBytes();
        const typeTagAddress = new TypeTagVector(new TypeTagAddress());

        const deserializer = new Deserializer(address);
        const data = deserializeArgument([typeTagAddress], deserializer);
        expect(data[0]).toEqual([account.accountAddress.toString()]);
      });

      test("should deserialize vector of strings", () => {
        const stringArray = new MoveVector([new MoveString("Hello Aptos")]).bcsToBytes();
        const structTag = new StructTag(AccountAddress.ONE, new Identifier("string"), new Identifier("String"), []);
        const typeTagVector = new TypeTagVector(new TypeTagStruct(structTag));

        const deserializer = new Deserializer(stringArray);
        const data = deserializeArgument([typeTagVector], deserializer);
        expect(data[0]).toEqual(["Hello Aptos"]);
      });

      test("should deserialize vector of objects", () => {
        const stringArray = new MoveVector([AccountAddress.ONE]).bcsToBytes();
        const structTag = new StructTag(AccountAddress.ONE, new Identifier("object"), new Identifier("Object"), []);
        const typeTagVector = new TypeTagVector(new TypeTagStruct(structTag));

        const deserializer = new Deserializer(stringArray);
        const data = deserializeArgument([typeTagVector], deserializer);
        expect(data[0]).toEqual([AccountAddress.ONE.toString()]);
      });
    });
  });
});
