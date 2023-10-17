// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, AptosConfig, Network, Aptos, U64, SigningScheme } from "../../../src";
import { waitForTransaction } from "../../../src/internal/transaction";
import { longTestTimeout } from "../../unit/helper";
import { fundAccounts, publishTransferPackage, singleSignerScriptBytecode, multiSignerScriptBytecode } from "./helper";

describe("transaction submission", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);
  const senderAccount = Account.generate();
  const receiverAccounts = [Account.generate(), Account.generate()];
  const senderSecp256k1Account = Account.generate(SigningScheme.Secp256k1Ecdsa);
  const secondarySignerAccount = Account.generate();
  const feePayerAccount = Account.generate();
  beforeAll(async () => {
    await fundAccounts(aptos, [
      senderAccount,
      senderSecp256k1Account,
      ...receiverAccounts,
      secondarySignerAccount,
      feePayerAccount,
    ]);
    await publishTransferPackage(aptos, senderAccount);
  }, longTestTimeout);
  describe("ED25519", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const transaction = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            arguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const response = await aptos.signAndSubmitTransaction({
          signer: senderAccount,
          transaction,
        });
        await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
      });
      test("with entry function payload", async () => {
        const transaction = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            arguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const response = await aptos.signAndSubmitTransaction({
          signer: senderAccount,
          transaction,
        });
        await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const transaction = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          data: {
            bytecode: multiSignerScriptBytecode,
            arguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });

        const senderAuthenticator = aptos.signTransaction({ signer: senderAccount, transaction });
        const secondarySignerAuthenticator = aptos.signTransaction({ signer: secondarySignerAccount, transaction });

        const response = await aptos.submitTransaction({
          transaction,
          senderAuthenticator,
          secondarySignerAuthenticators: { additionalSignersAuthenticators: [secondarySignerAuthenticator] },
        });

        await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
      });

      test(
        "with entry function payload",
        async () => {
          const transaction = await aptos.generateTransaction({
            sender: senderAccount.accountAddress.toString(),
            secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
            data: {
              function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::two_by_two`,
              arguments: [
                new U64(100),
                new U64(200),
                receiverAccounts[0].accountAddress,
                receiverAccounts[1].accountAddress,
                new U64(50),
              ],
            },
          });

          const senderAuthenticator = aptos.signTransaction({ signer: senderAccount, transaction });
          const secondarySignerAuthenticator = aptos.signTransaction({ signer: secondarySignerAccount, transaction });

          const response = await aptos.submitTransaction({
            transaction,
            senderAuthenticator,
            secondarySignerAuthenticators: { additionalSignersAuthenticators: [secondarySignerAuthenticator] },
          });

          await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
        },
        longTestTimeout,
      );
    });
    describe("fee payer", () => {
      test("with script payload", async () => {
        const transaction = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            arguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });

        const senderAuthenticator = aptos.signTransaction({ signer: senderAccount, transaction });
        const feePayerSignerAuthenticator = aptos.signTransaction({ signer: feePayerAccount, transaction });

        const response = await aptos.submitTransaction({
          transaction,
          senderAuthenticator,
          secondarySignerAuthenticators: { feePayerAuthenticator: feePayerSignerAuthenticator },
        });

        await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
      });
      test("with entry function payload", async () => {
        const transaction = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            arguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const senderAuthenticator = aptos.signTransaction({ signer: senderAccount, transaction });
        const feePayerSignerAuthenticator = aptos.signTransaction({ signer: feePayerAccount, transaction });

        const response = await aptos.submitTransaction({
          transaction,
          senderAuthenticator,
          secondarySignerAuthenticators: { feePayerAuthenticator: feePayerSignerAuthenticator },
        });

        await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
      });
      test("with multi agent transaction", async () => {
        const transaction = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::two_by_two`,
            arguments: [
              new U64(100),
              new U64(200),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(50),
            ],
          },
        });

        const senderAuthenticator = aptos.signTransaction({ signer: senderAccount, transaction });
        const secondarySignerAuthenticator = aptos.signTransaction({ signer: secondarySignerAccount, transaction });
        const feePayerSignerAuthenticator = aptos.signTransaction({ signer: feePayerAccount, transaction });

        const response = await aptos.submitTransaction({
          transaction,
          senderAuthenticator,
          secondarySignerAuthenticators: {
            additionalSignersAuthenticators: [secondarySignerAuthenticator],
            feePayerAuthenticator: feePayerSignerAuthenticator,
          },
        });

        await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
      });
    });
  });

  describe("Secp256k1", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const transaction = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            arguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const response = await aptos.signAndSubmitTransaction({
          signer: senderSecp256k1Account,
          transaction,
        });
        await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
      });
      test("with entry function payload", async () => {
        const transaction = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            arguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const response = await aptos.signAndSubmitTransaction({
          signer: senderSecp256k1Account,
          transaction,
        });
        await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const transaction = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          data: {
            bytecode: multiSignerScriptBytecode,
            arguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });

        const senderAuthenticator = aptos.signTransaction({ signer: senderSecp256k1Account, transaction });
        const secondarySignerAuthenticator = aptos.signTransaction({ signer: secondarySignerAccount, transaction });

        const response = await aptos.submitTransaction({
          transaction,
          senderAuthenticator,
          secondarySignerAuthenticators: { additionalSignersAuthenticators: [secondarySignerAuthenticator] },
        });

        await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
      });

      test(
        "with entry function payload",
        async () => {
          const transaction = await aptos.generateTransaction({
            sender: senderSecp256k1Account.accountAddress.toString(),
            secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
            data: {
              function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::two_by_two`,
              arguments: [
                new U64(100),
                new U64(200),
                receiverAccounts[0].accountAddress,
                receiverAccounts[1].accountAddress,
                new U64(50),
              ],
            },
          });

          const senderAuthenticator = aptos.signTransaction({ signer: senderSecp256k1Account, transaction });
          const secondarySignerAuthenticator = aptos.signTransaction({ signer: secondarySignerAccount, transaction });

          const response = await aptos.submitTransaction({
            transaction,
            senderAuthenticator,
            secondarySignerAuthenticators: { additionalSignersAuthenticators: [secondarySignerAuthenticator] },
          });

          await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
        },
        longTestTimeout,
      );
    });
    describe("fee payer", () => {
      test("with script payload", async () => {
        const transaction = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            arguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });

        const senderAuthenticator = aptos.signTransaction({ signer: senderSecp256k1Account, transaction });
        const feePayerSignerAuthenticator = aptos.signTransaction({ signer: feePayerAccount, transaction });

        const response = await aptos.submitTransaction({
          transaction,
          senderAuthenticator,
          secondarySignerAuthenticators: { feePayerAuthenticator: feePayerSignerAuthenticator },
        });

        await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
      });
      test("with entry function payload", async () => {
        const transaction = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            arguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const senderAuthenticator = aptos.signTransaction({ signer: senderSecp256k1Account, transaction });
        const feePayerSignerAuthenticator = aptos.signTransaction({ signer: feePayerAccount, transaction });

        const response = await aptos.submitTransaction({
          transaction,
          senderAuthenticator,
          secondarySignerAuthenticators: { feePayerAuthenticator: feePayerSignerAuthenticator },
        });

        await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
      });
      test("with multi agent transaction", async () => {
        const transaction = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::two_by_two`,
            arguments: [
              new U64(100),
              new U64(200),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(50),
            ],
          },
        });

        const senderAuthenticator = aptos.signTransaction({ signer: senderSecp256k1Account, transaction });
        const secondarySignerAuthenticator = aptos.signTransaction({ signer: secondarySignerAccount, transaction });
        const feePayerSignerAuthenticator = aptos.signTransaction({ signer: feePayerAccount, transaction });

        const response = await aptos.submitTransaction({
          transaction,
          senderAuthenticator,
          secondarySignerAuthenticators: {
            additionalSignersAuthenticators: [secondarySignerAuthenticator],
            feePayerAuthenticator: feePayerSignerAuthenticator,
          },
        });

        await waitForTransaction({ aptosConfig: config, txnHash: response.hash });
      });
    });
  });
});
