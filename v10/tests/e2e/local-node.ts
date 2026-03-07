// Simple local testnet runner for v10 E2E tests
// Starts `aptos node run-localnet` and waits for readiness

import { spawn, type ChildProcess } from "node:child_process";

const READINESS_URL = "http://127.0.0.1:8070/";
const MAX_WAIT_SEC = 75;

let process: ChildProcess | null = null;

export async function startLocalNode(): Promise<void> {
  // Check if already running
  if (await isNodeUp()) {
    console.log("[v10 e2e] Local node already running");
    return;
  }

  console.log("[v10 e2e] Starting local node...");
  process = spawn("npx", ["aptos", "node", "run-localnet", "--force-restart", "--assume-yes"], {
    env: { ...globalThis.process.env, ENABLE_KEYLESS_DEFAULT: "1" },
    stdio: "pipe",
  });

  process.stdout?.on("data", (data) => {
    const str = data.toString();
    if (str.includes("Setup is complete")) {
      console.log("[v10 e2e] Local node setup complete");
    }
  });

  process.stderr?.on("data", (data) => {
    // Suppress most stderr noise, only log errors
    const str = data.toString();
    if (str.includes("error") || str.includes("Error")) {
      console.error("[v10 e2e] Node error:", str.trim());
    }
  });

  // Wait for readiness
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_SEC * 1000) {
    if (await isNodeUp()) {
      console.log("[v10 e2e] Local node is ready");
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error(`Local node failed to start within ${MAX_WAIT_SEC}s`);
}

export async function stopLocalNode(): Promise<void> {
  if (process?.pid) {
    console.log("[v10 e2e] Stopping local node...");
    try {
      process.kill("SIGTERM");
    } catch {
      // Process may already be dead
    }
    process = null;
  }
}

async function isNodeUp(): Promise<boolean> {
  try {
    const response = await fetch(READINESS_URL);
    return response.status === 200;
  } catch {
    return false;
  }
}
