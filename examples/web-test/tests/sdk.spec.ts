import { test, expect } from "@playwright/test";

// Get network from environment or default to local
const network = process.env.APTOS_NETWORK || "local";

test.describe("Aptos SDK Browser Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page with network parameter
    await page.goto(`/?network=${network}`);
    // Wait for SDK to be loaded
    await page.waitForFunction(() => window.aptosSDK !== undefined, { timeout: 30000 });
  });

  test.describe("Account Operations", () => {
    test("should generate a new account", async ({ page }) => {
      const account = await page.evaluate(() => {
        return window.aptosSDK.generateAccount();
      });

      expect(account.address).toBeDefined();
      expect(account.address).toMatch(/^0x[a-fA-F0-9]+$/);
      expect(account.publicKey).toBeDefined();
      expect(account.privateKey).toBeDefined();
    });

    test("should create account from private key", async ({ page }) => {
      const result = await page.evaluate(() => {
        const account = window.aptosSDK.generateAccount();
        const recreatedAddress = window.aptosSDK.createAccountFromPrivateKey(account.privateKey);
        return {
          original: account.address,
          recreated: recreatedAddress,
        };
      });

      expect(result.recreated).toBe(result.original);
    });
  });

  test.describe("Hex and Address Operations", () => {
    test("should parse hex values", async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.aptosSDK.parseHex("0x1234567890abcdef");
      });

      expect(result).toBe("0x1234567890abcdef");
    });

    test("should parse account addresses", async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.aptosSDK.parseAddress("0x1");
      });

      expect(result.short).toBe("0x1");
      expect(result.long).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
    });
  });

  test.describe("Network Connectivity", () => {
    test("should fetch ledger info", async ({ page }) => {
      const info = await page.evaluate(async () => {
        return await window.aptosSDK.getLedgerInfo();
      });

      expect(info.chainId).toBeDefined();
      expect(typeof info.chainId).toBe("number");
      expect(info.epoch).toBeDefined();
      expect(info.ledgerVersion).toBeDefined();
    });

    test("should get chain ID", async ({ page }) => {
      const chainId = await page.evaluate(async () => {
        return await window.aptosSDK.getChainId();
      });

      expect(typeof chainId).toBe("number");
      expect(chainId).toBeGreaterThan(0);
    });
  });

  test.describe("Account Funding and Balance", () => {
    test("should fund an account and check balance", async ({ page }) => {
      const fundAmount = 100_000_000;

      const result = await page.evaluate(async (amount) => {
        const account = window.aptosSDK.generateAccount();
        const txnHash = await window.aptosSDK.fundAccount(account.address, amount);
        const balance = await window.aptosSDK.getBalance(account.address);
        return { txnHash, balance };
      }, fundAmount);

      expect(result.txnHash).toBeDefined();
      expect(result.balance).toBe(fundAmount);
    });
  });

  test.describe("Full Transfer Flow", () => {
    test("should complete a full transfer between accounts", async ({ page }) => {
      const result = await page.evaluate(async () => {
        const alice = window.aptosSDK.generateAccount();
        const bob = window.aptosSDK.generateAccount();

        const aliceInitialBalance = 100_000_000;
        const bobInitialBalance = 100;
        const transferAmount = 1000;

        // Fund both accounts
        await window.aptosSDK.fundAccount(alice.address, aliceInitialBalance);
        await window.aptosSDK.fundAccount(bob.address, bobInitialBalance);

        // Transfer from Alice to Bob
        const txnResult = await window.aptosSDK.transfer(alice.privateKey, bob.address, transferAmount);

        // Check Bob's new balance
        const bobBalance = await window.aptosSDK.getBalance(bob.address);

        return {
          txnHash: txnResult.hash,
          success: txnResult.success,
          bobBalance,
          expectedBalance: bobInitialBalance + transferAmount,
        };
      });

      expect(result.success).toBe(true);
      expect(result.bobBalance).toBe(result.expectedBalance);
    });
  });

  test.describe("Sponsored Transaction Flow", () => {
    test("should complete a sponsored transaction", async ({ page }) => {
      const result = await page.evaluate(async () => {
        const alice = window.aptosSDK.generateAccount();
        const bob = window.aptosSDK.generateAccount();

        // Alice needs funds to transfer, Bob (sponsor) pays the gas
        const aliceInitialBalance = 100;
        const bobInitialBalance = 100_000_000;
        const transferAmount = 10;

        // Fund both accounts
        await window.aptosSDK.fundAccount(alice.address, aliceInitialBalance);
        await window.aptosSDK.fundAccount(bob.address, bobInitialBalance);

        // Alice transfers to Bob, Bob sponsors the gas
        const txnResult = await window.aptosSDK.sponsoredTransfer(
          alice.privateKey,
          bob.privateKey,
          bob.address,
          transferAmount,
        );

        return {
          txnHash: txnResult.hash,
          success: txnResult.success,
        };
      });

      expect(result.success).toBe(true);
      expect(result.txnHash).toBeDefined();
    });
  });
});
