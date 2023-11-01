// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network, SigningSchemeInput, U64 } from "../../../src";

describe("account api", () => {
  const FUND_AMOUNT = 100_000_000;

  describe("throws when account address in invalid", () => {
    test("it throws with a short account address", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      expect(async () =>
        aptos.getAccountInfo({
          accountAddress: "ca843279e3427144cead5e4d5999a3d0ca843279e3427144cead5e4d5999a3d0",
        }),
      ).rejects.toThrow("Hex string must start with a leading 0x.");
    });

    test("it throws when invalid account address", () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      expect(async () => aptos.getAccountInfo({ accountAddress: "0x123" })).rejects.toThrow(
        // eslint-disable-next-line max-len
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

    test("it fetches an account resource without a type", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountResource({
        accountAddress: "0x1",
        resourceType: "0x1::account::Account",
      });
      expect(data).toHaveProperty("sequence_number");
      expect(data.sequence_number).toBe("0");
      expect(data).toHaveProperty("authentication_key");
      expect(data.authentication_key).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
    });

    test("it fetches an account resource typed", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      type AccountRes = {
        authentication_key: string;
        coin_register_events: {
          counter: string;
          guid: {
            id: {
              addr: string;
              creation_num: string;
            };
          };
        };
        guid_creation_num: string;
        key_rotation_events: {
          counter: string;
          guid: {
            id: {
              addr: string;
              creation_num: string;
            };
          };
        };
        sequence_number: string;
      };

      const resource = await aptos.getAccountResource<AccountRes>({
        accountAddress: "0x1",
        resourceType: "0x1::account::Account",
      });
      expect(resource).toHaveProperty("sequence_number");
      expect(resource.sequence_number).toBe("0");
      expect(resource).toHaveProperty("authentication_key");
      expect(resource.authentication_key).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
    });

    test("it fetches account transactions", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const senderAccount = Account.generate();
      await aptos.fundAccount({
        accountAddress: senderAccount.accountAddress.toString(),
        amount: FUND_AMOUNT,
      });
      const bob = Account.generate();
      const rawTxn = await aptos.generateTransaction({
        sender: senderAccount.accountAddress.toString(),
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [bob.accountAddress, new U64(10)],
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
      const txn = await aptos.waitForTransaction({ transactionHash: response.hash });
      const accountTransactions = await aptos.getAccountTransactions({
        accountAddress: senderAccount.accountAddress.toString(),
      });
      expect(accountTransactions[0]).toStrictEqual(txn);
    });

    test("it fetches account transactions count", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const senderAccount = Account.generate();
      const response = await aptos.fundAccount({
        accountAddress: senderAccount.accountAddress.toString(),
        amount: FUND_AMOUNT,
      });

      await aptos.waitForTransaction({ transactionHash: response });
      const accountTransactionsCount = await aptos.getAccountTransactionsCount({
        accountAddress: senderAccount.accountAddress.toString(),
      });
      expect(accountTransactionsCount).toBe(1);
    });

    test("it fetches account coins data", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const senderAccount = Account.generate();
      const response = await aptos.fundAccount({
        accountAddress: senderAccount.accountAddress.toString(),
        amount: FUND_AMOUNT,
      });

      await aptos.waitForTransaction({ transactionHash: response });
      const accountCoinData = await aptos.getAccountCoinsData({
        accountAddress: senderAccount.accountAddress.toString(),
      });
      expect(accountCoinData[0].amount).toBe(FUND_AMOUNT);
      expect(accountCoinData[0].asset_type).toBe("0x1::aptos_coin::AptosCoin");
    });

    test("it fetches account coins count", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const senderAccount = Account.generate();
      const response = await aptos.fundAccount({
        accountAddress: senderAccount.accountAddress.toString(),
        amount: FUND_AMOUNT,
      });

      await aptos.waitForTransaction({ transactionHash: response });
      const accountCoinsCount = await aptos.getAccountCoinsCount({
        accountAddress: senderAccount.accountAddress.toString(),
      });
      expect(accountCoinsCount).toBe(1);
    });

    test("lookupOriginalAccountAddress - Look up account address before key rotation", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const account = Account.generate();

      // Fund and create account on-chain
      await aptos.fundAccount({ accountAddress: account.accountAddress.toString(), amount: FUND_AMOUNT });

      const lookupAccount = await aptos.lookupOriginalAccountAddress({
        authenticationKey: account.accountAddress.toString(),
      });
      expect(lookupAccount.toString()).toBe(account.accountAddress.toString());
    });

    describe("it derives an account from a private key", () => {
      test("single sender ed25519", async () => {
        const config = new AptosConfig({ network: Network.LOCAL });
        const aptos = new Aptos(config);
        const account = Account.generate();
        await aptos.fundAccount({ accountAddress: account.accountAddress.toString(), amount: 100 });

        const derivedAccount = await aptos.deriveAccountFromPrivateKey({ privateKey: account.privateKey });
        expect(derivedAccount).toStrictEqual(account);
      });
      test("single sender secp256k1", async () => {
        const config = new AptosConfig({ network: Network.LOCAL });
        const aptos = new Aptos(config);
        const account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });

        const derivedAccount = await aptos.deriveAccountFromPrivateKey({ privateKey: account.privateKey });
        expect(derivedAccount).toStrictEqual(account);
      });
      test("legacy ed25519", async () => {
        const config = new AptosConfig({ network: Network.LOCAL });
        const aptos = new Aptos(config);
        const account = Account.generate({ legacy: true });
        await aptos.fundAccount({ accountAddress: account.accountAddress.toString(), amount: 100 });

        const derivedAccount = await aptos.deriveAccountFromPrivateKey({ privateKey: account.privateKey });
        expect(derivedAccount).toStrictEqual(account);
      });
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

    test("it fetches an account resource with partial information", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountResource<{ authentication_key: string }>({
        accountAddress: "0x1",
        resourceType: "0x1::account::Account",
      });
      expect(data).toHaveProperty("authentication_key");
      expect(data.authentication_key).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
    });
  });

  describe("Key Rotation", () => {
    test("it should rotate ed25519 to ed25519 auth key correctly", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);

      // Current Account
      const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      await aptos.fundAccount({ accountAddress: account.accountAddress.toString(), amount: 1_000_000_000 });

      // account that holds the new key
      const rotateToPrivateKey = Ed25519PrivateKey.generate();

      // Rotate the key
      const pendingTxn = await aptos.rotateAuthKey({ fromAccount: account, toNewPrivateKey: rotateToPrivateKey });
      await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });

      // lookup original account address
      const lookupAccountAddress = await aptos.lookupOriginalAccountAddress({
        authenticationKey: Account.authKey({ publicKey: rotateToPrivateKey.publicKey() }).toString(),
      });

      // Check if the lookup account address is the same as the original account address
      expect(lookupAccountAddress.toString()).toBe(account.accountAddress.toString());
    });
  });
});
