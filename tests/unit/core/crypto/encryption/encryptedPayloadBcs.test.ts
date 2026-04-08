// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { Deserializer } from "../../../../../src/bcs/deserializer";
import { Serializer } from "../../../../../src/bcs/serializer";
import { AccountAddress } from "../../../../../src/core";
import { Identifier } from "../../../../../src/transactions/instances/identifier";
import { ModuleId } from "../../../../../src/transactions/instances/moduleId";
import {
  ClaimedEntryFunction,
  DecryptedPayload,
  EntryFunction,
  PayloadAssociatedData,
  TransactionExecutableEntryFunction,
  TransactionExtraConfig,
  TransactionExtraConfigV1,
  TransactionPayload,
  TransactionPayloadEncryptedPayload,
} from "../../../../../src/transactions/instances/transactionPayload";
import {
  Ciphertext,
  BIBECiphertext,
  SymmetricKey,
  SymmetricCiphertext,
} from "../../../../../src/core/crypto/encryption";
import { bls12_381 } from "@noble/curves/bls12-381";

function makeStubCiphertext(): Ciphertext {
  const vk = new Uint8Array(32);
  const id = 42n;
  const G2 = bls12_381.G2.Point;
  const ctG2 = [G2.BASE, G2.BASE, G2.BASE];
  const paddedKey = new SymmetricKey(new Uint8Array(16));
  const symCt = new SymmetricCiphertext(new Uint8Array(12), new Uint8Array(48));
  const bibeCt = new BIBECiphertext(id, ctG2, paddedKey, symCt);
  const adBytes = new Uint8Array(32);
  const signature = new Uint8Array(64);
  return new Ciphertext(vk, bibeCt, adBytes, signature);
}

