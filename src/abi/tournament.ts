import { AptosConfig, EntryFunction, EntryFunctionArgumentTypes, Identifier, ModuleId, MoveString, MoveVector, Network, TransactionPayloadEntryFunction, U64, U8 } from "..";
import { Serializable, Serializer } from "../bcs";
import { SingleSignerTransactionBuilder } from "../bcs/serializable/tx-builder/singleSignerTransactionBuilder";
import { TransactionBuilder } from "../bcs/serializable/tx-builder/transactionBuilder";
import { Account, AccountAddress } from "../core";
import { Signer } from "../core/signer";
import { HexInput, Uint8, Uint64, UserTransactionResponse } from "../types";
import { toAccountAddress } from "./utils";

const addressFromAny = (address: HexInput | AccountAddress): AccountAddress => {
  if (address instanceof AccountAddress) {
    return address;
  }
  return AccountAddress.fromHexInputRelaxed(address);
};








export namespace RockPaperScissor {
  export type CommitActionSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveVector<U8>;
  }

  export class CommitAction extends Serializable {
    public readonly moduleAddress = AccountAddress.fromHexInputRelaxed("0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451");
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "commit_action";
    public readonly args: CommitActionSerializableArgs;

    constructor(
      arg_0: HexInput | AccountAddress,  // address
      arg_1: Array<Uint8>,  // vector<u8>
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(arg_0)),
        arg_1: new MoveVector(arg_1.map(argA => new U8(argA))),
      }
    }

    toPayload(): TransactionPayloadEntryFunction {
      const entryFunction = new EntryFunction(
        new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
        new Identifier(this.functionName),
        [],
        this.argsToArray()
      )
      return new TransactionPayloadEntryFunction(entryFunction)
    }

    argsToArray(): Array<EntryFunctionArgumentTypes> {
      return Object.keys(this.args).map(field => this.args[field as keyof typeof this.args]);
    }

    serialize(serializer: Serializer): void {
      const args = this.argsToArray();
      args.forEach(arg => {
        serializer.serialize(arg);
      });
    }
  }
  export type CreateGameSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
    arg_2: AccountAddress;
    arg_3: AccountAddress;
  }

  export class CreateGame extends Serializable {
    public readonly moduleAddress = AccountAddress.fromHexInputRelaxed("0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451");
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "create_game";
    public readonly args: CreateGameSerializableArgs;

    constructor(
      arg_0: HexInput | AccountAddress,  // address
      arg_1: HexInput | AccountAddress,  // address
      arg_2: HexInput | AccountAddress,  // address
      arg_3: HexInput | AccountAddress,  // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(arg_0)),
        arg_1: new AccountAddress(addressFromAny(arg_1)),
        arg_2: new AccountAddress(addressFromAny(arg_2)),
        arg_3: new AccountAddress(addressFromAny(arg_3)),
      }
    }

    toPayload(): TransactionPayloadEntryFunction {
      const entryFunction = new EntryFunction(
        new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
        new Identifier(this.functionName),
        [],
        this.argsToArray()
      )
      return new TransactionPayloadEntryFunction(entryFunction)
    }

    argsToArray(): Array<EntryFunctionArgumentTypes> {
      return Object.keys(this.args).map(field => this.args[field as keyof typeof this.args]);
    }

    serialize(serializer: Serializer): void {
      const args = this.argsToArray();
      args.forEach(arg => {
        serializer.serialize(arg);
      });
    }
  }
  export type ResetGameSerializableArgs = {
    arg_0: AccountAddress;
  }

  export class ResetGame extends Serializable {
    public readonly moduleAddress = AccountAddress.fromHexInputRelaxed("0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451");
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "reset_game";
    public readonly args: ResetGameSerializableArgs;

    constructor(
      arg_0: HexInput | AccountAddress,  // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(arg_0)),
      }
    }

    toPayload(): TransactionPayloadEntryFunction {
      const entryFunction = new EntryFunction(
        new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
        new Identifier(this.functionName),
        [],
        this.argsToArray()
      )
      return new TransactionPayloadEntryFunction(entryFunction)
    }

    argsToArray(): Array<EntryFunctionArgumentTypes> {
      return Object.keys(this.args).map(field => this.args[field as keyof typeof this.args]);
    }

    serialize(serializer: Serializer): void {
      const args = this.argsToArray();
      args.forEach(arg => {
        serializer.serialize(arg);
      });
    }
  }
  export type VerifyActionSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveVector<U8>;
    arg_2: MoveVector<U8>;
  }

  export class VerifyAction extends Serializable {
    public readonly moduleAddress = AccountAddress.fromHexInputRelaxed("0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451");
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "verify_action";
    public readonly args: VerifyActionSerializableArgs;

    constructor(
      arg_0: HexInput | AccountAddress,  // address
      arg_1: Array<Uint8>,  // vector<u8>
      arg_2: Array<Uint8>,  // vector<u8>
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(arg_0)),
        arg_1: new MoveVector(arg_1.map(argA => new U8(argA))),
        arg_2: new MoveVector(arg_2.map(argA => new U8(argA))),
      }
    }

    toPayload(): TransactionPayloadEntryFunction {
      const entryFunction = new EntryFunction(
        new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
        new Identifier(this.functionName),
        [],
        this.argsToArray()
      )
      return new TransactionPayloadEntryFunction(entryFunction)
    }

    // only if the function signature is 1 signer
    async toTransactionBuilder(args: {
      sender: HexInput | AccountAddress;
      configOrNetwork: AptosConfig | Network;
    }): Promise<TransactionBuilder> {
      const { sender, configOrNetwork } = args;
      const transactionBuilder = await SingleSignerTransactionBuilder.create({
        sender: toAccountAddress(sender),
        payload: this.toPayload(),
        configOrNetwork: configOrNetwork,
      });
      return transactionBuilder;
    }

    static async submit(
      sender: Account | Signer,
      arg_0: HexInput | AccountAddress,  // address
      arg_1: Array<Uint8>,  // vector<u8>
      arg_2: Array<Uint8>,  // vector<u8>
      configOrNetwork: AptosConfig | Network,
    ): Promise<UserTransactionResponse> {
      const payload = new VerifyAction(arg_0, arg_1, arg_2);
      const transactionBuilder = await payload.toTransactionBuilder({ sender: sender.accountAddress, configOrNetwork });
      const response = await transactionBuilder.signSubmitAndWaitForResponse({ signer: sender });
      return response as UserTransactionResponse;
    }

    argsToArray(): Array<EntryFunctionArgumentTypes> {
      return Object.keys(this.args).map(field => this.args[field as keyof typeof this.args]);
    }

    serialize(serializer: Serializer): void {
      const args = this.argsToArray();
      args.forEach(arg => {
        serializer.serialize(arg);
      });
    }
  }
}





