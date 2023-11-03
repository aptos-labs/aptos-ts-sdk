// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AccountAddress,
  AccountAuthenticator,
  MoveString,
  MoveVector,
  TypeTag,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
  Bool,
  EntryFunctionPayloadBuilder,
  AccountAddressInput,
  HexInput,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  Uint128,
  Uint256,
} from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";

export namespace Account {
  // let account: AccountAuthenticator | undefined; // &signer
  export type OfferRotationCapabilityPayloadBCSArguments = {
    rotation_capability_sig_bytes: MoveVector<U8>;
    account_scheme: U8;
    account_public_key_bytes: MoveVector<U8>;
    recipient_address: AccountAddress;
  };

  export class OfferRotationCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "offer_rotation_capability";
    public readonly args: OfferRotationCapabilityPayloadBCSArguments;

    constructor(
      rotation_capability_sig_bytes: HexInput, // vector<u8>
      account_scheme: Uint8, // u8
      account_public_key_bytes: HexInput, // vector<u8>
      recipient_address: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        rotation_capability_sig_bytes: MoveVector.U8(rotation_capability_sig_bytes),
        account_scheme: new U8(account_scheme),
        account_public_key_bytes: MoveVector.U8(account_public_key_bytes),
        recipient_address: AccountAddress.fromRelaxed(recipient_address),
      };
    }
  }
  // let account: AccountAuthenticator | undefined; // &signer
  export type OfferSignerCapabilityPayloadBCSArguments = {
    signer_capability_sig_bytes: MoveVector<U8>;
    account_scheme: U8;
    account_public_key_bytes: MoveVector<U8>;
    recipient_address: AccountAddress;
  };

  export class OfferSignerCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "offer_signer_capability";
    public readonly args: OfferSignerCapabilityPayloadBCSArguments;

    constructor(
      signer_capability_sig_bytes: HexInput, // vector<u8>
      account_scheme: Uint8, // u8
      account_public_key_bytes: HexInput, // vector<u8>
      recipient_address: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        signer_capability_sig_bytes: MoveVector.U8(signer_capability_sig_bytes),
        account_scheme: new U8(account_scheme),
        account_public_key_bytes: MoveVector.U8(account_public_key_bytes),
        recipient_address: AccountAddress.fromRelaxed(recipient_address),
      };
    }
  }
  // let arg_0: AccountAuthenticator | undefined; // &signer

  export class RevokeAnyRotationCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "revoke_any_rotation_capability";
    public readonly args = {};

    constructor() {
      super();
      this.args = {};
    }
  }
  // let arg_0: AccountAuthenticator | undefined; // &signer

  export class RevokeAnySignerCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "revoke_any_signer_capability";
    public readonly args = {};

    constructor() {
      super();
      this.args = {};
    }
  }
  // let account: AccountAuthenticator | undefined; // &signer
  export type RevokeRotationCapabilityPayloadBCSArguments = {
    to_be_revoked_address: AccountAddress;
  };

  export class RevokeRotationCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "revoke_rotation_capability";
    public readonly args: RevokeRotationCapabilityPayloadBCSArguments;

    constructor(
      to_be_revoked_address: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        to_be_revoked_address: AccountAddress.fromRelaxed(to_be_revoked_address),
      };
    }
  }
  // let account: AccountAuthenticator | undefined; // &signer
  export type RevokeSignerCapabilityPayloadBCSArguments = {
    to_be_revoked_address: AccountAddress;
  };

  export class RevokeSignerCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "revoke_signer_capability";
    public readonly args: RevokeSignerCapabilityPayloadBCSArguments;

    constructor(
      to_be_revoked_address: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        to_be_revoked_address: AccountAddress.fromRelaxed(to_be_revoked_address),
      };
    }
  }
  // let account: AccountAuthenticator | undefined; // &signer
  export type RotateAuthenticationKeyPayloadBCSArguments = {
    from_scheme: U8;
    from_public_key_bytes: MoveVector<U8>;
    to_scheme: U8;
    to_public_key_bytes: MoveVector<U8>;
    cap_rotate_key: MoveVector<U8>;
    cap_update_table: MoveVector<U8>;
  };

  export class RotateAuthenticationKey extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "rotate_authentication_key";
    public readonly args: RotateAuthenticationKeyPayloadBCSArguments;

    constructor(
      from_scheme: Uint8, // u8
      from_public_key_bytes: HexInput, // vector<u8>
      to_scheme: Uint8, // u8
      to_public_key_bytes: HexInput, // vector<u8>
      cap_rotate_key: HexInput, // vector<u8>
      cap_update_table: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        from_scheme: new U8(from_scheme),
        from_public_key_bytes: MoveVector.U8(from_public_key_bytes),
        to_scheme: new U8(to_scheme),
        to_public_key_bytes: MoveVector.U8(to_public_key_bytes),
        cap_rotate_key: MoveVector.U8(cap_rotate_key),
        cap_update_table: MoveVector.U8(cap_update_table),
      };
    }
  }
  // let delegate_signer: AccountAuthenticator | undefined; // &signer
  export type RotateAuthenticationKeyWithRotationCapabilityPayloadBCSArguments = {
    rotation_cap_offerer_address: AccountAddress;
    new_scheme: U8;
    new_public_key_bytes: MoveVector<U8>;
    cap_update_table: MoveVector<U8>;
  };

  export class RotateAuthenticationKeyWithRotationCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "rotate_authentication_key_with_rotation_capability";
    public readonly args: RotateAuthenticationKeyWithRotationCapabilityPayloadBCSArguments;

    constructor(
      rotation_cap_offerer_address: AccountAddressInput, // address
      new_scheme: Uint8, // u8
      new_public_key_bytes: HexInput, // vector<u8>
      cap_update_table: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        rotation_cap_offerer_address: AccountAddress.fromRelaxed(rotation_cap_offerer_address),
        new_scheme: new U8(new_scheme),
        new_public_key_bytes: MoveVector.U8(new_public_key_bytes),
        cap_update_table: MoveVector.U8(cap_update_table),
      };
    }
  }
}
