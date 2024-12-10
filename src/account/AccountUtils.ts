import { Deserializer, Serializer } from "../bcs";
import { AnyPublicKeyVariant, HexInput, SigningScheme } from "../types";
import { MultiKeyAccount } from "./MultiKeyAccount";
import { Account } from "./Account";
import { Ed25519Account } from "./Ed25519Account";
import { isSingleKeySigner, SingleKeyAccount, SingleKeySignerOrLegacyEd25519Account } from "./SingleKeyAccount";
import { KeylessAccount } from "./KeylessAccount";
import { FederatedKeylessAccount } from "./FederatedKeylessAccount";
import { AbstractKeylessAccount } from "./AbstractKeylessAccount";
import {
  AccountAddress,
  Ed25519PrivateKey,
  getIssAudAndUidVal,
  Hex,
  MultiKey,
  Secp256k1PrivateKey,
  ZeroKnowledgeSig,
} from "../core";
import { deserializeSchemeAndAddress } from "./utils";
import { EphemeralKeyPair } from "./EphemeralKeyPair";

/**
 * Utility functions for working with accounts.
 */
export class AccountUtils {
  private static serializeKeylessAccountCommon(account: AbstractKeylessAccount, serializer: Serializer): void {
    serializer.serializeStr(account.jwt);
    serializer.serializeStr(account.uidKey);
    serializer.serializeFixedBytes(account.pepper);
    account.ephemeralKeyPair.serialize(serializer);
    if (account.proof === undefined) {
      throw new Error("Cannot serialize - proof undefined");
    }
    account.proof.serialize(serializer);
    serializer.serializeOption(account.verificationKeyHash, 32);
  }

  private static deserializeKeylessAccountCommon(deserializer: Deserializer): {
    jwt: string;
    uidKey: string;
    pepper: Uint8Array;
    ephemeralKeyPair: EphemeralKeyPair;
    proof: ZeroKnowledgeSig;
    verificationKeyHash?: Uint8Array;
  } {
    const jwt = deserializer.deserializeStr();
    const uidKey = deserializer.deserializeStr();
    const pepper = deserializer.deserializeFixedBytes(31);
    const ephemeralKeyPair = EphemeralKeyPair.deserialize(deserializer);
    const proof = ZeroKnowledgeSig.deserialize(deserializer);
    const verificationKeyHash = deserializer.deserializeOption("fixedBytes", 32);
    return { jwt, uidKey, pepper, ephemeralKeyPair, proof, verificationKeyHash };
  }

  static toBytes(account: Account): Uint8Array {
    const serializer = new Serializer();
    serializer.serializeU32AsUleb128(account.signingScheme);
    account.accountAddress.serialize(serializer);
    switch (account.signingScheme) {
      case SigningScheme.Ed25519:
        (account as Ed25519Account).privateKey.serialize(serializer);
        return serializer.toUint8Array();
      case SigningScheme.SingleKey: {
        if (!isSingleKeySigner(account)) {
          throw new Error("Account is not a SingleKeySigner");
        }
        const anyPublicKey = account.getAnyPublicKey();
        serializer.serializeU32AsUleb128(anyPublicKey.variant);
        switch (anyPublicKey.variant) {
          case AnyPublicKeyVariant.Keyless: {
            const keylessAccount = account as KeylessAccount;
            this.serializeKeylessAccountCommon(keylessAccount, serializer);
            return serializer.toUint8Array();
          }
          case AnyPublicKeyVariant.FederatedKeyless: {
            const federatedKeylessAccount = account as FederatedKeylessAccount;
            this.serializeKeylessAccountCommon(federatedKeylessAccount, serializer);
            federatedKeylessAccount.publicKey.jwkAddress.serialize(serializer);
            serializer.serializeBool(federatedKeylessAccount.audless);
            return serializer.toUint8Array();
          }
          case AnyPublicKeyVariant.Secp256k1:
          case AnyPublicKeyVariant.Ed25519: {
            const singleKeyAccount = account as SingleKeyAccount;
            singleKeyAccount.privateKey.serialize(serializer);
            return serializer.toUint8Array();
          }
          default: {
            throw new Error(`Invalid public key variant: ${anyPublicKey.variant}`);
          }
        }
      }
      case SigningScheme.MultiKey: {
        const multiKeyAccount = account as MultiKeyAccount;
        multiKeyAccount.publicKey.serialize(serializer);
        serializer.serializeU32AsUleb128(multiKeyAccount.signers.length);
        multiKeyAccount.signers.forEach((signer) => {
          serializer.serializeFixedBytes(this.toBytes(signer));
        });
        return serializer.toUint8Array();
      }
      default:
        throw new Error(`Deserialization of Account failed: invalid signingScheme value ${account.signingScheme}`);
    }
  }

