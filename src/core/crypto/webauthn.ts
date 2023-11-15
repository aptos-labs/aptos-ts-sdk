// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 } from "@noble/hashes/sha3";
import { Signature } from "./asymmetricCrypto";
import { Deserializer, Serializer } from "../../bcs";
import { Hex } from "../hex";
import { HexInput } from "../../types";
import { P256Signature } from "./p256";

export class PartialAuthenticatorAssertionResponse {
  readonly signature: P256Signature;

  readonly authenticatorData: Uint8Array;

  readonly clientDataJSON: Uint8Array;

  constructor(signature: HexInput, authenticatorData: HexInput, clientDataJSON: HexInput) {
    this.signature = new P256Signature(signature);

    this.authenticatorData = Hex.fromHexInput(authenticatorData).toUint8Array();

    this.clientDataJSON = Hex.fromHexInput(clientDataJSON).toUint8Array();
  }
}

export type ClientDataJSON = {
  type: string;
  challenge: string;
  origin: string;
  crossOrigin?: boolean;
  tokenBinding?: {
    id?: string;
    status: "present" | "supported" | "not-supported";
  };
};

/**
 * A signature of WebAuthn transaction
 */
export class WebAuthnSignature extends Signature {
  /**
   * The signature bytes
   */
  readonly paar: PartialAuthenticatorAssertionResponse;

  /**
   * Create a new Signature instance from a Uint8Array or String.
   *
   * @param hexInput A HexInput (string or Uint8Array)
   */
  constructor(signature: HexInput, authenticatorData: HexInput, clientDataJSON: HexInput) {
    super();
    this.paar = new PartialAuthenticatorAssertionResponse(signature, authenticatorData, clientDataJSON);
  }

  /**
   * Get the signature in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the signature
   */
  toUint8Array(): Uint8Array {
    return this.paar.signature.toUint8Array();
  }

  /**
   * Get the signature as a hex string with the 0x prefix.
   *
   * @returns string representation of the signature
   */
  toString(): string {
    return this.paar.toString();
  }

  getCollectedClientData(): ClientDataJSON {
    const jsonString = Buffer.from(this.paar.clientDataJSON).toString("utf8");
    return JSON.parse(jsonString);
  }

  getVerificationData(): Uint8Array {
    const clientDataJSONHash = sha3_256(this.paar.clientDataJSON);

    const mergedArray = new Uint8Array(clientDataJSONHash.length + this.paar.authenticatorData.length);
    mergedArray.set(clientDataJSONHash);
    mergedArray.set(this.paar.authenticatorData, clientDataJSONHash.length);

    return mergedArray;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeVectorBytes([
      this.paar.signature.toUint8Array(),
      this.paar.authenticatorData,
      this.paar.clientDataJSON,
    ]);
  }

  static deserialize(deserializer: Deserializer): WebAuthnSignature {
    const vectorBytes = deserializer.deserializeVectorBytes();
    if (vectorBytes.length !== 3) {
      throw Error();
    }
    return new WebAuthnSignature(vectorBytes[0], vectorBytes[1], vectorBytes[2]);
  }

  static load(deserializer: Deserializer): WebAuthnSignature {
    const vectorBytes = deserializer.deserializeVectorBytes();
    if (vectorBytes.length !== 3) {
      throw Error();
    }
    return new WebAuthnSignature(vectorBytes[0], vectorBytes[1], vectorBytes[2]);
  }
}
