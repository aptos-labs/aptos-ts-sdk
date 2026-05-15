// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { Account } from "../../src/account/index.js";
import { AptosConfig } from "../../src/api/aptosConfig.js";
import { KeylessError, KeylessErrorType } from "../../src/errors/index.js";
import { Network } from "../../src/utils/index.js";
import { updateFederatedKeylessJwkSetTransaction } from "../../src/internal/keyless.js";

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

  it("error message does NOT leak the full URL (only origin)", async () => {
    try {
      await updateFederatedKeylessJwkSetTransaction({
        aptosConfig,
        sender,
        iss: "https://example.com",
        jwksUrl: "http://tenant-secret.internal.corp/path/to/jwks.json",
      });
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(KeylessError);
      const message = (error as Error).message;
      // The protocol is reported, but neither the host nor the path appears.
      expect(message).not.toContain("tenant-secret.internal.corp");
      expect(message).not.toContain("/path/to/jwks.json");
    }
  });
});
