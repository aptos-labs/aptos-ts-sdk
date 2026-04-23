// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AccountAddress,
  AccountAddressInput,
  AnyNumber,
  Bool,
  Ed25519Account,
  MoveVector,
} from "@aptos-labs/ts-sdk";
import { TwistedEd25519PrivateKey } from "../../src";
import {
  getTestAccount,
  getTestConfidentialAccount,
  getCoreResourcesAccount,
  compileGovernanceScripts,
  submitGovernanceScript,
  aptos,
  plainAptos,
  TOKEN_ADDRESS,
  longTestTimeout,
  confidentialAsset,
  feePayerAccount,
} from "../helpers";
import { getCache } from "../../src/utils/memoize";
import { ConfidentialBalance } from "../../src/internal/viewFunctions";

function getCachedBalance(accountAddress: AccountAddressInput, tokenAddress: AccountAddressInput): ConfidentialBalance {
  const cacheKey = `${accountAddress}-balance-for-${tokenAddress}-${aptos.config.network}`;
  const result = getCache<ConfidentialBalance>(cacheKey);
  if (!result) {
    throw new Error("No cached balance found");
  }
  return result;
}

describe("Confidential Asset Sender API", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  const bob = Account.generate();
  const bobConfidential = getTestConfidentialAccount(bob);

  async function getPublicTokenBalance(accountAddress: AccountAddressInput) {
    return await aptos.getAccountCoinAmount({
      accountAddress,
      faMetadataAddress: TOKEN_ADDRESS,
    });
  }
  async function checkAliceDecryptedBalance(
    expectedAvailable: AnyNumber,
    expectedPending: AnyNumber,
    decryptionKey?: TwistedEd25519PrivateKey,
  ) {
    const confidentialBalance = await confidentialAsset.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      decryptionKey: decryptionKey || aliceConfidential,
      useCachedValue: false,
    });

    expect(confidentialBalance.availableBalance()).toBe(BigInt(expectedAvailable));
    expect(confidentialBalance.pendingBalance()).toBe(BigInt(expectedPending));
  }

  async function checkBobDecryptedBalance(
    expectedAvailable: AnyNumber,
    expectedPending: AnyNumber,
  ) {
    const confidentialBalance = await confidentialAsset.getBalance({
      accountAddress: bob.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      decryptionKey: bobConfidential,
      useCachedValue: false,
    });

    expect(confidentialBalance.availableBalance()).toBe(BigInt(expectedAvailable));
    expect(confidentialBalance.pendingBalance()).toBe(BigInt(expectedPending));
  }

  async function checkAliceNormalizedBalanceStatus(expectedStatus: boolean) {
    const isNormalized = await confidentialAsset.isBalanceNormalized({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    expect(isNormalized).toBe(expectedStatus);
  }

  async function checkAliceIncomingTransfersPausedStatus(expectedStatus: boolean) {
    const isPaused = await confidentialAsset.isIncomingTransfersPaused({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    expect(isPaused).toBe(expectedStatus);
  }
  beforeAll(async () => {
    await aptos.fundAccount({
      accountAddress: alice.accountAddress,
      amount: 100000000,
    });
    await aptos.fundAccount({
      accountAddress: bob.accountAddress,
      amount: 100000000,
    });
    await aptos.fundAccount({
      accountAddress: feePayerAccount.accountAddress,
      amount: 100000000,
    });

    console.log("Funded accounts");

    const isAliceRegistered = await confidentialAsset.hasUserRegistered({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    expect(isAliceRegistered).toBeFalsy();
    const registerBalanceTx = await confidentialAsset.registerBalance({
      signer: alice,
      tokenAddress: TOKEN_ADDRESS,
      decryptionKey: aliceConfidential,
    });
    expect(registerBalanceTx.success).toBeTruthy();

    await checkAliceDecryptedBalance(0, 0);

    // const resp = await mintUsdt(alice, 100n);
    // expect(resp.success).toBeTruthy();
  }, longTestTimeout);

  const DEPOSIT_AMOUNT = 5;
  test(
    "it should deposit Alice's balance of fungible token to her confidential balance and check the balance",
    async () => {
      await confidentialAsset.deposit({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        amount: DEPOSIT_AMOUNT,
      });

      // Verify the confidential balance has been updated correctly.
      await checkAliceDecryptedBalance(0, DEPOSIT_AMOUNT);
    },
    longTestTimeout,
  );

  test(
    "it should rollover Alice's confidential balance and check the balance",
    async () => {
      const rolloverTxs = await confidentialAsset.rolloverPendingBalance({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
      });

      for (const tx of rolloverTxs) {
        expect(tx.success).toBeTruthy();
      }

      // This should be false after a rollover
      checkAliceNormalizedBalanceStatus(false);

      // Verify the confidential balance has been updated correctly
      await checkAliceDecryptedBalance(DEPOSIT_AMOUNT, 0);
    },
    longTestTimeout,
  );

  test(
    "it should throw error if rollover is attempted but Alice's confidential balance is not normalized",
    async () => {
      // Verify the current balance is not normalized
      checkAliceNormalizedBalanceStatus(false);

      // Attempting to rollover should throw an error as the balance is not normalized
      await expect(
        confidentialAsset.rolloverPendingBalance({
          signer: alice,
          tokenAddress: TOKEN_ADDRESS,
        }),
      ).rejects.toThrow("Available balance is not normalized and no sender decryption key was provided.");
    },
    longTestTimeout,
  );

  const WITHDRAW_AMOUNT = 1;
  test(
    "it should withdraw Alice's confidential balance and check the balance",
    async () => {
      // Get the current public token balance of Alice
      const aliceTokenBalance = await aptos.getAccountCoinAmount({
        accountAddress: alice.accountAddress,
        faMetadataAddress: TOKEN_ADDRESS,
      });

      // Withdraw the amount from the confidential balance to the public balance
      const withdrawTx = await confidentialAsset.withdraw({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        senderDecryptionKey: aliceConfidential,
        amount: WITHDRAW_AMOUNT,
      });
      expect(withdrawTx.success).toBeTruthy();

      // Verify the confidential balance has been updated correctly
      await checkAliceDecryptedBalance(DEPOSIT_AMOUNT - WITHDRAW_AMOUNT, 0);

      // Verify the public token balance has been updated correctly
      const aliceNewTokenBalance = await aptos.getAccountCoinAmount({
        accountAddress: alice.accountAddress,
        faMetadataAddress: TOKEN_ADDRESS,
      });

      expect(aliceNewTokenBalance).toBe(aliceTokenBalance + WITHDRAW_AMOUNT);

      // Verify the balance is normalized after the withdrawal
      checkAliceNormalizedBalanceStatus(true);
    },
    longTestTimeout,
  );

  test(
    "it should throw if withdrawing more than the available balance",
    async () => {
      const confidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      // Withdraw the amount from the confidential balance to the public balance
      await expect(
        confidentialAsset.withdraw({
          signer: alice,
          tokenAddress: TOKEN_ADDRESS,
          senderDecryptionKey: aliceConfidential,
          amount: confidentialBalance.availableBalance() + BigInt(1),
        }),
      ).rejects.toThrow("Insufficient balance");
    },
    longTestTimeout,
  );

  test(
    "it should withdraw more than the available balance if the total balance is used",
    async () => {
      await confidentialAsset.deposit({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        amount: DEPOSIT_AMOUNT,
      });

      const confidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      // Withdraw the amount from the confidential balance to the public balance
      await confidentialAsset.withdrawWithTotalBalance({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        senderDecryptionKey: aliceConfidential,
        amount: confidentialBalance.availableBalance() + BigInt(1),
      });

      const confidentialBalanceAfterWithdraw = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      expect(confidentialBalanceAfterWithdraw.pendingBalance()).toBe(0n);
    },
    longTestTimeout,
  );

  // TODO: Add this back in once the test setup sets up the auditor correctly.
  test.skip(
    "it should get global auditor",
    async () => {
      const globalAuditor = await confidentialAsset.getAssetAuditorEncryptionKey({
        tokenAddress: TOKEN_ADDRESS,
      });

      expect(globalAuditor).toBeDefined();
    },
    longTestTimeout,
  );

  const TRANSFER_AMOUNT = 2n;
  test(
    "it should throw if transfering to another account that has not registered a balance",
    async () => {
      // Check that Bob has not registered a balance
      const isBobRegistered = await confidentialAsset.hasUserRegistered({
        accountAddress: bob.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });
      expect(isBobRegistered).toBeFalsy();

      await expect(
        confidentialAsset.transfer({
          senderDecryptionKey: aliceConfidential,
          amount: TRANSFER_AMOUNT,
          signer: alice,
          tokenAddress: TOKEN_ADDRESS,
          recipient: bob.accountAddress,
        }),
      ).rejects.toThrow("Failed to get encryption key for recipient");
    },
    longTestTimeout,
  );

  test(
    "it should register Bob's confidential balance",
    async () => {
      const registerBobTx = await confidentialAsset.registerBalance({
        signer: bob,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: bobConfidential,
      });
      expect(registerBobTx.success).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "it should throw if transferring more than the available balance",
    async () => {
      await confidentialAsset.deposit({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        amount: DEPOSIT_AMOUNT,
      });

      const confidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      await expect(
        confidentialAsset.transfer({
          signer: alice,
          tokenAddress: TOKEN_ADDRESS,
          senderDecryptionKey: aliceConfidential,
          amount: confidentialBalance.availableBalance() + BigInt(1), // This is more than the available balance
          recipient: bob.accountAddress,
        }),
      ).rejects.toThrow("Insufficient balance");
    },
    longTestTimeout,
  );

  test(
    "it should transfer more than the available balance if the total balance is used",
    async () => {
      await confidentialAsset.deposit({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        amount: DEPOSIT_AMOUNT,
      });

      const confidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      const transferAmount = confidentialBalance.availableBalance() + BigInt(1);

      // Withdraw the amount from the confidential balance to the public balance
      await confidentialAsset.transferWithTotalBalance({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        senderDecryptionKey: aliceConfidential,
        amount: transferAmount,
        recipient: bob.accountAddress,
      });

      await checkAliceDecryptedBalance(
        confidentialBalance.availableBalance() + confidentialBalance.pendingBalance() - transferAmount,
        0,
      );
    },
    longTestTimeout,
  );

  test(
    "it should transfer Alice's tokens to Bob's pending balance without auditor",
    async () => {
      const confidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      const transferTx = await confidentialAsset.transfer({
        senderDecryptionKey: aliceConfidential,
        amount: TRANSFER_AMOUNT,
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        recipient: bob.accountAddress,
      });

      expect(transferTx.success).toBeTruthy();
      // Verify the confidential balance has been updated correctly
      await checkAliceDecryptedBalance(
        confidentialBalance.availableBalance() - TRANSFER_AMOUNT,
        confidentialBalance.pendingBalance(),
      );
    },
    longTestTimeout,
  );

  // --- Auditor configuration tests ---

  const VOLUNTARY_AUDITOR = TwistedEd25519PrivateKey.generate();
  const EFFECTIVE_AUDITOR = TwistedEd25519PrivateKey.generate();

  test(
    "it should transfer with voluntary auditor only (no effective auditor on-chain)",
    async () => {
      const confidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      const transferTx = await confidentialAsset.transfer({
        senderDecryptionKey: aliceConfidential,
        amount: TRANSFER_AMOUNT,
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        recipient: bob.accountAddress,
        additionalAuditorEncryptionKeys: [VOLUNTARY_AUDITOR.publicKey()],
      });

      expect(transferTx.success).toBeTruthy();

      await checkAliceDecryptedBalance(
        confidentialBalance.availableBalance() - TRANSFER_AMOUNT,
        confidentialBalance.pendingBalance(),
      );
    },
    longTestTimeout,
  );

  // Effective-auditor e2e tests require calling set_asset_specific_auditor as the @aptos_framework (0x1)
  // signer, which we can't do on localnet without the framework private key. The effective-auditor
  // sigma protocol is fully covered by Move unit tests (all 6 configs) and SDK unit tests.
  // TODO: once an `aptos` CLI profile for 0x1 is available on localnet, add e2e tests for:
  //   - "effective auditor only" (set global auditor, transfer with no voluntary auditors)
  //   - "effective + voluntary auditors" (set global auditor, transfer with voluntary auditors)

  test(
    "it should check that Alice's incoming transfers are not paused",
    async () => {
      const isPaused = await confidentialAsset.isIncomingTransfersPaused({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });

      expect(isPaused).toBeFalsy();
    },
    longTestTimeout,
  );

  test(
    "it should throw if checking whether an unregistered account's incoming transfers are paused",
    async () => {
      const unregistered = Account.generate();
      await expect(
        confidentialAsset.isIncomingTransfersPaused({
          accountAddress: unregistered.accountAddress,
          tokenAddress: TOKEN_ADDRESS,
        }),
      ).rejects.toThrow("E_CONFIDENTIAL_STORE_NOT_REGISTERED");
    },
    longTestTimeout,
  );

  test(
    "it should normalize Alice's confidential balance",
    async () => {
      const depositTx = await confidentialAsset.deposit({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        amount: DEPOSIT_AMOUNT,
      });

      expect(depositTx.success).toBeTruthy();

      const rolloverTxs = await confidentialAsset.rolloverPendingBalance({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
      });

      for (const tx of rolloverTxs) {
        expect(tx.success).toBeTruthy();
      }

      // This should be false after a rollover
      checkAliceNormalizedBalanceStatus(false);

      const preNormalizationBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
        useCachedValue: false,
      });

      const normalizeTx = await confidentialAsset.normalizeBalance({
        tokenAddress: TOKEN_ADDRESS,
        senderDecryptionKey: aliceConfidential,
        signer: alice,
      });

      // Check that caching works
      const cachedNormalizedBalance = getCachedBalance(alice.accountAddress, TOKEN_ADDRESS);
      expect(preNormalizationBalance.availableBalanceCipherText()).not.toEqual(
        cachedNormalizedBalance.availableBalanceCipherText(),
      );
      expect(preNormalizationBalance.pendingBalanceCipherText()).toEqual(
        cachedNormalizedBalance.pendingBalanceCipherText(),
      );

      const fetchedBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
        useCachedValue: false,
      });

      expect(cachedNormalizedBalance.availableBalanceCipherText()).toEqual(fetchedBalance.availableBalanceCipherText());
      expect(cachedNormalizedBalance.pendingBalanceCipherText()).toEqual(fetchedBalance.pendingBalanceCipherText());

      expect(normalizeTx.success).toBeTruthy();

      // This should be true after normalization
      checkAliceNormalizedBalanceStatus(true);
    },
    longTestTimeout,
  );

  test(
    "it should throw if checking if account balance is normalized and the account has not registered a balance",
    async () => {
      const unregistered = Account.generate();
      await expect(
        confidentialAsset.isBalanceNormalized({
          tokenAddress: TOKEN_ADDRESS,
          accountAddress: unregistered.accountAddress,
        }),
      ).rejects.toThrow("E_CONFIDENTIAL_STORE_NOT_REGISTERED");
    },
    longTestTimeout,
  );

  test(
    "it withdraw to another account and check the balance",
    async () => {
      // Get the current public token balance of Bob
      const bobTokenBalance = await getPublicTokenBalance(bob.accountAddress);
      const confidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      // Withdraw the amount from the confidential balance to the public balance
      const withdrawTx = await confidentialAsset.withdraw({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        senderDecryptionKey: aliceConfidential,
        amount: WITHDRAW_AMOUNT,
        recipient: bob.accountAddress,
      });
      expect(withdrawTx.success).toBeTruthy();

      const bobNewTokenBalance = await getPublicTokenBalance(bob.accountAddress);
      expect(bobNewTokenBalance).toBe(bobTokenBalance + WITHDRAW_AMOUNT);

      // Verify the confidential balance has been updated correctly
      await checkAliceDecryptedBalance(
        confidentialBalance.availableBalance() - BigInt(WITHDRAW_AMOUNT),
        confidentialBalance.pendingBalance(),
      );
    },
    longTestTimeout,
  );

  test(
    "it should check that transferring normalizes Alice's confidential balance",
    async () => {
      const depositTx = await confidentialAsset.deposit({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        amount: DEPOSIT_AMOUNT,
      });
      expect(depositTx.success).toBeTruthy();

      const rolloverTxs = await confidentialAsset.rolloverPendingBalance({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
      });
      for (const tx of rolloverTxs) {
        expect(tx.success).toBeTruthy();
      }

      // This should be false after rollover
      checkAliceNormalizedBalanceStatus(false);

      const transferTx = await confidentialAsset.transfer({
        senderDecryptionKey: aliceConfidential,
        amount: TRANSFER_AMOUNT,
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        recipient: bob.accountAddress,
      });
      expect(transferTx.success).toBeTruthy();

      // This should be true after a transfer
      checkAliceNormalizedBalanceStatus(true);
    },
    longTestTimeout,
  );

  // =========================================================================
  // Governance tests (must run BEFORE key rotation, which changes Alice's key)
  //
  // These tests require:
  // 1. A localnet started from aptos-core source (for the mint.key)
  // 2. The aptos-core Move framework source (for compiling governance scripts)
  // They are automatically skipped in CI where only the npm CLI package is available.
  // =========================================================================

  // Lazy-initialized governance infrastructure
  let coreResourcesAccount: Ed25519Account | undefined;
  let bytecodeDir: string | undefined;
  let governanceAvailable = false;

  async function govScript(scriptName: string, args: any[]) {
    const result = await submitGovernanceScript({
      coreResourcesAccount: coreResourcesAccount!,
      bytecodeDir: bytecodeDir!,
      scriptName,
      functionArguments: args,
    });
    if (!result.success) {
      throw new Error(`Governance script '${scriptName}' failed: ${result.vm_status}`);
    }
    return result;
  }

  async function govScriptExpectFailure(scriptName: string, args: any[], expectedError: string) {
    const result = await submitGovernanceScript({
      coreResourcesAccount: coreResourcesAccount!,
      bytecodeDir: bytecodeDir!,
      scriptName,
      functionArguments: args,
    });
    expect(result.success).toBeFalsy();
    expect(result.vm_status).toContain(expectedError);
    return result;
  }

  async function tryTransfer(): Promise<{ success: boolean; vm_status?: string }> {
    try {
      const tx = await confidentialAsset.transfer({
        senderDecryptionKey: aliceConfidential,
        amount: 1n,
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        recipient: bob.accountAddress,
      });
      return { success: tx.success, vm_status: tx.vm_status };
    } catch (e: any) {
      return { success: false, vm_status: e.message || String(e) };
    }
  }

  describe("Allow listing", () => {
    beforeAll(async () => {
      coreResourcesAccount = getCoreResourcesAccount();
      bytecodeDir = compileGovernanceScripts();
      governanceAvailable = !!coreResourcesAccount && !!bytecodeDir;
      if (!governanceAvailable) {
        console.log("Skipping governance tests: mint.key or Move framework source not available");
        return;
      }
      await plainAptos.fundAccount({
        accountAddress: coreResourcesAccount!.accountAddress,
        amount: 100_000_000,
      });
    }, longTestTimeout);

    test(
      "allow-listing APT should fail when allow listing is disabled",
      async () => {
        if (!governanceAvailable) return;
        await govScriptExpectFailure(
          "set_confidentiality_for_apt",
          [new Bool(true)],
          "E_ALLOW_LISTING_IS_DISABLED",
        );
      },
      longTestTimeout,
    );

    test(
      "enabling allow listing should block APT transfers (APT not yet allow-listed)",
      async () => {
        if (!governanceAvailable) return;
        const [beforeEnabled] = await plainAptos.view<[boolean]>({
          payload: { function: "0x1::confidential_asset::is_allow_listing_required", functionArguments: [] },
        });
        expect(beforeEnabled).toBeFalsy();

        await govScript("set_allow_listing", [new Bool(true)]);

        const [afterEnabled] = await plainAptos.view<[boolean]>({
          payload: { function: "0x1::confidential_asset::is_allow_listing_required", functionArguments: [] },
        });
        expect(afterEnabled).toBeTruthy();

        const result = await tryTransfer();
        expect(result.success).toBeFalsy();
        expect(result.vm_status).toContain("E_ASSET_TYPE_DISALLOWED");
      },
      longTestTimeout,
    );

    test(
      "allow-listing APT should enable transfers",
      async () => {
        if (!governanceAvailable) return;
        await govScript("set_confidentiality_for_apt", [new Bool(true)]);

        const result = await tryTransfer();
        expect(result.success).toBeTruthy();
      },
      longTestTimeout,
    );

    test(
      "disabling allow listing should allow all transfers (even if APT was previously allow-listed)",
      async () => {
        if (!governanceAvailable) return;
        await govScript("set_allow_listing", [new Bool(false)]);

        const result = await tryTransfer();
        expect(result.success).toBeTruthy();
      },
      longTestTimeout,
    );
  });

  const AUDITOR_KEY_1 = TwistedEd25519PrivateKey.generate();
  const AUDITOR_KEY_2 = TwistedEd25519PrivateKey.generate();
  const AUDITOR_KEY_3 = TwistedEd25519PrivateKey.generate();

  describe("Auditing", () => {
    test(
      "set global auditor (EK_1) and transfer should succeed",
      async () => {
        if (!governanceAvailable) return;
        const ek1Bytes = Array.from(AUDITOR_KEY_1.publicKey().toUint8Array());
        await govScript("set_global_auditor", [MoveVector.U8(ek1Bytes)]);

        // The allow-listing tests created an AssetConfig for APT, so
        // get_effective_auditor_config returns the asset-specific config (no EK),
        // not the global one. The global auditor IS set, but it's shadowed.
        const auditorEk = await confidentialAsset.getAssetAuditorEncryptionKey({
          tokenAddress: TOKEN_ADDRESS,
        });
        expect(auditorEk).toBeUndefined();

        const result = await tryTransfer();
        expect(result.success).toBeTruthy();
      },
      longTestTimeout,
    );

    test(
      "set asset-specific auditor (EK_2) and transfer should succeed with EK_2",
      async () => {
        if (!governanceAvailable) return;
        const ek2Bytes = Array.from(AUDITOR_KEY_2.publicKey().toUint8Array());
        await govScript("set_asset_specific_auditor", [
          AccountAddress.fromString(TOKEN_ADDRESS),
          MoveVector.U8(ek2Bytes),
        ]);

        const auditorEk = await confidentialAsset.getAssetAuditorEncryptionKey({
          tokenAddress: TOKEN_ADDRESS,
        });
        expect(auditorEk).toBeDefined();
        expect(auditorEk!.toUint8Array()).toEqual(AUDITOR_KEY_2.publicKey().toUint8Array());

        const result = await tryTransfer();
        expect(result.success).toBeTruthy();
      },
      longTestTimeout,
    );

    test(
      "remove asset-specific auditor EK — effective auditor becomes None (asset-specific overrides global)",
      async () => {
        if (!governanceAvailable) return;
        await govScript("set_asset_specific_auditor", [
          AccountAddress.fromString(TOKEN_ADDRESS),
          MoveVector.U8([]),
        ]);

        const auditorEk = await confidentialAsset.getAssetAuditorEncryptionKey({
          tokenAddress: TOKEN_ADDRESS,
        });
        expect(auditorEk).toBeUndefined();

        const result = await tryTransfer();
        expect(result.success).toBeTruthy();
      },
      longTestTimeout,
    );

    test(
      "set asset-specific auditor back to EK_2, then update global to EK_3 — effective auditor stays EK_2",
      async () => {
        if (!governanceAvailable) return;
        const ek2Bytes = Array.from(AUDITOR_KEY_2.publicKey().toUint8Array());
        await govScript("set_asset_specific_auditor", [
          AccountAddress.fromString(TOKEN_ADDRESS),
          MoveVector.U8(ek2Bytes),
        ]);

        const ek3Bytes = Array.from(AUDITOR_KEY_3.publicKey().toUint8Array());
        await govScript("set_global_auditor", [MoveVector.U8(ek3Bytes)]);

        const auditorEk = await confidentialAsset.getAssetAuditorEncryptionKey({
          tokenAddress: TOKEN_ADDRESS,
        });
        expect(auditorEk).toBeDefined();
        expect(auditorEk!.toUint8Array()).toEqual(AUDITOR_KEY_2.publicKey().toUint8Array());

        const result = await tryTransfer();
        expect(result.success).toBeTruthy();
      },
      longTestTimeout,
    );

    test(
      "remove global auditor and transfer should succeed (asset-specific EK_2 still active)",
      async () => {
        if (!governanceAvailable) return;
        await govScript("set_global_auditor", [MoveVector.U8([])]);

        const auditorEk = await confidentialAsset.getAssetAuditorEncryptionKey({
          tokenAddress: TOKEN_ADDRESS,
        });
        expect(auditorEk).toBeDefined();
        expect(auditorEk!.toUint8Array()).toEqual(AUDITOR_KEY_2.publicKey().toUint8Array());

        const result = await tryTransfer();
        expect(result.success).toBeTruthy();
      },
      longTestTimeout,
    );
  });

  // =========================================================================
  // Key rotation (must be LAST — changes Alice's decryption key)
  // =========================================================================

  const ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY = TwistedEd25519PrivateKey.generate();
  test(
    "it should rotate Alice's confidential balance key",
    async () => {
      const depositTx = await confidentialAsset.deposit({
        signer: alice,
        tokenAddress: TOKEN_ADDRESS,
        amount: DEPOSIT_AMOUNT,
      });
      expect(depositTx.success).toBeTruthy();

      const confidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      const keyRotationAndUnpauseTx = await confidentialAsset.rotateEncryptionKey({
        signer: alice,
        senderDecryptionKey: aliceConfidential,
        newSenderDecryptionKey: ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY,
        tokenAddress: TOKEN_ADDRESS,
      });
      for (const tx of keyRotationAndUnpauseTx) {
        expect(tx.success).toBeTruthy();
      }

      await checkAliceIncomingTransfersPausedStatus(false);

      await checkAliceDecryptedBalance(
        confidentialBalance.availableBalance() + confidentialBalance.pendingBalance(),
        0,
        ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY,
      );
    },
    longTestTimeout,
  );
});
