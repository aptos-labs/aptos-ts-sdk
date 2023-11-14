import { before } from "node:test";
import { Tournament } from "../../../generated";
import {
  TournamentManager,
  AptosTournament,
  PlayerProfile,
  RockPaperScissor,
  Round,
} from "../../../generated/tournament";
import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  EntryFunctionPayloadResponse,
  Event,
  Hex,
  HexInput,
  MoveString,
  MoveVector,
  Network,
  TransactionResponse,
  TransactionResponseType,
  TypeTag,
  UserTransactionResponse,
  WriteSetChange,
  WriteSetChangeWriteResource,
  parseTypeTag,
} from "../../../src";
import { config } from "dotenv";
import { FUND_AMOUNT } from "../../unit/helper";
import { fundAccounts } from "../transaction/helper";
import { sha3_256 } from "@noble/hashes/sha3";

// TODO: REMOVE THIS
const DEPLOYER_PRIVATE_KEY = new Ed25519PrivateKey(
  "0xba9effb88920973eff3af992aa3a31520bbc5b7a3a9607c53c8f585d086648fa",
);
// also deployer
const CONTRACT_ADDRESS = AccountAddress.fromRelaxed(
  "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
);

let deployer: Account;
let admin: Account;
let aptos: Aptos;
let player_1 = Account.generate();
let player_2 = Account.generate();

const getContractResources = async (aptos: Aptos, deployerAddress: AccountAddress): Promise<any> => {
  const resources = await aptos.getAccountResources({
    accountAddress: CONTRACT_ADDRESS,
  });
  return resources;
};

const getTransactionHashByFunctionCall = (
  transactionResponses: Array<TransactionResponse>,
  functionCall: string,
): UserTransactionResponse => {
  const userTransactionResponses = (
    transactionResponses.filter(
      (transaction) => transaction.type === TransactionResponseType.User,
    ) as Array<UserTransactionResponse>
  ).filter((transaction) => transaction.payload.type === "entry_function_payload");
  const transaction = userTransactionResponses.find(
    (transaction) =>
      transaction.payload.type == "entry_function_payload" &&
      (transaction.payload as EntryFunctionPayloadResponse).function == functionCall,
  );
  if (transaction !== undefined) {
    return transaction;
  }
  throw new Error("No transaction found");
};

const getResourcesFromChanges = (
  transaction: UserTransactionResponse,
  resourceType: string | ResourceTypes,
): WriteSetChangeWriteResource | undefined => {
  const changes = transaction.changes;
  const newResourceType: string =
    typeof resourceType === "string" ? resourceType : getResourceTypeTag(resourceType).toString();
  const change = changes.find(
    (change) =>
      change.type === "write_resource" && (change as WriteSetChangeWriteResource).data.type.includes(newResourceType),
  );
  if (change) {
    return change as WriteSetChangeWriteResource;
  }
  return;
};

const getEventsByType = (transaction: UserTransactionResponse, resourceType: string | ResourceTypes): Array<Event> => {
  const eventType: string =
    typeof resourceType === "string" ? resourceType : getResourceTypeTag(resourceType).toString();
  const events = transaction.events.filter((event) => event.type === eventType);
  return events;
};

export enum ResourceTypes {
  Room = 0,
  RockPaperScissorsGame = 1,
  Trivia = 2,
  RoomWithGenericRPSGame = 3, // Room<RockPaperScissorsGame>
  RoomWithGenericTrivia = 4, // Room<Trivia>
  TournamentDeployer = 5,
  PlayerRPS = 6,
  GameRPS = 7,
  AptosTournament = 8,
  GameOverEventRPS = 9,
}

export type JSONOption<T> = {
  vec: [] | [T];
};

export type RPSGameResource = {
  player1: {
    address: string;
    committed_action: JSONOption<string>;
    token_address: string;
    verified_action: JSONOption<string>;
  };
  player2: {
    address: string;
    committed_action: JSONOption<string>;
    token_address: string;
    verified_action: JSONOption<string>;
  };
};

export type GameOverEvent = Event & {
  data: {
    game_address: string;
    winners: Array<string>;
    losers: Array<string>;
  };
};

