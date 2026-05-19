// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { vi, describe, test, expect, beforeEach, type MockedFunction } from "vitest";
import { AptosConfig, Network } from "../../../src";
import { AccountAddress, AuthenticationKey } from "../../../src/core";
import { EntryFunction, TransactionPayloadEntryFunction } from "../../../src/transactions/instances/transactionPayload";
import { PayloadAssociatedData } from "../../../src/transactions/instances/encryptedPayload";
import { buildEncryptedPayload } from "../../../src/transactions/transactionBuilder/encryptPayload";
import { fetchAndCacheEncryptionKey } from "../../../src/internal/encryptionKey";
import * as accountModule from "../../../src/internal/account";

vi.mock("../../../src/internal/encryptionKey", () => ({
  fetchAndCacheEncryptionKey: vi.fn(),
}));

const mockFetch = fetchAndCacheEncryptionKey as MockedFunction<typeof fetchAndCacheEncryptionKey>;
const mockFetchAuthKey = vi.spyOn(accountModule, "fetchAndCacheAuthKeyForAddress");

const config = new AptosConfig({ network: Network.MAINNET });
const sender = AccountAddress.ONE;
const VALID_AUTH_KEY = `0x${"ab".repeat(32)}`;
const FETCHED_AUTH_KEY = new AuthenticationKey({ data: `0x${"cd".repeat(32)}` });

/**
 * Returns a mock encryption key whose `encrypt` records the `associatedData` argument so tests can
 * assert on `PayloadAssociatedData.signerAuthKeys` without running the BLS12-381 IBE path.
 */
function mockEncryptionWithCapture(): { encrypt: ReturnType<typeof vi.fn>; lastAd: () => PayloadAssociatedData } {
  let captured: PayloadAssociatedData | undefined;
  const encrypt = vi.fn().mockImplementation((_payload, ad: PayloadAssociatedData) => {
    captured = ad;
    return {};
  });
  mockFetch.mockResolvedValue({ key: { encrypt }, epoch: 1n } as any);
  return {
    encrypt,
    lastAd: () => {
      if (!captured) throw new Error("encrypt was not called");
      return captured;
    },
  };
}

function makePayload(): TransactionPayloadEntryFunction {
  return new TransactionPayloadEntryFunction(EntryFunction.build("0x1::aptos_account", "transfer", [], []));
}

