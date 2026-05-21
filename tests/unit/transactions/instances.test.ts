// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * BCS round-trip tests for transactions/instances/* — constructors,
 * serialize, deserialize, equality of fields. These types are exercised
 * by e2e flows but not asserted at the byte level; this file fills that
 * gap.
 */

import { describe, expect, it } from "vitest";
import { Deserializer, Serializer } from "../../../src/bcs/index.js";
import { AccountAddress } from "../../../src/core/index.js";
import { Ed25519PrivateKey } from "../../../src/core/crypto/ed25519.js";
import { ChainId } from "../../../src/transactions/instances/chainId.js";
import { ModuleId } from "../../../src/transactions/instances/moduleId.js";
import { Identifier } from "../../../src/transactions/instances/identifier.js";
import { RawTransaction } from "../../../src/transactions/instances/rawTransaction.js";
import { MultiAgentTransaction } from "../../../src/transactions/instances/multiAgentTransaction.js";
import { RotationProofChallenge } from "../../../src/transactions/instances/rotationProofChallenge.js";
import {
  EntryFunction,
  Script,
  TransactionPayload,
  TransactionPayloadEntryFunction,
  TransactionPayloadScript,
} from "../../../src/transactions/instances/transactionPayload.js";

const sender = AccountAddress.from("0x1");
const recipient = AccountAddress.from("0x2");
const sponsor = AccountAddress.from("0x3");

function roundTrip<T extends { serialize: (s: Serializer) => void }>(value: T, deserialize: (d: Deserializer) => T): T {
  const serializer = new Serializer();
  value.serialize(serializer);
  const bytes = serializer.toUint8Array();
  return deserialize(new Deserializer(bytes));
}

function makeRawTransaction(seq: bigint = 1n): RawTransaction {
  const moduleId = new ModuleId(AccountAddress.ONE, new Identifier("coin"));
  const entry = new EntryFunction(moduleId, new Identifier("transfer"), [], []);
  const payload = new TransactionPayloadEntryFunction(entry);
  return new RawTransaction(sender, seq, payload, 1000n, 100n, 999999n, new ChainId(4));
}

describe("transactions/instances — BCS round trips", () => {
  describe("MultiAgentTransaction", () => {
    it("round-trips with one secondary signer and no fee payer (boolean tag 0)", async () => {
      const raw = makeRawTransaction();
      const original = new MultiAgentTransaction(raw, [recipient]);

      const restored = roundTrip(original, MultiAgentTransaction.deserialize);

      expect(restored.feePayerAddress).toBeUndefined();
      expect(restored.secondarySignerAddresses).toHaveLength(1);
      expect(restored.secondarySignerAddresses[0].toString()).toBe(recipient.toString());
      expect(restored.rawTransaction.sequence_number).toBe(1n);
      expect(restored.rawTransaction.sender.toString()).toBe(sender.toString());
    });

    it("round-trips with multiple secondary signers AND a fee payer (boolean tag 1)", async () => {
      const raw = makeRawTransaction(7n);
      const seconds = [recipient, AccountAddress.from("0x4")];
      const original = new MultiAgentTransaction(raw, seconds, sponsor);

      const restored = roundTrip(original, MultiAgentTransaction.deserialize);

      expect(restored.feePayerAddress?.toString()).toBe(sponsor.toString());
      expect(restored.secondarySignerAddresses.map((a) => a.toString())).toEqual(seconds.map((a) => a.toString()));
      expect(restored.rawTransaction.sequence_number).toBe(7n);
    });

    it("produces deterministic bytes for identical inputs", () => {
      const a = new MultiAgentTransaction(makeRawTransaction(5n), [recipient], sponsor);
      const b = new MultiAgentTransaction(makeRawTransaction(5n), [recipient], sponsor);

      const sa = new Serializer();
      const sb = new Serializer();
      a.serialize(sa);
      b.serialize(sb);

      expect(Array.from(sa.toUint8Array())).toEqual(Array.from(sb.toUint8Array()));
    });
  });

  describe("RotationProofChallenge", () => {
    it("uses the well-known 0x1::account::RotationProofChallenge identifier", async () => {
      const newKey = new Ed25519PrivateKey(new Uint8Array(32).fill(1));
      const challenge = new RotationProofChallenge({
        sequenceNumber: 0,
        originator: sender,
        currentAuthKey: AccountAddress.ZERO,
        newPublicKey: newKey.publicKey(),
      });

      // Constants — these are part of the on-chain ABI; locking them ensures
      // a future rename can't accidentally drift.
      expect(challenge.accountAddress.toString()).toBe(AccountAddress.ONE.toString());
      expect(challenge.moduleName.value).toBe("account");
      expect(challenge.structName.value).toBe("RotationProofChallenge");
    });

    it("serializes to a known prefix (address + module + struct framing)", () => {
      const newKey = new Ed25519PrivateKey(new Uint8Array(32).fill(1));
      const challenge = new RotationProofChallenge({
        sequenceNumber: 0,
        originator: sender,
        currentAuthKey: AccountAddress.ZERO,
        newPublicKey: newKey.publicKey(),
      });

      const serializer = new Serializer();
      challenge.serialize(serializer);
      const bytes = serializer.toUint8Array();

      // Should be deterministic for fixed inputs.
      const serializer2 = new Serializer();
      challenge.serialize(serializer2);
      expect(Array.from(bytes)).toEqual(Array.from(serializer2.toUint8Array()));

      // The first 32 bytes are the AccountAddress.ONE = 0x...01.
      expect(bytes[31]).toBe(1);
      // The address bytes 0-30 are all zero.
      for (let i = 0; i < 31; i += 1) {
        expect(bytes[i]).toBe(0);
      }
    });
  });

  describe("TransactionPayload variants", () => {
    it("round-trips a TransactionPayloadEntryFunction (via TransactionPayload.deserialize)", async () => {
      const moduleId = new ModuleId(AccountAddress.ONE, new Identifier("coin"));
      const original = new TransactionPayloadEntryFunction(
        new EntryFunction(moduleId, new Identifier("transfer"), [], []),
      );

      const restored = roundTrip(original, TransactionPayload.deserialize) as TransactionPayloadEntryFunction;

      expect(restored).toBeInstanceOf(TransactionPayloadEntryFunction);
      expect(restored.entryFunction.module_name.address.toString()).toBe(
        original.entryFunction.module_name.address.toString(),
      );
      expect(restored.entryFunction.module_name.name.identifier).toBe("coin");
      expect(restored.entryFunction.function_name.identifier).toBe("transfer");
    });

    it("round-trips a TransactionPayloadScript with no args and no type tags", async () => {
      const original = new TransactionPayloadScript(new Script(new Uint8Array([0xa1, 0x1c]), [], []));

      const restored = roundTrip(original, TransactionPayload.deserialize) as TransactionPayloadScript;

      expect(restored).toBeInstanceOf(TransactionPayloadScript);
      expect(Array.from(restored.script.bytecode)).toEqual([0xa1, 0x1c]);
      expect(restored.script.type_args).toHaveLength(0);
      expect(restored.script.args).toHaveLength(0);
    });

    it("TransactionPayload.deserialize throws on an unknown variant index", () => {
      // Serialize a uleb128 = 99 manually as the variant index — guarantees
      // we hit the default branch of the switch in TransactionPayload.deserialize.
      const serializer = new Serializer();
      serializer.serializeU32AsUleb128(99);
      const bytes = serializer.toUint8Array();

      expect(() => TransactionPayload.deserialize(new Deserializer(bytes))).toThrow(
        /Unknown variant index for TransactionPayload/,
      );
    });
  });
});
