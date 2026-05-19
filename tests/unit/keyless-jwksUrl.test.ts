// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from "vitest";
import { Account } from "../../src/account/index.js";
import { AptosConfig } from "../../src/api/aptosConfig.js";
import { KeylessError, KeylessErrorType } from "../../src/errors/index.js";
import { Network } from "../../src/utils/index.js";
import { updateFederatedKeylessJwkSetTransaction } from "../../src/internal/keyless.js";

function mockFetchJsonResponse(body: unknown): void {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }),
  );
}

// These tests exercise the SSRF guard added to
// `updateFederatedKeylessJwkSetTransaction`. The guard runs before any network
// call, so we don't need to mock fetch — the function throws synchronously on
// non-HTTPS / malformed URLs.

describe("updateFederatedKeylessJwkSetTransaction — JWKS URL validation", () => {
  const aptosConfig = new AptosConfig({ network: Network.DEVNET });
  const sender = Account.generate();

  it.each([
    ["http", "http://example.com/.well-known/jwks.json"],
    ["file", "file:///etc/passwd"],
    ["data", "data:application/json,%7B%22keys%22%3A%5B%5D%7D"],
    ["ftp", "ftp://example.com/jwks.json"],
    ["javascript", "javascript:void(0)"],
  ])("rejects %s scheme via explicit jwksUrl", async (_label, jwksUrl) => {
    await expect(
      updateFederatedKeylessJwkSetTransaction({ aptosConfig, sender, iss: "https://example.com", jwksUrl }),
    ).rejects.toMatchObject({
      name: "KeylessError",
      type: KeylessErrorType.JWK_FETCH_FAILED_FEDERATED,
    });
  });

  it("rejects an http:// `iss` (derived URL)", async () => {
    await expect(
      updateFederatedKeylessJwkSetTransaction({ aptosConfig, sender, iss: "http://169.254.169.254" }),
    ).rejects.toMatchObject({
      name: "KeylessError",
      type: KeylessErrorType.JWK_FETCH_FAILED_FEDERATED,
    });
  });

  it("rejects a malformed jwksUrl", async () => {
    await expect(
      updateFederatedKeylessJwkSetTransaction({
        aptosConfig,
        sender,
        iss: "https://example.com",
        jwksUrl: "not a url",
      }),
    ).rejects.toBeInstanceOf(KeylessError);
  });

  describe("response-shape validation", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    const validKey = {
      kid: "abc",
      kty: "RSA",
      alg: "RS256",
      e: "AQAB",
      n: "xxx",
    };
    const callArgs = { aptosConfig, sender, iss: "https://example.com", jwksUrl: "https://example.com/jwks.json" };

    it.each([
      ["null", null],
      ["non-object", "string-instead-of-object"],
      ["missing keys field", { foo: "bar" }],
      ["keys is not an array", { keys: { kid: "abc" } }],
    ])("rejects %s", async (_label, body) => {
      mockFetchJsonResponse(body);
      await expect(updateFederatedKeylessJwkSetTransaction(callArgs)).rejects.toMatchObject({
        name: "KeylessError",
        type: KeylessErrorType.JWK_FETCH_FAILED_FEDERATED,
      });
    });

    it("rejects an empty keys array", async () => {
      mockFetchJsonResponse({ keys: [] });
      await expect(updateFederatedKeylessJwkSetTransaction(callArgs)).rejects.toThrow(/empty 'keys' array/);
    });

    it("rejects more than 32 keys", async () => {
      mockFetchJsonResponse({ keys: Array.from({ length: 33 }, () => validKey) });
      await expect(updateFederatedKeylessJwkSetTransaction(callArgs)).rejects.toThrow(/max 32/);
    });

    it.each(["kid", "alg", "e", "n"] as const)("rejects a key missing the '%s' field", async (field) => {
      const broken = { ...validKey } as Record<string, string>;
      delete broken[field];
      mockFetchJsonResponse({ keys: [broken] });
      await expect(updateFederatedKeylessJwkSetTransaction(callArgs)).rejects.toThrow(
        new RegExp(`missing string field '${field}'`),
      );
    });

    it("rejects a non-object key entry", async () => {
      mockFetchJsonResponse({ keys: ["not-an-object"] });
      await expect(updateFederatedKeylessJwkSetTransaction(callArgs)).rejects.toThrow(/is not an object/);
    });
  });

  describe("error-message URL leakage (fetch-failure path)", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("surfaces only the origin (scheme + host + port) — never the path or query", async () => {
      // Use a valid `https://` URL so it passes the SSRF guard and reaches
      // the fetch call. Mock fetch to throw so the catch block's
      // origin-only error formatter runs. This is the path that needs
      // testing — the SSRF-rejection path doesn't exercise it.
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

      try {
        await updateFederatedKeylessJwkSetTransaction({
          aptosConfig,
          sender,
          iss: "https://example.com",
          jwksUrl: "https://tenant-secret.internal.corp:8443/path/to/jwks.json?token=abc",
        });
        throw new Error("expected throw");
      } catch (error) {
        expect(error).toBeInstanceOf(KeylessError);
        const message = (error as Error).message;
        // Origin (https://host:port) is reported — needed for debugging.
        expect(message).toContain("https://tenant-secret.internal.corp:8443");
        // But the path and query are not.
        expect(message).not.toContain("/path/to/jwks.json");
        expect(message).not.toContain("token=abc");
        // And the inner fetch error is propagated.
        expect(message).toContain("ECONNREFUSED");
      }
    });
  });
});
