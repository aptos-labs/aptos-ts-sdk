// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable max-len */
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
  Account,
  InputTypes,
  AccountAddressInput,
  Hex,
  HexInput,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  Uint128,
  Uint256,
  parseTypeTag,
} from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject, ObjectAddress, TypeTagInput } from "../../src/abi/types";
import {
  ViewFunctionPayloadBuilder,
  EntryFunctionPayloadBuilder,
} from "../../src/bcs/serializable/tx-builder/payloadBuilders";

export namespace Account {
  export namespace EntryFunctions {
    export type OfferRotationCapabilityPayloadMoveArguments = {
      rotation_capability_sig_bytes: MoveVector<U8>;
      account_scheme: U8;
      account_public_key_bytes: MoveVector<U8>;
      recipient_address: AccountAddress;
    };

    /**
     *  public fun offer_rotation_capability<>(
     *     account: &signer,
     *     rotation_capability_sig_bytes: vector<u8>,
     *     account_scheme: u8,
     *     account_public_key_bytes: vector<u8>,
     *     recipient_address: address,
     *   )
     **/
    export class OfferRotationCapability extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "offer_rotation_capability";
      public readonly args: OfferRotationCapabilityPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        rotation_capability_sig_bytes: HexInput, // vector<u8>
        account_scheme: Uint8, // u8
        account_public_key_bytes: HexInput, // vector<u8>
        recipient_address: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
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
    export type OfferSignerCapabilityPayloadMoveArguments = {
      signer_capability_sig_bytes: MoveVector<U8>;
      account_scheme: U8;
      account_public_key_bytes: MoveVector<U8>;
      recipient_address: AccountAddress;
    };

    /**
     *  public fun offer_signer_capability<>(
     *     account: &signer,
     *     signer_capability_sig_bytes: vector<u8>,
     *     account_scheme: u8,
     *     account_public_key_bytes: vector<u8>,
     *     recipient_address: address,
     *   )
     **/
    export class OfferSignerCapability extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "offer_signer_capability";
      public readonly args: OfferSignerCapabilityPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        signer_capability_sig_bytes: HexInput, // vector<u8>
        account_scheme: Uint8, // u8
        account_public_key_bytes: HexInput, // vector<u8>
        recipient_address: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
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

    /**
     *  public fun revoke_any_rotation_capability<>(
     *     arg_0: &signer,
     *   )
     **/
    export class RevokeAnyRotationCapability extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "revoke_any_rotation_capability";
      public readonly args = {};
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor() {
        super();
        this.args = {};
      }
    }

