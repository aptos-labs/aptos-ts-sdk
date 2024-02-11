// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  Aptos,
  AptosConfig,
  Deserializer,
  Network,
  U64,
  AccountAddress,
  EntryFunctionABI,
  parseTypeTag,
  AccountAuthenticator,
  AccountAuthenticatorEd25519,
  FeePayerRawTransaction,
  MultiAgentRawTransaction,
  RawTransaction,
  TransactionPayloadEntryFunction,
  TransactionPayloadMultiSig,
  TransactionPayloadScript,
  buildTransaction,
  deriveTransactionType,
  generateRawTransaction,
  generateSignedTransaction,
  generateSignedTransactionForSimulation,
  generateTransactionPayload,
  generateTransactionPayloadWithABI,
  sign,
  SignedTransaction,
} from "../../../src";
import { FUND_AMOUNT, longTestTimeout } from "../../unit/helper";
import { fundAccounts, multiSignerScriptBytecode, publishTransferPackage } from "./helper";

const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);
/* eslint-disable max-len */
describe("transaction builder", () => {
  // TODO: The example function deployed here has all the arguments backwards from normal transfers, we should fix that
  const contractPublisherAccount = Account.generate();
  beforeAll(async () => {
    await fundAccounts(aptos, [contractPublisherAccount]);
    await publishTransferPackage(aptos, contractPublisherAccount);
  }, longTestTimeout);
  describe("generate transaction payload", () => {
    test("it generates a script transaction payload", async () => {
      const payload = await generateTransactionPayload({
        bytecode: multiSignerScriptBytecode,
        functionArguments: [
          new U64(100),
          new U64(200),
          Account.generate().accountAddress,
          Account.generate().accountAddress,
          new U64(50),
        ],
      });
      expect(payload instanceof TransactionPayloadScript).toBeTruthy();
    });
    test("it generates a multi sig transaction payload", async () => {
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        multisigAddress: Account.generate().accountAddress,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [200, "0x1"],
      });
      expect(payload instanceof TransactionPayloadMultiSig).toBeTruthy();
    });
    test("it generates an entry function transaction payload", async () => {
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [200, "0x1"],
      });
      expect(payload instanceof TransactionPayloadEntryFunction).toBeTruthy();
    });
    test("it generates an entry function transaction payload with encoded inputs", async () => {
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [100, AccountAddress.ONE],
      });
      expect(payload instanceof TransactionPayloadEntryFunction).toBeTruthy();
    });
    test("it generates an entry function transaction payload with mixed arguments", async () => {
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: ["0x2", AccountAddress.ONE],
      });
      expect(payload instanceof TransactionPayloadEntryFunction).toBeTruthy();
      const payload2 = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [10, "0x1"],
      });
      expect(payload2 instanceof TransactionPayloadEntryFunction).toBeTruthy();
    });
  });
  describe("generate transaction payload with preset ABI", () => {
    const functionAbi: EntryFunctionABI = {
      typeParameters: [],
      parameters: [parseTypeTag("address"), parseTypeTag("0x1::object::Object<T0>", { allowGenerics: true })],
    };

    test("it generates a multi sig transaction payload", async () => {
      const payload = generateTransactionPayloadWithABI({
        multisigAddress: Account.generate().accountAddress,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: ["0x1", "0x1"],
        abi: functionAbi,
      });
      expect(payload instanceof TransactionPayloadMultiSig).toBeTruthy();
    });
    test("it generates an entry function transaction payload", async () => {
      const payload = generateTransactionPayloadWithABI({
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: ["0x1", "0x1"],
        abi: functionAbi,
      });
      expect(payload instanceof TransactionPayloadEntryFunction).toBeTruthy();
    });
    test("it generates an entry function transaction payload with mixed arguments", async () => {
      const payload = generateTransactionPayloadWithABI({
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [AccountAddress.ONE, "0x1"],
        abi: functionAbi,
      });
      expect(payload instanceof TransactionPayloadEntryFunction).toBeTruthy();
      const payload2 = generateTransactionPayloadWithABI({
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: ["0x1", AccountAddress.ONE],
        abi: functionAbi,
      });
      expect(payload2 instanceof TransactionPayloadEntryFunction).toBeTruthy();
    });
  });
  describe("generate raw transaction", () => {
    test("it generates a raw transaction with script payload", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const payload = await generateTransactionPayload({
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
        sender: alice.accountAddress,
        payload,
      });
      expect(rawTxn instanceof RawTransaction).toBeTruthy();
      expect(rawTxn.payload instanceof TransactionPayloadScript).toBeTruthy();
    });

    test("it generates a raw transaction with a multi sig payload", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        multisigAddress: bob.accountAddress,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [1, bob.accountAddress],
      });
      const rawTxn = await generateRawTransaction({
        aptosConfig: config,
        sender: alice.accountAddress,
        payload,
      });
      expect(rawTxn instanceof RawTransaction).toBeTruthy();
      expect(rawTxn.payload instanceof TransactionPayloadMultiSig).toBeTruthy();
    });

    test("it generates a raw transaction with an entry function payload", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [1, bob.accountAddress],
      });
      const rawTxn = await generateRawTransaction({
        aptosConfig: config,
        sender: alice.accountAddress,
        payload,
      });
      expect(rawTxn instanceof RawTransaction).toBeTruthy();
      expect(rawTxn.payload instanceof TransactionPayloadEntryFunction).toBeTruthy();
    });

    test("it uses the correct max gas amount value", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [1, bob.accountAddress],
      });
      const rawTxnWithCustomMaxGasAmount = await generateRawTransaction({
        aptosConfig: config,
        sender: alice.accountAddress,
        payload,
        options: { maxGasAmount: 20 },
      });
      expect(rawTxnWithCustomMaxGasAmount.max_gas_amount).toBe(20n);

      const rawTxnWithDefaultMaxGasAmount = await generateRawTransaction({
        aptosConfig: config,
        sender: alice.accountAddress,
        payload,
      });
      expect(rawTxnWithDefaultMaxGasAmount.max_gas_amount).toBe(200000n);
    });

    test("it generates a raw transaction with account not on chain and account sequence number set to 0", async () => {
      const alice = Account.generate();
      const bob = Account.generate();
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [1, bob.accountAddress],
      });
      const rawTransaction = await generateRawTransaction({
        aptosConfig: config,
        sender: alice.accountAddress,
        payload,
        options: { accountSequenceNumber: 0 },
      });
      expect(rawTransaction.sequence_number).toBe(0n);
      expect(() =>
        generateRawTransaction({
          aptosConfig: config,
          sender: alice.accountAddress,
          payload,
        }),
      ).rejects.toThrow();
    });
  });
  describe("generate transaction", () => {
    test("it returns a serialized raw transaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({
        accountAddress: alice.accountAddress,
        amount: FUND_AMOUNT,
        options: { waitForIndexer: true },
      });
      const payload = await generateTransactionPayload({
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
        sender: alice.accountAddress,
        payload,
      });
      expect(transaction.rawTransaction instanceof RawTransaction).toBeTruthy();
    });

    test("it returns a serialized raw transaction and secondary signers addresses", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [1, bob.accountAddress],
      });
      const secondarySignerAddress = Account.generate();
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress,
        payload,
        secondarySignerAddresses: [secondarySignerAddress.accountAddress],
      });
      expect(transaction.rawTransaction instanceof RawTransaction).toBeTruthy();
      expect(transaction.secondarySignerAddresses).not.toBeUndefined();
      expect(transaction.secondarySignerAddresses?.length).toBe(1);
      expect(transaction.secondarySignerAddresses![0].data).toStrictEqual(
        secondarySignerAddress.accountAddress.toUint8Array(),
      );
    });

    test("it returns a serialized raw transaction and a fee payer address", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [1, bob.accountAddress],
      });
      const feePayer = Account.generate();
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress,
        payload,
        feePayerAddress: feePayer.accountAddress,
      });
      expect(transaction.rawTransaction instanceof RawTransaction).toBeTruthy();
      expect(transaction.secondarySignerAddresses).toBe(undefined);
      expect(transaction.feePayerAddress).not.toBeUndefined();
      expect(transaction.feePayerAddress?.data).toStrictEqual(feePayer.accountAddress.toUint8Array());
    });

    test(
      "it returns a serialized raw transaction, secondary signers addresses and a fee payer address",
      async () => {
        const alice = Account.generate();
        await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
        const bob = Account.generate();
        const payload = await generateTransactionPayload({
          aptosConfig: config,
          function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
          functionArguments: [1, bob.accountAddress],
        });
        const feePayer = Account.generate();
        const secondarySignerAddress = Account.generate();
        const transaction = await buildTransaction({
          aptosConfig: config,
          sender: alice.accountAddress,
          payload,
          secondarySignerAddresses: [secondarySignerAddress.accountAddress],
          feePayerAddress: feePayer.accountAddress,
        });
        expect(transaction.rawTransaction instanceof RawTransaction).toBeTruthy();
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
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const payload = await generateTransactionPayload({
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
        sender: alice.accountAddress,
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
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const payload = await generateTransactionPayload({
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
        sender: alice.accountAddress,
        payload,
      });
      const accountAuthenticator = sign({
        signer: alice,
        transaction,
      });
      expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
      const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
      const authenticator = AccountAuthenticator.deserialize(deserializer);
      expect(authenticator instanceof AccountAuthenticatorEd25519).toBeTruthy();
    });

    test("it signs a fee payer transaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        multisigAddress: bob.accountAddress,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [1, bob.accountAddress],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress,
        payload,
        feePayerAddress: Account.generate().accountAddress,
      });
      const accountAuthenticator = sign({
        signer: alice,
        transaction,
      });
      expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
      const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
      const authenticator = AccountAuthenticator.deserialize(deserializer);
      expect(authenticator instanceof AccountAuthenticatorEd25519).toBeTruthy();
    });

    test("it signs a multi agent transaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = await generateTransactionPayload({
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
        sender: alice.accountAddress,
        payload,
        secondarySignerAddresses: [bob.accountAddress],
      });
      const accountAuthenticator = sign({
        signer: alice,
        transaction: rawTxn,
      });
      expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
      const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
      const authenticator = AccountAuthenticator.deserialize(deserializer);
      expect(authenticator instanceof AccountAuthenticatorEd25519).toBeTruthy();
    });
  });
  describe("generateSignedTransaction", () => {
    test("it generates a single signer signed transaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const payload = await generateTransactionPayload({
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
        sender: alice.accountAddress,
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
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const bob = await Account.generate();
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [1, bob.accountAddress],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress,
        payload,
        secondarySignerAddresses: [bob.accountAddress],
      });
      const authenticator = sign({ signer: alice, transaction });
      const secondaryAuthenticator = sign({
        signer: bob,
        transaction,
      });
      const bcsTransaction = await generateSignedTransaction({
        transaction,
        senderAuthenticator: authenticator,
        additionalSignersAuthenticators: [secondaryAuthenticator],
      });
      expect(bcsTransaction instanceof Uint8Array).toBeTruthy();
      const deserializer = new Deserializer(bcsTransaction);
      const signedTransaction = SignedTransaction.deserialize(deserializer);
      expect(signedTransaction instanceof SignedTransaction).toBeTruthy();
    });

    test("it generates a fee payer signed transaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [1, bob.accountAddress],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress,
        payload,
        feePayerAddress: bob.accountAddress,
      });
      const authenticator = sign({ signer: alice, transaction });
      const feePayerAuthenticator = sign({
        signer: bob,
        transaction,
      });
      const bcsTransaction = await generateSignedTransaction({
        transaction,
        senderAuthenticator: authenticator,
        feePayerAuthenticator,
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
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [1, bob.accountAddress],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress,
        payload,
      });
      const transactionType = deriveTransactionType(transaction);
      expect(transactionType instanceof RawTransaction).toBeTruthy();
    });

    test("it derives the transaction type as a FeePayerRawTransaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [1, bob.accountAddress],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress,
        payload,
        feePayerAddress: Account.generate().accountAddress,
      });

      const transactionType = deriveTransactionType(transaction);
      expect(transactionType instanceof FeePayerRawTransaction).toBeTruthy();
    });

    test("it derives the transaction type as a MultiAgentRawTransaction", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      const bob = Account.generate();
      const payload = await generateTransactionPayload({
        aptosConfig: config,
        function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
        functionArguments: [1, bob.accountAddress],
      });
      const transaction = await buildTransaction({
        aptosConfig: config,
        sender: alice.accountAddress,
        payload,
        secondarySignerAddresses: [Account.generate().accountAddress],
      });
      const transactionType = deriveTransactionType(transaction);
      expect(transactionType instanceof MultiAgentRawTransaction).toBeTruthy();
    });
  });
});
