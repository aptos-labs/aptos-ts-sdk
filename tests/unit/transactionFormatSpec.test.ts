// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Transaction Format Specification Compliance Tests
 *
 * These tests validate the SDK's compliance with the official Aptos transaction format
 * specifications from:
 * https://github.com/aptos-labs/aptos-core/tree/main/specifications/transaction-formats
 *
 * Test vectors are taken directly from the specification documents.
 */

import {
  AccountAddress,
  AnyPublicKey,
  AnyPublicKeyVariant,
  AnySignature,
  AnySignatureVariant,
  AuthenticationKey,
  ChainId,
  Deserializer,
  Ed25519PublicKey,
  Ed25519Signature,
  MultiEd25519PublicKey,
  MultiEd25519Signature,
  MultiKey,
  MultiKeySignature,
  RawTransaction,
  Secp256k1PublicKey,
  Serializer,
  SigningScheme,
  TransactionPayloadEntryFunction,
  EntryFunction,
  ModuleId,
  Identifier,
  U64,
} from "../../src";
import {
  AccountAuthenticatorMultiKey,
  AccountAuthenticatorSingleKey,
} from "../../src/transactions/authenticator/account";
import {
  TransactionAuthenticatorEd25519,
  TransactionAuthenticatorMultiEd25519,
  TransactionAuthenticatorSingleSender,
} from "../../src/transactions/authenticator/transaction";

/**
 * Test vectors from specification documents
 */
const SPEC_TEST_VECTORS = {
  // From 02-ed25519-authenticator.md and 05-multi-ed25519-authenticator.md
  ed25519: {
    // Private key seed (not used directly in tests)
    privateKeySeed: "9bf49a6a0755f953811fce125f2683d50429c3bb49e074147e0089a52eae155f",
    publicKey: "de19e5d1880cac87d57484ce9ed2e84cf0f9c1a9436a30593a9a23a1768a6105",
    // Scheme ID for Ed25519 is 0x00
    schemeId: 0x00,
  },

  // From 05-multi-ed25519-authenticator.md
  multiEd25519: {
    publicKeys: [
      "de19e5d1880cac87d57484ce9ed2e84cf0f9c1a9436a30593a9a23a1768a6105",
      "ab19e5d1880cac87d57484ce9ed2e84cf0f9c1a9436a30593a9a23a1768a6105",
      "cd19e5d1880cac87d57484ce9ed2e84cf0f9c1a9436a30593a9a23a1768a6105",
    ],
    threshold: 2,
    // Expected bitmap for indices 0 and 2: 10100000 00000000 00000000 00000000 = 0xA0000000
    bitmapIndices: [0, 2],
    expectedBitmap: new Uint8Array([0xa0, 0x00, 0x00, 0x00]),
    // Scheme ID for MultiEd25519 is 0x01
    schemeId: 0x01,
  },

  // From 03-single-key-authenticator.md
  singleKey: {
    // Scheme ID for SingleKey is 0x02
    schemeId: 0x02,
  },

  // From 04-multi-key-authenticator.md
  multiKey: {
    // Scheme ID for MultiKey is 0x03
    schemeId: 0x03,
    // Expected bitmap for indices 0 and 2 (same as MultiEd25519)
    bitmapIndices: [0, 2],
    expectedBitmap: new Uint8Array([0xa0, 0x00, 0x00, 0x00]),
  },
};

