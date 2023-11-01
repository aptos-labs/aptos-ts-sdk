// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Serializer, Serializable } from "../../bcs/serializer";
import { AccountAddress } from "../../core/accountAddress";
import { AnyNumber } from "../../types";
import { PublicKey } from "../../core/crypto/asymmetricCrypto";
import { MoveString, MoveVector, U64, U8 } from "../../bcs";

/**
 * Representation of the challenge which is needed to sign by owner of the account
 * to rotate the authentication key.
 */
export class RotationProofChallenge extends Serializable {
  public readonly accountAddress: AccountAddress = AccountAddress.ONE;

  public readonly sequenceNumber: U64;

  public readonly moduleName: MoveString = new MoveString("account");

  public readonly structName: MoveString = new MoveString("RotationProofChallenge");

  public readonly originator: AccountAddress;

  public readonly currentAuthKey: AccountAddress;
  
  public readonly newPublicKey: MoveVector<U8>;

  constructor(args: {
    sequenceNumber: AnyNumber;
    originator: AccountAddress;
    currentAuthKey: AccountAddress;
    newPublicKey: PublicKey;
  }) {
    super();
    this.sequenceNumber = new U64(args.sequenceNumber);
    this.originator = args.originator;
    this.currentAuthKey = args.currentAuthKey;
    this.newPublicKey = MoveVector.U8(args.newPublicKey.toUint8Array());
  }

  serialize(serializer: Serializer): void {
    serializer.serialize(this.accountAddress);
    serializer.serialize(this.moduleName);
    serializer.serialize(this.structName);
    serializer.serialize(this.sequenceNumber);
    serializer.serialize(this.originator);
    serializer.serialize(this.currentAuthKey);
    serializer.serialize(this.newPublicKey);
  }
}
