import {
  AccountAddress,
  Bool,
  checkOrConvertArgument,
  MoveOption,
  MoveString,
  MoveVector,
  parseTypeTag,
  TypeTagU256,
  TypeTagU8,
  TypeTagVector,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
  I8,
  I16,
  I32,
  I64,
  I128,
  I256,
} from "../../src";

const MAX_U8 = 255;
const MAX_U16 = 65535;
const MAX_U32 = 4_294_967_295;
const MAX_U64 = 18_446_744_073_709_551_615n;
const MAX_U128 = 340_282_366_920_938_463_463_374_607_431_768_211_455n;
const MAX_U256 =
  115_792_089_237_316_195_423_570_985_008_687_907_853_269_984_665_640_564_039_457_584_007_913_129_639_935n;

// Signed integer bounds
const MIN_I8 = -128;
const MAX_I8 = 127;
const MIN_I16 = -32768;
const MAX_I16 = 32767;
const MIN_I32 = -2147483648;
const MAX_I32 = 2147483647;
const MIN_I64 = -9223372036854775808n;
const MAX_I64 = 9223372036854775807n;
const MIN_I128 = -170141183460469231731687303715884105728n;
const MAX_I128 = 170141183460469231731687303715884105727n;
const MIN_I256 = -57896044618658097711785492504343953926634992332820282019728792003956564819968n;
const MAX_I256 = 57896044618658097711785492504343953926634992332820282019728792003956564819967n;

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

    it("should parse signed integer primitive arguments", () => {
      // Small signed integers can be passed as numbers (positive and negative)
      expect(checkOrConvertArgument(MAX_I8, parseTypeTag("i8"), 0, [])).toEqual(new I8(MAX_I8));
      expect(checkOrConvertArgument(MIN_I8, parseTypeTag("i8"), 0, [])).toEqual(new I8(MIN_I8));
      expect(checkOrConvertArgument(MAX_I16, parseTypeTag("i16"), 0, [])).toEqual(new I16(MAX_I16));
      expect(checkOrConvertArgument(MIN_I16, parseTypeTag("i16"), 0, [])).toEqual(new I16(MIN_I16));
      expect(checkOrConvertArgument(MAX_I32, parseTypeTag("i32"), 0, [])).toEqual(new I32(MAX_I32));
      expect(checkOrConvertArgument(MIN_I32, parseTypeTag("i32"), 0, [])).toEqual(new I32(MIN_I32));

      // Large signed integers can be passed as bigints and strings
      expect(checkOrConvertArgument(MAX_I64, parseTypeTag("i64"), 0, [])).toEqual(new I64(MAX_I64));
      expect(checkOrConvertArgument(MIN_I64, parseTypeTag("i64"), 0, [])).toEqual(new I64(MIN_I64));
      expect(checkOrConvertArgument(MIN_I64.toString(), parseTypeTag("i64"), 0, [])).toEqual(new I64(MIN_I64));
      expect(checkOrConvertArgument(MAX_I128, parseTypeTag("i128"), 0, [])).toEqual(new I128(MAX_I128));
      expect(checkOrConvertArgument(MIN_I128, parseTypeTag("i128"), 0, [])).toEqual(new I128(MIN_I128));
      expect(checkOrConvertArgument(MIN_I128.toString(), parseTypeTag("i128"), 0, [])).toEqual(new I128(MIN_I128));
      expect(checkOrConvertArgument(MAX_I256, parseTypeTag("i256"), 0, [])).toEqual(new I256(MAX_I256));
      expect(checkOrConvertArgument(MIN_I256, parseTypeTag("i256"), 0, [])).toEqual(new I256(MIN_I256));
      expect(checkOrConvertArgument(MIN_I256.toString(), parseTypeTag("i256"), 0, [])).toEqual(new I256(MIN_I256));

      // Small values as numbers for larger types
      expect(checkOrConvertArgument(-5, parseTypeTag("i64"), 0, [])).toEqual(new I64(-5));
      expect(checkOrConvertArgument(-5, parseTypeTag("i128"), 0, [])).toEqual(new I128(-5));
      expect(checkOrConvertArgument(-5, parseTypeTag("i256"), 0, [])).toEqual(new I256(-5));
    });

    // This test is for backward compatibility with the SDK V1 to generate transactions with loose types
    it("should parse primitive types for sdk v1 compatibility", () => {
      // boolean as a string
      expect(checkOrConvertArgument("true", parseTypeTag("bool"), 0, [])).toEqual(new Bool(true));
      expect(checkOrConvertArgument("false", parseTypeTag("bool"), 0, [])).toEqual(new Bool(false));

      // integers as strings
      expect(checkOrConvertArgument("255", parseTypeTag("u8"), 0, [])).toEqual(new U8(MAX_U8));
      expect(checkOrConvertArgument("65535", parseTypeTag("u16"), 0, [])).toEqual(new U16(MAX_U16));
      expect(checkOrConvertArgument("255", parseTypeTag("u32"), 0, [])).toEqual(new U32(MAX_U8));
      expect(checkOrConvertArgument("255", parseTypeTag("u64"), 0, [])).toEqual(new U64(MAX_U8));
      expect(checkOrConvertArgument("255", parseTypeTag("u128"), 0, [])).toEqual(new U128(MAX_U8));
      expect(checkOrConvertArgument("255", parseTypeTag("u256"), 0, [])).toEqual(new U256(MAX_U8));
    });

    it("should parse signed integers as strings", () => {
      expect(checkOrConvertArgument("-128", parseTypeTag("i8"), 0, [])).toEqual(new I8(MIN_I8));
      expect(checkOrConvertArgument("127", parseTypeTag("i8"), 0, [])).toEqual(new I8(MAX_I8));
      expect(checkOrConvertArgument("-32768", parseTypeTag("i16"), 0, [])).toEqual(new I16(MIN_I16));
      expect(checkOrConvertArgument("32767", parseTypeTag("i16"), 0, [])).toEqual(new I16(MAX_I16));
      expect(checkOrConvertArgument("-2147483648", parseTypeTag("i32"), 0, [])).toEqual(new I32(MIN_I32));
      expect(checkOrConvertArgument("2147483647", parseTypeTag("i32"), 0, [])).toEqual(new I32(MAX_I32));
      expect(checkOrConvertArgument("-9223372036854775808", parseTypeTag("i64"), 0, [])).toEqual(new I64(MIN_I64));
      expect(checkOrConvertArgument("9223372036854775807", parseTypeTag("i64"), 0, [])).toEqual(new I64(MAX_I64));
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

    it("should parse typed signed integer arguments", () => {
      expect(checkOrConvertArgument(new I8(MIN_I8), parseTypeTag("i8"), 0, [])).toEqual(new I8(MIN_I8));
      expect(checkOrConvertArgument(new I8(MAX_I8), parseTypeTag("i8"), 0, [])).toEqual(new I8(MAX_I8));
      expect(checkOrConvertArgument(new I16(MIN_I16), parseTypeTag("i16"), 0, [])).toEqual(new I16(MIN_I16));
      expect(checkOrConvertArgument(new I16(MAX_I16), parseTypeTag("i16"), 0, [])).toEqual(new I16(MAX_I16));
      expect(checkOrConvertArgument(new I32(MIN_I32), parseTypeTag("i32"), 0, [])).toEqual(new I32(MIN_I32));
      expect(checkOrConvertArgument(new I32(MAX_I32), parseTypeTag("i32"), 0, [])).toEqual(new I32(MAX_I32));
      expect(checkOrConvertArgument(new I64(MIN_I64), parseTypeTag("i64"), 0, [])).toEqual(new I64(MIN_I64));
      expect(checkOrConvertArgument(new I64(MAX_I64), parseTypeTag("i64"), 0, [])).toEqual(new I64(MAX_I64));
      expect(checkOrConvertArgument(new I128(MIN_I128), parseTypeTag("i128"), 0, [])).toEqual(new I128(MIN_I128));
      expect(checkOrConvertArgument(new I128(MAX_I128), parseTypeTag("i128"), 0, [])).toEqual(new I128(MAX_I128));
      expect(checkOrConvertArgument(new I256(MIN_I256), parseTypeTag("i256"), 0, [])).toEqual(new I256(MIN_I256));
      expect(checkOrConvertArgument(new I256(MAX_I256), parseTypeTag("i256"), 0, [])).toEqual(new I256(MAX_I256));
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
      expect(checkOrConvertArgument("[1, 2]", parseTypeTag("vector<u128>"), 0, [])).toEqual(
        new MoveVector<U128>([new U128(1), new U128(2)]),
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

      // Options with signed integers
      expect(checkOrConvertArgument(-5, parseTypeTag("0x1::option::Option<i8>"), 0, [])).toEqual(
        new MoveOption(new I8(-5)),
      );
      expect(checkOrConvertArgument(null, parseTypeTag("0x1::option::Option<i64>"), 0, [])).toEqual(
        new MoveOption<I64>(),
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

    it("should parse vectors of signed integers", () => {
      expect(checkOrConvertArgument([-128, 0, 127], parseTypeTag("vector<i8>"), 0, [])).toEqual(
        MoveVector.I8([-128, 0, 127]),
      );
      expect(checkOrConvertArgument([-32768, 0, 32767], parseTypeTag("vector<i16>"), 0, [])).toEqual(
        MoveVector.I16([-32768, 0, 32767]),
      );
      expect(checkOrConvertArgument([-2147483648, 0, 2147483647], parseTypeTag("vector<i32>"), 0, [])).toEqual(
        MoveVector.I32([-2147483648, 0, 2147483647]),
      );
      expect(checkOrConvertArgument([-1000000n, 0n, 1000000n], parseTypeTag("vector<i64>"), 0, [])).toEqual(
        MoveVector.I64([-1000000n, 0n, 1000000n]),
      );
      expect(checkOrConvertArgument([-1000000n, 0n, 1000000n], parseTypeTag("vector<i128>"), 0, [])).toEqual(
        MoveVector.I128([-1000000n, 0n, 1000000n]),
      );
      expect(checkOrConvertArgument([-1000000n, 0n, 1000000n], parseTypeTag("vector<i256>"), 0, [])).toEqual(
        MoveVector.I256([-1000000n, 0n, 1000000n]),
      );
    });

    it("should parse vectors of signed integers from strings", () => {
      expect(checkOrConvertArgument("[-128, 0, 127]", parseTypeTag("vector<i8>"), 0, [])).toEqual(
        MoveVector.I8([-128, 0, 127]),
      );
      expect(checkOrConvertArgument("[-32768, 0, 32767]", parseTypeTag("vector<i16>"), 0, [])).toEqual(
        MoveVector.I16([-32768, 0, 32767]),
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

    it("should fail on invalid signed integer inputs", () => {
      // Boolean inputs should fail for signed integers
      expect(() => checkOrConvertArgument(false, parseTypeTag("i8"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("i16"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("i32"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("i64"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("i128"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(false, parseTypeTag("i256"), 0, [])).toThrowError();

      // Booleans should fail for vector<i*>
      expect(() => checkOrConvertArgument(false, parseTypeTag("vector<i8>"), 0, [])).toThrowError();
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

    it("should fail on typed signed integer inputs with wrong type", () => {
      // Bool inputs should fail for signed integers
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("i8"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("i16"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("i32"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("i64"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("i128"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new Bool(true), parseTypeTag("i256"), 0, [])).toThrowError();

      // Wrong signed integer type should fail
      expect(() => checkOrConvertArgument(new I16(5), parseTypeTag("i8"), 0, [])).toThrowError();
      expect(() => checkOrConvertArgument(new I8(5), parseTypeTag("i16"), 0, [])).toThrowError();
    });

    it("should not support unsupported vector conversions", () => {
      // These are not supported currently, but could in the future
      expect(() =>
        checkOrConvertArgument(new Uint16Array([1, 2, 3]) as any, parseTypeTag("vector<u16>"), 0, []),
      ).toThrowError();
      expect(() =>
        checkOrConvertArgument(new Uint32Array([1, 2, 3]) as any, parseTypeTag("vector<u32>"), 0, []),
      ).toThrowError();
      expect(() =>
        checkOrConvertArgument(new BigUint64Array([1n, 2n, 3n]) as any, parseTypeTag("vector<u64>"), 0, []),
      ).toThrowError();

      // Signed arrays shouldn't work though
      expect(() =>
        checkOrConvertArgument(new Int8Array([1, 2, 3]) as any, parseTypeTag("vector<u8>"), 0, []),
      ).toThrowError();
      expect(() =>
        checkOrConvertArgument(new Int16Array([1, 2, 3]) as any, parseTypeTag("vector<u16>"), 0, []),
      ).toThrowError();
      expect(() =>
        checkOrConvertArgument(new Int32Array([1, 2, 3]) as any, parseTypeTag("vector<u32>"), 0, []),
      ).toThrowError();
      expect(() =>
        checkOrConvertArgument(new BigInt64Array([1n, 2n, 3n]) as any, parseTypeTag("vector<u64>"), 0, []),
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
});
