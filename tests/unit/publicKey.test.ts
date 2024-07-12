// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AnyPublicKey, Ed25519PublicKey, KeylessPublicKey, Secp256k1PublicKey } from "../../src";
import { ed25519, secp256k1TestObject } from "./helper";

describe("PublicKey", () => {
  it.each([
    ["ed25519", new Ed25519PublicKey(ed25519.publicKey)],
    ["secp256k1", new Secp256k1PublicKey(secp256k1TestObject.publicKey)],
    ["singleKey", new AnyPublicKey(new Ed25519PublicKey(ed25519.publicKey))],
    ["keyless", new KeylessPublicKey("google", ed25519.publicKey)],
  ])("recognizes %s public keys from other public keys", (_name, publicKey) => {
    expect(Ed25519PublicKey.isInstance(publicKey)).toBe(publicKey instanceof Ed25519PublicKey);
    expect(Secp256k1PublicKey.isInstance(publicKey)).toBe(publicKey instanceof Secp256k1PublicKey);
    expect(AnyPublicKey.isInstance(publicKey)).toBe(publicKey instanceof AnyPublicKey);
    expect(KeylessPublicKey.isInstance(publicKey)).toBe(publicKey instanceof KeylessPublicKey);
  });
});
