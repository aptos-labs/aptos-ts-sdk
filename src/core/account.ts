import { Deserializer, Serializable, Serializer } from "../bcs";
import { HexInput } from "../types";
import { AccountAddress, AccountAddressInput } from "./accountAddress";
import {
  AnyPublicKey,
  AnySignature,
  Ed25519PublicKey,
  Ed25519Signature,
  MultiEd25519PublicKey,
  MultiEd25519Signature,
  MultiKey as MultiPublicKey,
  MultiKeySignature,
} from "./crypto";

export type ValidPublicKey = Ed25519PublicKey | AnyPublicKey | MultiEd25519PublicKey | MultiPublicKey;
export type ValidSignature = Ed25519Signature | AnySignature | MultiEd25519Signature | MultiKeySignature;

export interface AccountConstructorArgs<TPublicKey> {
  publicKey: TPublicKey;
  address?: AccountAddressInput;
}

export interface VerifySignatureArgs<TSignature = ValidSignature> {
  message: HexInput;
  signature: TSignature;
}

export enum AccountVariant {
  Ed25519,
  MultiEd25519,
  SingleKey,
  MultiKey,
}

/**
 * Class for representing an Aptos account.
 * An `Account` instance does not have signing capabilities. For that, please see {@link Signer}.
 * Because of this, an `Account` is safe to serialize and pass around.
 *
 * Use this class to create accounts, verify signatures, and more.
 *
 * Since [AIP-55](https://github.com/aptos-foundation/AIPs/pull/263) Aptos supports
 * `Legacy` and `Unified` authentications.
 */
export abstract class Account extends Serializable {
  public readonly accountAddress: AccountAddress;

  /**
   * @param address AccountAddressInput - optional address of the account.
   * Will be derived from the private key if not provided
   */
  protected constructor(address: AccountAddressInput) {
    super();
    this.accountAddress = AccountAddress.from(address);
  }

  /**
   * Utility function for instantiating an account from a valid public key.
   * @param args.publicKey the account's public key
   * @param args.address the account's address. If not provided, it will be derived from the public key.
   * Typically, passing the address explicitly is only required in case the authentication key has been rotated.
   */
  static fromPublicKey(args: AccountConstructorArgs<ValidPublicKey>): Account {
    const { publicKey, address } = args;
    if (publicKey instanceof Ed25519PublicKey) {
      return new Ed25519Account({ publicKey, address });
    }
    if (publicKey instanceof AnyPublicKey) {
      return new SingleKeyAccount({ publicKey, address });
    }
    if (publicKey instanceof MultiEd25519PublicKey) {
      return new MultiEd25519Account({ publicKey, address });
    }
    if (publicKey instanceof MultiPublicKey) {
      return new MultiKeyAccount({ publicKey, address });
    }
    throw new Error("Unsupported public key type");
  }

  /**
   * Verify the given message and signature with the account's public key.
   *
   * @param args.message raw message data in HexInput format
   * @param args.signature a message signature
   * @returns whether the signature is verified against the message
   */
  abstract verifySignature(args: VerifySignatureArgs): boolean;

  // region BcsSerializable

  static deserialize(deserializer: Deserializer): Account {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case AccountVariant.Ed25519:
        return Ed25519Account.load(deserializer);
      case AccountVariant.MultiEd25519:
        return MultiEd25519Account.load(deserializer);
      case AccountVariant.SingleKey:
        return SingleKeyAccount.load(deserializer);
      case AccountVariant.MultiKey:
        return MultiKeyAccount.load(deserializer);
      default:
        throw new Error(`Unknown variant index for Account: ${index}`);
    }
  }

  // endregion
}

/**
 * Account implementation for the Ed25519 authentication scheme.
 */
export class Ed25519Account extends Account {
  /**
   * Account variant
   */
  public readonly variant = AccountVariant.Ed25519;

  /**
   * Account's public key
   */
  public readonly publicKey: Ed25519PublicKey;

