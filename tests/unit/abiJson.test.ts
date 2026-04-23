import {
  parseTypeTag,
  TypeTagAddress,
  TypeTagBool,
  TypeTagU8,
  TypeTagU64,
  TypeTagU128,
  parseEntryFunctionAbiJSON,
  parseViewFunctionAbiJSON,
  EntryFunctionAbiJSON,
  ViewFunctionAbiJSON,
} from "../../src";

describe("ABI JSON", () => {
  describe("parseEntryFunctionAbiJSON", () => {
    it("should parse a basic entry function ABI with signers", () => {
      const json: EntryFunctionAbiJSON = {
        typeParameters: [{ constraints: [] }],
        parameters: ["address", "u64"],
        signers: 1,
      };

      const abi = parseEntryFunctionAbiJSON(json);

      expect(abi.signers).toBe(1);
      expect(abi.typeParameters).toEqual([{ constraints: [] }]);
      expect(abi.parameters).toHaveLength(2);
      expect(abi.parameters[0]).toBeInstanceOf(TypeTagAddress);
      expect(abi.parameters[1]).toBeInstanceOf(TypeTagU64);
    });

    it("should parse an entry function ABI without signers", () => {
      const json: EntryFunctionAbiJSON = {
        typeParameters: [],
        parameters: ["bool", "u8"],
      };

      const abi = parseEntryFunctionAbiJSON(json);

      expect(abi.signers).toBeUndefined();
      expect(abi.typeParameters).toEqual([]);
      expect(abi.parameters).toHaveLength(2);
      expect(abi.parameters[0]).toBeInstanceOf(TypeTagBool);
      expect(abi.parameters[1]).toBeInstanceOf(TypeTagU8);
    });

    it("should parse complex parameter types", () => {
      const json: EntryFunctionAbiJSON = {
        typeParameters: [],
        parameters: [
          "vector<u8>",
          "0x1::string::String",
          "0x1::option::Option<u64>",
          "0x1::object::Object<0x1::fungible_asset::Metadata>",
        ],
      };

      const abi = parseEntryFunctionAbiJSON(json);

      expect(abi.parameters).toHaveLength(4);
      expect(abi.parameters[0].toString()).toBe("vector<u8>");
      expect(abi.parameters[1].toString()).toBe("0x1::string::String");
      expect(abi.parameters[2].toString()).toBe("0x1::option::Option<u64>");
      expect(abi.parameters[3].toString()).toBe("0x1::object::Object<0x1::fungible_asset::Metadata>");
    });

    it("should parse type parameters with constraints", () => {
      const json: EntryFunctionAbiJSON = {
        typeParameters: [{ constraints: ["store", "drop"] }, { constraints: [] }],
        parameters: ["T0", "T1"],
        signers: 1,
      };

      const abi = parseEntryFunctionAbiJSON(json);

      expect(abi.typeParameters).toEqual([{ constraints: ["store", "drop"] }, { constraints: [] }]);
      expect(abi.parameters).toHaveLength(2);
    });

    it("should handle empty parameters", () => {
      const json: EntryFunctionAbiJSON = {
        typeParameters: [],
        parameters: [],
        signers: 1,
      };

      const abi = parseEntryFunctionAbiJSON(json);

      expect(abi.signers).toBe(1);
      expect(abi.parameters).toHaveLength(0);
    });
  });

  describe("parseViewFunctionAbiJSON", () => {
    it("should parse a basic view function ABI", () => {
      const json: ViewFunctionAbiJSON = {
        typeParameters: [{ constraints: [] }],
        parameters: ["address"],
        returnTypes: ["u64"],
      };

      const abi = parseViewFunctionAbiJSON(json);

      expect(abi.typeParameters).toEqual([{ constraints: [] }]);
      expect(abi.parameters).toHaveLength(1);
      expect(abi.parameters[0]).toBeInstanceOf(TypeTagAddress);
      expect(abi.returnTypes).toHaveLength(1);
      expect(abi.returnTypes[0]).toBeInstanceOf(TypeTagU64);
    });

    it("should parse complex return types", () => {
      const json: ViewFunctionAbiJSON = {
        typeParameters: [],
        parameters: [],
        returnTypes: ["u64", "0x1::string::String", "vector<address>"],
      };

      const abi = parseViewFunctionAbiJSON(json);

      expect(abi.returnTypes).toHaveLength(3);
      expect(abi.returnTypes[0]).toBeInstanceOf(TypeTagU64);
      expect(abi.returnTypes[1].toString()).toBe("0x1::string::String");
      expect(abi.returnTypes[2].toString()).toBe("vector<address>");
    });

    it("should handle multiple parameters and return types", () => {
      const json: ViewFunctionAbiJSON = {
        typeParameters: [],
        parameters: ["address", "u128"],
        returnTypes: ["bool", "u64"],
      };

      const abi = parseViewFunctionAbiJSON(json);

      expect(abi.parameters).toHaveLength(2);
      expect(abi.parameters[0]).toBeInstanceOf(TypeTagAddress);
      expect(abi.parameters[1]).toBeInstanceOf(TypeTagU128);
      expect(abi.returnTypes).toHaveLength(2);
      expect(abi.returnTypes[0]).toBeInstanceOf(TypeTagBool);
      expect(abi.returnTypes[1]).toBeInstanceOf(TypeTagU64);
    });

    it("should handle empty parameters and return types", () => {
      const json: ViewFunctionAbiJSON = {
        typeParameters: [],
        parameters: [],
        returnTypes: [],
      };

      const abi = parseViewFunctionAbiJSON(json);

      expect(abi.parameters).toHaveLength(0);
      expect(abi.returnTypes).toHaveLength(0);
    });
  });

  describe("round-trip consistency", () => {
    it("parsed entry ABI should produce the same TypeTags as parseTypeTag", () => {
      const json: EntryFunctionAbiJSON = {
        typeParameters: [{ constraints: [] }],
        parameters: ["address", "u64"],
        signers: 1,
      };

      const abi = parseEntryFunctionAbiJSON(json);

      expect(abi.parameters[0]).toEqual(parseTypeTag("address"));
      expect(abi.parameters[1]).toEqual(parseTypeTag("u64"));
    });

    it("parsed view ABI should produce the same TypeTags as parseTypeTag", () => {
      const json: ViewFunctionAbiJSON = {
        typeParameters: [{ constraints: [] }],
        parameters: ["address"],
        returnTypes: ["u64"],
      };

      const abi = parseViewFunctionAbiJSON(json);

      expect(abi.parameters[0]).toEqual(parseTypeTag("address"));
      expect(abi.returnTypes[0]).toEqual(parseTypeTag("u64"));
    });

    it("serialized JSON should be valid JSON.stringify/parse round-trip", () => {
      const entryJson: EntryFunctionAbiJSON = {
        typeParameters: [{ constraints: ["store"] }],
        parameters: ["address", "u64", "vector<0x1::string::String>"],
        signers: 2,
      };

      const serialized = JSON.stringify(entryJson);
      const deserialized = JSON.parse(serialized) as EntryFunctionAbiJSON;
      const abi = parseEntryFunctionAbiJSON(deserialized);

      expect(abi.signers).toBe(2);
      expect(abi.parameters).toHaveLength(3);
      expect(abi.typeParameters).toEqual([{ constraints: ["store"] }]);
    });
  });
});
