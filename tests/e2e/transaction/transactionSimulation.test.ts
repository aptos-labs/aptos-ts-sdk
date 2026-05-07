import {
  Account,
  AccountAddress,
  U64,
  SigningSchemeInput,
  InputEntryFunctionData,
  MultiKeyAccount,
  MultiKey,
  KeylessPublicKey,
} from "../../../src";
import { ed25519, longTestTimeout } from "../../unit/helper";
import { getAptosClient } from "../helper";
import {
  createAndFundMultisigAccount,
  createMultisigTransaction,
  fundAccounts,
  multiSignerScriptBytecode,
  publishTransferPackage,
  singleSignerScriptBytecode,
} from "./helper";

describe("transaction simulation", () => {
  const { aptos } = getAptosClient();
  const contractPublisherAccount = Account.generate();
  const singleSignerED25519SenderAccount = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
  const legacyED25519SenderAccount = Account.generate();
  const singleSignerSecp256k1Account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
  const multiKeyAccount = new MultiKeyAccount({
    multiKey: new MultiKey({
      publicKeys: [
        singleSignerED25519SenderAccount.publicKey,
        legacyED25519SenderAccount.publicKey,
        singleSignerSecp256k1Account.publicKey,
        new KeylessPublicKey("google", ed25519.publicKey),
      ],
      signaturesRequired: 3,
    }),
    signers: [singleSignerED25519SenderAccount, legacyED25519SenderAccount, singleSignerSecp256k1Account],
  });
  const receiverAccounts = [Account.generate(), Account.generate()];
  const secondarySignerAccount = Account.generate();
  const feePayerAccount = Account.generate();
  let multisigAddress: string;
  const multisigEntryFunction: InputEntryFunctionData = {
    function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
    functionArguments: [1, receiverAccounts[0].accountAddress],
  };
  beforeAll(async () => {
    await fundAccounts(aptos, [
      contractPublisherAccount,
      singleSignerED25519SenderAccount,
      singleSignerSecp256k1Account,
      legacyED25519SenderAccount,
      multiKeyAccount,
      ...receiverAccounts,
      secondarySignerAccount,
      feePayerAccount,
    ]);
    await publishTransferPackage(aptos, contractPublisherAccount);
  }, longTestTimeout);
  describe("Single Sender ED25519", () => {
    beforeAll(async () => {
      multisigAddress = await createAndFundMultisigAccount(singleSignerED25519SenderAccount);
      await createMultisigTransaction(singleSignerED25519SenderAccount, multisigAddress, multisigEntryFunction);
    }, longTestTimeout);
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            multisigAddress,
            function: multisigEntryFunction.function,
            functionArguments: multisigEntryFunction.functionArguments,
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: singleSignerED25519SenderAccount.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            bytecode: multiSignerScriptBytecode,
            functionArguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });

        const [response] = await aptos.transaction.simulate.multiAgent({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.transaction.build.multiAgent({
            sender: singleSignerED25519SenderAccount.accountAddress,
            secondarySignerAddresses: [secondarySignerAccount.accountAddress],
            data: {
              function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
              functionArguments: [
                new U64(100),
                new U64(200),
                receiverAccounts[0].accountAddress,
                receiverAccounts[1].accountAddress,
                new U64(50),
              ],
            },
          });

          const [response] = await aptos.transaction.simulate.multiAgent({
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
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            multisigAddress,
            function: multisigEntryFunction.function,
            functionArguments: multisigEntryFunction.functionArguments,
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: singleSignerED25519SenderAccount.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
            functionArguments: [
              new U64(100),
              new U64(200),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(50),
            ],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.multiAgent({
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
    beforeAll(async () => {
      multisigAddress = await createAndFundMultisigAccount(singleSignerSecp256k1Account);
      await createMultisigTransaction(singleSignerSecp256k1Account, multisigAddress, multisigEntryFunction);
    }, longTestTimeout);
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            multisigAddress,
            function: multisigEntryFunction.function,
            functionArguments: multisigEntryFunction.functionArguments,
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: singleSignerSecp256k1Account.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            bytecode: multiSignerScriptBytecode,
            functionArguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });

        const [response] = await aptos.transaction.simulate.multiAgent({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.transaction.build.multiAgent({
            sender: singleSignerSecp256k1Account.accountAddress,
            secondarySignerAddresses: [secondarySignerAccount.accountAddress],
            data: {
              function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
              functionArguments: [
                new U64(100),
                new U64(200),
                receiverAccounts[0].accountAddress,
                receiverAccounts[1].accountAddress,
                new U64(50),
              ],
            },
          });

          const [response] = await aptos.transaction.simulate.multiAgent({
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
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            multisigAddress,
            function: multisigEntryFunction.function,
            functionArguments: multisigEntryFunction.functionArguments,
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: singleSignerSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: singleSignerSecp256k1Account.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
            functionArguments: [
              new U64(100),
              new U64(200),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(50),
            ],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.multiAgent({
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
    beforeAll(async () => {
      multisigAddress = await createAndFundMultisigAccount(legacyED25519SenderAccount);
      await createMultisigTransaction(legacyED25519SenderAccount, multisigAddress, multisigEntryFunction);
    }, longTestTimeout);
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            multisigAddress,
            function: multisigEntryFunction.function,
            functionArguments: multisigEntryFunction.functionArguments,
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: legacyED25519SenderAccount.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            bytecode: multiSignerScriptBytecode,
            functionArguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });

        const [response] = await aptos.transaction.simulate.multiAgent({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.transaction.build.multiAgent({
            sender: legacyED25519SenderAccount.accountAddress,
            secondarySignerAddresses: [secondarySignerAccount.accountAddress],
            data: {
              function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
              functionArguments: [100, 200, receiverAccounts[0].accountAddress, receiverAccounts[1].accountAddress, 50],
            },
          });

          const [response] = await aptos.transaction.simulate.multiAgent({
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
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            multisigAddress,
            function: multisigEntryFunction.function,
            functionArguments: multisigEntryFunction.functionArguments,
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: legacyED25519SenderAccount.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
            functionArguments: [100, 200, receiverAccounts[0].accountAddress, receiverAccounts[1].accountAddress, 50],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.multiAgent({
          signerPublicKey: legacyED25519SenderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
    });
  });
  describe("MultiKey", () => {
    beforeAll(async () => {
      multisigAddress = await createAndFundMultisigAccount(multiKeyAccount);
      await createMultisigTransaction(multiKeyAccount, multisigAddress, multisigEntryFunction);
    }, longTestTimeout);
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: multiKeyAccount.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: multiKeyAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: multiKeyAccount.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: multiKeyAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: multiKeyAccount.accountAddress,
          data: {
            multisigAddress,
            function: multisigEntryFunction.function,
            functionArguments: multisigEntryFunction.functionArguments,
          },
        });
        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: multiKeyAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: multiKeyAccount.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            bytecode: multiSignerScriptBytecode,
            functionArguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              receiverAccounts[0].accountAddress,
              receiverAccounts[1].accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });

        const [response] = await aptos.transaction.simulate.multiAgent({
          signerPublicKey: multiKeyAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.transaction.build.multiAgent({
            sender: multiKeyAccount.accountAddress,
            secondarySignerAddresses: [secondarySignerAccount.accountAddress],
            data: {
              function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
              functionArguments: [100, 200, receiverAccounts[0].accountAddress, receiverAccounts[1].accountAddress, 50],
            },
          });

          const [response] = await aptos.transaction.simulate.multiAgent({
            signerPublicKey: multiKeyAccount.publicKey,
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
        const rawTxn = await aptos.transaction.build.simple({
          sender: multiKeyAccount.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: multiKeyAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: multiKeyAccount.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: multiKeyAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: multiKeyAccount.accountAddress,
          data: {
            multisigAddress,
            function: multisigEntryFunction.function,
            functionArguments: multisigEntryFunction.functionArguments,
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.simple({
          signerPublicKey: multiKeyAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.transaction.build.multiAgent({
          sender: multiKeyAccount.accountAddress,
          secondarySignerAddresses: [secondarySignerAccount.accountAddress],
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
            functionArguments: [100, 200, receiverAccounts[0].accountAddress, receiverAccounts[1].accountAddress, 50],
          },
          withFeePayer: true,
        });
        rawTxn.feePayerAddress = feePayerAccount.accountAddress;

        const [response] = await aptos.transaction.simulate.multiAgent({
          signerPublicKey: multiKeyAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
    });
  });
  describe("validate fee payer data on transaction simulation", () => {
    test("simluate a fee payer transaction without the feePayerPublicKey", async () => {
      const rawTxn = await aptos.transaction.build.simple({
        sender: singleSignerSecp256k1Account.accountAddress,
        data: {
          bytecode: singleSignerScriptBytecode,
          functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
        },
        withFeePayer: true,
      });
      rawTxn.feePayerAddress = feePayerAccount.accountAddress;

      const [response] = await aptos.transaction.simulate.simple({
        signerPublicKey: singleSignerSecp256k1Account.publicKey,
        transaction: rawTxn,
      });
      expect(response.success).toBeTruthy();
    });

    test("simluate a multi agent fee payer transaction without the feePayerPublicKey", async () => {
      const rawTxn = await aptos.transaction.build.multiAgent({
        sender: singleSignerSecp256k1Account.accountAddress,
        secondarySignerAddresses: [secondarySignerAccount.accountAddress],
        data: {
          bytecode: singleSignerScriptBytecode,
          functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
        },
        withFeePayer: true,
      });
      rawTxn.feePayerAddress = feePayerAccount.accountAddress;

      const [response] = await aptos.transaction.simulate.multiAgent({
        signerPublicKey: singleSignerSecp256k1Account.publicKey,
        transaction: rawTxn,
        secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
      });
      expect(response.vm_status).toContain("NUMBER_OF_SIGNER_ARGUMENTS_MISMATCH");
    });
  });

  describe("simulations with no account authenticator", () => {
    test("single signer with script payload", async () => {
      const transaction = await aptos.transaction.build.simple({
        sender: singleSignerED25519SenderAccount.accountAddress,
        data: {
          bytecode: singleSignerScriptBytecode,
          functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
        },
      });
      const [response] = await aptos.transaction.simulate.simple({
        transaction,
      });
      expect(response.success).toBeTruthy();
    });
  });
  test("fee payer with script payload", async () => {
    const rawTxn = await aptos.transaction.build.simple({
      sender: legacyED25519SenderAccount.accountAddress,
      data: {
        bytecode: singleSignerScriptBytecode,
        functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
      },
      withFeePayer: true,
    });
    rawTxn.feePayerAddress = feePayerAccount.accountAddress;

    const [response] = await aptos.transaction.simulate.simple({
      transaction: rawTxn,
    });
    expect(response.success).toBeTruthy();
  });
  test("fee payer as 0x0 with script payload", async () => {
    const rawTxn = await aptos.transaction.build.simple({
      sender: legacyED25519SenderAccount.accountAddress,
      data: {
        bytecode: singleSignerScriptBytecode,
        functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
      },
      withFeePayer: true,
    });
    // Note that the rawTxn.feePayerAddress is 0x0 by default.

    const [response] = await aptos.transaction.simulate.simple({
      transaction: rawTxn,
    });
    expect(response.success).toBeTruthy();
  });
  test("fee payer as 0x7 with script payload", async () => {
    const rawTxn = await aptos.transaction.build.simple({
      sender: legacyED25519SenderAccount.accountAddress,
      data: {
        bytecode: singleSignerScriptBytecode,
        functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
      },
      withFeePayer: true,
    });
    // 0x7 is a fee payer who does not have a sufficient fund.
    rawTxn.feePayerAddress = AccountAddress.from("0x7");
    const [response] = await aptos.transaction.simulate.simple({
      transaction: rawTxn,
    });
    expect(response.vm_status).toContain("INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE");
  });
  test("with multi agent transaction without providing the secondary signer public key", async () => {
    const rawTxn = await aptos.transaction.build.multiAgent({
      sender: legacyED25519SenderAccount.accountAddress,
      secondarySignerAddresses: [secondarySignerAccount.accountAddress],
      data: {
        function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
        functionArguments: [100, 200, receiverAccounts[0].accountAddress, receiverAccounts[1].accountAddress, 50],
      },
      withFeePayer: true,
    });
    rawTxn.feePayerAddress = feePayerAccount.accountAddress;

    const [response] = await aptos.transaction.simulate.multiAgent({
      signerPublicKey: legacyED25519SenderAccount.publicKey,
      transaction: rawTxn,
      secondarySignersPublicKeys: [undefined],
      feePayerPublicKey: feePayerAccount.publicKey,
    });
    expect(response.success).toBeTruthy();
  });
  test("with multi agent transaction without providing the secondary signer public key array", async () => {
    const rawTxn = await aptos.transaction.build.multiAgent({
      sender: legacyED25519SenderAccount.accountAddress,
      secondarySignerAddresses: [secondarySignerAccount.accountAddress],
      data: {
        function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
        functionArguments: [100, 200, receiverAccounts[0].accountAddress, receiverAccounts[1].accountAddress, 50],
      },
      withFeePayer: true,
    });
    rawTxn.feePayerAddress = feePayerAccount.accountAddress;

    const [response] = await aptos.transaction.simulate.multiAgent({
      signerPublicKey: legacyED25519SenderAccount.publicKey,
      transaction: rawTxn,
      feePayerPublicKey: feePayerAccount.publicKey,
    });
    expect(response.success).toBeTruthy();
  });
});