const getResourceTypeTag = (resource: ResourceTypes): TypeTag => {
  switch (resource) {
    case ResourceTypes.Room:
      return parseTypeTag(`${CONTRACT_ADDRESS}::room::Room`);
    case ResourceTypes.RockPaperScissorsGame:
      // NOTE: This will likely change.
      return parseTypeTag(`${CONTRACT_ADDRESS}::rock_paper_scissor::RockPaperScissorsGame`);
    case ResourceTypes.Trivia:
      // NOTE: This will likely change.
      return parseTypeTag(`${CONTRACT_ADDRESS}::trivia::TriviaGame`);
    case ResourceTypes.RoomWithGenericRPSGame:
      // Room<RockPaperScissorsGame>
      return parseTypeTag(
        `${CONTRACT_ADDRESS}::room::Room<${getResourceTypeTag(ResourceTypes.RockPaperScissorsGame)}>`,
      );
    case ResourceTypes.RoomWithGenericTrivia:
      // Room<Trivia>
      return parseTypeTag(`${CONTRACT_ADDRESS}::room::Room<${getResourceTypeTag(ResourceTypes.Trivia)}>`);
    case ResourceTypes.TournamentDeployer:
      return parseTypeTag(`${CONTRACT_ADDRESS}::tournament_manager::TournamentDirector`);
    case ResourceTypes.PlayerRPS:
      return parseTypeTag(`${CONTRACT_ADDRESS}::rock_paper_scissor::Player`);
    case ResourceTypes.GameRPS:
      return parseTypeTag(`${CONTRACT_ADDRESS}::rock_paper_scissor::Game`);
    case ResourceTypes.AptosTournament:
      return parseTypeTag(`${CONTRACT_ADDRESS}::aptos_tournament::AptosTournament`);
    case ResourceTypes.GameOverEventRPS:
      return parseTypeTag(
        `${CONTRACT_ADDRESS}::events::GameOverEvent<${getResourceTypeTag(ResourceTypes.RockPaperScissorsGame)}>`,
      );
    default:
      throw new Error("Invalid resource type");
  }
};

enum Action {
  Rock = "Rock",
  Paper = "Paper",
  Scissor = "Scissor",
}

type CommitActionBytes = {
  action: Uint8Array;
  hashAddition: Uint8Array;
  hash: Uint8Array;
};

const actionHash = (action: Action, hashAddition: string): CommitActionBytes => {
  const actionInputBytes = new MoveString(action).bcsToBytes().slice(1);
  const hashAdditionInputBytes = new MoveString(hashAddition).bcsToBytes().slice(1);
  const hash = sha3_256(new Uint8Array([...actionInputBytes, ...hashAdditionInputBytes]));
  return {
    action: actionInputBytes,
    hashAddition: hashAdditionInputBytes,
    hash,
  };
};

jest.setTimeout(30000);

beforeAll(async () => {
  aptos = new Aptos(new AptosConfig({ network: Network.LOCAL }));
  deployer = Account.fromPrivateKey({ privateKey: DEPLOYER_PRIVATE_KEY, legacy: true });
  admin = Account.generate();
  await fundAccounts(aptos, [deployer, admin, player_1, player_2]);
  // const contractResources = await getContractResources(aptos, deployer.accountAddress);
});

