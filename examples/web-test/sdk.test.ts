/* eslint-disable no-console */

/**
 * Web Environment Tests for Aptos TypeScript SDK
 *
 * These tests verify that the SDK works correctly in a browser-like environment
 * using jsdom for DOM simulation.
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  Account,
  Aptos,
  AptosConfig,
  Network,
  NetworkToNetworkName,
  Ed25519PrivateKey,
  Hex,
  AccountAddress,
  InputViewFunctionJsonData,
} from "@aptos-labs/ts-sdk";

// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? ""] ?? Network.DEVNET;

describe("Aptos SDK Web Environment Tests", () => {
  let aptos: Aptos;

  beforeAll(() => {
    // Set up the client
    const config = new AptosConfig({ network: APTOS_NETWORK });
    aptos = new Aptos(config);
    console.log(`Testing against network: ${APTOS_NETWORK}`);
  });

  describe("Account Operations", () => {
    it("should generate a new account", () => {
      const account = Account.generate();

      expect(account).toBeDefined();
      expect(account.accountAddress).toBeDefined();
      expect(account.publicKey).toBeDefined();
      expect(account.privateKey).toBeDefined();

      console.log(`Generated account: ${account.accountAddress}`);
    });

    it("should create account from private key", () => {
      // Generate a random private key
      const account = Account.generate();
      const privateKeyHex = account.privateKey.toString();

      // Recreate account from private key
      const privateKey = new Ed25519PrivateKey(privateKeyHex);
      const recreatedAccount = Account.fromPrivateKey({ privateKey });

      expect(recreatedAccount.accountAddress.toString()).toBe(account.accountAddress.toString());
    });

    it("should sign and verify messages", () => {
      const account = Account.generate();
      // Use a hex string message which is more portable across environments
      const messageString = "Hello, Aptos!";
      const message = new Uint8Array(Buffer.from(messageString));

      const signature = account.sign(message);
      expect(signature).toBeDefined();

      // Verify the signature
      const isValid = account.verifySignature({ message, signature });
      expect(isValid).toBe(true);
    });
  });

  describe("Hex and Address Operations", () => {
    it("should create and parse hex values", () => {
      const hexString = "0x1234567890abcdef";
      const hex = Hex.fromHexString(hexString);

      expect(hex).toBeDefined();
      expect(hex.toString()).toBe(hexString);
    });

    it("should create and parse account addresses", () => {
      const addressString = "0x1";
      const address = AccountAddress.fromString(addressString);

      expect(address).toBeDefined();
      // toString() returns the short form "0x1", toStringLong() returns the full padded form
      expect(address.toString()).toBe("0x1");
      expect(address.toStringLong()).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
    });

    it("should validate account addresses", () => {
      // Valid address
      expect(() => AccountAddress.fromString("0x1")).not.toThrow();

      // Invalid address (not hex)
      expect(() => AccountAddress.fromString("not-a-valid-address")).toThrow();
    });
  });

  describe("Network Connectivity", () => {
    it("should fetch ledger info", async () => {
      const ledgerInfo = await aptos.getLedgerInfo();

      expect(ledgerInfo).toBeDefined();
      expect(ledgerInfo.chain_id).toBeDefined();
      expect(ledgerInfo.epoch).toBeDefined();
      expect(ledgerInfo.ledger_version).toBeDefined();

      console.log(`Chain ID: ${ledgerInfo.chain_id}`);
      console.log(`Epoch: ${ledgerInfo.epoch}`);
      console.log(`Ledger Version: ${ledgerInfo.ledger_version}`);
    });

    it("should get chain ID", async () => {
      const chainId = await aptos.getChainId();
      expect(typeof chainId).toBe("number");
      expect(chainId).toBeGreaterThan(0);
    });
  });

  describe("Account Funding and Balance", () => {
    it("should fund an account and check balance", async () => {
      const account = Account.generate();
      const fundAmount = 100_000_000;

      console.log(`Funding account: ${account.accountAddress}`);

      // Fund the account
      const txn = await aptos.fundAccount({
        accountAddress: account.accountAddress,
        amount: fundAmount,
      });

      expect(txn).toBeDefined();
      console.log(`Fund transaction hash: ${txn.hash}`);

      // Check balance using view function
      const payload: InputViewFunctionJsonData = {
        function: "0x1::coin::balance",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [account.accountAddress.toString()],
      };
      const [balance] = await aptos.viewJson<[number]>({ payload });

      expect(Number(balance)).toBe(fundAmount);
      console.log(`Account balance: ${balance}`);
    });
  });

  describe("Transaction Building", () => {
    it("should build a simple transaction", async () => {
      const alice = Account.generate();
      const bob = Account.generate();

      // Fund alice
      await aptos.fundAccount({
        accountAddress: alice.accountAddress,
        amount: 100_000_000,
      });

      // Build a transfer transaction
      const txn = await aptos.transaction.build.simple({
        sender: alice.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [bob.accountAddress, 1000],
        },
      });

      expect(txn).toBeDefined();
      expect(txn.rawTransaction).toBeDefined();
    });
  });

  describe("Full Transfer Flow", () => {
    it("should complete a full transfer between accounts", async () => {
      const alice = Account.generate();
      const bob = Account.generate();
      const transferAmount = 1000;
      const aliceInitialBalance = 100_000_000;
      const bobInitialBalance = 100;

      console.log(`Alice: ${alice.accountAddress}`);
      console.log(`Bob: ${bob.accountAddress}`);

      // Fund both accounts
      await aptos.fundAccount({
        accountAddress: alice.accountAddress,
        amount: aliceInitialBalance,
      });
      await aptos.fundAccount({
        accountAddress: bob.accountAddress,
        amount: bobInitialBalance,
      });

      // Build transfer transaction
      const txn = await aptos.transaction.build.simple({
        sender: alice.accountAddress,
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [bob.accountAddress, transferAmount],
        },
      });

      // Sign and submit
      const committedTxn = await aptos.signAndSubmitTransaction({
        signer: alice,
        transaction: txn,
      });

      expect(committedTxn.hash).toBeDefined();
      console.log(`Transaction hash: ${committedTxn.hash}`);

      // Wait for transaction
      await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

      // Check Bob's new balance
      const payload: InputViewFunctionJsonData = {
        function: "0x1::coin::balance",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [bob.accountAddress.toString()],
      };
      const [bobBalance] = await aptos.viewJson<[number]>({ payload });

      expect(Number(bobBalance)).toBe(bobInitialBalance + transferAmount);
      console.log(`Bob's final balance: ${bobBalance}`);
    });
  });

  describe("Sponsored Transaction Flow", () => {
    it("should complete a sponsored transaction", async () => {
      const alice = Account.generate();
      const bob = Account.generate();
      const transferAmount = 10;
      const bobInitialBalance = 100_000_000;

      console.log(`Alice (sender): ${alice.accountAddress}`);
      console.log(`Bob (sponsor): ${bob.accountAddress}`);

      // Only fund bob (sponsor) - alice starts with no funds (no need to fund with 0)
      await aptos.fundAccount({
        accountAddress: bob.accountAddress,
        amount: bobInitialBalance,
      });

      // Build a sponsored transaction
      const transaction = await aptos.transaction.build.simple({
        sender: alice.accountAddress,
        withFeePayer: true,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [bob.accountAddress, transferAmount],
        },
      });

      // Alice signs the transaction
      const aliceSenderAuthenticator = aptos.transaction.sign({
        signer: alice,
        transaction,
      });

      // Bob (fee payer) signs the transaction
      const bobSponsorAuthenticator = aptos.transaction.signAsFeePayer({
        signer: bob,
        transaction,
      });

      // Submit the transaction with both signatures
      const committedTxn = await aptos.transaction.submit.simple({
        transaction,
        senderAuthenticator: aliceSenderAuthenticator,
        feePayerAuthenticator: bobSponsorAuthenticator,
      });

      expect(committedTxn.hash).toBeDefined();
      console.log(`Sponsored transaction hash: ${committedTxn.hash}`);

      // Wait for transaction
      await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    });
  });
});
