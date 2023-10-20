// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress } from "./accountAddress";
import { AuthenticationKey } from "./authenticationKey";
import { PrivateKey, PublicKey, Signature } from "./crypto/asymmetricCrypto";
import { Ed25519PrivateKey, Ed25519PublicKey } from "./crypto/ed25519";
import { MultiEd25519PublicKey } from "./crypto/multiEd25519";
import { Secp256k1PrivateKey, Secp256k1PublicKey } from "./crypto/secp256k1";
import { Hex } from "./hex";
import { HexInput, SigningScheme, SigningSchemeInput } from "../types";
import { derivePrivateKeyFromMnemonic, KeyType } from "../utils/hdKey";
import { AnyPublicKey } from "./crypto/anyPublicKey";
import { getInfo, lookupOriginalAccountAddress } from "../internal/account";
import { AptosConfig } from "../api";

/**
 * Class for creating and managing account on Aptos network
 *
 * Use this class to create accounts, sign transactions, and more.
 * Note: Creating an account instance does not create the account on-chain.
 */
export class Account {
  /**
   * Public key associated with the account
   */
  readonly publicKey: PublicKey;

  /**
   * Private key associated with the account
   */
  readonly privateKey: PrivateKey;

  /**
   * Account address associated with the account
   */
  readonly accountAddress: AccountAddress;

  /**
   * Signing scheme used to sign transactions
   */
  readonly signingScheme: SigningScheme;

  /**
   * constructor for Account
   *
   * Need to update this to use the new crypto library if new schemes are added.
   *
   * @param args.privateKey PrivateKey - private key of the account
   * @param args.address AccountAddress - address of the account
   *
   * This method is private because it should only be called by the factory static methods.
   * @returns Account
   */
  private constructor(args: { privateKey: PrivateKey; address: AccountAddress; legacy?: boolean }) {
    const { privateKey, address, legacy } = args;

    // Derive the public key from the private key
    this.publicKey = privateKey.publicKey();

    // Derive the signing scheme from the public key
    if (this.publicKey instanceof Ed25519PublicKey) {
      if (legacy) {
        this.signingScheme = SigningScheme.Ed25519;
      } else {
        this.publicKey = new AnyPublicKey(this.publicKey);
        this.signingScheme = SigningScheme.SingleKey;
      }
    } else if (this.publicKey instanceof MultiEd25519PublicKey) {
      this.signingScheme = SigningScheme.MultiEd25519;
    } else if (this.publicKey instanceof Secp256k1PublicKey) {
      this.publicKey = new AnyPublicKey(this.publicKey);
      this.signingScheme = SigningScheme.SingleKey;
    } else {
      throw new Error("Can not create new Account, unsupported public key type");
    }

    this.privateKey = privateKey;
    this.accountAddress = address;
  }

  /**
   * Derives an account with random private key and address
   *
   * @param scheme optional SigningScheme - type of SigningScheme to use. Default to Ed25519
   * Currently only Ed25519 and Secp256k1 are supported
   *
   * @returns Account with the given signing scheme
   */
  static generate(args?: { scheme?: SigningSchemeInput; legacy?: boolean }): Account {
    let privateKey: PrivateKey;

    switch (args?.scheme) {
      case SigningSchemeInput.Secp256k1Ecdsa:
        privateKey = Secp256k1PrivateKey.generate();
        break;
      // TODO: Add support for MultiEd25519 as AnyMultiKey
      default:
        privateKey = Ed25519PrivateKey.generate();
    }

    let publicKey = privateKey.publicKey();
    if (!args?.legacy) {
      publicKey = new AnyPublicKey(privateKey.publicKey());
    }

    const address = new AccountAddress({
      data: Account.authKey({
        publicKey, // TODO support AnyMultiKey
      }).toUint8Array(),
    });
    return new Account({ privateKey, address, legacy: args?.legacy });
  }

