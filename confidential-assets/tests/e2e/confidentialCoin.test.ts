// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  ConfidentialBalance,
  ConfidentialAmount,
  TwistedEd25519PublicKey,
  TwistedEd25519PrivateKey,
  TwistedElGamalCiphertext,
} from "../../src";
import { addNewContentLineToFile, longTestTimeout } from "../helpers";
import {
  getTestAccount,
  getTestConfidentialAccount,
  aptos,
  MOCK_TOKEN_DATA,
  sendAndWaitTx,
  mintFungibleTokens,
  sendAndWaitBatchTxs,
  confidentialAsset,
  preCheck,
} from "../helpers/e2e";
import { preloadTables } from "../helpers/wasmPollardKangaroo";

describe("Confidential balance api", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  beforeAll(async () => {
    await preCheck();
  });

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
    "it should check if Alice's confidential balance is registered already",
    async () => {
      isAliceRegistered = await confidentialAsset.hasUserRegistered({
        accountAddress: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
      });
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

      const aliceRegisterVBTxBody = await confidentialAsset.registerBalance({
        sender: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
        publicKey: aliceConfidential.publicKey(),
      });

      const aliceTxResp = await sendAndWaitTx(aliceRegisterVBTxBody, alice);

      expect(aliceTxResp.success).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "it should confirm that Alice's confidential balance is registered now",
    async () => {
      const isAliceRegisteredNow = await confidentialAsset.hasUserRegistered({
        accountAddress: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
      });
      expect(isAliceRegisteredNow).toBeTruthy();
    },
    longTestTimeout,
  );

  let aliceConfidentialBalances: ConfidentialBalance;
  test(
    "it should check Alice confidential balances",
    async () => {
      const [aliceVB] = await Promise.all([
        confidentialAsset.getBalance({ accountAddress: alice.accountAddress, tokenAddress: MOCK_TOKEN_DATA.address }),
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
      const depositTx = await confidentialAsset.deposit({
        sender: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
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
      const aliceChunkedConfidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
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

  let isAliceBalanceNormalized = true;
  let unnormalizedAliceEncryptedBalance: TwistedElGamalCiphertext[];
  test(
    "it should check if Alice's confidential balance is normalized already",
    async () => {
      isAliceBalanceNormalized = await confidentialAsset.isUserBalanceNormalized({
        accountAddress: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
      });

      if (!isAliceBalanceNormalized) {
        const unnormalizedAliceBalances = await confidentialAsset.getBalance({
          accountAddress: alice.accountAddress,
          tokenAddress: MOCK_TOKEN_DATA.address,
        });

        unnormalizedAliceEncryptedBalance = unnormalizedAliceBalances.actual;
      }
    },
    longTestTimeout,
  );

  test(
    "it should normalize Alice's confidential balance if necessary",
    async () => {
      if (unnormalizedAliceEncryptedBalance && !isAliceBalanceNormalized) {
        const unnormalizedConfidentialAmount = await ConfidentialAmount.fromEncrypted(
          unnormalizedAliceEncryptedBalance,
          aliceConfidential,
          {
            chunksCount: 2,
          },
        );

        const normalizeTx = await confidentialAsset.normalizeUserBalance({
          tokenAddress: MOCK_TOKEN_DATA.address,
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
      const aliceChunkedConfidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
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

  test(
    "it should safely rollover Alice's confidential balance",
    async () => {
      const rolloverTxPayloads = await confidentialAsset.safeRolloverPendingCB({
        sender: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
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
      const aliceChunkedConfidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
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

      const withdrawTx = await confidentialAsset.withdraw({
        sender: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
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
      const aliceChunkedConfidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
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
      const [{ vec }] = await confidentialAsset.getAssetAuditor({
        tokenAddress: MOCK_TOKEN_DATA.address,
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
      const transferTx = await confidentialAsset.transferCoin({
        senderDecryptionKey: aliceConfidential,
        recipientEncryptionKey: aliceConfidential.publicKey(),
        encryptedActualBalance: aliceConfidentialBalances.actual,
        amountToTransfer: TRANSFER_AMOUNT,
        sender: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
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
      const aliceChunkedConfidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
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
      const transferTx = await confidentialAsset.transferCoin({
        senderDecryptionKey: aliceConfidential,
        recipientEncryptionKey: aliceConfidential.publicKey(),
        encryptedActualBalance: aliceConfidentialBalances.actual,
        amountToTransfer: TRANSFER_AMOUNT,
        sender: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
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
      const aliceChunkedConfidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
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
      const isFrozen = await confidentialAsset.isBalanceFrozen({
        accountAddress: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
      });

      expect(isFrozen).toBeFalsy();
    },
    longTestTimeout,
  );

  const ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY = TwistedEd25519PrivateKey.generate();
  test.skip(
    "it should safely rotate Alice's confidential balance key",
    async () => {
      const keyRotationAndUnfreezeTxResponse = await confidentialAsset.safeRotateCBKey(aptos, alice, {
        sender: alice.accountAddress,

        currDecryptionKey: aliceConfidential,
        newDecryptionKey: ALICE_NEW_CONFIDENTIAL_PRIVATE_KEY,

        currEncryptedBalance: aliceConfidentialBalances.actual,

        withUnfreezeBalance: true,
        tokenAddress: MOCK_TOKEN_DATA.address,
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
      const aliceChunkedConfidentialBalance = await confidentialAsset.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: MOCK_TOKEN_DATA.address,
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
