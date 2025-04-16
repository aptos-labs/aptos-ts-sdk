// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  TwistedEd25519PrivateKey,
  TwistedElGamalCiphertext,
  ConfidentialAmount,
  ConfidentialBalance,
  ConfidentialCoin,
  TwistedEd25519PublicKey,
} from "../../../src";
import { longTestTimeout } from "../../unit/helper";
import {
  addNewContentLineToFile,
  aptos,
  getTestAccount,
  getTestConfidentialAccount,
  mintFungibleTokens,
  sendAndWaitBatchTxs,
  sendAndWaitTx,
  TOKEN_ADDRESS,
} from "../../unit/confidential/helpers";
import { preloadTables } from "../../unit/confidential/kangaroo/wasmPollardKangaroo";

describe("Confidential balance api", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  test(
    "Pre load wasm table map",
    async () => {
      await preloadTables();
    },
    longTestTimeout,
  );

  test(
    "it should ensure Alice able to afford transactions",
    async () => {
      const [aliceBalance] = await Promise.all([
        aptos.getAccountAPTAmount({
          accountAddress: alice.accountAddress,
        }),
      ]);

      expect(aliceBalance).toBeGreaterThan(0);
    },
    longTestTimeout,
  );

  let isAliceRegistered = false;
  test(
    "it should check Alice confidential balance registered",
    async () => {
      isAliceRegistered = await aptos.confidentialCoin.hasUserRegistered({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });

      expect(isAliceRegistered).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "it should register Alice confidential balance if necessary",
    async () => {
      if (isAliceRegistered) {
        expect(true).toBeTruthy();
        return;
      }

      const aliceRegisterVBTxBody = await aptos.confidentialCoin.registerBalance({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        publicKey: aliceConfidential.publicKey(),
      });

      const aliceTxResp = await sendAndWaitTx(aliceRegisterVBTxBody, alice);

      expect(aliceTxResp.success).toBeTruthy();
    },
    longTestTimeout,
  );

  let aliceConfidentialBalances: ConfidentialBalance;
  test(
    "it should check Alice confidential balances",
    async () => {
      const [aliceVB] = await Promise.all([
        aptos.confidentialCoin.getBalance({ accountAddress: alice.accountAddress, tokenAddress: TOKEN_ADDRESS }),
      ]);
      aliceConfidentialBalances = aliceVB;

      expect(aliceConfidentialBalances.pending.length).toBeDefined();
      expect(aliceConfidentialBalances.actual.length).toBeDefined();
    },
    longTestTimeout,
  );

  test(
    "it should decrypt Alice confidential balances",
    async () => {
      const [aliceDecryptedPendingBalance, aliceDecryptedActualBalance] = await Promise.all([
        (
          await ConfidentialAmount.fromEncrypted(aliceConfidentialBalances.pending, aliceConfidential, {
            chunksCount: 2,
          })
        ).amount,
        (await ConfidentialAmount.fromEncrypted(aliceConfidentialBalances.actual, aliceConfidential)).amount,
      ]);

      expect(aliceDecryptedPendingBalance).toBeDefined();
      expect(aliceDecryptedActualBalance).toBeDefined();
    },
    longTestTimeout,
  );

  test(
    "it should mint fungible tokens to Alice's account",
    async () => {
      const resp = await mintFungibleTokens(alice);

      expect(resp.success).toBeTruthy();
    },
    longTestTimeout,
  );

  const DEPOSIT_AMOUNT = 5n;
  test(
    "it should deposit Alice's balance of fungible token to her confidential balance",
    async () => {
      const depositTx = await aptos.confidentialCoin.deposit({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        amount: DEPOSIT_AMOUNT,
      });
      const resp = await sendAndWaitTx(depositTx, alice);

      expect(resp.success).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "it should fetch and decrypt Alice's confidential balance after deposit",
    async () => {
      const aliceChunkedConfidentialBalance = await aptos.confidentialCoin.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });
      aliceConfidentialBalances = aliceChunkedConfidentialBalance;

      const aliceConfidentialAmount = await ConfidentialAmount.fromEncrypted(
        aliceChunkedConfidentialBalance.pending,
        aliceConfidential,
      );

      expect(aliceConfidentialAmount.amount).toBeGreaterThanOrEqual(DEPOSIT_AMOUNT);
    },
    longTestTimeout,
  );

  test(
    "it should safely rollover Alice's confidential balance",
    async () => {
      const rolloverTxPayloads = await aptos.confidentialCoin.safeRolloverPendingCB({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        withFreezeBalance: false,
        decryptionKey: aliceConfidential,
      });

      const txResponses = await sendAndWaitBatchTxs(rolloverTxPayloads, alice);

      expect(txResponses.every((el) => el.success)).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "it should check Alice's actual confidential balance after rollover",
    async () => {
      const aliceChunkedConfidentialBalance = await aptos.confidentialCoin.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });
      aliceConfidentialBalances = aliceChunkedConfidentialBalance;

      const aliceConfidentialAmount = await ConfidentialAmount.fromEncrypted(
        aliceChunkedConfidentialBalance.actual,
        aliceConfidential,
      );

      expect(aliceConfidentialAmount.amount).toBeGreaterThanOrEqual(DEPOSIT_AMOUNT);
    },
    longTestTimeout,
  );

  const WITHDRAW_AMOUNT = 1n;
  test(
    "it should withdraw Alice's confidential balance",
    async () => {
      const aliceConfidentialAmount = await ConfidentialAmount.fromEncrypted(
        aliceConfidentialBalances.actual,
        aliceConfidential,
      );

      const withdrawTx = await aptos.confidentialCoin.withdraw({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
        encryptedActualBalance: aliceConfidentialAmount.amountEncrypted!,
        amountToWithdraw: WITHDRAW_AMOUNT,
      });
      const txResp = await sendAndWaitTx(withdrawTx, alice);

      expect(txResp.success).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "it should check Alice's confidential balance after withdrawal",
    async () => {
      const aliceChunkedConfidentialBalance = await aptos.confidentialCoin.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });
      aliceConfidentialBalances = aliceChunkedConfidentialBalance;

      const aliceConfidentialAmount = await ConfidentialAmount.fromEncrypted(
        aliceChunkedConfidentialBalance.actual,
        aliceConfidential,
      );

      expect(aliceConfidentialAmount.amount).toBeGreaterThanOrEqual(0n);
    },
    longTestTimeout,
  );

  test(
    "it should get global auditor",
    async () => {
      const [{ vec }] = await aptos.confidentialCoin.getAssetAuditor({
        tokenAddress: TOKEN_ADDRESS,
      });
      const globalAuditorAddress = new TwistedEd25519PublicKey(vec);

      expect(globalAuditorAddress.toString()).toBeDefined();
    },
    longTestTimeout,
  );

  const TRANSFER_AMOUNT = 2n;
  test(
    "it should transfer Alice's tokens to Alice's pending balance without auditor",
    async () => {
      const transferTx = await aptos.confidentialCoin.transferCoin({
        senderDecryptionKey: aliceConfidential,
        recipientEncryptionKey: aliceConfidential.publicKey(),
        encryptedActualBalance: aliceConfidentialBalances.actual,
        amountToTransfer: TRANSFER_AMOUNT,
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        recipientAddress: alice.accountAddress,
      });
      const txResp = await sendAndWaitTx(transferTx, alice);

      expect(txResp.success).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "it should check Alice's confidential balance after transfer",
    async () => {
      const aliceChunkedConfidentialBalance = await aptos.confidentialCoin.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });
      aliceConfidentialBalances = aliceChunkedConfidentialBalance;

      const aliceConfidentialAmount = await ConfidentialAmount.fromEncrypted(
        aliceChunkedConfidentialBalance.actual,
        aliceConfidential,
      );

      expect(aliceConfidentialAmount.amount).toBeGreaterThanOrEqual(0n);
    },
    longTestTimeout,
  );

  const AUDITOR = TwistedEd25519PrivateKey.generate();
  test(
    "it should transfer Alice's tokens to Alice's confidential balance with auditor",
    async () => {
      const transferTx = await aptos.confidentialCoin.transferCoin({
        senderDecryptionKey: aliceConfidential,
        recipientEncryptionKey: aliceConfidential.publicKey(),
        encryptedActualBalance: aliceConfidentialBalances.actual,
        amountToTransfer: TRANSFER_AMOUNT,
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        recipientAddress: alice.accountAddress,
        auditorEncryptionKeys: [AUDITOR.publicKey()],
      });
      const txResp = await sendAndWaitTx(transferTx, alice);

      expect(txResp.success).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "it should check Alice's confidential balance after transfer with auditors",
    async () => {
      const aliceChunkedConfidentialBalance = await aptos.confidentialCoin.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });
      aliceConfidentialBalances = aliceChunkedConfidentialBalance;

      const aliceConfidentialAmount = await ConfidentialAmount.fromEncrypted(
        aliceChunkedConfidentialBalance.pending,
        aliceConfidential,
      );

      expect(aliceConfidentialAmount.amount).toBeGreaterThanOrEqual(TRANSFER_AMOUNT);
    },
    longTestTimeout,
  );

  test(
    "it should check is Alice's balance not frozen",
    async () => {
      const isFrozen = await aptos.confidentialCoin.isBalanceFrozen({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });

      expect(isFrozen).toBeFalsy();
    },
    longTestTimeout,
  );

  let isAliceBalanceNormalized = true;
  let unnormalizedAliceEncryptedBalance: TwistedElGamalCiphertext[];
  test(
    "it should check Alice's confidential balance is normalized",
    async () => {
      isAliceBalanceNormalized = await aptos.confidentialCoin.isUserBalanceNormalized({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });

      if (!isAliceBalanceNormalized) {
        const unnormalizedAliceBalances = await aptos.confidentialCoin.getBalance({
          accountAddress: alice.accountAddress,
          tokenAddress: TOKEN_ADDRESS,
        });

        unnormalizedAliceEncryptedBalance = unnormalizedAliceBalances.actual;
      }

      expect(isAliceBalanceNormalized).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "it should normalize Alice's confidential balance",
    async () => {
      if (unnormalizedAliceEncryptedBalance && !isAliceBalanceNormalized) {
        const unnormalizedConfidentialAmount = await ConfidentialAmount.fromEncrypted(
          unnormalizedAliceEncryptedBalance,
          aliceConfidential,
          {
            chunksCount: 2,
          },
        );

        const normalizeTx = await aptos.confidentialCoin.normalizeUserBalance({
          tokenAddress: TOKEN_ADDRESS,
          decryptionKey: aliceConfidential,
          unnormalizedEncryptedBalance: unnormalizedAliceEncryptedBalance,
          balanceAmount: unnormalizedConfidentialAmount.amount,

          sender: alice.accountAddress,
        });

        const txResp = await sendAndWaitTx(normalizeTx, alice);

        expect(txResp.success).toBeTruthy();
      } else {
        expect(true).toBeTruthy();
      }
    },
    longTestTimeout,
  );

  test(
    "it should check Alice's confidential balance after normalization",
    async () => {
      const aliceChunkedConfidentialBalance = await aptos.confidentialCoin.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });
      aliceConfidentialBalances = aliceChunkedConfidentialBalance;

      const aliceConfidentialAmount = await ConfidentialAmount.fromEncrypted(
        aliceChunkedConfidentialBalance.pending,
        aliceConfidential,
      );

      expect(aliceConfidentialAmount.amount).toBeDefined();
    },
    longTestTimeout,
  );

  const ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY = TwistedEd25519PrivateKey.generate();
  test.skip(
    "it should safely rotate Alice's confidential balance key",
    async () => {
      const keyRotationAndUnfreezeTxResponse = await ConfidentialCoin.safeRotateCBKey(aptos, alice, {
        sender: alice.accountAddress,

        currDecryptionKey: aliceConfidential,
        newDecryptionKey: ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY,

        currEncryptedBalance: aliceConfidentialBalances.actual,

        withUnfreezeBalance: true,
        tokenAddress: TOKEN_ADDRESS,
      });

      /* eslint-disable no-console */
      console.log("\n\n\n");
      console.log("SAVE NEW ALICE'S CONFIDENTIAL PRIVATE KEY");
      console.log(ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY.toString());
      console.log("\n\n\n");
      /* eslint-enable */

      addNewContentLineToFile(".env.development", `#TESTNET_DK=${ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY.toString()}`);

      expect(keyRotationAndUnfreezeTxResponse.success).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "it should get new Alice's confidential balance",
    async () => {
      const aliceChunkedConfidentialBalance = await aptos.confidentialCoin.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });
      aliceConfidentialBalances = aliceChunkedConfidentialBalance;

      const aliceActualConfidentialAmount = await ConfidentialAmount.fromEncrypted(
        aliceChunkedConfidentialBalance.actual,
        ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY,
      );

      expect(aliceActualConfidentialAmount.amount).toBeGreaterThanOrEqual(0n);
    },
    longTestTimeout,
  );
});
