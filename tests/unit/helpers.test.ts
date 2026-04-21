import { base64UrlDecode, base64UrlEncode, base64UrlToBytes, pairedFaMetadataAddress } from "../../src/utils/helpers";
import { getRuntimePlatform, getRuntimePlatformTag } from "../../src/utils/runtime";
import { AccountAddress } from "../../src/core/accountAddress";

describe("pairedFaMetadataAddress", () => {
  test("matches the ground truth cases on chain", () => {
    // Test case 1: Aptos Coin should return APT_METADATA_ADDRESS_HEX
    expect(pairedFaMetadataAddress("0x1::aptos_coin::AptosCoin")).toEqual(AccountAddress.A);

    // Test case 2: Moon Coin should match the specific hash
    expect(
      pairedFaMetadataAddress(
        "0x66c34778730acbb120cefa57a3d98fd21e0c8b3a51e9baee530088b2e444e94c::moon_coin::MoonCoin",
      ),
    ).toEqual(AccountAddress.from("0xf772c28c069aa7e4417d85d771957eb3c5c11b5bf90b1965cda23b899ebc0384"));

    // Test case 3: THL Coin should match the specific hash
    expect(
      pairedFaMetadataAddress("0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL"),
    ).toEqual(AccountAddress.from("0x377adc4848552eb2ea17259be928001923efe12271fef1667e2b784f04a7cf3a"));

    // Test case 4: LP Coin with USDC and AptosCoin should match the specific hash
    expect(
      pairedFaMetadataAddress(
        "0x5a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948::lp_coin::LP<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC, 0x1::aptos_coin::AptosCoin, 0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated>",
      ),
    ).toEqual(AccountAddress.from("0xb7cc2781865ac4b29da6e0660f4cd00c0625cb47b37152405fc8ba2708867e54"));
  });

  test("handles standardization of input types", () => {
    // Test that leading zeros in addresses are handled correctly
    expect(pairedFaMetadataAddress("0x01::aptos_coin::AptosCoin")).toEqual(AccountAddress.A);
    expect(pairedFaMetadataAddress("0x001::aptos_coin::AptosCoin")).toEqual(AccountAddress.A);
  });

  test("handles various address formats", () => {
    const testCases = [
      // Simple forms
      {
        input: "0x1::aptos_coin::AptosCoin",
        expected: AccountAddress.A, // Special case for Aptos Coin
      },
      {
        input: "0x0000000000000000000000000000000000000000000000000000000000000001::aptos_coin::AptosCoin", // long form
        expected: AccountAddress.A,
      },
      {
        input: "0x00001::aptos_coin::AptosCoin", // with leading zeros
        expected: AccountAddress.A,
      },
      // Complex nested types
      {
        input: "0x1::coin::Coin<0x1412::a::struct<0x0001::aptos_coin::AptosCoin>>",
        expected: pairedFaMetadataAddress(
          "0x1::coin::Coin<0x1412::a::struct<0x1::aptos_coin::AptosCoin>>" as `0x${string}::${string}::${string}`,
        ),
      },
      {
        input: "0x1::coin::Coin<0x0001412::a::struct<0x1::aptos_coin::AptosCoin>>",
        expected: pairedFaMetadataAddress(
          "0x1::coin::Coin<0x1412::a::struct<0x1::aptos_coin::AptosCoin>>" as `0x${string}::${string}::${string}`,
        ),
      },
    ];

    for (const { input, expected } of testCases) {
      const result = pairedFaMetadataAddress(input as `0x${string}::${string}::${string}`);
      expect(result).toEqual(expected);
    }
  });

  test("decodes base64url strings of every padding length", () => {
    const cases = [
      { bytes: new Uint8Array([]), b64url: "" }, // len % 4 == 0
      { bytes: new Uint8Array([0x66]), b64url: "Zg" }, // 1 byte -> 2 chars, needs "=="
      { bytes: new Uint8Array([0x66, 0x6f]), b64url: "Zm8" }, // 2 bytes -> 3 chars, needs "="
      { bytes: new Uint8Array([0x66, 0x6f, 0x6f]), b64url: "Zm9v" }, // 3 bytes -> 4 chars, no padding
    ];
    for (const { bytes, b64url } of cases) {
      expect(Array.from(base64UrlToBytes(b64url))).toEqual(Array.from(bytes));
      expect(base64UrlEncode(bytes)).toEqual(b64url);
    }
  });

  test("round-trips a realistic JWT RSA modulus (base64url, len%4==2)", () => {
    // Real RSA `n` from a Google JWK — length is 342 chars, `% 4 == 2`, which
    // the old `% 3` padding formula decoded incorrectly.
    const n =
      "4GffaA1mCbuDpjxYrq1pz6s8XYRxjpz1cT6fEVhh3Q8yzu7clsvUDJCEE-3iFNCQXTd3bPobqcbKMlJBF1GIIj0HsGwOqh3y4WIbIyz5JqJAvC_LTZgJnfKAoyE2m4Wd7fA9SDI4EUEc7FZAV4LPdYb5YjQvTNzQGpCkdcuczCjbkxVZDxCYqIa4MKrjKsKj8TrhkYZWZK6jKfT_YEekSGx0U0SiqobSqjTjLHTAFXGyo1p4Jb1hXQ9ZTj5QbG0TDoqcJ1-ubobS4sRrZZslh-1yYxLu7X3ECx-hoTtbVXtBClc7DZH8x_bqdaEJJkAPPB_mNy9xwRRv_Rnx0f56nw";
    const bytes = base64UrlToBytes(n);
    expect(bytes.length).toEqual(256);
    expect(base64UrlEncode(bytes)).toEqual(n);
  });

  test("base64UrlDecode decodes UTF-8 JWT-style JSON correctly", () => {
    // "héllo" is multi-byte UTF-8, ensures we aren't returning Latin-1 from atob.
    const json = JSON.stringify({ name: "héllo" });
    const b64url = base64UrlEncode(json);
    expect(base64UrlDecode(b64url)).toEqual(json);
  });

  test("normalizes addresses consistently in nested types", () => {
    const variations = [
      "0x1::coin::Coin<0x1412::a::struct<0x0001::aptos_coin::AptosCoin>>",
      "0x01::coin::Coin<0x001412::a::struct<0x1::aptos_coin::AptosCoin>>",
      "0x0001::coin::Coin<0x1412::a::struct<0x00001::aptos_coin::AptosCoin>>",
    ];

    // All variations should produce the same metadata address
    const results = variations.map((input) => pairedFaMetadataAddress(input as `0x${string}::${string}::${string}`));
    const firstResult = results[0];

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(firstResult);
    }
  });
});

