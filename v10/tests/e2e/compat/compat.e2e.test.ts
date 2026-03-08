// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Tests that verify v6-style API calling conventions work through the compat layer.

import { beforeAll, describe, expect, it } from "vitest";
import type { Ed25519Account } from "../../../src/account/ed25519-account.js";
import { generateAccount } from "../../../src/account/factory.js";
import { AptosConfig } from "../../../src/api/config.js";
import { U64 } from "../../../src/bcs/move-primitives.js";
import { Aptos } from "../../../src/compat/aptos.js";
import { AccountAddress } from "../../../src/core/account-address.js";
import { Network } from "../../../src/core/network.js";

// v6-style: new Aptos(new AptosConfig({ network }))
const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);

describe("Compat: General API (v6 style)", () => {
  it("getLedgerInfo()", async () => {
    const info = await aptos.getLedgerInfo();
    expect(info.chain_id).toBe(4);
    expect(Number(info.ledger_version)).toBeGreaterThanOrEqual(0);
  });

  it("getChainId()", async () => {
    const chainId = await aptos.getChainId();
    expect(chainId).toBe(4);
  });

  it("getGasPriceEstimation()", async () => {
    const gas = await aptos.getGasPriceEstimation();
    expect(gas.gas_estimate).toBeGreaterThan(0);
  });

  it("getBlockByHeight({ blockHeight })", async () => {
    const block = await aptos.getBlockByHeight({ blockHeight: 1 });
    expect(block.block_height).toBe("1");
    expect(block.block_hash).toBeDefined();
  });

  it("view({ payload })", async () => {
    const alice = generateAccount() as Ed25519Account;
    await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });

    const result = await aptos.view({
      payload: {
        function: "0x1::coin::balance",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: [alice.accountAddress.toString()],
      },
    });
    expect(Number(result[0])).toBeGreaterThan(0);
  });
});

describe("Compat: Account API (v6 style)", () => {
  let alice: Ed25519Account;

  beforeAll(async () => {
    alice = generateAccount() as Ed25519Account;
    await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });
  });

  it("getAccountInfo({ accountAddress })", async () => {
    const info = await aptos.getAccountInfo({ accountAddress: alice.accountAddress });
    expect(info.sequence_number).toBeDefined();
    expect(info.authentication_key).toBeDefined();
  });

  it("getAccountModules({ accountAddress, options })", async () => {
    const modules = await aptos.getAccountModules({ accountAddress: "0x1", options: { limit: 5 } });
    expect(modules.length).toBeGreaterThan(0);
    expect(modules[0].bytecode).toBeDefined();
  });

  it("getAccountModule({ accountAddress, moduleName })", async () => {
    const mod = await aptos.getAccountModule({ accountAddress: "0x1", moduleName: "coin" });
    expect(mod.abi?.name).toBe("coin");
  });

  it("getAccountResource({ accountAddress, resourceType })", async () => {
    const resource = await aptos.getAccountResource<{ authentication_key: string; sequence_number: string }>({
      accountAddress: "0x1",
      resourceType: "0x1::account::Account",
    });
    expect(resource.sequence_number).toBeDefined();
    expect(resource.authentication_key).toBeDefined();
  });
});

describe("Compat: Transaction API (v6 style)", () => {
  let alice: Ed25519Account;
  let bob: Ed25519Account;

  beforeAll(async () => {
    alice = generateAccount() as Ed25519Account;
    bob = generateAccount() as Ed25519Account;
    await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });
  });

  it("transaction.build.simple({ sender, data }) — v6 nested pattern", async () => {
    const tx = await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer",
        typeArguments: [],
        functionArguments: [AccountAddress.from(bob.accountAddress), new U64(1_000)],
      },
    });

    // v6-style sign and submit
    const pending = await aptos.signAndSubmitTransaction({ signer: alice, transaction: tx });
    expect(pending.hash).toBeDefined();

    const committed = await aptos.waitForTransaction({
      transactionHash: pending.hash,
      options: { checkSuccess: true },
    });
    expect(committed).toBeDefined();
    expect("success" in committed && committed.success).toBe(true);
  });

  it("getTransactionByHash({ transactionHash })", async () => {
    const tx = await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer",
        typeArguments: [],
        functionArguments: [AccountAddress.from(bob.accountAddress), new U64(500)],
      },
    });
    const pending = await aptos.signAndSubmitTransaction({ signer: alice, transaction: tx });
    await aptos.waitForTransaction({ transactionHash: pending.hash });

    const fetched = await aptos.getTransactionByHash({ transactionHash: pending.hash });
    expect(fetched.hash).toBe(pending.hash);
  });

  it("getAccountTransactions({ accountAddress })", async () => {
    const txns = await aptos.getAccountTransactions({ accountAddress: alice.accountAddress, options: { limit: 10 } });
    expect(txns.length).toBeGreaterThan(0);
  });
});

describe("Compat: Faucet API (v6 style)", () => {
  it("fundAccount({ accountAddress, amount })", async () => {
    const account = generateAccount() as Ed25519Account;
    const txn = await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 50_000_000 });
    expect(txn.hash).toBeDefined();
    expect(txn.success).toBe(true);

    const info = await aptos.getAccountInfo({ accountAddress: account.accountAddress });
    expect(info.sequence_number).toBe("0");
  });
});

describe("Compat: v10 namespaced API still works", () => {
  it("aptos.general.getLedgerInfo() — v10 native access", async () => {
    const info = await aptos.general.getLedgerInfo();
    expect(info.chain_id).toBe(4);
  });

  it("aptos.account.getInfo() — v10 native access", async () => {
    const alice = generateAccount() as Ed25519Account;
    await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });
    const info = await aptos.account.getInfo(alice.accountAddress);
    expect(info.sequence_number).toBeDefined();
  });
});
