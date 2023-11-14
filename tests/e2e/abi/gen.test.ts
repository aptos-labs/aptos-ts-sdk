// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
  parseTypeTag,
  truncatedTypeTagString,
} from "../../../src";
import { PUBLISHER_ACCOUNT_PK, fundAccounts, publishArgumentTestModule } from "../transaction/helper";
import { CodeGenerator } from "../../../src/abi/abi-gen";
import { ConfigDictionary, getCodeGenConfig } from "../../../src/abi/config";

jest.setTimeout(30000);

describe.only("abi test", () => {
  let codeGeneratorConfig: ConfigDictionary;
  let codeGenerator: CodeGenerator;

  beforeAll(async () => {
    codeGeneratorConfig = getCodeGenConfig("./src/abi/config.yaml");
    codeGenerator = new CodeGenerator(codeGeneratorConfig);
  });

  it("parses modules and writes to files correctly", async () => {
    const aptosLocal = new Aptos(new AptosConfig({ network: Network.LOCAL }));
    const account = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(PUBLISHER_ACCOUNT_PK),
      legacy: false,
    });
    await fundAccounts(aptosLocal, [account]);
    await publishArgumentTestModule(aptosLocal, account);
    await codeGenerator.generateCodeForModules(aptosLocal, [
      // AccountAddress.ONE,
      // AccountAddress.THREE,
      // AccountAddress.FOUR,
      // AccountAddress.fromRelaxed("0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"),
      account.accountAddress,
    ]);
  });

  it("parses tournament abis correctly", async () => {
    const accountAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
    );
    const aptos = new Aptos(new AptosConfig({ network: Network.LOCAL }));
    const tournamentModuleABIs = await codeGenerator.fetchABIs(aptos, accountAddress);
    codeGenerator.writeGeneratedCodeToFiles("tournament", "./generated", tournamentModuleABIs);
  });

  it("parses config.yaml correctly", async () => {
    const asdf = getCodeGenConfig();
    console.log(asdf);
  });
});

describe("type tag parsing", () => {
  it("truncates type tag string correctly", async () => {
    const typeTag1 = parseTypeTag("vector<0x1::object::Object<0x4::token::Token>>");
    const typeTag2 = parseTypeTag("vector<0x1::string::String>");
    const typeTag3 = parseTypeTag("vector<0x1::option::Option<0x1::object::Object<0x4::token::Token>>>");
    expect(truncatedTypeTagString({ typeTag: typeTag1 })).toEqual("vector<Object<0x4::token::Token>>");
    expect(truncatedTypeTagString({ typeTag: typeTag2 })).toEqual("vector<String>");
    expect(truncatedTypeTagString({ typeTag: typeTag3 })).toEqual("vector<Option<Object<0x4::token::Token>>>");
  });

  it("truncates type tag string correctly based on replaced typetags and named addresses", async () => {
    const codeGeneratorConfig = getCodeGenConfig("./src/abi/config.yaml");
    const namedAddresses = codeGeneratorConfig.namedAddresses!;
    const namedTypeTags = codeGeneratorConfig.namedTypeTags!;
    // ensure we have the replacement here
    namedTypeTags[parseTypeTag("0x4::token::Token").toString()] = "Token";

    const typeTag1 = parseTypeTag("vector<0x1::object::Object<0x4::token::Token>>");
    const typeTag2 = parseTypeTag("vector<0x1::string::String>");
    const typeTag3 = parseTypeTag("vector<0x1::option::Option<0x1::object::Object<0x4::token::Token>>>");
    expect(truncatedTypeTagString({ typeTag: typeTag1, namedAddresses, namedTypeTags })).toEqual(
      "vector<Object<Token>>",
    );
    expect(truncatedTypeTagString({ typeTag: typeTag2, namedAddresses, namedTypeTags })).toEqual("vector<String>");
    expect(truncatedTypeTagString({ typeTag: typeTag3, namedAddresses, namedTypeTags })).toEqual(
      "vector<Option<Object<Token>>>",
    );
    namedTypeTags[parseTypeTag("0x4::token::Token").toString()] = "Cowabunga";
    expect(truncatedTypeTagString({ typeTag: typeTag3, namedAddresses, namedTypeTags })).toEqual(
      "vector<Option<Object<Cowabunga>>>",
    );

    namedAddresses["0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"] = "tournament";
    // try to trick it and replace named address
    const typeTag4 = parseTypeTag(
      "vector<0x1::option::Option<0x1::object::Object<0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766::token::Token>>>",
    );
    expect(truncatedTypeTagString({ typeTag: typeTag4, namedAddresses, namedTypeTags })).toEqual(
      "vector<Option<Object<tournament::token::Token>>>",
    );
  });
});
