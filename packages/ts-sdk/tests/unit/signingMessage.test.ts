// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { sha3_256 } from "@noble/hashes/sha3.js";
import {
  AccountAddress,
  ChainId,
  EntryFunction,
  RawTransaction,
  TransactionPayloadEntryFunction,
} from "../../src/index.js";
import { Serializer } from "../../src/bcs/index.js";
import {
  deriveTransactionType,
  generateSigningMessage,
  generateSigningMessageForSerializable,
  generateSigningMessageForTransaction,
} from "../../src/transactions/transactionBuilder/signingMessage.js";
import { FeePayerRawTransaction, MultiAgentRawTransaction } from "../../src/transactions/instances/index.js";
import { RAW_TRANSACTION_SALT, RAW_TRANSACTION_WITH_DATA_SALT } from "../../src/utils/const.js";

function makeRawTransaction(): RawTransaction {
  const payload = new TransactionPayloadEntryFunction(EntryFunction.build("0x1::aptos_account", "transfer", [], []));
  return new RawTransaction(AccountAddress.A, 1n, payload, 1000n, 100n, 1_000_000_000n, new ChainId(1));
}

describe("generateSigningMessage", () => {
  it("rejects a domain separator that does not start with APTOS::", () => {
    expect(() => generateSigningMessage(new Uint8Array([1, 2, 3]), "NOT_APTOS::Foo")).toThrow(
      /Domain separator needs to start with 'APTOS::'/,
    );
  });

  it("prepends sha3_256(domain) to the body bytes", () => {
    const body = new Uint8Array([9, 9, 9]);
    const domain = "APTOS::Test";
    const out = generateSigningMessage(body, domain);

    const expectedPrefix = sha3_256(new TextEncoder().encode(domain));
    expect(out.subarray(0, expectedPrefix.length)).toEqual(expectedPrefix);
    expect(out.subarray(expectedPrefix.length)).toEqual(body);
  });
});

describe("generateSigningMessageForSerializable", () => {
  it("uses the class name as the domain (with APTOS:: prefix)", () => {
    class Foo {
      bcsToBytes(): Uint8Array {
        return new Uint8Array([1, 2, 3]);
      }
      serialize(_serializer: Serializer): void {
        _serializer.serializeBytes(this.bcsToBytes());
      }
    }
    const out = generateSigningMessageForSerializable(new Foo() as never);
    const expectedPrefix = sha3_256(new TextEncoder().encode("APTOS::Foo"));
    expect(out.subarray(0, expectedPrefix.length)).toEqual(expectedPrefix);
    expect(out.subarray(expectedPrefix.length)).toEqual(new Uint8Array([1, 2, 3]));
  });
});

describe("deriveTransactionType", () => {
  const rawTransaction = makeRawTransaction();

  it("returns FeePayerRawTransaction when feePayerAddress is set", () => {
    const derived = deriveTransactionType({
      rawTransaction,
      feePayerAddress: AccountAddress.A,
    });
    expect(derived).toBeInstanceOf(FeePayerRawTransaction);
  });

  it("returns MultiAgentRawTransaction when only secondarySignerAddresses is set", () => {
    const derived = deriveTransactionType({
      rawTransaction,
      secondarySignerAddresses: [AccountAddress.A],
    });
    expect(derived).toBeInstanceOf(MultiAgentRawTransaction);
  });

  it("returns the raw transaction itself when neither is set", () => {
    const derived = deriveTransactionType({ rawTransaction });
    expect(derived).toBe(rawTransaction);
  });

  it("prefers FeePayerRawTransaction over MultiAgentRawTransaction when both are set", () => {
    const derived = deriveTransactionType({
      rawTransaction,
      feePayerAddress: AccountAddress.A,
      secondarySignerAddresses: [AccountAddress.A],
    });
    expect(derived).toBeInstanceOf(FeePayerRawTransaction);
  });
});

describe("generateSigningMessageForTransaction", () => {
  const rawTransaction = makeRawTransaction();

  it("uses the RawTransaction salt for a vanilla transaction", () => {
    const out = generateSigningMessageForTransaction({ rawTransaction });
    const expectedPrefix = sha3_256(new TextEncoder().encode(RAW_TRANSACTION_SALT));
    expect(out.subarray(0, expectedPrefix.length)).toEqual(expectedPrefix);
  });

  it("uses the RawTransactionWithData salt for a fee-payer transaction", () => {
    const out = generateSigningMessageForTransaction({
      rawTransaction,
      feePayerAddress: AccountAddress.A,
    });
    const expectedPrefix = sha3_256(new TextEncoder().encode(RAW_TRANSACTION_WITH_DATA_SALT));
    expect(out.subarray(0, expectedPrefix.length)).toEqual(expectedPrefix);
  });

  it("uses the RawTransactionWithData salt for a multi-agent transaction", () => {
    const out = generateSigningMessageForTransaction({
      rawTransaction,
      secondarySignerAddresses: [AccountAddress.A],
    });
    const expectedPrefix = sha3_256(new TextEncoder().encode(RAW_TRANSACTION_WITH_DATA_SALT));
    expect(out.subarray(0, expectedPrefix.length)).toEqual(expectedPrefix);
  });
});