    /**
     *  public fun revoke_any_signer_capability<>(
     *     arg_0: &signer,
     *   )
     **/
    export class RevokeAnySignerCapability extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "revoke_any_signer_capability";
      public readonly args = {};
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor() {
        super();
        this.args = {};
      }
    }
    export type RevokeRotationCapabilityPayloadMoveArguments = {
      to_be_revoked_address: AccountAddress;
    };

    /**
     *  public fun revoke_rotation_capability<>(
     *     account: &signer,
     *     to_be_revoked_address: address,
     *   )
     **/
    export class RevokeRotationCapability extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "revoke_rotation_capability";
      public readonly args: RevokeRotationCapabilityPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        to_be_revoked_address: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          to_be_revoked_address: AccountAddress.fromRelaxed(to_be_revoked_address),
        };
      }
    }
    export type RevokeSignerCapabilityPayloadMoveArguments = {
      to_be_revoked_address: AccountAddress;
    };

    /**
     *  public fun revoke_signer_capability<>(
     *     account: &signer,
     *     to_be_revoked_address: address,
     *   )
     **/
    export class RevokeSignerCapability extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "revoke_signer_capability";
      public readonly args: RevokeSignerCapabilityPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        to_be_revoked_address: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          to_be_revoked_address: AccountAddress.fromRelaxed(to_be_revoked_address),
        };
      }
    }
    export type RotateAuthenticationKeyPayloadMoveArguments = {
      from_scheme: U8;
      from_public_key_bytes: MoveVector<U8>;
      to_scheme: U8;
      to_public_key_bytes: MoveVector<U8>;
      cap_rotate_key: MoveVector<U8>;
      cap_update_table: MoveVector<U8>;
    };

    /**
     *  public fun rotate_authentication_key<>(
     *     account: &signer,
     *     from_scheme: u8,
     *     from_public_key_bytes: vector<u8>,
     *     to_scheme: u8,
     *     to_public_key_bytes: vector<u8>,
     *     cap_rotate_key: vector<u8>,
     *     cap_update_table: vector<u8>,
     *   )
     **/
    export class RotateAuthenticationKey extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "rotate_authentication_key";
      public readonly args: RotateAuthenticationKeyPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        from_scheme: Uint8, // u8
        from_public_key_bytes: HexInput, // vector<u8>
        to_scheme: Uint8, // u8
        to_public_key_bytes: HexInput, // vector<u8>
        cap_rotate_key: HexInput, // vector<u8>
        cap_update_table: HexInput, // vector<u8>
        feePayer?: Account, // optional fee payer account to sponsor the transaction
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
    export type RotateAuthenticationKeyWithRotationCapabilityPayloadMoveArguments = {
      rotation_cap_offerer_address: AccountAddress;
      new_scheme: U8;
      new_public_key_bytes: MoveVector<U8>;
      cap_update_table: MoveVector<U8>;
    };

    /**
     *  public fun rotate_authentication_key_with_rotation_capability<>(
     *     delegate_signer: &signer,
     *     rotation_cap_offerer_address: address,
     *     new_scheme: u8,
     *     new_public_key_bytes: vector<u8>,
     *     cap_update_table: vector<u8>,
     *   )
     **/
    export class RotateAuthenticationKeyWithRotationCapability extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "rotate_authentication_key_with_rotation_capability";
      public readonly args: RotateAuthenticationKeyWithRotationCapabilityPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        delegate_signer: Account, // &signer
        rotation_cap_offerer_address: AccountAddressInput, // address
        new_scheme: Uint8, // u8
        new_public_key_bytes: HexInput, // vector<u8>
        cap_update_table: HexInput, // vector<u8>
        feePayer?: Account, // optional fee payer account to sponsor the transaction
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
  export namespace ViewFunctions {
    export type ExistsAtPayloadMoveArguments = {
      addr: AccountAddressInput;
    };

    /**
     *  public fun exists_at<>(
     *     addr: address,
     *   )
     **/
    export class ExistsAt extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "exists_at";
      public readonly args: ExistsAtPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        addr: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          addr: AccountAddress.fromRelaxed(addr),
        };
      }
    }
    export type GetAuthenticationKeyPayloadMoveArguments = {
      addr: AccountAddressInput;
    };

    /**
     *  public fun get_authentication_key<>(
     *     addr: address,
     *   )
     **/
    export class GetAuthenticationKey extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "get_authentication_key";
      public readonly args: GetAuthenticationKeyPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        addr: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          addr: AccountAddress.fromRelaxed(addr),
        };
      }
    }
    export type GetGuidNextCreationNumPayloadMoveArguments = {
      addr: AccountAddressInput;
    };

    /**
     *  public fun get_guid_next_creation_num<>(
     *     addr: address,
     *   )
     **/
    export class GetGuidNextCreationNum extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "get_guid_next_creation_num";
      public readonly args: GetGuidNextCreationNumPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        addr: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          addr: AccountAddress.fromRelaxed(addr),
        };
      }
    }
    export type GetRotationCapabilityOfferForPayloadMoveArguments = {
      account_addr: AccountAddressInput;
    };

    /**
     *  public fun get_rotation_capability_offer_for<>(
     *     account_addr: address,
     *   )
     **/
    export class GetRotationCapabilityOfferFor extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "get_rotation_capability_offer_for";
      public readonly args: GetRotationCapabilityOfferForPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account_addr: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          account_addr: AccountAddress.fromRelaxed(account_addr),
        };
      }
    }
    export type GetSequenceNumberPayloadMoveArguments = {
      addr: AccountAddressInput;
    };

    /**
     *  public fun get_sequence_number<>(
     *     addr: address,
     *   )
     **/
    export class GetSequenceNumber extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "get_sequence_number";
      public readonly args: GetSequenceNumberPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        addr: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          addr: AccountAddress.fromRelaxed(addr),
        };
      }
    }
    export type GetSignerCapabilityOfferForPayloadMoveArguments = {
      account_addr: AccountAddressInput;
    };

    /**
     *  public fun get_signer_capability_offer_for<>(
     *     account_addr: address,
     *   )
     **/
    export class GetSignerCapabilityOfferFor extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "get_signer_capability_offer_for";
      public readonly args: GetSignerCapabilityOfferForPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account_addr: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          account_addr: AccountAddress.fromRelaxed(account_addr),
        };
      }
    }
    export type IsRotationCapabilityOfferedPayloadMoveArguments = {
      account_addr: AccountAddressInput;
    };

    /**
     *  public fun is_rotation_capability_offered<>(
     *     account_addr: address,
     *   )
     **/
    export class IsRotationCapabilityOffered extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "is_rotation_capability_offered";
      public readonly args: IsRotationCapabilityOfferedPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account_addr: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          account_addr: AccountAddress.fromRelaxed(account_addr),
        };
      }
    }
    export type IsSignerCapabilityOfferedPayloadMoveArguments = {
      account_addr: AccountAddressInput;
    };

    /**
     *  public fun is_signer_capability_offered<>(
     *     account_addr: address,
     *   )
     **/
    export class IsSignerCapabilityOffered extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "account";
      public readonly functionName = "is_signer_capability_offered";
      public readonly args: IsSignerCapabilityOfferedPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account_addr: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          account_addr: AccountAddress.fromRelaxed(account_addr),
        };
      }
    }
  }
}
