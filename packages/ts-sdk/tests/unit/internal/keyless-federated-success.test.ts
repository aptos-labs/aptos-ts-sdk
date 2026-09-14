// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { Account } from "../../../src/account/index.js";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/index.js";
import { SimpleTransaction } from "../../../src/transactions/instances/simpleTransaction.js";

vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  generateTransaction: vi.fn(),
}));

import { generateTransaction } from "../../../src/internal/transactionSubmission.js";
import { updateFederatedKeylessJwkSetTransaction } from "../../../src/internal/keyless.js";

const mockGenerateTransaction = generateTransaction as MockedFunction<typeof generateTransaction>;

describe("updateFederatedKeylessJwkSetTransaction — success path", () => {
  const aptosConfig = new AptosConfig({ network: Network.DEVNET });
  const sender = Account.generate();
  const txn = new SimpleTransaction({} as never);

  beforeEach(() => {
    mockGenerateTransaction.mockReset();
    mockGenerateTransaction.mockResolvedValue(txn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches JWKS and builds an on-chain update transaction with mapped key fields", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          keys: [{ kid: "kid-1", alg: "RS256", e: "AQAB", n: "modulus" }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await updateFederatedKeylessJwkSetTransaction({
      aptosConfig,
      sender,
      iss: "https://example.com",
      jwksUrl: "https://example.com/jwks.json",
    });

    expect(result).toBe(txn);
    const call = mockGenerateTransaction.mock.calls[0][0];
    expect(call.aptosConfig).toBe(aptosConfig);
    expect(call.sender?.toString()).toBe(sender.accountAddress.toString());
    expect(call.data.function).toBe("0x1::jwks::update_federated_jwk_set");
    expect(call.data.functionArguments[0]).toBe("https://example.com");
    expect(call.data.functionArguments[1].values.map((v: { value: string }) => v.value)).toEqual(["kid-1"]);
    expect(call.data.functionArguments[2].values.map((v: { value: string }) => v.value)).toEqual(["RS256"]);
    expect(call.data.functionArguments[3].values.map((v: { value: string }) => v.value)).toEqual(["AQAB"]);
    expect(call.data.functionArguments[4].values.map((v: { value: string }) => v.value)).toEqual(["modulus"]);
  });

  it("uses the Firebase JWKS endpoint when iss matches the Firebase pattern", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [{ kid: "k", alg: "RS256", e: "AQAB", n: "n" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await updateFederatedKeylessJwkSetTransaction({
      aptosConfig,
      sender,
      iss: "https://securetoken.google.com/my-project",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
    );
  });

  it("throws when the JWKS endpoint returns a non-OK status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("missing", { status: 404, statusText: "Not Found" }));

    await expect(
      updateFederatedKeylessJwkSetTransaction({
        aptosConfig,
        sender,
        iss: "https://example.com",
        jwksUrl: "https://example.com/jwks.json",
      }),
    ).rejects.toThrow(/404 Not Found/);
  });
});
