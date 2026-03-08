// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Aptos, AptosConfig } from "../../../src/api/index.js";
import type { AccountData, GasEstimation, LedgerInfo, TransactionResponse } from "../../../src/api/types.js";
import { RoleType } from "../../../src/api/types.js";
import { Network } from "../../../src/core/network.js";

function mockJsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("Aptos facade", () => {
  it("creates with default config", () => {
    const aptos = new Aptos();
    expect(aptos.config.network).toBe(Network.DEVNET);
  });

  it("creates with AptosSettings", () => {
    const aptos = new Aptos({ network: Network.TESTNET });
    expect(aptos.config.network).toBe(Network.TESTNET);
  });

  it("creates with AptosConfig instance", () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
    expect(aptos.config.network).toBe(Network.LOCAL);
  });

  it("has all namespace sub-objects", () => {
    const aptos = new Aptos();
    expect(aptos.general).toBeDefined();
    expect(aptos.account).toBeDefined();
    expect(aptos.transaction).toBeDefined();
    expect(aptos.coin).toBeDefined();
    expect(aptos.faucet).toBeDefined();
    expect(aptos.table).toBeDefined();
  });
});

describe("General API", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("getLedgerInfo", async () => {
    const ledgerInfo: LedgerInfo = {
      chain_id: 4,
      epoch: "1",
      ledger_version: "100",
      oldest_ledger_version: "0",
      ledger_timestamp: "1000",
      node_role: RoleType.FULL_NODE,
      oldest_block_height: "0",
      block_height: "50",
    };
    fetchSpy.mockResolvedValueOnce(mockJsonResponse(ledgerInfo));

    const aptos = new Aptos({ network: Network.LOCAL });
    const result = await aptos.general.getLedgerInfo();
    expect(result.chain_id).toBe(4);
    expect(result.ledger_version).toBe("100");
  });

  it("getChainId", async () => {
    fetchSpy.mockResolvedValueOnce(
      mockJsonResponse({
        chain_id: 4,
        epoch: "1",
        ledger_version: "0",
        oldest_ledger_version: "0",
        ledger_timestamp: "0",
        node_role: "full_node",
        oldest_block_height: "0",
        block_height: "0",
      }),
    );

    const aptos = new Aptos({ network: Network.LOCAL });
    const chainId = await aptos.general.getChainId();
    expect(chainId).toBe(4);
  });

  it("getGasPriceEstimation", async () => {
    const gasEstimation: GasEstimation = {
      gas_estimate: 100,
      deprioritized_gas_estimate: 50,
      prioritized_gas_estimate: 200,
    };
    fetchSpy.mockResolvedValueOnce(mockJsonResponse(gasEstimation));

    const aptos = new Aptos({ network: Network.LOCAL });
    const result = await aptos.general.getGasPriceEstimation();
    expect(result.gas_estimate).toBe(100);
  });

  it("getBlockByHeight", async () => {
    fetchSpy.mockResolvedValueOnce(
      mockJsonResponse({
        block_height: "10",
        block_hash: "0xabc",
        block_timestamp: "1000",
        first_version: "1",
        last_version: "10",
      }),
    );

    const aptos = new Aptos({ network: Network.LOCAL });
    const block = await aptos.general.getBlockByHeight(10);
    expect(block.block_height).toBe("10");
  });

  it("view function", async () => {
    fetchSpy.mockResolvedValueOnce(mockJsonResponse(["100"]));

    const aptos = new Aptos({ network: Network.LOCAL });
    const result = await aptos.general.view({
      function: "0x1::coin::balance",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: ["0x1"],
    });
    expect(result).toEqual(["100"]);
  });
});