describe("Transaction Format Specification Compliance", () => {
  describe("01-raw-transaction: RawTransaction Structure", () => {
    it("should serialize RawTransaction with correct field order", () => {
      const sender = AccountAddress.fromString("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      const sequenceNumber = BigInt(0);
      const maxGasAmount = BigInt(100_000);
      const gasUnitPrice = BigInt(100);
      const expirationTimestampSecs = BigInt(1735689600);
      const chainId = new ChainId(1);

      // Create a simple entry function payload
      const payload = new TransactionPayloadEntryFunction(
        new EntryFunction(
          new ModuleId(AccountAddress.ONE, new Identifier("aptos_account")),
          new Identifier("transfer"),
          [],
          [AccountAddress.TWO, new U64(BigInt(1000))],
        ),
      );

      const rawTxn = new RawTransaction(
        sender,
        sequenceNumber,
        payload,
        maxGasAmount,
        gasUnitPrice,
        expirationTimestampSecs,
        chainId,
      );

      const serialized = rawTxn.bcsToBytes();

      // Verify deserialization produces identical transaction
      const deserializer = new Deserializer(serialized);
      const deserialized = RawTransaction.deserialize(deserializer);

      expect(deserialized.sender.toString()).toEqual(sender.toString());
      expect(deserialized.sequence_number).toEqual(sequenceNumber);
      expect(deserialized.max_gas_amount).toEqual(maxGasAmount);
      expect(deserialized.gas_unit_price).toEqual(gasUnitPrice);
      expect(deserialized.expiration_timestamp_secs).toEqual(expirationTimestampSecs);
      expect(deserialized.chain_id.chainId).toEqual(chainId.chainId);
    });

    it("should serialize chain_id as a single byte (u8)", () => {
      const chainId = new ChainId(1);
      const serialized = chainId.bcsToBytes();
      // Chain ID should be exactly 1 byte
      expect(serialized.length).toEqual(1);
      expect(serialized[0]).toEqual(1);
    });

    it("should serialize AccountAddress as 32 fixed bytes", () => {
      const address = AccountAddress.fromString("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      const serialized = address.bcsToBytes();
      // Account address should be exactly 32 bytes
      expect(serialized.length).toEqual(32);
    });
  });

  describe("02-ed25519-authenticator: Ed25519 Authenticator", () => {
    it("should use correct scheme ID (0x00) for Ed25519 authentication key derivation", () => {
      expect(SigningScheme.Ed25519).toEqual(SPEC_TEST_VECTORS.ed25519.schemeId);
    });

    it("should serialize Ed25519PublicKey as 32 bytes", () => {
      const publicKey = new Ed25519PublicKey(SPEC_TEST_VECTORS.ed25519.publicKey);
      expect(publicKey.toUint8Array().length).toEqual(32);
    });

    it("should serialize Ed25519Signature as 64 bytes", () => {
      // Create a placeholder signature (64 zero bytes)
      const signatureBytes = new Uint8Array(64);
      const signature = new Ed25519Signature(signatureBytes);
      expect(signature.toUint8Array().length).toEqual(64);
    });

    it("should derive authentication key correctly: SHA3-256(public_key || 0x00)", () => {
      const publicKey = new Ed25519PublicKey(SPEC_TEST_VECTORS.ed25519.publicKey);
      const authKey = publicKey.authKey();

      // The auth key should be 32 bytes
      const publicKeyBytes = publicKey.toUint8Array();
      expect(authKey.toUint8Array().length).toEqual(32);

      // Verify using the SDK's method
      const authKeyFromScheme = AuthenticationKey.fromSchemeAndBytes({
        scheme: SigningScheme.Ed25519,
        input: publicKeyBytes,
      });
      expect(authKey.toUint8Array()).toEqual(authKeyFromScheme.toUint8Array());
    });

    it("should serialize TransactionAuthenticatorEd25519 with variant index 0", () => {
      const publicKey = new Ed25519PublicKey(SPEC_TEST_VECTORS.ed25519.publicKey);
      const signature = new Ed25519Signature(new Uint8Array(64));

      const authenticator = new TransactionAuthenticatorEd25519(publicKey, signature);
      const serialized = authenticator.bcsToBytes();

      // First byte should be variant index 0 (Ed25519)
      expect(serialized[0]).toEqual(0);
      // Total size: 1 (variant) + 32 (public key) + 64 (signature) = 97 bytes
      // Note: Ed25519PublicKey.serialize uses serializeBytes which adds length prefix
      // So actual size is 1 + (1 + 32) + (1 + 64) = 99 bytes
    });
  });

  describe("03-single-key-authenticator: SingleKey Authenticator", () => {
    it("should use correct scheme ID (0x02) for SingleKey authentication key derivation", () => {
      expect(SigningScheme.SingleKey).toEqual(SPEC_TEST_VECTORS.singleKey.schemeId);
    });

    it("should serialize AnyPublicKey with variant index prefix", () => {
      const ed25519PublicKey = new Ed25519PublicKey(SPEC_TEST_VECTORS.ed25519.publicKey);
      const anyPublicKey = new AnyPublicKey(ed25519PublicKey);

      const serialized = anyPublicKey.bcsToBytes();

      // First byte should be variant index 0 (Ed25519)
      expect(serialized[0]).toEqual(0);
      // The inner public key is serialized with its own BCS format
      // For Ed25519PublicKey, this includes a length prefix (32 = 0x20)
      expect(serialized[1]).toEqual(32); // Length prefix for Ed25519 public key
      // Followed by the public key bytes
      expect(serialized.slice(2, 34)).toEqual(ed25519PublicKey.toUint8Array());
    });

    it("should derive SingleKey authentication key including variant prefix", () => {
      const ed25519PublicKey = new Ed25519PublicKey(SPEC_TEST_VECTORS.ed25519.publicKey);
      const anyPublicKey = new AnyPublicKey(ed25519PublicKey);

      const authKey = anyPublicKey.authKey();

      // The auth key input should be: BCS(AnyPublicKey) || 0x02
      // BCS(AnyPublicKey) = variant_index || public_key_bytes
      const anyPkSerialized = anyPublicKey.bcsToBytes();
      const authKeyFromScheme = AuthenticationKey.fromSchemeAndBytes({
        scheme: SigningScheme.SingleKey,
        input: anyPkSerialized,
      });

      expect(authKey.toUint8Array()).toEqual(authKeyFromScheme.toUint8Array());
    });

    it("should produce different addresses for Ed25519 vs SingleKey(Ed25519)", () => {
      const publicKeyHex = SPEC_TEST_VECTORS.ed25519.publicKey;
      const ed25519PublicKey = new Ed25519PublicKey(publicKeyHex);

      // Ed25519 auth key (scheme 0x00)
      const ed25519AuthKey = ed25519PublicKey.authKey();

      // SingleKey(Ed25519) auth key (scheme 0x02)
      const anyPublicKey = new AnyPublicKey(ed25519PublicKey);
      const singleKeyAuthKey = anyPublicKey.authKey();

      // These should be different!
      expect(ed25519AuthKey.toUint8Array()).not.toEqual(singleKeyAuthKey.toUint8Array());
    });

    it("should serialize AccountAuthenticatorSingleKey with variant index 2", () => {
      const ed25519PublicKey = new Ed25519PublicKey(SPEC_TEST_VECTORS.ed25519.publicKey);
      const anyPublicKey = new AnyPublicKey(ed25519PublicKey);
      const signature = new Ed25519Signature(new Uint8Array(64));
      const anySignature = new AnySignature(signature);

      const authenticator = new AccountAuthenticatorSingleKey(anyPublicKey, anySignature);
      const serialized = authenticator.bcsToBytes();

      // First byte should be variant index 2 (SingleKey)
      expect(serialized[0]).toEqual(2);
    });

    it("should serialize TransactionAuthenticatorSingleSender with variant index 4", () => {
      const ed25519PublicKey = new Ed25519PublicKey(SPEC_TEST_VECTORS.ed25519.publicKey);
      const anyPublicKey = new AnyPublicKey(ed25519PublicKey);
      const signature = new Ed25519Signature(new Uint8Array(64));
      const anySignature = new AnySignature(signature);

      const accountAuth = new AccountAuthenticatorSingleKey(anyPublicKey, anySignature);
      const txnAuth = new TransactionAuthenticatorSingleSender(accountAuth);
      const serialized = txnAuth.bcsToBytes();

      // First byte should be variant index 4 (SingleSender)
      expect(serialized[0]).toEqual(4);
      // Second byte should be variant index 2 (SingleKey)
      expect(serialized[1]).toEqual(2);
    });
  });

  describe("04-multi-key-authenticator: MultiKey Authenticator", () => {
    it("should use correct scheme ID (0x03) for MultiKey authentication key derivation", () => {
      expect(SigningScheme.MultiKey).toEqual(SPEC_TEST_VECTORS.multiKey.schemeId);
    });

    it("should create correct bitmap for indices [0, 2]", () => {
      const ed25519Pk1 = new Ed25519PublicKey(SPEC_TEST_VECTORS.multiEd25519.publicKeys[0]);
      const ed25519Pk2 = new Ed25519PublicKey(SPEC_TEST_VECTORS.multiEd25519.publicKeys[1]);
      const ed25519Pk3 = new Ed25519PublicKey(SPEC_TEST_VECTORS.multiEd25519.publicKeys[2]);

      const multiKey = new MultiKey({
        publicKeys: [new AnyPublicKey(ed25519Pk1), new AnyPublicKey(ed25519Pk2), new AnyPublicKey(ed25519Pk3)],
        signaturesRequired: 2,
      });

      const bitmap = multiKey.createBitmap({ bits: SPEC_TEST_VECTORS.multiKey.bitmapIndices });

      // Expected: 10100000 00000000 00000000 00000000 = 0xA0000000
      expect(bitmap).toEqual(SPEC_TEST_VECTORS.multiKey.expectedBitmap);
    });

    it("should create correct bitmap for indices [0, 2, 31] (spec example)", () => {
      // From spec: [0, 2, 31] means bits 0, 2, and 31 should be set
      // Result: 0b10100000 00000000 00000000 00000001
      const expectedBitmap = new Uint8Array([0b10100000, 0b00000000, 0b00000000, 0b00000001]);
      const bitmap = MultiKeySignature.createBitmap({ bits: [0, 2, 31] });
      expect(bitmap).toEqual(expectedBitmap);
    });

    it("should serialize MultiKeySignature with vector of signatures and 4-byte bitmap", () => {
      const sig1 = new Ed25519Signature(new Uint8Array(64));
      const sig2 = new Ed25519Signature(new Uint8Array(64));

      const multiKeySig = new MultiKeySignature({
        signatures: [new AnySignature(sig1), new AnySignature(sig2)],
        bitmap: SPEC_TEST_VECTORS.multiKey.bitmapIndices,
      });

      const serialized = multiKeySig.bcsToBytes();

      // The serialization should include:
      // - ULEB128 vector length for signatures
      // - Each signature (variant + 64 bytes)
      // - ULEB128 length prefix for bitmap bytes
      // - 4 bytes of bitmap

      // Deserialize and verify
      const deserializer = new Deserializer(serialized);
      const deserialized = MultiKeySignature.deserialize(deserializer);

      expect(deserialized.signatures.length).toEqual(2);
      expect(deserialized.bitmap).toEqual(SPEC_TEST_VECTORS.multiKey.expectedBitmap);
    });

    it("should correctly convert bitmap to signer indices", () => {
      const sig1 = new Ed25519Signature(new Uint8Array(64));
      const sig2 = new Ed25519Signature(new Uint8Array(64));

      const multiKeySig = new MultiKeySignature({
        signatures: [new AnySignature(sig1), new AnySignature(sig2)],
        bitmap: [0, 2], // indices 0 and 2
      });

      const indices = multiKeySig.bitMapToSignerIndices();
      expect(indices).toEqual([0, 2]);
    });

    it("should serialize AccountAuthenticatorMultiKey with variant index 3", () => {
      const ed25519Pk1 = new Ed25519PublicKey(SPEC_TEST_VECTORS.multiEd25519.publicKeys[0]);
      const ed25519Pk2 = new Ed25519PublicKey(SPEC_TEST_VECTORS.multiEd25519.publicKeys[1]);
      const ed25519Pk3 = new Ed25519PublicKey(SPEC_TEST_VECTORS.multiEd25519.publicKeys[2]);

      const multiKey = new MultiKey({
        publicKeys: [new AnyPublicKey(ed25519Pk1), new AnyPublicKey(ed25519Pk2), new AnyPublicKey(ed25519Pk3)],
        signaturesRequired: 2,
      });

      const sig1 = new Ed25519Signature(new Uint8Array(64));
      const sig2 = new Ed25519Signature(new Uint8Array(64));

      const multiKeySig = new MultiKeySignature({
        signatures: [new AnySignature(sig1), new AnySignature(sig2)],
        bitmap: [0, 2],
      });

      const authenticator = new AccountAuthenticatorMultiKey(multiKey, multiKeySig);
      const serialized = authenticator.bcsToBytes();

      // First byte should be variant index 3 (MultiKey)
      expect(serialized[0]).toEqual(3);
    });
  });

  describe("05-multi-ed25519-authenticator: MultiEd25519 Authenticator", () => {
    it("should use correct scheme ID (0x01) for MultiEd25519 authentication key derivation", () => {
      expect(SigningScheme.MultiEd25519).toEqual(SPEC_TEST_VECTORS.multiEd25519.schemeId);
    });

    it("should serialize MultiEd25519PublicKey as pk0||pk1||...||pkn||threshold", () => {
      const publicKeys = SPEC_TEST_VECTORS.multiEd25519.publicKeys.map((pk) => new Ed25519PublicKey(pk));

      const multiPubKey = new MultiEd25519PublicKey({
        publicKeys,
        threshold: SPEC_TEST_VECTORS.multiEd25519.threshold,
      });

      const rawBytes = multiPubKey.toUint8Array();

      // Expected size: 3 * 32 + 1 = 97 bytes
      expect(rawBytes.length).toEqual(97);

      // Verify each public key is in the correct position
      expect(rawBytes.slice(0, 32)).toEqual(publicKeys[0].toUint8Array());
      expect(rawBytes.slice(32, 64)).toEqual(publicKeys[1].toUint8Array());
      expect(rawBytes.slice(64, 96)).toEqual(publicKeys[2].toUint8Array());

      // Verify threshold is at the end
      expect(rawBytes[96]).toEqual(SPEC_TEST_VECTORS.multiEd25519.threshold);
    });

    it("should create correct bitmap for indices [0, 2]", () => {
      const bitmap = MultiEd25519Signature.createBitmap({
        bits: SPEC_TEST_VECTORS.multiEd25519.bitmapIndices,
      });

      // Expected: 10100000 00000000 00000000 00000000 = 0xA0000000
      expect(bitmap).toEqual(SPEC_TEST_VECTORS.multiEd25519.expectedBitmap);
    });

    it("should serialize MultiEd25519Signature as sig0||...||sigm||bitmap[4]", () => {
      const sig1 = new Ed25519Signature(new Uint8Array(64).fill(1));
      const sig2 = new Ed25519Signature(new Uint8Array(64).fill(2));

      const multiSig = new MultiEd25519Signature({
        signatures: [sig1, sig2],
        bitmap: SPEC_TEST_VECTORS.multiEd25519.bitmapIndices,
      });

      const rawBytes = multiSig.toUint8Array();

      // Expected size: 2 * 64 + 4 = 132 bytes
      expect(rawBytes.length).toEqual(132);

      // Verify signatures are in order
      expect(rawBytes.slice(0, 64)).toEqual(sig1.toUint8Array());
      expect(rawBytes.slice(64, 128)).toEqual(sig2.toUint8Array());

      // Verify bitmap is at the end
      expect(rawBytes.slice(128, 132)).toEqual(SPEC_TEST_VECTORS.multiEd25519.expectedBitmap);
    });

    it("should derive authentication key correctly: SHA3-256(pk_bytes || 0x01)", () => {
      const publicKeys = SPEC_TEST_VECTORS.multiEd25519.publicKeys.map((pk) => new Ed25519PublicKey(pk));

      const multiPubKey = new MultiEd25519PublicKey({
        publicKeys,
        threshold: SPEC_TEST_VECTORS.multiEd25519.threshold,
      });

      const authKey = multiPubKey.authKey();

      // Verify using the SDK's method
      const authKeyFromScheme = AuthenticationKey.fromSchemeAndBytes({
        scheme: SigningScheme.MultiEd25519,
        input: multiPubKey.toUint8Array(),
      });

      expect(authKey.toUint8Array()).toEqual(authKeyFromScheme.toUint8Array());
    });

    it("should serialize TransactionAuthenticatorMultiEd25519 with variant index 1", () => {
      const publicKeys = SPEC_TEST_VECTORS.multiEd25519.publicKeys.map((pk) => new Ed25519PublicKey(pk));

      const multiPubKey = new MultiEd25519PublicKey({
        publicKeys,
        threshold: SPEC_TEST_VECTORS.multiEd25519.threshold,
      });

      const sig1 = new Ed25519Signature(new Uint8Array(64));
      const sig2 = new Ed25519Signature(new Uint8Array(64));

      const multiSig = new MultiEd25519Signature({
        signatures: [sig1, sig2],
        bitmap: SPEC_TEST_VECTORS.multiEd25519.bitmapIndices,
      });

      const authenticator = new TransactionAuthenticatorMultiEd25519(multiPubKey, multiSig);
      const serialized = authenticator.bcsToBytes();

      // First byte should be variant index 1 (MultiEd25519)
      expect(serialized[0]).toEqual(1);
    });

    it("should correctly roundtrip MultiEd25519PublicKey through BCS serialization", () => {
      const publicKeys = SPEC_TEST_VECTORS.multiEd25519.publicKeys.map((pk) => new Ed25519PublicKey(pk));

      const original = new MultiEd25519PublicKey({
        publicKeys,
        threshold: SPEC_TEST_VECTORS.multiEd25519.threshold,
      });

      const serializer = new Serializer();
      original.serialize(serializer);
      const serialized = serializer.toUint8Array();

      const deserializer = new Deserializer(serialized);
      const deserialized = MultiEd25519PublicKey.deserialize(deserializer);

      expect(deserialized.toUint8Array()).toEqual(original.toUint8Array());
      expect(deserialized.threshold).toEqual(original.threshold);
      expect(deserialized.publicKeys.length).toEqual(original.publicKeys.length);
    });

    it("should correctly roundtrip MultiEd25519Signature through BCS serialization", () => {
      const sig1 = new Ed25519Signature(new Uint8Array(64).fill(0xab));
      const sig2 = new Ed25519Signature(new Uint8Array(64).fill(0xcd));

      const original = new MultiEd25519Signature({
        signatures: [sig1, sig2],
        bitmap: SPEC_TEST_VECTORS.multiEd25519.bitmapIndices,
      });

      const serializer = new Serializer();
      original.serialize(serializer);
      const serialized = serializer.toUint8Array();

      const deserializer = new Deserializer(serialized);
      const deserialized = MultiEd25519Signature.deserialize(deserializer);

      expect(deserialized.toUint8Array()).toEqual(original.toUint8Array());
      expect(deserialized.bitmap).toEqual(original.bitmap);
      expect(deserialized.signatures.length).toEqual(original.signatures.length);
    });
  });

  describe("Bitmap bit ordering (MSB first)", () => {
    // The spec states: "Bit ordering: Bit 0 is the MSB of the first byte"
    // This means for byte 0: bit 7 = key 0, bit 6 = key 1, ..., bit 0 = key 7

    it("should set correct bits in bitmap for various key indices", () => {
      const testCases = [
        { indices: [0], expected: new Uint8Array([0b10000000, 0, 0, 0]) },
        { indices: [1], expected: new Uint8Array([0b01000000, 0, 0, 0]) },
        { indices: [7], expected: new Uint8Array([0b00000001, 0, 0, 0]) },
        { indices: [8], expected: new Uint8Array([0, 0b10000000, 0, 0]) },
        { indices: [15], expected: new Uint8Array([0, 0b00000001, 0, 0]) },
        { indices: [31], expected: new Uint8Array([0, 0, 0, 0b00000001]) },
        { indices: [0, 7], expected: new Uint8Array([0b10000001, 0, 0, 0]) },
        { indices: [0, 8], expected: new Uint8Array([0b10000000, 0b10000000, 0, 0]) },
      ];

      for (const { indices, expected } of testCases) {
        const bitmap = MultiEd25519Signature.createBitmap({ bits: indices });
        expect(bitmap).toEqual(expected);
      }
    });
  });

  describe("AnyPublicKey and AnySignature variant indices", () => {
    it("should use correct variant index for Ed25519 (0)", () => {
      const ed25519Pk = new Ed25519PublicKey(SPEC_TEST_VECTORS.ed25519.publicKey);
      const anyPk = new AnyPublicKey(ed25519Pk);
      expect(anyPk.variant).toEqual(0);
    });

    it("should use correct variant index for Secp256k1 (1)", () => {
      // Using a valid uncompressed Secp256k1 public key (65 bytes starting with 0x04)
      const secp256k1Pk = new Secp256k1PublicKey(
        "0x04acdd16651b839c24665b7e2033b55225f384554949fef46c397b5275f37f6ee95554d70fb5d9f93c5831ebf695c7206e7477ce708f03ae9bb2862dc6c9e033ea",
      );
      const anyPk = new AnyPublicKey(secp256k1Pk);
      expect(anyPk.variant).toEqual(1);
    });

    it("should have SlhDsaSha2_128s variant defined as 5 for AnyPublicKey", () => {
      // Per spec: SlhDsaSha2_128s = 5 for post-quantum support
      expect(AnyPublicKeyVariant.SlhDsaSha2_128s).toEqual(5);
    });

    it("should have SlhDsaSha2_128s variant defined as 4 for AnySignature", () => {
      // Per spec: SlhDsaSha2_128s = 4 for post-quantum support
      expect(AnySignatureVariant.SlhDsaSha2_128s).toEqual(4);
    });
  });

  describe("Authentication key derivation produces correct addresses", () => {
    it("should derive address from Ed25519 public key", () => {
      const publicKey = new Ed25519PublicKey(SPEC_TEST_VECTORS.ed25519.publicKey);
      const authKey = publicKey.authKey();
      const address = authKey.derivedAddress();

      // The address should be 32 bytes
      expect(address.toUint8Array().length).toEqual(32);
    });

    it("should derive different addresses for same key with different schemes", () => {
      const ed25519Pk = new Ed25519PublicKey(SPEC_TEST_VECTORS.ed25519.publicKey);

      // Ed25519 scheme (0x00)
      const ed25519Address = ed25519Pk.authKey().derivedAddress();

      // SingleKey scheme (0x02)
      const anyPk = new AnyPublicKey(ed25519Pk);
      const singleKeyAddress = anyPk.authKey().derivedAddress();

      // Addresses should be different
      expect(ed25519Address.toString()).not.toEqual(singleKeyAddress.toString());
    });
  });
});
