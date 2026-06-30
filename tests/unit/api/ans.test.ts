// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Covers the `ANS` API class in `src/api/ans.ts`, which is pure delegation to
// `internal/ans.ts`. We mock the internal module and assert each method:
//   (a) forwards `{ aptosConfig: this.config, ...args }` to the matching
//       internal function, and
//   (b) returns the internal function's resolved value unchanged.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/internal/ans.js", () => ({
  getOwnerAddress: vi.fn(),
  getExpiration: vi.fn(),
  getTargetAddress: vi.fn(),
  setTargetAddress: vi.fn(),
  clearTargetAddress: vi.fn(),
  getPrimaryName: vi.fn(),
  setPrimaryName: vi.fn(),
  registerName: vi.fn(),
  renewDomain: vi.fn(),
  getName: vi.fn(),
  getAccountNames: vi.fn(),
  getAccountDomains: vi.fn(),
  getAccountSubdomains: vi.fn(),
  getDomainSubdomains: vi.fn(),
}));

import { ANS } from "../../../src/api/ans.js";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import * as internal from "../../../src/internal/ans.js";

const config = new AptosConfig({ network: Network.MAINNET });
const ans = new ANS(config);

beforeEach(() => {
  vi.clearAllMocks();
});

function expectDelegation(fn: any, ret: unknown) {
  (fn as any).mockResolvedValue(ret);
}

describe("ANS api wrappers delegate to internal/ans with the bound config", () => {
  it("getOwnerAddress", async () => {
    expectDelegation(internal.getOwnerAddress, "OWNER");
    expect(await ans.getOwnerAddress({ name: "a.apt" })).toBe("OWNER");
    expect(internal.getOwnerAddress).toHaveBeenCalledWith({ aptosConfig: config, name: "a.apt" });
  });

  it("getExpiration", async () => {
    expectDelegation(internal.getExpiration, 123);
    expect(await ans.getExpiration({ name: "a" })).toBe(123);
    expect(internal.getExpiration).toHaveBeenCalledWith({ aptosConfig: config, name: "a" });
  });

  it("getTargetAddress", async () => {
    expectDelegation(internal.getTargetAddress, "TARGET");
    expect(await ans.getTargetAddress({ name: "a" })).toBe("TARGET");
    expect(internal.getTargetAddress).toHaveBeenCalledWith({ aptosConfig: config, name: "a" });
  });

  it("setTargetAddress", async () => {
    expectDelegation(internal.setTargetAddress, "TXN");
    const args = { sender: "0x1", name: "a", address: "0x2" } as const;
    expect(await ans.setTargetAddress(args)).toBe("TXN");
    expect(internal.setTargetAddress).toHaveBeenCalledWith({ aptosConfig: config, ...args });
  });

  it("clearTargetAddress", async () => {
    expectDelegation(internal.clearTargetAddress, "TXN");
    const args = { sender: "0x1", name: "a" } as const;
    expect(await ans.clearTargetAddress(args)).toBe("TXN");
    expect(internal.clearTargetAddress).toHaveBeenCalledWith({ aptosConfig: config, ...args });
  });

  it("getPrimaryName", async () => {
    expectDelegation(internal.getPrimaryName, "p.apt");
    expect(await ans.getPrimaryName({ address: "0x1" })).toBe("p.apt");
    expect(internal.getPrimaryName).toHaveBeenCalledWith({ aptosConfig: config, address: "0x1" });
  });

  it("setPrimaryName", async () => {
    expectDelegation(internal.setPrimaryName, "TXN");
    const args = { sender: "0x1", name: "a" } as const;
    expect(await ans.setPrimaryName(args)).toBe("TXN");
    expect(internal.setPrimaryName).toHaveBeenCalledWith({ aptosConfig: config, ...args });
  });

  it("registerName", async () => {
    expectDelegation(internal.registerName, "TXN");
    const args = { sender: "0x1", name: "a", expiration: { policy: "domain" } } as const;
    expect(await ans.registerName(args as any)).toBe("TXN");
    expect(internal.registerName).toHaveBeenCalledWith({ aptosConfig: config, ...args });
  });

  it("renewDomain", async () => {
    expectDelegation(internal.renewDomain, "TXN");
    const args = { sender: "0x1", name: "a" } as const;
    expect(await ans.renewDomain(args)).toBe("TXN");
    expect(internal.renewDomain).toHaveBeenCalledWith({ aptosConfig: config, ...args });
  });

  it("getName", async () => {
    expectDelegation(internal.getName, { domain: "a" });
    expect(await ans.getName({ name: "a" })).toEqual({ domain: "a" });
    expect(internal.getName).toHaveBeenCalledWith({ aptosConfig: config, name: "a" });
  });

  it("getAccountNames", async () => {
    expectDelegation(internal.getAccountNames, { names: [], total: 0 });
    const args = { accountAddress: "0x1" } as const;
    expect(await ans.getAccountNames(args)).toEqual({ names: [], total: 0 });
    expect(internal.getAccountNames).toHaveBeenCalledWith({ aptosConfig: config, ...args });
  });

  it("getAccountDomains", async () => {
    expectDelegation(internal.getAccountDomains, { names: [], total: 0 });
    const args = { accountAddress: "0x1" } as const;
    expect(await ans.getAccountDomains(args)).toEqual({ names: [], total: 0 });
    expect(internal.getAccountDomains).toHaveBeenCalledWith({ aptosConfig: config, ...args });
  });

  it("getAccountSubdomains", async () => {
    expectDelegation(internal.getAccountSubdomains, { names: [], total: 0 });
    const args = { accountAddress: "0x1" } as const;
    expect(await ans.getAccountSubdomains(args)).toEqual({ names: [], total: 0 });
    expect(internal.getAccountSubdomains).toHaveBeenCalledWith({ aptosConfig: config, ...args });
  });

  it("getDomainSubdomains", async () => {
    expectDelegation(internal.getDomainSubdomains, { names: [], total: 0 });
    const args = { domain: "a" } as const;
    expect(await ans.getDomainSubdomains(args)).toEqual({ names: [], total: 0 });
    expect(internal.getDomainSubdomains).toHaveBeenCalledWith({ aptosConfig: config, ...args });
  });
});
