// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { Deserializer } from "../../../../src/bcs/index.js";
import { Ed25519Signature } from "../../../../src/core/crypto/ed25519.js";
import { EphemeralSignature } from "../../../../src/core/crypto/ephemeral.js";
import {
  EphemeralCertificate,
  KeylessConfiguration,
  KeylessPublicKey,
  KeylessSignature,
  verifyKeylessSignatureWithJwkAndConfig,
  ZeroKnowledgeSig,
  ZkProof,
  Groth16Zkp,
} from "../../../../src/core/crypto/keyless.js";
import { Hex } from "../../../../src/core/hex.js";
import { KeylessErrorType } from "../../../../src/errors/index.js";
import { EphemeralCertificateVariant, ZkpVariant } from "../../../../src/types/types.js";
import { keylessTestConfig, keylessTestObject } from "../../helper.js";

function fixtureSignature(): KeylessSignature {
  return KeylessSignature.deserialize(new Deserializer(Hex.hexInputToUint8Array(keylessTestObject.signatureHex)));
}

describe("verifyKeylessSignatureWithJwkAndConfig — error branches", () => {
  const publicKey = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
  const message = Hex.hexInputToUint8Array(keylessTestObject.messageEncoded);

  it("rejects non-keyless signature types", () => {
    expect(() =>
      verifyKeylessSignatureWithJwkAndConfig({
        publicKey,
        message,
        signature: new Ed25519Signature(new Uint8Array(64)),
        keylessConfig: keylessTestConfig,
        jwk: keylessTestObject.jwk,
      }),
    ).toThrow(expect.objectContaining({ type: KeylessErrorType.SIGNATURE_TYPE_INVALID }));
  });

  it("rejects expired signatures based on expiryDateSecs", () => {
    const base = fixtureSignature();
    const expired = new KeylessSignature({
      jwtHeader: base.jwtHeader,
      ephemeralCertificate: base.ephemeralCertificate,
      expiryDateSecs: 1,
      ephemeralPublicKey: base.ephemeralPublicKey,
      ephemeralSignature: base.ephemeralSignature,
    });

    expect(() =>
      verifyKeylessSignatureWithJwkAndConfig({
        publicKey,
        message,
        signature: expired,
        keylessConfig: keylessTestConfig,
        jwk: keylessTestObject.jwk,
      }),
    ).toThrow(expect.objectContaining({ type: KeylessErrorType.SIGNATURE_EXPIRED }));
  });

  it("rejects proofs whose expHorizonSecs exceeds the configured maximum", () => {
    const base = fixtureSignature();
    const zk = base.ephemeralCertificate.signature as ZeroKnowledgeSig;
    const highHorizon = new ZeroKnowledgeSig({
      proof: zk.proof,
      expHorizonSecs: keylessTestConfig.maxExpHorizonSecs + 1,
      trainingWheelsSignature: zk.trainingWheelsSignature,
    });
    const sig = new KeylessSignature({
      jwtHeader: base.jwtHeader,
      ephemeralCertificate: new EphemeralCertificate(highHorizon, EphemeralCertificateVariant.ZkProof),
      expiryDateSecs: base.expiryDateSecs,
      ephemeralPublicKey: base.ephemeralPublicKey,
      ephemeralSignature: base.ephemeralSignature,
    });

    expect(() =>
      verifyKeylessSignatureWithJwkAndConfig({
        publicKey,
        message,
        signature: sig,
        keylessConfig: keylessTestConfig,
        jwk: keylessTestObject.jwk,
      }),
    ).toThrow(expect.objectContaining({ type: KeylessErrorType.MAX_EXPIRY_HORIZON_EXCEEDED }));
  });

  it("rejects invalid ephemeral signatures", () => {
    const base = fixtureSignature();
    const badEphemeral = new KeylessSignature({
      jwtHeader: base.jwtHeader,
      ephemeralCertificate: base.ephemeralCertificate,
      expiryDateSecs: base.expiryDateSecs,
      ephemeralPublicKey: base.ephemeralPublicKey,
      ephemeralSignature: new EphemeralSignature(new Ed25519Signature(new Uint8Array(64).fill(0xff))),
    });

    expect(() =>
      verifyKeylessSignatureWithJwkAndConfig({
        publicKey,
        message,
        signature: badEphemeral,
        keylessConfig: keylessTestConfig,
        jwk: keylessTestObject.jwk,
      }),
    ).toThrow(expect.objectContaining({ type: KeylessErrorType.EPHEMERAL_SIGNATURE_VERIFICATION_FAILED }));
  });

  it("rejects proofs that fail Groth16 verification", () => {
    const base = fixtureSignature();
    const zk = base.ephemeralCertificate.signature as ZeroKnowledgeSig;
    const badProof = new ZeroKnowledgeSig({
      proof: new ZkProof(
        new Groth16Zkp({ a: new Uint8Array(32), b: new Uint8Array(64), c: new Uint8Array(32) }),
        ZkpVariant.Groth16,
      ),
      expHorizonSecs: zk.expHorizonSecs,
      trainingWheelsSignature: zk.trainingWheelsSignature,
    });
    const sig = new KeylessSignature({
      jwtHeader: base.jwtHeader,
      ephemeralCertificate: new EphemeralCertificate(badProof, EphemeralCertificateVariant.ZkProof),
      expiryDateSecs: base.expiryDateSecs,
      ephemeralPublicKey: base.ephemeralPublicKey,
      ephemeralSignature: base.ephemeralSignature,
    });

    expect(() =>
      verifyKeylessSignatureWithJwkAndConfig({
        publicKey,
        message,
        signature: sig,
        keylessConfig: keylessTestConfig,
        jwk: keylessTestObject.jwk,
      }),
    ).toThrow(expect.objectContaining({ type: KeylessErrorType.PROOF_VERIFICATION_FAILED }));
  });

  it("requires training wheels signatures when configured on-chain", () => {
    const base = fixtureSignature();
    const zk = base.ephemeralCertificate.signature as ZeroKnowledgeSig;
    const noTrainingWheels = new ZeroKnowledgeSig({
      proof: zk.proof,
      expHorizonSecs: zk.expHorizonSecs,
    });
    const sig = new KeylessSignature({
      jwtHeader: base.jwtHeader,
      ephemeralCertificate: new EphemeralCertificate(noTrainingWheels, EphemeralCertificateVariant.ZkProof),
      expiryDateSecs: base.expiryDateSecs,
      ephemeralPublicKey: base.ephemeralPublicKey,
      ephemeralSignature: base.ephemeralSignature,
    });

    expect(() =>
      verifyKeylessSignatureWithJwkAndConfig({
        publicKey,
        message,
        signature: sig,
        keylessConfig: keylessTestConfig,
        jwk: keylessTestObject.jwk,
      }),
    ).toThrow(expect.objectContaining({ type: KeylessErrorType.TRAINING_WHEELS_SIGNATURE_MISSING }));
  });

  it("rejects invalid training wheels signatures", () => {
    const base = fixtureSignature();
    const zk = base.ephemeralCertificate.signature as ZeroKnowledgeSig;
    const badTraining = new ZeroKnowledgeSig({
      proof: zk.proof,
      expHorizonSecs: zk.expHorizonSecs,
      trainingWheelsSignature: new EphemeralSignature(new Ed25519Signature(new Uint8Array(64).fill(0xaa))),
    });
    const sig = new KeylessSignature({
      jwtHeader: base.jwtHeader,
      ephemeralCertificate: new EphemeralCertificate(badTraining, EphemeralCertificateVariant.ZkProof),
      expiryDateSecs: base.expiryDateSecs,
      ephemeralPublicKey: base.ephemeralPublicKey,
      ephemeralSignature: base.ephemeralSignature,
    });

    expect(() =>
      verifyKeylessSignatureWithJwkAndConfig({
        publicKey,
        message,
        signature: sig,
        keylessConfig: keylessTestConfig,
        jwk: keylessTestObject.jwk,
      }),
    ).toThrow(expect.objectContaining({ type: KeylessErrorType.TRAINING_WHEELS_SIGNATURE_VERIFICATION_FAILED }));
  });

  it("KeylessSignature.getJwkKid returns the kid from the embedded JWT header", () => {
    const sig = fixtureSignature();
    expect(sig.getJwkKid()).toBe("test-rsa");
  });

  it("skips training wheels verification when config has no training wheels pubkey", () => {
    const configNoWheels = new KeylessConfiguration({
      verificationKey: keylessTestConfig.verificationKey,
    });
    const sig = fixtureSignature();

    expect(() =>
      verifyKeylessSignatureWithJwkAndConfig({
        publicKey,
        message,
        signature: sig,
        keylessConfig: configNoWheels,
        jwk: keylessTestObject.jwk,
      }),
    ).not.toThrow();
  });
});
