// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { Deserializer, Serializer } from "../../src/bcs/index.js";
import { keylessTestConfig, keylessTestObject } from "./helper.js";
import { Account } from "../../src/account/Account.js";
import { Ed25519Signature } from "../../src/core/crypto/ed25519.js";
import { AptosConfig } from "../../src/api/aptosConfig.js";
import { Network } from "../../src/utils/apiEndpoints.js";
import {
  getIssAudAndUidVal,
  Groth16Zkp,
  KeylessPublicKey,
  KeylessSignature,
  MoveJWK,
  verifyKeylessSignature,
  verifyKeylessSignatureWithJwkAndConfig,
  ZeroKnowledgeSig,
  ZkProof,
} from "../../src/core/crypto/keyless.js";
import { Hex } from "../../src/core/hex.js";
import { ZkpVariant } from "../../src/types/types.js";
import { KeylessError, KeylessErrorType } from "../../src/errors/index.js";

describe("core/crypto/keyless — additional coverage", () => {
  it("getIssAudAndUidVal extracts iss, aud, and uid from a JWT", () => {
    const { iss, aud, uidVal } = getIssAudAndUidVal({ jwt: keylessTestObject.JWT, uidKey: "email" });
    expect(iss).toBe(keylessTestObject.iss);
    expect(aud).toBe("test-keyless-dapp");
    expect(uidVal).toBe("test@aptoslabs.com");
  });

  it("Groth16Zkp and ZkProof BCS round-trip", () => {
    const zkp = new Groth16Zkp({
      a: new Uint8Array(32).fill(1),
      b: new Uint8Array(64).fill(2),
      c: new Uint8Array(32).fill(3),
    });
    const wrapped = new ZkProof(zkp, ZkpVariant.Groth16);

    const s = new Serializer();
    wrapped.serialize(s);
    const restored = ZkProof.deserialize(new Deserializer(s.toUint8Array()));

    expect(restored.variant).toBe(ZkpVariant.Groth16);
  });

  it("ZeroKnowledgeSig round-trips via deserialize", () => {
    const bytes = keylessTestObject.proof.bcsToBytes();
    const restored = ZeroKnowledgeSig.deserialize(new Deserializer(bytes));
    expect(restored.expHorizonSecs).toBe(keylessTestObject.proof.expHorizonSecs);
  });

  it("KeylessConfiguration exposes the verification key", () => {
    expect(keylessTestConfig.verificationKey).toBeDefined();
    expect(keylessTestConfig.trainingWheelsPubkey).toBeDefined();
  });

  it("KeylessPublicKey.fromJwtAndPepper matches the fixture public key", () => {
    const pk = KeylessPublicKey.fromJwtAndPepper({
      jwt: keylessTestObject.JWT,
      pepper: keylessTestObject.pepper,
    });
    expect(pk.toString()).toBe(keylessTestObject.publicKey);
  });

  it("MoveJWK.toScalar rejects non-RS256 algorithms", () => {
    const jwk = new MoveJWK({ kid: "k", kty: "RSA", alg: "HS256", e: "AQAB", n: "abc" });
    expect(() => jwk.toScalar()).toThrow(expect.objectContaining({ type: KeylessErrorType.PROOF_VERIFICATION_FAILED }));
  });

  it("MoveJWK.fromMoveStruct deserializes embedded BCS data", () => {
    const bytes = keylessTestObject.jwk.bcsToBytes();
    const restored = MoveJWK.fromMoveStruct({
      variant: { data: Hex.fromHexInput(bytes).toString() },
    } as never);
    expect(restored.kid).toBe(keylessTestObject.jwk.kid);
  });

  it("MoveJWK round-trips through BCS", () => {
    const bytes = keylessTestObject.jwk.bcsToBytes();
    const restored = MoveJWK.deserialize(new Deserializer(bytes));
    expect(restored.kid).toBe(keylessTestObject.jwk.kid);
    expect(restored.kty).toBe(keylessTestObject.jwk.kty);
  });

  it("KeylessPublicKey authKey and derivedAddress are stable for fixture inputs", () => {
    const pk = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
    expect(pk.authKey().toString()).toBe(keylessTestObject.authKey);
    expect(pk.authKey().derivedAddress().toString()).toBe(keylessTestObject.address);
  });

  it("KeylessPublicKey BCS round-trips via deserialize", () => {
    const original = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
    const bytes = original.bcsToBytes();
    const restored = KeylessPublicKey.deserialize(new Deserializer(bytes));
    expect(restored.toString()).toBe(original.toString());
    expect(KeylessPublicKey.isPublicKey(restored)).toBe(true);
  });

  it("verifySignature returns false (not throw) when verification fails with KeylessError", () => {
    const publicKey = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
    const badSignature = KeylessSignature.deserialize(
      new Deserializer(Hex.hexInputToUint8Array(keylessTestObject.signatureHex)),
    );
    const ok = publicKey.verifySignature({
      message: new TextEncoder().encode("wrong message"),
      signature: badSignature,
      jwk: keylessTestObject.jwk,
      keylessConfig: keylessTestConfig,
    });
    expect(ok).toBe(false);
  });

  it("getIssAudAndUidVal throws KeylessError when aud is not a string", () => {
    const enc = (obj: unknown) =>
      Buffer.from(JSON.stringify(obj)).toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const jwt = `${enc({ alg: "RS256" })}.${enc({ iss: "x", aud: ["a", "b"], sub: "y" })}.x`;
    expect(() => getIssAudAndUidVal({ jwt })).toThrow(KeylessError);
  });

  it("getIssAudAndUidVal throws KeylessError when iss is missing from the payload", () => {
    const enc = (obj: unknown) =>
      Buffer.from(JSON.stringify(obj)).toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const jwt = `${enc({ alg: "RS256" })}.${enc({ aud: "x", sub: "y" })}.x`;
    expect(() => getIssAudAndUidVal({ jwt })).toThrow(KeylessError);
  });

  it("getIssAudAndUidVal returns undefined uidVal when the uid key is absent", () => {
    const { uidVal } = getIssAudAndUidVal({ jwt: keylessTestObject.JWT, uidKey: "missing" });
    expect(uidVal).toBeUndefined();
  });

  it("getIssAudAndUidVal throws KeylessError on malformed JWT", () => {
    expect(() => getIssAudAndUidVal({ jwt: "not-a-jwt" })).toThrow(KeylessError);
  });

  it("fromJwtAndPepper throws when iss or aud is missing", () => {
    const enc = (obj: unknown) =>
      Buffer.from(JSON.stringify(obj)).toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const badIss = `${enc({ alg: "RS256" })}.${enc({ aud: "x", sub: "y" })}.x`;
    const badAud = `${enc({ alg: "RS256" })}.${enc({ iss: "x", sub: "y" })}.x`;

    expect(() => KeylessPublicKey.fromJwtAndPepper({ jwt: badIss, pepper: keylessTestObject.pepper })).toThrow(
      /iss was not found/,
    );
    expect(() => KeylessPublicKey.fromJwtAndPepper({ jwt: badAud, pepper: keylessTestObject.pepper })).toThrow(
      /aud was not found/,
    );
  });

  it("KeylessPublicKey.isInstance recognizes duck-typed keyless keys", () => {
    const pk = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
    expect(KeylessPublicKey.isInstance(pk)).toBe(true);
    expect(KeylessPublicKey.isInstance(Account.generate().publicKey)).toBe(false);
  });

  it("verifyKeylessSignature returns false for non-keyless signature types", async () => {
    const publicKey = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
    const aptosConfig = new AptosConfig({ network: Network.LOCAL });
    const ok = await verifyKeylessSignature({
      aptosConfig,
      publicKey,
      message: "hello",
      signature: new Ed25519Signature(new Uint8Array(64)),
      keylessConfig: keylessTestConfig,
      jwk: keylessTestObject.jwk,
    });
    expect(ok).toBe(false);
  });

  it("verifyKeylessSignature rethrows when throwErrorWithReason is set", async () => {
    const publicKey = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
    const aptosConfig = new AptosConfig({ network: Network.LOCAL });

    await expect(
      verifyKeylessSignature({
        aptosConfig,
        publicKey,
        message: "hello",
        signature: new Ed25519Signature(new Uint8Array(64)),
        keylessConfig: keylessTestConfig,
        jwk: keylessTestObject.jwk,
        options: { throwErrorWithReason: true },
      }),
    ).rejects.toThrow();
  });

  it("verifyKeylessSignature returns true for a valid fixture signature", async () => {
    const publicKey = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
    const signature = KeylessSignature.deserialize(
      new Deserializer(Hex.hexInputToUint8Array(keylessTestObject.signatureHex)),
    );
    const aptosConfig = new AptosConfig({ network: Network.LOCAL });

    const ok = await verifyKeylessSignature({
      aptosConfig,
      publicKey,
      message: keylessTestObject.stringMessage,
      signature,
      keylessConfig: keylessTestConfig,
      jwk: keylessTestObject.jwk,
    });
    expect(ok).toBe(true);
  });

  it("verifyKeylessSignatureWithJwkAndConfig accepts a valid fixture signature", () => {
    const publicKey = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
    const signature = KeylessSignature.deserialize(
      new Deserializer(Hex.hexInputToUint8Array(keylessTestObject.signatureHex)),
    );

    expect(() =>
      verifyKeylessSignatureWithJwkAndConfig({
        publicKey,
        message: keylessTestObject.stringMessage,
        signature,
        jwk: keylessTestObject.jwk,
        keylessConfig: keylessTestConfig,
      }),
    ).not.toThrow();
  });

  it("verifyKeylessSignatureWithJwkAndConfig rejects non-keyless signatures", () => {
    const publicKey = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
    expect(() =>
      verifyKeylessSignatureWithJwkAndConfig({
        publicKey,
        message: "hello",
        signature: new Ed25519Signature(new Uint8Array(64)),
        keylessConfig: keylessTestConfig,
        jwk: keylessTestObject.jwk,
      }),
    ).toThrow(KeylessError);
  });
});
