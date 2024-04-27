// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { JwtPayload, jwtDecode } from "jwt-decode";
import { decode } from "base-64";
import { HexInput, SigningScheme } from "../types";
import { AccountAddress } from "../core/accountAddress";
import {
  AnyPublicKey,
  AnySignature,
  KeylessPublicKey,
  KeylessSignature,
  OpenIdSignature,
  OpenIdSignatureOrZkProof,
  Signature,
  SignedGroth16Signature,
  computeAddressSeed,
  fromDerivationPath as fromDerivationPathInner,
} from "../core/crypto";

import { Account } from "./Account";
import { EphemeralKeyPair } from "./EphemeralKeyPair";
import { Hex } from "../core/hex";
import { AccountAuthenticatorSingleKey } from "../transactions/authenticator/account";
import { Serializer } from "../bcs";
import { deriveTransactionType, generateSigningMessage } from "../transactions/transactionBuilder/signingMessage";
import { AnyRawTransaction } from "../transactions/types";

function base64UrlDecode(base64Url: string): string {
  // Replace base64url-specific characters
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  // Pad the string with '=' characters if needed
  const paddedBase64 = base64 + "==".substring(0, (3 - (base64.length % 3)) % 3);

  // Decode the base64 string using the base-64 library
  const decodedString = decode(paddedBase64);

  return decodedString;
}

export class KeylessAccount implements Account {
  static readonly PEPPER_LENGTH: number = 31;

  static readonly SLIP_0010_SEED: string = "32 bytes";

  static readonly APTOS_CONNECT_CLIENT_ID: string =
    "734998116548-ib6ircv72o1b6l0no9ol4spnnkr8gm69.apps.googleusercontent.com";

  publicKey: KeylessPublicKey;

  ephemeralKeyPair: EphemeralKeyPair;

  uidKey: string;

  uidVal: string;

  aud: string;

  pepper: Uint8Array;

  accountAddress: AccountAddress;

  proof: SignedGroth16Signature | Promise<SignedGroth16Signature>;

  signingScheme: SigningScheme;

  jwt: string;

  constructor(args: {
    address?: AccountAddress;
    ephemeralKeyPair: EphemeralKeyPair;
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
    proofFetcherOrData: Promise<SignedGroth16Signature> | SignedGroth16Signature;
    jwt: string;
  }) {
    const { address, ephemeralKeyPair, iss, uidKey, uidVal, aud, pepper, proofFetcherOrData, jwt } = args;
    this.ephemeralKeyPair = ephemeralKeyPair;
    const addressSeed = computeAddressSeed(args);
    this.publicKey = new KeylessPublicKey(iss, addressSeed);
    this.accountAddress = address ? AccountAddress.from(address) : this.publicKey.authKey().derivedAddress();
    this.uidKey = uidKey;
    this.uidVal = uidVal;
    this.aud = aud;
    this.jwt = jwt;
    if (proofFetcherOrData instanceof Promise) {
      this.proof = proofFetcherOrData;
      this.initialize(proofFetcherOrData);
    } else {
      this.proof = proofFetcherOrData;
    }

    this.signingScheme = SigningScheme.SingleKey;
    const pepperBytes = Hex.fromHexInput(pepper).toUint8Array();
    if (pepperBytes.length !== KeylessAccount.PEPPER_LENGTH) {
      throw new Error(`Pepper length in bytes should be ${KeylessAccount.PEPPER_LENGTH}`);
    }
    this.pepper = pepperBytes;
  }

  private async initialize(promise: Promise<SignedGroth16Signature>) {
    try {
      this.proof = await promise;
    } catch (error) {
      throw new Error("Failed to fetch proof");
    }
  }

  signWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorSingleKey {
    const raw = deriveTransactionType(transaction);
    const signature = new AnySignature(this.sign(raw.bcsToBytes()));
    const publicKey = new AnyPublicKey(this.publicKey);
    return new AccountAuthenticatorSingleKey(publicKey, signature);
  }

