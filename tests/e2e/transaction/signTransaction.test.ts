import { AptosConfig, Network, Aptos, Account, Deserializer, U64, SigningSchemeInput } from "../../../src";
import {
  AccountAuthenticator,
  AccountAuthenticatorEd25519,
  AccountAuthenticatorSingleKey,
} from "../../../src/transactions/authenticator/account";
import { longTestTimeout } from "../../unit/helper";
import { fundAccounts, publishTransferPackage, singleSignerScriptBytecode } from "./helper";

const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);

describe("sign transaction", () => {
  const contractPublisherAccount = Account.generate();
  const singleSignerED25519SenderAccount = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
  const legacyED25519SenderAccount = Account.generate();
  const receiverAccounts = [Account.generate(), Account.generate()];
  const singleSignerSecp256k1Account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
  const secondarySignerAccount = Account.generate();
  const feePayerAccount = Account.generate();
  beforeAll(async () => {
    await fundAccounts(aptos, [
      contractPublisherAccount,
      singleSignerED25519SenderAccount,
      legacyED25519SenderAccount,
      singleSignerSecp256k1Account,
      ...receiverAccounts,
      secondarySignerAccount,
      feePayerAccount,
    ]);
    await publishTransferPackage(aptos, contractPublisherAccount);
  }, longTestTimeout);

  describe("it returns the current account authenticator", () => {
    describe("Single Sender ED25519", () => {
      test("it signs a script transaction", async () => {
        const rawTxn = await aptos.generate.transaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.sign.transaction({
          signer: singleSignerED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
      });
      test("it signs an entry function transaction", async () => {
        const rawTxn = await aptos.generate.transaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.sign.transaction({
          signer: singleSignerED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
      });
      test("it signs a multi sig transaction", async () => {
        const rawTxn = await aptos.generate.transaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.sign.transaction({
          signer: singleSignerED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
      });
    });
    describe("Single Sender Secp256k1", () => {
      test("it signs a script transaction", async () => {
        const rawTxn = await aptos.generate.transaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.sign.transaction({
          signer: singleSignerSecp256k1Account,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
      });
      test("it signs an entry function transaction", async () => {
        const rawTxn = await aptos.generate.transaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.sign.transaction({
          signer: singleSignerSecp256k1Account,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
      });
      test("it signs a multi sig transaction", async () => {
        const rawTxn = await aptos.generate.transaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.sign.transaction({
          signer: singleSignerED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
      });
    });
    describe("Legacy ED25519", () => {
      test("it signs a script transaction", async () => {
        const rawTxn = await aptos.generate.transaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.sign.transaction({
          signer: legacyED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorEd25519).toBeTruthy();
      });
      test("it signs an entry function transaction", async () => {
        const rawTxn = await aptos.generate.transaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.sign.transaction({
          signer: legacyED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorEd25519).toBeTruthy();
      });
      test("it signs a multi sig transaction", async () => {
        const rawTxn = await aptos.generate.transaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.sign.transaction({
          signer: legacyED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorEd25519).toBeTruthy();
      });
    });
  });
});