  static toHexStringWithoutPrefix(account: Account): string {
    return Hex.hexInputToStringWithoutPrefix(this.toBytes(account));
  }

  static toHexString(account: Account): string {
    return Hex.hexInputToString(this.toBytes(account));
  }

  static deserialize(deserializer: Deserializer): Account {
    const { address, signingScheme } = deserializeSchemeAndAddress(deserializer);
    switch (signingScheme) {
      case SigningScheme.Ed25519: {
        const privateKey = Ed25519PrivateKey.deserialize(deserializer);
        return new Ed25519Account({ privateKey, address });
      }
      case SigningScheme.SingleKey: {
        const variantIndex = deserializer.deserializeUleb128AsU32();
        switch (variantIndex) {
          case AnyPublicKeyVariant.Ed25519: {
            const privateKey = Ed25519PrivateKey.deserialize(deserializer);
            return new SingleKeyAccount({ privateKey, address });
          }
          case AnyPublicKeyVariant.Secp256k1: {
            const privateKey = Secp256k1PrivateKey.deserialize(deserializer);
            return new SingleKeyAccount({ privateKey, address });
          }
          case AnyPublicKeyVariant.Keyless: {
            const keylessComponents = this.deserializeKeylessAccountCommon(deserializer);
            const jwtClaims = getIssAudAndUidVal(keylessComponents);
            return new KeylessAccount({ ...keylessComponents, ...jwtClaims });
          }
          case AnyPublicKeyVariant.FederatedKeyless: {
            const keylessComponents = this.deserializeKeylessAccountCommon(deserializer);
            const jwkAddress = AccountAddress.deserialize(deserializer);
            const audless = deserializer.deserializeBool();
            const jwtClaims = getIssAudAndUidVal(keylessComponents);
            return new FederatedKeylessAccount({ ...keylessComponents, ...jwtClaims, jwkAddress, audless });
          }
          default:
            throw new Error(`Unsupported public key variant ${variantIndex}`);
        }
      }
      case SigningScheme.MultiKey: {
        const multiKey = MultiKey.deserialize(deserializer);
        const length = deserializer.deserializeUleb128AsU32();
        const signers = new Array<SingleKeySignerOrLegacyEd25519Account>();
        for (let i = 0; i < length; i += 1) {
          const signer = this.deserialize(deserializer);
          if (!isSingleKeySigner(signer) && !(signer instanceof Ed25519Account)) {
            throw new Error(
              "Deserialization of MultiKeyAccount failed. Signer is not a SingleKeySigner or Ed25519Account",
            );
          }
          signers.push(signer);
        }
        return new MultiKeyAccount({ multiKey, signers, address });
      }
      default:
        throw new Error(`Deserialization of Account failed: invalid signingScheme value ${signingScheme}`);
    }
  }

  static keylessAccountFromHex(hex: HexInput): KeylessAccount {
    const account = this.fromHex(hex);
    if (!(account instanceof KeylessAccount)) {
      throw new Error("Deserialization of KeylessAccount failed");
    }
    return account;
  }

  static federatedKeylessAccountFromHex(hex: HexInput): FederatedKeylessAccount {
    const account = this.fromHex(hex);
    if (!(account instanceof FederatedKeylessAccount)) {
      throw new Error("Deserialization of FederatedKeylessAccount failed");
    }
    return account;
  }

  static multiKeyAccountFromHex(hex: HexInput): MultiKeyAccount {
    const account = this.fromHex(hex);
    if (!(account instanceof MultiKeyAccount)) {
      throw new Error("Deserialization of MultiKeyAccount failed");
    }
    return account;
  }

  static singleKeyAccountFromHex(hex: HexInput): SingleKeyAccount {
    const account = this.fromHex(hex);
    if (!(account instanceof SingleKeyAccount)) {
      throw new Error("Deserialization of SingleKeyAccount failed");
    }
    return account;
  }

  static ed25519AccountFromHex(hex: HexInput): Ed25519Account {
    const account = this.fromHex(hex);
    if (!(account instanceof Ed25519Account)) {
      throw new Error("Deserialization of Ed25519Account failed");
    }
    return account;
  }

  static fromHex(hex: HexInput): Account {
    return this.deserialize(Deserializer.fromHex(hex));
  }

  static fromBytes(bytes: Uint8Array): Account {
    return this.fromHex(bytes);
  }
}
