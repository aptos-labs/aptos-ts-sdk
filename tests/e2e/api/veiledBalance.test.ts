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
} from "../../../src";
import { VeiledAmount } from "../../../src/core/crypto/veiled/veiledAmount";
import { longTestTimeout } from "../../unit/helper";

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

  const INITIAL_APTOS_BALANCE = 0.5 * 10 ** 8;

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

  let alice: Account;

  test(
    "it should create Alice",
    async () => {
      alice = Account.fromPrivateKey({
        privateKey: new Ed25519PrivateKey(TESTNET_PK!),
      });

      expect(alice.accountAddress).toBeDefined();
    },
    longTestTimeout,
  );

  test(
    "it should fund Alice aptos accounts balances",
    async () => {
      const [aliceResponse] = await Promise.all([
        aptos.fundAccount({
          accountAddress: alice.accountAddress,
          amount: INITIAL_APTOS_BALANCE,
        }),
      ]);

      expect(aliceResponse.success).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "it should ensure Alice aptos account balance are correct",
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

  let aliceVeiledPrivateKey: TwistedEd25519PrivateKey;
  test("it should create Alice veiled balances", async () => {
    aliceVeiledPrivateKey = new TwistedEd25519PrivateKey(
      // TODO: remove
      TESTNET_DK!,
    );

    expect(aliceVeiledPrivateKey.toString()).toBeDefined();
  });

  test(
    "it should register Alice veiled balance",
    async () => {
      const [aliceRegisterVBTxBody] = await Promise.all([
        aptos.veiledBalance.registerBalance({
          sender: alice.accountAddress,
          tokenAddress: TOKEN_ADDRESS,
          publicKey: aliceVeiledPrivateKey.publicKey(),
        }),
      ]);

      const [aliceTxResp] = await Promise.all([sendAndWaitTx(aliceRegisterVBTxBody, alice)]);

      expect(aliceTxResp.success).toBeTruthy();
    },
    longTestTimeout,
  );

  test("it should check Alice veiled balance registered", async () => {
    const isRegistered = await aptos.veiledBalance.hasUserRegistered({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    expect(isRegistered).toBeTruthy();
  });

  let chunkedAliceVb: {
    pending: TwistedElGamalCiphertext[];
    actual: TwistedElGamalCiphertext[];
  };
  test(
    "it should check Alice veiled balances",
    async () => {
      const [aliceVB] = await Promise.all([
        aptos.veiledBalance.getBalance({ accountAddress: alice.accountAddress, tokenAddress: TOKEN_ADDRESS }),
      ]);
      chunkedAliceVb = aliceVB;

      expect(chunkedAliceVb.pending.length).toBeDefined();
      expect(chunkedAliceVb.actual.length).toBeDefined();
    },
    longTestTimeout,
  );

  test("it should decrypt Alice  veiled balances", async () => {
    const [aliceDecryptedPendingBalance, aliceDecryptedActualBalance] = await Promise.all([
      (await VeiledAmount.fromEncrypted(chunkedAliceVb.pending, aliceVeiledPrivateKey, { chunksCount: 2 })).amount,
      (await VeiledAmount.fromEncrypted(chunkedAliceVb.actual, aliceVeiledPrivateKey)).amount,
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
    const depositTx = await aptos.veiledBalance.deposit({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      amount: DEPOSIT_AMOUNT,
    });
    const resp = await sendAndWaitTx(depositTx, alice);

    expect(resp.success).toBeTruthy();
  });

  test("it should fetch and decrypt Alice's veiled balance after deposit", async () => {
    const aliceChunkedVeiledBalance = await aptos.veiledBalance.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    chunkedAliceVb = aliceChunkedVeiledBalance;

    const aliceVeiledAmount = await VeiledAmount.fromEncrypted(
      aliceChunkedVeiledBalance.pending,
      aliceVeiledPrivateKey,
    );

    expect(aliceVeiledAmount.amount).toBeGreaterThanOrEqual(DEPOSIT_AMOUNT);
  });

  test("it should safely rollover Alice's veiled balance", async () => {
    const aliceBalances = await aptos.veiledBalance.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    const unnormalizedVeiledAmount = await VeiledAmount.fromEncrypted(aliceBalances.actual, aliceVeiledPrivateKey);

    const rolloverTxBody = await aptos.veiledBalance.safeRolloverPendingVeiledBalanceTransaction({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      withFreezeBalance: false,

      privateKey: aliceVeiledPrivateKey,
      unnormilizedEncryptedBalance: unnormalizedVeiledAmount.encryptedAmount!,
      balanceAmount: unnormalizedVeiledAmount.amount,
    });

    const txResponses: CommittedTransactionResponse[] = [];
    for (const tx of rolloverTxBody) {
      // eslint-disable-next-line no-await-in-loop
      const txResp = await sendAndWaitTx(tx, alice);

      txResponses.push(txResp);
    }

    expect(txResponses.every((el) => el.success)).toBeTruthy();
  });

  test("it should check Alice's actual veiled balance after rollover", async () => {
    const aliceChunkedVeiledBalance = await aptos.veiledBalance.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    chunkedAliceVb = aliceChunkedVeiledBalance;

    const aliceVeiledAmount = await VeiledAmount.fromEncrypted(aliceChunkedVeiledBalance.actual, aliceVeiledPrivateKey);

    expect(aliceVeiledAmount.amount).toBeGreaterThanOrEqual(DEPOSIT_AMOUNT);
  });

  const WITHDRAW_AMOUNT = 1n;
  test("it should withdraw Alice's veiled balance", async () => {
    const aliceVeiledAmount = await VeiledAmount.fromEncrypted(chunkedAliceVb.actual, aliceVeiledPrivateKey);

    const withdrawTx = await aptos.veiledBalance.withdraw({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      privateKey: aliceVeiledPrivateKey,
      encryptedBalance: aliceVeiledAmount.encryptedAmount!,
      amount: WITHDRAW_AMOUNT,
    });
    const txResp = await sendAndWaitTx(withdrawTx, alice);

    expect(txResp.success).toBeTruthy();
  });

  test("it should get global auditor", async () => {
    const [address] = await aptos.veiledBalance.getGlobalAuditor();
    const globalAuditorAddress = address.toString();

    expect(globalAuditorAddress).toBeDefined();
  });

  const TRANSFER_AMOUNT = 2n;
  test("it should transfer Alice's tokens to Alice's pending balance without auditor", async () => {
    const transferTx = await aptos.veiledBalance.transferCoin({
      senderPrivateKey: aliceVeiledPrivateKey,
      recipientPublicKey: aliceVeiledPrivateKey.publicKey(),
      encryptedBalance: chunkedAliceVb.actual,
      amount: TRANSFER_AMOUNT,
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      recipient: alice.accountAddress,
    });
    const txResp = await sendAndWaitTx(transferTx, alice);

    expect(txResp.success).toBeTruthy();
  });

  const AUDITOR = TwistedEd25519PrivateKey.generate();
  test("it should transfer Alice's tokens to Alice's veiled balance with auditor", async () => {
    const transferTx = await aptos.veiledBalance.transferCoin({
      senderPrivateKey: aliceVeiledPrivateKey,
      recipientPublicKey: aliceVeiledPrivateKey.publicKey(),
      encryptedBalance: chunkedAliceVb.actual,
      amount: TRANSFER_AMOUNT,
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      recipient: alice.accountAddress,
      auditorPublicKeys: [AUDITOR.publicKey()],
    });
    const txResp = await sendAndWaitTx(transferTx, alice);

    expect(txResp.success).toBeTruthy();
  });

  test("it should check Alice's veiled balance after transfer", async () => {
    const aliceChunkedVeiledBalance = await aptos.veiledBalance.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    chunkedAliceVb = aliceChunkedVeiledBalance;

    const aliceVeiledAmount = await VeiledAmount.fromEncrypted(
      aliceChunkedVeiledBalance.pending,
      aliceVeiledPrivateKey,
    );

    expect(aliceVeiledAmount.amount).toBeGreaterThanOrEqual(TRANSFER_AMOUNT);
  });

  test("it should check is Alice's balance not frozen", async () => {
    const isFrozen = await aptos.veiledBalance.isBalanceFrozen({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    expect(isFrozen).toBeFalsy();
  });

  let isAliceBalanceNormalized = true;
  let unnormalizedAliceEncryptedBalance: TwistedElGamalCiphertext[];
  test("it should check Alice's veiled balance is normalized", async () => {
    isAliceBalanceNormalized = await aptos.veiledBalance.isUserBalanceNormalized({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    if (!isAliceBalanceNormalized) {
      const unnormalizedAliceBalances = await aptos.veiledBalance.getBalance({
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
        aliceVeiledPrivateKey,
        {
          chunksCount: 2,
        },
      );

      const normalizeTx = await aptos.veiledBalance.normalizeUserBalance({
        accountAddress: alice.accountAddress,
        tokenAddress: TOKEN_ADDRESS,

        privateKey: aliceVeiledPrivateKey,
        unnormilizedEncryptedBalance: unnormalizedAliceEncryptedBalance,
        balanceAmount: unnormalizedVeiledAmount.amount,

        sender: alice.accountAddress,
      });

      expect(normalizeTx).toBeDefined();
    } else {
      expect(true).toBeTruthy();
    }
  });

  const ALICE_NEW_VEILED_PRIVATE_KEY = TwistedEd25519PrivateKey.generate();
  test("it should safely rotate Alice's veiled balance key", async () => {
    const aliceActualVeiledAmount = await VeiledAmount.fromEncrypted(chunkedAliceVb.actual, aliceVeiledPrivateKey);

    const keyRotationAndUnfreezeTxs = await aptos.veiledBalance.safeRotateVBKey({
      sender: alice.accountAddress,

      oldPrivateKey: aliceVeiledPrivateKey,
      newPrivateKey: ALICE_NEW_VEILED_PRIVATE_KEY,

      balance: aliceActualVeiledAmount.amount,
      oldEncryptedBalance: chunkedAliceVb.actual,

      withUnfreezeBalance: true,
      tokenAddress: TOKEN_ADDRESS,
    });

    const txResponces: CommittedTransactionResponse[] = [];
    for (const tx of keyRotationAndUnfreezeTxs) {
      // eslint-disable-next-line no-await-in-loop
      const txResp = await sendAndWaitTx(tx, alice);
      txResponces.push(txResp);
    }

    /* eslint-disable no-console */
    console.log("\n\n\n");
    console.log("SAVE NEW ALICE'S VEILED PRIVATE KEY");
    console.log(ALICE_NEW_VEILED_PRIVATE_KEY.toString());
    console.log("\n\n\n");
    /* eslint-enable */

    expect(txResponces.every((el) => el.success)).toBeTruthy();
  });

  test("it should get new Alice's veiled balance", async () => {
    const aliceChunkedVeiledBalance = await aptos.veiledBalance.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });
    chunkedAliceVb = aliceChunkedVeiledBalance;

    const aliceActualVeiledAmount = await VeiledAmount.fromEncrypted(
      aliceChunkedVeiledBalance.actual,
      ALICE_NEW_VEILED_PRIVATE_KEY,
    );

    expect(aliceActualVeiledAmount.amount).toBeGreaterThanOrEqual(0n);
  });
});
