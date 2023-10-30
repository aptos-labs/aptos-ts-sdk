import { MoveString, MoveVector, U64, U8 } from "..";
import { Serializable, Serializer } from "../bcs";
import { AccountAddress } from "../core";
import { HexInput } from "../types";

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
  };

  export class CommitAction extends Serializable {
    public readonly args: CommitActionSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: Array<Uint8>; // vector<u8>
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new MoveVector(args.arg_1.map((argA) => new U8(argA))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type CreateGameSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
    arg_2: AccountAddress;
    arg_3: AccountAddress;
  };

  export class CreateGame extends Serializable {
    public readonly args: CreateGameSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: HexInput | AccountAddress; // address
      arg_2: HexInput | AccountAddress; // address
      arg_3: HexInput | AccountAddress; // address
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new AccountAddress(addressFromAny(args.arg_1)),
        arg_2: new AccountAddress(addressFromAny(args.arg_2)),
        arg_3: new AccountAddress(addressFromAny(args.arg_3)),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type ResetGameSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class ResetGame extends Serializable {
    public readonly args: ResetGameSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type VerifyActionSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveVector<U8>;
    arg_2: MoveVector<U8>;
  };

  export class VerifyAction extends Serializable {
    public readonly args: VerifyActionSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: Array<Uint8>; // vector<u8>
      arg_2: Array<Uint8>; // vector<u8>
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new MoveVector(args.arg_1.map((argA) => new U8(argA))),
        arg_2: new MoveVector(args.arg_2.map((argA) => new U8(argA))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
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
  };

  export class InitializeTournament extends Serializable {
    public readonly args: InitializeTournamentSerializableArgs;

    constructor(args: {
      arg_0: string; // 0x1::string::String
      arg_1: Uint64; // u64
      arg_2: Uint64; // u64
      arg_3: Uint64; // u64
    }) {
      super();
      this.args = {
        arg_0: new MoveString(args.arg_0),
        arg_1: new U64(args.arg_1),
        arg_2: new U64(args.arg_2),
        arg_3: new U64(args.arg_3),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type JoinTournamentSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveString;
  };

  export class JoinTournament extends Serializable {
    public readonly args: JoinTournamentSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: string; // 0x1::string::String
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new MoveString(args.arg_1),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type StartNewRoundSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class StartNewRound extends Serializable {
    public readonly args: StartNewRoundSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
}
