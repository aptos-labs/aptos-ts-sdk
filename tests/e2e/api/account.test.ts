// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, Aptos, AptosConfig, Network } from "../../../src";
import { U64 } from "../../../src/bcs/serializable/move-primitives";
import { SigningScheme } from "../../../src/types";
import { sleep } from "../../../src/utils/helpers";

describe("account api", () => {
  const FUND_AMOUNT = 100_000_000;

  describe("throws when account address in invalid", () => {
    test("it throws with a short account address", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      expect(
        async () =>
          await aptos.getAccountInfo({
            accountAddress: "ca843279e3427144cead5e4d5999a3d0ca843279e3427144cead5e4d5999a3d0",
          }),
      ).rejects.toThrow("Hex string must start with a leading 0x.");
    });

    test("it throws when invalid account address", () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      expect(async () => await aptos.getAccountInfo({ accountAddress: "0x123" })).rejects.toThrow(
        "The given hex string 0x0000000000000000000000000000000000000000000000000000000000000123 is not a special address, it must be represented as 0x + 64 chars.",
      );
    });
  });

  describe("fetch data with account address as string", () => {
    test("it fetches account data", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountInfo({
        accountAddress: "0x1",
      });
      expect(data).toHaveProperty("sequence_number");
      expect(data.sequence_number).toBe("0");
      expect(data).toHaveProperty("authentication_key");
      expect(data.authentication_key).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
    });

    test("it fetches account modules", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountModules({
        accountAddress: "0x1",
      });
      expect(data.length).toBeGreaterThan(0);
    });

    test("it fetches an account module", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountModule({
        accountAddress: "0x1",
        moduleName: "coin",
      });
      expect(data).toHaveProperty("bytecode");
    });

    test("it fetches account resources", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountResources({
        accountAddress: "0x1",
      });
      expect(data.length).toBeGreaterThan(0);
    });

    test("it fetches an account resource", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountResource({
        accountAddress: "0x1",
        resourceType: "0x1::account::Account",
      });
      expect(data).toHaveProperty("type");
      expect(data.type).toBe("0x1::account::Account");
    });

    test("it fetches account transactions", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const senderAccount = Account.generate({ scheme: SigningScheme.Ed25519 });
      await aptos.fundAccount({ accountAddress: senderAccount.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate({ scheme: SigningScheme.Ed25519 });
      const rawTxn = await aptos.generateTransaction({
        sender: senderAccount.accountAddress.toString(),
        data: {
          function: "0x1::aptos_account::transfer",
          type_arguments: [],
          arguments: [bob.accountAddress, new U64(10)],
        },
      });
      const authenticator = aptos.signTransaction({
        signer: senderAccount,
        transaction: rawTxn,
      });
      const response = await aptos.submitTransaction({
        transaction: rawTxn,
        senderAuthenticator: authenticator,
      });
      const txn = await aptos.waitForTransaction({ txnHash: response.hash });
      const accountTransactions = await aptos.getAccountTransactions({
        accountAddress: senderAccount.accountAddress.toString(),
      });
      expect(accountTransactions[0]).toStrictEqual(txn);
    });

    test("it fetches account transactions count", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const senderAccount = Account.generate({ scheme: SigningScheme.Ed25519 });
      const response = await aptos.fundAccount({
        accountAddress: senderAccount.accountAddress.toString(),
        amount: FUND_AMOUNT,
      });

      await aptos.waitForTransaction({ txnHash: response });
      const accountTransactionsCount = await aptos.getAccountTransactionsCount({
        accountAddress: senderAccount.accountAddress.toString(),
      });
      expect(accountTransactionsCount?.count).toBe(1);
    });

    test("it fetches account coins data", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const senderAccount = Account.generate({ scheme: SigningScheme.Ed25519 });
      const response = await aptos.fundAccount({
        accountAddress: senderAccount.accountAddress.toString(),
        amount: FUND_AMOUNT,
      });

      await aptos.waitForTransaction({ txnHash: response });
      // to help with indexer latency
      await sleep(1000);
      const accountCoinData = await aptos.getAccountCoinsData({
        accountAddress: senderAccount.accountAddress.toString(),
      });
      expect(accountCoinData[0].amount).toBe(FUND_AMOUNT);
      expect(accountCoinData[0].asset_type).toBe("0x1::aptos_coin::AptosCoin");
    });

    test("it fetches account coins count", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const senderAccount = Account.generate({ scheme: SigningScheme.Ed25519 });
      const response = await aptos.fundAccount({
        accountAddress: senderAccount.accountAddress.toString(),
        amount: FUND_AMOUNT,
      });

      await aptos.waitForTransaction({ txnHash: response });
      const accountCoinsCount = await aptos.getAccountCoinsCount({
        accountAddress: senderAccount.accountAddress.toString(),
      });
      expect(accountCoinsCount?.count).toBe(1);
    });

    test("lookupOriginalAccountAddress - Look up account address before key rotation", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const account = Account.generate({ scheme: SigningScheme.Ed25519 });

      // Fund and create account onchain
      await aptos.fundAccount({ accountAddress: account.accountAddress.toString(), amount: FUND_AMOUNT });

      const lookupAccount = await aptos.lookupOriginalAccountAddress({
        authenticationKey: account.accountAddress.toString(),
      });
      expect(lookupAccount.toString()).toBe(account.accountAddress.toString());
    });
  });

  describe("fetch data with account address as Uint8Array", () => {
    test("it fetches account data", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountInfo({
        accountAddress: new Uint8Array([
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        ]),
      });
      expect(data).toHaveProperty("sequence_number");
      expect(data.sequence_number).toBe("0");
      expect(data).toHaveProperty("authentication_key");
      expect(data.authentication_key).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
    });

    test("it fetches account modules", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountModules({
        accountAddress: new Uint8Array([
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        ]),
      });
      expect(data.length).toBeGreaterThan(0);
    });

    test("it fetches an account module", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountModule({
        accountAddress: new Uint8Array([
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        ]),
        moduleName: "coin",
      });
      expect(data).toHaveProperty("bytecode");
    });

    test("it fetches account resources", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountResources({
        accountAddress: new Uint8Array([
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        ]),
      });
      expect(data.length).toBeGreaterThan(0);
    });

    test("it fetches an account resource", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountResource({
        accountAddress: "0x1",
        resourceType: "0x1::account::Account",
      });
      expect(data).toHaveProperty("type");
      expect(data.type).toBe("0x1::account::Account");
    });
  });
});