describe("encrypted payload BCS round-trip (unit)", () => {
  test("DecryptedPayload serialize/deserialize", () => {
    const entryFn = EntryFunction.build("0x1::aptos_account", "transfer", [], []);
    const executable = new TransactionExecutableEntryFunction(entryFn);
    const nonce = 0xdeadbeefcafe0001n;
    const payload = new DecryptedPayload(executable, nonce);

    const bytes = payload.bcsToBytes();
    const restored = DecryptedPayload.deserialize(new Deserializer(bytes));

    expect(restored.decryptionNonce).toBe(nonce);
    expect(restored.bcsToBytes()).toEqual(bytes);
  });

  test("DecryptedPayload hash is deterministic", () => {
    const entryFn = EntryFunction.build("0x1::aptos_account", "transfer", [], []);
    const executable = new TransactionExecutableEntryFunction(entryFn);
    const payload = new DecryptedPayload(executable, 123n);

    const h1 = payload.hash();
    const h2 = payload.hash();
    expect(h1).toEqual(h2);
    expect(h1.length).toBe(32);
  });

  test("PayloadAssociatedData serialize/deserialize", () => {
    const sender = AccountAddress.ONE;
    const ad = new PayloadAssociatedData(sender);

    const bytes = ad.bcsToBytes();
    const restored = PayloadAssociatedData.deserialize(new Deserializer(bytes));

    expect(restored.sender.equals(sender)).toBe(true);
    expect(restored.bcsToBytes()).toEqual(bytes);
  });

  test("TransactionExtraConfigV1 with replay nonce round-trips", () => {
    const nonce = 0xcafebabedeadbeefn;
    const config = new TransactionExtraConfigV1(undefined, nonce);

    const serializer = new Serializer();
    config.serialize(serializer);
    const bytes = serializer.toUint8Array();

    const deserializer = new Deserializer(bytes);
    const restored = TransactionExtraConfig.deserialize(deserializer);
    expect(restored).toBeInstanceOf(TransactionExtraConfigV1);
    expect((restored as TransactionExtraConfigV1).replayProtectionNonce).toBe(nonce);
    expect((restored as TransactionExtraConfigV1).multisigAddress).toBeUndefined();
  });

  test("TransactionExtraConfigV1 with multisig address round-trips", () => {
    const addr = AccountAddress.ONE;
    const config = new TransactionExtraConfigV1(addr, undefined);

    const serializer = new Serializer();
    config.serialize(serializer);
    const bytes = serializer.toUint8Array();

    const deserializer = new Deserializer(bytes);
    const restored = TransactionExtraConfig.deserialize(deserializer);
    expect(restored).toBeInstanceOf(TransactionExtraConfigV1);
    expect((restored as TransactionExtraConfigV1).multisigAddress?.equals(addr)).toBe(true);
    expect((restored as TransactionExtraConfigV1).replayProtectionNonce).toBeUndefined();
  });

  test("TransactionPayloadEncryptedPayload rejects non-32-byte hash", () => {
    const ct = makeStubCiphertext();
    const config = new TransactionExtraConfigV1();
    expect(() => new TransactionPayloadEncryptedPayload(ct, config, new Uint8Array(31))).toThrow("32 bytes");
  });

  test("TransactionPayloadEncryptedPayload serialize/deserialize round-trip", () => {
    const ct = makeStubCiphertext();
    const payloadHash = new Uint8Array(32);
    payloadHash.fill(0xab);
    const config = new TransactionExtraConfigV1(undefined, 99n);
    const payload = new TransactionPayloadEncryptedPayload(ct, config, payloadHash);

    const bytes = payload.bcsToBytes();
    expect(bytes.length).toBeGreaterThan(32);

    const restoredPayload = TransactionPayload.deserialize(new Deserializer(bytes));
    expect(restoredPayload).toBeInstanceOf(TransactionPayloadEncryptedPayload);
    const restored = restoredPayload as TransactionPayloadEncryptedPayload;

    expect(restored.ciphertext.bcsToBytes()).toEqual(ct.bcsToBytes());

    expect(restored.extraConfig).toBeInstanceOf(TransactionExtraConfigV1);
    const restoredConfig = restored.extraConfig as TransactionExtraConfigV1;
    expect(restoredConfig.multisigAddress).toBeUndefined();
    expect(restoredConfig.replayProtectionNonce).toBe(99n);

    expect(restored.payloadHash).toEqual(payloadHash);
    expect(restored.claimedEntryFun).toBeUndefined();
  });

  test("TransactionPayloadEncryptedPayload round-trip with ClaimedEntryFunction (module + function)", () => {
    const ct = makeStubCiphertext();
    const payloadHash = new Uint8Array(32);
    payloadHash.fill(0xcd);
    const config = new TransactionExtraConfigV1();
    const entryFn = EntryFunction.build("0x1::aptos_account", "transfer", [], []);
    const claim = ClaimedEntryFunction.fromEntryFunction(entryFn);
    const payload = new TransactionPayloadEncryptedPayload(ct, config, payloadHash, claim);

    const bytes = payload.bcsToBytes();
    const restoredPayload = TransactionPayload.deserialize(new Deserializer(bytes));
    expect(restoredPayload).toBeInstanceOf(TransactionPayloadEncryptedPayload);
    const restored = restoredPayload as TransactionPayloadEncryptedPayload;

    expect(restored.claimedEntryFun).toBeDefined();
    expect(restored.claimedEntryFun!.moduleId.address.equals(claim.moduleId.address)).toBe(true);
    expect(restored.claimedEntryFun!.moduleId.name.identifier).toBe(claim.moduleId.name.identifier);
    expect(restored.claimedEntryFun!.functionName?.identifier).toBe("transfer");
  });

  test("TransactionPayloadEncryptedPayload round-trip with module-only claim", () => {
    const ct = makeStubCiphertext();
    const payloadHash = new Uint8Array(32);
    const config = new TransactionExtraConfigV1();
    const entryFn = EntryFunction.build("0x1::aptos_account", "transfer", [], []);
    const claim = ClaimedEntryFunction.fromEntryFunction(entryFn, { includeFunctionName: false });
    const payload = new TransactionPayloadEncryptedPayload(ct, config, payloadHash, claim);

    const restoredPayload = TransactionPayload.deserialize(new Deserializer(payload.bcsToBytes()));
    expect(restoredPayload).toBeInstanceOf(TransactionPayloadEncryptedPayload);
    const restored = restoredPayload as TransactionPayloadEncryptedPayload;

    expect(restored.claimedEntryFun?.functionName).toBeUndefined();
    expect(restored.claimedEntryFun?.moduleId.name.identifier).toBe("aptos_account");
  });

  test("ClaimedEntryFunction BCS round-trip via explicit ModuleId / Identifier", () => {
    const claim = new ClaimedEntryFunction(ModuleId.fromStr("0x1::coin"), new Identifier("fake"));
    const bytes = claim.bcsToBytes();
    const restored = ClaimedEntryFunction.deserialize(new Deserializer(bytes));
    expect(restored.moduleId.name.identifier).toBe("coin");
    expect(restored.functionName?.identifier).toBe("fake");
  });

  /**
   * Golden hex for `aptos_types::transaction::encrypted_payload::ClaimedEntryFunction`:
   * module `0x1::aptos_account`, `Some("transfer")`. Matches aptos-core BCS field order (`module`, `function` option).
   */
  test("ClaimedEntryFunction golden BCS bytes (aptos-core field order: module, Option function)", () => {
    const claim = new ClaimedEntryFunction(ModuleId.fromStr("0x1::aptos_account"), new Identifier("transfer"));
    expect(Buffer.from(claim.bcsToBytes()).toString("hex")).toBe(
      "00000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e7401087472616e73666572",
    );
  });

  test("BIBECiphertext serialize/deserialize preserves id", () => {
    const id = 12345n;
    const G2 = bls12_381.G2.Point;
    const ctG2 = [G2.BASE, G2.BASE, G2.BASE];
    const paddedKey = new SymmetricKey(new Uint8Array(16));
    const symCt = new SymmetricCiphertext(new Uint8Array(12), new Uint8Array(16));
    const bibe = new BIBECiphertext(id, ctG2, paddedKey, symCt);

    const bytes = bibe.bcsToBytes();
    const restored = BIBECiphertext.deserialize(new Deserializer(bytes));

    expect(restored.id).toBe(id);
    expect(restored.bcsToBytes()).toEqual(bytes);
  });
});
