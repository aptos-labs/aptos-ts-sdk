/**
 * E2E test for the simple transfer flow.
 *
 * Hits real devnet — only runs when APTOS_E2E=1 is set.
 * Usage: APTOS_E2E=1 vitest run tests/e2e
 */

import { describe, expect, it } from "vitest";
import { Aptos, Network, generateAccount, U64 } from "@aptos-labs/ts-sdk";

const SKIP = !process.env.APTOS_E2E;

describe.skipIf(SKIP)("simple transfer e2e", () => {
  it("funds alice, transfers to bob, and verifies bob's balance", { timeout: 30_000 }, async () => {
    const aptos = new Aptos({ network: Network.DEVNET });

    // Generate fresh accounts
    const alice = generateAccount();
    const bob = generateAccount();

    // Fund alice with 1 APT
    const fundTxn = await aptos.faucet.fund(
      alice.accountAddress,
      100_000_000,
    );
    expect(fundTxn.success).toBe(true);

    // Build a transfer of 0.01 APT from alice to bob
    const transferAmount = 1_000_000;
    const transaction = await aptos.transaction.buildSimple(
      alice.accountAddress,
      {
        function: "0x1::aptos_account::transfer",
        typeArguments: [],
        functionArguments: [bob.accountAddress, new U64(transferAmount)],
      },
    );

    // Sign and submit
    const pendingTxn = await aptos.transaction.signAndSubmit(
      alice,
      transaction,
    );
    expect(pendingTxn.hash).toBeDefined();

    // Wait for confirmation
    const committedTxn = await aptos.transaction.waitForTransaction(
      pendingTxn.hash,
    );
    expect(committedTxn.success).toBe(true);

    // Verify bob received the funds
    const [bobBalance] = await aptos.general.view({
      function: "0x1::coin::balance",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [bob.accountAddress.toString()],
    });
    expect(Number(bobBalance)).toBe(transferAmount);
  });
});
