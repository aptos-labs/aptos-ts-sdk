// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { Deserializer, Serializer } from "../../../src/bcs/index.js";
import { AccountAddress } from "../../../src/core/index.js";
import { Account } from "../../../src/account/Account.js";
import { ChainId } from "../../../src/transactions/instances/chainId.js";
import { ModuleId } from "../../../src/transactions/instances/moduleId.js";
import { Identifier } from "../../../src/transactions/instances/identifier.js";
import { RawTransaction } from "../../../src/transactions/instances/rawTransaction.js";
import { MultiAgentTransaction } from "../../../src/transactions/instances/multiAgentTransaction.js";
import { SimpleTransaction } from "../../../src/transactions/instances/simpleTransaction.js";
import {
  EntryFunction,
  TransactionPayloadEntryFunction,
} from "../../../src/transactions/instances/transactionPayload.js";
import {
  assertSimulatableTransaction,
  ENCRYPTED_TRANSACTION_SIMULATION_NOT_SUPPORTED_MESSAGE,
  getSigningMessage,
  signTransaction,
  signAsFeePayer,
} from "../../../src/internal/transactionSubmission.js";
import { AccountAuthenticator } from "../../../src/transactions/authenticator/account.js";

function makeRaw(sender: AccountAddress, seq = 1n): RawTransaction {
  const moduleId = new ModuleId(AccountAddress.ONE, new Identifier("coin"));
  const payload = new TransactionPayloadEntryFunction(new EntryFunction(moduleId, new Identifier("transfer"), [], []));
  return new RawTransaction(sender, seq, payload, 1000n, 100n, 999999n, new ChainId(4));
}

describe("internal/transactionSubmission helpers", () => {
  const signer = Account.generate();

  describe("getSigningMessage", () => {
    it("returns a non-empty byte array tied to the raw transaction", () => {
      const txn = new SimpleTransaction(makeRaw(signer.accountAddress));
      const msg = getSigningMessage({ transaction: txn });

      expect(msg).toBeInstanceOf(Uint8Array);
      expect(msg.length).toBeGreaterThan(0);
    });

    it("changes when sequence_number changes (so signatures can't be replayed)", () => {
      const a = new SimpleTransaction(makeRaw(signer.accountAddress, 1n));
      const b = new SimpleTransaction(makeRaw(signer.accountAddress, 2n));

      const ma = getSigningMessage({ transaction: a });
      const mb = getSigningMessage({ transaction: b });

      expect(Array.from(ma)).not.toEqual(Array.from(mb));
    });
  });

  describe("signTransaction", () => {
    it("returns an AccountAuthenticator that can be BCS round-tripped", () => {
      const txn = new SimpleTransaction(makeRaw(signer.accountAddress));
      const auth = signTransaction({ signer, transaction: txn });

      expect(auth).toBeInstanceOf(AccountAuthenticator);

      const s = new Serializer();
      auth.serialize(s);
      const bytes = s.toUint8Array();

      const restored = AccountAuthenticator.deserialize(new Deserializer(bytes));
      expect(restored).toBeInstanceOf(AccountAuthenticator);
    });
  });

  describe("signAsFeePayer", () => {
    it("throws when the transaction is not a fee-payer transaction (feePayerAddress absent)", () => {
      const txn = new SimpleTransaction(makeRaw(signer.accountAddress));
      // SimpleTransaction has no feePayerAddress.
      expect(() => signAsFeePayer({ signer, transaction: txn })).toThrow(/is not a Fee Payer transaction/);
    });

    it("mutates feePayerAddress to the signer's address and signs the transaction", () => {
      const multi = new MultiAgentTransaction(
        makeRaw(signer.accountAddress),
        [signer.accountAddress],
        AccountAddress.ZERO, // placeholder fee payer; signAsFeePayer overwrites this
      );
      const sponsor = Account.generate();

      const auth = signAsFeePayer({ signer: sponsor, transaction: multi });

      expect(auth).toBeInstanceOf(AccountAuthenticator);
      // The signed transaction's feePayerAddress was rewritten in place.
      expect(multi.feePayerAddress!.toString()).toBe(sponsor.accountAddress.toString());
    });
  });

  describe("assertSimulatableTransaction", () => {
    it("does not throw for a normal entry-function payload", () => {
      const txn = new SimpleTransaction(makeRaw(signer.accountAddress));
      expect(() => assertSimulatableTransaction(txn)).not.toThrow();
    });

    it("ENCRYPTED_TRANSACTION_SIMULATION_NOT_SUPPORTED_MESSAGE contains 'encrypted' and references plaintext alternative", () => {
      // Spot-pin the message string. We don't construct an encrypted payload
      // here (that needs a real EncryptionKey + valid ciphertext bytes); the
      // throw branch is covered by the e2e suite. Pinning the message
      // catches accidental wording changes that consumers may depend on.
      expect(ENCRYPTED_TRANSACTION_SIMULATION_NOT_SUPPORTED_MESSAGE).toMatch(/encrypted/i);
      expect(ENCRYPTED_TRANSACTION_SIMULATION_NOT_SUPPORTED_MESSAGE).toMatch(/plaintext/i);
    });
  });
});
