import { AbstractedAccount, Account, AccountAddress, Ed25519PrivateKey, Hex, MoveVector, Network } from "../../../src";
import { DerivableAbstractedAccount } from "../../../src/account/DerivableAbstractedAccount";
import { Ed25519Account } from "../../../src/account/Ed25519Account";
import { ed25519, FUND_AMOUNT } from "../../unit/helper";
import { getAptosClient } from "../helper";
import {
  addPermissionDelegationScriptBytecode,
  publishAnyAuthenticatorAAPackage,
  publishHelloWorldAAPackage,
} from "../transaction/helper";

describe("abstraction api", () => {
  const { aptos } = getAptosClient({ network: Network.LOCAL });

  describe("account abstraction", () => {
    describe("enable and disable account abstraction", () => {
      const alice = Ed25519Account.generate();

      const authenticationFunction = "0x1::permissioned_delegation::authenticate";

      beforeAll(async () => {
        await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
      });

      it("should fetch account abstraction is enabled to be false", async () => {
        const status = await aptos.abstraction.isAccountAbstractionEnabled({
          accountAddress: alice.accountAddress,
          authenticationFunction,
        });
        expect(status).toBe(false);
      });

      it("should enable account abstraction", async () => {
        const txn = await aptos.abstraction.enableAccountAbstractionTransaction({
          accountAddress: alice.accountAddress,
          authenticationFunction,
        });
        const pendingTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });
        const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        expect(response.success).toBe(true);
      });

      it("should fetch whether account abstraction is enabled to be true", async () => {
        const status = await aptos.abstraction.isAccountAbstractionEnabled({
          accountAddress: alice.accountAddress,
          authenticationFunction,
        });
        expect(status).toBe(true);
      });

      it("should disable account abstraction", async () => {
        const txn = await aptos.abstraction.disableAccountAbstractionTransaction({
          accountAddress: alice.accountAddress,
          authenticationFunction,
        });
        const pendingTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });
        const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        expect(response.success).toBe(true);
      });
    });

    describe("enable account abstraction, send a transaction, and disable all account abstraction", () => {
      const alice = Ed25519Account.generate();
      const recipient = Ed25519Account.generate();
      const deployer = Ed25519Account.generate();
      const authenticationFunction = `${deployer.accountAddress}::any_authenticator::authenticate`;

      beforeAll(async () => {
        await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
        await aptos.fundAccount({ accountAddress: deployer.accountAddress, amount: FUND_AMOUNT });
        await publishAnyAuthenticatorAAPackage(aptos, deployer);
      });

      it("should enable account abstraction", async () => {
        const txn = await aptos.abstraction.enableAccountAbstractionTransaction({
          accountAddress: alice.accountAddress,
          authenticationFunction,
        });
        const pendingTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });
        const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        expect(response.success).toBe(true);
      });

      it("should be able to send a transaction using acount abstraction", async () => {
        const abstractAccount = new AbstractedAccount({
          signer: () => new Uint8Array(0),
          accountAddress: alice.accountAddress,
          authenticationFunction,
        });

        const txn = await aptos.transaction.signAndSubmitTransaction({
          signer: abstractAccount,
          transaction: await aptos.transferCoinTransaction({
            sender: alice.accountAddress,
            recipient: recipient.accountAddress,
            amount: 100,
          }),
        });

        const response = await aptos.waitForTransaction({ transactionHash: txn.hash });
        expect(response.success).toBe(true);
        expect(await aptos.getAccountAPTAmount({ accountAddress: recipient.accountAddress })).toBe(100);
      });

      it("should disable account abstraction without specifying authentication function", async () => {
        const txn = await aptos.abstraction.disableAccountAbstractionTransaction({
          accountAddress: alice.accountAddress,
        });
        const pendingTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });
        const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        expect(response.success).toBe(true);

        const status = await aptos.abstraction.isAccountAbstractionEnabled({
          accountAddress: alice.accountAddress,
          authenticationFunction,
        });
        expect(status).toBe(false);
      });
    });

    // eslint-disable-next-line max-len
    describe("enable custom account abstraction, send a transaction with custom signer, and send a transaction with an invalid signer", () => {
      const alice = Ed25519Account.generate();
      const recipient = Ed25519Account.generate();
      const deployer = Ed25519Account.generate();
      const authenticationFunction = `${deployer.accountAddress}::hello_world_authenticator::authenticate`;

      beforeAll(async () => {
        await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
        await aptos.fundAccount({ accountAddress: deployer.accountAddress, amount: FUND_AMOUNT });
        await publishHelloWorldAAPackage(aptos, deployer);
      });

      it("should enable account abstraction", async () => {
        const txn = await aptos.abstraction.enableAccountAbstractionTransaction({
          accountAddress: alice.accountAddress,
          authenticationFunction,
        });
        const pendingTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });
        const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        expect(response.success).toBe(true);
      });

      it("should be able to send a transaction using custom signer", async () => {
        const abstractAccount = new AbstractedAccount({
          signer: () => new TextEncoder().encode("hello world"),
          accountAddress: alice.accountAddress,
          authenticationFunction,
        });

        const txn = await aptos.transaction.signAndSubmitTransaction({
          signer: abstractAccount,
          transaction: await aptos.transferCoinTransaction({
            sender: alice.accountAddress,
            recipient: recipient.accountAddress,
            amount: 100,
          }),
        });

        const response = await aptos.waitForTransaction({ transactionHash: txn.hash });
        expect(response.success).toBe(true);
        expect(await aptos.getAccountAPTAmount({ accountAddress: recipient.accountAddress })).toBe(100);
      });

      it("should fail to send a transaction with wrong custom signer", async () => {
        const abstractAccount = new AbstractedAccount({
          signer: () => new Uint8Array(0),
          accountAddress: alice.accountAddress,
          authenticationFunction,
        });

        expect(async () => {
          await aptos.transaction.signAndSubmitTransaction({
            signer: abstractAccount,
            transaction: await aptos.transferCoinTransaction({
              sender: alice.accountAddress,
              recipient: alice.accountAddress,
              amount: 100,
            }),
          });
        }).rejects.toThrow();
      });
    });

    describe("enable permissioned delegation and send a transaction with permissions", () => {
      const alice = Ed25519Account.generate();
      const bob = Ed25519Account.generate();
      const recipient = Ed25519Account.generate();

      beforeAll(async () => {
        await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: FUND_AMOUNT });
        await aptos.fundAccount({ accountAddress: recipient.accountAddress, amount: FUND_AMOUNT });
        let txn = await aptos.transaction.build.simple({
          sender: alice.accountAddress,
          data: {
            bytecode: addPermissionDelegationScriptBytecode,
            functionArguments: [MoveVector.U8(bob.publicKey.toUint8Array())],
          },
        });
        let pendingTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });
        await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        txn = await aptos.abstraction.enableAccountAbstractionTransaction({
          accountAddress: alice.accountAddress,
          authenticationFunction: "0x1::permissioned_delegation::authenticate",
        });
        pendingTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });
        await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
      });

      it("should be able to send a transaction with permissioned signer", async () => {
        const abstractedAccount = AbstractedAccount.fromPermissionedSigner({
          signer: bob,
          accountAddress: bob.accountAddress,
        });
        const txn = await aptos.transaction.build.simple({
          sender: alice.accountAddress,
          data: {
            function: "0x1::primary_fungible_store::transfer",
            typeArguments: ["0x1::fungible_asset::Metadata"],
            functionArguments: ["0xa", recipient.accountAddress, "100"],
          },
        });
        const pendingTxn = await aptos.signAndSubmitTransaction({ signer: abstractedAccount, transaction: txn });
        const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        expect(response.success).toBe(true);
      });
    });
  });

  // this daa account can be used on chain
  describe("derivable account abstraction", () => {
    it("should calculate the correct account address", () => {
      const { privateKey: privateKeyBytes, daa: derivableAccountAddress } = ed25519;
      const privateKey = new Ed25519PrivateKey(privateKeyBytes);
      const account = Account.fromPrivateKey({
        privateKey,
      });
      const daaAddressBytes = DerivableAbstractedAccount.computeAccountAddress(
        "0x7::test_derivable_account_abstraction_ed25519_hex::authenticate",
        account.publicKey.toUint8Array(),
      );
      const daaAddressString = new AccountAddress(daaAddressBytes).toString();
      expect(daaAddressString).toBe(derivableAccountAddress);
    });

    it("should be able to send a transaction with derivable account abstraction", async () => {
      // solana uses the same Ed25519 curve
      const solanaAccount = Account.generate();
      const daa = new DerivableAbstractedAccount({
        signer: (digest) => {
          // The solana wallet sign function
          const hexDigest = new TextEncoder().encode(Hex.fromHexInput(digest).toString());
          return solanaAccount.sign(hexDigest).toUint8Array();
        },
        authenticationFunction: `0x7::test_derivable_account_abstraction_ed25519_hex::authenticate`,
        abstractPublicKey: solanaAccount.publicKey.toUint8Array(),
      });

      const recipient = Account.generate();
      await aptos.fundAccount({ accountAddress: recipient.accountAddress, amount: FUND_AMOUNT });
      await aptos.fundAccount({ accountAddress: daa.accountAddress, amount: FUND_AMOUNT });

      const pendingTxn = await aptos.transaction.signAndSubmitTransaction({
        signer: daa,
        transaction: await aptos.transferCoinTransaction({
          sender: daa.accountAddress,
          recipient: recipient.accountAddress,
          amount: 100,
        }),
      });

      const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
      expect(response.success).toBe(true);
    });
  });
});
