// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, AccountAddressInput, AnyNumber } from "@aptos-labs/ts-sdk";
import { TwistedEd25519PrivateKey } from "../../src";
import {
  getTestAccount,
  getTestConfidentialAccount,
  aptos,
  TOKEN_ADDRESS,
  mintUsdt,
  longTestTimeout,
  confidentialAsset,
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

describe.skip("Confidential Asset Sender API", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  const bob = Account.generate();

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

  async function checkAliceNormalizedBalanceStatus(expectedStatus: boolean) {
    const isNormalized = await confidentialAsset.isBalanceNormalized({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    expect(isNormalized).toBe(expectedStatus);
  }

  async function checkAliceBalanceFrozenStatus(expectedStatus: boolean) {
    const isFrozen = await confidentialAsset.isPendingBalanceFrozen({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    expect(isFrozen).toBe(expectedStatus);
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

    const resp = await mintUsdt(alice, 100n);
    expect(resp.success).toBeTruthy();
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
          recipient: alice.accountAddress,
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
        recipient: alice.accountAddress,
      });

      await checkAliceDecryptedBalance(
        confidentialBalance.availableBalance() + confidentialBalance.pendingBalance() - transferAmount,
        transferAmount,
      );
    },
    longTestTimeout,
  );

  test(
    "it should transfer Alice's tokens to Alice's pending balance without auditor",
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
        recipient: alice.accountAddress,
      });

      expect(transferTx.success).toBeTruthy();
      // Verify the confidential balance has been updated correctly
      await checkAliceDecryptedBalance(
        confidentialBalance.availableBalance() - TRANSFER_AMOUNT,
        confidentialBalance.pendingBalance() + TRANSFER_AMOUNT,
      );
    },
    longTestTimeout,
  );

  const AUDITOR = TwistedEd25519PrivateKey.generate();
  test(
    "it should transfer Alice's tokens to Alice's confidential balance with auditor",
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
        recipient: alice.accountAddress,
        additionalAuditorEncryptionKeys: [AUDITOR.publicKey()],
      });

      expect(transferTx.success).toBeTruthy();

      // Verify the confidential balance has been updated correctly
      await checkAliceDecryptedBalance(
        confidentialBalance.availableBalance() - TRANSFER_AMOUNT,
        confidentialBalance.pendingBalance() + TRANSFER_AMOUNT,
      );
    },
    longTestTimeout,
  );

  test(
    "it should check is Alice's balance not frozen",
    async () => {
      const isFrozen = await confidentialAsset.isPendingBalanceFrozen({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });

      expect(isFrozen).toBeFalsy();
    },
    longTestTimeout,
  );

  test(
    "it should throw if checking is Bob's balance not frozen",
    async () => {
      await expect(
        confidentialAsset.isPendingBalanceFrozen({
          accountAddress: bob.accountAddress,
          tokenAddress: TOKEN_ADDRESS,
        }),
      ).rejects.toThrow("393219"); // TODO: Currently when view functions fails a nice error is not returned. :(. Fix the contract to return a nice error.
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
      await expect(
        confidentialAsset.isBalanceNormalized({
          tokenAddress: TOKEN_ADDRESS,
          accountAddress: bob.accountAddress,
        }),
      ).rejects.toThrow("393219"); // TODO: Currently when view functions fails a nice error is not returned. :(. Fix the contract to return a nice error.
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
        recipient: alice.accountAddress,
      });
      expect(transferTx.success).toBeTruthy();

      // This should be true after a transfer
      checkAliceNormalizedBalanceStatus(true);
    },
    longTestTimeout,
  );

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

      // Get the current balance before rotation
      const confidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      // This should unfreeze the balance even though withUnfreezeBalance is unset as it will check the
      // chain for frozen state.
      const keyRotationAndUnfreezeTx = await confidentialAsset.rotateEncryptionKey({
        signer: alice,
        senderDecryptionKey: aliceConfidential,
        newSenderDecryptionKey: ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY,
        tokenAddress: TOKEN_ADDRESS,
      });
      for (const tx of keyRotationAndUnfreezeTx) {
        expect(tx.success).toBeTruthy();
      }

      // Check that the balance is unfrozen
      await checkAliceBalanceFrozenStatus(false);

      // If this decrypts correctly, then the key rotation worked.
      await checkAliceDecryptedBalance(
        confidentialBalance.availableBalance() + confidentialBalance.pendingBalance(),
        0,
        ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY,
      );
    },
    longTestTimeout,
  );
});
