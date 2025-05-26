// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, AccountAddressInput, AnyNumber } from "@aptos-labs/ts-sdk";
import { TwistedEd25519PrivateKey } from "../../src";
import {
  getTestAccount,
  getTestConfidentialAccount,
  aptos,
  TOKEN_ADDRESS,
  sendAndWaitTx,
  mintFungibleTokens,
  longTestTimeout,
  confidentialAsset,
} from "../helpers";
import { preloadTables } from "../helpers/wasmPollardKangaroo";

describe("Confidential balance api", () => {
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
    const { available, pending } = await confidentialAsset.getDecryptedBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      decryptionKey: decryptionKey || aliceConfidential,
    });

    expect(available).toBe(BigInt(expectedAvailable));
    expect(pending).toBe(BigInt(expectedPending));
  }

  async function checkAliceNormalizedBalanceStatus(expectedStatus: boolean) {
    const isNormalized = await confidentialAsset.isBalanceNormalized({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    expect(isNormalized).toBe(expectedStatus);
  }

  async function checkAliceBalanceFrozenStatus(expectedStatus: boolean) {
    const isFrozen = await confidentialAsset.isBalanceFrozen({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    expect(isFrozen).toBe(expectedStatus);
  }
  beforeAll(async () => {
    await preloadTables();
    await aptos.fundAccount({
      accountAddress: alice.accountAddress,
      amount: 100000000,
    });
    await aptos.fundAccount({
      accountAddress: bob.accountAddress,
      amount: 100000000,
    });

    const isAliceRegistered = await confidentialAsset.hasUserRegistered({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    expect(isAliceRegistered).toBeFalsy();
    const registerBalanceTx = await confidentialAsset.registerBalance({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      decryptionKey: aliceConfidential,
    });
    const registerBalanceTxResp = await sendAndWaitTx(registerBalanceTx, alice);

    expect(registerBalanceTxResp.success).toBeTruthy();

    await checkAliceDecryptedBalance(0, 0);

    const resp = await mintFungibleTokens(alice);
    expect(resp.success).toBeTruthy();
  }, longTestTimeout);

  test(
    "it should check Alice encrypted confidential balances",
    async () => {
      const [aliceConfidentialBalances] = await Promise.all([
        confidentialAsset.getEncryptedBalance({ accountAddress: alice.accountAddress, tokenAddress: TOKEN_ADDRESS }),
      ]);
      expect(aliceConfidentialBalances.pending.length).toBeDefined();
      expect(aliceConfidentialBalances.available.length).toBeDefined();
    },
    longTestTimeout,
  );

  const DEPOSIT_AMOUNT = 5;
  test(
    "it should deposit Alice's balance of fungible token to her confidential balance and check the balance",
    async () => {
      const depositTx = await confidentialAsset.deposit({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        amount: DEPOSIT_AMOUNT,
      });
      const resp = await sendAndWaitTx(depositTx, alice);

      expect(resp.success).toBeTruthy();

      // Verify the confidential balance has been updated correctly.
      await checkAliceDecryptedBalance(0, DEPOSIT_AMOUNT);
    },
    longTestTimeout,
  );

  test(
    "it should rollover Alice's confidential balance and check the balance",
    async () => {
      const rolloverTx = await confidentialAsset.rolloverPendingBalance({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });

      const txResp = await sendAndWaitTx(rolloverTx, alice);
      expect(txResp.success).toBeTruthy();

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
          sender: alice.accountAddress,
          tokenAddress: TOKEN_ADDRESS,
        }),
      ).rejects.toThrow("Balance must be normalized before rollover");

      // We can force creation of the transaction by setting checkNormalized to false
      const rolloverTx = await confidentialAsset.rolloverPendingBalance({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        checkNormalized: false,
      });

      // Sending the transaction should result in an error thrown as the chain will fail the transaction
      // since the balance is not normalized
      await expect(sendAndWaitTx(rolloverTx, alice)).rejects.toThrow(
        "The operation requires the actual balance to be normalized.",
      );
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
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        senderDecryptionKey: aliceConfidential,
        amount: WITHDRAW_AMOUNT,
      });
      const txResp = await sendAndWaitTx(withdrawTx, alice);

      expect(txResp.success).toBeTruthy();

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
          sender: alice.accountAddress,
          tokenAddress: TOKEN_ADDRESS,
          recipient: bob.accountAddress,
        }),
      ).rejects.toThrow("Failed to get encryption key for recipient");
    },
    longTestTimeout,
  );

  test(
    "it should transfer Alice's tokens to Alice's pending balance without auditor",
    async () => {
      const { available, pending } = await confidentialAsset.getDecryptedBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      const transferTx = await confidentialAsset.transfer({
        senderDecryptionKey: aliceConfidential,
        amount: TRANSFER_AMOUNT,
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        recipient: alice.accountAddress,
      });
      const txResp = await sendAndWaitTx(transferTx, alice);

      expect(txResp.success).toBeTruthy();

      // Verify the confidential balance has been updated correctly
      await checkAliceDecryptedBalance(available - TRANSFER_AMOUNT, pending + TRANSFER_AMOUNT);
    },
    longTestTimeout,
  );

  const AUDITOR = TwistedEd25519PrivateKey.generate();
  test(
    "it should transfer Alice's tokens to Alice's confidential balance with auditor",
    async () => {
      const { available, pending } = await confidentialAsset.getDecryptedBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      const transferTx = await confidentialAsset.transfer({
        senderDecryptionKey: aliceConfidential,
        amount: TRANSFER_AMOUNT,
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        recipient: alice.accountAddress,
        additionalAuditorEncryptionKeys: [AUDITOR.publicKey()],
      });
      const txResp = await sendAndWaitTx(transferTx, alice);

      expect(txResp.success).toBeTruthy();

      // Verify the confidential balance has been updated correctly
      await checkAliceDecryptedBalance(available - TRANSFER_AMOUNT, pending + TRANSFER_AMOUNT);
    },
    longTestTimeout,
  );

  test(
    "it should check is Alice's balance not frozen",
    async () => {
      const isFrozen = await confidentialAsset.isBalanceFrozen({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });

      expect(isFrozen).toBeFalsy();
    },
    longTestTimeout,
  );

  test(
    "it should normalize Alice's confidential balance",
    async () => {
      const rolloverTx = await confidentialAsset.rolloverPendingBalance({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });

      const txResp = await sendAndWaitTx(rolloverTx, alice);
      expect(txResp.success).toBeTruthy();

      // This should be false after a rollover
      checkAliceNormalizedBalanceStatus(false);

      const normalizeTx = await confidentialAsset.normalizeBalance({
        tokenAddress: TOKEN_ADDRESS,
        senderDecryptionKey: aliceConfidential,
        sender: alice.accountAddress,
      });

      const normalizeTxResp = await sendAndWaitTx(normalizeTx, alice);
      expect(normalizeTxResp.success).toBeTruthy();

      // This should be true after normalization
      checkAliceNormalizedBalanceStatus(true);
    },
    longTestTimeout,
  );

  test(
    "it throw if withdraw to another account",
    async () => {
      // Get the current public token balance of Bob
      const bobTokenBalance = await getPublicTokenBalance(bob.accountAddress);
      const { available, pending } = await confidentialAsset.getDecryptedBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      // Withdraw the amount from the confidential balance to the public balance
      const withdrawTx = await confidentialAsset.withdraw({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        senderDecryptionKey: aliceConfidential,
        amount: WITHDRAW_AMOUNT,
        recipient: bob.accountAddress,
      });
      const txResp = await sendAndWaitTx(withdrawTx, alice);
      expect(txResp.success).toBeTruthy();

      const bobNewTokenBalance = await getPublicTokenBalance(bob.accountAddress);
      expect(bobNewTokenBalance).toBe(bobTokenBalance + WITHDRAW_AMOUNT);

      // Verify the confidential balance has been updated correctly
      await checkAliceDecryptedBalance(available - BigInt(WITHDRAW_AMOUNT), pending);
    },
    longTestTimeout,
  );

  test(
    "it should check that transferring normalizes Alice's confidential balance",
    async () => {
      const depositTx = await confidentialAsset.deposit({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        amount: DEPOSIT_AMOUNT,
      });
      const resp = await sendAndWaitTx(depositTx, alice);
      expect(resp.success).toBeTruthy();

      const rolloverTx = await confidentialAsset.rolloverPendingBalance({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });
      const txResp = await sendAndWaitTx(rolloverTx, alice);
      expect(txResp.success).toBeTruthy();

      // This should be false after normalization
      checkAliceNormalizedBalanceStatus(false);

      const transferTx = await confidentialAsset.transfer({
        senderDecryptionKey: aliceConfidential,
        amount: TRANSFER_AMOUNT,
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        recipient: alice.accountAddress,
      });
      const transferTxResp = await sendAndWaitTx(transferTx, alice);
      expect(transferTxResp.success).toBeTruthy();

      // This should be true after normalization
      checkAliceNormalizedBalanceStatus(true);
    },
    longTestTimeout,
  );

  const ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY = TwistedEd25519PrivateKey.generate();
  test(
    "it should rotate Alice's confidential balance key",
    async () => {
      const depositTx = await confidentialAsset.deposit({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        amount: DEPOSIT_AMOUNT,
      });
      let txResp = await sendAndWaitTx(depositTx, alice);
      expect(txResp.success).toBeTruthy();

      await expect(
        confidentialAsset.rotateEncryptionKey({
          sender: alice.accountAddress,

          senderDecryptionKey: aliceConfidential,
          newDecryptionKey: ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY,
          withUnfreezeBalance: true,
          tokenAddress: TOKEN_ADDRESS,
        }),
      ).rejects.toThrow("Pending balance must be 0 before rotating encryption key");

      const rolloverTx = await confidentialAsset.rolloverPendingBalance({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        withFreezeBalance: true,
      });
      txResp = await sendAndWaitTx(rolloverTx, alice);
      expect(txResp.success).toBeTruthy();

      await checkAliceBalanceFrozenStatus(true);

      // Get the current balance before rotation
      const { available, pending } = await confidentialAsset.getDecryptedBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
      });

      // This should unfreeze the balance even though withUnfreezeBalance is unset as it will check the
      // chain for frozen state.
      const keyRotationAndUnfreezeTx = await confidentialAsset.rotateEncryptionKey({
        sender: alice.accountAddress,
        senderDecryptionKey: aliceConfidential,
        newDecryptionKey: ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY,
        tokenAddress: TOKEN_ADDRESS,
      });
      txResp = await sendAndWaitTx(keyRotationAndUnfreezeTx, alice);
      expect(txResp.success).toBeTruthy();

      // Check that the balance is unfrozen
      await checkAliceBalanceFrozenStatus(false);

      // If this decrypts correctly, then the key rotation worked.
      await checkAliceDecryptedBalance(available, pending, ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY);
    },
    longTestTimeout,
  );
});
