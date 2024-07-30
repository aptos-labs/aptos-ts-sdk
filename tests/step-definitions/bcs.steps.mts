import {
  AccountAddress,
  Bool,
  Hex,
  U8,
  U16,
  U32,
  U64,
  U128,
  U256,
  Deserializer,
  Serializer,
  MoveVector,
  MoveString,
} from "../../dist/esm/index.mjs"; // TODO: See if we can import directly from src
import { Given, Then, When } from "@cucumber/cucumber";
import assert from "assert";

Given("bytes {}", function(input: string) {
  this.input = fromByteString(input);
});

Given("address {}", function(input: string) {
  this.input = AccountAddress.from(input);
});

Given("bool {}", function(input: string) {
  this.input = new Bool(input === "true");
});

Given("u8 {}", function(input: string) {
  this.input = new U8(parseInt(input, 10));
});

Given("u16 {}", function(input: string) {
  this.input = new U16(parseInt(input, 10));
});

Given("u32 {}", function(input: string) {
  this.input = new U32(parseInt(input, 10));
});

Given("u64 {}", function(input: string) {
  this.input = new U64(BigInt(input));
});

Given("u128 {}", function(input: string) {
  this.input = new U128(BigInt(input));
});

Given("u256 {}", function(input: string) {
  this.input = new U256(BigInt(input));
});

Given("string \"{}\"", function(input: string) {
  this.input = new MoveString(input);
});

Given("sequence of {} [{}]", function(type: string, input: string) {
  this.input = sequenceOf(type, input);
});

When("I serialize as {}", function(inputType: string) {
  const serializer = new Serializer();

  switch (inputType) {
    case "sequence of uleb128":
      const input = this.input! as MoveVector<U32>;

      // TODO: this is not really supported natively in the TS SDK, it's questionable about if we care about sequences of Uleb128
      // This shows it "is possible"
      serializer.serializeU32AsUleb128(input.values.length);
      input.values.forEach((item: U32) => serializer.serializeU32AsUleb128(item.value));
      break;
    case "uleb128":
      // TODO: Uleb doesn't have the same kind of top level support
      serializer.serializeU32AsUleb128(this.input!.value);
      break;
    case "bytes":
      // TODO: Bytes and fixed bytes have to be converted here, rather than as input, consider changing name of inputs for spec
      serializer.serializeBytes(this.input!.toUint8Array());
      break;
    case "fixed bytes with length 1":
    case "fixed bytes with length 2":
      serializer.serializeFixedBytes(this.input!.toUint8Array());
      break;
    default:
      this.input!.serialize(serializer);
  }
  this.result = serializer.toUint8Array();
});

When("I deserialize as {}", function(inputType: string) {
  const deserializer = new Deserializer((this.input! as Hex).toUint8Array());
  this.resultError = false;
  this.result = null;

  try {
    switch (inputType) {
      case "bool":
        this.result = Bool.deserialize(deserializer).value;
        break;
      case "u8":
        this.result = U8.deserialize(deserializer).value;
        break;
      case "u16":
        this.result = U16.deserialize(deserializer).value;
        break;
      case "u32":
        this.result = U32.deserialize(deserializer).value;
        break;
      case "u64":
        this.result = U64.deserialize(deserializer).value;
        break;
      case "u128":
        this.result = U128.deserialize(deserializer).value;
        break;
      case "u256":
        this.result = U256.deserialize(deserializer).value;
        break;
      case "string":
        this.result = MoveString.deserialize(deserializer).value;
        break;
      case "address":
        this.result = AccountAddress.deserialize(deserializer).toString();
        break;
      case "uleb128":
        // We have to type it back into a U32 for test purposes
        this.result = deserializer.deserializeUleb128AsU32();
        break;
      case "bytes":
        this.result = deserializer.deserializeBytes();
        break;
      case "fixed bytes with length 0":
        this.result = deserializer.deserializeFixedBytes(0);
        break;
      case "fixed bytes with length 1":
        this.result = deserializer.deserializeFixedBytes(1);
        break;
      case "fixed bytes with length 2":
        this.result = deserializer.deserializeFixedBytes(2);
        break;
      case "sequence of bool":
        this.result = MoveVector.deserialize(deserializer, Bool);
        break;
      case "sequence of u8":
        this.result = MoveVector.deserialize(deserializer, U8);
        break;
      case "sequence of u16":
        this.result = MoveVector.deserialize(deserializer, U16);
        break;
      case "sequence of u32":
        this.result = MoveVector.deserialize(deserializer, U32);
        break;
      case "sequence of u64":
        this.result = MoveVector.deserialize(deserializer, U64);
        break;
      case "sequence of u128":
        this.result = MoveVector.deserialize(deserializer, U128);
        break;
      case "sequence of u256":
        this.result = MoveVector.deserialize(deserializer, U256);
        break;
      case "sequence of address":
        this.result = MoveVector.deserialize(deserializer, AccountAddress);
        break;
      case "sequence of string":
        this.result = MoveVector.deserialize(deserializer, MoveString);
        break;
      case "sequence of uleb128":
        // TODO: Check if we want this supported in the spec
        const length = deserializer.deserializeUleb128AsU32();
        const list: number[] = [];

        for (let i = 0; i < length; i++) {
          list.push(deserializer.deserializeUleb128AsU32());
        }

        this.result = MoveVector.U32(list);
        break;
      default:
        throw new Error(`Unsupported type: ${inputType}`);
    }
  } catch (error: any) {
    // We have to make this to handle error handling
    this.resultError = true;
    this.error = error;
  }

  // Assert none remaining
  // TODO: Spec maybe shouldn't have this specific check?
  if (deserializer.remaining() !== 0) {
    this.dataRemaining = true;
  }
});

