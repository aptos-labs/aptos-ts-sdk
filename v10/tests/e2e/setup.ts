// Global setup/teardown for E2E tests
import { startLocalNode, stopLocalNode } from "./local-node.js";

export async function setup() {
  await startLocalNode();
}

export async function teardown() {
  await stopLocalNode();
}
