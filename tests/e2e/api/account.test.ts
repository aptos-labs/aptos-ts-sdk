// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  APTOS_COIN,
  Account,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
  SigningSchemeInput,
  U64,
  AccountAddress,
  MultiKeyAccount,
  MultiEd25519Account,
  MultiEd25519PublicKey,
  CommittedTransactionResponse,
} from "../../../src";
import { getAptosClient } from "../helper";
import { simpleCoinTransactionHeler } from "../transaction/helper";

describe("account api", () => {
  const FUND_AMOUNT = 100_000_000;

  describe("fetch data", () => {
    test("it fetches account data", async () => {
      const { aptos } = getAptosClient();
      const data = await aptos.getAccountInfo({
        accountAddress: "0x1",
      });
      expect(data).toHaveProperty("sequence_number");
      expect(data.sequence_number).toBe("0");
      expect(data).toHaveProperty("authentication_key");
      expect(data.authentication_key).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
    });

    test("it fetches account modules", async () => {
      const { aptos } = getAptosClient();
      const data = await aptos.getAccountModules({
        accountAddress: "0x1",
      });
      expect(data.length).toBeGreaterThan(0);
    });

    test("it fetches account modules with a limit", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountModules({
        accountAddress: "0x1",
        options: {
          limit: 1,
        },
      });
      expect(data.length).toEqual(1);
    });

    test("it fetches account modules with pagination", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      let { modules, cursor } = await aptos.getAccountModulesPage({
        accountAddress: "0x1",
        options: {
          limit: 1,
        },
      });
      expect(modules.length).toEqual(1);
      expect(cursor).toBeDefined();
      while (true) {
        const { modules: modules2, cursor: cursor2 } = await aptos.getAccountModulesPage({
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

    test("it fetches account resources with a limit", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const data = await aptos.getAccountResources({
        accountAddress: "0x1",
        options: {
          limit: 1,
        },
      });
      expect(data.length).toEqual(1);
    });

    test("it fetches account resources with pagination", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const { resources, cursor } = await aptos.getAccountResourcesPage({
        accountAddress: "0x1",
        options: {
          limit: 1,
        },
      });
      expect(resources.length).toEqual(1);
      expect(cursor).toBeDefined();

      const { resources: resources2, cursor: cursor2 } = await aptos.getAccountResourcesPage({
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
        accountAddress: senderAccount.accountAddress,
        amount: FUND_AMOUNT,
      });
      const bob = Account.generate();
      const rawTxn = await aptos.transaction.build.simple({
        sender: senderAccount.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [bob.accountAddress, new U64(10)],
        },
      });
      const authenticator = aptos.transaction.sign({
        signer: senderAccount,
        transaction: rawTxn,
      });
      const response = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator: authenticator,
      });
      const txn = await aptos.waitForTransaction({ transactionHash: response.hash });
      const accountTransactions = await aptos.getAccountTransactions({
        accountAddress: senderAccount.accountAddress,
      });
      expect(accountTransactions[0]).toStrictEqual(txn);
    });

    test("it fetches account transactions count", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const senderAccount = Account.generate();
      const response = await aptos.fundAccount({
        accountAddress: senderAccount.accountAddress,
        amount: FUND_AMOUNT,
      });

      await aptos.waitForTransaction({ transactionHash: response.hash });
      const accountTransactionsCount = await aptos.getAccountTransactionsCount({
        accountAddress: senderAccount.accountAddress,
      });
      expect(accountTransactionsCount).toBe(1);
    });

    test("it fetches account coins data", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const senderAccount = Account.generate();
      const fundTxn = await aptos.fundAccount({
        accountAddress: senderAccount.accountAddress,
        amount: FUND_AMOUNT,
      });

      await aptos.waitForTransaction({ transactionHash: fundTxn.hash });
      const accountCoinData = await aptos.getAccountCoinsData({
        accountAddress: senderAccount.accountAddress,
      });
      expect(accountCoinData[0].amount).toBe(FUND_AMOUNT);
      expect(accountCoinData[0].asset_type).toBe("0x1::aptos_coin::AptosCoin");
    });

    test("it fetches account coins count", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const senderAccount = Account.generate();
      const fundTxn = await aptos.fundAccount({
        accountAddress: senderAccount.accountAddress,
        amount: FUND_AMOUNT,
      });

      await aptos.waitForTransaction({ transactionHash: fundTxn.hash });
      const accountCoinsCount = await aptos.getAccountCoinsCount({
        accountAddress: senderAccount.accountAddress,
      });
      expect(accountCoinsCount).toBe(1);
    });

    test("it fetches account's coin amount", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const senderAccount = Account.generate();
      const fundTxn = await aptos.fundAccount({
        accountAddress: senderAccount.accountAddress,
        amount: FUND_AMOUNT,
      });

      await aptos.waitForTransaction({ transactionHash: fundTxn.hash });
      // custom coin type that doesn't exist, will throw an error
      const getInvalidCoinAmount = aptos.getAccountCoinAmount({
        accountAddress: senderAccount.accountAddress,
        coinType: "0x12345::coin::Coin",
        minimumLedgerVersion: BigInt(fundTxn.version),
      });
      await expect(getInvalidCoinAmount).rejects.toThrow();
      // custom coin type struct that does exist, but is not a coin, will return 0, similar to a coin that exists
      const getOtherCoinAmount = await aptos.getAccountCoinAmount({
        accountAddress: senderAccount.accountAddress,
        coinType: "0x1::string::String",
        minimumLedgerVersion: BigInt(fundTxn.version),
      });
      expect(getOtherCoinAmount).toBe(0);

      // APT Aptos coin
      const accountAPTAmount = await aptos.getAccountCoinAmount({
        accountAddress: senderAccount.accountAddress,
        coinType: APTOS_COIN,
        minimumLedgerVersion: BigInt(fundTxn.version),
      });
      expect(accountAPTAmount).toBe(100000000);

      // APT Aptos coin by fungible asset metadata
      const accountAPTAmount2 = await aptos.getAccountCoinAmount({
        accountAddress: senderAccount.accountAddress,
        faMetadataAddress: AccountAddress.A,
        minimumLedgerVersion: BigInt(fundTxn.version),
      });
      expect(accountAPTAmount2).toBe(100000000);
      // By both
      // APT Aptos coin by fungible asset metadata
      const accountAPTAmount3 = await aptos.getAccountCoinAmount({
        accountAddress: senderAccount.accountAddress,
        coinType: APTOS_COIN,
        faMetadataAddress: "0xA",
        minimumLedgerVersion: BigInt(fundTxn.version),
      });
      expect(accountAPTAmount3).toBe(100000000);
      // By neither
      const failForNoCoinTypeGiven = aptos.getAccountCoinAmount({
        accountAddress: senderAccount.accountAddress,
        minimumLedgerVersion: BigInt(fundTxn.version),
      });
      await expect(failForNoCoinTypeGiven).rejects.toThrow();
    });

    test("lookupOriginalAccountAddress - Look up account address before key rotation", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const account = Account.generate();

      // Fund and create account on-chain
      await aptos.fundAccount({ accountAddress: account.accountAddress, amount: FUND_AMOUNT });

      const lookupAccount = await aptos.lookupOriginalAccountAddress({
        authenticationKey: account.accountAddress,
      });
      expect(lookupAccount).toStrictEqual(account.accountAddress);
    });

    test("it fetches account owned token from collection", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const creator = Account.generate();
      await aptos.fundAccount({ accountAddress: creator.accountAddress, amount: FUND_AMOUNT });
      const collectionCreationTransaction = await aptos.createCollectionTransaction({
        creator,
        description: "My new collection!",
        name: "Test Collection",
        uri: "Test Collection",
      });
      const pendingCollectionCreationTransaction = await aptos.signAndSubmitTransaction({
        signer: creator,
        transaction: collectionCreationTransaction,
      });
      await aptos.waitForTransaction({ transactionHash: pendingCollectionCreationTransaction.hash });
      const transaction = await aptos.mintDigitalAssetTransaction({
        creator,
        collection: "Test Collection",
        description: "My new collection!",
        name: "Test Token",
        uri: "http://aptos.dev/nft",
        propertyKeys: ["my bool key", "my array key"],
        propertyTypes: ["BOOLEAN", "ARRAY"],
        propertyValues: [false, "[value]"],
      });
      const pendingTxn = await aptos.signAndSubmitTransaction({ signer: creator, transaction });
      const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });

      const address = await aptos.getCollectionId({
        collectionName: "Test Collection",
        creatorAddress: creator.accountAddress,
      });
      const tokens = await aptos.getAccountOwnedTokensFromCollectionAddress({
        accountAddress: creator.accountAddress,
        collectionAddress: address,
        minimumLedgerVersion: BigInt(response.version),
      });

      expect(tokens.length).toBe(1);
      expect(tokens[0].current_token_data?.token_name).toBe("Test Token");
    });

    describe("it derives an account from a private key", () => {
      const config = new AptosConfig({
        network: Network.DEVNET,
      });
      const aptos = new Aptos(config);

      test("single sender ed25519", async () => {
        const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
        await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 100 });

        const derivedAccount = await aptos.deriveAccountFromPrivateKey({ privateKey: account.privateKey });
        expect(derivedAccount.accountAddress.equals(account.accountAddress)).toEqual(true);
      }, 15000);
      test("single sender secp256k1", async () => {
        const account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
        await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 100 });

        const derivedAccount = await aptos.deriveAccountFromPrivateKey({ privateKey: account.privateKey });
        expect(derivedAccount).toStrictEqual(account);
      });
      test("legacy ed25519", async () => {
        const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
        await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 100 });

        const derivedAccount = await aptos.deriveAccountFromPrivateKey({ privateKey: account.privateKey });
        expect(derivedAccount).toStrictEqual(account);
      });
      test("fails when account not created/funded and throwIfNoAccountFound is true", async () => {
        const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });

        expect(async () => {
          await aptos.deriveAccountFromPrivateKey({
            privateKey: account.privateKey,
            options: { throwIfNoAccountFound: true },
          });
        }).rejects.toThrow("No existing account found for private key.");
      });
      test("returns default legacy ed25519 account if no account exists", async () => {
        const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });

        const derivedAccount = await aptos.deriveAccountFromPrivateKey({
          privateKey: account.privateKey,
        });
        expect(derivedAccount).toStrictEqual(account);
      });
    });
  });

  describe("Key Rotation", () => {
    test("it should rotate ed25519 to ed25519 auth key correctly", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);

      // Current Account
      const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 1_000_000_000 });

      // account that holds the new key
      const rotateToPrivateKey = Ed25519PrivateKey.generate();

      // Rotate the key
      const pendingTxn = await aptos.rotateAuthKey({ fromAccount: account, toNewPrivateKey: rotateToPrivateKey });
      const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });

      // lookup original account address
      const lookupAccountAddress = await aptos.lookupOriginalAccountAddress({
        authenticationKey: rotateToPrivateKey.publicKey().authKey().derivedAddress(),
        minimumLedgerVersion: BigInt(response.version),
      });

      // Check if the lookup account address is the same as the original account address
      expect(lookupAccountAddress).toStrictEqual(account.accountAddress);

      const rotatedAccount = Account.fromPrivateKey({
        privateKey: rotateToPrivateKey,
        address: account.accountAddress,
      });
      await simpleCoinTransactionHeler(aptos, rotatedAccount, Account.generate());
    }, 10000);

    test("it should rotate ed25519 to multi-ed25519 auth key correctly", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);

      // Current Account
      const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 1_000_000_000 });

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
      const pendingTxn = await aptos.rotateAuthKey({ fromAccount: account, toAccount: multiEdAccount });
      await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });

      const accountInfo = await aptos.account.getAccountInfo({
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
      await simpleCoinTransactionHeler(aptos, rotatedAccount, Account.generate());
    }, 10000);

    test("it should rotate ed25519 to multikey auth key correctly", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);

      // Current Account
      const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 1_000_000_000 });

      const mk1 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      const mk2 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      const multiKeyAccount = MultiKeyAccount.fromPublicKeysAndSigners({
        publicKeys: [mk1.publicKey, mk2.publicKey],
        signaturesRequired: 1,
        signers: [mk1],
      });

      // Rotate the key
      const pendingTxn = await aptos.rotateAuthKey({ fromAccount: account, toAccount: multiKeyAccount });
      await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });

      const accountInfo = await aptos.account.getAccountInfo({
        accountAddress: account.accountAddress,
      });
      expect(accountInfo.authentication_key).toEqual(multiKeyAccount.publicKey.authKey().toString());

      const rotatedAccount = MultiKeyAccount.fromPublicKeysAndSigners({
        address: account.accountAddress,
        publicKeys: [mk1.publicKey, mk2.publicKey],
        signaturesRequired: 1,
        signers: [mk1],
      });
      await simpleCoinTransactionHeler(aptos, rotatedAccount, Account.generate());
    }, 10000);

    test("it should rotate ed25519 to unverified auth key correctly", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);

      // Current Account
      const account = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 1_000_000_000 });

      // account that holds the new key
      const newAccount = Account.generate();
      const newAuthKey = newAccount.publicKey.authKey();

      // Rotate the key
      const pendingTxn = await aptos.rotateAuthKey({
        fromAccount: account,
        toAuthKey: newAuthKey,
        dangerouslySkipVerification: true,
      });
      await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });

      const accountInfo = await aptos.account.getAccountInfo({
        accountAddress: account.accountAddress,
      });
      expect(accountInfo.authentication_key).toEqual(newAuthKey.toString());

      const rotatedAccount = Account.fromPrivateKey({
        privateKey: newAccount.privateKey,
        address: newAccount.accountAddress,
      });
      await simpleCoinTransactionHeler(aptos, rotatedAccount, Account.generate());
    }, 10000);
  });

  describe("Account Derivation APIs", () => {
    const config = new AptosConfig({ network: Network.DEVNET });
    const aptos = new Aptos(config);

    const minterAccount = Account.generate();

    beforeAll(async () => {
      await aptos.fundAccount({
        accountAddress: minterAccount.accountAddress,
        amount: FUND_AMOUNT,
      });
    }, 10000);

    const checkAccountsMatch = (
      accounts: { accountAddress: AccountAddress }[],
      expectedAddresses: { accountAddress: AccountAddress }[],
    ) => {
      expect(accounts.length).toBe(expectedAddresses.length);
      accounts.forEach((account, index) => {
        expect(account.accountAddress.equals(expectedAddresses[index].accountAddress)).toEqual(true);
      });
    };

    const DEFAULT_MAX_GAS_AMOUNT = 2000;
    async function createAccount(recipient: Account): Promise<CommittedTransactionResponse> {
      const transaction = await aptos.transferCoinTransaction({
        sender: minterAccount.accountAddress,
        recipient: recipient.accountAddress,
        amount: FUND_AMOUNT / 100,
        options: {
          maxGasAmount: DEFAULT_MAX_GAS_AMOUNT,
        },
      });
      const pendingTxn = await aptos.signAndSubmitTransaction({ signer: minterAccount, transaction });
      return await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
    }

    async function sendNoopTxn(sender: Account): Promise<CommittedTransactionResponse> {
      const transaction = await aptos.transferCoinTransaction({
        sender: sender.accountAddress,
        recipient: sender.accountAddress,
        amount: 0,
        options: {
          maxGasAmount: DEFAULT_MAX_GAS_AMOUNT,
        },
      });
      const pendingTxn = await aptos.signAndSubmitTransaction({ signer: sender, transaction });
      return await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
    }

    test("it derives accounts correctly", async () => {
      const account1 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      const account2 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      const account3 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      const multiKeyAccount = MultiKeyAccount.fromPublicKeysAndSigners({
        publicKeys: [account1.publicKey, account2.publicKey, account3.publicKey],
        signaturesRequired: 1,
        signers: [account3],
      });
      const multiEdAccount = new MultiEd25519Account({
        publicKey: new MultiEd25519PublicKey({
          publicKeys: [account3.publicKey, account1.publicKey],
          threshold: 1,
        }),
        signers: [account3.privateKey],
      });
      const multiEdAccountTwoSigners = new MultiEd25519Account({
        publicKey: new MultiEd25519PublicKey({
          publicKeys: [account1.publicKey, account2.publicKey, account3.publicKey],
          threshold: 2,
        }),
        signers: [account1.privateKey, account2.privateKey],
      });
      for (const account of [account1, account2, account3, multiKeyAccount, multiEdAccount, multiEdAccountTwoSigners]) {
        await createAccount(account);
      }
      // Rotate account2 to account1's auth key, skipping verification.
      const rotateTxn = await aptos.rotateAuthKey({
        fromAccount: account2,
        toAuthKey: account1.publicKey.authKey(),
        dangerouslySkipVerification: true,
        options: {
          maxGasAmount: DEFAULT_MAX_GAS_AMOUNT,
        },
      });
      await aptos.waitForTransaction({ transactionHash: rotateTxn.hash });

      // Send noop txns for the multikey accounts with account3 as the signer. These accounts
      // are not verified as owned by account1.
      await sendNoopTxn(multiKeyAccount);
      await sendNoopTxn(multiEdAccount);
      await sendNoopTxn(multiEdAccountTwoSigners);
      let accounts = await aptos.deriveOwnedAccountsFromSigner({ signer: account1 });
      expect(accounts.length).toBe(1);
      expect(accounts[0].accountAddress.equals(account1.accountAddress)).toEqual(true);

      // Include unverified accounts.
      accounts = await aptos.deriveOwnedAccountsFromSigner({
        signer: account1,
        options: {
          includeUnverified: true,
        },
      });
      checkAccountsMatch(accounts, [multiEdAccount, multiKeyAccount, account2, account1]);

      // Send txn with multiKeyAccount and account2 from the derived accounts. This will mark them as verified and
      // be returned even when includeUnverified is false (default).
      await sendNoopTxn(accounts[1]);
      const { version } = await sendNoopTxn(accounts[2]);

      accounts = await aptos.deriveOwnedAccountsFromSigner({
        signer: account1,
        minimumLedgerVersion: BigInt(version),
        options: {
          includeUnverified: false,
        },
      });
      checkAccountsMatch(accounts, [account2, multiKeyAccount, account1]);

      // Send txn with account1 which will change the ordering
      await sendNoopTxn(account1);

      accounts = await aptos.deriveOwnedAccountsFromSigner({ signer: account1 });
      checkAccountsMatch(accounts, [account1, account2, multiKeyAccount]);

      // Check the noMultiKey works.
      accounts = await aptos.deriveOwnedAccountsFromSigner({ signer: account1, options: { noMultiKey: true } });
      checkAccountsMatch(accounts, [account1, account2]);
    }, 10000);

    test("it derives account that has been rotated", async () => {
      const account1 = Account.generate({ scheme: SigningSchemeInput.Ed25519 });
      const account2 = Account.generate({ scheme: SigningSchemeInput.Ed25519 });

      for (const account of [account1, account2]) {
        await createAccount(account);
      }

      let accounts = await aptos.deriveOwnedAccountsFromSigner({ signer: account1 });
      expect(accounts.length).toBe(1);
      expect(accounts[0].accountAddress.equals(account1.accountAddress)).toEqual(true);

      // Verified rotation. Should be derivable immediately.
      const rotateTxn = await aptos.rotateAuthKey({
        fromAccount: account2,
        toNewPrivateKey: account1.privateKey,
        options: {
          maxGasAmount: DEFAULT_MAX_GAS_AMOUNT,
        },
      });
      const response = await aptos.waitForTransaction({ transactionHash: rotateTxn.hash });

      accounts = await aptos.deriveOwnedAccountsFromSigner({
        signer: account1,
        minimumLedgerVersion: BigInt(response.version),
      });
      expect(accounts.length).toBe(2);
      expect(accounts[0].accountAddress.equals(account2.accountAddress)).toEqual(true);
      expect(accounts[1].accountAddress.equals(account1.accountAddress)).toEqual(true);
    }, 10000);

    test("getAccountsFromPublicKey returns accounts", async () => {
      const account1 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      const account2 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      const account3 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: true });
      const multiKeyAccount = MultiKeyAccount.fromPublicKeysAndSigners({
        publicKeys: [account1.publicKey, account2.publicKey, account3.publicKey],
        signaturesRequired: 2,
        signers: [account3, account2],
      });
      const multiEdAccount = new MultiEd25519Account({
        publicKey: new MultiEd25519PublicKey({
          publicKeys: [account3.publicKey, account1.publicKey],
          threshold: 2,
        }),
        signers: [account3.privateKey, account1.privateKey],
      });
      for (const account of [account1, account2, account3, multiKeyAccount, multiEdAccount]) {
        await createAccount(account);
      }
      // Rotate account2 to account1's auth key, skipping verification.
      const rotateTxn = await aptos.rotateAuthKey({
        fromAccount: account2,
        toAuthKey: account1.publicKey.authKey(),
        dangerouslySkipVerification: true,
        options: {
          maxGasAmount: DEFAULT_MAX_GAS_AMOUNT,
        },
      });
      await aptos.waitForTransaction({ transactionHash: rotateTxn.hash });

      // Send noop txns for the multikey accounts
      // The multiEdAccount has account1 as a signer.
      await sendNoopTxn(multiKeyAccount);
      let { version } = await sendNoopTxn(multiEdAccount);

      let accounts = await aptos.getAccountsForPublicKey({
        publicKey: account1.publicKey,
        minimumLedgerVersion: BigInt(version),
      });
      expect(accounts.length).toBe(2);
      checkAccountsMatch(accounts, [multiEdAccount, account1]);

      // Check that the multiKeyAccount is not included.
      accounts = await aptos.getAccountsForPublicKey({
        publicKey: account1.publicKey,
        options: {
          includeUnverified: true,
        },
      });
      checkAccountsMatch(accounts, [multiEdAccount, multiKeyAccount, account2, account1]);
    }, 10000);
  });
});
