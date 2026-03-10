/**
 * Sponsored Transaction Server — Entry Point
 *
 * Starts a Hono HTTP server that sponsors transactions using a funded account.
 * On devnet/local, the sponsor is automatically funded via the faucet.
 *
 * Environment variables:
 *   APTOS_NETWORK - "devnet" | "local" | "testnet" | "mainnet" (default: "devnet")
 *   PORT          - HTTP port (default: 3000)
 */

import { serve } from "@hono/node-server";
import { Aptos, Network, generateAccount } from "@aptos-labs/ts-sdk";
import { createApp } from "./server.js";

// Read config from env
const network = (process.env.APTOS_NETWORK as Network) ?? Network.DEVNET;
const port = Number(process.env.PORT ?? 3000);

async function main() {
  const aptos = new Aptos({ network });
  const sponsor = generateAccount();
  console.log(`Sponsor: ${sponsor.accountAddress}`);
  console.log(`Network: ${network}`);

  // Fund on devnet/local
  if (network === Network.DEVNET || network === Network.LOCAL) {
    console.log("Funding sponsor...");
    await aptos.faucet.fund(sponsor.accountAddress, 500_000_000);
    console.log("Funded!");
  }

  const app = createApp({ aptos, sponsorAccount: sponsor });
  console.log(`Listening on http://localhost:${port}`);
  serve({ fetch: app.fetch, port });
}

main().catch(console.error);