  async waitForProofFetch() {
    if (this.proof instanceof Promise) {
      await this.proof;
    }
  }

  sign(data: HexInput): Signature {
    const { expiryDateSecs } = this.ephemeralKeyPair;
    const currentTimeInSeconds = Math.floor(new Date().getTime() / 1000);
    if (expiryDateSecs < currentTimeInSeconds) {
      throw new Error("Ephemeral key pair is expired.");
    }
    if (this.proof instanceof Promise) {
      throw new Error("Failed to fetch proof.");
    }
    const jwtHeader = this.jwt.split(".")[0];
    const ephemeralPublicKey = this.ephemeralKeyPair.publicKey;

    const serializer = new Serializer();
    serializer.serializeFixedBytes(Hex.fromHexInput(data).toUint8Array());
    serializer.serializeOption(this.proof.proof);
    const signMess = generateSigningMessage(serializer.toUint8Array(), "TransactionAndProof");

    const ephemeralSignature = this.ephemeralKeyPair.sign(signMess);

    return new KeylessSignature({
      jwtHeader: base64UrlDecode(jwtHeader),
      openIdSignatureOrZkProof: new OpenIdSignatureOrZkProof(this.proof),
      expiryDateSecs,
      ephemeralPublicKey,
      ephemeralSignature,
    });
  }

  signTransaction(transaction: AnyRawTransaction): Signature {
    const raw = deriveTransactionType(transaction);
    return this.sign(raw.bcsToBytes());
  }

  signWithOpenIdSignature(data: HexInput): Signature {
    const [jwtHeader, jwtPayload, jwtSignature] = this.jwt.split(".");
    const openIdSig = new OpenIdSignature({
      jwtSignature,
      jwtPayloadJson: jwtPayload,
      uidKey: this.uidKey,
      epkBlinder: this.ephemeralKeyPair.blinder,
      pepper: this.pepper,
    });

    const { expiryDateSecs } = this.ephemeralKeyPair;
    const ephemeralPublicKey = this.ephemeralKeyPair.publicKey;
    const ephemeralSignature = this.ephemeralKeyPair.sign(data);
    return new KeylessSignature({
      jwtHeader,
      openIdSignatureOrZkProof: new OpenIdSignatureOrZkProof(openIdSig),
      expiryDateSecs,
      ephemeralPublicKey,
      ephemeralSignature,
    });
  }

  deriveAptosConnectPublicKey(): KeylessPublicKey {
    const { uidKey, uidVal, pepper } = this;
    const { iss } = this.publicKey;
    const addressSeed = computeAddressSeed({
      uidKey,
      uidVal,
      aud: KeylessAccount.APTOS_CONNECT_CLIENT_ID,
      pepper,
    });
    return new KeylessPublicKey(iss, addressSeed);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  verifySignature(args: { message: HexInput; signature: Signature }): boolean {
    return true;
  }

  static fromJWTAndProof(args: {
    proofFetcherOrData: Promise<SignedGroth16Signature> | SignedGroth16Signature;
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    pepper: HexInput;
    uidKey?: string;
  }): KeylessAccount {
    const { proofFetcherOrData, jwt, ephemeralKeyPair, pepper } = args;
    const uidKey = args.uidKey ?? "sub";

    const jwtPayload = jwtDecode<JwtPayload & { [key: string]: string }>(jwt);
    const iss = jwtPayload.iss!;
    if (typeof jwtPayload.aud !== "string") {
      throw new Error("aud was not found or an array of values");
    }
    const aud = jwtPayload.aud!;
    const uidVal = jwtPayload[uidKey];
    return new KeylessAccount({
      proofFetcherOrData,
      ephemeralKeyPair,
      iss,
      uidKey,
      uidVal,
      aud,
      pepper,
      jwt,
    });
  }

  static fromDerivationPath(path: string, seed: Uint8Array): Uint8Array {
    return fromDerivationPathInner(path, KeylessAccount.SLIP_0010_SEED, seed);
  }
}
