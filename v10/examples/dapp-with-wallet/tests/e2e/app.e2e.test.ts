import { describe, expect, it } from "vitest";

const SKIP = !process.env.APTOS_E2E;

describe.skipIf(SKIP)("dapp-with-wallet e2e", () => {
  it("renders the app title in the browser", async () => {
    const res = await fetch("http://localhost:5173");
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(html).toContain("Aptos v10 dApp");
  });
});
