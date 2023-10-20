import { AptosConfig, Network, Aptos, Account, Deserializer, U64, SigningScheme } from "../../../src";
import {
  AccountAuthenticator,
  AccountAuthenticatorEd25519,
  AccountAuthenticatorSecp256k1,
} from "../../../src/transactions/authenticator/account";
import { longTestTimeout } from "../../unit/helper";
import { fundAccounts, publishTransferPackage, singleSignerScriptBytecode } from "./helper";

describe("sign transaction", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);
  const senderAccount = Account.generate();
  const recieverAccounts = [Account.generate(), Account.generate()];
  const senderSecp256k1Account = Account.generate(SigningScheme.Secp256k1Ecdsa);
  const secondarySignerAccount = Account.generate();
  const feePayerAccount = Account.generate();
  beforeAll(async () => {
    await fundAccounts(aptos, [
      senderAccount,
      senderSecp256k1Account,
      ...recieverAccounts,
      secondarySignerAccount,
      feePayerAccount,
    ]);
    await publishTransferPackage(aptos, senderAccount);
  }, longTestTimeout);

  describe("it returns the current account authenticator", () => {
    describe("ED25519", () => {
      test("it signs a script transaction", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.signTransaction({
          signer: senderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorEd25519).toBeTruthy();
      });
      test("it signs an entry function transaction", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.signTransaction({
          signer: senderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorEd25519).toBeTruthy();
      });
      test("it signs a multi sig transaction", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.signTransaction({
          signer: senderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorEd25519).toBeTruthy();
      });
    });

    describe.skip("Secp256k1", () => {
      test("it signs a script transaction", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.signTransaction({
          signer: senderSecp256k1Account,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSecp256k1).toBeTruthy();
      });
      test("it signs an entry function transaction", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.signTransaction({
          signer: senderSecp256k1Account,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSecp256k1).toBeTruthy();
      });
      test("it signs a multi sig transaction", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.signTransaction({
          signer: senderSecp256k1Account,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSecp256k1).toBeTruthy();
      });
    });
  });
});
