// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Ed25519PrivateKey,
  Secp256k1PrivateKey,
  Secp256r1PrivateKey,
  encryptKeystore,
  decryptKeystore,
  PrivateKeyVariants,
} from "../../src";
import type { AptosKeyStore } from "../../src";

describe("AptosKeystore", () => {
  const TEST_PASSWORD = "test-password-123";
  const FAST_ARGON2_OPTIONS = {
    kdf: "argon2id" as const,
    argon2Iterations: 2,
    argon2Parallelism: 1,
    argon2MemorySize: 1024,
  };
  const FAST_SCRYPT_OPTIONS = { kdf: "scrypt" as const, scryptN: 1024, scryptR: 8, scryptP: 1 };
  const FAST_PBKDF2_OPTIONS = { kdf: "pbkdf2" as const, pbkdf2C: 1024 };

  describe("encryptKeystore", () => {
    it("should default to argon2id when hash-wasm is available", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: { argon2Iterations: 2, argon2Parallelism: 1, argon2MemorySize: 1024 },
      });

      expect(keystore.version).toBe(1);
      expect(keystore.key_type).toBe(PrivateKeyVariants.Ed25519);
      expect(keystore.crypto.cipher).toBe("aes-256-gcm");
      expect(keystore.crypto.kdf).toBe("argon2id");
      expect(keystore.id).toBeDefined();
      expect(keystore.crypto.ciphertext).toBeDefined();
      expect(keystore.crypto.cipherparams.iv).toBeDefined();
      expect(keystore.crypto.cipherparams.tag).toBeDefined();
      expect(keystore.crypto.cipherparams.iv.length).toBe(24); // 12 bytes = 24 hex chars
      expect(keystore.crypto.cipherparams.tag.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it("should encrypt with scrypt when explicitly requested", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_SCRYPT_OPTIONS,
      });

      expect(keystore.crypto.kdf).toBe("scrypt");
      expect(keystore.crypto.cipher).toBe("aes-256-gcm");
    });

    it("should encrypt with pbkdf2", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_PBKDF2_OPTIONS,
      });

      expect(keystore.crypto.kdf).toBe("pbkdf2");
      const params = keystore.crypto.kdfparams as { prf: string };
      expect(params.prf).toBe("hmac-sha256");
    });

    it("should encrypt a Secp256k1 private key", async () => {
      const privateKey = Secp256k1PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      expect(keystore.key_type).toBe(PrivateKeyVariants.Secp256k1);
    });

    it("should encrypt a Secp256r1 private key", async () => {
      const privateKey = Secp256r1PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      expect(keystore.key_type).toBe(PrivateKeyVariants.Secp256r1);
    });

    it("should include address when provided", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const testAddress = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: { ...FAST_ARGON2_OPTIONS, address: testAddress },
      });

      expect(keystore.address).toBe(testAddress);
    });

    it("should not include address when not provided", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      expect(keystore.address).toBeUndefined();
    });

    it("should accept Uint8Array password (key file)", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keyFileBytes = new Uint8Array(32);
      crypto.getRandomValues(keyFileBytes);

      const keystore = await encryptKeystore({
        privateKey,
        password: keyFileBytes,
        options: FAST_ARGON2_OPTIONS,
      });

      const decrypted = await decryptKeystore({
        keystore,
        password: keyFileBytes,
      });

      expect(decrypted.toUint8Array()).toEqual(privateKey.toUint8Array());
    });

    it("should produce unique ciphertext for same key with different passwords", async () => {
      const privateKey = Ed25519PrivateKey.generate();

      const keystore1 = await encryptKeystore({
        privateKey,
        password: "password-one",
        options: FAST_ARGON2_OPTIONS,
      });
      const keystore2 = await encryptKeystore({
        privateKey,
        password: "password-two",
        options: FAST_ARGON2_OPTIONS,
      });

      expect(keystore1.crypto.ciphertext).not.toBe(keystore2.crypto.ciphertext);
    });

    it("should produce unique IDs for each keystore", async () => {
      const privateKey = Ed25519PrivateKey.generate();

      const keystore1 = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });
      const keystore2 = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      expect(keystore1.id).not.toBe(keystore2.id);
    });

    it("should produce valid JSON-serializable output", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      const json = JSON.stringify(keystore);
      const parsed = JSON.parse(json) as AptosKeyStore;
      expect(parsed.version).toBe(1);
      expect(parsed.crypto.cipher).toBe("aes-256-gcm");
    });
  });

  describe("decryptKeystore", () => {
    it("should round-trip an Ed25519 private key with argon2id", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      const decrypted = await decryptKeystore({ keystore, password: TEST_PASSWORD });
      expect(decrypted).toBeInstanceOf(Ed25519PrivateKey);
      expect(decrypted.toUint8Array()).toEqual(privateKey.toUint8Array());
    });

    it("should round-trip an Ed25519 private key with scrypt", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_SCRYPT_OPTIONS,
      });

      const decrypted = await decryptKeystore({ keystore, password: TEST_PASSWORD });
      expect(decrypted).toBeInstanceOf(Ed25519PrivateKey);
      expect(decrypted.toUint8Array()).toEqual(privateKey.toUint8Array());
    });

    it("should round-trip an Ed25519 private key with pbkdf2", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_PBKDF2_OPTIONS,
      });

      const decrypted = await decryptKeystore({ keystore, password: TEST_PASSWORD });
      expect(decrypted).toBeInstanceOf(Ed25519PrivateKey);
      expect(decrypted.toUint8Array()).toEqual(privateKey.toUint8Array());
    });

    it("should round-trip a Secp256k1 private key", async () => {
      const privateKey = Secp256k1PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      const decrypted = await decryptKeystore({ keystore, password: TEST_PASSWORD });
      expect(decrypted).toBeInstanceOf(Secp256k1PrivateKey);
      expect(decrypted.toUint8Array()).toEqual(privateKey.toUint8Array());
    });

    it("should round-trip a Secp256r1 private key", async () => {
      const privateKey = Secp256r1PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      const decrypted = await decryptKeystore({ keystore, password: TEST_PASSWORD });
      expect(decrypted).toBeInstanceOf(Secp256r1PrivateKey);
      expect(decrypted.toUint8Array()).toEqual(privateKey.toUint8Array());
    });

    it("should decrypt from a JSON string", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      const json = JSON.stringify(keystore);
      const decrypted = await decryptKeystore({ keystore: json, password: TEST_PASSWORD });
      expect(decrypted.toUint8Array()).toEqual(privateKey.toUint8Array());
    });

    it("should throw on wrong password", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      await expect(decryptKeystore({ keystore, password: "wrong-password" })).rejects.toThrow(
        "Invalid password: decryption failed (GCM authentication)",
      );
    });

    it("should throw on unsupported version", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      const modified = { ...keystore, version: 99 as any };
      await expect(decryptKeystore({ keystore: modified, password: TEST_PASSWORD })).rejects.toThrow(
        "Unsupported keystore version: 99",
      );
    });

    it("should throw on unsupported cipher", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      const modified = {
        ...keystore,
        crypto: { ...keystore.crypto, cipher: "aes-128-ctr" as any },
      };
      await expect(decryptKeystore({ keystore: modified, password: TEST_PASSWORD })).rejects.toThrow(
        "Unsupported cipher: aes-128-ctr",
      );
    });

    it("should throw on tampered ciphertext (GCM detects tampering)", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      const chars = keystore.crypto.ciphertext.split("");
      chars[0] = chars[0] === "a" ? "b" : "a";
      const modified = {
        ...keystore,
        crypto: { ...keystore.crypto, ciphertext: chars.join("") },
      };
      await expect(decryptKeystore({ keystore: modified, password: TEST_PASSWORD })).rejects.toThrow(
        "Invalid password: decryption failed (GCM authentication)",
      );
    });

    it("should throw on tampered tag", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      const chars = keystore.crypto.cipherparams.tag.split("");
      chars[0] = chars[0] === "a" ? "b" : "a";
      const modified = {
        ...keystore,
        crypto: {
          ...keystore.crypto,
          cipherparams: { ...keystore.crypto.cipherparams, tag: chars.join("") },
        },
      };
      await expect(decryptKeystore({ keystore: modified, password: TEST_PASSWORD })).rejects.toThrow(
        "Invalid password: decryption failed (GCM authentication)",
      );
    });
  });

  describe("cross-KDF compatibility", () => {
    it("all three KDFs should produce valid keystores that decrypt correctly", async () => {
      const privateKey = Ed25519PrivateKey.generate();

      const argon2Ks = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });
      const scryptKs = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_SCRYPT_OPTIONS,
      });
      const pbkdf2Ks = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_PBKDF2_OPTIONS,
      });

      expect(argon2Ks.crypto.kdf).toBe("argon2id");
      expect(scryptKs.crypto.kdf).toBe("scrypt");
      expect(pbkdf2Ks.crypto.kdf).toBe("pbkdf2");

      const argon2Decrypted = await decryptKeystore({ keystore: argon2Ks, password: TEST_PASSWORD });
      const scryptDecrypted = await decryptKeystore({ keystore: scryptKs, password: TEST_PASSWORD });
      const pbkdf2Decrypted = await decryptKeystore({ keystore: pbkdf2Ks, password: TEST_PASSWORD });

      expect(argon2Decrypted.toUint8Array()).toEqual(privateKey.toUint8Array());
      expect(scryptDecrypted.toUint8Array()).toEqual(privateKey.toUint8Array());
      expect(pbkdf2Decrypted.toUint8Array()).toEqual(privateKey.toUint8Array());
    });
  });

  describe("derived key verification", () => {
    it("the decrypted key should produce the same public key as the original", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const originalPubKey = privateKey.publicKey().toUint8Array();

      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      const decrypted = await decryptKeystore({ keystore, password: TEST_PASSWORD });
      const decryptedPubKey = decrypted.publicKey().toUint8Array();

      expect(decryptedPubKey).toEqual(originalPubKey);
    });

    it("the decrypted key should produce valid signatures", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const message = new TextEncoder().encode("Hello, Aptos!");

      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_ARGON2_OPTIONS,
      });

      const decrypted = (await decryptKeystore({ keystore, password: TEST_PASSWORD })) as Ed25519PrivateKey;
      const signature = decrypted.sign(message);

      expect(privateKey.publicKey().verifySignature({ message, signature })).toBe(true);
    });
  });
});
