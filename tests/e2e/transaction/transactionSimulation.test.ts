import { AptosConfig, Network, Aptos, Account, U64, SigningScheme } from "../../../src";
import { longTestTimeout } from "../../unit/helper";
import { fundAccounts, multiSignerScriptBytecode, publishTransferPackage, singleSignerScriptBytecode } from "./helper";

describe("transaction simulation", () => {
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
  describe("ED25519", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          data: {
            bytecode: multiSignerScriptBytecode,
            functionArguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              recieverAccounts[0].accountAddress,
              recieverAccounts[1].accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.generateTransaction({
            sender: senderAccount.accountAddress.toString(),
            secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
            data: {
              function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::two_by_two`,
              functionArguments: [
                new U64(100),
                new U64(200),
                recieverAccounts[0].accountAddress,
                recieverAccounts[1].accountAddress,
                new U64(50),
              ],
            },
          });

          const [response] = await aptos.simulateTransaction({
            signerPublicKey: senderAccount.publicKey,
            transaction: rawTxn,
            secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          });
          expect(response.success).toBeTruthy();
        },
        longTestTimeout,
      );
    });
    describe("fee payer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::two_by_two`,
            functionArguments: [
              new U64(100),
              new U64(200),
              recieverAccounts[0].accountAddress,
              recieverAccounts[1].accountAddress,
              new U64(50),
            ],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
    });
  });

  describe.skip("Secp256k1", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          data: {
            bytecode: multiSignerScriptBytecode,
            functionArguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              recieverAccounts[0].accountAddress,
              recieverAccounts[1].accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.generateTransaction({
            sender: senderSecp256k1Account.accountAddress.toString(),
            secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
            data: {
              function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::two_by_two`,
              functionArguments: [
                new U64(100),
                new U64(200),
                recieverAccounts[0].accountAddress,
                recieverAccounts[1].accountAddress,
                new U64(50),
              ],
            },
          });

          const [response] = await aptos.simulateTransaction({
            signerPublicKey: senderSecp256k1Account.publicKey,
            transaction: rawTxn,
            secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          });
          expect(response.success).toBeTruthy();
        },
        longTestTimeout,
      );
    });
    describe("fee payer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::two_by_two`,
            functionArguments: [
              new U64(100),
              new U64(200),
              recieverAccounts[0].accountAddress,
              recieverAccounts[1].accountAddress,
              new U64(50),
            ],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
    });
  });
});
