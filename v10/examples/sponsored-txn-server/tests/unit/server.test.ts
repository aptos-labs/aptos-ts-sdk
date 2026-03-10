/**
 * Unit tests for the sponsored-txn-server Hono app.
 *
 * Mocks `@aptos-labs/aptos-client` so no real network calls are made.
 * Tests /health, /sponsor, and validation.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the HTTP transport before importing anything from the SDK
vi.mock("@aptos-labs/aptos-client", () => ({
  jsonRequest: vi.fn(),
  bcsRequest: vi.fn(),
}));

import { jsonRequest } from "@aptos-labs/aptos-client";
import { Aptos, Network, generateAccount } from "@aptos-labs/ts-sdk";
import { createApp } from "../../src/server.js";

const mockJson = vi.mocked(jsonRequest);

/** Helper: build a mock AptosClientResponse. */
function mockResponse(data: unknown, status = 200) {
  return { status, statusText: "OK", data, headers: {} };
}

/** Helper: build a committed user transaction response. */
function committedTxnResponse(hash: string) {
  return {
    type: "user_transaction",
    version: "42",
    hash,
    state_change_hash: "0x0",
    event_root_hash: "0x0",
    state_checkpoint_hash: null,
    gas_used: "100",
    success: true,
    vm_status: "Executed successfully",
    accumulator_root_hash: "0x0",
    changes: [],
    sender: "0x1",
    sequence_number: "0",
    max_gas_amount: "200000",
    gas_unit_price: "100",
    expiration_timestamp_secs: "99999999999",
    payload: {
      type: "entry_function_payload",
      function: "0x1::aptos_account::transfer",
      type_arguments: [],
      arguments: [],
    },
    signature: {
      type: "ed25519_signature",
      public_key: "0x00",
      signature: "0x00",
    },
    events: [],
    timestamp: "1000000",
  };
}

describe("sponsored-txn-server (unit)", () => {
  const aptos = new Aptos({ network: Network.LOCAL });
  const sponsor = generateAccount();
  const app = createApp({ aptos, sponsorAccount: sponsor });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── GET /health ──

  it("GET /health returns status, sponsor address, and chain info", async () => {
    // getLedgerInfo → 1 jsonRequest call
    mockJson.mockResolvedValueOnce(
      mockResponse({
        chain_id: 4,
        epoch: "1",
        ledger_version: "200",
        oldest_ledger_version: "0",
        ledger_timestamp: "0",
        node_role: "full_node",
        oldest_block_height: "0",
        block_height: "100",
      }),
    );

    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.sponsor).toBe(sponsor.accountAddress.toString());
    expect(body.chain_id).toBe(4);
    expect(body.ledger_version).toBe("200");

    expect(mockJson).toHaveBeenCalledTimes(1);
  });

  // ── POST /sponsor ──

  it("POST /sponsor builds, submits, and waits for a transaction", async () => {
    // buildSimple fires 3 parallel requests: ledgerInfo, gasEstimation, account
    // 1. GET / (ledgerInfo)
    mockJson.mockResolvedValueOnce(
      mockResponse({
        chain_id: 4,
        epoch: "1",
        ledger_version: "100",
        oldest_ledger_version: "0",
        ledger_timestamp: "0",
        node_role: "full_node",
        oldest_block_height: "0",
        block_height: "50",
      }),
    );
    // 2. GET /estimate_gas_price
    mockJson.mockResolvedValueOnce(
      mockResponse({
        gas_estimate: 100,
        deprioritized_gas_estimate: 50,
        prioritized_gas_estimate: 200,
      }),
    );
    // 3. GET /accounts/<sponsor>
    mockJson.mockResolvedValueOnce(
      mockResponse({
        sequence_number: "0",
        authentication_key: sponsor.accountAddress.toString(),
      }),
    );

    // 4. POST /transactions (signAndSubmit — goes through jsonRequest)
    mockJson.mockResolvedValueOnce(
      mockResponse({ hash: "0xsponsorhash" }),
    );

    // 5. GET /transactions/wait_by_hash/0xsponsorhash (waitForTransaction)
    mockJson.mockResolvedValueOnce(
      mockResponse(committedTxnResponse("0xsponsorhash")),
    );

    const res = await app.request("/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        function: "0x1::aptos_account::transfer",
        functionArguments: [
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          1000000,
        ],
      }),
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.hash).toBe("0xsponsorhash");
    expect(body.version).toBe("42");
    expect(body.success).toBe(true);

    // 3 (build) + 1 (submit) + 1 (wait) = 5
    expect(mockJson).toHaveBeenCalledTimes(5);
  });

  // ── POST /sponsor — missing function field ──

  it("POST /sponsor returns 400 when function field is missing", async () => {
    const res = await app.request("/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        functionArguments: ["0x1", 100],
      }),
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toMatch(/function/i);

    // No SDK calls should have been made
    expect(mockJson).not.toHaveBeenCalled();
  });
});