describe("getRuntimePlatform", () => {
  // Use Vitest's stub helpers so we can safely override non-writable globals
  // like `navigator` (which Node exposes via a getter-only descriptor).
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("returns 'node' in the default Vitest node environment", () => {
    // No stubs — Vitest's node pool provides `process.versions.node`.
    expect(getRuntimePlatform()).toEqual("node");
  });

  test("returns 'react-native' when navigator.product is 'ReactNative'", () => {
    vi.stubGlobal("navigator", { product: "ReactNative" });
    expect(getRuntimePlatform()).toEqual("react-native");
  });

  test("returns 'deno' when globalThis.Deno is defined (takes precedence over node)", () => {
    vi.stubGlobal("Deno", { version: { deno: "1.0.0" } });
    expect(getRuntimePlatform()).toEqual("deno");
  });

  test("returns 'bun' when globalThis.Bun is defined (takes precedence over node)", () => {
    vi.stubGlobal("Bun", { version: "1.0.0" });
    expect(getRuntimePlatform()).toEqual("bun");
  });

  test("returns 'browser' when window and document are defined (and no bun/deno)", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {});
    expect(getRuntimePlatform()).toEqual("browser");
  });

  test("react-native precedence beats deno/bun/browser", () => {
    vi.stubGlobal("navigator", { product: "ReactNative" });
    vi.stubGlobal("Deno", {});
    vi.stubGlobal("Bun", {});
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {});
    expect(getRuntimePlatform()).toEqual("react-native");
  });
});

describe("getRuntimePlatformTag", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("includes the node version when running under node", () => {
    expect(getRuntimePlatformTag()).toMatch(/^node\/\d+\.\d+\.\d+/);
  });

  test("includes the bun version when Bun.version is set", () => {
    vi.stubGlobal("Bun", { version: "1.1.38" });
    expect(getRuntimePlatformTag()).toEqual("bun/1.1.38");
  });

  test("falls back to process.versions.bun when Bun.version is missing", () => {
    vi.stubGlobal("Bun", {});
    vi.stubGlobal("process", { versions: { bun: "1.2.0", node: "22.0.0" } });
    expect(getRuntimePlatformTag()).toEqual("bun/1.2.0");
  });

  test("emits bare 'bun' when no bun version is exposed", () => {
    // Replace `process` with no `versions.bun` so the fallback also misses.
    vi.stubGlobal("Bun", {});
    vi.stubGlobal("process", { versions: {} });
    expect(getRuntimePlatformTag()).toEqual("bun");
  });

  test("includes the deno version when Deno.version.deno is set", () => {
    vi.stubGlobal("Deno", { version: { deno: "2.1.4" } });
    expect(getRuntimePlatformTag()).toEqual("deno/2.1.4");
  });

  test("emits bare 'deno' when Deno is defined but no version is exposed", () => {
    vi.stubGlobal("Deno", {});
    expect(getRuntimePlatformTag()).toEqual("deno");
  });

  test("emits 'browser' with no version suffix", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {});
    expect(getRuntimePlatformTag()).toEqual("browser");
  });

  test("emits 'react-native' with no version suffix", () => {
    vi.stubGlobal("navigator", { product: "ReactNative" });
    expect(getRuntimePlatformTag()).toEqual("react-native");
  });
});