describe("Tournament", () => {
  it.skip("serializes and hashes byte strings correctly", () => {
    {
      const player_1_ActionInfo = actionHash(Action.Rock, "");
      expect(player_1_ActionInfo.action).toEqual(new Uint8Array([82, 111, 99, 107]));

      const expected1 = "0x6bdff691fec9e2936a5c3324fc36cb8205f8379c77c7eb25cca2052b30dfdba1";
      expect(Hex.fromHexInput(player_1_ActionInfo.hash).toString()).toEqual(expected1);
    }
    {
      const player_1_ActionInfo = actionHash(Action.Rock, "im a rock");
      expect(player_1_ActionInfo.action).toEqual(new Uint8Array([82, 111, 99, 107]));
      expect(player_1_ActionInfo.hashAddition).toEqual(new Uint8Array([105, 109, 32, 97, 32, 114, 111, 99, 107]));

      const expected2 = "0x4f42517fa7a9573c9034d4587601b0b6a0db7350c683f43cae9597b8b59ba95e";
      expect(Hex.fromHexInput(player_1_ActionInfo.hash).toString()).toEqual(expected2);
    }
  });

  it.only("runs a test", async () => {
    // get tournament director address by looking at publish package txn
    const deployerTransactions = await aptos.getAccountTransactions({
      accountAddress: deployer.accountAddress,
      options: {
        offset: 0,
      },
    });
    // const deploymentTx = getTransactionHashByFunctionCall(deployerTransactions, "0x1::code::publish_package_txn");
    // const tournamentDeployerWritesetFromPublish = getResourcesFromChanges(deploymentTx.changes, ResourceTypes.TournamentDeployer)!;
    // const TOURNAMENT_DIRECTOR_OLD = tournamentDeployerWritesetFromPublish.address;

    const initializeTournamentResponse = await new TournamentManager.InitializeTournament(
      "My favorite tournament!",
      2,
      1,
      [admin.accountAddress],
    ).submit({ signer: admin, aptos });
    const tournamentDeployerWriteset = getResourcesFromChanges(
      initializeTournamentResponse,
      ResourceTypes.TournamentDeployer,
    )!;
    const TOURNAMENT_DIRECTOR = tournamentDeployerWriteset.address;

    const setAdminResponse = await new AptosTournament.SetAdminSigner(admin.accountAddress).submit({
      signer: deployer,
      aptos,
    });
    let resources = getResourcesFromChanges(setAdminResponse, ResourceTypes.AptosTournament);
    // wow that's an ugly JSON response...
    // it's .vec because it's an option type
    console.log(resources);
    const adminAddress = AccountAddress.fromRelaxed((resources?.data?.data as any)?.admin_address.vec[0]);
    console.log(adminAddress.toString());
    console.log(admin.accountAddress.toString());

    const setTournamentJournableResponse = await new TournamentManager.SetTournamentJoinable(
      TOURNAMENT_DIRECTOR,
    ).submit({ signer: admin, aptos });
    // console.log(setTournamentJournableResponse);

    const joinTournamentResponse_1 = await new TournamentManager.JoinTournament(TOURNAMENT_DIRECTOR, "Player 1").submit(
      { signer: player_1, aptos },
    );
    const tokenAddress_1 = AccountAddress.fromRelaxed(
      getResourcesFromChanges(joinTournamentResponse_1, "0x4::token::Token")!.address,
    );

    const joinTournamentResponse_2 = await new TournamentManager.JoinTournament(TOURNAMENT_DIRECTOR, "Player 2").submit(
      { signer: player_2, aptos },
    );
    const tokenAddress_2 = AccountAddress.fromRelaxed(
      getResourcesFromChanges(joinTournamentResponse_2, "0x4::token::Token")!.address,
    );

    const startNewRoundResponse = await new AptosTournament.StartNewRound(TOURNAMENT_DIRECTOR, [
      getResourceTypeTag(ResourceTypes.RockPaperScissorsGame),
    ]).submit({ signer: admin, aptos });

    const addPlayersToGame = await new AptosTournament.AddPlayersToGame(TOURNAMENT_DIRECTOR, [
      tokenAddress_1,
      tokenAddress_2,
    ]).submit({ signer: admin, aptos });

    // console.log(addPlayersToGame);
    const roomGameTypeWriteset = getResourcesFromChanges(addPlayersToGame, ResourceTypes.RoomWithGenericRPSGame);
    const roomAddress = AccountAddress.fromRelaxed(roomGameTypeWriteset!.address);

    const roundAddress = AccountAddress.fromRelaxed(
      (await new TournamentManager.GetRoundAddress(TOURNAMENT_DIRECTOR).submit({ aptos })) as string,
    );
    // console.log(roundAddress.toString());

    const player_1_ActionInfo = actionHash(Action.Rock, "im a rock");
    const player_1_CommitResponse = await new RockPaperScissor.CommitAction(
      roomAddress,
      player_1_ActionInfo.hash,
    ).submit({ signer: player_1, aptos });

    const player_2_ActionInfo = actionHash(Action.Scissor, "im a scissor");
    const player_2_CommitResponse = await new RockPaperScissor.CommitAction(
      roomAddress,
      player_2_ActionInfo.hash,
    ).submit({ signer: player_2, aptos });
    const committedHash = getResourcesFromChanges(player_2_CommitResponse, ResourceTypes.GameRPS)!.data
      .data as RPSGameResource;
    console.log(committedHash);
    console.log(committedHash.player1.committed_action.vec[0]);
    console.log(committedHash.player2.committed_action.vec[0]);
    // console.log(committedHash.player2.verified_action.vec[0]);
    // console.log(committedHash.player2.verified_action.vec[0]);

    const player_1_VerifyResponse = await new RockPaperScissor.VerifyAction(
      roomAddress,
      player_1_ActionInfo.action,
      player_1_ActionInfo.hashAddition,
    ).submit({ signer: player_1, aptos });
    const player_1_token_resources = await aptos.getAccountResources({ accountAddress: tokenAddress_1 });
    // console.log(player_1_token_resources);

    const player_2_VerifyResponse = await new RockPaperScissor.VerifyAction(
      roomAddress,
      player_2_ActionInfo.action,
      player_2_ActionInfo.hashAddition,
    ).submit({ signer: player_2, aptos });

    // By player! not Object<Token>
    const events = getEventsByType(player_2_VerifyResponse, ResourceTypes.GameOverEventRPS)[0] as GameOverEvent;
    console.log(events);
    console.log(events);
  });
});
