// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AuthenticationKey,
  Deserializer,
  Ed25519PublicKey,
  HexInput,
  MultiEd25519PublicKey,
  PublicKey,
  Serializer,
  Signature,
} from "../../src";
import { ed25519, multiEd25519PkTestObject } from "./helper";

describe("AuthenticationKey", () => {
  it("should create an instance with save the hexinput correctly", () => {
    const authKey = new AuthenticationKey({ data: ed25519.authKey });
    expect(authKey).toBeInstanceOf(AuthenticationKey);
    expect(authKey.data.toString()).toEqual(ed25519.authKey);
  });

  it("should throw an error with invalid hex input length", () => {
    const invalidHexInput = "0123456789abcdef"; // Invalid length
    expect(() => new AuthenticationKey({ data: invalidHexInput })).toThrowError(
      "Authentication Key length should be 32",
    );
  });

  it("should create AuthenticationKey from Ed25519PublicKey", () => {
    const publicKey = new Ed25519PublicKey({ hexInput: ed25519.publicKey });
    const authKey = AuthenticationKey.fromPublicKey({ publicKey });
    expect(authKey).toBeInstanceOf(AuthenticationKey);
    expect(authKey.data.toString()).toEqual(ed25519.authKey);
  });

  it("should create AuthenticationKey from MultiPublicKey", () => {
    // create the MultiPublicKey
    const edPksArray = [];
    for (let i = 0; i < multiEd25519PkTestObject.public_keys.length; i += 1) {
      edPksArray.push(
        new Ed25519PublicKey({
          hexInput: multiEd25519PkTestObject.public_keys[i],
        }),
      );
    }

    const pubKeyMultiSig = new MultiEd25519PublicKey({
      publicKeys: edPksArray,
      threshold: multiEd25519PkTestObject.threshold,
    });

    const authKey = AuthenticationKey.fromPublicKey({
      publicKey: pubKeyMultiSig,
    });
    expect(authKey).toBeInstanceOf(AuthenticationKey);
    expect(authKey.data.toString()).toEqual("0xa81cfac3df59920593ff417b45fc347ead3d88f8e25112c0488d34d7c9eb20af");
  });

  it("should derive an AccountAddress from AuthenticationKey with same string", () => {
    const authKey = new AuthenticationKey({ data: ed25519.authKey });
    const accountAddress = authKey.derivedAddress();
    expect(accountAddress.toString()).toEqual(ed25519.authKey);
  });

  it("should throw an error on an unsupported key", () => {
    /* eslint-disable class-methods-use-this */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    class NewPublicKey extends PublicKey {
      deserialize(deserializer: Deserializer): PublicKey {
        throw new Error("Not implemented");
      }

      serialize(serializer: Serializer): void {
        throw new Error("Not implemented");
      }

      toUint8Array(): Uint8Array {
        throw new Error("Not implemented");
      }

      toString(): string {
        throw new Error("Not implemented");
      }

      verifySignature(args: { message: HexInput; signature: Signature }): boolean {
        throw new Error("Not implemented");
      }
    }
    /* eslint-enable class-methods-use-this */
    /* eslint-enable @typescript-eslint/no-unused-vars */

    expect(() => AuthenticationKey.fromPublicKey({ publicKey: new NewPublicKey() })).toThrowError(
      "No supported authentication scheme for public key",
    );
  });
});
