// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  convertAmountFromHumanReadableToOnChain,
  convertAmountFromOnChainToHumanReadable,
  floorToWholeHour,
  getEnvVar,
  getErrorMessage,
  getFunctionParts,
  isBun,
  isEncodedStruct,
  isValidFunctionInfo,
  nowInSeconds,
  parseEncodedStruct,
  sleep,
  truncateAddress,
  warnIfDevelopment,
} from "../../src/utils/helpers.js";

describe("isBun", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false in the default Vitest node environment", () => {
    expect(isBun()).toBe(false);
  });

  it("returns true when a Bun global is present", () => {
    vi.stubGlobal("Bun", { version: "1.2.0" });
    expect(isBun()).toBe(true);
  });
});

describe("getEnvVar", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the env value when process.env defines it", () => {
    vi.stubGlobal("process", { env: { MY_VAR: "hello" } });
    expect(getEnvVar("MY_VAR")).toBe("hello");
  });

  it("returns undefined when the env var is not set", () => {
    vi.stubGlobal("process", { env: {} });
    expect(getEnvVar("MISSING_VAR")).toBeUndefined();
  });

  it("returns undefined when process is unavailable", () => {
    vi.stubGlobal("process", undefined);
    expect(getEnvVar("ANY_VAR")).toBeUndefined();
  });
});

