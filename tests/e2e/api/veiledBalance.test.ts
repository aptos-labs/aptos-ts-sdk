// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AptosConfig,
  Aptos,
  Network,
  Account,
  NetworkToNetworkName,
  AccountAddress,
  TwistedEd25519PrivateKey,
  AnyRawTransaction,
  CommittedTransactionResponse,
  TwistedElGamal,
  TwistedElGamalCiphertext,
  chunksToAmount,
} from "../../../src";
import { longTestTimeout } from "../../unit/helper";

describe("staking api", () => {
  const APTOS_NETWORK: Network = NetworkToNetworkName[Network.TESTNET];
  const config = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(config);

  /**
   * Address of the mocked fungible token on the testnet
   */
  const TOKEN_ADDRESS = "0xff3c50e388b56539542915c6e5b6140d29e35d4fe1c23afda4698dd648bb315b";
  /**
   * Address of the module for minting mocked fungible tokens on the testnet
   */
  const MODULE_ADDRESS = "0xd2fadc8e5abc1a0d2914795b1be91870fded881148d078033716da3f21918fd7::mock_token";
  const TOKENS_TO_MINT = 500_000;

  const INITIAL_APTOS_BALANCE = 100_000_000;

  const mintFungibleTokens = async (account: Account) => {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::mint_to`,
        functionArguments: [TOKENS_TO_MINT],
      },
    });
    const pendingTxn = await aptos.signAndSubmitTransaction({ signer: account, transaction });
    return aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
  };

  const balanceOf = async (accountAddress: AccountAddress) => {
    const amount = await aptos.view({
      payload: {
        function: "0x1::primary_fungible_store::balance",
        typeArguments: ["0x1::fungible_asset::Metadata"],
        functionArguments: [accountAddress, TOKEN_ADDRESS],
      },
    });

    return amount[0];
  };

  const sendAndWaitTx = async (
    transaction: AnyRawTransaction,
    signer: Account,
  ): Promise<CommittedTransactionResponse> => {
    const pendingTxn = await aptos.signAndSubmitTransaction({ signer, transaction });
    return aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
  };

  let alice: Account;
  let bob: Account;

  test(
    "it should create Alice & Bob aptos accounts",
    async () => {
      alice = Account.generate();
      bob = Account.generate();

      expect(alice.accountAddress).toBeDefined();
      expect(bob.accountAddress).toBeDefined();
    },
    longTestTimeout,
  );

  test(
    "it should fund Alice & Bob aptos accounts balances",
    async () => {
      const [aliceResponse, bobResponse] = await Promise.all([
        aptos.fundAccount({
          accountAddress: alice.accountAddress,
          amount: INITIAL_APTOS_BALANCE,
        }),
        aptos.fundAccount({
          accountAddress: bob.accountAddress,
          amount: INITIAL_APTOS_BALANCE,
        }),
      ]);

      expect(aliceResponse.success).toBeTruthy();
      expect(bobResponse.success).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "it should ensure Alice & Bob aptos accounts balances are correct",
    async () => {
      const [aliceBalance, bobBalance] = await Promise.all([
        aptos.getAccountAPTAmount({
          accountAddress: alice.accountAddress,
        }),
        aptos.getAccountAPTAmount({
          accountAddress: bob.accountAddress,
        }),
      ]);

      expect(aliceBalance).toBeGreaterThanOrEqual(INITIAL_APTOS_BALANCE);
      expect(bobBalance).toBeGreaterThanOrEqual(INITIAL_APTOS_BALANCE);
    },
    longTestTimeout,
  );

  let aliceVeiledPrivateKey: TwistedEd25519PrivateKey;
  let bobVeiledPrivateKey: TwistedEd25519PrivateKey;
  test("it should create Alice & Bob veiled balances", async () => {
    aliceVeiledPrivateKey = TwistedEd25519PrivateKey.generate();
    bobVeiledPrivateKey = TwistedEd25519PrivateKey.generate();

    expect(aliceVeiledPrivateKey.toString()).toBeDefined();
    expect(bobVeiledPrivateKey.toString()).toBeDefined();
  });

  test(
    "it should register Alice & Bob veiled balances",
    async () => {
      const [aliceRegisterVBTxBody, bobRegisterVBTxBody] = await Promise.all([
        aptos.veiledBalance.registerBalance({
          sender: alice.accountAddress,
          tokenAddress: TOKEN_ADDRESS,
          publicKey: aliceVeiledPrivateKey.publicKey(),
        }),
        aptos.veiledBalance.registerBalance({
          sender: bob.accountAddress,
          tokenAddress: TOKEN_ADDRESS,
          publicKey: bobVeiledPrivateKey.publicKey(),
        }),
      ]);

      const [aliceTxResp, bobTxResp] = await Promise.all([
        sendAndWaitTx(aliceRegisterVBTxBody, alice),
        sendAndWaitTx(bobRegisterVBTxBody, bob),
      ]);

      expect(aliceTxResp.success).toBeTruthy();
      expect(bobTxResp.success).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "it should check Alice & Bob veiled balances",
    async () => {
      const [aliceVB, bobVB] = await Promise.all([
        aptos.veiledBalance.getBalance({ accountAddress: alice.accountAddress, tokenAddress: TOKEN_ADDRESS }),
        aptos.veiledBalance.getBalance({ accountAddress: bob.accountAddress, tokenAddress: TOKEN_ADDRESS }),
      ]);

      expect(aliceVB).toBeDefined();
      expect(bobVB).toBeDefined();
    },
    longTestTimeout,
  );

  let chunkedAliceVb: {
    pending: TwistedElGamalCiphertext[];
    actual: TwistedElGamalCiphertext[];
  };
  let chunkedBobVb: {
    pending: TwistedElGamalCiphertext[];
    actual: TwistedElGamalCiphertext[];
  };
  test(
    "it should check Alice & Bob veiled balances",
    async () => {
      const [aliceVB, bobVB] = await Promise.all([
        aptos.veiledBalance.getBalance({ accountAddress: alice.accountAddress, tokenAddress: TOKEN_ADDRESS }),
        aptos.veiledBalance.getBalance({ accountAddress: bob.accountAddress, tokenAddress: TOKEN_ADDRESS }),
      ]);
      chunkedAliceVb = aliceVB;
      chunkedBobVb = bobVB;

      expect(chunkedAliceVb.pending.length).toBeDefined();
      expect(chunkedAliceVb.actual.length).toBeDefined();
      expect(chunkedBobVb.pending.length).toBeDefined();
      expect(chunkedBobVb.actual.length).toBeDefined();
    },
    longTestTimeout,
  );

  test("it should decrypt Alice & Bob veiled balances", async () => {
    const [
      aliceDecryptedPendingBalance,
      aliceDecryptedActualBalance,
      bobDecryptedPendingBalance,
      bobDecryptedActualBalance,
    ] = await Promise.all([
      chunksToAmount(
        chunkedAliceVb.pending.map((el) =>
          TwistedElGamal.decryptWithPK(el, aliceVeiledPrivateKey, {
            // FIXME: mocked, should be removed, once algo is ready
            start: 0n,
            end: 1000n,
          }),
        ),
      ),
      chunksToAmount(
        chunkedAliceVb.actual.map((el) =>
          TwistedElGamal.decryptWithPK(el, aliceVeiledPrivateKey, {
            // FIXME: mocked, should be removed, once algo is ready
            start: 0n,
            end: 1000n,
          }),
        ),
      ),
      chunksToAmount(
        chunkedBobVb.pending.map((el) =>
          TwistedElGamal.decryptWithPK(el, bobVeiledPrivateKey, {
            // FIXME: mocked, should be removed, once algo is ready
            start: 0n,
            end: 1000n,
          }),
        ),
      ),
      chunksToAmount(
        chunkedBobVb.actual.map((el) =>
          TwistedElGamal.decryptWithPK(el, bobVeiledPrivateKey, {
            // FIXME: mocked, should be removed, once algo is ready
            start: 0n,
            end: 1000n,
          }),
        ),
      ),
    ]);

    expect(aliceDecryptedPendingBalance).toBeDefined();
    expect(aliceDecryptedActualBalance).toBeDefined();
    expect(bobDecryptedPendingBalance).toBeDefined();
    expect(bobDecryptedActualBalance).toBeDefined();
  });

  test("it should mint fungible tokens to Alice's account", async () => {
    const resp = await mintFungibleTokens(alice);

    expect(resp.success).toBeTruthy();
  });

  test("it should check Alice's balance of fungible token is not empty", async () => {
    // TODO: moveValue to number
    const balance = await balanceOf(alice.accountAddress);

    expect(balance).toBeGreaterThan(0);
  });

  const DEPOSIT_AMOUNT = 7n;
  test("it should deposit Alice's balance of fungible token to her veiled balance", async () => {
    const depositTx = await aptos.veiledBalance.deposit({
      sender: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
      amount: DEPOSIT_AMOUNT,
    });
    const resp = await sendAndWaitTx(depositTx, alice);

    expect(resp.success).toBeTruthy();
  });

  test("it should decrypt Alice's veiled balance after deposit", async () => {
    const aliceChunkedVeiledBalance = await aptos.veiledBalance.getBalance({
      accountAddress: alice.accountAddress,
      tokenAddress: TOKEN_ADDRESS,
    });

    const decryptedPendingBalance = chunksToAmount(
      aliceChunkedVeiledBalance.pending.map((el) =>
        TwistedElGamal.decryptWithPK(el, aliceVeiledPrivateKey, {
          start: 0n,
          end: 1000n,
        }),
      ),
    );

    expect(decryptedPendingBalance).toBeGreaterThanOrEqual(DEPOSIT_AMOUNT);
  });

  test("it should rollover Alice's veiled balance", async () => {});
});
