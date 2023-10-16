import { AptosConfig, Network, Aptos, Account, Deserializer, U64 } from "../../../src";
import {
  RawTransaction,
  TransactionPayloadScript,
  TransactionPayloadMultisig,
  TransactionPayloadEntryFunction,
} from "../../../src/transactions/instances";
import { longTestTimeout } from "../../unit/helper";
import { fundAccounts, singleSignerScriptBytecode } from "./helper";

describe("generate transaction", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);
  const senderAccount = Account.generate();
  const recieverAccounts = [Account.generate(), Account.generate()];
  const secondarySignerAccount = Account.generate();
  const feePayerAccount = Account.generate();
  beforeAll(async () => {
    await fundAccounts(aptos, [senderAccount, ...recieverAccounts, secondarySignerAccount, feePayerAccount]);
  }, longTestTimeout);

  describe("single signer transaction", () => {
    test("with script payload", async () => {
      const transaction = await aptos.generateTransaction({
        sender: senderAccount.accountAddress.toString(),
        data: {
          bytecode: singleSignerScriptBytecode,
          type_arguments: [],
          arguments: [new U64(1), recieverAccounts[0].accountAddress],
        },
      });
      expect(transaction.rawTransaction instanceof Uint8Array).toBeTruthy();
      expect(transaction.secondarySignerAddresses).not.toBeDefined();
      expect(transaction.feePayerAddress).not.toBeDefined();
      const deserializer = new Deserializer(transaction.rawTransaction);
      const deserializedTransaction = RawTransaction.deserialize(deserializer);
      expect(deserializedTransaction instanceof RawTransaction).toBeTruthy();
      expect(deserializedTransaction.payload instanceof TransactionPayloadScript).toBeTruthy();
    });
    test("with multi sig payload", async () => {
      const transaction = await aptos.generateTransaction({
        sender: senderAccount.accountAddress.toString(),
        data: {
          multisigAddress: secondarySignerAccount.accountAddress,
          function: "0x0000000000000000000000000000000000000000000000000000000000000123::module::name",
          type_arguments: [],
          arguments: [new U64(1), recieverAccounts[0].accountAddress],
        },
      });
      expect(transaction.rawTransaction instanceof Uint8Array).toBeTruthy();
      expect(transaction.secondarySignerAddresses).not.toBeDefined();
      expect(transaction.feePayerAddress).not.toBeDefined();
      const deserializer = new Deserializer(transaction.rawTransaction);
      const deserializedTransaction = RawTransaction.deserialize(deserializer);
      expect(deserializedTransaction instanceof RawTransaction).toBeTruthy();
      expect(deserializedTransaction.payload instanceof TransactionPayloadMultisig).toBeTruthy();
    });

    test("it generates an entry function transaction", async () => {
      const transaction = await aptos.generateTransaction({
        sender: senderAccount.accountAddress.toString(),
        data: {
          function: "0x0000000000000000000000000000000000000000000000000000000000000123::module::name",
          type_arguments: [],
          arguments: [new U64(1), recieverAccounts[0].accountAddress],
        },
      });
      expect(transaction.rawTransaction instanceof Uint8Array).toBeTruthy();
      expect(transaction.secondarySignerAddresses).not.toBeDefined();
      expect(transaction.feePayerAddress).not.toBeDefined();
      const deserializer = new Deserializer(transaction.rawTransaction);
      const deserializedTransaction = RawTransaction.deserialize(deserializer);
      expect(deserializedTransaction instanceof RawTransaction).toBeTruthy();
      expect(deserializedTransaction.payload instanceof TransactionPayloadEntryFunction).toBeTruthy();
    });
  });

  describe("multi agent transaction", () => {
    test("with script payload", async () => {
      const transaction = await aptos.generateTransaction({
        sender: senderAccount.accountAddress.toString(),
        secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
        data: {
          bytecode: singleSignerScriptBytecode,
          type_arguments: [],
          arguments: [new U64(1), recieverAccounts[0].accountAddress],
        },
      });
      expect(transaction.rawTransaction instanceof Uint8Array).toBeTruthy();
      expect(transaction.secondarySignerAddresses[0]).toStrictEqual(secondarySignerAccount.accountAddress);
      expect(transaction.feePayerAddress).not.toBeDefined();
      const deserializer = new Deserializer(transaction.rawTransaction);
      const deserializedTransaction = RawTransaction.deserialize(deserializer);
      expect(deserializedTransaction instanceof RawTransaction).toBeTruthy();
      expect(deserializedTransaction.payload instanceof TransactionPayloadScript).toBeTruthy();
    });

    test("with entry function transaction", async () => {
      const transaction = await aptos.generateTransaction({
        sender: senderAccount.accountAddress.toString(),
        secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
        data: {
          function: "0x0000000000000000000000000000000000000000000000000000000000000123::module::name",
          type_arguments: [],
          arguments: [new U64(1), recieverAccounts[0].accountAddress],
        },
      });
      expect(transaction.rawTransaction instanceof Uint8Array).toBeTruthy();
      expect(transaction.secondarySignerAddresses[0]).toStrictEqual(secondarySignerAccount.accountAddress);
      expect(transaction.feePayerAddress).not.toBeDefined();
      const deserializer = new Deserializer(transaction.rawTransaction);
      const deserializedTransaction = RawTransaction.deserialize(deserializer);
      expect(deserializedTransaction instanceof RawTransaction).toBeTruthy();
      expect(deserializedTransaction.payload instanceof TransactionPayloadEntryFunction).toBeTruthy();
    });
  });

  describe("fee payer transaction", () => {
    test("with script payload", async () => {
      const transaction = await aptos.generateTransaction({
        sender: senderAccount.accountAddress.toString(),
        feePayerAddress: feePayerAccount.accountAddress.toString(),
        data: {
          bytecode: singleSignerScriptBytecode,
          type_arguments: [],
          arguments: [new U64(1), recieverAccounts[0].accountAddress],
        },
      });
      expect(transaction.rawTransaction instanceof Uint8Array).toBeTruthy();
      expect(transaction.feePayerAddress).toStrictEqual(feePayerAccount.accountAddress);
      expect(transaction.secondarySignerAddresses?.length).toBe(0);
      const deserializer = new Deserializer(transaction.rawTransaction);
      const deserializedTransaction = RawTransaction.deserialize(deserializer);
      expect(deserializedTransaction instanceof RawTransaction).toBeTruthy();
      expect(deserializedTransaction.payload instanceof TransactionPayloadScript).toBeTruthy();
    });

    test("with multi sig payload", async () => {
      const transaction = await aptos.generateTransaction({
        sender: senderAccount.accountAddress.toString(),
        feePayerAddress: feePayerAccount.accountAddress.toString(),
        data: {
          multisigAddress: secondarySignerAccount.accountAddress,
          function: "0x0000000000000000000000000000000000000000000000000000000000000123::module::name",
          type_arguments: [],
          arguments: [new U64(1), recieverAccounts[0].accountAddress],
        },
      });
      expect(transaction.rawTransaction instanceof Uint8Array).toBeTruthy();
      expect(transaction.secondarySignerAddresses?.length).toBe(0);
      expect(transaction.feePayerAddress).toStrictEqual(feePayerAccount.accountAddress);
      const deserializer = new Deserializer(transaction.rawTransaction);
      const deserializedTransaction = RawTransaction.deserialize(deserializer);
      expect(deserializedTransaction instanceof RawTransaction).toBeTruthy();
      expect(deserializedTransaction.payload instanceof TransactionPayloadMultisig).toBeTruthy();
    });

    test("with entry function transaction", async () => {
      const transaction = await aptos.generateTransaction({
        sender: senderAccount.accountAddress.toString(),
        feePayerAddress: feePayerAccount.accountAddress.toString(),
        data: {
          function: "0x0000000000000000000000000000000000000000000000000000000000000123::module::name",
          type_arguments: [],
          arguments: [new U64(1), recieverAccounts[0].accountAddress],
        },
      });
      expect(transaction.rawTransaction instanceof Uint8Array).toBeTruthy();
      expect(transaction.secondarySignerAddresses?.length).toBe(0);
      expect(transaction.feePayerAddress).toStrictEqual(feePayerAccount.accountAddress);
      const deserializer = new Deserializer(transaction.rawTransaction);
      const deserializedTransaction = RawTransaction.deserialize(deserializer);
      expect(deserializedTransaction instanceof RawTransaction).toBeTruthy();
      expect(deserializedTransaction.payload instanceof TransactionPayloadEntryFunction).toBeTruthy();
    });

    test("as a multi agent", async () => {
      const transaction = await aptos.generateTransaction({
        sender: senderAccount.accountAddress.toString(),
        secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
        feePayerAddress: feePayerAccount.accountAddress.toString(),
        data: {
          function: "0x0000000000000000000000000000000000000000000000000000000000000123::module::name",
          type_arguments: [],
          arguments: [new U64(1), recieverAccounts[0].accountAddress],
        },
      });
      expect(transaction.rawTransaction instanceof Uint8Array).toBeTruthy();
      expect(transaction.secondarySignerAddresses![0]).toStrictEqual(secondarySignerAccount.accountAddress);
      expect(transaction.feePayerAddress).toStrictEqual(feePayerAccount.accountAddress);
      const deserializer = new Deserializer(transaction.rawTransaction);
      const deserializedTransaction = RawTransaction.deserialize(deserializer);
      expect(deserializedTransaction instanceof RawTransaction).toBeTruthy();
      expect(deserializedTransaction.payload instanceof TransactionPayloadEntryFunction).toBeTruthy();
    });
  });
});
