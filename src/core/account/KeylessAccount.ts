// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { HexInput, SigningScheme } from "../../types";
import { AccountAddress } from "../accountAddress";
import { AccountPublicKey, KeylessPublicKey, KeylessSignature, OpenIdSignature, OpenIdSignatureOrZkProof, Signature, SignedGroth16Signature, computeAddressSeed } from "../crypto";
import { Account } from "./Account";
import { EphemeralAccount } from "./EphemeralAccount";


export class KeylessAccount implements Account {
  static readonly PEPPER_LENGTH: number = 31;

  publicKey: AccountPublicKey;

  ephemeralAccount: EphemeralAccount;

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
    const oidbSig = new KeylessSignature({
      jwtHeader,
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
    const oidbSig = new KeylessSignature({
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
    const oidbSig = new KeylessSignature({
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
