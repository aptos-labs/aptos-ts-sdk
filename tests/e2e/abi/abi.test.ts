// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, AccountAddress, Aptos, AptosConfig, Ed25519PrivateKey, Hex, MoveString, Network } from "../../../src";
import { FUND_AMOUNT } from "../../unit/helper";
import { PUBLISHER_ACCOUNT_PK, fundAccounts, publishArgumentTestModule } from "../transaction/helper";
import { SingleSignerTransactionBuilder } from "../../../src/bcs/serializable/tx-builder/singleSignerTransactionBuilder";
import { sha3_256 } from "js-sha3";
import { getSourceCodeMap } from "../../../src/abi/package-metadata";
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

  it("parses config.yaml correctly", async () => {
    const asdf = getCodeGenConfig();
    console.log(asdf);
  });

  it.only("parses abis correctly", async () => {
    const aptosDevnet = new Aptos(new AptosConfig({ network: Network.DEVNET }));
    const aptosTestnet = new Aptos(new AptosConfig({ network: Network.TESTNET }));
    const account = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(PUBLISHER_ACCOUNT_PK),
      legacy: false,
    });
    await aptosDevnet.fundAccount({ accountAddress: account.accountAddress.toString(), amount: FUND_AMOUNT });
    await publishArgumentTestModule(aptosDevnet, account);

    await codeGenerator.generateCodeForModules(aptosDevnet, [
      AccountAddress.ONE,
      // AccountAddress.THREE,
      // AccountAddress.FOUR,
    ]);

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

  // it("serializes from abis correctly", async () => {
  //     const address = AccountAddress.ZERO;
  //     const testPayload = new TxArgsModule.PublicArgumentsMultipleSigners({
  //         arg_0: [address],
  //         arg_1: true,
  //         arg_2: 2,
  //         arg_3: 3,
  //         arg_4: 4,
  //         arg_5: 5n,
  //         arg_6: 6n,
  //         arg_7: 7n,
  //         arg_8: address,
  //         arg_9: "9",
  //         arg_10: address,
  //         arg_11: [11],
  //         arg_12: [true],
  //         arg_13: [13],
  //         arg_14: [14],
  //         arg_15: [15],
  //         arg_16: [16n],
  //         arg_17: [17n],
  //         arg_18: [18n],
  //         arg_19: [address],
  //         arg_20: ["20"],
  //         arg_21: [address],
  //         arg_22: [22],
  //         arg_23: [true],
  //         arg_24: [24],
  //         arg_25: [25],
  //         arg_26: [26],
  //         arg_27: [27n],
  //         arg_28: [28n],
  //         arg_29: [29n],
  //         arg_30: [address],
  //         arg_31: ["31"],
  //         arg_32: [address],
  //     });
  // });
});
