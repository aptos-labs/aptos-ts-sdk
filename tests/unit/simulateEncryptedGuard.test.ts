// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { AccountAddress } from "../../src/core";
import { BIBECiphertext, Ciphertext, SymmetricCiphertext, SymmetricKey } from "../../src/core/crypto/encryption";
import {
  assertSimulatableTransaction,
  ENCRYPTED_TRANSACTION_SIMULATION_NOT_SUPPORTED_MESSAGE,
} from "../../src/internal/transactionSubmission";
import { bls12_381 } from "@noble/curves/bls12-381.js";
import { ChainId } from "../../src/transactions/instances/chainId";
import { RawTransaction } from "../../src/transactions/instances/rawTransaction";
import { SimpleTransaction } from "../../src/transactions/instances/simpleTransaction";
import {
  TransactionExtraConfigV1,
  TransactionPayloadEncryptedPayload,
} from "../../src/transactions/instances/transactionPayload";

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

describe("assertSimulatableTransaction", () => {
  test("throws for encrypted payload with actionable message", () => {
    const payloadHash = new Uint8Array(32);
    const encPayload = new TransactionPayloadEncryptedPayload(
      makeStubCiphertext(),
      new TransactionExtraConfigV1(undefined, undefined),
      payloadHash,
      0n,
    );
    const rawTxn = new RawTransaction(AccountAddress.ZERO, 0n, encPayload, 1000n, 1n, 9999999999n, new ChainId(1));
    const transaction = new SimpleTransaction(rawTxn);

    expect(() => assertSimulatableTransaction(transaction)).toThrow(
      ENCRYPTED_TRANSACTION_SIMULATION_NOT_SUPPORTED_MESSAGE,
    );
  });
});
