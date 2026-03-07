import { describe, expect, it } from "vitest";
import { Deserializer } from "../../../src/bcs/deserializer.js";
import { Serializer } from "../../../src/bcs/serializer.js";
import { AccountAddress } from "../../../src/core/account-address.js";
import { AuthenticationKey } from "../../../src/core/authentication-key.js";
import { Ed25519PublicKey } from "../../../src/crypto/ed25519.js";
import { SigningScheme } from "../../../src/crypto/types.js";

const ed25519 = {
  publicKey: "0xde19e5d1880cac87d57484ce9ed2e84cf0f9599f12e7cc3a52e4e7657a763f2c",
  authKey: "0x978c213990c4833df71548df7ce49d54c759d6b6d932de22b24d56060b7af2aa",
};

describe("AuthenticationKey", () => {
  it("should create with correct length", () => {
    const bytes = new Uint8Array(32).fill(1);
    const key = new AuthenticationKey({ data: bytes });
    expect(key.toUint8Array().length).toBe(32);
  });

  it("should throw on incorrect length", () => {
    expect(() => new AuthenticationKey({ data: new Uint8Array(16) })).toThrow("length should be 32");
  });

  it("should derive from scheme and bytes (Ed25519)", () => {
    const pubKey = new Ed25519PublicKey(ed25519.publicKey);
    const authKey = AuthenticationKey.fromSchemeAndBytes({
      scheme: SigningScheme.Ed25519,
      input: pubKey.toUint8Array(),
    });
    expect(authKey.data.toString()).toBe(ed25519.authKey);
  });

  it("should derive address from authentication key", () => {
    const bytes = new Uint8Array(32).fill(0xab);
    const key = new AuthenticationKey({ data: bytes });
    const address = key.derivedAddress();
    expect(address).toBeInstanceOf(AccountAddress);
    expect(address.toUint8Array()).toEqual(bytes);
  });

  it("should serialize and deserialize correctly", () => {
    const bytes = new Uint8Array(32).fill(0x42);
    const key = new AuthenticationKey({ data: bytes });
    const serializer = new Serializer();
    key.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = AuthenticationKey.deserialize(deserializer);
    expect(deserialized.toUint8Array()).toEqual(bytes);
  });
});