Then("the result should be bytes {}", function(expected: string) {
  checkDeserializationError(this);
  assert.deepEqual(this.result, fromByteString(expected).toUint8Array());
});

Then("the result should be address {}", function(expected: string) {
  checkDeserializationError(this);
  assert.equal(this.result, AccountAddress.from(expected).toString());
});

Then("the result should be bool {}", function(expected: string) {
  checkDeserializationError(this);
  assert.equal(this.result, expected === "true");
});

// TODO: None of the types are comparable, we probably want to fix that
Then("the result should be u8 {}", function(expected: string) {
  checkDeserializationError(this);
  assert.equal(this.result, parseInt(expected, 10));
});

Then("the result should be u16 {}", function(expected: string) {
  checkDeserializationError(this);
  assert.equal(this.result, parseInt(expected, 10));
});

Then("the result should be u32 {}", function(expected: string) {
  checkDeserializationError(this);
  assert.equal(this.result, parseInt(expected, 10));
});

Then("the result should be u64 {}", function(expected: string) {
  checkDeserializationError(this);
  assert.equal(this.result, BigInt(expected));
});

Then("the result should be u128 {}", function(expected: string) {
  checkDeserializationError(this);
  assert.equal(this.result, BigInt(expected));
});

Then("the result should be u256 {}", function(expected: string) {
  checkDeserializationError(this);
  assert.equal(this.result, BigInt(expected));
});
Then("the result should be string \"{}\"", function(expected: string) {
  checkDeserializationError(this);
  assert.equal(this.result, expected);
});

Then("the result should be sequence of {} [{}]", function(typeName: string, expectedList: string) {
  checkDeserializationError(this);
  const expected = sequenceOf(typeName, expectedList);
  assert.deepEqual(this.result, expected);
});

Then("the deserialization should fail", function() {
  assert(this.resultError || this.dataRemaining);
});

function fromByteString(input: string) {
  if (input === "0x") {
    return new Hex(new Uint8Array());
  } else {
    return Hex.fromHexString(input);
  }
}

function parseArray(input: string) {
  if (input === "") {
    return [];
  }
  return input.split(",");
}

function checkDeserializationError(input: any) {
  assert(input.resultError === false || input.resultError === undefined, `Deserialization failed with error: ${input.error}`);
  assert(input.dataRemaining === false || input.dataRemaining === undefined, "Data remaining after deserialization");
}

function sequenceOf(type: string, input: string) {
  switch (type) {
    case "bool":
      return new MoveVector(parseArray(input).map((item) => new Bool(item === "true")));
    case "u8":
      return new MoveVector(parseArray(input).map((item) => new U8(parseInt(item, 10))));
    case "u16":
      return new MoveVector(parseArray(input).map((item) => new U16(parseInt(item, 10))));
    case "u32":
      return new MoveVector(parseArray(input).map((item) => new U32(parseInt(item, 10))));
    case "u64":
      return new MoveVector(parseArray(input).map((item) => new U64(BigInt(item))));
    case "u128":
      return new MoveVector(parseArray(input).map((item) => new U128(BigInt(item))));
    case "u256":
      return new MoveVector(parseArray(input).map((item) => new U256(BigInt(item))));
    case "uleb128":
      return new MoveVector(parseArray(input).map((item) => new U32(parseInt(item, 10))));
    case "address":
      return new MoveVector(parseArray(input).map((item) => AccountAddress.from(item)));
    case "string":
      return new MoveVector(parseArray(input).map((item) => new MoveString(item.replace(/"/g, ""))));
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}
