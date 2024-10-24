/* eslint-disable no-console */

/**
 * This example shows how to use the Aptos client to create veiled balance and work with them
 */

import {
  Account,
  AccountAddress,
  AnyRawTransaction,
  Aptos,
  AptosConfig,
  CommittedTransactionResponse,
  Network,
  NetworkToNetworkName,
  TwistedEd25519PrivateKey,
  TwistedElGamal,
} from "@aptos-labs/ts-sdk";

const APTOS_NETWORK: Network = NetworkToNetworkName[Network.TESTNET];
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

const TOKEN_ADDRESS = "0xff3c50e388b56539542915c6e5b6140d29e35d4fe1c23afda4698dd648bb315b";
const MODULE_ADDRESS = "0xd2fadc8e5abc1a0d2914795b1be91870fded881148d078033716da3f21918fd7";
const TOKENS_TO_MINT = 500_000;

const INITIAL_APTOS_BALANCE = 100_000_000;

const balance = async (name: string, accountAddress: AccountAddress): Promise<number> => {
  const amount = await aptos.getAccountAPTAmount({
    accountAddress,
  });
  console.log(`${name}'s aptos balance is: ${amount}`);
  return amount;
};

const coinBalance = async (name: string, accountAddress: AccountAddress) => {
  const amount = await aptos.view({
    payload: {
      function: "0x1::primary_fungible_store::balance",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: [accountAddress, TOKEN_ADDRESS],
    },
  });
  console.log(`${name}'s coin balance is: ${amount[0]}`);

  return amount[0];
};

const sendAndWaitTx = async (
  transaction: AnyRawTransaction,
  signer: Account,
): Promise<CommittedTransactionResponse> => {
  const pendingTxn = await aptos.signAndSubmitTransaction({ signer, transaction });
  return aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
};

const getVeiledBalances = async (
  name: string,
  accountAddress: AccountAddress,
  privateKey: TwistedEd25519PrivateKey,
) => {
  const encBalances = await aptos.veiledBalance.getBalance({ accountAddress, tokenAddress: TOKEN_ADDRESS });
  const decdPendingBal = TwistedElGamal.decryptWithPK(encBalances.pending, privateKey, { start: 0n, end: 100n });
  const decdActualBal = TwistedElGamal.decryptWithPK(encBalances.actual, privateKey, { start: 0n, end: 100n });

  console.log(`${name}'s decrypted actual veiled balance: ${decdActualBal}`);
  console.log(`${name}'s decrypted pending veiled balance: ${decdPendingBal}`);

  return {
    encBalances,
    decdPendingBal,
    decdActualBal,
  };
};

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

