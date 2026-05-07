// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { vi, describe, test, expect, beforeEach, type MockedFunction } from "vitest";

vi.mock("../../../src/transactions/transactionBuilder/encryptPayload", () => ({
  buildEncryptedPayload: vi.fn(),
}));

import { AptosConfig, Network } from "../../../src";
import { AccountAddress } from "../../../src/core";
import { bls12_381 } from "@noble/curves/bls12-381.js";
import { EntryFunction, TransactionPayloadEntryFunction } from "../../../src/transactions/instances/transactionPayload";
import { BIBECiphertext, Ciphertext } from "../../../src/core/crypto/encryption/ciphertext";
import { SymmetricCiphertext, SymmetricKey } from "../../../src/core/crypto/encryption/symmetric";
import {
  TransactionExtraConfigV1,
  TransactionPayloadEncryptedPayload,
} from "../../../src/transactions/instances/transactionPayload";
import { buildEncryptedPayload } from "../../../src/transactions/transactionBuilder/encryptPayload";
import { generateRawTransaction } from "../../../src/transactions/transactionBuilder/transactionBuilder";
import { MIN_ENCRYPTED_TXN_GAS_UNIT_PRICE } from "../../../src/utils/const";

const mockBuildEncryptedPayload = buildEncryptedPayload as MockedFunction<typeof buildEncryptedPayload>;

function makeStubEncryptedPayload(): TransactionPayloadEncryptedPayload {
  const G2 = bls12_381.G2.Point;
  const ct = new Ciphertext(
    new Uint8Array(32),
    new BIBECiphertext(
      1n,
      [G2.BASE, G2.BASE, G2.BASE],
      new SymmetricKey(new Uint8Array(16)),
      new SymmetricCiphertext(new Uint8Array(12), new Uint8Array(48)),
    ),
    new Uint8Array(32),
    new Uint8Array(64),
  );
  return new TransactionPayloadEncryptedPayload(ct, new TransactionExtraConfigV1(), new Uint8Array(32), 1n);
}

describe("encrypted transaction gas floor", () => {
  const config = new AptosConfig({ network: Network.MAINNET });
  const sender = AccountAddress.ONE;
  const VALID_AUTH_KEY = `0x${"ab".repeat(32)}`;
  const payload = new TransactionPayloadEntryFunction(EntryFunction.build("0x1::aptos_account", "transfer", [], []));

  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildEncryptedPayload.mockResolvedValue(makeStubEncryptedPayload());
  });

  test(`bumps gasUnitPrice to ${MIN_ENCRYPTED_TXN_GAS_UNIT_PRICE} when below the minimum`, async () => {
    const rawTxn = await generateRawTransaction({
      aptosConfig: config,
      sender,
      payload,
      options: {
        encrypted: true,
        authenticationKey: VALID_AUTH_KEY,
        gasUnitPrice: 50,
        accountSequenceNumber: 0,
      },
    });
    expect(rawTxn.gas_unit_price).toBe(BigInt(MIN_ENCRYPTED_TXN_GAS_UNIT_PRICE));
  });

  test("does not reduce gasUnitPrice when it already exceeds the minimum", async () => {
    const rawTxn = await generateRawTransaction({
      aptosConfig: config,
      sender,
      payload,
      options: {
        encrypted: true,
        authenticationKey: VALID_AUTH_KEY,
        gasUnitPrice: 300,
        accountSequenceNumber: 0,
      },
    });
    expect(rawTxn.gas_unit_price).toBe(300n);
  });

  test("does not apply the gas floor for non-encrypted transactions", async () => {
    const rawTxn = await generateRawTransaction({
      aptosConfig: config,
      sender,
      payload,
      options: {
        gasUnitPrice: 50,
        accountSequenceNumber: 0,
      },
    });
    expect(rawTxn.gas_unit_price).toBe(50n);
    expect(mockBuildEncryptedPayload).not.toHaveBeenCalled();
  });
});
