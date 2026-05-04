// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { vi, describe, test, expect, beforeEach, type MockedFunction } from "vitest";
import { AptosConfig, Network } from "../../../src";
import { AccountAddress } from "../../../src/core";
import { EntryFunction, TransactionPayloadEntryFunction } from "../../../src/transactions/instances/transactionPayload";
import { buildEncryptedPayload } from "../../../src/transactions/transactionBuilder/encryptPayload";
import { fetchAndCacheEncryptionKey } from "../../../src/internal/encryptionKey";

vi.mock("../../../src/internal/encryptionKey", () => ({
  fetchAndCacheEncryptionKey: vi.fn(),
}));

const mockFetch = fetchAndCacheEncryptionKey as MockedFunction<typeof fetchAndCacheEncryptionKey>;

const config = new AptosConfig({ network: Network.MAINNET });
const sender = AccountAddress.ONE;
const VALID_AUTH_KEY = `0x${"ab".repeat(32)}`;

function makePayload(): TransactionPayloadEntryFunction {
  return new TransactionPayloadEntryFunction(EntryFunction.build("0x1::aptos_account", "transfer", [], []));
}

describe("buildEncryptedPayload input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("throws when authenticationKey is missing", async () => {
    await expect(
      buildEncryptedPayload({
        aptosConfig: config,
        sender,
        payload: makePayload(),
        options: { encrypted: true } as any,
      }),
    ).rejects.toThrow("options.authenticationKey is required");
  });

  test("throws when secondarySignerAuthenticationKeys count does not match secondaries", async () => {
    await expect(
      buildEncryptedPayload({
        aptosConfig: config,
        sender,
        payload: makePayload(),
        options: {
          encrypted: true,
          authenticationKey: VALID_AUTH_KEY,
          secondarySignerAuthenticationKeys: [VALID_AUTH_KEY],
        },
        secondarySignerAddresses: [AccountAddress.TWO, AccountAddress.THREE],
      }),
    ).rejects.toThrow("secondarySignerAuthenticationKeys");
  });

  test("throws when secondarySignerAuthenticationKeys is set but no secondaries provided", async () => {
    await expect(
      buildEncryptedPayload({
        aptosConfig: config,
        sender,
        payload: makePayload(),
        options: {
          encrypted: true,
          authenticationKey: VALID_AUTH_KEY,
          secondarySignerAuthenticationKeys: [VALID_AUTH_KEY],
        },
      }),
    ).rejects.toThrow("secondarySignerAuthenticationKeys was set but no secondarySignerAddresses");
  });

  test("throws when feePayerAuthenticationKey is missing for a non-zero fee payer", async () => {
    await expect(
      buildEncryptedPayload({
        aptosConfig: config,
        sender,
        payload: makePayload(),
        options: {
          encrypted: true,
          authenticationKey: VALID_AUTH_KEY,
        },
        feePayerAddress: AccountAddress.TWO,
      }),
    ).rejects.toThrow("feePayerAuthenticationKey is required");
  });

  test("throws when feePayerAuthenticationKey is provided but feePayerAddress is absent", async () => {
    await expect(
      buildEncryptedPayload({
        aptosConfig: config,
        sender,
        payload: makePayload(),
        options: {
          encrypted: true,
          authenticationKey: VALID_AUTH_KEY,
          feePayerAuthenticationKey: VALID_AUTH_KEY,
        },
      }),
    ).rejects.toThrow("feePayerAddress is missing or the zero address");
  });

  test("throws when claimedEntryFunction module does not match the entry function", async () => {
    await expect(
      buildEncryptedPayload({
        aptosConfig: config,
        sender,
        payload: makePayload(),
        options: {
          encrypted: true,
          authenticationKey: VALID_AUTH_KEY,
          feePayerAuthenticationKey: VALID_AUTH_KEY,
          claimedEntryFunction: { module: "0x1::coin", functionName: "transfer" },
        },
        feePayerAddress: AccountAddress.TWO,
      }),
    ).rejects.toThrow("claimedEntryFunction.module must match");
  });

  test("throws when claimedEntryFunction functionName does not match the entry function", async () => {
    await expect(
      buildEncryptedPayload({
        aptosConfig: config,
        sender,
        payload: makePayload(),
        options: {
          encrypted: true,
          authenticationKey: VALID_AUTH_KEY,
          feePayerAuthenticationKey: VALID_AUTH_KEY,
          claimedEntryFunction: { module: "0x1::aptos_account", functionName: "wrong_function" },
        },
        feePayerAddress: AccountAddress.TWO,
      }),
    ).rejects.toThrow("claimedEntryFunction.functionName must match");
  });

  test("throws when the node does not provide an encryption key", async () => {
    mockFetch.mockResolvedValue(null);
    await expect(
      buildEncryptedPayload({
        aptosConfig: config,
        sender,
        payload: makePayload(),
        options: { encrypted: true, authenticationKey: VALID_AUTH_KEY },
      }),
    ).rejects.toThrow("node does not provide an encryption key");
  });
});
