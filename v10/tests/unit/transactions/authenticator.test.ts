// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { Deserializer } from "../../../src/bcs/deserializer.js";
import { Serializer } from "../../../src/bcs/serializer.js";
import { Ed25519PrivateKey, Ed25519PublicKey, type Ed25519Signature } from "../../../src/crypto/ed25519.js";
import { AnyPublicKey, AnySignature } from "../../../src/crypto/single-key.js";
import {
  AccountAbstractionMessage,
  AccountAuthenticatorAbstraction,
  AccountAuthenticatorEd25519,
  AccountAuthenticatorSingleKey,
} from "../../../src/transactions/authenticator.js";

const ed25519Fixtures = {
  privateKey: "ed25519-priv-0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5",
  publicKey: "0xde19e5d1880cac87d57484ce9ed2e84cf0f9599f12e7cc3a52e4e7657a763f2c",
  message: "68656c6c6f20776f726c64",
};

describe("AccountAuthenticatorEd25519", () => {
  it("serializes and deserializes", () => {
    const publicKey = new Ed25519PublicKey(ed25519Fixtures.publicKey);
    const privateKey = new Ed25519PrivateKey(ed25519Fixtures.privateKey);
    const signature = privateKey.sign(ed25519Fixtures.message);

    const auth = new AccountAuthenticatorEd25519(publicKey, signature as Ed25519Signature);
    const serializer = new Serializer();
    auth.serialize(serializer);
    const bytes = serializer.toUint8Array();

    const des = new Deserializer(bytes);
    // Skip the variant index
    des.deserializeUleb128AsU32();
    const restored = AccountAuthenticatorEd25519.load(des);
    expect(restored.public_key.toString()).toEqual(publicKey.toString());
    expect(restored.signature.toString()).toEqual(signature.toString());
  });
});

describe("AccountAuthenticatorSingleKey", () => {
  it("serializes and deserializes", () => {
    const privateKey = new Ed25519PrivateKey(ed25519Fixtures.privateKey);
    const anyPubKey = new AnyPublicKey(privateKey.publicKey());
    const rawSig = privateKey.sign(ed25519Fixtures.message);
    const anySig = new AnySignature(rawSig);

    const auth = new AccountAuthenticatorSingleKey(anyPubKey, anySig);
    const serializer = new Serializer();
    auth.serialize(serializer);
    const bytes = serializer.toUint8Array();

    const des = new Deserializer(bytes);
    des.deserializeUleb128AsU32(); // skip variant
    const restored = AccountAuthenticatorSingleKey.load(des);
    expect(restored.public_key.toString()).toEqual(anyPubKey.toString());
  });
});

describe("AccountAuthenticatorAbstraction", () => {
  it("creates with valid function info", () => {
    const auth = new AccountAuthenticatorAbstraction(
      "0x1::permissioned_delegation::authenticate",
      new Uint8Array(32),
      new Uint8Array(64),
    );
    expect(auth.functionInfo).toBe("0x1::permissioned_delegation::authenticate");
  });

  it("throws on invalid function info", () => {
    expect(() => new AccountAuthenticatorAbstraction("invalid", new Uint8Array(32), new Uint8Array(64))).toThrow(
      "Invalid function info",
    );
  });

  it("serializes and deserializes without account identity", () => {
    const auth = new AccountAuthenticatorAbstraction(
      "0x1::permissioned_delegation::authenticate",
      new Uint8Array(32),
      new Uint8Array(64),
    );
    const serializer = new Serializer();
    auth.serialize(serializer);
    const bytes = serializer.toUint8Array();

    const des = new Deserializer(bytes);
    des.deserializeUleb128AsU32(); // skip outer variant
    const restored = AccountAuthenticatorAbstraction.load(des);
    expect(restored.functionInfo).toBe("0x1::permissioned_delegation::authenticate");
  });
});

describe("AccountAbstractionMessage", () => {
  it("serializes and deserializes", () => {
    const message = new AccountAbstractionMessage(
      new Uint8Array([1, 2, 3]),
      "0x1::permissioned_delegation::authenticate",
    );
    const serializer = new Serializer();
    message.serialize(serializer);
    const bytes = serializer.toUint8Array();

    const des = new Deserializer(bytes);
    const restored = AccountAbstractionMessage.deserialize(des);
    expect(restored.functionInfo).toBe("0x1::permissioned_delegation::authenticate");
  });
});