describe("warnIfDevelopment", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("warns when NODE_ENV is 'development'", () => {
    vi.stubGlobal("process", { env: { NODE_ENV: "development" } });
    warnIfDevelopment("hello-dev");
    expect(warnSpy).toHaveBeenCalledWith("hello-dev");
  });

  it("warns when NODE_ENV is 'test'", () => {
    vi.stubGlobal("process", { env: { NODE_ENV: "test" } });
    warnIfDevelopment("hello-test");
    expect(warnSpy).toHaveBeenCalledWith("hello-test");
  });

  it("warns when APTOS_SDK_WARNINGS=true overrides NODE_ENV", () => {
    vi.stubGlobal("process", { env: { NODE_ENV: "production", APTOS_SDK_WARNINGS: "true" } });
    warnIfDevelopment("forced");
    expect(warnSpy).toHaveBeenCalledWith("forced");
  });

  it("does NOT warn in production with no opt-in", () => {
    vi.stubGlobal("process", { env: { NODE_ENV: "production" } });
    warnIfDevelopment("silenced");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does NOT warn when process is unavailable", () => {
    vi.stubGlobal("process", undefined);
    warnIfDevelopment("no-process");
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("sleep", () => {
  it("resolves only after the requested delay", async () => {
    vi.useFakeTimers();
    try {
      const start = Date.now();
      const promise = sleep(500);
      // Promise should not resolve before the timer fires.
      let resolved = false;
      promise.then(() => {
        resolved = true;
      });
      await Promise.resolve();
      expect(resolved).toBe(false);

      await vi.advanceTimersByTimeAsync(500);
      await promise;
      expect(resolved).toBe(true);
      expect(Date.now() - start).toBeGreaterThanOrEqual(500);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("getErrorMessage", () => {
  it("returns Error.message when given an Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("returns the stringified value when given a non-Error", () => {
    expect(getErrorMessage("plain string")).toBe("plain string");
    expect(getErrorMessage(42)).toBe("42");
    expect(getErrorMessage(undefined)).toBe("undefined");
    expect(getErrorMessage(null)).toBe("null");
  });

  it("handles Error subclasses", () => {
    class MyErr extends Error {}
    expect(getErrorMessage(new MyErr("subclass-msg"))).toBe("subclass-msg");
  });
});

describe("nowInSeconds", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the current unix timestamp in seconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    expect(nowInSeconds()).toBe(Math.floor(new Date("2024-01-01T00:00:00Z").getTime() / 1000));
  });

  it("floors fractional seconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1_700_000_000_999)); // .999s past the epoch second
    expect(nowInSeconds()).toBe(1_700_000_000);
  });
});

describe("floorToWholeHour", () => {
  it("rounds a mid-hour timestamp down to the hour boundary", () => {
    // 2024-01-01T12:34:56Z
    const ts = Math.floor(new Date("2024-01-01T12:34:56Z").getTime() / 1000);
    const floored = floorToWholeHour(ts);
    // Whole-hour timestamp: should be exactly 12:00:00 in the LOCAL timezone the
    // SDK uses (the implementation calls setMinutes/setSeconds, which mutates
    // local-time fields). The invariant we care about is that minutes/seconds
    // are zero in the resulting wall-clock representation.
    const date = new Date(floored * 1000);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
    // And it must not advance past the input.
    expect(floored).toBeLessThanOrEqual(ts);
  });

  it("is idempotent on an already-floored timestamp", () => {
    const ts = Math.floor(new Date("2024-01-01T12:00:00Z").getTime() / 1000);
    expect(floorToWholeHour(ts)).toBe(floorToWholeHour(floorToWholeHour(ts)));
  });
});

describe("convertAmountFromHumanReadableToOnChain / convertAmountFromOnChainToHumanReadable", () => {
  it("scales up by 10^decimals", () => {
    expect(convertAmountFromHumanReadableToOnChain(500, 8)).toBe(50_000_000_000);
    expect(convertAmountFromHumanReadableToOnChain(1, 0)).toBe(1);
    expect(convertAmountFromHumanReadableToOnChain(0, 8)).toBe(0);
  });

  it("scales down by 10^decimals", () => {
    expect(convertAmountFromOnChainToHumanReadable(50_000_000_000, 8)).toBe(500);
    expect(convertAmountFromOnChainToHumanReadable(0, 8)).toBe(0);
  });

  it("round-trips", () => {
    const human = 1234.5;
    const onChain = convertAmountFromHumanReadableToOnChain(human, 6);
    expect(convertAmountFromOnChainToHumanReadable(onChain, 6)).toBeCloseTo(human, 10);
  });
});

describe("parseEncodedStruct / isEncodedStruct", () => {
  it("parses a hex-encoded struct triple into a Move struct id", () => {
    expect(
      parseEncodedStruct({
        account_address: "0x1",
        // hex for "aptos_coin"
        module_name: "0x6170746f735f636f696e",
        // hex for "AptosCoin"
        struct_name: "0x4170746f73436f696e",
      }),
    ).toBe("0x1::aptos_coin::AptosCoin");
  });

  it("recognizes a well-formed encoded struct", () => {
    expect(isEncodedStruct({ account_address: "0x1", module_name: "0x00", struct_name: "0x00" })).toBe(true);
  });

  it("rejects shapes that are missing fields or have wrong types", () => {
    expect(isEncodedStruct(null)).toBe(false);
    expect(isEncodedStruct(undefined)).toBe(false);
    expect(isEncodedStruct("0x1::aptos_coin::AptosCoin")).toBe(false);
    expect(isEncodedStruct([1, 2, 3])).toBe(false);
    expect(isEncodedStruct({})).toBe(false);
    expect(isEncodedStruct({ account_address: "0x1", module_name: "0x00" })).toBe(false);
    expect(isEncodedStruct({ account_address: 1, module_name: "0x00", struct_name: "0x00" })).toBe(false);
  });
});

describe("getFunctionParts", () => {
  it("splits a fully-qualified function id into its three parts", () => {
    expect(getFunctionParts("0x1::coin::transfer")).toEqual({
      moduleAddress: "0x1",
      moduleName: "coin",
      functionName: "transfer",
    });
  });

  it("throws on too few or too many segments", () => {
    // @ts-expect-error — runtime guard for malformed input
    expect(() => getFunctionParts("0x1::coin")).toThrow(/Invalid function/);
    // @ts-expect-error — runtime guard for malformed input
    expect(() => getFunctionParts("0x1::coin::transfer::extra")).toThrow(/Invalid function/);
  });
});

describe("isValidFunctionInfo", () => {
  it("accepts a 3-part identifier with a valid leading address", () => {
    expect(isValidFunctionInfo("0x1::coin::transfer")).toBe(true);
  });

  it("rejects identifiers with the wrong number of parts", () => {
    expect(isValidFunctionInfo("0x1::coin")).toBe(false);
    expect(isValidFunctionInfo("0x1::coin::transfer::oops")).toBe(false);
  });

  it("rejects a 3-part identifier whose first segment isn't a valid address", () => {
    expect(isValidFunctionInfo("not-an-address::coin::transfer")).toBe(false);
  });
});

describe("truncateAddress", () => {
  it("keeps the default 6 leading and 5 trailing characters", () => {
    // Default is start=6, end=5.
    expect(truncateAddress("0x1234567890abcdef1234567890abcdef")).toBe("0x1234...bcdef");
  });

  it("honors custom start/end character counts", () => {
    expect(truncateAddress("0x1234567890abcdef", 4, 3)).toBe("0x12...def");
  });

  it("still produces an ellipsis when the address is shorter than start+end", () => {
    // The implementation just slices; nothing in it forbids overlap.
    // "0xabcd".slice(0,6) -> "0xabcd"; "0xabcd".slice(-5) -> "xabcd".
    expect(truncateAddress("0xabcd", 6, 5)).toBe("0xabcd...xabcd");
  });
});
