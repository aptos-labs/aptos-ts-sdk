// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, Aptos, AptosConfig, Deserializer, Network, U64 } from "../../../src";
import { AccountAuthenticator, AccountAuthenticatorSingleKey } from "../../../src/transactions/authenticator/account";
import {
  FeePayerRawTransaction,
  MultiAgentRawTransaction,
  RawTransaction,
  TransactionPayloadEntryFunction,
  TransactionPayloadMultisig,
  TransactionPayloadScript,
} from "../../../src/transactions/instances";
import {
  buildTransaction,
  deriveTransactionType,
  generateRawTransaction,
  generateSignedTransaction,
  generateSignedTransactionForSimulation,
  generateTransactionPayload,
  sign,
} from "../../../src/transactions/transaction_builder/transaction_builder";
import { SignedTransaction } from "../../../src/transactions/instances/signedTransaction";
import { MoveObject } from "../../../src/bcs/serializable/moveStructs";
import { FUND_AMOUNT, longTestTimeout } from "../../unit/helper";
import { fundAccounts, multiSignerScriptBytecode, publishTransferPackage } from "./helper";

const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);
/* eslint-disable max-len */
describe("transaction builder", () => {
  const contractPublisherAccount = Account.generate();
  beforeAll(async () => {
    await fundAccounts(aptos, [contractPublisherAccount]);
    await publishTransferPackage(aptos, contractPublisherAccount);
  }, longTestTimeout);
  describe("generate transaction payload", () => {
    test("it generates a script transaction payload", async () => {
      const payload = generateTransactionPayload({
        bytecode: multiSignerScriptBytecode,
        functionArguments: [
          new U64(100),
          new U64(200),
          new MoveObject(Account.generate().accountAddress),
          new MoveObject(Account.generate().accountAddress),
          new U64(50),
        ],
      });
      expect(payload instanceof TransactionPayloadScript).toBeTruthy();
    });
    test("it generates a multi sig transaction payload", async () => {
      const payload = generateTransactionPayload({
        multisigAddress: Account.generate().accountAddress,
        function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
        functionArguments: [],
      });
      expect(payload instanceof TransactionPayloadMultisig).toBeTruthy();
    });
    test("it generates an entry function transaction payload", async () => {
      const payload = generateTransactionPayload({
        function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
        functionArguments: [],
      });
      expect(payload instanceof TransactionPayloadEntryFunction).toBeTruthy();
    });
  });
  describe("generate raw transaction", () => {
    test("it generates a raw transaction with script payload", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const payload = generateTransactionPayload({
        bytecode: multiSignerScriptBytecode,
        functionArguments: [
          new U64(100),
          new U64(200),
          Account.generate().accountAddress,
          Account.generate().accountAddress,
          new U64(50),
        ],
      });
      const rawTxn = await generateRawTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
      });
      expect(rawTxn instanceof RawTransaction).toBeTruthy();
      expect(rawTxn.payload instanceof TransactionPayloadScript).toBeTruthy();
    });

    test("it generates a raw transaction with a multi sig payload", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = generateTransactionPayload({
        multisigAddress: bob.accountAddress,
        function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
        functionArguments: [new MoveObject(bob.accountAddress), new U64(1)],
      });
      const rawTxn = await generateRawTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
      });
      expect(rawTxn instanceof RawTransaction).toBeTruthy();
      expect(rawTxn.payload instanceof TransactionPayloadMultisig).toBeTruthy();
    });

    test("it generates a raw transaction with an entry function payload", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = generateTransactionPayload({
        function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
        functionArguments: [new MoveObject(bob.accountAddress), new U64(1)],
      });
      const rawTxn = await generateRawTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
      });
      expect(rawTxn instanceof RawTransaction).toBeTruthy();
      expect(rawTxn.payload instanceof TransactionPayloadEntryFunction).toBeTruthy();
    });
  });
  describe("generate transaction", () => {
    test("it returns a serialized raw transaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const payload = generateTransactionPayload({
        bytecode: multiSignerScriptBytecode,
        functionArguments: [
          new U64(100),
          new U64(200),
          Account.generate().accountAddress,
          Account.generate().accountAddress,
          new U64(50),
        ],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
      });
      expect(transaction.rawTransaction instanceof Uint8Array).toBeTruthy();
      expect(transaction.secondarySignerAddresses).toBeUndefined();
      expect(transaction.feePayerAddress).toBeUndefined();
    });

    test("it returns a serialized raw transaction and secondary signers addresses", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = generateTransactionPayload({
        function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
        functionArguments: [new MoveObject(bob.accountAddress), new U64(1)],
      });
      const secondarySignerAddress = Account.generate();
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
        secondarySignerAddresses: [secondarySignerAddress.accountAddress.toString()],
      });
      expect(transaction.rawTransaction instanceof Uint8Array).toBeTruthy();
      expect(transaction.secondarySignerAddresses).not.toBeUndefined();
      expect(transaction.secondarySignerAddresses?.length).toBe(1);
      expect(transaction.secondarySignerAddresses![0].data).toStrictEqual(
        secondarySignerAddress.accountAddress.toUint8Array(),
      );
      expect(transaction.feePayerAddress).toBeUndefined();
    });

    test("it returns a serialized raw transaction and a fee payer address", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = generateTransactionPayload({
        function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
        functionArguments: [new MoveObject(bob.accountAddress), new U64(1)],
      });
      const feePayer = Account.generate();
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
        feePayerAddress: feePayer.accountAddress.toString(),
      });
      expect(transaction.rawTransaction instanceof Uint8Array).toBeTruthy();
      expect(transaction.secondarySignerAddresses?.length).toBe(0);
      expect(transaction.feePayerAddress).not.toBeUndefined();
      expect(transaction.feePayerAddress?.data).toStrictEqual(feePayer.accountAddress.toUint8Array());
    });

    test(
      "it returns a serialized raw transaction, secondary signers addresses and a fee payer address",
      async () => {
        const alice = Account.generate();
        await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
        const bob = Account.generate();
        const payload = generateTransactionPayload({
          function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
          functionArguments: [new MoveObject(bob.accountAddress), new U64(1)],
        });
        const feePayer = Account.generate();
        const secondarySignerAddress = Account.generate();
        const transaction = await buildTransaction({
          aptosConfig: config,
          sender: alice.accountAddress.toString(),
          payload,
          secondarySignerAddresses: [secondarySignerAddress.accountAddress.toString()],
          feePayerAddress: feePayer.accountAddress.toString(),
        });
        expect(transaction.rawTransaction instanceof Uint8Array).toBeTruthy();
        expect(transaction.secondarySignerAddresses).not.toBeUndefined();
        expect(transaction.secondarySignerAddresses?.length).toBe(1);
        expect(transaction.secondarySignerAddresses![0].data).toStrictEqual(
          secondarySignerAddress.accountAddress.toUint8Array(),
        );
        expect(transaction.feePayerAddress).not.toBeUndefined();
        expect(transaction.feePayerAddress?.data).toStrictEqual(feePayer.accountAddress.toUint8Array());
      },
      longTestTimeout,
    );
  });
  describe("generateSignedTransactionForSimulation", () => {
    test("it generates a signed raw transaction for simulation", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const payload = generateTransactionPayload({
        bytecode: multiSignerScriptBytecode,
        functionArguments: [
          new U64(100),
          new U64(200),
          Account.generate().accountAddress,
          Account.generate().accountAddress,
          new U64(50),
        ],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
      });

      const bcsTransaction = await generateSignedTransactionForSimulation({
        transaction,
        signerPublicKey: alice.publicKey,
      });
      expect(bcsTransaction instanceof Uint8Array).toBeTruthy();
      const deserializer = new Deserializer(bcsTransaction);
      const signedTransaction = SignedTransaction.deserialize(deserializer);
      expect(signedTransaction instanceof SignedTransaction).toBeTruthy();
    });
  });
  describe("sign", () => {
    test("it signs a raw transaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const payload = generateTransactionPayload({
        bytecode: multiSignerScriptBytecode,
        functionArguments: [
          new U64(100),
          new U64(200),
          Account.generate().accountAddress,
          Account.generate().accountAddress,
          new U64(50),
        ],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
      });
      const accountAuthenticator = sign({
        signer: alice,
        transaction,
      });
      expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
      const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
      const authenticator = AccountAuthenticator.deserialize(deserializer);
      expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
    });

    test("it signs a fee payer transaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = generateTransactionPayload({
        multisigAddress: bob.accountAddress,
        function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
        functionArguments: [new MoveObject(bob.accountAddress), new U64(1)],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
        feePayerAddress: Account.generate().accountAddress.toString(),
      });
      const accountAuthenticator = sign({
        signer: alice,
        transaction,
      });
      expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
      const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
      const authenticator = AccountAuthenticator.deserialize(deserializer);
      expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
    });

    test("it signs a multi agent transaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = generateTransactionPayload({
        bytecode: multiSignerScriptBytecode,
        functionArguments: [
          new U64(100),
          new U64(200),
          Account.generate().accountAddress,
          Account.generate().accountAddress,
          new U64(50),
        ],
      });
      const rawTxn = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
        secondarySignerAddresses: [bob.accountAddress.toString()],
      });
      const accountAuthenticator = sign({
        signer: alice,
        transaction: rawTxn,
      });
      expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
      const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
      const authenticator = AccountAuthenticator.deserialize(deserializer);
      expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
    });
  });
  describe("generateSignedTransaction", () => {
    test("it generates a single signer signed transaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const payload = generateTransactionPayload({
        bytecode: multiSignerScriptBytecode,
        functionArguments: [
          new U64(100),
          new U64(200),
          Account.generate().accountAddress,
          Account.generate().accountAddress,
          new U64(50),
        ],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
      });
      const authenticator = sign({ signer: alice, transaction });
      const bcsTransaction = await generateSignedTransaction({
        transaction,
        senderAuthenticator: authenticator,
      });
      expect(bcsTransaction instanceof Uint8Array).toBeTruthy();
      const deserializer = new Deserializer(bcsTransaction);
      const signedTransaction = SignedTransaction.deserialize(deserializer);
      expect(signedTransaction instanceof SignedTransaction).toBeTruthy();
    });

    test("it generates a multi agent signed transaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = await Account.generate();
      const payload = generateTransactionPayload({
        function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
        functionArguments: [new MoveObject(bob.accountAddress), new U64(1)],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
        secondarySignerAddresses: [bob.accountAddress.toString()],
      });
      const authenticator = sign({ signer: alice, transaction });
      const secondaryAuthenticator = sign({
        signer: bob,
        transaction,
      });
      const bcsTransaction = await generateSignedTransaction({
        transaction,
        senderAuthenticator: authenticator,
        secondarySignerAuthenticators: {
          additionalSignersAuthenticators: [secondaryAuthenticator],
        },
      });
      expect(bcsTransaction instanceof Uint8Array).toBeTruthy();
      const deserializer = new Deserializer(bcsTransaction);
      const signedTransaction = SignedTransaction.deserialize(deserializer);
      expect(signedTransaction instanceof SignedTransaction).toBeTruthy();
    });

    test("it generates a fee payer signed transaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = generateTransactionPayload({
        function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
        functionArguments: [new MoveObject(bob.accountAddress), new U64(1)],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
        feePayerAddress: bob.accountAddress.toString(),
      });
      const authenticator = sign({ signer: alice, transaction });
      const feePayerAuthenticator = sign({
        signer: bob,
        transaction,
      });
      const bcsTransaction = await generateSignedTransaction({
        transaction,
        senderAuthenticator: authenticator,
        secondarySignerAuthenticators: {
          feePayerAuthenticator,
        },
      });
      expect(bcsTransaction instanceof Uint8Array).toBeTruthy();
      const deserializer = new Deserializer(bcsTransaction);
      const signedTransaction = SignedTransaction.deserialize(deserializer);
      expect(signedTransaction instanceof SignedTransaction).toBeTruthy();
    });
  });
  describe("deriveTransactionType", () => {
    test("it derives the transaction type as a RawTransaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = generateTransactionPayload({
        function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
        functionArguments: [new MoveObject(bob.accountAddress), new U64(1)],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
      });
      const transactionType = deriveTransactionType(transaction);
      expect(transactionType instanceof RawTransaction).toBeTruthy();
    });

    test("it derives the transaction type as a FeePayerRawTransaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = generateTransactionPayload({
        function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
        functionArguments: [new MoveObject(bob.accountAddress), new U64(1)],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
        feePayerAddress: Account.generate().accountAddress.toString(),
      });

      const transactionType = deriveTransactionType(transaction);
      expect(transactionType instanceof FeePayerRawTransaction).toBeTruthy();
    });

    test("it derives the transaction type as a MultiAgentRawTransaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = generateTransactionPayload({
        function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
        functionArguments: [new MoveObject(bob.accountAddress), new U64(1)],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress.toString(),
        payload,
        secondarySignerAddresses: [Account.generate().accountAddress.toString()],
      });
      const transactionType = deriveTransactionType(transaction);
      expect(transactionType instanceof MultiAgentRawTransaction).toBeTruthy();
    });
  });
});