async function example() {
  const alice = Account.generate();
  const bob = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);
  console.log(`Bob's address is: ${bob.accountAddress}`);

  const aliceVeiledPrivateKey = TwistedEd25519PrivateKey.generate();
  const bobVeiledPrivateKey = TwistedEd25519PrivateKey.generate();

  console.log("\n=== Twisted Ed25519 key pair Alice ===\n");
  console.log(`Private key: ${aliceVeiledPrivateKey.toString()}`);
  console.log(`Public key: ${aliceVeiledPrivateKey.publicKey().toString()}\n\n`);

  console.log("\n=== Twisted Ed25519 key pair Bob ===\n");
  console.log(`Private key: ${bobVeiledPrivateKey.toString()}`);
  console.log(`Public key: ${bobVeiledPrivateKey.publicKey().toString()}\n\n`);

  // Fund alice account
  await Promise.all([
    aptos.fundAccount({
      accountAddress: alice.accountAddress,
      amount: INITIAL_APTOS_BALANCE,
    }),
    aptos.fundAccount({
      accountAddress: bob.accountAddress,
      amount: INITIAL_APTOS_BALANCE,
    }),
  ]);

  const [aliceBalance, bobBalance] = await Promise.all([
    balance("Alice", alice.accountAddress),
    balance("Bob", bob.accountAddress),
  ]);

  if (aliceBalance !== INITIAL_APTOS_BALANCE) throw new Error("Alice's aptos balance is incorrect");
  if (bobBalance !== INITIAL_APTOS_BALANCE) throw new Error("Bob's aptos balance is incorrect");

  console.log("\n=== Register veiled balances for Alice and Bob ===\n");
  const [aliceRegisterVBTx, bobRegisterVBTx] = await Promise.all([
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

  await Promise.all([sendAndWaitTx(aliceRegisterVBTx, alice), sendAndWaitTx(bobRegisterVBTx, bob)]);

  await Promise.all([
    getVeiledBalances("Alice", alice.accountAddress, aliceVeiledPrivateKey),
    getVeiledBalances("Bob", bob.accountAddress, bobVeiledPrivateKey),
  ]);

  console.log("\n=== Mint fungible tokens to Alice's account ===\n");
  await mintFungibleTokens(alice);
  await coinBalance("Alice", alice.accountAddress);

  console.log("\n=== Deposit fungible tokens to Alice's veiled balance ===\n");
  const depositTx = await aptos.veiledBalance.deposit({
    sender: alice.accountAddress,
    tokenAddress: TOKEN_ADDRESS,
    amount: 7n,
  });
  await sendAndWaitTx(depositTx, alice);
  await coinBalance("Alice", alice.accountAddress);

  let aliceVeiledBalance = await getVeiledBalances("Alice", alice.accountAddress, aliceVeiledPrivateKey);

  console.log("\n=== Rollover Alice's pending balance ===\n");
  const rolloverTx = await aptos.veiledBalance.rolloverPendingBalance({
    sender: alice.accountAddress,
    tokenAddress: TOKEN_ADDRESS,
  });

  await sendAndWaitTx(rolloverTx, alice);
  aliceVeiledBalance = await getVeiledBalances("Alice", alice.accountAddress, aliceVeiledPrivateKey);

  console.log("\n=== Withdraw tokens from Alice's veiled balance ===\n");
  const withdrawTx = await aptos.veiledBalance.withdraw({
    sender: alice.accountAddress,
    tokenAddress: TOKEN_ADDRESS,
    privateKey: aliceVeiledPrivateKey,
    encryptedBalance: aliceVeiledBalance.encBalances.actual,
    amount: 2n,
    changedBalance: aliceVeiledBalance.decdActualBal - 2n,
  });
  await sendAndWaitTx(withdrawTx, alice);
  await coinBalance("Alice", alice.accountAddress);

  aliceVeiledBalance = await getVeiledBalances("Alice", alice.accountAddress, aliceVeiledPrivateKey);

  const auditorVBPrivateKey = TwistedEd25519PrivateKey.generate();

  console.log("\n=== Twisted Ed25519 key pair Alice ===\n");
  console.log(`Private key: ${aliceVeiledPrivateKey.toString()}`);
  console.log(`Public key: ${aliceVeiledPrivateKey.publicKey().toString()}\n\n`);

  console.log("\n=== Transfer tokens from Alice's veiled balance to Bob's veiled balance ===\n");
  const transferTx = await aptos.veiledBalance.transferCoin({
    recipient: bob.accountAddress,
    senderPrivateKey: aliceVeiledPrivateKey,
    recipientPublicKey: bobVeiledPrivateKey.publicKey(),
    encryptedSenderBalance: aliceVeiledBalance.encBalances.actual,
    amount: 2n,
    changedSenderBalance: aliceVeiledBalance.decdActualBal - 2n,
    sender: alice.accountAddress,
    tokenAddress: TOKEN_ADDRESS,
    auditorPublicKeys: [auditorVBPrivateKey.publicKey()],
  });
  await sendAndWaitTx(transferTx, alice);

  aliceVeiledBalance = await getVeiledBalances("Alice", alice.accountAddress, aliceVeiledPrivateKey);
  getVeiledBalances("Bob", bob.accountAddress, bobVeiledPrivateKey);

  console.log("\n=== Rollover Alice's pending balance and freeze veiled balance ===\n");
  const rolloverWithFreezeTx = await aptos.veiledBalance.rolloverPendingBalance({
    sender: alice.accountAddress,
    withFreezeBalance: true,
    tokenAddress: TOKEN_ADDRESS,
  });
  await sendAndWaitTx(rolloverWithFreezeTx, alice);

  const aliceNewVeiledPrivateKey = TwistedEd25519PrivateKey.generate();

  console.log("\n=== New Twisted Ed25519 key pair Alice ===\n");
  console.log(`Private key: ${aliceNewVeiledPrivateKey.toString()}`);
  console.log(`Public key: ${aliceNewVeiledPrivateKey.publicKey().toString()}\n\n`);

  const keyRotationAndUnfreezeTx = await aptos.veiledBalance.keyRotation({
    oldPrivateKey: aliceVeiledPrivateKey,
    newPrivateKey: aliceNewVeiledPrivateKey,
    balance: aliceVeiledBalance.decdActualBal,
    oldEncryptedBalance: aliceVeiledBalance.encBalances.actual,
    sender: alice.accountAddress,
    withUnfreezeBalance: true,
    tokenAddress: TOKEN_ADDRESS,
  });
  await sendAndWaitTx(keyRotationAndUnfreezeTx, alice);

  aliceVeiledBalance = await getVeiledBalances("Alice", alice.accountAddress, aliceNewVeiledPrivateKey);
}

example();
