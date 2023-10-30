// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress } from "./accountAddress";
import { AuthenticationKey } from "./authenticationKey";
import { PrivateKey, PublicKey, Signature } from "./crypto/asymmetricCrypto";
import { Ed25519PrivateKey, Ed25519PublicKey } from "./crypto/ed25519";
import { MultiEd25519PublicKey } from "./crypto/multiEd25519";
import { Secp256k1PrivateKey, Secp256k1PublicKey } from "./crypto/secp256k1";
import { Hex } from "./hex";
import { GenerateAccount, HexInput, SigningScheme, SigningSchemeInput } from "../types";
import { derivePrivateKeyFromMnemonic, KeyType } from "../utils/hdKey";
import { AnyPublicKey } from "./crypto/anyPublicKey";

/**
 * Class for creating and managing account on Aptos network
 *
 * Use this class to create accounts, sign transactions, and more.
 * Note: Creating an account instance does not create the account on-chain.
 *
 * Since [AIP-55](https://github.com/aptos-foundation/AIPs/pull/263) Aptos supports
 * `Legacy` and `Unified` authentications.
 *
 * @Legacy includes `ED25519` and `MultiED25519`
 * @Unified includes `SingleSender` and `MultiSender`, where currently
 * `SingleSender` supports `ED25519` and `Secp256k1`, and `MultiSender` supports
 * `MultiED25519`.
 *
 * In TypeScript SDK, we support all of these options
 * @generate default to generate Unified keys, with an optional `legacy` boolean argument
 * that lets you generate new keys conforming to the Legacy authentication.
 * @fromPrivateKey derives an account by a provided private key and address, with an optional
 * `legacy` boolean argument that lets you generate new keys conforming to the Legacy authentication.
 * @fromDerivationPath derives an account with bip44 path and mnemonics,
 *
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
   * @param args.legacy optional. If set to true, the keypair authentication keys will be derived with a Legacy scheme.
   * Defaults to deriving an authentication key with a Unified scheme
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
   * Derives an account with random private key and address.
   * Default generation is using the Unified flow with ED25519 key
   *
   * @param args optional. Unify GenerateAccount type for Legacy and Unified keys
   *
   * Account input type to generate an account using Legacy
   * Ed25519 or MultiEd25519 keys or without a specified `scheme`.
   * ```
   * GenerateAccountWithLegacyKey = {
   *  scheme?: SigningSchemeInput.Ed25519 | SigningSchemeInput.MultiEd25519;
   *  legacy: true;
   * };
   * ```
   *
   * Account input type to generate an account using Unified
   * Secp256k1Ecdsa key
   * In this case `legacy` is always false
   * ```
   * GenerateAccountWithUnifiedKey = {
   *  scheme: SigningSchemeInput.Secp256k1Ecdsa;
   *  legacy?: false;
   * };
   * ```
   *
   * @returns Account with the given signing scheme
   */
  static generate(args?: GenerateAccount): Account {
    let privateKey: PrivateKey;

    switch (args?.scheme) {
      case SigningSchemeInput.Secp256k1Ecdsa:
        privateKey = Secp256k1PrivateKey.generate();
        break;
      default:
        privateKey = Ed25519PrivateKey.generate();
    }

    let publicKey = privateKey.publicKey();
    if (!args?.legacy) {
      publicKey = new AnyPublicKey(privateKey.publicKey());
    }

    const address = new AccountAddress({
      data: Account.authKey({
        publicKey,
      }).toUint8Array(),
    });
    return new Account({ privateKey, address, legacy: args?.legacy });
  }

  /**
   * Instantiates an account given a private key and a specified account address.
   * This is primarily used to instantiate an `Account` that has had its authentication key rotated.
   *
   * @param privateKey PrivateKey - private key of the account
   * @param address The account address
   * @param args.legacy optional. If set to true, the keypair authentication keys will be derived with a Legacy scheme.
   * Defaults to deriving an authentication key with a Unified scheme
   *
   * @returns Account
   */
  static fromPrivateKeyAndAddress(args: {
    privateKey: PrivateKey;
    address: AccountAddress;
    legacy?: boolean;
  }): Account {
    const { privateKey, address, legacy } = args;
    return new Account({ privateKey, address, legacy });
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