describe("buildEncryptedPayload input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAuthKey.mockResolvedValue(FETCHED_AUTH_KEY);
  });

  test("fetches sender auth key from chain when senderAuthenticationKey is omitted and threads it into the AAD", async () => {
    const { lastAd } = mockEncryptionWithCapture();
    await buildEncryptedPayload({
      aptosConfig: config,
      sender,
      payload: makePayload(),
      options: { encrypted: true },
    });
    expect(mockFetchAuthKey).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, accountAddress: sender }),
    );
    expect(lastAd().signerAuthKeys[0]?.authenticationKey.toString()).toBe(FETCHED_AUTH_KEY.toString());
  });

  test("does not fetch sender auth key when senderAuthenticationKey is provided", async () => {
    mockFetch.mockResolvedValue({ key: { encrypt: vi.fn().mockReturnValue({}) }, epoch: 1n } as any);
    await buildEncryptedPayload({
      aptosConfig: config,
      sender,
      payload: makePayload(),
      options: { encrypted: true, senderAuthenticationKey: VALID_AUTH_KEY },
    });
    expect(mockFetchAuthKey).not.toHaveBeenCalled();
  });

  test("accepts a Uint8Array senderAuthenticationKey and threads it into the AAD", async () => {
    const { lastAd } = mockEncryptionWithCapture();
    const bytes = new Uint8Array(32).fill(0xab);
    await buildEncryptedPayload({
      aptosConfig: config,
      sender,
      payload: makePayload(),
      options: { encrypted: true, senderAuthenticationKey: bytes },
    });
    expect(lastAd().signerAuthKeys[0]?.authenticationKey.toString()).toBe(`0x${"ab".repeat(32)}`);
  });

  test("hex string, Uint8Array, and AuthenticationKey inputs with the same bytes produce the same AAD auth key", async () => {
    const bytes = new Uint8Array(32).fill(0xab);
    const hex = `0x${"ab".repeat(32)}`;
    const authKey = new AuthenticationKey({ data: bytes });
    const captureFor = async (input: any): Promise<string> => {
      const { lastAd } = mockEncryptionWithCapture();
      await buildEncryptedPayload({
        aptosConfig: config,
        sender,
        payload: makePayload(),
        options: { encrypted: true, senderAuthenticationKey: input },
      });
      return lastAd().signerAuthKeys[0]!.authenticationKey.toString();
    };
    const a = await captureFor(hex);
    const b = await captureFor(bytes);
    const c = await captureFor(authKey);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  test("an unrotated account address (bytes or string) produces the same auth key in the AAD as fetching it from chain", async () => {
    // For accounts that have never rotated, the on-chain authentication_key equals the account address bytes.
    // Passing the address as `senderAuthenticationKey` (in any 32-byte form) should therefore produce a bit-identical
    // AAD to what the on-chain fetch fallback would have produced — and skip the network call.
    const freshSender = AccountAddress.from(`0x${"01".repeat(32)}`);
    const expectedAuthKey = new AuthenticationKey({ data: freshSender.toUint8Array() }).toString();

    const captureFor = async (input: any): Promise<string> => {
      const { lastAd } = mockEncryptionWithCapture();
      await buildEncryptedPayload({
        aptosConfig: config,
        sender: freshSender,
        payload: makePayload(),
        options: { encrypted: true, senderAuthenticationKey: input },
      });
      return lastAd().signerAuthKeys[0]!.authenticationKey.toString();
    };
    expect(await captureFor(freshSender.toUint8Array())).toBe(expectedAuthKey);
    expect(await captureFor(freshSender.toString())).toBe(expectedAuthKey);
    expect(mockFetchAuthKey).not.toHaveBeenCalled();
  });

  test("throws when secondarySignerAuthenticationKeys count does not match secondaries", async () => {
    await expect(
      buildEncryptedPayload({
        aptosConfig: config,
        sender,
        payload: makePayload(),
        options: {
          encrypted: true,
          senderAuthenticationKey: VALID_AUTH_KEY,
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
          senderAuthenticationKey: VALID_AUTH_KEY,
          secondarySignerAuthenticationKeys: [VALID_AUTH_KEY],
        },
      }),
    ).rejects.toThrow("secondarySignerAuthenticationKeys was set but no secondarySignerAddresses");
  });

  test("fetches fee payer auth key from chain when feePayerAuthenticationKey is omitted for a non-zero fee payer", async () => {
    mockFetch.mockResolvedValue({ key: { encrypt: vi.fn().mockReturnValue({}) }, epoch: 1n } as any);
    await buildEncryptedPayload({
      aptosConfig: config,
      sender,
      payload: makePayload(),
      options: { encrypted: true, senderAuthenticationKey: VALID_AUTH_KEY },
      feePayerAddress: AccountAddress.TWO,
    });
    expect(mockFetchAuthKey).toHaveBeenCalledWith(
      expect.objectContaining({ aptosConfig: config, accountAddress: AccountAddress.TWO }),
    );
  });

  test("throws when feePayerAuthenticationKey is provided but feePayerAddress is absent", async () => {
    await expect(
      buildEncryptedPayload({
        aptosConfig: config,
        sender,
        payload: makePayload(),
        options: {
          encrypted: true,
          senderAuthenticationKey: VALID_AUTH_KEY,
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
          senderAuthenticationKey: VALID_AUTH_KEY,
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
          senderAuthenticationKey: VALID_AUTH_KEY,
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
        options: { encrypted: true, senderAuthenticationKey: VALID_AUTH_KEY },
      }),
    ).rejects.toThrow("node does not provide an encryption key");
  });

  test("includes claimedEntryFunction when feePayerAddress is ZERO (withFeePayer:true gas-station path)", async () => {
    const mockCiphertext = {} as any;
    mockFetch.mockResolvedValue({ key: { encrypt: vi.fn().mockReturnValue(mockCiphertext) }, epoch: 1n } as any);
    const result = await buildEncryptedPayload({
      aptosConfig: config,
      sender,
      payload: makePayload(),
      options: { encrypted: true, senderAuthenticationKey: VALID_AUTH_KEY },
      feePayerAddress: AccountAddress.ZERO,
    });
    expect(result.claimedEntryFunction).not.toBeUndefined();
    expect(result.claimedEntryFunction?.moduleId.address.toString()).toBe("0x1");
  });

  test("omits claimedEntryFunction when no feePayerAddress and no multisig", async () => {
    const mockCiphertext = {} as any;
    mockFetch.mockResolvedValue({ key: { encrypt: vi.fn().mockReturnValue(mockCiphertext) }, epoch: 1n } as any);
    const result = await buildEncryptedPayload({
      aptosConfig: config,
      sender,
      payload: makePayload(),
      options: { encrypted: true, senderAuthenticationKey: VALID_AUTH_KEY },
    });
    expect(result.claimedEntryFunction).toBeUndefined();
  });
});
