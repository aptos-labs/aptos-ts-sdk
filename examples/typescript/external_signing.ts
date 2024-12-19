/* eslint-disable no-console */

/**
 * This example shows an example of how one might send transactions elsewhere to be signed outside the SDK.
 */
import { ed25519 } from "@noble/curves/ed25519";
import {
  Account,
  AccountAddress,
  AccountAuthenticator,
  AccountAuthenticatorEd25519,
  Aptos,
  AptosConfig,
  Deserializer,
  Ed25519Signature,
  Network,
  NetworkToNetworkName,
  Ed25519Account,
  SimpleTransaction,
} from "@aptos-labs/ts-sdk";

const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
const COLD_INITIAL_BALANCE = 100_000_000;
const HOT_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 100;

// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];

const balance = async (aptos: Aptos, account: Account, name: string): Promise<number> => {
  type Coin = { coin: { value: string } };
  const resource = await aptos.getAccountResource<Coin>({
    accountAddress: account.accountAddress,
    resourceType: COIN_STORE,
  });
  const amount = Number(resource.coin.value);

  console.log(`${name}'s balance is: ${amount}`);
  return amount;
};

/**
 * Provides a mock "Cold wallet" that's signed externally from the SDK
 */
class ExternalSigner {
  private account: Ed25519Account;

  private aptos: Aptos;

  public name: string;

  public initialBalance: number;

  public isSetup: boolean;

  private extractedPrivateKey: Uint8Array;

  constructor(name: string, initialBalance: number) {
    const config = new AptosConfig({ network: APTOS_NETWORK });
    this.aptos = new Aptos(config);
    this.account = Account.generate();
    this.name = name;
    this.initialBalance = initialBalance;
    this.isSetup = false;
    this.extractedPrivateKey = this.account.privateKey.toUint8Array();
  }

  address(): AccountAddress {
    return this.account.accountAddress;
  }

  /**
   * Set up the account making sure it has funds and exists
   */
  async setup() {
    if (this.isSetup) {
      throw new Error(`Tried to double setup ${this.name}`);
    }

    console.log(`${this.name}'s address is: ${this.account.accountAddress}`);

    const fundTxn = await this.aptos.fundAccount({
      accountAddress: this.account.accountAddress,
      amount: this.initialBalance,
    });
    console.log(`${this.name}'s fund transaction: `, fundTxn);
    this.isSetup = true;
  }

  async balance(): Promise<number> {
    return balance(this.aptos, this.account, this.name);
  }

  /**
   * Pretends to sign from a cold wallet
   * @param encodedTransaction an already encoded signing message
   */
  sign(encodedTransaction: Uint8Array): Uint8Array {
    // Sending the full transaction as BCS encoded, allows for full text viewing of the transaction on the signer.
    // However, this is not required, and the signer could just send the signing message.
    const deserializer = new Deserializer(encodedTransaction);
    const transaction = SimpleTransaction.deserialize(deserializer);

    // Some changes to make it signable, this would need more logic for fee payer or additional signers
    // TODO: Make BCS handle any object type?
    const signingMessage = this.aptos.getSigningMessage({ transaction });

    // Pretend that it's an external signer that only knows bytes using a raw crypto library
    const signature = ed25519.sign(signingMessage, this.extractedPrivateKey);

    // Construct the authenticator with the public key for the submission
    const authenticator = new AccountAuthenticatorEd25519(this.account.publicKey, new Ed25519Signature(signature));

    return authenticator.bcsToBytes();
  }
}

const example = async () => {
  console.log("This example will pretend that hot is on a separate server, and never access information from it");

  // Set up the client
  const config = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(config);

  // Create two accounts
  const cold = new ExternalSigner("Cold", COLD_INITIAL_BALANCE);
  const hot = Account.generate();
  await aptos.fundAccount({ accountAddress: hot.accountAddress, amount: HOT_INITIAL_BALANCE });

  console.log("\n=== Funding accounts ===\n");
  await cold.setup();

  // Show the balances
  console.log("\n=== Balances ===\n");
  const coldBalance = await cold.balance();
  const hotBalance = await balance(aptos, hot, "Hot");

  if (coldBalance !== COLD_INITIAL_BALANCE) throw new Error("Cold's balance is incorrect");
  if (hotBalance !== HOT_INITIAL_BALANCE) throw new Error("Hot's balance is incorrect");

  // Transfer between users
  const simpleTransaction = await aptos.transaction.build.simple({
    sender: cold.address(),
    data: {
      function: "0x1::coin::transfer",
      typeArguments: [APTOS_COIN],
      functionArguments: [hot.accountAddress, TRANSFER_AMOUNT],
    },
  });

  // Send the transaction to external signer to sign
  // We're going to pretend that the network call is just an external function call
  console.log("\n=== Signing ===\n");
  const authenticatorBytes = cold.sign(simpleTransaction.bcsToBytes());
  const deserializer = new Deserializer(authenticatorBytes);
  const authenticator = AccountAuthenticator.deserialize(deserializer);

  console.log(`Retrieved authenticator: ${JSON.stringify(authenticator)}`);

  // Combine the transaction and send
  console.log("\n=== Transfer transaction ===\n");
  const committedTxn = await aptos.transaction.submit.simple({
    transaction: simpleTransaction,
    senderAuthenticator: authenticator,
  });

  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log(`Committed transaction: ${committedTxn.hash}`);

  console.log("\n=== Balances after transfer ===\n");
  const newColdBalance = await cold.balance();
  const newHotBalance = await balance(aptos, hot, "Hot");

  // Hot should have the transfer amount
  if (newHotBalance !== TRANSFER_AMOUNT + HOT_INITIAL_BALANCE)
    throw new Error("Hot's balance after transfer is incorrect");

  // Cold should have the remainder minus gas
  if (newColdBalance >= COLD_INITIAL_BALANCE - TRANSFER_AMOUNT)
    throw new Error("Cold's balance after transfer is incorrect");
};

example();