describe("Account API", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("getInfo", async () => {
    const accountData: AccountData = {
      sequence_number: "42",
      authentication_key: "0x1234",
    };
    fetchSpy.mockResolvedValueOnce(mockJsonResponse(accountData));

    const aptos = new Aptos({ network: Network.LOCAL });
    const result = await aptos.account.getInfo("0x1");
    expect(result.sequence_number).toBe("42");
  });

  it("getModule", async () => {
    fetchSpy.mockResolvedValueOnce(
      mockJsonResponse({
        bytecode: "0x01",
        abi: { address: "0x1", name: "coin", friends: [], exposed_functions: [], structs: [] },
      }),
    );

    const aptos = new Aptos({ network: Network.LOCAL });
    const mod = await aptos.account.getModule("0x1", "coin");
    expect(mod.abi?.name).toBe("coin");
  });

  it("getResource", async () => {
    fetchSpy.mockResolvedValueOnce(
      mockJsonResponse({ type: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>", data: { coin: { value: "100" } } }),
    );

    const aptos = new Aptos({ network: Network.LOCAL });
    const resource = await aptos.account.getResource<{ coin: { value: string } }>(
      "0x1",
      "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>" as `${string}::${string}::${string}`,
    );
    expect(resource.coin.value).toBe("100");
  });
});

describe("Transaction API", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("getByHash", async () => {
    fetchSpy.mockResolvedValueOnce(
      mockJsonResponse({
        type: "user_transaction",
        version: "1",
        hash: "0xabc",
        state_change_hash: "0x",
        event_root_hash: "0x",
        gas_used: "100",
        success: true,
        vm_status: "Executed successfully",
        accumulator_root_hash: "0x",
        changes: [],
        sender: "0x1",
        sequence_number: "0",
        max_gas_amount: "200000",
        gas_unit_price: "100",
        expiration_timestamp_secs: "100",
        payload: {},
        events: [],
        timestamp: "1000",
      }),
    );

    const aptos = new Aptos({ network: Network.LOCAL });
    const txn = await aptos.transaction.getByHash("0xabc");
    expect(txn.hash).toBe("0xabc");
  });

  it("getByVersion", async () => {
    fetchSpy.mockResolvedValueOnce(
      mockJsonResponse({
        type: "user_transaction",
        version: "42",
        hash: "0xdef",
        state_change_hash: "0x",
        event_root_hash: "0x",
        gas_used: "100",
        success: true,
        vm_status: "Executed successfully",
        accumulator_root_hash: "0x",
        changes: [],
        sender: "0x1",
        sequence_number: "0",
        max_gas_amount: "200000",
        gas_unit_price: "100",
        expiration_timestamp_secs: "100",
        payload: {},
        events: [],
        timestamp: "1000",
      }),
    );

    const aptos = new Aptos({ network: Network.LOCAL });
    const txn = await aptos.transaction.getByVersion(42);
    expect((txn as TransactionResponse & { version?: string }).version).toBe("42");
  });

  it("buildSimple creates a SimpleTransaction", async () => {
    // Mock 3 parallel requests: ledgerInfo, gasEstimation, accountSequenceNumber
    fetchSpy.mockResolvedValueOnce(
      mockJsonResponse({
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
    fetchSpy.mockResolvedValueOnce(
      mockJsonResponse({ gas_estimate: 100, deprioritized_gas_estimate: 50, prioritized_gas_estimate: 200 }),
    );
    fetchSpy.mockResolvedValueOnce(mockJsonResponse({ sequence_number: "5", authentication_key: "0x1234" }));

    const aptos = new Aptos({ network: Network.LOCAL });
    const tx = await aptos.transaction.buildSimple("0x1", {
      function: "0x1::aptos_account::transfer",
      typeArguments: [],
      functionArguments: [],
    });

    expect(tx.rawTransaction).toBeDefined();
    expect(tx.rawTransaction.sender.toString()).toBe("0x1");
    expect(tx.rawTransaction.chain_id.chainId).toBe(4);
  });
});

describe("Table API", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("getItem", async () => {
    fetchSpy.mockResolvedValueOnce(mockJsonResponse({ value: "42" }));

    const aptos = new Aptos({ network: Network.LOCAL });
    const item = await aptos.table.getItem<{ value: string }>("0xhandle", {
      key_type: "address",
      value_type: "u64",
      key: "0x1",
    });
    expect(item.value).toBe("42");
  });
});
