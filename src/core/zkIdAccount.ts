// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { jwtDecode, JwtPayload } from "jwt-decode";
import { decode } from "base-64";
import { AccountAddress } from "./accountAddress";
import { AuthenticationKey } from "./authenticationKey";
import { Signature } from "./crypto/asymmetricCrypto";

import { Hex } from "./hex";
import { HexInput, SigningScheme } from "../types";
import { AnyPublicKey } from "./crypto/anyPublicKey";
import { 
  computeAddressSeed, 
  OpenIdSignatureOrZkProof, 
  SignedGroth16Signature, 
  KeylessPublicKey, 
  OidbSignature, 
  OpenIdSignature} from "./crypto/oidb";
import { EphemeralAccount } from "./ephemeralAccount";
import { Signer } from "./account";

function base64UrlDecode(base64Url: string): string {
  // Replace base64url-specific characters
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  // Pad the string with '=' characters if needed
  const paddedBase64 = base64 + "==".substring(0, (3 - base64.length % 3) % 3);

  // Decode the base64 string using the base-64 library
  const decodedString = decode(paddedBase64);

  return decodedString;
}
export class KeylessAccount implements Signer {
  static readonly PEPPER_LENGTH: number = 31;

  ephemeralAccount: EphemeralAccount;

  publicKey: KeylessPublicKey;

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
    ephemeralAccount: EphemeralAccount;
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
    proof: SignedGroth16Signature;
    jwt: string;
  }) {
    const { address, ephemeralAccount, iss, uidKey, uidVal, aud, pepper, proof, jwt } = args;
    this.ephemeralAccount = ephemeralAccount;
    const addressSeed = computeAddressSeed(args);
    this.publicKey = new KeylessPublicKey(iss, addressSeed);
    const authKey = AuthenticationKey.fromPublicKey({ publicKey: new AnyPublicKey(this.publicKey) });
    const derivedAddress = authKey.derivedAddress();
    this.accountAddress = address ?? derivedAddress;
    this.uidKey = uidKey;
    this.uidVal = uidVal;
    this.aud = aud;
    this.proof = proof;
    this.jwt = jwt

    this.signingScheme = SigningScheme.SingleKey;
    const pepperBytes = Hex.fromHexInput(pepper).toUint8Array();
    if (pepperBytes.length !== KeylessAccount.PEPPER_LENGTH) {
      throw new Error(`Pepper length in bytes should be ${KeylessAccount.PEPPER_LENGTH}`);
    }
    this.pepper = pepperBytes;
  }

  sign(data: HexInput): Signature {
    const jwtHeader = this.jwt.split(".")[0];

    const { expiryTimestamp } = this.ephemeralAccount;
    const ephemeralPublicKey = this.ephemeralAccount.publicKey;
    const ephemeralSignature = this.ephemeralAccount.sign(data);
    const oidbSig = new OidbSignature({
      jwtHeader: base64UrlDecode(jwtHeader),
      openIdSignatureOrZkProof: new OpenIdSignatureOrZkProof(this.proof),
      expiryTimestamp,
      ephemeralPublicKey,
      ephemeralSignature,
    });
    return oidbSig
  }

  signWithZkProof(data: HexInput): Signature {
    const jwtHeader = this.jwt.split(".")[0];
    const { expiryTimestamp } = this.ephemeralAccount;
    const ephemeralPublicKey = this.ephemeralAccount.publicKey;
    const ephemeralSignature = this.ephemeralAccount.sign(data);
    const oidbSig = new OidbSignature({
      jwtHeader,
      openIdSignatureOrZkProof: new OpenIdSignatureOrZkProof(this.proof),
      expiryTimestamp,
      ephemeralPublicKey,
      ephemeralSignature,
    });
    return oidbSig
  }

  signWithOpenIdSignature(data: HexInput): Signature {
    const [jwtHeader, jwtPayload, jwtSignature] = this.jwt.split(".");
    const openIdSig = new OpenIdSignature({
      jwtSignature,
      jwtPayloadJson: jwtPayload,
      uidKey: this.uidKey,
      epkBlinder: this.ephemeralAccount.blinder,
      pepper: this.pepper,
    });

    const { expiryTimestamp } = this.ephemeralAccount;
    const ephemeralPublicKey = this.ephemeralAccount.publicKey;
    const ephemeralSignature = this.ephemeralAccount.sign(data);
    const oidbSig = new OidbSignature({
      jwtHeader,
      openIdSignatureOrZkProof: new OpenIdSignatureOrZkProof(openIdSig),
      expiryTimestamp,
      ephemeralPublicKey,
      ephemeralSignature,
    });
    return oidbSig
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  verifySignature(args: { message: HexInput; signature: Signature }): boolean {
    return true
  }

  static fromJWTAndProof(args: {
    proof: SignedGroth16Signature
    jwt: string;
    ephemeralAccount: EphemeralAccount;
    pepper: HexInput;
    uidKey?: string;
  }): KeylessAccount {
    const { proof, jwt, ephemeralAccount, pepper } = args;
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
      ephemeralAccount,
      iss,
      uidKey,
      uidVal,
      aud,
      pepper,
      jwt
    });
  }
}
