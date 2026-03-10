/**
 * Sponsored Transaction Server
 *
 * A Hono-based HTTP server that sponsors and submits Move entry-function
 * transactions on behalf of callers. The server holds a funded sponsor
 * account and pays the gas for every submitted transaction.
 *
 * Endpoints:
 *   GET  /health  — liveness check + chain info
 *   POST /sponsor — build, sign, submit, and wait for a transaction
 */

import { Hono } from "hono";
import {
  AccountAddress,
  U64,
  type Aptos,
  type Account,
} from "@aptos-labs/ts-sdk";

// ── Config ──

export interface AppConfig {
  aptos: Aptos;
  sponsorAccount: Account;
}

// ── App factory ──

export function createApp(config: AppConfig) {
  const { aptos, sponsorAccount } = config;
  const app = new Hono();

  // ── GET /health ──

  app.get("/health", async (c) => {
    const info = await aptos.general.getLedgerInfo();
    return c.json({
      status: "ok",
      sponsor: sponsorAccount.accountAddress.toString(),
      chain_id: info.chain_id,
      ledger_version: info.ledger_version,
    });
  });

  // ── POST /sponsor ──

  app.post("/sponsor", async (c) => {
    const body = await c.req.json();

    // Validate required field
    if (!body.function || typeof body.function !== "string") {
      return c.json({ error: "Missing or invalid 'function' field" }, 400);
    }

    const fnName: string = body.function;
    const rawArgs: (string | number)[] = body.functionArguments ?? [];
    const typeArguments: string[] = body.typeArguments ?? [];

    // Convert arguments: "0x..." strings → AccountAddress, numbers → U64
    const functionArguments = rawArgs.map((arg) => {
      if (typeof arg === "string" && arg.startsWith("0x")) {
        return AccountAddress.from(arg);
      }
      if (typeof arg === "number" || (typeof arg === "string" && /^\d+$/.test(arg))) {
        return new U64(BigInt(arg));
      }
      return arg;
    });

    try {
      // Build the transaction from the sponsor account
      const txn = await aptos.transaction.buildSimple(
        sponsorAccount.accountAddress,
        {
          function: fnName,
          functionArguments,
          typeArguments,
        },
      );

      // Sign and submit
      const pending = await aptos.transaction.signAndSubmit(
        sponsorAccount,
        txn,
      );

      // Wait for on-chain confirmation
      const committed = await aptos.transaction.waitForTransaction(
        pending.hash,
      );

      return c.json({
        hash: committed.hash,
        version: committed.version,
        success: committed.success,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return c.json({ error: message }, 500);
    }
  });

  return app;
}
