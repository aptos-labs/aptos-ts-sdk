// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  APTOS_COIN,
  Account,
  Cedra,
  CedraConfig,
  Ed25519PrivateKey,
  Network,
  SigningSchemeInput,
  U64,
  AccountAddress,
  MultiKeyAccount,
  MultiEd25519Account,
  MultiEd25519PublicKey,
} from "../../../src";
import { getCedraClient } from "../helper";
import { simpleCoinTransactionHeler } from "../transaction/helper";

describe("account api", () => {
  const FUND_AMOUNT = 100_000_000;

  describe("fetch data", () => {
    test("it fetches account data", async () => {
      const { cedra } = getCedraClient();
      const data = await cedra.getAccountInfo({
        accountAddress: "0x1",
      });
      expect(data).toHaveProperty("sequence_number");
      expect(data.sequence_number).toBe("0");
      expect(data).toHaveProperty("authentication_key");
      expect(data.authentication_key).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
    });

    test("it fetches account modules", async () => {
      const { cedra } = getCedraClient();
      const data = await cedra.getAccountModules({
        accountAddress: "0x1",
      });
      expect(data.length).toBeGreaterThan(0);
    });

    test("it fetches account modules with a limit", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      const data = await cedra.getAccountModules({
        accountAddress: "0x1",
        options: {
          limit: 1,
        },
      });
      expect(data.length).toEqual(1);
    });

    test("it fetches account modules with pagination", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      let { modules, cursor } = await cedra.getAccountModulesPage({
        accountAddress: "0x1",
        options: {
          limit: 1,
        },
      });
      expect(modules.length).toEqual(1);
      expect(cursor).toBeDefined();
      while (true) {
        const { modules: modules2, cursor: cursor2 } = await cedra.getAccountModulesPage({
          accountAddress: "0x1",
          options: {
            cursor,
          },
        });
        expect(modules2.length).toBeGreaterThan(0);
        expect(modules2).not.toContain(modules[0]);
        if (cursor2 === undefined) {
          break;
        }
        cursor = cursor2;
      }
    });

    test("it fetches an account module", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      const data = await cedra.getAccountModule({
        accountAddress: "0x1",
        moduleName: "coin",
      });
      expect(data).toHaveProperty("bytecode");
    });

    test("it fetches account resources", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      const data = await cedra.getAccountResources({
        accountAddress: "0x1",
      });
      expect(data.length).toBeGreaterThan(0);
    });

    test("it fetches account resources with a limit", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      const data = await cedra.getAccountResources({
        accountAddress: "0x1",
        options: {
          limit: 1,
        },
      });
      expect(data.length).toEqual(1);
    });

    test("it fetches account resources with pagination", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      const { resources, cursor } = await cedra.getAccountResourcesPage({
        accountAddress: "0x1",
        options: {
          limit: 1,
        },
      });
      expect(resources.length).toEqual(1);
      expect(cursor).toBeDefined();

      const { resources: resources2, cursor: cursor2 } = await cedra.getAccountResourcesPage({
        accountAddress: "0x1",
        options: {
          cursor,
        },
      });
      expect(resources2.length).toBeGreaterThan(0);
      expect(cursor2).toBeUndefined();
      expect(resources2).not.toContain(resources[0]);
    });

    test("it fetches an account resource without a type", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      const data = await cedra.getAccountResource({
        accountAddress: "0x1",
        resourceType: "0x1::account::Account",
      });
      expect(data).toHaveProperty("sequence_number");
      expect(data.sequence_number).toBe("0");
      expect(data).toHaveProperty("authentication_key");
      expect(data.authentication_key).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
    });

    test("it fetches an account resource typed", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
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

      const resource = await cedra.getAccountResource<AccountRes>({
        accountAddress: "0x1",
        resourceType: "0x1::account::Account",
      });
      expect(resource).toHaveProperty("sequence_number");
      expect(resource.sequence_number).toBe("0");
      expect(resource).toHaveProperty("authentication_key");
      expect(resource.authentication_key).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
    });

    test("it fetches account transactions", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      const senderAccount = Account.generate();
      await cedra.fundAccount({
        accountAddress: senderAccount.accountAddress,
        amount: FUND_AMOUNT,
      });
      const bob = Account.generate();
      const rawTxn = await cedra.transaction.build.simple({
        sender: senderAccount.accountAddress,
        data: {
          function: "0x1::cedra_account::transfer",
          functionArguments: [bob.accountAddress, new U64(10)],
        },
      });
      const authenticator = cedra.transaction.sign({
        signer: senderAccount,
        transaction: rawTxn,
      });
      const response = await cedra.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator: authenticator,
      });
      const txn = await cedra.waitForTransaction({ transactionHash: response.hash });
      const accountTransactions = await cedra.getAccountTransactions({
        accountAddress: senderAccount.accountAddress,
      });
      expect(accountTransactions[0]).toStrictEqual(txn);
    });

    test("it fetches account transactions count", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      const senderAccount = Account.generate();
      const response = await cedra.fundAccount({
        accountAddress: senderAccount.accountAddress,
        amount: FUND_AMOUNT,
      });

      await cedra.waitForTransaction({ transactionHash: response.hash });
      const accountTransactionsCount = await cedra.getAccountTransactionsCount({
        accountAddress: senderAccount.accountAddress,
      });
      expect(accountTransactionsCount).toBe(1);
    });

    test("it fetches account coins data", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      const senderAccount = Account.generate();
      const fundTxn = await cedra.fundAccount({
        accountAddress: senderAccount.accountAddress,
        amount: FUND_AMOUNT,
      });

      await cedra.waitForTransaction({ transactionHash: fundTxn.hash });
      const accountCoinData = await cedra.getAccountCoinsData({
        accountAddress: senderAccount.accountAddress,
      });
      expect(accountCoinData[0].amount).toBe(FUND_AMOUNT);
      expect(accountCoinData[0].asset_type).toBe("0x1::cedra_coin::CedraCoin");
    });

    test("it fetches account coins count", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      const senderAccount = Account.generate();
      const fundTxn = await cedra.fundAccount({
        accountAddress: senderAccount.accountAddress,
        amount: FUND_AMOUNT,
      });

      await cedra.waitForTransaction({ transactionHash: fundTxn.hash });
      const accountCoinsCount = await cedra.getAccountCoinsCount({
        accountAddress: senderAccount.accountAddress,
      });
      expect(accountCoinsCount).toBe(1);
    });

    test("it fetches account's coin amount", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      const senderAccount = Account.generate();
      const fundTxn = await cedra.fundAccount({
        accountAddress: senderAccount.accountAddress,
        amount: FUND_AMOUNT,
      });

      await cedra.waitForTransaction({ transactionHash: fundTxn.hash });
      // custom coin type that doesn't exist, will throw an error
      const getInvalidCoinAmount = cedra.getAccountCoinAmount({
        accountAddress: senderAccount.accountAddress,
        coinType: "0x12345::coin::Coin",
        minimumLedgerVersion: BigInt(fundTxn.version),
      });
      await expect(getInvalidCoinAmount).rejects.toThrow();
      // custom coin type struct that does exist, but is not a coin, will return 0, similar to a coin that exists
      const getOtherCoinAmount = await cedra.getAccountCoinAmount({
        accountAddress: senderAccount.accountAddress,
        coinType: "0x1::string::String",
        minimumLedgerVersion: BigInt(fundTxn.version),
      });
      expect(getOtherCoinAmount).toBe(0);

      // APT Cedra coin
      const accountAPTAmount = await cedra.getAccountCoinAmount({
        accountAddress: senderAccount.accountAddress,
        coinType: APTOS_COIN,
        minimumLedgerVersion: BigInt(fundTxn.version),
      });
      expect(accountAPTAmount).toBe(100000000);

      // APT Cedra coin by fungible asset metadata
      const accountAPTAmount2 = await cedra.getAccountCoinAmount({
        accountAddress: senderAccount.accountAddress,
        faMetadataAddress: AccountAddress.A,
        minimumLedgerVersion: BigInt(fundTxn.version),
      });
      expect(accountAPTAmount2).toBe(100000000);
      // By both
      // APT Cedra coin by fungible asset metadata
      const accountAPTAmount3 = await cedra.getAccountCoinAmount({
        accountAddress: senderAccount.accountAddress,
        coinType: APTOS_COIN,
        faMetadataAddress: "0xA",
        minimumLedgerVersion: BigInt(fundTxn.version),
      });
      expect(accountAPTAmount3).toBe(100000000);
      // By neither
      const failForNoCoinTypeGiven = cedra.getAccountCoinAmount({
        accountAddress: senderAccount.accountAddress,
        minimumLedgerVersion: BigInt(fundTxn.version),
      });
      await expect(failForNoCoinTypeGiven).rejects.toThrow();
    });

    test("lookupOriginalAccountAddress - Look up account address before key rotation", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      const account = Account.generate();

      // Fund and create account on-chain
      await cedra.fundAccount({ accountAddress: account.accountAddress, amount: FUND_AMOUNT });

      const lookupAccount = await cedra.lookupOriginalAccountAddress({
        authenticationKey: account.accountAddress,
      });
      expect(lookupAccount).toStrictEqual(account.accountAddress);
    });

    test("it fetches account owned token from collection", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);
      const creator = Account.generate();
      await cedra.fundAccount({ accountAddress: creator.accountAddress, amount: FUND_AMOUNT });
      const collectionCreationTransaction = await cedra.createCollectionTransaction({
        creator,
        description: "My new collection!",
        name: "Test Collection",
        uri: "Test Collection",
      });
      const pendingCollectionCreationTransaction = await cedra.signAndSubmitTransaction({
        signer: creator,
        transaction: collectionCreationTransaction,
      });
      await cedra.waitForTransaction({ transactionHash: pendingCollectionCreationTransaction.hash });
      const transaction = await cedra.mintDigitalAssetTransaction({
        creator,
        collection: "Test Collection",
        description: "My new collection!",
        name: "Test Token",
        uri: "http://cedra.dev/nft",
        propertyKeys: ["my bool key", "my array key"],
        propertyTypes: ["BOOLEAN", "ARRAY"],
        propertyValues: [false, "[value]"],
      });
      const pendingTxn = await cedra.signAndSubmitTransaction({ signer: creator, transaction });
      const response = await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });

      const address = await cedra.getCollectionId({
        collectionName: "Test Collection",
        creatorAddress: creator.accountAddress,
      });
      const tokens = await cedra.getAccountOwnedTokensFromCollectionAddress({
        accountAddress: creator.accountAddress,
        collectionAddress: address,
        minimumLedgerVersion: BigInt(response.version),
      });

      expect(tokens.length).toBe(1);
      expect(tokens[0].current_token_data?.token_name).toBe("Test Token");
    });

    describe("it derives an account from a private key", () => {
      test("single sender ed25519", async () => {
        const config = new CedraConfig({ network: Network.LOCAL });
        const cedra = new Cedra(config);
        const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
        await cedra.fundAccount({ accountAddress: account.accountAddress, amount: 100 });

        const derivedAccount = await cedra.deriveAccountFromPrivateKey({ privateKey: account.privateKey });
        // Note, this will now always return the legacy account
        expect(derivedAccount.accountAddress.equals(account.accountAddress)).toEqual(false);
      });
      test("single sender secp256k1", async () => {
        const config = new CedraConfig({ network: Network.LOCAL });
        const cedra = new Cedra(config);
        const account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });

        const derivedAccount = await cedra.deriveAccountFromPrivateKey({ privateKey: account.privateKey });
        expect(derivedAccount).toStrictEqual(account);
      });
      test("legacy ed25519", async () => {
        const config = new CedraConfig({ network: Network.LOCAL });
        const cedra = new Cedra(config);
        const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
        await cedra.fundAccount({ accountAddress: account.accountAddress, amount: 100 });

        const derivedAccount = await cedra.deriveAccountFromPrivateKey({ privateKey: account.privateKey });
        expect(derivedAccount).toStrictEqual(account);
      });
    });
  });

  describe("Key Rotation", () => {
    test("it should rotate ed25519 to ed25519 auth key correctly", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);

      // Current Account
      const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      await cedra.fundAccount({ accountAddress: account.accountAddress, amount: 1_000_000_000 });

      // account that holds the new key
      const rotateToPrivateKey = Ed25519PrivateKey.generate();

      // Rotate the key
      const pendingTxn = await cedra.rotateAuthKey({ fromAccount: account, toNewPrivateKey: rotateToPrivateKey });
      const response = await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });

      // lookup original account address
      const lookupAccountAddress = await cedra.lookupOriginalAccountAddress({
        authenticationKey: rotateToPrivateKey.publicKey().authKey().derivedAddress(),
        minimumLedgerVersion: BigInt(response.version),
      });

      // Check if the lookup account address is the same as the original account address
      expect(lookupAccountAddress).toStrictEqual(account.accountAddress);

      const rotatedAccount = Account.fromPrivateKey({
        privateKey: rotateToPrivateKey,
        address: account.accountAddress,
      });
      await simpleCoinTransactionHeler(cedra, rotatedAccount, Account.generate());
    }, 10000);

    test("it should rotate ed25519 to multi-ed25519 auth key correctly", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);

      // Current Account
      const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      await cedra.fundAccount({ accountAddress: account.accountAddress, amount: 1_000_000_000 });

      const mk1 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      const mk2 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      const multiEdAccount = new MultiEd25519Account({
        publicKey: new MultiEd25519PublicKey({
          publicKeys: [mk1.publicKey, mk2.publicKey],
          threshold: 1,
        }),
        signers: [mk1.privateKey],
      });

      // Rotate the key
      const pendingTxn = await cedra.rotateAuthKey({ fromAccount: account, toAccount: multiEdAccount });
      await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });

      const accountInfo = await cedra.account.getAccountInfo({
        accountAddress: account.accountAddress,
      });
      expect(accountInfo.authentication_key).toEqual(multiEdAccount.publicKey.authKey().toString());

      const rotatedAccount = new MultiEd25519Account({
        publicKey: new MultiEd25519PublicKey({
          publicKeys: [mk1.publicKey, mk2.publicKey],
          threshold: 1,
        }),
        signers: [mk1.privateKey],
        address: account.accountAddress,
      });
      await simpleCoinTransactionHeler(cedra, rotatedAccount, Account.generate());
    }, 10000);

    test("it should rotate ed25519 to multikey auth key correctly", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);

      // Current Account
      const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      await cedra.fundAccount({ accountAddress: account.accountAddress, amount: 1_000_000_000 });

      const mk1 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      const mk2 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      const multiKeyAccount = MultiKeyAccount.fromPublicKeysAndSigners({
        publicKeys: [mk1.publicKey, mk2.publicKey],
        signaturesRequired: 1,
        signers: [mk1],
      });

      // Rotate the key
      const pendingTxn = await cedra.rotateAuthKey({ fromAccount: account, toAccount: multiKeyAccount });
      await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });

      const accountInfo = await cedra.account.getAccountInfo({
        accountAddress: account.accountAddress,
      });
      expect(accountInfo.authentication_key).toEqual(multiKeyAccount.publicKey.authKey().toString());

      const rotatedAccount = MultiKeyAccount.fromPublicKeysAndSigners({
        address: account.accountAddress,
        publicKeys: [mk1.publicKey, mk2.publicKey],
        signaturesRequired: 1,
        signers: [mk1],
      });
      await simpleCoinTransactionHeler(cedra, rotatedAccount, Account.generate());
    }, 10000);

    test("it should rotate ed25519 to unverified auth key correctly", async () => {
      const config = new CedraConfig({ network: Network.LOCAL });
      const cedra = new Cedra(config);

      // Current Account
      const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      await cedra.fundAccount({ accountAddress: account.accountAddress, amount: 1_000_000_000 });

      // account that holds the new key
      const newAccount = Account.generate();
      const newAuthKey = newAccount.publicKey.authKey();

      // Rotate the key
      const pendingTxn = await cedra.rotateAuthKey({
        fromAccount: account,
        toAuthKey: newAuthKey,
        dangerouslySkipVerification: true,
      });
      await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });

      const accountInfo = await cedra.account.getAccountInfo({
        accountAddress: account.accountAddress,
      });
      expect(accountInfo.authentication_key).toEqual(newAuthKey.toString());

      const rotatedAccount = Account.fromPrivateKey({
        privateKey: newAccount.privateKey,
        address: newAccount.accountAddress,
      });
      await simpleCoinTransactionHeler(cedra, rotatedAccount, Account.generate());
    }, 10000);
  });
});
