// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable max-classes-per-file */
import { MoveString, MoveVector, U64, U8 } from "..";
import { Bool, Serializable, Serializer } from "../bcs";
import { AccountAddress } from "../core";
import { AnyNumber, HexInput } from "../types";

const addressFromAny = (address: HexInput | AccountAddress): AccountAddress => {
  if (address instanceof AccountAddress) {
    return address;
  }
  return AccountAddress.fromHexInputRelaxed(address);
};

export namespace Account {
  export type OfferRotationCapabilitySerializableArgs = {
    arg_0: MoveVector<U8>;
    arg_1: U8;
    arg_2: MoveVector<U8>;
    arg_3: AccountAddress;
  };

  export class OfferRotationCapability extends Serializable {
    public readonly args: OfferRotationCapabilitySerializableArgs;

    constructor(args: {
      arg_0: Array<number>; // vector<u8>
      arg_1: number; // u8
      arg_2: Array<number>; // vector<u8>
      arg_3: HexInput | AccountAddress; // address
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new U8(argA))),
        arg_1: new U8(args.arg_1),
        arg_2: new MoveVector(args.arg_2.map((argA) => new U8(argA))),
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
  export type OfferSignerCapabilitySerializableArgs = {
    arg_0: MoveVector<U8>;
    arg_1: U8;
    arg_2: MoveVector<U8>;
    arg_3: AccountAddress;
  };

  export class OfferSignerCapability extends Serializable {
    public readonly args: OfferSignerCapabilitySerializableArgs;

    constructor(args: {
      arg_0: Array<number>; // vector<u8>
      arg_1: number; // u8
      arg_2: Array<number>; // vector<u8>
      arg_3: HexInput | AccountAddress; // address
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new U8(argA))),
        arg_1: new U8(args.arg_1),
        arg_2: new MoveVector(args.arg_2.map((argA) => new U8(argA))),
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

  export class RevokeAnyRotationCapability extends Serializable {
    // eslint-disable-next-line
    serialize(_serializer: Serializer): void {}
  }

  export class RevokeAnySignerCapability extends Serializable {
    // eslint-disable-next-line
    serialize(_serializer: Serializer): void {}
  }
  export type RevokeRotationCapabilitySerializableArgs = {
    arg_0: AccountAddress;
  };

  export class RevokeRotationCapability extends Serializable {
    public readonly args: RevokeRotationCapabilitySerializableArgs;

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
  export type RevokeSignerCapabilitySerializableArgs = {
    arg_0: AccountAddress;
  };

  export class RevokeSignerCapability extends Serializable {
    public readonly args: RevokeSignerCapabilitySerializableArgs;

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
  export type RotateAuthenticationKeySerializableArgs = {
    arg_0: U8;
    arg_1: MoveVector<U8>;
    arg_2: U8;
    arg_3: MoveVector<U8>;
    arg_4: MoveVector<U8>;
    arg_5: MoveVector<U8>;
  };

  export class RotateAuthenticationKey extends Serializable {
    public readonly args: RotateAuthenticationKeySerializableArgs;

