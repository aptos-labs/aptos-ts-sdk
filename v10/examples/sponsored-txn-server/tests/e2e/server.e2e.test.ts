/**
 * E2E tests for the sponsored-txn-server.
 *
 * Hits real devnet -- only runs when APTOS_E2E=1 is set.
 * Usage: APTOS_E2E=1 vitest run tests/e2e
 */

import { describe, expect, it } from "vitest";
import { Aptos, Network, generateAccount } from "@aptos-labs/ts-sdk";
import { createApp } from "../../src/server.js";

const SKIP = !process.env.APTOS_E2E;

describe.skipIf(SKIP)("sponsored-txn-server e2e", () => {
  it("GET /health returns live chain info", { timeout: 30_000 }, async () => {
    const aptos = new Aptos({ network: Network.DEVNET });
    const sponsor = generateAccount();

    // Fund the sponsor so it exists on-chain
    await aptos.faucet.fund(sponsor.accountAddress, 500_000_000);

    const app = createApp({ aptos, sponsorAccount: sponsor });

    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.sponsor).toBe(sponsor.accountAddress.toString());
    expect(typeof body.chain_id).toBe("number");
    expect(body.ledger_version).toBeDefined();
  });

  it("POST /sponsor submits a real transfer", { timeout: 30_000 }, async () => {
    const aptos = new Aptos({ network: Network.DEVNET });
    const sponsor = generateAccount();
    const recipient = generateAccount();

    // Fund the sponsor
    await aptos.faucet.fund(sponsor.accountAddress, 500_000_000);

    const app = createApp({ aptos, sponsorAccount: sponsor });

    const res = await app.request("/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        function: "0x1::aptos_account::transfer",
        functionArguments: [
          recipient.accountAddress.toString(),
          1_000_000,
        ],
      }),
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.hash).toBeDefined();
    expect(body.version).toBeDefined();
    expect(body.success).toBe(true);
  });
});
