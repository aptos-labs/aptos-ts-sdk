// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Serializer, Serializable } from "../../bcs/serializer";
import { AuthenticationKey, PublicKeyInput } from "../../core";
import { AccountAddress } from "../../core/accountAddress";
import { AnyNumber } from "../../types";
import { MoveString, U64 } from "../../bcs";

/**
 * Representation of the challenge which is needed to sign by owner of the account
 * to rotate the authentication key.
 */
export class RotationProofChallenge extends Serializable {
  // Resource account address
  public readonly accountAddress: AccountAddress = AccountAddress.ONE;

  // Module name, i.e: 0x1::account
  public readonly moduleName: MoveString = new MoveString("account");

  // The rotation proof challenge struct name that live under the module
  public readonly structName: MoveString = new MoveString("RotationProofChallenge");

  // Signer's address
  public readonly originator: AccountAddress;

  // Signer's current authentication key
  public readonly currentAuthKey: AuthenticationKey;

  // New public key to rotate to
  public readonly newPublicKey: PublicKeyInput;

  // Sequence number of the account
  public readonly sequenceNumber: U64;

  constructor(args: {
    sequenceNumber: AnyNumber;
    originator: AccountAddress;
    currentAuthKey: AuthenticationKey;
    newPublicKey: PublicKeyInput;
  }) {
    super();
    this.sequenceNumber = new U64(args.sequenceNumber);
    this.originator = args.originator;
    this.currentAuthKey = args.currentAuthKey;
    this.newPublicKey = args.newPublicKey;
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
