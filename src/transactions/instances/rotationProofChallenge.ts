// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Serializer, Serializable } from "../../bcs/serializer";
import { AccountAddress } from "../../core/accountAddress";
import { AnyNumber } from "../../types";
import { PublicKey } from "../../core/crypto";
import { MoveString, MoveVector, U64, U8 } from "../../bcs";

/**
 * Represents a challenge required for the account owner to sign in order to rotate the authentication key.
 * @group Implementation
 * @category Transactions
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
  public readonly currentAuthKey: AccountAddress;

  // New public key to rotate to
  public readonly newPublicKey: MoveVector<U8>;

  // Sequence number of the account
  public readonly sequenceNumber: U64;

  /**
   * Initializes a new instance of the class with the specified parameters.
   * This constructor sets up the necessary attributes for managing account keys.
   *
   * @param args - The parameters required to create the instance.
   * @param args.sequenceNumber - The sequence number associated with the transaction.
   * @param args.originator - The account address of the originator.
   * @param args.currentAuthKey - The current authentication key of the account.
   * @param args.newPublicKey - The new public key to be set for the account.
   * @group Implementation
   * @category Transactions
   */
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

  /**
   * Serializes the properties of the current instance for transmission or storage.
   * This function helps in converting the instance data into a format suitable for serialization.
   *
   * @param serializer - The serializer used to serialize the instance properties.
   * @param serializer.accountAddress - The account address to serialize.
   * @param serializer.moduleName - The module name to serialize.
   * @param serializer.structName - The struct name to serialize.
   * @param serializer.sequenceNumber - The sequence number to serialize.
   * @param serializer.originator - The originator to serialize.
   * @param serializer.currentAuthKey - The current authentication key to serialize.
   * @param serializer.newPublicKey - The new public key to serialize.
   * @group Implementation
   * @category Transactions
   */
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