export namespace TournamentManager {
  export type InitializeTournamentSerializableArgs = {
    arg_0: MoveString;
    arg_1: U64;
    arg_2: U64;
    arg_3: U64;
  }

  export class InitializeTournament extends Serializable {
    public readonly moduleAddress = AccountAddress.fromHexInputRelaxed("0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451");
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "initialize_tournament";
    public readonly args: InitializeTournamentSerializableArgs;

    constructor(
      arg_0: string,  // 0x1::string::String
      arg_1: Uint64,  // u64
      arg_2: Uint64,  // u64
      arg_3: Uint64,  // u64
    ) {
      super();
      this.args = {
        arg_0: new MoveString(arg_0),
        arg_1: new U64(arg_1),
        arg_2: new U64(arg_2),
        arg_3: new U64(arg_3),
      }
    }

    toPayload(): TransactionPayloadEntryFunction {
      const entryFunction = new EntryFunction(
        new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
        new Identifier(this.functionName),
        [],
        this.argsToArray()
      )
      return new TransactionPayloadEntryFunction(entryFunction)
    }

    argsToArray(): Array<EntryFunctionArgumentTypes> {
      return Object.keys(this.args).map(field => this.args[field as keyof typeof this.args]);
    }

    serialize(serializer: Serializer): void {
      const args = this.argsToArray();
      args.forEach(arg => {
        serializer.serialize(arg);
      });
    }
  }
  export type JoinTournamentSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveString;
  }

  export class JoinTournament extends Serializable {
    public readonly moduleAddress = AccountAddress.fromHexInputRelaxed("0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451");
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "join_tournament";
    public readonly args: JoinTournamentSerializableArgs;

    constructor(
      arg_0: HexInput | AccountAddress,  // address
      arg_1: string,  // 0x1::string::String
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(arg_0)),
        arg_1: new MoveString(arg_1),
      }
    }

    toPayload(): TransactionPayloadEntryFunction {
      const entryFunction = new EntryFunction(
        new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
        new Identifier(this.functionName),
        [],
        this.argsToArray()
      )
      return new TransactionPayloadEntryFunction(entryFunction)
    }

    argsToArray(): Array<EntryFunctionArgumentTypes> {
      return Object.keys(this.args).map(field => this.args[field as keyof typeof this.args]);
    }

    serialize(serializer: Serializer): void {
      const args = this.argsToArray();
      args.forEach(arg => {
        serializer.serialize(arg);
      });
    }
  }
  export type StartNewRoundSerializableArgs = {
    arg_0: AccountAddress;
  }

  export class StartNewRound extends Serializable {
    public readonly moduleAddress = AccountAddress.fromHexInputRelaxed("0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451");
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "start_new_round";
    public readonly args: StartNewRoundSerializableArgs;

    constructor(
      arg_0: HexInput | AccountAddress,  // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(arg_0)),
      }
    }

    toPayload(): TransactionPayloadEntryFunction {
      const entryFunction = new EntryFunction(
        new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
        new Identifier(this.functionName),
        [],
        this.argsToArray()
      )
      return new TransactionPayloadEntryFunction(entryFunction)
    }

    argsToArray(): Array<EntryFunctionArgumentTypes> {
      return Object.keys(this.args).map(field => this.args[field as keyof typeof this.args]);
    }

    serialize(serializer: Serializer): void {
      const args = this.argsToArray();
      args.forEach(arg => {
        serializer.serialize(arg);
      });
    }
  }
}

