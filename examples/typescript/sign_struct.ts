/* eslint-disable no-console */
import dotenv from "dotenv";
dotenv.config();
import {
  Account,
  AccountAddress,
  AnyNumber,
  Aptos,
  AptosConfig,
  InputViewFunctionJsonData,
  MoveString,
  Network,
  NetworkToNetworkName,
  Serializable,
  Serializer,
  sleep,
  U64,
} from "@aptos-labs/ts-sdk";
import { compilePackage, getPackageBytesToPublish } from "./utils";

const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100_000_000;
const TRANSFER_AMOUNT = 10000;

// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];

/**
 * Prints the balance of an account
 * @param aptos
 * @param name
 * @param address
 * @returns {Promise<*>}
 *
 */
const balance = async (aptos: Aptos, name: string, address: AccountAddress): Promise<any> => {
  const payload: InputViewFunctionJsonData = {
    function: "0x1::coin::balance",
    typeArguments: ["0x1::aptos_coin::AptosCoin"],
    functionArguments: [address.toString()],
  };
  const [balance] = await aptos.viewJson<[number]>({ payload: payload });

  console.log(`${name}'s balance is: ${balance}`);
  return Number(balance);
};

/**
 * Matches the on-chain <address>::claims::Claim struct
 */
export class Claim extends Serializable {
  // Contract's address
  public readonly contractAddress: AccountAddress;

  // Module name, i.e: 0x1::account
  public readonly moduleName: MoveString = new MoveString("claims");

  // The struct name
  public readonly structName: MoveString = new MoveString("Claim");

  // Signer's address
  public readonly sender: AccountAddress;

  // Receiver's address
  public readonly receiver: AccountAddress;

  // Claim number
  public readonly claimNumber: U64;

  constructor(args: {
    contractAddress: AccountAddress;
    sender: AccountAddress;
    receiver: AccountAddress;
    claimNumber: AnyNumber;
  }) {
    super();
    this.contractAddress = args.contractAddress;
    this.sender = args.sender;
    this.receiver = args.receiver;
    this.claimNumber = new U64(args.claimNumber);
  }

  serialize(serializer: Serializer): void {
    serializer.serialize(this.contractAddress);
    serializer.serialize(this.moduleName);
    serializer.serialize(this.structName);
    serializer.serialize(this.sender);
    serializer.serialize(this.receiver);
    serializer.serialize(this.claimNumber);
  }
}

const example = async () => {
  console.log("This example will publish a contract, and show how to sign a struct and prove it on-chain");

  // Set up the client
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

  console.log("\n=== Compiling the package locally ===");
  compilePackage("move/claims", "move/claims/claims.json", [{ name: "my_addr", address: alice.accountAddress }]);

  // Wait half a second to ensure the file was written
  sleep(500);

  const { metadataBytes, byteCode } = getPackageBytesToPublish("move/claims/claims.json");

  console.log("\n===Publishing Claims package===");
  const transaction = await aptos.publishPackageTransaction({
    account: alice.accountAddress,
    metadataBytes,
    moduleBytecode: byteCode,
  });
  const response = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction,
  });
  console.log(`Transaction hash: ${response.hash}`);
  await aptos.waitForTransaction({
    transactionHash: response.hash,
  });

  console.log("\n=== Balances after publish of package ===\n");
  await balance(aptos, "Alice", alice.accountAddress);
  await balance(aptos, "Bob", bob.accountAddress);

  // Setup a claim
  const createClaim = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function: `${alice.accountAddress.toString()}::claims::create_claim`,
      functionArguments: [TRANSFER_AMOUNT],
    },
  });
  const createClaimResponse = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: createClaim,
  });
  console.log(`Create Claim Transaction hash: ${createClaimResponse.hash}`);
  await aptos.waitForTransaction({
    transactionHash: createClaimResponse.hash,
  });

  console.log("\n=== Balances after creating claim ===\n");
  await balance(aptos, "Alice", alice.accountAddress);
  await balance(aptos, "Bob", bob.accountAddress);

  // Claim the coins
  const claim = new Claim({
    contractAddress: alice.accountAddress,
    sender: alice.accountAddress,
    receiver: bob.accountAddress,
    claimNumber: 0,
  });
  const serializer = new Serializer();
  serializer.serialize(claim);
  const signature = alice.sign(serializer.toUint8Array());

  const claimCoins = await aptos.transaction.build.simple({
    sender: bob.accountAddress,
    data: {
      function: `${alice.accountAddress.toString()}::claims::claim`,
      functionArguments: [alice.accountAddress, 0, alice.publicKey.toUint8Array(), signature.toUint8Array()],
    },
  });
  const claimCoinsResponse = await aptos.signAndSubmitTransaction({
    signer: bob,
    transaction: claimCoins,
  });
  console.log(`Claim Coins Transaction hash: ${claimCoinsResponse.hash}`);
  await aptos.waitForTransaction({
    transactionHash: claimCoinsResponse.hash,
  });

  console.log("\n=== Balances after claiming ===\n");
  await balance(aptos, "Alice", alice.accountAddress);
  await balance(aptos, "Bob", bob.accountAddress);
};

example();
