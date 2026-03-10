/**
 * Unit tests for the simple transfer flow.
 *
 * Mocks `@aptos-labs/aptos-client` so no real network calls are made.
 * Verifies: fund -> check balance -> build -> signAndSubmit -> wait -> check balance.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the HTTP transport before importing anything from the SDK
vi.mock("@aptos-labs/aptos-client", () => ({
  jsonRequest: vi.fn(),
  bcsRequest: vi.fn(),
}));

import { jsonRequest } from "@aptos-labs/aptos-client";
import { Aptos, Network, generateAccount, U64 } from "@aptos-labs/ts-sdk";

const mockJson = vi.mocked(jsonRequest);

/** Helper: build a mock AptosClientResponse. */
function mockResponse(data: unknown, status = 200) {
  return { status, statusText: "OK", data, headers: {} };
}

/** Helper: build a committed user transaction response. */
function committedTxnResponse(hash: string) {
  return {
    type: "user_transaction",
    version: "1",
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
    payload: { type: "entry_function_payload", function: "0x1::aptos_account::transfer", type_arguments: [], arguments: [] },
    signature: { type: "ed25519_signature", public_key: "0x00", signature: "0x00" },
    events: [],
    timestamp: "1000000",
  };
}

describe("simple transfer (unit)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("completes the full fund -> transfer -> verify flow", async () => {
    const alice = generateAccount();
    const bob = generateAccount();

    const aptos = new Aptos({ network: Network.LOCAL });

    // ---- 1. Fund alice ----
    // faucet.fund makes a POST to faucet, then calls waitForTransaction

    // POST /fund (faucet)
    mockJson.mockResolvedValueOnce(
      mockResponse({ txn_hashes: ["0xfaucethash"] }),
    );
    // GET /transactions/wait_by_hash/0xfaucethash (waitForTransaction long-poll)
    mockJson.mockResolvedValueOnce(
      mockResponse(committedTxnResponse("0xfaucethash")),
    );

    const fundResult = await aptos.faucet.fund(alice.accountAddress, 100_000_000);
    expect(fundResult.hash).toBe("0xfaucethash");
    expect(fundResult.success).toBe(true);

    // ---- 2. Check alice's balance via view ----
    // POST /view
    mockJson.mockResolvedValueOnce(mockResponse(["100000000"]));

    const [aliceBalance] = await aptos.general.view({
      function: "0x1::coin::balance",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [alice.accountAddress.toString()],
    });
    expect(aliceBalance).toBe("100000000");

    // ---- 3. Build transfer transaction ----
    // buildSimple fires 3 parallel requests: ledgerInfo, gasEstimation, account

    // GET / (ledgerInfo)
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
    // GET /estimate_gas_price
    mockJson.mockResolvedValueOnce(
      mockResponse({
        gas_estimate: 100,
        deprioritized_gas_estimate: 50,
        prioritized_gas_estimate: 200,
      }),
    );
    // GET /accounts/<alice>
    mockJson.mockResolvedValueOnce(
      mockResponse({
        sequence_number: "0",
        authentication_key: alice.accountAddress.toString(),
      }),
    );

    const transaction = await aptos.transaction.buildSimple(
      alice.accountAddress,
      {
        function: "0x1::aptos_account::transfer",
        typeArguments: [],
        functionArguments: [bob.accountAddress, new U64(1_000_000)],
      },
    );

    expect(transaction.rawTransaction).toBeDefined();
    expect(transaction.rawTransaction.chain_id.chainId).toBe(4);

    // ---- 4. Sign and submit ----
    // POST /transactions (BCS content-type, but JSON accept => jsonRequest)
    mockJson.mockResolvedValueOnce(
      mockResponse({ hash: "0xtransferhash" }),
    );

    const pendingTxn = await aptos.transaction.signAndSubmit(alice, transaction);
    expect(pendingTxn.hash).toBe("0xtransferhash");

    // ---- 5. Wait for transaction ----
    // GET /transactions/wait_by_hash/0xtransferhash
    mockJson.mockResolvedValueOnce(
      mockResponse(committedTxnResponse("0xtransferhash")),
    );

    const committedTxn = await aptos.transaction.waitForTransaction(pendingTxn.hash);
    expect(committedTxn.success).toBe(true);

    // ---- 6. Check bob's balance ----
    // POST /view
    mockJson.mockResolvedValueOnce(mockResponse(["1000000"]));

    const [bobBalance] = await aptos.general.view({
      function: "0x1::coin::balance",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [bob.accountAddress.toString()],
    });
    expect(bobBalance).toBe("1000000");

    // Verify total number of mock calls: 2 (fund) + 1 (view) + 3 (build) + 1 (submit) + 1 (wait) + 1 (view) = 9
    expect(mockJson).toHaveBeenCalledTimes(9);
  });
});