    constructor(args: {
      arg_0: number; // u8
      arg_1: Array<number>; // vector<u8>
      arg_2: number; // u8
      arg_3: Array<number>; // vector<u8>
      arg_4: Array<number>; // vector<u8>
      arg_5: Array<number>; // vector<u8>
    }) {
      super();
      this.args = {
        arg_0: new U8(args.arg_0),
        arg_1: new MoveVector(args.arg_1.map((argA) => new U8(argA))),
        arg_2: new U8(args.arg_2),
        arg_3: new MoveVector(args.arg_3.map((argA) => new U8(argA))),
        arg_4: new MoveVector(args.arg_4.map((argA) => new U8(argA))),
        arg_5: new MoveVector(args.arg_5.map((argA) => new U8(argA))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type RotateAuthenticationKeyWithRotationCapabilitySerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U8;
    arg_2: MoveVector<U8>;
    arg_3: MoveVector<U8>;
  };

  export class RotateAuthenticationKeyWithRotationCapability extends Serializable {
    public readonly args: RotateAuthenticationKeyWithRotationCapabilitySerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: number; // u8
      arg_2: Array<number>; // vector<u8>
      arg_3: Array<number>; // vector<u8>
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U8(args.arg_1),
        arg_2: new MoveVector(args.arg_2.map((argA) => new U8(argA))),
        arg_3: new MoveVector(args.arg_3.map((argA) => new U8(argA))),
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

export namespace AptosAccount {
  export type BatchTransferSerializableArgs = {
    arg_0: MoveVector<AccountAddress>;
    arg_1: MoveVector<U64>;
  };

  export class BatchTransfer extends Serializable {
    public readonly args: BatchTransferSerializableArgs;

    constructor(args: {
      arg_0: Array<HexInput | AccountAddress>; // vector<address>
      arg_1: Array<AnyNumber>; // vector<u64>
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_1: new MoveVector(args.arg_1.map((argA) => new U64(argA))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type BatchTransferCoinsSerializableArgs = {
    arg_0: MoveVector<AccountAddress>;
    arg_1: MoveVector<U64>;
  };

  export class BatchTransferCoins extends Serializable {
    public readonly args: BatchTransferCoinsSerializableArgs;

    constructor(args: {
      arg_0: Array<HexInput | AccountAddress>; // vector<address>
      arg_1: Array<AnyNumber>; // vector<u64>
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_1: new MoveVector(args.arg_1.map((argA) => new U64(argA))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type CreateAccountSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class CreateAccount extends Serializable {
    public readonly args: CreateAccountSerializableArgs;

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
  export type SetAllowDirectCoinTransfersSerializableArgs = {
    arg_0: Bool;
  };

  export class SetAllowDirectCoinTransfers extends Serializable {
    public readonly args: SetAllowDirectCoinTransfersSerializableArgs;

    constructor(args: {
      arg_0: boolean; // bool
    }) {
      super();
      this.args = {
        arg_0: new Bool(args.arg_0),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type TransferSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class Transfer extends Serializable {
    public readonly args: TransferSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type TransferCoinsSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class TransferCoins extends Serializable {
    public readonly args: TransferCoinsSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
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

export namespace AptosCoin {
  export class ClaimMintCapability extends Serializable {
    // eslint-disable-next-line
    serialize(_serializer: Serializer): void {}
  }
  export type DelegateMintCapabilitySerializableArgs = {
    arg_0: AccountAddress;
  };

  export class DelegateMintCapability extends Serializable {
    public readonly args: DelegateMintCapabilitySerializableArgs;

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
  export type MintSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class Mint extends Serializable {
    public readonly args: MintSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
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

export namespace AptosGovernance {
  export type AddApprovedScriptHashScriptSerializableArgs = {
    arg_0: U64;
  };

  export class AddApprovedScriptHashScript extends Serializable {
    public readonly args: AddApprovedScriptHashScriptSerializableArgs;

    constructor(args: {
      arg_0: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new U64(args.arg_0),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type CreateProposalSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveVector<U8>;
    arg_2: MoveVector<U8>;
    arg_3: MoveVector<U8>;
  };

  export class CreateProposal extends Serializable {
    public readonly args: CreateProposalSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: Array<number>; // vector<u8>
      arg_2: Array<number>; // vector<u8>
      arg_3: Array<number>; // vector<u8>
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new MoveVector(args.arg_1.map((argA) => new U8(argA))),
        arg_2: new MoveVector(args.arg_2.map((argA) => new U8(argA))),
        arg_3: new MoveVector(args.arg_3.map((argA) => new U8(argA))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type CreateProposalV2SerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveVector<U8>;
    arg_2: MoveVector<U8>;
    arg_3: MoveVector<U8>;
    arg_4: Bool;
  };

  export class CreateProposalV2 extends Serializable {
    public readonly args: CreateProposalV2SerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: Array<number>; // vector<u8>
      arg_2: Array<number>; // vector<u8>
      arg_3: Array<number>; // vector<u8>
      arg_4: boolean; // bool
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new MoveVector(args.arg_1.map((argA) => new U8(argA))),
        arg_2: new MoveVector(args.arg_2.map((argA) => new U8(argA))),
        arg_3: new MoveVector(args.arg_3.map((argA) => new U8(argA))),
        arg_4: new Bool(args.arg_4),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type PartialVoteSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
    arg_2: U64;
    arg_3: Bool;
  };

  export class PartialVote extends Serializable {
    public readonly args: PartialVoteSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
      arg_2: AnyNumber; // u64
      arg_3: boolean; // bool
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
        arg_2: new U64(args.arg_2),
        arg_3: new Bool(args.arg_3),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type VoteSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
    arg_2: Bool;
  };

  export class Vote extends Serializable {
    public readonly args: VoteSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
      arg_2: boolean; // bool
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
        arg_2: new Bool(args.arg_2),
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

export namespace Code {
  export type PublishPackageTxnSerializableArgs = {
    arg_0: MoveVector<U8>;
    arg_1: MoveVector<MoveVector<U8>>;
  };

  export class PublishPackageTxn extends Serializable {
    public readonly args: PublishPackageTxnSerializableArgs;

    constructor(args: {
      arg_0: Array<number>; // vector<u8>
      arg_1: Array<Array<number>>; // vector<vector<u8>>
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new U8(argA))),
        arg_1: new MoveVector(args.arg_1.map((argA) => new MoveVector(argA.map((argB) => new U8(argB))))),
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

export namespace Coin {
  export type TransferSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class Transfer extends Serializable {
    public readonly args: TransferSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }

  export class UpgradeSupply extends Serializable {
    // eslint-disable-next-line
    serialize(_serializer: Serializer): void {}
  }
}

export namespace DelegationPool {
  export type AddStakeSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class AddStake extends Serializable {
    public readonly args: AddStakeSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type CreateProposalSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveVector<U8>;
    arg_2: MoveVector<U8>;
    arg_3: MoveVector<U8>;
    arg_4: Bool;
  };

  export class CreateProposal extends Serializable {
    public readonly args: CreateProposalSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: Array<number>; // vector<u8>
      arg_2: Array<number>; // vector<u8>
      arg_3: Array<number>; // vector<u8>
      arg_4: boolean; // bool
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new MoveVector(args.arg_1.map((argA) => new U8(argA))),
        arg_2: new MoveVector(args.arg_2.map((argA) => new U8(argA))),
        arg_3: new MoveVector(args.arg_3.map((argA) => new U8(argA))),
        arg_4: new Bool(args.arg_4),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type DelegateVotingPowerSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
  };

  export class DelegateVotingPower extends Serializable {
    public readonly args: DelegateVotingPowerSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: HexInput | AccountAddress; // address
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new AccountAddress(addressFromAny(args.arg_1)),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type EnablePartialGovernanceVotingSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class EnablePartialGovernanceVoting extends Serializable {
    public readonly args: EnablePartialGovernanceVotingSerializableArgs;

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
  export type InitializeDelegationPoolSerializableArgs = {
    arg_0: U64;
    arg_1: MoveVector<U8>;
  };

  export class InitializeDelegationPool extends Serializable {
    public readonly args: InitializeDelegationPoolSerializableArgs;

    constructor(args: {
      arg_0: AnyNumber; // u64
      arg_1: Array<number>; // vector<u8>
    }) {
      super();
      this.args = {
        arg_0: new U64(args.arg_0),
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
  export type ReactivateStakeSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class ReactivateStake extends Serializable {
    public readonly args: ReactivateStakeSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type SetDelegatedVoterSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class SetDelegatedVoter extends Serializable {
    public readonly args: SetDelegatedVoterSerializableArgs;

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
  export type SetOperatorSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class SetOperator extends Serializable {
    public readonly args: SetOperatorSerializableArgs;

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
  export type SynchronizeDelegationPoolSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class SynchronizeDelegationPool extends Serializable {
    public readonly args: SynchronizeDelegationPoolSerializableArgs;

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
  export type UnlockSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class Unlock extends Serializable {
    public readonly args: UnlockSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type VoteSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
    arg_2: U64;
    arg_3: Bool;
  };

  export class Vote extends Serializable {
    public readonly args: VoteSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
      arg_2: AnyNumber; // u64
      arg_3: boolean; // bool
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
        arg_2: new U64(args.arg_2),
        arg_3: new Bool(args.arg_3),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type WithdrawSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class Withdraw extends Serializable {
    public readonly args: WithdrawSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
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

export namespace FungibleAsset {}

export namespace ManagedCoin {
  export type BurnSerializableArgs = {
    arg_0: U64;
  };

  export class Burn extends Serializable {
    public readonly args: BurnSerializableArgs;

    constructor(args: {
      arg_0: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new U64(args.arg_0),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type InitializeSerializableArgs = {
    arg_0: MoveVector<U8>;
    arg_1: MoveVector<U8>;
    arg_2: U8;
    arg_3: Bool;
  };

  export class Initialize extends Serializable {
    public readonly args: InitializeSerializableArgs;

    constructor(args: {
      arg_0: Array<number>; // vector<u8>
      arg_1: Array<number>; // vector<u8>
      arg_2: number; // u8
      arg_3: boolean; // bool
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new U8(argA))),
        arg_1: new MoveVector(args.arg_1.map((argA) => new U8(argA))),
        arg_2: new U8(args.arg_2),
        arg_3: new Bool(args.arg_3),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type MintSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class Mint extends Serializable {
    public readonly args: MintSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }

  export class Register extends Serializable {
    // eslint-disable-next-line
    serialize(_serializer: Serializer): void {}
  }
}

export namespace MultisigAccount {
  export type AddOwnerSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class AddOwner extends Serializable {
    public readonly args: AddOwnerSerializableArgs;

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
  export type AddOwnersSerializableArgs = {
    arg_0: MoveVector<AccountAddress>;
  };

  export class AddOwners extends Serializable {
    public readonly args: AddOwnersSerializableArgs;

    constructor(args: {
      arg_0: Array<HexInput | AccountAddress>; // vector<address>
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new AccountAddress(addressFromAny(argA)))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type AddOwnersAndUpdateSignaturesRequiredSerializableArgs = {
    arg_0: MoveVector<AccountAddress>;
    arg_1: U64;
  };

  export class AddOwnersAndUpdateSignaturesRequired extends Serializable {
    public readonly args: AddOwnersAndUpdateSignaturesRequiredSerializableArgs;

    constructor(args: {
      arg_0: Array<HexInput | AccountAddress>; // vector<address>
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_1: new U64(args.arg_1),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type ApproveTransactionSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class ApproveTransaction extends Serializable {
    public readonly args: ApproveTransactionSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type CreateSerializableArgs = {
    arg_0: U64;
    arg_1: MoveVector<MoveString>;
    arg_2: MoveVector<MoveVector<U8>>;
  };

  export class Create extends Serializable {
    public readonly args: CreateSerializableArgs;

    constructor(args: {
      arg_0: AnyNumber; // u64
      arg_1: Array<string>; // vector<0x1::string::String>
      arg_2: Array<Array<number>>; // vector<vector<u8>>
    }) {
      super();
      this.args = {
        arg_0: new U64(args.arg_0),
        arg_1: new MoveVector(args.arg_1.map((argA) => new MoveString(argA))),
        arg_2: new MoveVector(args.arg_2.map((argA) => new MoveVector(argA.map((argB) => new U8(argB))))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type CreateTransactionSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveVector<U8>;
  };

  export class CreateTransaction extends Serializable {
    public readonly args: CreateTransactionSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: Array<number>; // vector<u8>
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
  export type CreateTransactionWithHashSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveVector<U8>;
  };

  export class CreateTransactionWithHash extends Serializable {
    public readonly args: CreateTransactionWithHashSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: Array<number>; // vector<u8>
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
  export type CreateWithExistingAccountSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveVector<AccountAddress>;
    arg_2: U64;
    arg_3: U8;
    arg_4: MoveVector<U8>;
    arg_5: MoveVector<U8>;
    arg_6: MoveVector<MoveString>;
    arg_7: MoveVector<MoveVector<U8>>;
  };

  export class CreateWithExistingAccount extends Serializable {
    public readonly args: CreateWithExistingAccountSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: Array<HexInput | AccountAddress>; // vector<address>
      arg_2: AnyNumber; // u64
      arg_3: number; // u8
      arg_4: Array<number>; // vector<u8>
      arg_5: Array<number>; // vector<u8>
      arg_6: Array<string>; // vector<0x1::string::String>
      arg_7: Array<Array<number>>; // vector<vector<u8>>
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new MoveVector(args.arg_1.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_2: new U64(args.arg_2),
        arg_3: new U8(args.arg_3),
        arg_4: new MoveVector(args.arg_4.map((argA) => new U8(argA))),
        arg_5: new MoveVector(args.arg_5.map((argA) => new U8(argA))),
        arg_6: new MoveVector(args.arg_6.map((argA) => new MoveString(argA))),
        arg_7: new MoveVector(args.arg_7.map((argA) => new MoveVector(argA.map((argB) => new U8(argB))))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type CreateWithExistingAccountAndRevokeAuthKeySerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveVector<AccountAddress>;
    arg_2: U64;
    arg_3: U8;
    arg_4: MoveVector<U8>;
    arg_5: MoveVector<U8>;
    arg_6: MoveVector<MoveString>;
    arg_7: MoveVector<MoveVector<U8>>;
  };

  export class CreateWithExistingAccountAndRevokeAuthKey extends Serializable {
    public readonly args: CreateWithExistingAccountAndRevokeAuthKeySerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: Array<HexInput | AccountAddress>; // vector<address>
      arg_2: AnyNumber; // u64
      arg_3: number; // u8
      arg_4: Array<number>; // vector<u8>
      arg_5: Array<number>; // vector<u8>
      arg_6: Array<string>; // vector<0x1::string::String>
      arg_7: Array<Array<number>>; // vector<vector<u8>>
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new MoveVector(args.arg_1.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_2: new U64(args.arg_2),
        arg_3: new U8(args.arg_3),
        arg_4: new MoveVector(args.arg_4.map((argA) => new U8(argA))),
        arg_5: new MoveVector(args.arg_5.map((argA) => new U8(argA))),
        arg_6: new MoveVector(args.arg_6.map((argA) => new MoveString(argA))),
        arg_7: new MoveVector(args.arg_7.map((argA) => new MoveVector(argA.map((argB) => new U8(argB))))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type CreateWithOwnersSerializableArgs = {
    arg_0: MoveVector<AccountAddress>;
    arg_1: U64;
    arg_2: MoveVector<MoveString>;
    arg_3: MoveVector<MoveVector<U8>>;
  };

  export class CreateWithOwners extends Serializable {
    public readonly args: CreateWithOwnersSerializableArgs;

    constructor(args: {
      arg_0: Array<HexInput | AccountAddress>; // vector<address>
      arg_1: AnyNumber; // u64
      arg_2: Array<string>; // vector<0x1::string::String>
      arg_3: Array<Array<number>>; // vector<vector<u8>>
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_1: new U64(args.arg_1),
        arg_2: new MoveVector(args.arg_2.map((argA) => new MoveString(argA))),
        arg_3: new MoveVector(args.arg_3.map((argA) => new MoveVector(argA.map((argB) => new U8(argB))))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type CreateWithOwnersThenRemoveBootstrapperSerializableArgs = {
    arg_0: MoveVector<AccountAddress>;
    arg_1: U64;
    arg_2: MoveVector<MoveString>;
    arg_3: MoveVector<MoveVector<U8>>;
  };

  export class CreateWithOwnersThenRemoveBootstrapper extends Serializable {
    public readonly args: CreateWithOwnersThenRemoveBootstrapperSerializableArgs;

    constructor(args: {
      arg_0: Array<HexInput | AccountAddress>; // vector<address>
      arg_1: AnyNumber; // u64
      arg_2: Array<string>; // vector<0x1::string::String>
      arg_3: Array<Array<number>>; // vector<vector<u8>>
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_1: new U64(args.arg_1),
        arg_2: new MoveVector(args.arg_2.map((argA) => new MoveString(argA))),
        arg_3: new MoveVector(args.arg_3.map((argA) => new MoveVector(argA.map((argB) => new U8(argB))))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type ExecuteRejectedTransactionSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class ExecuteRejectedTransaction extends Serializable {
    public readonly args: ExecuteRejectedTransactionSerializableArgs;

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
  export type RejectTransactionSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class RejectTransaction extends Serializable {
    public readonly args: RejectTransactionSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type RemoveOwnerSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class RemoveOwner extends Serializable {
    public readonly args: RemoveOwnerSerializableArgs;

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
  export type RemoveOwnersSerializableArgs = {
    arg_0: MoveVector<AccountAddress>;
  };

  export class RemoveOwners extends Serializable {
    public readonly args: RemoveOwnersSerializableArgs;

    constructor(args: {
      arg_0: Array<HexInput | AccountAddress>; // vector<address>
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new AccountAddress(addressFromAny(argA)))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type SwapOwnerSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
  };

  export class SwapOwner extends Serializable {
    public readonly args: SwapOwnerSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: HexInput | AccountAddress; // address
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new AccountAddress(addressFromAny(args.arg_1)),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type SwapOwnersSerializableArgs = {
    arg_0: MoveVector<AccountAddress>;
    arg_1: MoveVector<AccountAddress>;
  };

  export class SwapOwners extends Serializable {
    public readonly args: SwapOwnersSerializableArgs;

    constructor(args: {
      arg_0: Array<HexInput | AccountAddress>; // vector<address>
      arg_1: Array<HexInput | AccountAddress>; // vector<address>
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_1: new MoveVector(args.arg_1.map((argA) => new AccountAddress(addressFromAny(argA)))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type SwapOwnersAndUpdateSignaturesRequiredSerializableArgs = {
    arg_0: MoveVector<AccountAddress>;
    arg_1: MoveVector<AccountAddress>;
    arg_2: U64;
  };

  export class SwapOwnersAndUpdateSignaturesRequired extends Serializable {
    public readonly args: SwapOwnersAndUpdateSignaturesRequiredSerializableArgs;

    constructor(args: {
      arg_0: Array<HexInput | AccountAddress>; // vector<address>
      arg_1: Array<HexInput | AccountAddress>; // vector<address>
      arg_2: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_1: new MoveVector(args.arg_1.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_2: new U64(args.arg_2),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type UpdateMetadataSerializableArgs = {
    arg_0: MoveVector<MoveString>;
    arg_1: MoveVector<MoveVector<U8>>;
  };

  export class UpdateMetadata extends Serializable {
    public readonly args: UpdateMetadataSerializableArgs;

    constructor(args: {
      arg_0: Array<string>; // vector<0x1::string::String>
      arg_1: Array<Array<number>>; // vector<vector<u8>>
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new MoveString(argA))),
        arg_1: new MoveVector(args.arg_1.map((argA) => new MoveVector(argA.map((argB) => new U8(argB))))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type UpdateSignaturesRequiredSerializableArgs = {
    arg_0: U64;
  };

  export class UpdateSignaturesRequired extends Serializable {
    public readonly args: UpdateSignaturesRequiredSerializableArgs;

    constructor(args: {
      arg_0: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new U64(args.arg_0),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type VoteTransanctionSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
    arg_2: Bool;
  };

  export class VoteTransanction extends Serializable {
    public readonly args: VoteTransanctionSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
      arg_2: boolean; // bool
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
        arg_2: new Bool(args.arg_2),
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

export namespace Object_ {
  export type TransferCallSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
  };

  export class TransferCall extends Serializable {
    public readonly args: TransferCallSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: HexInput | AccountAddress; // address
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new AccountAddress(addressFromAny(args.arg_1)),
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

export namespace PrimaryFungibleStore {}

export namespace ResourceAccount {
  export type CreateResourceAccountSerializableArgs = {
    arg_0: MoveVector<U8>;
    arg_1: MoveVector<U8>;
  };

  export class CreateResourceAccount extends Serializable {
    public readonly args: CreateResourceAccountSerializableArgs;

    constructor(args: {
      arg_0: Array<number>; // vector<u8>
      arg_1: Array<number>; // vector<u8>
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new U8(argA))),
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
  export type CreateResourceAccountAndFundSerializableArgs = {
    arg_0: MoveVector<U8>;
    arg_1: MoveVector<U8>;
    arg_2: U64;
  };

  export class CreateResourceAccountAndFund extends Serializable {
    public readonly args: CreateResourceAccountAndFundSerializableArgs;

    constructor(args: {
      arg_0: Array<number>; // vector<u8>
      arg_1: Array<number>; // vector<u8>
      arg_2: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new U8(argA))),
        arg_1: new MoveVector(args.arg_1.map((argA) => new U8(argA))),
        arg_2: new U64(args.arg_2),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type CreateResourceAccountAndPublishPackageSerializableArgs = {
    arg_0: MoveVector<U8>;
    arg_1: MoveVector<U8>;
    arg_2: MoveVector<MoveVector<U8>>;
  };

  export class CreateResourceAccountAndPublishPackage extends Serializable {
    public readonly args: CreateResourceAccountAndPublishPackageSerializableArgs;

    constructor(args: {
      arg_0: Array<number>; // vector<u8>
      arg_1: Array<number>; // vector<u8>
      arg_2: Array<Array<number>>; // vector<vector<u8>>
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new U8(argA))),
        arg_1: new MoveVector(args.arg_1.map((argA) => new U8(argA))),
        arg_2: new MoveVector(args.arg_2.map((argA) => new MoveVector(argA.map((argB) => new U8(argB))))),
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

export namespace Stake {
  export type AddStakeSerializableArgs = {
    arg_0: U64;
  };

  export class AddStake extends Serializable {
    public readonly args: AddStakeSerializableArgs;

    constructor(args: {
      arg_0: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new U64(args.arg_0),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }

  export class IncreaseLockup extends Serializable {
    // eslint-disable-next-line
    serialize(_serializer: Serializer): void {}
  }
  export type InitializeStakeOwnerSerializableArgs = {
    arg_0: U64;
    arg_1: AccountAddress;
    arg_2: AccountAddress;
  };

  export class InitializeStakeOwner extends Serializable {
    public readonly args: InitializeStakeOwnerSerializableArgs;

    constructor(args: {
      arg_0: AnyNumber; // u64
      arg_1: HexInput | AccountAddress; // address
      arg_2: HexInput | AccountAddress; // address
    }) {
      super();
      this.args = {
        arg_0: new U64(args.arg_0),
        arg_1: new AccountAddress(addressFromAny(args.arg_1)),
        arg_2: new AccountAddress(addressFromAny(args.arg_2)),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type InitializeValidatorSerializableArgs = {
    arg_0: MoveVector<U8>;
    arg_1: MoveVector<U8>;
    arg_2: MoveVector<U8>;
    arg_3: MoveVector<U8>;
  };

  export class InitializeValidator extends Serializable {
    public readonly args: InitializeValidatorSerializableArgs;

    constructor(args: {
      arg_0: Array<number>; // vector<u8>
      arg_1: Array<number>; // vector<u8>
      arg_2: Array<number>; // vector<u8>
      arg_3: Array<number>; // vector<u8>
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new U8(argA))),
        arg_1: new MoveVector(args.arg_1.map((argA) => new U8(argA))),
        arg_2: new MoveVector(args.arg_2.map((argA) => new U8(argA))),
        arg_3: new MoveVector(args.arg_3.map((argA) => new U8(argA))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type JoinValidatorSetSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class JoinValidatorSet extends Serializable {
    public readonly args: JoinValidatorSetSerializableArgs;

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
  export type LeaveValidatorSetSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class LeaveValidatorSet extends Serializable {
    public readonly args: LeaveValidatorSetSerializableArgs;

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
  export type ReactivateStakeSerializableArgs = {
    arg_0: U64;
  };

  export class ReactivateStake extends Serializable {
    public readonly args: ReactivateStakeSerializableArgs;

    constructor(args: {
      arg_0: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new U64(args.arg_0),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type RotateConsensusKeySerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveVector<U8>;
    arg_2: MoveVector<U8>;
  };

  export class RotateConsensusKey extends Serializable {
    public readonly args: RotateConsensusKeySerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: Array<number>; // vector<u8>
      arg_2: Array<number>; // vector<u8>
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
  export type SetDelegatedVoterSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class SetDelegatedVoter extends Serializable {
    public readonly args: SetDelegatedVoterSerializableArgs;

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
  export type SetOperatorSerializableArgs = {
    arg_0: AccountAddress;
  };

  export class SetOperator extends Serializable {
    public readonly args: SetOperatorSerializableArgs;

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
  export type UnlockSerializableArgs = {
    arg_0: U64;
  };

  export class Unlock extends Serializable {
    public readonly args: UnlockSerializableArgs;

    constructor(args: {
      arg_0: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new U64(args.arg_0),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type UpdateNetworkAndFullnodeAddressesSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: MoveVector<U8>;
    arg_2: MoveVector<U8>;
  };

  export class UpdateNetworkAndFullnodeAddresses extends Serializable {
    public readonly args: UpdateNetworkAndFullnodeAddressesSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: Array<number>; // vector<u8>
      arg_2: Array<number>; // vector<u8>
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
  export type WithdrawSerializableArgs = {
    arg_0: U64;
  };

  export class Withdraw extends Serializable {
    public readonly args: WithdrawSerializableArgs;

    constructor(args: {
      arg_0: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new U64(args.arg_0),
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

export namespace StakingContract {
  export type AddStakeSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class AddStake extends Serializable {
    public readonly args: AddStakeSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type CreateStakingContractSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
    arg_2: U64;
    arg_3: U64;
    arg_4: MoveVector<U8>;
  };

  export class CreateStakingContract extends Serializable {
    public readonly args: CreateStakingContractSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: HexInput | AccountAddress; // address
      arg_2: AnyNumber; // u64
      arg_3: AnyNumber; // u64
      arg_4: Array<number>; // vector<u8>
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new AccountAddress(addressFromAny(args.arg_1)),
        arg_2: new U64(args.arg_2),
        arg_3: new U64(args.arg_3),
        arg_4: new MoveVector(args.arg_4.map((argA) => new U8(argA))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type DistributeSerializableArgs1 = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
  };

  export class Distribute1 extends Serializable {
    public readonly args: DistributeSerializableArgs1;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: HexInput | AccountAddress; // address
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new AccountAddress(addressFromAny(args.arg_1)),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type RequestCommissionSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
  };

  export class RequestCommission extends Serializable {
    public readonly args: RequestCommissionSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: HexInput | AccountAddress; // address
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new AccountAddress(addressFromAny(args.arg_1)),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type ResetLockupSerializableArgs$1 = {
    arg_0: AccountAddress;
  };

  export class ResetLockup$1 extends Serializable {
    public readonly args: ResetLockupSerializableArgs$1;

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
  export type SwitchOperatorSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
    arg_2: U64;
  };

  export class SwitchOperator extends Serializable {
    public readonly args: SwitchOperatorSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: HexInput | AccountAddress; // address
      arg_2: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new AccountAddress(addressFromAny(args.arg_1)),
        arg_2: new U64(args.arg_2),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type SwitchOperatorWithSameCommissionSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
  };

  export class SwitchOperatorWithSameCommission extends Serializable {
    public readonly args: SwitchOperatorWithSameCommissionSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: HexInput | AccountAddress; // address
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new AccountAddress(addressFromAny(args.arg_1)),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type UnlockRewardsSerializableArgs$1 = {
    arg_0: AccountAddress;
  };

  export class UnlockRewards$1 extends Serializable {
    public readonly args: UnlockRewardsSerializableArgs$1;

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
  export type UnlockStakeSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class UnlockStake extends Serializable {
    public readonly args: UnlockStakeSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type UpdateCommisionSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class UpdateCommision extends Serializable {
    public readonly args: UpdateCommisionSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: AnyNumber; // u64
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new U64(args.arg_1),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type UpdateVoterSerializableArgs$1 = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
  };

  export class UpdateVoter$1 extends Serializable {
    public readonly args: UpdateVoterSerializableArgs$1;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: HexInput | AccountAddress; // address
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new AccountAddress(addressFromAny(args.arg_1)),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }

  export namespace StakingProxy {
    export type SetOperatorSerializableArgs = {
      arg_0: AccountAddress;
      arg_1: AccountAddress;
    };

    export class SetOperator extends Serializable {
      public readonly args: SetOperatorSerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: HexInput | AccountAddress; // address
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new AccountAddress(addressFromAny(args.arg_1)),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type SetStakePoolOperatorSerializableArgs = {
      arg_0: AccountAddress;
    };

    export class SetStakePoolOperator extends Serializable {
      public readonly args: SetStakePoolOperatorSerializableArgs;

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
    export type SetStakePoolVoterSerializableArgs = {
      arg_0: AccountAddress;
    };

    export class SetStakePoolVoter extends Serializable {
      public readonly args: SetStakePoolVoterSerializableArgs;

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
    export type SetStakingContractOperatorSerializableArgs = {
      arg_0: AccountAddress;
      arg_1: AccountAddress;
    };

    export class SetStakingContractOperator extends Serializable {
      public readonly args: SetStakingContractOperatorSerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: HexInput | AccountAddress; // address
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new AccountAddress(addressFromAny(args.arg_1)),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type SetStakingContractVoterSerializableArgs = {
      arg_0: AccountAddress;
      arg_1: AccountAddress;
    };

    export class SetStakingContractVoter extends Serializable {
      public readonly args: SetStakingContractVoterSerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: HexInput | AccountAddress; // address
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new AccountAddress(addressFromAny(args.arg_1)),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type SetVestingContractOperatorSerializableArgs = {
      arg_0: AccountAddress;
      arg_1: AccountAddress;
    };

    export class SetVestingContractOperator extends Serializable {
      public readonly args: SetVestingContractOperatorSerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: HexInput | AccountAddress; // address
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new AccountAddress(addressFromAny(args.arg_1)),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type SetVestingContractVoterSerializableArgs = {
      arg_0: AccountAddress;
      arg_1: AccountAddress;
    };

    export class SetVestingContractVoter extends Serializable {
      public readonly args: SetVestingContractVoterSerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: HexInput | AccountAddress; // address
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new AccountAddress(addressFromAny(args.arg_1)),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type SetVoterSerializableArgs = {
      arg_0: AccountAddress;
      arg_1: AccountAddress;
    };

    export class SetVoter extends Serializable {
      public readonly args: SetVoterSerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: HexInput | AccountAddress; // address
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new AccountAddress(addressFromAny(args.arg_1)),
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

  export namespace Version {
    export type SetVersionSerializableArgs = {
      arg_0: U64;
    };

    export class SetVersion extends Serializable {
      public readonly args: SetVersionSerializableArgs;

      constructor(args: {
        arg_0: AnyNumber; // u64
      }) {
        super();
        this.args = {
          arg_0: new U64(args.arg_0),
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

  export namespace Vesting {
    export type AdminWithdrawSerializableArgs = {
      arg_0: AccountAddress;
    };

    export class AdminWithdraw extends Serializable {
      public readonly args: AdminWithdrawSerializableArgs;

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
    export type DistributeSerializableArgs = {
      arg_0: AccountAddress;
    };

    export class Distribute extends Serializable {
      public readonly args: DistributeSerializableArgs;

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
    export type DistributeManySerializableArgs = {
      arg_0: MoveVector<AccountAddress>;
    };

    export class DistributeMany extends Serializable {
      public readonly args: DistributeManySerializableArgs;

      constructor(args: {
        arg_0: Array<HexInput | AccountAddress>; // vector<address>
      }) {
        super();
        this.args = {
          arg_0: new MoveVector(args.arg_0.map((argA) => new AccountAddress(addressFromAny(argA)))),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type ResetBeneficiarySerializableArgs = {
      arg_0: AccountAddress;
      arg_1: AccountAddress;
    };

    export class ResetBeneficiary extends Serializable {
      public readonly args: ResetBeneficiarySerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: HexInput | AccountAddress; // address
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new AccountAddress(addressFromAny(args.arg_1)),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type ResetLockupSerializableArgs = {
      arg_0: AccountAddress;
    };

    export class ResetLockup extends Serializable {
      public readonly args: ResetLockupSerializableArgs;

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
    export type SetBeneficiarySerializableArgs = {
      arg_0: AccountAddress;
      arg_1: AccountAddress;
      arg_2: AccountAddress;
    };

    export class SetBeneficiary extends Serializable {
      public readonly args: SetBeneficiarySerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: HexInput | AccountAddress; // address
        arg_2: HexInput | AccountAddress; // address
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new AccountAddress(addressFromAny(args.arg_1)),
          arg_2: new AccountAddress(addressFromAny(args.arg_2)),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type SetBeneficiaryResetterSerializableArgs = {
      arg_0: AccountAddress;
      arg_1: AccountAddress;
    };

    export class SetBeneficiaryResetter extends Serializable {
      public readonly args: SetBeneficiaryResetterSerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: HexInput | AccountAddress; // address
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new AccountAddress(addressFromAny(args.arg_1)),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type SetManagementRoleSerializableArgs = {
      arg_0: AccountAddress;
      arg_1: MoveString;
      arg_2: AccountAddress;
    };

    export class SetManagementRole extends Serializable {
      public readonly args: SetManagementRoleSerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: string; // 0x1::string::String
        arg_2: HexInput | AccountAddress; // address
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new MoveString(args.arg_1),
          arg_2: new AccountAddress(addressFromAny(args.arg_2)),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type TerminateVestingContractSerializableArgs = {
      arg_0: AccountAddress;
    };

    export class TerminateVestingContract extends Serializable {
      public readonly args: TerminateVestingContractSerializableArgs;

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
    export type UnlockRewardsSerializableArgs = {
      arg_0: AccountAddress;
    };

    export class UnlockRewards extends Serializable {
      public readonly args: UnlockRewardsSerializableArgs;

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
    export type UnlockRewardsManySerializableArgs = {
      arg_0: MoveVector<AccountAddress>;
    };

    export class UnlockRewardsMany extends Serializable {
      public readonly args: UnlockRewardsManySerializableArgs;

      constructor(args: {
        arg_0: Array<HexInput | AccountAddress>; // vector<address>
      }) {
        super();
        this.args = {
          arg_0: new MoveVector(args.arg_0.map((argA) => new AccountAddress(addressFromAny(argA)))),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type UpdateCommissionPercentageSerializableArgs = {
      arg_0: AccountAddress;
      arg_1: U64;
    };

    export class UpdateCommissionPercentage extends Serializable {
      public readonly args: UpdateCommissionPercentageSerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: AnyNumber; // u64
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new U64(args.arg_1),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type UpdateOperatorSerializableArgs = {
      arg_0: AccountAddress;
      arg_1: AccountAddress;
      arg_2: U64;
    };

    export class UpdateOperator extends Serializable {
      public readonly args: UpdateOperatorSerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: HexInput | AccountAddress; // address
        arg_2: AnyNumber; // u64
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new AccountAddress(addressFromAny(args.arg_1)),
          arg_2: new U64(args.arg_2),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type UpdateOperatorWithSameCommissionSerializableArgs = {
      arg_0: AccountAddress;
      arg_1: AccountAddress;
    };

    export class UpdateOperatorWithSameCommission extends Serializable {
      public readonly args: UpdateOperatorWithSameCommissionSerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: HexInput | AccountAddress; // address
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new AccountAddress(addressFromAny(args.arg_1)),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type UpdateVoterSerializableArgs = {
      arg_0: AccountAddress;
      arg_1: AccountAddress;
    };

    export class UpdateVoter extends Serializable {
      public readonly args: UpdateVoterSerializableArgs;

      constructor(args: {
        arg_0: HexInput | AccountAddress; // address
        arg_1: HexInput | AccountAddress; // address
      }) {
        super();
        this.args = {
          arg_0: new AccountAddress(addressFromAny(args.arg_0)),
          arg_1: new AccountAddress(addressFromAny(args.arg_1)),
        };
      }

      serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
          const value = this.args[field as keyof typeof this.args];
          serializer.serialize(value);
        });
      }
    }
    export type VestSerializableArgs = {
      arg_0: AccountAddress;
    };

    export class Vest extends Serializable {
      public readonly args: VestSerializableArgs;

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
    export type VestManySerializableArgs = {
      arg_0: MoveVector<AccountAddress>;
    };

    export class VestMany extends Serializable {
      public readonly args: VestManySerializableArgs;

      constructor(args: {
        arg_0: Array<HexInput | AccountAddress>; // vector<address>
      }) {
        super();
        this.args = {
          arg_0: new MoveVector(args.arg_0.map((argA) => new AccountAddress(addressFromAny(argA)))),
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
}
