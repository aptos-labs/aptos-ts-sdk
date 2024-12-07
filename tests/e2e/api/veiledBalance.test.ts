// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AptosConfig,
  Aptos,
  Network,
  Account,
  NetworkToNetworkName,
  TwistedEd25519PrivateKey,
  AnyRawTransaction,
  CommittedTransactionResponse,
  TwistedElGamalCiphertext,
  Ed25519PrivateKey,
  TransactionWorkerEventsEnum,
  InputGenerateTransactionPayloadData,
} from "../../../src";
import { VeiledAmount } from "../../../src/core/crypto/veiled/veiledAmount";
import { longTestTimeout } from "../../unit/helper";
import { VeiledBalance } from "../../../src/api/veiledCoin";

describe("Veiled balance api", () => {
  const APTOS_NETWORK: Network = NetworkToNetworkName[Network.TESTNET];
  const config = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(config);

  const { TESTNET_PK, TESTNET_DK } = process.env;

  /**
   * Address of the mocked fungible token on the testnet
   */
  const TOKEN_ADDRESS = "0x4659b416f0ee349907881a5c422e307ea1838fbbf7041b78f5d3dec078a6faa4";
  /**
   * Address of the module for minting mocked fungible tokens on the testnet
   */
  const MODULE_ADDRESS = "0xcbd21318a3fe6eb6c01f3c371d9aca238a6cd7201d3fc75627767b11b87dcbf5";
  // TODO: decimals?
  const TOKENS_TO_MINT = 1_000;

  // const INITIAL_APTOS_BALANCE = 0.5 * 10 ** 8;

  const mintFungibleTokens = async (account: Account) => {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::mock_token::mint_to`,
        functionArguments: [TOKENS_TO_MINT],
      },
    });
    const pendingTxn = await aptos.signAndSubmitTransaction({ signer: account, transaction });
    return aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
  };

  const sendAndWaitTx = async (
    transaction: AnyRawTransaction,
    signer: Account,
  ): Promise<CommittedTransactionResponse> => {
    const pendingTxn = await aptos.signAndSubmitTransaction({ signer, transaction });
    return aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
  };

  const sendAndWaitBatchTxs = async (
    txPayloads: InputGenerateTransactionPayloadData[],
    sender: Account,
  ): Promise<CommittedTransactionResponse[]> => {
    aptos.transaction.batch.forSingleAccount({
      sender,
      data: txPayloads,
    });

    let allTxSentPromiseResolve: (value: void | PromiseLike<void>) => void;

    const txHashes: string[] = [];
    aptos.transaction.batch.on(TransactionWorkerEventsEnum.TransactionSent, async (data) => {
      txHashes.push(data.transactionHash);

      if (txHashes.length === txPayloads.length) {
        allTxSentPromiseResolve();
      }
    });

    await new Promise<void>((resolve) => {
      allTxSentPromiseResolve = resolve;
    });

    return Promise.all(txHashes.map((txHash) => aptos.waitForTransaction({ transactionHash: txHash })));
  };

  const alice = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(TESTNET_PK!),
  });

  // TODO: implement once faucet works
  // test(
  //   "it should fund Alice aptos accounts balances",
  //   async () => {
  //     const [aliceResponse] = await Promise.all([
  //       aptos.fundAccount({
  //         accountAddress: alice.accountAddress,
  //         amount: INITIAL_APTOS_BALANCE,
  //       }),
  //     ]);
  //
  //     expect(aliceResponse.success).toBeTruthy();
  //   },
  //   longTestTimeout,
  // );

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

  const aliceDecryptionKey = new TwistedEd25519PrivateKey(
    // TODO: remove
    TESTNET_DK!,
  );

  let isAliceRegistered = false;
  test("it should check Alice veiled balance registered", async () => {
    isAliceRegistered = await aptos.veiledCoin.hasUserRegistered({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    expect(isAliceRegistered).toBeTruthy();
  });

  test(
    "it should register Alice veiled balance if necessary",
    async () => {
      if (isAliceRegistered) {
        expect(true).toBeTruthy();
        return;
      }

      const aliceRegisterVBTxBody = await aptos.veiledCoin.registerBalance({
        sender: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
        publicKey: aliceDecryptionKey.publicKey(),
      });

      const aliceTxResp = await sendAndWaitTx(aliceRegisterVBTxBody, alice);

      expect(aliceTxResp.success).toBeTruthy();
    },
    longTestTimeout,
  );

  let aliceVeiledBalances: VeiledBalance;
  test(
    "it should check Alice veiled balances",
    async () => {
      const [aliceVB] = await Promise.all([
        aptos.veiledCoin.getBalance({ accountAddress: alice.accountAddress, tokenAddress: TOKEN_ADDRESS }),
      ]);
      aliceVeiledBalances = aliceVB;

      expect(aliceVeiledBalances.pending.length).toBeDefined();
      expect(aliceVeiledBalances.actual.length).toBeDefined();
    },
    longTestTimeout,
  );

  test("it should decrypt Alice veiled balances", async () => {
    const [aliceDecryptedPendingBalance, aliceDecryptedActualBalance] = await Promise.all([
      (await VeiledAmount.fromEncrypted(aliceVeiledBalances.pending, aliceDecryptionKey, { chunksCount: 2 })).amount,
      (await VeiledAmount.fromEncrypted(aliceVeiledBalances.actual, aliceDecryptionKey)).amount,
    ]);

    expect(aliceDecryptedPendingBalance).toBeDefined();
    expect(aliceDecryptedActualBalance).toBeDefined();
  });

  test("it should mint fungible tokens to Alice's account", async () => {
    const resp = await mintFungibleTokens(alice);

    expect(resp.success).toBeTruthy();
  });

  const DEPOSIT_AMOUNT = 5n;
  test("it should deposit Alice's balance of fungible token to her veiled balance", async () => {
    const depositTx = await aptos.veiledCoin.deposit({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      amount: DEPOSIT_AMOUNT,
    });
    const resp = await sendAndWaitTx(depositTx, alice);

    expect(resp.success).toBeTruthy();
  });

  test("it should fetch and decrypt Alice's veiled balance after deposit", async () => {
    const aliceChunkedVeiledBalance = await aptos.veiledCoin.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    aliceVeiledBalances = aliceChunkedVeiledBalance;

    const aliceVeiledAmount = await VeiledAmount.fromEncrypted(aliceChunkedVeiledBalance.pending, aliceDecryptionKey);

    expect(aliceVeiledAmount.amount).toBeGreaterThanOrEqual(DEPOSIT_AMOUNT);
  });

  test("it should safely rollover Alice's veiled balance", async () => {
    const aliceBalances = await aptos.veiledCoin.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    const unnormalizedVeiledAmount = await VeiledAmount.fromEncrypted(aliceBalances.actual, aliceDecryptionKey);

    const rolloverTxPayloads = await aptos.veiledCoin.safeRolloverPendingVB({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      withFreezeBalance: false,

      decryptionKey: aliceDecryptionKey,
      unnormilizedEncryptedBalance: unnormalizedVeiledAmount.amountEncrypted!,
      balanceAmount: unnormalizedVeiledAmount.amount,
    });

    const txResponses = await sendAndWaitBatchTxs(rolloverTxPayloads, alice);

    expect(txResponses.every((el) => el.success)).toBeTruthy();
  });

  test("it should check Alice's actual veiled balance after rollover", async () => {
    const aliceChunkedVeiledBalance = await aptos.veiledCoin.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    aliceVeiledBalances = aliceChunkedVeiledBalance;

    const aliceVeiledAmount = await VeiledAmount.fromEncrypted(aliceChunkedVeiledBalance.actual, aliceDecryptionKey);

    expect(aliceVeiledAmount.amount).toBeGreaterThanOrEqual(DEPOSIT_AMOUNT);
  });

  const WITHDRAW_AMOUNT = 1n;
  test("it should withdraw Alice's veiled balance", async () => {
    const aliceVeiledAmount = await VeiledAmount.fromEncrypted(aliceVeiledBalances.actual, aliceDecryptionKey);

    const withdrawTx = await aptos.veiledCoin.withdraw({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      decryptionKey: aliceDecryptionKey,
      encryptedActualBalance: aliceVeiledAmount.amountEncrypted!,
      amountToWithdraw: WITHDRAW_AMOUNT,
    });
    const txResp = await sendAndWaitTx(withdrawTx, alice);

    expect(txResp.success).toBeTruthy();
  });

  test("it should check Alice's veiled balance after withdrawal", async () => {
    const aliceChunkedVeiledBalance = await aptos.veiledCoin.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    aliceVeiledBalances = aliceChunkedVeiledBalance;

    const aliceVeiledAmount = await VeiledAmount.fromEncrypted(aliceChunkedVeiledBalance.actual, aliceDecryptionKey);

    expect(aliceVeiledAmount.amount).toBeGreaterThanOrEqual(0n);
  });

  test("it should get global auditor", async () => {
    const [address] = await aptos.veiledCoin.getGlobalAuditor();
    const globalAuditorAddress = address.toString();

    expect(globalAuditorAddress).toBeDefined();
  });

  const TRANSFER_AMOUNT = 2n;
  test("it should transfer Alice's tokens to Alice's pending balance without auditor", async () => {
    const transferTx = await aptos.veiledCoin.transferCoin({
      senderDecryptionKey: aliceDecryptionKey,
      recipientEncryptionKey: aliceDecryptionKey.publicKey(),
      encryptedActualBalance: aliceVeiledBalances.actual,
      amountToTransfer: TRANSFER_AMOUNT,
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      recipientAddress: alice.accountAddress,
    });
    const txResp = await sendAndWaitTx(transferTx, alice);

    expect(txResp.success).toBeTruthy();
  });

  test("it should check Alice's veiled balance after transfer", async () => {
    const aliceChunkedVeiledBalance = await aptos.veiledCoin.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    aliceVeiledBalances = aliceChunkedVeiledBalance;

    const aliceVeiledAmount = await VeiledAmount.fromEncrypted(aliceChunkedVeiledBalance.actual, aliceDecryptionKey);

    expect(aliceVeiledAmount.amount).toBeGreaterThanOrEqual(0n);
  });

  const AUDITOR = TwistedEd25519PrivateKey.generate();
  test("it should transfer Alice's tokens to Alice's veiled balance with auditor", async () => {
    const transferTx = await aptos.veiledCoin.transferCoin({
      senderDecryptionKey: aliceDecryptionKey,
      recipientEncryptionKey: aliceDecryptionKey.publicKey(),
      encryptedActualBalance: aliceVeiledBalances.actual,
      amountToTransfer: TRANSFER_AMOUNT,
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      recipientAddress: alice.accountAddress,
      auditorEncryptionKeys: [AUDITOR.publicKey()],
    });
    const txResp = await sendAndWaitTx(transferTx, alice);

    expect(txResp.success).toBeTruthy();
  });

  test("it should check Alice's veiled balance after transfer with auditors", async () => {
    const aliceChunkedVeiledBalance = await aptos.veiledCoin.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    aliceVeiledBalances = aliceChunkedVeiledBalance;

    const aliceVeiledAmount = await VeiledAmount.fromEncrypted(aliceChunkedVeiledBalance.pending, aliceDecryptionKey);

    expect(aliceVeiledAmount.amount).toBeGreaterThanOrEqual(TRANSFER_AMOUNT);
  });

  test("it should check is Alice's balance not frozen", async () => {
    const isFrozen = await aptos.veiledCoin.isBalanceFrozen({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    expect(isFrozen).toBeFalsy();
  });

  let isAliceBalanceNormalized = true;
  let unnormalizedAliceEncryptedBalance: TwistedElGamalCiphertext[];
  test("it should check Alice's veiled balance is normalized", async () => {
    isAliceBalanceNormalized = await aptos.veiledCoin.isUserBalanceNormalized({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    if (!isAliceBalanceNormalized) {
      const unnormalizedAliceBalances = await aptos.veiledCoin.getBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,
      });

      unnormalizedAliceEncryptedBalance = unnormalizedAliceBalances.pending;
    }

    expect(isAliceBalanceNormalized).toBeTruthy();
  });

  test("it should normalize Alice's veiled balance", async () => {
    if (unnormalizedAliceEncryptedBalance && !isAliceBalanceNormalized) {
      const unnormalizedVeiledAmount = await VeiledAmount.fromEncrypted(
        unnormalizedAliceEncryptedBalance,
        aliceDecryptionKey,
        {
          chunksCount: 2,
        },
      );

      const normalizeTx = await aptos.veiledCoin.normalizeUserBalance({
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceDecryptionKey,
        unnormilizedEncryptedBalance: unnormalizedAliceEncryptedBalance,
        balanceAmount: unnormalizedVeiledAmount.amount,

        sender: alice.accountAddress,
      });

      expect(normalizeTx).toBeDefined();
    } else {
      expect(true).toBeTruthy();
    }
  });

  test("it should check Alice's veiled balance after normalization", async () => {
    const aliceChunkedVeiledBalance = await aptos.veiledCoin.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    aliceVeiledBalances = aliceChunkedVeiledBalance;

    const aliceVeiledAmount = await VeiledAmount.fromEncrypted(aliceChunkedVeiledBalance.pending, aliceDecryptionKey);

    expect(aliceVeiledAmount.amount).toBeDefined();
  });

  const ALICE_NEW_VEILED_PRIVATE_KEY = TwistedEd25519PrivateKey.generate();
  test("it should safely rotate Alice's veiled balance key", async () => {
    const keyRotationAndUnfreezeTxs = await aptos.veiledCoin.safeRotateVBKey({
      sender: alice.accountAddress,

      currDecryptionKey: aliceDecryptionKey,
      newDecryptionKey: ALICE_NEW_VEILED_PRIVATE_KEY,

      currEncryptedBalance: aliceVeiledBalances.actual,

      withUnfreezeBalance: true,
      tokenAddress: TOKEN_ADDRESS,
    });

    const txResponses = await sendAndWaitBatchTxs(keyRotationAndUnfreezeTxs, alice);

    /* eslint-disable no-console */
    console.log("\n\n\n");
    console.log("SAVE NEW ALICE'S VEILED PRIVATE KEY");
    console.log(ALICE_NEW_VEILED_PRIVATE_KEY.toString());
    console.log("\n\n\n");
    /* eslint-enable */

    expect(txResponses.every((el) => el.success)).toBeTruthy();
  });

  test("it should get new Alice's veiled balance", async () => {
    const aliceChunkedVeiledBalance = await aptos.veiledCoin.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    aliceVeiledBalances = aliceChunkedVeiledBalance;

    const aliceActualVeiledAmount = await VeiledAmount.fromEncrypted(
      aliceChunkedVeiledBalance.actual,
      ALICE_NEW_VEILED_PRIVATE_KEY,
    );

    expect(aliceActualVeiledAmount.amount).toBeGreaterThanOrEqual(0n);
  });
});
