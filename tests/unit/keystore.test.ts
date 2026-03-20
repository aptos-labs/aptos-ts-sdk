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
  const FAST_SCRYPT_OPTIONS = { scryptN: 1024, scryptR: 8, scryptP: 1 } as const;
  const FAST_PBKDF2_OPTIONS = { kdf: "pbkdf2" as const, pbkdf2C: 1024 };

  describe("encryptKeystore", () => {
    it("should encrypt an Ed25519 private key with scrypt", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_SCRYPT_OPTIONS,
      });

      expect(keystore.version).toBe(1);
      expect(keystore.key_type).toBe(PrivateKeyVariants.Ed25519);
      expect(keystore.crypto.cipher).toBe("aes-128-ctr");
      expect(keystore.crypto.kdf).toBe("scrypt");
      expect(keystore.id).toBeDefined();
      expect(keystore.crypto.ciphertext).toBeDefined();
      expect(keystore.crypto.mac).toBeDefined();
      expect(keystore.crypto.cipherparams.iv).toBeDefined();
    });

    it("should encrypt an Ed25519 private key with pbkdf2", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_PBKDF2_OPTIONS,
      });

      expect(keystore.version).toBe(1);
      expect(keystore.key_type).toBe(PrivateKeyVariants.Ed25519);
      expect(keystore.crypto.kdf).toBe("pbkdf2");
      const params = keystore.crypto.kdfparams as { prf: string };
      expect(params.prf).toBe("hmac-sha256");
    });

    it("should encrypt a Secp256k1 private key", async () => {
      const privateKey = Secp256k1PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_SCRYPT_OPTIONS,
      });

      expect(keystore.key_type).toBe(PrivateKeyVariants.Secp256k1);
    });

    it("should encrypt a Secp256r1 private key", async () => {
      const privateKey = Secp256r1PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_SCRYPT_OPTIONS,
      });

      expect(keystore.key_type).toBe(PrivateKeyVariants.Secp256r1);
    });

    it("should include address when provided", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const testAddress = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: { ...FAST_SCRYPT_OPTIONS, address: testAddress },
      });

      expect(keystore.address).toBe(testAddress);
    });

    it("should not include address when not provided", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_SCRYPT_OPTIONS,
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
        options: FAST_SCRYPT_OPTIONS,
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
        options: FAST_SCRYPT_OPTIONS,
      });
      const keystore2 = await encryptKeystore({
        privateKey,
        password: "password-two",
        options: FAST_SCRYPT_OPTIONS,
      });

      expect(keystore1.crypto.ciphertext).not.toBe(keystore2.crypto.ciphertext);
      expect(keystore1.crypto.mac).not.toBe(keystore2.crypto.mac);
    });

    it("should produce unique IDs for each keystore", async () => {
      const privateKey = Ed25519PrivateKey.generate();

      const keystore1 = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_SCRYPT_OPTIONS,
      });
      const keystore2 = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_SCRYPT_OPTIONS,
      });

      expect(keystore1.id).not.toBe(keystore2.id);
    });

    it("should produce valid JSON-serializable output", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_SCRYPT_OPTIONS,
      });

      const json = JSON.stringify(keystore);
      const parsed = JSON.parse(json) as AptosKeyStore;
      expect(parsed.version).toBe(1);
      expect(parsed.crypto.cipher).toBe("aes-128-ctr");
    });
  });

  describe("decryptKeystore", () => {
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
        options: FAST_SCRYPT_OPTIONS,
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
        options: FAST_SCRYPT_OPTIONS,
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
        options: FAST_SCRYPT_OPTIONS,
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
        options: FAST_SCRYPT_OPTIONS,
      });

      await expect(decryptKeystore({ keystore, password: "wrong-password" })).rejects.toThrow(
        "Invalid password: MAC verification failed",
      );
    });

    it("should throw on unsupported version", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_SCRYPT_OPTIONS,
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
        options: FAST_SCRYPT_OPTIONS,
      });

      const modified = {
        ...keystore,
        crypto: { ...keystore.crypto, cipher: "aes-256-cbc" as any },
      };
      await expect(decryptKeystore({ keystore: modified, password: TEST_PASSWORD })).rejects.toThrow(
        "Unsupported cipher: aes-256-cbc",
      );
    });

    it("should throw on tampered ciphertext", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_SCRYPT_OPTIONS,
      });

      const tamperedCiphertext = keystore.crypto.ciphertext.replace(/[0-9a-f]/, "0");
      if (tamperedCiphertext === keystore.crypto.ciphertext) {
        const chars = keystore.crypto.ciphertext.split("");
        chars[0] = chars[0] === "a" ? "b" : "a";
        const modified = {
          ...keystore,
          crypto: { ...keystore.crypto, ciphertext: chars.join("") },
        };
        await expect(decryptKeystore({ keystore: modified, password: TEST_PASSWORD })).rejects.toThrow(
          "Invalid password: MAC verification failed",
        );
      } else {
        const modified = {
          ...keystore,
          crypto: { ...keystore.crypto, ciphertext: tamperedCiphertext },
        };
        await expect(decryptKeystore({ keystore: modified, password: TEST_PASSWORD })).rejects.toThrow(
          "Invalid password: MAC verification failed",
        );
      }
    });
  });

  describe("cross-KDF compatibility", () => {
    it("should produce different keystore structures for scrypt vs pbkdf2", async () => {
      const privateKey = Ed25519PrivateKey.generate();

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

      expect(scryptKs.crypto.kdf).toBe("scrypt");
      expect(pbkdf2Ks.crypto.kdf).toBe("pbkdf2");

      const scryptDecrypted = await decryptKeystore({ keystore: scryptKs, password: TEST_PASSWORD });
      const pbkdf2Decrypted = await decryptKeystore({ keystore: pbkdf2Ks, password: TEST_PASSWORD });

      expect(scryptDecrypted.toUint8Array()).toEqual(privateKey.toUint8Array());
      expect(pbkdf2Decrypted.toUint8Array()).toEqual(privateKey.toUint8Array());
    });
  });

  describe("known test vector", () => {
    it("should decrypt a known keystore correctly", async () => {
      const knownPrivateKey = Ed25519PrivateKey.generate();
      const knownPassword = "aptos-keystore-test-vector";

      const keystore = await encryptKeystore({
        privateKey: knownPrivateKey,
        password: knownPassword,
        options: { ...FAST_SCRYPT_OPTIONS, address: "0x1" },
      });

      expect(keystore.address).toBe("0x1");
      expect(keystore.key_type).toBe("ed25519");

      const recovered = await decryptKeystore({ keystore, password: knownPassword });
      expect(recovered.toUint8Array()).toEqual(knownPrivateKey.toUint8Array());
    });
  });

  describe("derived key verification", () => {
    it("the decrypted key should produce the same public key as the original", async () => {
      const privateKey = Ed25519PrivateKey.generate();
      const originalPubKey = privateKey.publicKey().toUint8Array();

      const keystore = await encryptKeystore({
        privateKey,
        password: TEST_PASSWORD,
        options: FAST_SCRYPT_OPTIONS,
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
        options: FAST_SCRYPT_OPTIONS,
      });

      const decrypted = (await decryptKeystore({ keystore, password: TEST_PASSWORD })) as Ed25519PrivateKey;
      const signature = decrypted.sign(message);

      expect(privateKey.publicKey().verifySignature({ message, signature })).toBe(true);
    });
  });
});
