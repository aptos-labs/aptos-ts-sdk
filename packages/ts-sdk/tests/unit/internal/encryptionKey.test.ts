// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";
import { fetchAndCacheEncryptionKey } from "../../../src/internal/encryptionKey.js";
import { clearMemoizeCache } from "../../../src/utils/memoize.js";
import type { LedgerInfo } from "../../../src/types/index.js";

const baseLedger = (overrides: Partial<LedgerInfo & { encryption_key?: string }> = {}): LedgerInfo =>
  ({
    chain_id: 4,
    epoch: "10",
    ledger_version: "1",
    oldest_ledger_version: "0",
    ledger_timestamp: "0",
    node_role: "full_node",
    oldest_block_height: "0",
    block_height: "0",
    git_hash: "",
    ...overrides,
  }) as LedgerInfo;

describe("internal/encryptionKey.fetchAndCacheEncryptionKey", () => {
  // getLedgerInfo memoizes per (fullnode ?? network); clear so each test
  // starts clean.
  beforeEach(() => clearMemoizeCache());
  afterEach(() => clearMemoizeCache());

  it("returns null when the fullnode response omits encryption_key", async () => {
    const mock = createMockClient();
    mock.enqueue({ data: baseLedger({ epoch: "1" }) });

    const result = await fetchAndCacheEncryptionKey({ aptosConfig: mock.config });

    expect(result).toBeNull();
    // It still made the ledger-info call — verified via the recorded request.
    expect(mock.requests).toHaveLength(1);
    expectRequest(mock.requests[0], { method: "GET", originMethod: "getLedgerInfo" });
  });

  it("returns null when encryption_key is the empty string (falsy guard)", async () => {
    const mock = createMockClient();
    mock.enqueue({ data: baseLedger({ epoch: "1", encryption_key: "" }) });

    const result = await fetchAndCacheEncryptionKey({ aptosConfig: mock.config });

    expect(result).toBeNull();
  });

  it("throws when encryption_key is malformed (deserialize path is reached and fails)", async () => {
    // Non-hex characters force `Hex.fromHexInput` to throw — which proves the
    // hex → bytes → BCS pipeline starts executing. (A real key would require
    // valid G2 curve points; the failure here pins that the code path runs.)
    const mock = createMockClient();
    mock.enqueue({ data: baseLedger({ epoch: "1", encryption_key: "not-hex-at-all-zz" }) });

    await expect(fetchAndCacheEncryptionKey({ aptosConfig: mock.config })).rejects.toThrow();
  });

  it("throws when encryption_key is well-formed hex but the bytes do not decode to a valid BCS EncryptionKey", async () => {
    // Empty hex passes Hex.fromHexInput but the Deserializer immediately
    // exhausts trying to read the first length prefix, which the
    // EncryptionKey.deserialize call relies on.
    const mock = createMockClient();
    mock.enqueue({ data: baseLedger({ epoch: "1", encryption_key: "0x" }) });

    await expect(fetchAndCacheEncryptionKey({ aptosConfig: mock.config })).rejects.toThrow();
  });
});
