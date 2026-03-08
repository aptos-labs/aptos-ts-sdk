// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, it } from "vitest";
import type { Ed25519Account } from "../../../src/account/ed25519-account.js";
import { generateAccount } from "../../../src/account/factory.js";
import { Aptos } from "../../../src/api/index.js";
import { U64 } from "../../../src/bcs/move-primitives.js";
import { AccountAddress } from "../../../src/core/account-address.js";
import { Network } from "../../../src/core/network.js";

const aptos = new Aptos({ network: Network.LOCAL });

describe("General API E2E", () => {
  it("getLedgerInfo returns valid data", async () => {
    const info = await aptos.general.getLedgerInfo();
    expect(info.chain_id).toBe(4);
    expect(Number(info.ledger_version)).toBeGreaterThanOrEqual(0);
    expect(Number(info.block_height)).toBeGreaterThanOrEqual(0);
  });

  it("getChainId returns 4 for local", async () => {
    const chainId = await aptos.general.getChainId();
    expect(chainId).toBe(4);
  });

  it("getGasPriceEstimation returns gas estimate", async () => {
    const gas = await aptos.general.getGasPriceEstimation();
    expect(gas.gas_estimate).toBeGreaterThan(0);
  });

  it("getBlockByHeight returns a block", async () => {
    const block = await aptos.general.getBlockByHeight(1);
    expect(block.block_height).toBe("1");
    expect(block.block_hash).toBeDefined();
  });
});

describe("Account API E2E", () => {
  let alice: Ed25519Account;

  beforeAll(async () => {
    alice = generateAccount() as Ed25519Account;
    await aptos.faucet.fund(alice.accountAddress, 100_000_000);
  });

  it("getInfo returns account data", async () => {
    const info = await aptos.account.getInfo(alice.accountAddress);
    expect(info.sequence_number).toBeDefined();
    expect(info.authentication_key).toBeDefined();
  });

  it("getModules returns modules for 0x1", async () => {
    const modules = await aptos.account.getModules("0x1", { limit: 5 });
    expect(modules.length).toBeGreaterThan(0);
    expect(modules[0].bytecode).toBeDefined();
  });

  it("getModule returns a specific module", async () => {
    const mod = await aptos.account.getModule("0x1", "coin");
    expect(mod.abi?.name).toBe("coin");
  });

  it("getResource works for framework accounts", async () => {
    // 0x1 always has the Account resource
    const resource = await aptos.account.getResource<{ authentication_key: string; sequence_number: string }>(
      "0x1",
      "0x1::account::Account",
    );
    expect(resource.sequence_number).toBeDefined();
    expect(resource.authentication_key).toBeDefined();
  });
});

describe("Transaction API E2E", () => {
  let alice: Ed25519Account;
  let bob: Ed25519Account;

  beforeAll(async () => {
    alice = generateAccount() as Ed25519Account;
    bob = generateAccount() as Ed25519Account;
    await aptos.faucet.fund(alice.accountAddress, 100_000_000);
  });

  it("builds, signs, submits, and waits for a transaction", async () => {
    const tx = await aptos.transaction.buildSimple(alice.accountAddress, {
      function: "0x1::aptos_account::transfer",
      typeArguments: [],
      functionArguments: [AccountAddress.from(bob.accountAddress), new U64(1_000)],
    });

    const pending = await aptos.transaction.signAndSubmit(alice, tx);
    expect(pending.hash).toBeDefined();

    const committed = await aptos.transaction.waitForTransaction(pending.hash, { checkSuccess: true });
    expect(committed).toBeDefined();
    expect("success" in committed && committed.success).toBe(true);
  });

  it("getByHash returns the transaction", async () => {
    // First submit a transaction
    const tx = await aptos.transaction.buildSimple(alice.accountAddress, {
      function: "0x1::aptos_account::transfer",
      typeArguments: [],
      functionArguments: [AccountAddress.from(bob.accountAddress), new U64(500)],
    });
    const pending = await aptos.transaction.signAndSubmit(alice, tx);
    await aptos.transaction.waitForTransaction(pending.hash);

    const fetched = await aptos.transaction.getByHash(pending.hash);
    expect(fetched.hash).toBe(pending.hash);
  });

  it("getAccountTransactions returns history", async () => {
    const txns = await aptos.account.getTransactions(alice.accountAddress, { limit: 10 });
    expect(txns.length).toBeGreaterThan(0);
  });
});

describe("View Function E2E", () => {
  let alice: Ed25519Account;

  beforeAll(async () => {
    alice = generateAccount() as Ed25519Account;
    await aptos.faucet.fund(alice.accountAddress, 100_000_000);
  });

  it("calls a view function", async () => {
    const result = await aptos.general.view({
      function: "0x1::coin::balance",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [alice.accountAddress.toString()],
    });
    expect(Number(result[0])).toBeGreaterThan(0);
  });
});

describe("Faucet E2E", () => {
  it("funds a new account", async () => {
    const account = generateAccount() as Ed25519Account;
    const txn = await aptos.faucet.fund(account.accountAddress, 50_000_000);
    expect(txn.hash).toBeDefined();
    expect(txn.success).toBe(true);

    // Verify account exists by fetching its info
    const info = await aptos.account.getInfo(account.accountAddress);
    expect(info.sequence_number).toBe("0");
  });
});
