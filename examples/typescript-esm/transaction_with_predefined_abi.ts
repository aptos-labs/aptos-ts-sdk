/* eslint-disable no-console */

/**
 * This example shows how to use the Aptos client to create accounts, fund them, and transfer between them.
 */

import {
  Account,
  AccountAddress,
  Aptos,
  APTOS_COIN,
  AptosConfig,
  EntryFunctionABI,
  Network,
  NetworkToNetworkName,
  parseTypeTag,
  SimpleTransaction,
  TypeTagAddress,
  TypeTagU64,
  U64,
} from "@aptos-labs/ts-sdk";

const APTOS_COIN_TYPE = parseTypeTag(APTOS_COIN);
const COIN_STORE = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 100;

// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.DEVNET;

/**
 * Prints the balance of an account
 * @param aptos
 * @param name
 * @param address
 * @returns {Promise<*>}
 *
 */
const balance = async (aptos: Aptos, name: string, address: AccountAddress) => {
  type Coin = { coin: { value: string } };
  const resource = await aptos.getAccountResource<Coin>({
    accountAddress: address,
    resourceType: COIN_STORE,
  });
  const amount = Number(resource.coin.value);

  console.log(`${name}'s balance is: ${amount}`);
  return amount;
};

async function timeSubmission(
  aptos: Aptos,
  signer: Account,
  buildTxn: () => Promise<SimpleTransaction>,
): Promise<void> {
  const start = performance.now();
  const rawTxn = await buildTxn();
  const buildTime = performance.now();
  const senderAuthenticator = await aptos.sign({ signer, transaction: rawTxn });
  const signTime = performance.now();
  const submittedTxn = await aptos.transaction.submit.simple({ transaction: rawTxn, senderAuthenticator });
  const submitTime = performance.now();
  await aptos.waitForTransaction({ transactionHash: submittedTxn.hash });
  const endTime = performance.now();
  const builtLatency = buildTime - start;
  const signLatency = signTime - buildTime;
  const submitLatency = submitTime - signTime;
  const e2eLatency = endTime - start;

  console.log(
    `Time for building: ${builtLatency}ms | signing ${signLatency}ms submission: ${submitLatency}ms | total E2E: ${e2eLatency}ms`,
  );
}

const example = async () => {
  console.log("This example will show you how to increase performance of known entry functions");

  // Setup the client
  const config = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(config);

  // Create two accounts
  const alice = Account.generate();
  const bob = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);
  console.log(`Bob's address is: ${bob.accountAddress}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  await aptos.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
  });

  await aptos.fundAccount({
    accountAddress: bob.accountAddress,
    amount: BOB_INITIAL_BALANCE,
  });

  // Show the balances
  console.log("\n=== Balances ===\n");
  const aliceBalance = await balance(aptos, "Alice", alice.accountAddress);
  const bobBalance = await balance(aptos, "Bob", bob.accountAddress);

  if (aliceBalance !== ALICE_INITIAL_BALANCE) throw new Error("Alice's balance is incorrect");
  if (bobBalance !== BOB_INITIAL_BALANCE) throw new Error("Bob's balance is incorrect");

  // At this point, we'll time transfers with and without ABI, and with or without BCS encoded
  const transferAbi: EntryFunctionABI = {
    typeParameters: [{ constraints: [] }],
    parameters: [new TypeTagAddress(), new TypeTagU64()],
  };
  // Transfer between users

  console.log("\n=== Remote ABI, normal inputs ===\n");
  const aliceAddressString = alice.accountAddress.toString();
  const bobAddressString = alice.accountAddress.toString();
  await timeSubmission(aptos, alice, async () =>
    aptos.transaction.build.simple({
      sender: aliceAddressString,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [APTOS_COIN_TYPE],
        functionArguments: [bobAddressString, TRANSFER_AMOUNT],
      },
    }),
  );

  console.log("\n=== Remote ABI, BCS inputs ===\n");
  await timeSubmission(aptos, alice, async () =>
    aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [APTOS_COIN_TYPE],
        functionArguments: [bob.accountAddress, new U64(TRANSFER_AMOUNT)],
      },
    }),
  );

  console.log("\n=== Local ABI, normal inputs ===\n");
  await timeSubmission(aptos, alice, async () =>
    aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [APTOS_COIN_TYPE],
        functionArguments: [bobAddressString, TRANSFER_AMOUNT],
        abi: transferAbi,
      },
    }),
  );

  console.log("\n=== Local ABI, BCS inputs ===\n");
  await timeSubmission(aptos, alice, async () =>
    aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [APTOS_COIN_TYPE],
        functionArguments: [bob.accountAddress, new U64(TRANSFER_AMOUNT)],
        abi: transferAbi,
      },
    }),
  );

  console.log("\n=== Local ABI, BCS inputs, sequence number already cached ===\n");
  const accountData = await aptos.account.getAccountInfo({ accountAddress: alice.accountAddress });
  const sequenceNumber = BigInt(accountData.sequence_number);
  await timeSubmission(aptos, alice, async () =>
    aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [APTOS_COIN_TYPE],
        functionArguments: [bob.accountAddress, new U64(TRANSFER_AMOUNT)],
        abi: transferAbi,
      },
      options: {
        accountSequenceNumber: sequenceNumber,
      },
    }),
  );

  console.log("\n=== Local ABI, BCS inputs, sequence number and gas already cached ===\n");
  await timeSubmission(aptos, alice, async () =>
    aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [APTOS_COIN_TYPE],
        functionArguments: [bob.accountAddress, new U64(TRANSFER_AMOUNT)],
        abi: transferAbi,
      },
      options: {
        accountSequenceNumber: sequenceNumber + 1n,
        gasUnitPrice: 100,
        maxGasAmount: 1000,
      },
    }),
  );
};

example();