  constructor(args: AccountConstructorArgs<Ed25519PublicKey>) {
    const { address, publicKey } = args;
    super(address ?? publicKey.authKey().derivedAddress());
    this.publicKey = publicKey;
  }

  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    if (signature instanceof Ed25519Signature) {
      return this.publicKey.verifySignature({ message, signature });
    }
    return false;
  }

  // region BcsSerializable

  serialize(serializer: Serializer) {
    serializer.serializeU32AsUleb128(AccountVariant.Ed25519);
    this.publicKey.serialize(serializer);
  }

  static load(deserializer: Deserializer) {
    const publicKey = Ed25519PublicKey.deserialize(deserializer);
    return new Ed25519Account({ publicKey });
  }

  // endregion
}

/**
 * Account implementation for the SingleKey authentication scheme.
 */
export class SingleKeyAccount extends Account {
  /**
   * Account variant
   */
  public readonly variant = AccountVariant.SingleKey;

  /**
   * Account's public key
   */
  public readonly publicKey: AnyPublicKey;

  constructor(args: AccountConstructorArgs<AnyPublicKey>) {
    const { address, publicKey } = args;
    super(address ?? publicKey.authKey().derivedAddress());
    this.publicKey = publicKey;
  }

  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    if (signature instanceof AnySignature) {
      return this.publicKey.verifySignature({ message, signature });
    }
    return false;
  }

  // region BcsSerializable

  serialize(serializer: Serializer) {
    serializer.serializeU32AsUleb128(AccountVariant.SingleKey);
    this.publicKey.serialize(serializer);
  }

  static load(deserializer: Deserializer) {
    const publicKey = AnyPublicKey.deserialize(deserializer);
    return new SingleKeyAccount({ publicKey });
  }

  // endregion
}

/**
 * Account implementation for the MultiEd25519 authentication scheme.
 */
export class MultiEd25519Account extends Account {
  /**
   * Account variant
   */
  public readonly variant = AccountVariant.MultiEd25519;

  /**
   * Account's public key
   */
  public readonly publicKey: MultiEd25519PublicKey;

  constructor(args: AccountConstructorArgs<MultiEd25519PublicKey>) {
    const { address, publicKey } = args;
    super(address ?? publicKey.authKey().derivedAddress());
    this.publicKey = publicKey;
  }

  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    if (signature instanceof MultiEd25519Signature) {
      return this.publicKey.verifySignature({ message, signature });
    }
    return false;
  }

  // region BcsSerializable

  serialize(serializer: Serializer) {
    serializer.serializeU32AsUleb128(AccountVariant.MultiEd25519);
    this.publicKey.serialize(serializer);
  }

  static load(deserializer: Deserializer) {
    const publicKey = MultiEd25519PublicKey.deserialize(deserializer);
    return new MultiEd25519Account({ publicKey });
  }

  // endregion
}

/**
 * Account implementation for the MultiKey authentication scheme.
 */
export class MultiKeyAccount extends Account {
  /**
   * Account variant
   */
  public readonly variant = AccountVariant.MultiKey;

  /**
   * Account's public key
   */
  public readonly publicKey: MultiPublicKey;

  constructor(args: AccountConstructorArgs<MultiPublicKey>) {
    const { address, publicKey } = args;
    super(address ?? publicKey.authKey().derivedAddress());
    this.publicKey = publicKey;
  }

  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    if (Array.isArray(signature)) {
      return this.publicKey.verifySignature({ message, signature });
    }
    return false;
  }

  // region BcsSerializable

  serialize(serializer: Serializer) {
    serializer.serializeU32AsUleb128(AccountVariant.MultiKey);
    this.publicKey.serialize(serializer);
  }

  static load(deserializer: Deserializer) {
    const publicKey = MultiPublicKey.deserialize(deserializer);
    return new MultiKeyAccount({ publicKey });
  }

  // endregion
}
