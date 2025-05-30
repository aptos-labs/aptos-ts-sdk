/* eslint-disable no-console */

/**
 * This example shows how to use the Cedra client to create accounts, fund them, and transfer between them.
 */
import dotenv from "dotenv";
dotenv.config();
import {
  Account,
  AccountAddress,
  Cedra,
  CEDRA_COIN,
  CedraConfig,
  EntryFunctionABI,
  InputViewFunctionJsonData,
  Network,
  NetworkToNetworkName,
  parseTypeTag,
  SimpleTransaction,
  TypeTagAddress,
  TypeTagU64,
  U64,
} from "@cedra-labs/ts-sdk";

const CEDRA_COIN_TYPE = parseTypeTag(CEDRA_COIN);
const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 100;

// Default to devnet, but allow for overriding
const CEDRA_NETWORK: Network = NetworkToNetworkName[process.env.CEDRA_NETWORK] || Network.DEVNET;

/**
 * Prints the balance of an account
 * @param cedra
 * @param name
 * @param address
 * @returns {Promise<*>}
 *
 */
const balance = async (cedra: Cedra, name: string, address: AccountAddress): Promise<any> => {
  const payload: InputViewFunctionJsonData = {
    function: "0x1::coin::balance",
    typeArguments: ["0x1::cedra_coin::CedraCoin"],
    functionArguments: [address.toString()],
  };
  const [balance] = await cedra.viewJson<[number]>({ payload: payload });

  console.log(`${name}'s balance is: ${balance}`);
  return Number(balance);
};

async function timeSubmission(
  cedra: Cedra,
  signer: Account,
  buildTxn: () => Promise<SimpleTransaction>,
): Promise<void> {
  const start = performance.now();
  const rawTxn = await buildTxn();
  const buildTime = performance.now();
  const senderAuthenticator = cedra.sign({ signer, transaction: rawTxn });
  const signTime = performance.now();
  const submittedTxn = await cedra.transaction.submit.simple({ transaction: rawTxn, senderAuthenticator });
  const submitTime = performance.now();
  await cedra.waitForTransaction({ transactionHash: submittedTxn.hash });
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

  // Set up the client
  const config = new CedraConfig({ network: CEDRA_NETWORK });
  const cedra = new Cedra(config);

  // Create two accounts
  const alice = Account.generate();
  const bob = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);
  console.log(`Bob's address is: ${bob.accountAddress}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  await cedra.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
  });

  await cedra.fundAccount({
    accountAddress: bob.accountAddress,
    amount: BOB_INITIAL_BALANCE,
  });

  // Show the balances
  console.log("\n=== Balances ===\n");
  const aliceBalance = await balance(cedra, "Alice", alice.accountAddress);
  const bobBalance = await balance(cedra, "Bob", bob.accountAddress);

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
  const bobAddressString = bob.accountAddress.toString();
  await timeSubmission(cedra, alice, async () =>
    cedra.transaction.build.simple({
      sender: aliceAddressString,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [CEDRA_COIN_TYPE],
        functionArguments: [bobAddressString, TRANSFER_AMOUNT],
      },
    }),
  );

  console.log("\n=== Remote ABI, BCS inputs ===\n");
  await timeSubmission(cedra, alice, async () =>
    cedra.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [CEDRA_COIN_TYPE],
        functionArguments: [bob.accountAddress, new U64(TRANSFER_AMOUNT)],
      },
    }),
  );

  console.log("\n=== Local ABI, normal inputs ===\n");
  await timeSubmission(cedra, alice, async () =>
    cedra.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [CEDRA_COIN_TYPE],
        functionArguments: [bobAddressString, TRANSFER_AMOUNT],
        abi: transferAbi,
      },
    }),
  );

  console.log("\n=== Local ABI, BCS inputs ===\n");
  await timeSubmission(cedra, alice, async () =>
    cedra.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [CEDRA_COIN_TYPE],
        functionArguments: [bob.accountAddress, new U64(TRANSFER_AMOUNT)],
        abi: transferAbi,
      },
    }),
  );

  console.log("\n=== Local ABI, BCS inputs, sequence number already cached ===\n");
  const accountData = await cedra.account.getAccountInfo({ accountAddress: alice.accountAddress });
  const sequenceNumber = BigInt(accountData.sequence_number);
  await timeSubmission(cedra, alice, async () =>
    cedra.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [CEDRA_COIN_TYPE],
        functionArguments: [bob.accountAddress, new U64(TRANSFER_AMOUNT)],
        abi: transferAbi,
      },
      options: {
        accountSequenceNumber: sequenceNumber,
      },
    }),
  );

  console.log("\n=== Local ABI, BCS inputs, sequence number and gas already cached ===\n");
  await timeSubmission(cedra, alice, async () =>
    cedra.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [CEDRA_COIN_TYPE],
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
