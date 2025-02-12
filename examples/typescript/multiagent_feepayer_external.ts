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
  U64,
  MultiAgentTransaction,
  sleep,
} from "@aptos-labs/ts-sdk";

const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
const COLD_INITIAL_BALANCE = 100_000_000;
const TRANSFER_AMOUNT = 100;
const TRANSFER_SCRIPT =
  // eslint-disable-next-line max-len
  "0xa11ceb0b0700000a0701000403040d0411020513140727290850401090011f0102010400030203000101010501010001010403060c060c030001060c010501090003060c0503083c53454c463e5f30087472616e73666572067369676e65720a616464726573735f6f6604636f696effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000114636f6d70696c6174696f6e5f6d65746164617461090003322e3003322e3101000001060b000b0111000b02380002";

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
    const transaction = MultiAgentTransaction.deserialize(deserializer);

    // Some changes to make it signable, this would need more logic for fee payer or additional signers
    // TODO: Make BCS handle any object type?
    const signingMessage = this.aptos.getSigningMessage({ transaction });

    // Pretend that it's an external signer that only knows bytes using a raw crypto library
    const signature = ed25519.sign(signingMessage, this.extractedPrivateKey);

    // Construct the authenticator with the public key for the submission
    const authenticator = new AccountAuthenticatorEd25519(this.account.publicKey, new Ed25519Signature(signature));

    return authenticator.bcsToBytes();
  }

  signAsFeePayer(encodedTransaction: Uint8Array): Uint8Array {
    // Sending the full transaction as BCS encoded, allows for full text viewing of the transaction on the signer.
    // However, this is not required, and the signer could just send the signing message.
    const deserializer = new Deserializer(encodedTransaction);
    const transaction = MultiAgentTransaction.deserialize(deserializer);

    // The fee payer needs to fill in the fee payer address before signing
    transaction.feePayerAddress = this.account.accountAddress;

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
  console.log("This example will pretend that hot is on a separate server, and never accesses information from it");

  // Set up the client
  const config = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(config);

  // Create three accounts
  const feePayer = new ExternalSigner("FeePayer", COLD_INITIAL_BALANCE);
  const admin = new ExternalSigner("Admin", COLD_INITIAL_BALANCE);
  const user = Account.generate();
  console.log("\n=== Funding accounts ===\n");
  await Promise.all([
    aptos.fundAccount({ accountAddress: user.accountAddress, amount: COLD_INITIAL_BALANCE }),
    admin.setup(),
    feePayer.setup(),
  ]);

  await sleep(1000);

  // Show the balances
  console.log("\n=== Balances ===\n");
  const adminBalance = await admin.balance();
  const feePayerBalance = await feePayer.balance();
  const userBalance = await balance(aptos, user, "user");

  console.log(`Admin's balance is: ${adminBalance}`);
  console.log(`Fee payer's balance is: ${feePayerBalance}`);
  console.log(`User's balance is: ${userBalance}`);

  // Transfer between users, with a fee payer
  const transaction = await aptos.transaction.build.multiAgent({
    sender: user.accountAddress,
    secondarySignerAddresses: [admin.address()],
    withFeePayer: true,
    data: {
      bytecode: TRANSFER_SCRIPT,
      typeArguments: [APTOS_COIN],
      functionArguments: [new U64(TRANSFER_AMOUNT)],
    },
    options: {
      maxGasAmount: 10000,
    },
  });

  // Send the transaction to external signer to sign
  // We're going to pretend that the network call is just an external function call
  console.log("\n=== Signing ===\n");
  const userAuthenticator = user.signTransactionWithAuthenticator(transaction);
  console.log(`Retrieved user authenticator: ${JSON.stringify(userAuthenticator)}`);

  const adminBytes = admin.sign(transaction.bcsToBytes());
  const deserializer1 = new Deserializer(adminBytes);
  const adminAuthenticator = AccountAuthenticator.deserialize(deserializer1);
  console.log(`Retrieved admin authenticator: ${JSON.stringify(adminAuthenticator)}`);

  const feePayerBytes = feePayer.signAsFeePayer(transaction.bcsToBytes());
  const deserializer2 = new Deserializer(feePayerBytes);
  const feePayerAuthenticator = AccountAuthenticator.deserialize(deserializer2);
  console.log(`Retrieved fee payer authenticator: ${JSON.stringify(feePayerAuthenticator)}`);

  // Combine the transaction and send
  console.log("\n=== Transfer transaction ===\n");
  // Note, the transaction sent to the server MUST have the fee payer address set
  transaction.feePayerAddress = feePayer.address();

  const committedTxn = await aptos.transaction.submit.multiAgent({
    transaction,
    senderAuthenticator: userAuthenticator,
    additionalSignersAuthenticators: [adminAuthenticator],
    feePayerAuthenticator,
  });

  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log(`Committed transaction: ${committedTxn.hash}`);

  console.log("\n=== Balances after transfer ===\n");
  const newUserBalance = await balance(aptos, user, "User");
  const newAdminBalance = await admin.balance();
  const newFeePayerBalance = await feePayer.balance();

  console.log(`Admin's new balance is: ${newAdminBalance}`);
  console.log(`Fee payer's new balance is: ${newFeePayerBalance}`);
  console.log(`User's new balance is: ${newUserBalance}`);
};

example();