  /**
   * Derives an account with provided private key
   *
   * NOTE: This function derives the public and auth keys
   * from the provided private key and then creates an Account
   * based on the Account configured signing scheme -
   * ED25519 or Single Sender
   *
   * @param privateKey Hex - private key of the account
   * @returns Account
   */
  static async fromPrivateKey(privateKey: PrivateKey, config: AptosConfig): Promise<Account> {
    const publicKey = new AnyPublicKey(privateKey.publicKey());

    if (privateKey instanceof Secp256k1PrivateKey) {
      // private key is secp256k1, therefore we know it for sure uses a single signer key
      const authKey = AuthenticationKey.fromBytesAndScheme({ publicKey, scheme: 2 });
      const address = new AccountAddress({ data: authKey.toUint8Array() });
      return new Account({ privateKey, address });
    }

    if (privateKey instanceof Ed25519PrivateKey) {
      // lookup single sender ed25519
      const singleSenderAuthKey = AuthenticationKey.fromBytesAndScheme({ publicKey, scheme: SigningScheme.SingleKey });
      const isSingleSender = await Account.lookupAddress(singleSenderAuthKey, config);
      if (isSingleSender) {
        const address = new AccountAddress({ data: singleSenderAuthKey.toUint8Array() });
        return new Account({ privateKey, address });
      }
      // lookup legacy ed25519
      const legacyAuthKey = AuthenticationKey.fromBytesAndScheme({ publicKey, scheme: SigningScheme.Ed25519 });
      const isLegacyEd25519 = await Account.lookupAddress(legacyAuthKey, config);
      if (isLegacyEd25519) {
        const address = new AccountAddress({ data: legacyAuthKey.toUint8Array() });
        return new Account({ privateKey, address, legacy: true });
      }
    }

    // if we are here, it means we couldn't find an address with an
    //auth key that matches the provided private key
    throw new Error(`Can't derive account from private key ${privateKey}`);
  }

  private static async lookupAddress(authKey: AuthenticationKey, config: AptosConfig): Promise<boolean> {
    const potentialAddress1 = await lookupOriginalAccountAddress({
      aptosConfig: config,
      authenticationKey: authKey.toString(),
    });

    try {
      await getInfo({
        aptosConfig: config,
        accountAddress: potentialAddress1.toString(),
      });
      return true;
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Derives an account with bip44 path and mnemonics,
   *
   * @param args.path the BIP44 derive path (e.g. m/44'/637'/0'/0'/0')
   * Detailed description: {@link https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki}
   * @param args.mnemonic the mnemonic seed phrase of the account
   * @returns AptosAccount
   */
  static fromDerivationPath(args: { path: string; mnemonic: string }): Account {
    const { path, mnemonic } = args;
    const { key } = derivePrivateKeyFromMnemonic(KeyType.ED25519, path, mnemonic);
    const privateKey = new Ed25519PrivateKey(key);
    const publicKey = privateKey.publicKey();
    const authKey = Account.authKey({ publicKey });
    const address = new AccountAddress({ data: authKey.toUint8Array() });
    return new Account({ privateKey, address, legacy: true });
  }

  /**
   * This key enables account owners to rotate their private key(s)
   * associated with the account without changing the address that hosts their account.
   * See here for more info: {@link https://aptos.dev/concepts/accounts#single-signer-authentication}
   *
   * @param args.publicKey PublicKey - public key of the account
   * @returns Authentication key for the associated account
   */
  static authKey(args: { publicKey: PublicKey }): Hex {
    const { publicKey } = args;
    const authKey = AuthenticationKey.fromPublicKey({ publicKey });
    return authKey.data;
  }

  /**
   * Sign the given message with the private key.
   *
   * TODO: Add sign transaction or specific types
   *
   * @param data in HexInput format
   * @returns Signature
   */
  sign(data: HexInput): Signature {
    return this.privateKey.sign(data);
  }

  /**
   * Verify the given message and signature with the public key.
   *
   * @param args.message raw message data in HexInput format
   * @param args.signature signed message Signature
   * @returns
   */
  verifySignature(args: { message: HexInput; signature: Signature }): boolean {
    const { message, signature } = args;
    const rawMessage = Hex.fromHexInput(message).toUint8Array();
    return this.publicKey.verifySignature({ message: rawMessage, signature });
  }
}
