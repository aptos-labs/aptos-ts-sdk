// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { jwtDecode, JwtPayload } from "jwt-decode";
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
  ZkIDPublicKey, 
  ZkIDSignature } from "./crypto/zkid";
import { EphemeralAccount } from "./ephemeralAccount";
import { Signer } from "./account";

export class GrothZkIDAccount implements Signer {
  static readonly PEPPER_LENGTH: number = 31;

  ephemeralAccount: EphemeralAccount;

  publicKey: ZkIDPublicKey;

  uidKey: string;

  uidVal: string;

  aud: string;

  pepper: Uint8Array;

  accountAddress: AccountAddress;

  proof: SignedGroth16Signature;

  signingScheme: SigningScheme;

  jwtHeader: string;

  constructor(args: {
    address?: AccountAddress;
    ephemeralAccount: EphemeralAccount;
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
    proof: SignedGroth16Signature;
    jwtHeader: string;
  }) {
    const { address, ephemeralAccount, iss, uidKey, uidVal, aud, pepper, proof, jwtHeader } = args;
    this.ephemeralAccount = ephemeralAccount;
    const addressSeed = computeAddressSeed(args);
    this.publicKey = new ZkIDPublicKey(iss, addressSeed);
    const authKey = AuthenticationKey.fromPublicKey({ publicKey: new AnyPublicKey(this.publicKey) });
    const derivedAddress = authKey.derivedAddress();
    this.accountAddress = address ?? derivedAddress;
    this.uidKey = uidKey;
    this.uidVal = uidVal;
    this.aud = aud;
    this.proof = proof;
    this.jwtHeader = jwtHeader

    this.signingScheme = SigningScheme.SingleKey;
    const pepperBytes = Hex.fromHexInput(pepper).toUint8Array();
    if (pepperBytes.length !== GrothZkIDAccount.PEPPER_LENGTH) {
      throw new Error(`Pepper length in bytes should be ${GrothZkIDAccount.PEPPER_LENGTH}`);
    }
    this.pepper = pepperBytes;
  }

  sign(data: HexInput): Signature {

    const { expiryTimestamp } = this.ephemeralAccount;
    const ephemeralPublicKey = this.ephemeralAccount.publicKey;
    const ephemeralSignature = this.ephemeralAccount.sign(data);
    const zkid = new ZkIDSignature({
      jwtHeader: this.jwtHeader,
      openIdSignatureOrZkProof: new OpenIdSignatureOrZkProof(this.proof),
      expiryTimestamp,
      ephemeralPublicKey,
      ephemeralSignature,
    });
    return zkid
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
  }): GrothZkIDAccount {
    const { proof, jwt, ephemeralAccount, pepper } = args;
    const jwtHeader = jwt.split(".")[0];
    const uidKey = args.uidKey ?? "sub";

    const jwtPayload = jwtDecode<JwtPayload & { [key: string]: string }>(jwt);
    const iss = jwtPayload.iss!;
    if (typeof jwtPayload.aud !== "string") {
      throw new Error("aud was not found or an array of values");
    }
    const aud = jwtPayload.aud!;
    const uidVal = jwtPayload[uidKey];
    return new GrothZkIDAccount({
      proof,
      ephemeralAccount,
      iss,
      uidKey,
      uidVal,
      aud,
      pepper,
      jwtHeader
    });
  }
}
