import { AptosConfig, Network, Aptos, Account, U64, SigningSchemeInput } from "../../../src";
import { longTestTimeout } from "../../unit/helper";
import { fundAccounts, multiSignerScriptBytecode, publishTransferPackage, singleSignerScriptBytecode } from "./helper";

describe("transaction simulation", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);
  const contractPublisherAccount = Account.generate();
  const singleSignerED25519SenderAccount = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
  const legacyED25519SenderAccount = Account.generate();
  const singleSignerSecp256k1Account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
  const recieverAccounts = [Account.generate(), Account.generate()];
  const secondarySignerAccount = Account.generate();
  const feePayerAccount = Account.generate();
  beforeAll(async () => {
    await fundAccounts(aptos, [
      contractPublisherAccount,
      singleSignerED25519SenderAccount,
      singleSignerSecp256k1Account,
      legacyED25519SenderAccount,
      ...recieverAccounts,
      secondarySignerAccount,
      feePayerAccount,
    ]);
    await publishTransferPackage(aptos, contractPublisherAccount);
  }, longTestTimeout);
  describe("Single Sender ED25519", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
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
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.generateTransaction({
            sender: singleSignerED25519SenderAccount.accountAddress.toString(),
            secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
            data: {
              function: `${contractPublisherAccount.accountAddress.toString()}::transfer::two_by_two`,
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
            signerPublicKey: singleSignerED25519SenderAccount.publicKey,
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
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          hasSponsor: false,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          hasSponsor: false,
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          hasSponsor: false,
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          hasSponsor: false,
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::two_by_two`,
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
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
    });
  });
  describe("Single Sender Secp256k1", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
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
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.generateTransaction({
            sender: singleSignerSecp256k1Account.accountAddress.toString(),
            secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
            data: {
              function: `${contractPublisherAccount.accountAddress.toString()}::transfer::two_by_two`,
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
            signerPublicKey: singleSignerSecp256k1Account.publicKey,
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
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          hasSponsor: false,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          hasSponsor: false,
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          hasSponsor: false,
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          hasSponsor: false,
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::two_by_two`,
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
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
    });
  });
  describe("Legacy ED25519", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
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
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.generateTransaction({
            sender: legacyED25519SenderAccount.accountAddress.toString(),
            secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
            data: {
              function: `${contractPublisherAccount.accountAddress.toString()}::transfer::two_by_two`,
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
            signerPublicKey: legacyED25519SenderAccount.publicKey,
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
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          hasSponsor: false,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          hasSponsor: false,
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          hasSponsor: false,
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          hasSponsor: false,
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::two_by_two`,
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
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload and optional fee payer",
        async () => {
          // Generate the transaction
          const transaction = await aptos.generateTransaction({
            sender: singleSignerED25519SenderAccount.accountAddress.toString(),
            hasSponsor: true,
            data: {
              function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
              functionArguments: [new U64(1), recieverAccounts[0].accountAddress],
            },
          });

          // Sender signs the transaction
          const senderAuthenticator = aptos.signTransaction({ signer: singleSignerED25519SenderAccount, transaction });

          // Update fee payer address and sign the transaction
          transaction.feePayerAddress = feePayerAccount.accountAddress;
          const feePayerSignerAuthenticator = aptos.signTransaction({ signer: feePayerAccount, transaction });

          // Submit the updated transaction, which includes the payer address
          const response = await aptos.submitTransaction({
            transaction,
            senderAuthenticator,
            secondarySignerAuthenticators: { feePayerAuthenticator: feePayerSignerAuthenticator },
          });

          await aptos.waitForTransaction({
            transactionHash: response.hash,
          });
          expect(response.signature?.type).toBe("fee_payer_signature");
        },
        longTestTimeout,
      );
    });
  });
});
