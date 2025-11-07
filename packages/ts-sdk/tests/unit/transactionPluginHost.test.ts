// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from "vitest";

describe("ts-sdk default transaction plugin host", () => {
  it("registers the API transaction plugin host on import", async () => {
    vi.resetModules();

    const hostModule = await import("@aptos-labs/ts-transactions/plugins/host");
    expect(() => hostModule.getTransactionPluginHost()).toThrow("Transaction plugin host has not been configured.");

    await import("@aptos-labs/ts-sdk");
    const { apiTransactionPluginHost } = await import("@aptos-labs/ts-api/internal/registerTransactionHost");

    expect(hostModule.getTransactionPluginHost()).toBe(apiTransactionPluginHost);

    vi.resetModules();
  });
});
