// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Hex,
  MoveString,
  Network,
  parseTypeTag,
  truncatedTypeTagString,
} from "../../../src";
import { FUND_AMOUNT } from "../../unit/helper";
import { PUBLISHER_ACCOUNT_PK, fundAccounts, publishArgumentTestModule } from "../transaction/helper";
import { SingleSignerTransactionBuilder } from "../../../src/bcs/serializable/tx-builder/singleSignerTransactionBuilder";
import { sha3_256 } from "js-sha3";
import { getSourceCodeMap } from "../../../src/abi/package-metadata";
import { CodeGenerator } from "../../../src/abi/abi-gen";
import { ConfigDictionary, getCodeGenConfig } from "../../../src/abi/config";
import { AptosFramework, AptosTokenObjects, AptosToken, Tournament } from "../../../generated/";
import { ViewAllArguments } from "../../../generated/args_test_suite/tx_args_module";
import { TxArgsModule } from "../../../generated/args_test_suite";
import {
  MAX_U128_BIG_INT,
  MAX_U16_NUMBER,
  MAX_U256_BIG_INT,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U8_NUMBER,
} from "../../../src/bcs/consts";

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

  // NOTE: THIS FUNCTION WILL FAIL CURRENTLY
  // This is because I am too lazy to implement the correct MoveStructLayout type for JSON serialization.
  // I would rather just wait for BCS serialized view functions to be implemented.
  it.skip("calls a view function correctly", async () => {
    const aptosLocal = new Aptos(new AptosConfig({ network: Network.LOCAL }));
    const account = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(PUBLISHER_ACCOUNT_PK),
      legacy: false,
    });
    await fundAccounts(aptosLocal, [account]);
    await publishArgumentTestModule(aptosLocal, account);
    const viewPayload = new TxArgsModule.ViewAllArguments(
      true,
      0,
      1,
      2,
      3n,
      4n,
      5, //?
      account.accountAddress,
      "9",
      account.accountAddress,
      new Uint8Array([1, 2, 3, 4]),
      [true, true, false, true, false, false],
      new Uint8Array([1, 2, 3, 4, 5]),
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6, 7],
      [100, 121, 131],
      [100, 121, 131],
      [100, 121, 131],
      [account.accountAddress, account.accountAddress, account.accountAddress],
      ["okay", "one", "two"],
      [account.accountAddress, account.accountAddress, account.accountAddress],
      [],
      [true],
      [1],
      [2],
      [3],
      [4],
      [5],
      [6],
      [account.accountAddress],
      ["string option"],
      [account.accountAddress],
    );
    viewPayload.argsToArray().forEach((arg, i) => {
      console.log(`arg ${i}: ${arg}`);
    });
    const response = await viewPayload.submit({ aptos: aptosLocal });
    console.log(response);
  });

  it("parses abis correctly", async () => {
    const aptosDevnet = new Aptos(new AptosConfig({ network: Network.DEVNET }));
    const aptosTestnet = new Aptos(new AptosConfig({ network: Network.TESTNET }));
    const account = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(PUBLISHER_ACCOUNT_PK),
      legacy: false,
    });
    await aptosDevnet.fundAccount({ accountAddress: account.accountAddress.toString(), amount: FUND_AMOUNT });
    await publishArgumentTestModule(aptosDevnet, account);

    await codeGenerator.generateCodeForModules(aptosTestnet, [
      AccountAddress.ONE,
      AccountAddress.THREE,
      AccountAddress.FOUR,
      AccountAddress.fromRelaxed("0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"),
    ]);
    // new Tournament.Lobby.GetRooms.

    // const myModuleABIs = await codeGenerator.fetchABIs(aptosDevnet, account.accountAddress);
    // const frameworkModuleABIs = await codeGenerator.fetchABIs(aptosDevnet, AccountAddress.fromRelaxed("0x1"));
    // const tokenModuleABIs = await codeGenerator.fetchABIs(aptosDevnet, AccountAddress.fromRelaxed("0x3"));
    // const tokenObjectsModuleABIs = await codeGenerator.fetchABIs(aptosDevnet, AccountAddress.fromRelaxed("0x4"));
    // codeGenerator.writeGeneratedCodeToFiles("./generated", myModuleABIs);
    // codeGenerator.writeGeneratedCodeToFiles("./generated", frameworkModuleABIs);
    // codeGenerator.writeGeneratedCodeToFiles("./generated", tokenModuleABIs);
    // codeGenerator.writeGeneratedCodeToFiles("./generated", tokenObjectsModuleABIs);
    // const tournamentModuleABIs = await codeGenerator.fetchABIs(
    //   aptosTestnet,
    //   AccountAddress.fromRelaxed("0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"),
    // );
    // codeGenerator.writeGeneratedCodeToFiles("./generated", tournamentModuleABIs);
  });

  // TODO: Fix the signers in `arg` class types. They should probably be a separate field
  // or at least the `argsToArray()` should ignore them. Most likely just a different field, although I like seeing them together in the
  // constructor.
  it.only("serializes from abis correctly", async () => {
    const aptos = new Aptos(new AptosConfig({ network: Network.LOCAL }));
    const account1 = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(PUBLISHER_ACCOUNT_PK),
      legacy: false,
    });
    // const account2 = Account.generate();
    // const account3 = Account.generate();
    // const account4 = Account.generate();
    // const account5 = Account.generate();
    await aptos.fundAccount({ accountAddress: account1.accountAddress.toString(), amount: FUND_AMOUNT });
    await publishArgumentTestModule(aptos, account1);

    type SetupData = {
      empty_object_1: { inner: string };
      empty_object_2: { inner: string };
      empty_object_3: { inner: string };
    };

    const setupData = await aptos.getAccountResource<SetupData>({
      accountAddress: account1.accountAddress.toString(),
      resourceType: `${account1.accountAddress.toString()}::tx_args_module::SetupData`,
    });
    const moduleObjects: Array<AccountAddress> = [];

    moduleObjects.push(AccountAddress.fromStringRelaxed(setupData.empty_object_1.inner));
    moduleObjects.push(AccountAddress.fromStringRelaxed(setupData.empty_object_2.inner));
    moduleObjects.push(AccountAddress.fromStringRelaxed(setupData.empty_object_3.inner));

    const testPayload = new TxArgsModule.PublicArguments(
      true,
      1,
      2,
      3,
      4,
      5,
      6,
      account1.accountAddress.toString(),
      "expected_string",
      moduleObjects[0].toString(),
      new Uint8Array([]),
      [true, false, true],
      new Uint8Array([0, 1, 2, MAX_U8_NUMBER - 2, MAX_U8_NUMBER - 1, MAX_U8_NUMBER]),
      [0, 1, 2, MAX_U16_NUMBER - 2, MAX_U16_NUMBER - 1, MAX_U16_NUMBER],
      [0, 1, 2, MAX_U32_NUMBER - 2, MAX_U32_NUMBER - 1, MAX_U32_NUMBER],
      [0, 1, 2, MAX_U64_BIG_INT - BigInt(2), MAX_U64_BIG_INT - BigInt(1), MAX_U64_BIG_INT],
      [0, 1, 2, MAX_U128_BIG_INT - BigInt(2), MAX_U128_BIG_INT - BigInt(1), MAX_U128_BIG_INT],
      [0, 1, 2, MAX_U256_BIG_INT - BigInt(2), MAX_U256_BIG_INT - BigInt(1), MAX_U256_BIG_INT],
      ["0x0", "0xabc", "0xdef", "0x123", "0x456", "0x789"],
      ["expected_string", "abc", "def", "123", "456", "789"],
      moduleObjects.map((obj) => obj.toString()),
      [],
      [true],
      [1],
      [2],
      [3],
      [4],
      [5],
      [6],
      [account1.accountAddress.toString()],
      ["expected_string"],
      [moduleObjects[0].toString()],
    );
    // TODO: Add support for smart `submit` with feepayer and multiagent
    const response = await testPayload.submit({ signer: account1, aptos: aptos });
    console.log(response);
});

  it("parses tournament abis correctly", async () => {
    const accountAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
    );
    const aptos = new Aptos(new AptosConfig({ network: Network.LOCAL }));
    const tournamentModuleABIs = await codeGenerator.fetchABIs(aptos, accountAddress);
    codeGenerator.writeGeneratedCodeToFiles("tournament", "./generated", tournamentModuleABIs);

    // eslint-disable-next-line no-console
    // writeGeneratedCodeToFiles('./generated/', 'config.yaml', moduleABIs);
  });

  it("parses 0x1 module abis correctly", async () => {
    const accountAddress = AccountAddress.fromRelaxed("0x1");
    const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
    const moduleABIs = await codeGenerator.fetchABIs(aptos, accountAddress);

    // eslint-disable-next-line no-console
    // writeGeneratedCodeToFiles('./generated/', 'config.yaml', moduleABIs);

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const coinTransferPayload = new AptosFramework.Coin.Transfer(
    //   Account.generate().accountAddress,
    //   1000n,
    // );

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const publishPackagePayload = new AptosFramework.Code.PublishPackageTxn(
    //   new Uint8Array(),
    //   new Array(new Uint8Array()),
    // );

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const transferCallPayload = new AptosFramework.Object$1.TransferCall(
    //   Account.generate().accountAddress,
    //   Account.generate().accountAddress,
    // );

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const batchTransferPayload = new AptosFramework.AptosAccount.BatchTransferCoins(
    //   [Account.generate().accountAddress],
    //   [1000n],
    // );

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const batchTransferPayloadSerialized = batchTransferPayload.bcsToBytes();
  });

  /*  it("tests rock paper scissors commands", async () => {
    const tournamentManager = Account.generate();
    const account1 = Account.generate();
    const account2 = Account.generate();
    const aptos = new Aptos(new AptosConfig({ network: Network.LOCAL }));
    await fundAccounts(aptos, [tournamentManager, account1, account2]);
    const TOURNAMENT_ADDRESS = AccountAddress.fromRelaxed(
      "0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451",
    );
    const TOURNAMENT_NAME = "Tournament";

    const tournamentCreate = await SingleSignerTransactionBuilder.create({
      sender: tournamentManager.accountAddress,
      payload: new TournamentManager.InitializeTournament("Tournament", 2, 1, 10).toPayload(),
      configOrNetwork: Network.LOCAL,
    });

    tournamentCreate.sign(tournamentManager);
    const response = await tournamentCreate.submitAndWaitForResponse();
    console.log(response);

    const joinTournamentp1 = await SingleSignerTransactionBuilder.create({
      sender: account1.accountAddress,
      payload: new TournamentManager.JoinTournament(TOURNAMENT_ADDRESS, TOURNAMENT_NAME).toPayload(),
      configOrNetwork: Network.LOCAL,
    });

    joinTournamentp1.sign(account1);
    const responsep1 = await joinTournamentp1.submitAndWaitForResponse();
    console.log(responsep1);

    const joinTournamentp2 = await SingleSignerTransactionBuilder.create({
      sender: account1.accountAddress,
      payload: new TournamentManager.JoinTournament(TOURNAMENT_ADDRESS, TOURNAMENT_NAME).toPayload(),
      configOrNetwork: Network.LOCAL,
    });

    joinTournamentp2.sign(account1);
    const responsep2 = await joinTournamentp2.submitAndWaitForResponse();
    console.log(responsep2);

    const startTournament = await SingleSignerTransactionBuilder.create({
      sender: tournamentManager.accountAddress,
      payload: new TournamentManager.StartNewRound(TOURNAMENT_ADDRESS).toPayload(),
      configOrNetwork: Network.LOCAL,
    });

    startTournament.sign(tournamentManager);
    const responseStart = await startTournament.submitAndWaitForResponse();
    console.log(responseStart);

    const commitAction1 = await SingleSignerTransactionBuilder.create({
      sender: account1.accountAddress,
      payload: new RockPaperScissor.CommitAction(
        TOURNAMENT_ADDRESS,
        Hex.fromString(sha3_256("Rock" + "uuid1")).toUint8Array(),
      ).toPayload(),
      configOrNetwork: Network.LOCAL,
    });

    commitAction1.sign(account1);
    const responseCommit = await commitAction1.submitAndWaitForResponse();
    console.log(responseCommit);

    const commitAction2 = await SingleSignerTransactionBuilder.create({
      sender: account2.accountAddress,
      payload: new RockPaperScissor.CommitAction(
        TOURNAMENT_ADDRESS,
        Hex.fromString(sha3_256("Paper" + "uuid2")).toUint8Array(),
      ).toPayload(),
      configOrNetwork: Network.LOCAL,
    });
    commitAction2.sign(account2);
    const responseCommit2 = await commitAction2.submitAndWaitForResponse();
    console.log(responseCommit2);

    const verifyAction = await SingleSignerTransactionBuilder.create({
      sender: account1.accountAddress,
      payload: new RockPaperScissor.VerifyAction(
        TOURNAMENT_ADDRESS,
        new MoveString("Rock").bcsToBytes().slice(1),
        new MoveString("uuid1").bcsToBytes().slice(1),
      ).toPayload(),
      configOrNetwork: Network.LOCAL,
    });

    verifyAction.sign(account1);
    const responseVerify = await verifyAction.submitAndWaitForResponse();
    console.log(responseVerify);

    const verifyAction2 = await SingleSignerTransactionBuilder.create({
      sender: account2.accountAddress,
      payload: new RockPaperScissor.VerifyAction(
        TOURNAMENT_ADDRESS,
        new MoveString("Paper").bcsToBytes().slice(1),
        new MoveString("uuid2").bcsToBytes().slice(1),
      ).toPayload(),
      configOrNetwork: Network.LOCAL,
    });
    verifyAction2.sign(account2);
    const responseVerify2 = await verifyAction2.submitAndWaitForResponse();
    console.log(responseVerify2);
  });
  */

  it("gets package metadata", async () => {
    const accountAddress = AccountAddress.fromRelaxed(
      "0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451",
    );
    const network = Network.LOCAL;
    const r = await getSourceCodeMap(accountAddress, network);
    // const parsed = r.map(p => p.map(m => m.source.replace(/\n/g, " ")));
  });

  it("gets argument names from package metadata regex", async () => {
    const accountAddress = AccountAddress.fromRelaxed(
      "0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451",
    );
    const network = Network.LOCAL;
    const sourceCode = await getSourceCodeMap(accountAddress, network);
    // sourceCode.forEach(pkg => {
    //   pkg.forEach(module => {

    //   });
    // });
  });

  it("parses config.yaml correctly", async () => {
    const asdf = getCodeGenConfig();
    console.log(asdf);
  });

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
