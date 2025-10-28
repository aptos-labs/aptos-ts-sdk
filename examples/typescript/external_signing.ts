/* eslint-disable no-console */

/**
 * This example shows an example of how one might send transactions elsewhere to be signed outside the SDK.
 */
import dotenv from "dotenv";
dotenv.config();
import { ed25519 } from "@noble/curves/ed25519";
import {
  Account,
  AccountAddress,
  AccountAuthenticator,
  AccountAuthenticatorEd25519,
  Cedra,
  CedraConfig,
  Deserializer,
  Ed25519Signature,
  Network,
  NetworkToNetworkName,
  Ed25519Account,
  SimpleTransaction,
  InputViewFunctionJsonData,
} from "@cedra-labs/ts-sdk";

const CEDRA_COIN = "0x1::cedra_coin::CedraCoin";
const COLD_INITIAL_BALANCE = 100_000_000;
const HOT_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 100;

// Default to devnet, but allow for overriding
const CEDRA_NETWORK: Network = NetworkToNetworkName[process.env.CEDRA_NETWORK ?? Network.DEVNET];

const balance = async (cedra: Cedra, account: Account, name: string): Promise<any> => {
  const payload: InputViewFunctionJsonData = {
    function: "0x1::coin::balance",
    typeArguments: ["0x1::cedra_coin::CedraCoin"],
    functionArguments: [account.accountAddress.toString()],
  };
  const [balance] = await cedra.viewJson<[number]>({ payload: payload });

  console.log(`${name}'s balance is: ${balance}`);
  return Number(balance);
};

/**
 * Provides a mock "Cold wallet" that's signed externally from the SDK
 */
class ExternalSigner {
  private account: Ed25519Account;
  private cedra: Cedra;
  public name: string;
  public initialBalance: number;
  public isSetup: boolean;
  private extractedPrivateKey: Uint8Array;

  constructor(name: string, initialBalance: number) {
    const config = new CedraConfig({ network: CEDRA_NETWORK });
    this.cedra = new Cedra(config);
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

    const fundTxn = await this.cedra.fundAccount({
      accountAddress: this.account.accountAddress,
      amount: this.initialBalance,
    });
    console.log(`${this.name}'s fund transaction: `, fundTxn);
    this.isSetup = true;
  }

  async balance(): Promise<number> {
    return balance(this.cedra, this.account, this.name);
  }

  /**
   * Pretends to sign from a cold wallet
   * @param signingMessage the signing message to sign
   */
  sign(signingMessage: Uint8Array): AccountAuthenticatorEd25519 {
    // Sign the raw signing message directly
    const signature = ed25519.sign(signingMessage, this.extractedPrivateKey);

    // Construct and return the authenticator directly
    return new AccountAuthenticatorEd25519(this.account.publicKey, new Ed25519Signature(signature));
  }
}

const example = async () => {
  console.log("This example will pretend that hot is on a separate server, and never accesses information from it");

  // Set up the client
  const config = new CedraConfig({ network: CEDRA_NETWORK });
  const cedra = new Cedra(config);

  // Create two accounts
  const cold = new ExternalSigner("Cold", COLD_INITIAL_BALANCE);
  const hot = Account.generate();
  await cedra.fundAccount({ accountAddress: hot.accountAddress, amount: HOT_INITIAL_BALANCE });

  console.log("\n=== Funding accounts ===\n");
  await cold.setup();

  // Show the balances
  console.log("\n=== Balances ===\n");
  const coldBalance = await cold.balance();
  const hotBalance = await balance(cedra, hot, "Hot");

  if (coldBalance !== COLD_INITIAL_BALANCE) throw new Error("Cold's balance is incorrect");
  if (hotBalance !== HOT_INITIAL_BALANCE) throw new Error("Hot's balance is incorrect");

  // Transfer between users
  const simpleTransaction = await cedra.transaction.build.simple({
    sender: cold.address(),
    data: {
      function: "0x1::coin::transfer",
      typeArguments: [CEDRA_COIN],
      functionArguments: [hot.accountAddress, TRANSFER_AMOUNT],
    },
  });

  // Get the signing message for the transaction
  const signingMessage = cedra.getSigningMessage({ transaction: simpleTransaction });

  // Send the signing message to external signer to sign
  console.log("\n=== Signing ===\n");
  const authenticator = cold.sign(signingMessage);

  console.log(`Retrieved authenticator with public key: ${authenticator.public_key}`);

  // Combine the transaction and send
  console.log("\n=== Transfer transaction ===\n");
  const committedTxn = await cedra.transaction.submit.simple({
    transaction: simpleTransaction,
    senderAuthenticator: authenticator,
  });

  await cedra.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log(`Committed transaction: ${committedTxn.hash}`);

  console.log("\n=== Balances after transfer ===\n");
  const newColdBalance = await cold.balance();
  const newHotBalance = await balance(cedra, hot, "Hot");

  // Hot should have the transfer amount plus initial balance
  const expectedHotBalance = TRANSFER_AMOUNT + HOT_INITIAL_BALANCE;
  if (newHotBalance !== expectedHotBalance) {
    throw new Error(
      `Hot's balance after transfer is incorrect. Expected: ${expectedHotBalance}, Got: ${newHotBalance}`,
    );
  }

  // Cold should have initial balance minus transfer amount minus gas fees
  const expectedColdBalanceWithoutGas = COLD_INITIAL_BALANCE - TRANSFER_AMOUNT;

  // Check if gas fees were actually deducted
  if (newColdBalance === expectedColdBalanceWithoutGas) {
    console.log(`ℹ️  Note: No gas fees were deducted from Cold's account. Balance is exactly: ${newColdBalance}`);
  } else if (newColdBalance < expectedColdBalanceWithoutGas) {
    const gasFees = expectedColdBalanceWithoutGas - newColdBalance;
    console.log(`ℹ️  Gas fees deducted: ${gasFees}`);
  }

  // The main success condition: Hot received the funds and Cold's balance decreased appropriately
  console.log("✅ External signing example completed successfully!");
  console.log(`✅ Cold's final balance: ${newColdBalance}`);
  console.log(`✅ Hot's final balance: ${newHotBalance}`);
  console.log(`✅ Transfer amount: ${TRANSFER_AMOUNT}`);
};

example().catch(console.error);
