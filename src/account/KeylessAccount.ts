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
import { Deserializer, Serializer } from "../bcs";
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

  publicKey: KeylessPublicKey;

  ephemeralKeyPair: EphemeralKeyPair;

  uidKey: string;

  uidVal: string;

  aud: string;

  pepper: Uint8Array;

  accountAddress: AccountAddress;

  proof: SignedGroth16Signature;

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
    proof: SignedGroth16Signature;
    jwt: string;
  }) {
    const { address, ephemeralKeyPair, iss, uidKey, uidVal, aud, pepper, proof, jwt } = args;
    this.ephemeralKeyPair = ephemeralKeyPair;
    const addressSeed = computeAddressSeed(args);
    this.publicKey = new KeylessPublicKey(iss, addressSeed);
    this.accountAddress = address ? AccountAddress.from(address) : this.publicKey.authKey().derivedAddress();
    this.uidKey = uidKey;
    this.uidVal = uidVal;
    this.aud = aud;
    this.jwt = jwt;
    this.proof = proof;

    this.signingScheme = SigningScheme.SingleKey;
    const pepperBytes = Hex.fromHexInput(pepper).toUint8Array();
    if (pepperBytes.length !== KeylessAccount.PEPPER_LENGTH) {
      throw new Error(`Pepper length in bytes should be ${KeylessAccount.PEPPER_LENGTH}`);
    }
    this.pepper = pepperBytes;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.jwt);
    serializer.serializeStr(this.uidKey);
    serializer.serializeFixedBytes(this.pepper);
    this.ephemeralKeyPair.serialize(serializer);
    this.proof.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): KeylessAccount {
    const jwt = deserializer.deserializeStr();
    const uidKey = deserializer.deserializeStr();
    const pepper = deserializer.deserializeFixedBytes(31);
    const ephemeralKeyPair = EphemeralKeyPair.deserialize(deserializer);
    const proof = SignedGroth16Signature.deserialize(deserializer);
    return KeylessAccount.fromJWTAndProof({
      proof,
      pepper,
      uidKey,
      jwt,
      ephemeralKeyPair,
    });
  }

  isExpired(): boolean {
    return this.ephemeralKeyPair.isExpired();
  }

  bcsToBytes(): Uint8Array {
    const serializer = new Serializer();
    this.serialize(serializer);
    return serializer.toUint8Array();
  }

  bcsToHex(): Hex {
    const bcsBytes = this.bcsToBytes();
    return Hex.fromHexInput(bcsBytes);
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
    const ephemeralPublicKey = this.ephemeralKeyPair.getPublicKey();

    const serializer = new Serializer();
    serializer.serializeFixedBytes(Hex.fromHexInput(data).toUint8Array());
    serializer.serializeOption(this.proof.proof);
    const signMess = generateSigningMessage(serializer.toUint8Array(), "APTOS::TransactionAndProof");

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
    const ephemeralPublicKey = this.ephemeralKeyPair.getPublicKey();
    const ephemeralSignature = this.ephemeralKeyPair.sign(data);
    return new KeylessSignature({
      jwtHeader,
      openIdSignatureOrZkProof: new OpenIdSignatureOrZkProof(openIdSig),
      expiryDateSecs,
      ephemeralPublicKey,
      ephemeralSignature,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  verifySignature(args: { message: HexInput; signature: Signature }): boolean {
    return true;
  }

  static fromBytes(bytes: Uint8Array): KeylessAccount {
    return KeylessAccount.deserialize(new Deserializer(bytes));
  }

  static fromJWTAndProof(args: {
    proof: SignedGroth16Signature;
    jwt: string;
    ephemeralKeyPair: EphemeralKeyPair;
    pepper: HexInput;
    uidKey?: string;
  }): KeylessAccount {
    const { proof, jwt, ephemeralKeyPair, pepper } = args;
    const uidKey = args.uidKey ?? "sub";

    const jwtPayload = jwtDecode<JwtPayload & { [key: string]: string }>(jwt);
    const iss = jwtPayload.iss!;
    if (typeof jwtPayload.aud !== "string") {
      throw new Error("aud was not found or an array of values");
    }
    const aud = jwtPayload.aud!;
    const uidVal = jwtPayload[uidKey];
    return new KeylessAccount({
      proof,
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
