// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Deserializer, Serializer } from "../../src/bcs/index.js";
import { Ed25519PrivateKey, Ed25519PublicKey, Ed25519Signature } from "../../src/core/crypto/ed25519.js";
import { Secp256k1PrivateKey, Secp256k1PublicKey, Secp256k1Signature } from "../../src/core/crypto/secp256k1.js";
import { AnyPublicKey, AnySignature } from "../../src/core/crypto/singleKey.js";
import { Signature } from "../../src/core/crypto/signature.js";
import { AnyPublicKeyVariant } from "../../src/types/index.js";

const ED_PRIV = new Ed25519PrivateKey(new Uint8Array(32).fill(3));
const ED_PUB = ED_PRIV.publicKey();
const SECP_PUB = new Secp256k1PrivateKey(new Uint8Array(32).fill(5)).publicKey();

describe("AnyPublicKey constructor", () => {
  it("picks the Ed25519 variant for an Ed25519 inner key", () => {
    const pk = new AnyPublicKey(ED_PUB);
    expect(pk.variant).toBe(AnyPublicKeyVariant.Ed25519);
  });

  it("picks the Secp256k1 variant for a Secp256k1 inner key", () => {
    const pk = new AnyPublicKey(SECP_PUB);
    expect(pk.variant).toBe(AnyPublicKeyVariant.Secp256k1);
  });

  it("honors an explicit variant override", () => {
    // Even though the inner key is Ed25519, the explicit variant wins.
    const pk = new AnyPublicKey(ED_PUB, AnyPublicKeyVariant.Secp256k1);
    expect(pk.variant).toBe(AnyPublicKeyVariant.Secp256k1);
  });

  it("rejects an unsupported inner public key type", () => {
    class FakePk extends Ed25519PublicKey {}
    // Need an inner type whose constructor isn't recognized; subclassing
    // Ed25519PublicKey still passes `instanceof Ed25519PublicKey`, so we
    // build a bare object pretending to be a PublicKey.
    const bogus = Object.create(null) as never;
    expect(() => new AnyPublicKey(bogus)).toThrow(/Unsupported public key type/);
    // Touching FakePk to avoid an unused-import lint warning.
    expect(new FakePk(ED_PUB.toUint8Array())).toBeInstanceOf(Ed25519PublicKey);
  });
});

describe("AnyPublicKey.deserialize", () => {
  it("roundtrips an Ed25519-variant AnyPublicKey", () => {
    const original = new AnyPublicKey(ED_PUB);
    const serializer = new Serializer();
    original.serialize(serializer);
    const back = AnyPublicKey.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(back.variant).toBe(AnyPublicKeyVariant.Ed25519);
    expect((back.publicKey as Ed25519PublicKey).toUint8Array()).toEqual(ED_PUB.toUint8Array());
  });

  it("roundtrips a Secp256k1-variant AnyPublicKey", () => {
    const original = new AnyPublicKey(SECP_PUB);
    const serializer = new Serializer();
    original.serialize(serializer);
    const back = AnyPublicKey.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(back.variant).toBe(AnyPublicKeyVariant.Secp256k1);
    expect((back.publicKey as Secp256k1PublicKey).toUint8Array()).toEqual(SECP_PUB.toUint8Array());
  });

  it("throws a descriptive error for an unknown variant index", () => {
    // 99 is not a registered AnyPublicKeyVariant.
    const serializer = new Serializer();
    serializer.serializeU32AsUleb128(99);
    expect(() => AnyPublicKey.deserialize(new Deserializer(serializer.toUint8Array()))).toThrow(
      /Unknown variant index for AnyPublicKey/,
    );
  });
});

describe("AnyPublicKey static checks", () => {
  it("isInstance returns true for an AnyPublicKey", () => {
    expect(AnyPublicKey.isInstance(new AnyPublicKey(ED_PUB))).toBe(true);
  });

  it("isInstance returns false for a bare Ed25519PublicKey", () => {
    expect(AnyPublicKey.isInstance(ED_PUB)).toBe(false);
  });

  it("isEd25519 / isSecp256k1PublicKey reflect the inner key type", () => {
    const edAny = new AnyPublicKey(ED_PUB);
    const secpAny = new AnyPublicKey(SECP_PUB);
    expect(edAny.isEd25519()).toBe(true);
    expect(edAny.isSecp256k1PublicKey()).toBe(false);
    expect(secpAny.isEd25519()).toBe(false);
    expect(secpAny.isSecp256k1PublicKey()).toBe(true);
  });

  it("authKey is derived from the BCS bytes under the SingleKey scheme", () => {
    const pk = new AnyPublicKey(ED_PUB);
    const ak = pk.authKey();
    // SingleKey scheme byte = 0x02 (see AuthenticationKey.fromSchemeAndBytes).
    // We verify the auth key is 32 bytes and stable across calls.
    expect(ak.data.toUint8Array().length).toBe(32);
    expect(pk.authKey().data.toUint8Array()).toEqual(ak.data.toUint8Array());
  });

  it("toUint8Array returns the BCS-encoded bytes", () => {
    const pk = new AnyPublicKey(ED_PUB);
    expect(pk.toUint8Array()).toEqual(pk.bcsToBytes());
  });
});

