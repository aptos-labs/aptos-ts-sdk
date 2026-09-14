// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Unit tests for the on-chain decryption-key (DK) backup encryption scheme and the Ed25519
 * backup-key rotation proof used by the keyless DK-backup entry functions (aptos-core PR #19458).
 *
 * The known-answer vectors pin the HKDF parameters and the `nonce || inner` wire format so any
 * regression (changed SALT/INFO, hash, nonce length/order) fails CI loudly. They MUST also match
 * the Petra/Rust reference implementation — cross-check the vectors against it before release.
 */

import { describe, it, expect } from "vitest";
import { AccountAddress, Ed25519PrivateKey, Hex, RotationProofChallenge } from "@aptos-labs/ts-sdk";
import {
  TwistedEd25519PrivateKey,
  encryptDecryptionKey,
  decryptDecryptionKey,
  deriveDkAeadKey,
  DK_AEAD_SALT,
  DK_AEAD_INFO,
  MAX_ENCRYPTED_DK_BYTES,
} from "../../src/index.js";

// Known-answer vectors (generated with @noble/ciphers + @noble/hashes; see PR #19458 reference impl).
const FIXED_SEED_HEX = "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const EXPECTED_DERIVED_KEY_HEX = "0xb95d89a3d618647d75d7fe3e55feead0ecfe4d539b01cc32167702fccf18aeee";
const FIXED_DK_HEX = "0x01080f161d242b323940474e555c636a71787f868d949ba2a9b0b7bec5ccd3da";
// nonce(24) || XChaCha20Poly1305(deriveDkAeadKey(FIXED_SEED), nonce).encrypt(FIXED_DK)
const FIXED_CIPHERTEXT_HEX =
  "0xfffefdfcfbfaf9f8f7f6f5f4f3f2f1f0efeeedecebeae9e8f47a2e65b9c1a0115a06beb01ebc5cc898a4cbbd5aeb4176f5f246424eed05e78273a559f5e52eef4fce2e978f01dcd2";

const fixedSeed = () => Hex.fromHexInput(FIXED_SEED_HEX).toUint8Array();
const fixedBackupKey = () => new Ed25519PrivateKey(fixedSeed());

describe("DK AEAD encryption", () => {
  it("pins the HKDF salt/info constants and the on-chain ciphertext bound", () => {
    expect(DK_AEAD_SALT).toBe("aptos-ca-aead-v1");
    expect(DK_AEAD_INFO).toBe("confidential assets DK encryption under Ed25519");
    expect(MAX_ENCRYPTED_DK_BYTES).toBe(128);
  });

  describe("deriveDkAeadKey", () => {
    it("matches the known-answer vector and is deterministic", () => {
      const k1 = deriveDkAeadKey(fixedSeed());
      const k2 = deriveDkAeadKey(fixedSeed());
      expect(Hex.fromHexInput(k1).toString()).toBe(EXPECTED_DERIVED_KEY_HEX);
      expect(Hex.fromHexInput(k2).toString()).toBe(EXPECTED_DERIVED_KEY_HEX);
      expect(k1.length).toBe(32);
    });

    it("rejects a seed that is not 32 bytes", () => {
      expect(() => deriveDkAeadKey(new Uint8Array(31))).toThrow(/32-byte Ed25519 seed/);
      expect(() => deriveDkAeadKey(new Uint8Array(64))).toThrow(/32-byte Ed25519 seed/);
    });
  });

  describe("encryptDecryptionKey", () => {
    it("produces a 72-byte `nonce(24) || inner` ciphertext within the on-chain bound", () => {
      const ciphertext = encryptDecryptionKey({
        backupPrivateKey: fixedBackupKey(),
        decryptionKey: TwistedEd25519PrivateKey.generate(),
      });
      expect(ciphertext.length).toBe(24 + 32 + 16); // 72
      expect(ciphertext.length).toBeLessThanOrEqual(MAX_ENCRYPTED_DK_BYTES);
    });

    it("uses a fresh random nonce each call (ciphertexts differ, both decrypt back)", () => {
      const backupPrivateKey = fixedBackupKey();
      const decryptionKey = TwistedEd25519PrivateKey.generate();
      const c1 = encryptDecryptionKey({ backupPrivateKey, decryptionKey });
      const c2 = encryptDecryptionKey({ backupPrivateKey, decryptionKey });
      expect(Hex.fromHexInput(c1).toString()).not.toBe(Hex.fromHexInput(c2).toString());
      for (const c of [c1, c2]) {
        const recovered = decryptDecryptionKey({ backupPrivateKey: fixedBackupKey(), ciphertext: c });
        expect(recovered.toString()).toBe(decryptionKey.toString());
      }
    });
  });

  describe("round-trip", () => {
    it("decrypt(encrypt(dk)) === dk across random keys", () => {
      for (let i = 0; i < 16; i++) {
        const backupPrivateKey = Ed25519PrivateKey.generate();
        const decryptionKey = TwistedEd25519PrivateKey.generate();
        const ciphertext = encryptDecryptionKey({ backupPrivateKey, decryptionKey });
        const recovered = decryptDecryptionKey({ backupPrivateKey, ciphertext });
        expect(recovered.toString()).toBe(decryptionKey.toString());
        // The recovered DK is a usable key.
        expect(() => recovered.publicKey()).not.toThrow();
      }
    });
  });

  describe("decryptDecryptionKey (known-answer)", () => {
    it("decrypts the pinned ciphertext to the expected DK (locks the wire format)", () => {
      const recovered = decryptDecryptionKey({
        backupPrivateKey: fixedBackupKey(),
        ciphertext: Hex.fromHexInput(FIXED_CIPHERTEXT_HEX).toUint8Array(),
      });
      expect(recovered.toString()).toBe(FIXED_DK_HEX);
    });

    it("throws on a tampered ciphertext", () => {
      const ciphertext = Hex.fromHexInput(FIXED_CIPHERTEXT_HEX).toUint8Array();
      ciphertext[30] ^= 0x01; // flip a byte inside the AEAD body
      expect(() => decryptDecryptionKey({ backupPrivateKey: fixedBackupKey(), ciphertext })).toThrow(
        /Failed to decrypt DK/,
      );
    });

    it("throws on a tampered nonce", () => {
      const ciphertext = Hex.fromHexInput(FIXED_CIPHERTEXT_HEX).toUint8Array();
      ciphertext[0] ^= 0x01; // flip a nonce byte
      expect(() => decryptDecryptionKey({ backupPrivateKey: fixedBackupKey(), ciphertext })).toThrow(
        /Failed to decrypt DK/,
      );
    });

    it("throws with the wrong backup key", () => {
      const ciphertext = Hex.fromHexInput(FIXED_CIPHERTEXT_HEX).toUint8Array();
      const wrongKey = new Ed25519PrivateKey(new Uint8Array(32).fill(0xaa));
      expect(() => decryptDecryptionKey({ backupPrivateKey: wrongKey, ciphertext })).toThrow(/Failed to decrypt DK/);
    });

    it("throws on a too-short ciphertext", () => {
      expect(() =>
        decryptDecryptionKey({ backupPrivateKey: fixedBackupKey(), ciphertext: new Uint8Array(24) }),
      ).toThrow(/too short/);
    });
  });
});

describe("Ed25519 backup-key rotation proof", () => {
  // Pinned vector matching the on-chain `0x1::account::RotationProofChallenge` serialization that
  // `signature_verify_strict_t` verifies (account address 0x1 + module "account" + struct name +
  // sequence_number + originator + current_auth_key + new_public_key = raw backup Ed25519 PK).
  const BACKUP_SK_HEX = `0x${"11".repeat(32)}`;
  const EXPECTED_CHALLENGE_HEX =
    "0x0000000000000000000000000000000000000000000000000000000000000001076163636f756e7416526f746174696f6e50726f6f664368616c6c656e67650500000000000000000000000000000000000000000000000000000000000000000000000000a1b2000000000000000000000000000000000000000000000000000000000000c3d420d04ab232742bb4ab3a1368bd4615e4e6d0224ab71a016baf8520a332c9778737";

  it("serializes the challenge with the expected bytes and a verifiable 64-byte signature", () => {
    const sk = new Ed25519PrivateKey(BACKUP_SK_HEX);
    const pk = sk.publicKey();
    // backup_public_key must be the RAW 32-byte Ed25519 public key.
    expect(pk.toUint8Array().length).toBe(32);

    const challenge = new RotationProofChallenge({
      sequenceNumber: 5n,
      originator: AccountAddress.from("0x000000000000000000000000000000000000000000000000000000000000a1b2"),
      currentAuthKey: AccountAddress.from("0x000000000000000000000000000000000000000000000000000000000000c3d4"),
      newPublicKey: pk,
    });

    const bytes = challenge.bcsToBytes();
    expect(Hex.fromHexInput(bytes).toString()).toBe(EXPECTED_CHALLENGE_HEX);

    const signature = sk.sign(bytes);
    expect(signature.toUint8Array().length).toBe(64);
    expect(pk.verifySignature({ message: bytes, signature })).toBe(true);
  });
});