describe("AnyPublicKey.verifySignature", () => {
  it("verifies a real Ed25519 signature via the inner key", () => {
    const message = "0xfeedface";
    const sig = ED_PRIV.sign(message);
    const pk = new AnyPublicKey(ED_PUB);
    expect(pk.verifySignature({ message, signature: new AnySignature(sig) })).toBe(true);
  });

  it("returns false when the signature does not match the message", () => {
    const sig = ED_PRIV.sign("0xfeedface");
    const pk = new AnyPublicKey(ED_PUB);
    expect(pk.verifySignature({ message: "0xdeadbeef", signature: new AnySignature(sig) })).toBe(false);
  });
});

describe("AnyPublicKey.verifySignatureAsync", () => {
  it("returns false when the signature is not an AnySignature (silent default)", async () => {
    const pk = new AnyPublicKey(ED_PUB);
    // Pass a non-AnySignature; the function returns false without throwing.
    const rawSig = new Ed25519Signature(new Uint8Array(64));
    const ok = await pk.verifySignatureAsync({
      aptosConfig: {} as never,
      message: "0xfeedface",
      signature: rawSig,
    });
    expect(ok).toBe(false);
  });

  it("throws with throwErrorWithReason when the signature is not an AnySignature", async () => {
    const pk = new AnyPublicKey(ED_PUB);
    const rawSig = new Ed25519Signature(new Uint8Array(64));
    await expect(
      pk.verifySignatureAsync({
        aptosConfig: {} as never,
        message: "0xfeedface",
        signature: rawSig,
        options: { throwErrorWithReason: true },
      }),
    ).rejects.toThrow(/Signature must be an instance of AnySignature/);
  });
});

describe("AnySignature constructor", () => {
  it("infers the Ed25519 variant from an Ed25519Signature", () => {
    const sig = new AnySignature(new Ed25519Signature(new Uint8Array(64)));
    // Serializing exposes the variant via the ULEB128 prefix.
    const serializer = new Serializer();
    sig.serialize(serializer);
    expect(serializer.toUint8Array()[0]).toBe(0); // AnySignatureVariant.Ed25519 = 0
  });

  it("infers the Secp256k1 variant from a Secp256k1Signature", () => {
    const sig = new AnySignature(new Secp256k1Signature(new Uint8Array(64)));
    const serializer = new Serializer();
    sig.serialize(serializer);
    expect(serializer.toUint8Array()[0]).toBe(1); // AnySignatureVariant.Secp256k1 = 1
  });

  it("rejects an unsupported inner signature type", () => {
    class UnknownSig extends Signature {
      bcsToBytes(): Uint8Array {
        return new Uint8Array();
      }
      toUint8Array(): Uint8Array {
        return new Uint8Array();
      }
      serialize(): void {}
    }
    expect(() => new AnySignature(new UnknownSig() as unknown as Signature)).toThrow(/Unsupported signature type/);
  });
});

describe("AnySignature.deserialize", () => {
  it("throws for an unknown variant index", () => {
    const serializer = new Serializer();
    serializer.serializeU32AsUleb128(99);
    expect(() => AnySignature.deserialize(new Deserializer(serializer.toUint8Array()))).toThrow(
      /Unknown variant index for AnySignature/,
    );
  });
});

describe("AnySignature.isInstance", () => {
  it("returns true for an AnySignature", () => {
    expect(AnySignature.isInstance(new AnySignature(new Ed25519Signature(new Uint8Array(64))))).toBe(true);
  });

  it("returns false for a bare signature", () => {
    expect(AnySignature.isInstance(new Ed25519Signature(new Uint8Array(64)))).toBe(false);
  });
});

describe("AnySignature.toUint8Array", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Silence the deprecation warning emitted on every toUint8Array() call so
    // the test output stays clean; we still assert it fired.
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("returns the BCS bytes and emits a deprecation warning", () => {
    const sig = new AnySignature(new Ed25519Signature(new Uint8Array(64).fill(7)));
    const bytes = sig.toUint8Array();
    expect(bytes).toEqual(sig.bcsToBytes());
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/Use AnySignature\.bcsToBytes/));
  });
});
