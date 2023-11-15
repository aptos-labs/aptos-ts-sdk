// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AptosConfig,
  Network,
  Aptos,
  U64,
  Deserializer,
  SigningSchemeInput,
  AuthenticationKey,
} from "../../../src";
import { MultiKey } from "../../../src/core/crypto/multiKey";
import { waitForTransaction } from "../../../src/internal/transaction";
import {
  AccountAuthenticatorMultiKey,
  AccountAuthenticatorSingleKey,
} from "../../../src/transactions/authenticator/account";
import { RawTransaction, TransactionPayloadEntryFunction } from "../../../src/transactions/instances";
import { longTestTimeout } from "../../unit/helper";
import { fundAccounts, multiSignerScriptBytecode, publishTransferPackage, singleSignerScriptBytecode } from "./helper";

const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);
describe("transaction submission", () => {
  const contractPublisherAccount = Account.generate();
  const singleSignerED25519SenderAccount = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
  const legacyED25519SenderAccount = Account.generate();
  const receiverAccounts = [Account.generate(), Account.generate()];
  const singleSignerSecp256k1Account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
  const secondarySignerAccount = Account.generate();
  const feePayerAccount = Account.generate();
  beforeAll(async () => {
    await fundAccounts(aptos, [
      contractPublisherAccount,
      singleSignerED25519SenderAccount,
      singleSignerSecp256k1Account,
      legacyED25519SenderAccount,
      ...receiverAccounts,
      secondarySignerAccount,
      feePayerAccount,
    ]);
    await publishTransferPackage(aptos, contractPublisherAccount);
  }, longTestTimeout);
  describe("Single Sender ED25519", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const transaction = await aptos.build.transaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const response = await aptos.signAndSubmitTransaction({
          signer: singleSignerED25519SenderAccount,
          transaction,
        });

        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });

        expect(response.signature?.type).toBe("single_sender");
      });
      test("with entry function payload", async () => {
        const transaction = await aptos.build.transaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const response = await aptos.signAndSubmitTransaction({
          signer: singleSignerED25519SenderAccount,
          transaction,
        });
        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("single_sender");
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const transaction = await aptos.build.multiAgentTransaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
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

        const senderAuthenticator = aptos.sign.transaction({ signer: singleSignerED25519SenderAccount, transaction });
        const secondarySignerAuthenticator = aptos.sign.transaction({ signer: secondarySignerAccount, transaction });

        const response = await aptos.submit.multiAgentTransaction({
          transaction,
          senderAuthenticator,
          additionalSignersAuthenticators: [secondarySignerAuthenticator],
        });

        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("multi_agent_signature");
      });

      test(
        "with entry function payload",
        async () => {
          const transaction = await aptos.build.multiAgentTransaction({
            sender: singleSignerED25519SenderAccount.accountAddress.toString(),
            secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
            data: {
              function: `${contractPublisherAccount.accountAddress.toString()}::transfer::two_by_two`,
              functionArguments: [
                new U64(100),
                new U64(200),
                receiverAccounts[0].accountAddress,
                receiverAccounts[1].accountAddress,
                new U64(50),
              ],
            },
          });

          const senderAuthenticator = aptos.sign.transaction({ signer: singleSignerED25519SenderAccount, transaction });
          const secondarySignerAuthenticator = aptos.sign.transaction({ signer: secondarySignerAccount, transaction });

          const response = await aptos.submit.multiAgentTransaction({
            transaction,
            senderAuthenticator,
            additionalSignersAuthenticators: [secondarySignerAuthenticator],
          });

          await waitForTransaction({
            aptosConfig: config,
            transactionHash: response.hash,
          });
          expect(response.signature?.type).toBe("multi_agent_signature");
        },
        longTestTimeout,
      );
    });
    describe("fee payer", () => {
      test("with script payload", async () => {
        const transaction = await aptos.build.transaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });

        const senderAuthenticator = aptos.sign.transaction({ signer: singleSignerED25519SenderAccount, transaction });
        const feePayerSignerAuthenticator = aptos.sign.transactionAsFeePayer({
          signer: feePayerAccount,
          transaction,
        });

        const response = await aptos.submit.transaction({
          transaction,
          senderAuthenticator,
          feePayerAuthenticator: feePayerSignerAuthenticator,
        });

        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("fee_payer_signature");
      });
      test("with entry function payload", async () => {
        const transaction = await aptos.build.transaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        const senderAuthenticator = aptos.sign.transaction({ signer: singleSignerED25519SenderAccount, transaction });
        const feePayerSignerAuthenticator = aptos.sign.transactionAsFeePayer({
          signer: feePayerAccount,
          transaction,
        });

        const response = await aptos.submit.transaction({
          transaction,
          senderAuthenticator,
          feePayerAuthenticator: feePayerSignerAuthenticator,
        });

        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("fee_payer_signature");
      });
      test("with multi agent transaction", async () => {
        const transaction = await aptos.build.multiAgentTransaction({
          sender: singleSignerED25519SenderAccount.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::two_by_two`,
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

        const senderAuthenticator = aptos.sign.transaction({ signer: singleSignerED25519SenderAccount, transaction });
        const secondarySignerAuthenticator = aptos.sign.transaction({ signer: secondarySignerAccount, transaction });
        const feePayerSignerAuthenticator = aptos.sign.transactionAsFeePayer({
          signer: feePayerAccount,
          transaction,
        });

        const response = await aptos.submit.multiAgentTransaction({
          transaction,
          senderAuthenticator,
          additionalSignersAuthenticators: [secondarySignerAuthenticator],
          feePayerAuthenticator: feePayerSignerAuthenticator,
        });

        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("fee_payer_signature");
      });
    });
  });
  describe("Single Sender Secp256k1", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const transaction = await aptos.build.transaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const response = await aptos.signAndSubmitTransaction({
          signer: singleSignerSecp256k1Account,
          transaction,
        });
        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("single_sender");
      });
      test("with entry function payload", async () => {
        const transaction = await aptos.build.transaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const response = await aptos.signAndSubmitTransaction({
          signer: singleSignerSecp256k1Account,
          transaction,
        });
        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("single_sender");
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const transaction = await aptos.build.multiAgentTransaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
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

        const senderAuthenticator = aptos.sign.transaction({ signer: singleSignerSecp256k1Account, transaction });
        const secondarySignerAuthenticator = aptos.sign.transaction({ signer: secondarySignerAccount, transaction });

        const response = await aptos.submit.multiAgentTransaction({
          transaction,
          senderAuthenticator,
          additionalSignersAuthenticators: [secondarySignerAuthenticator],
        });

        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("multi_agent_signature");
      });

      test(
        "with entry function payload",
        async () => {
          const transaction = await aptos.build.multiAgentTransaction({
            sender: singleSignerSecp256k1Account.accountAddress.toString(),
            secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
            data: {
              function: `${contractPublisherAccount.accountAddress.toString()}::transfer::two_by_two`,
              functionArguments: [
                new U64(100),
                new U64(200),
                receiverAccounts[0].accountAddress,
                receiverAccounts[1].accountAddress,
                new U64(50),
              ],
            },
          });

          const senderAuthenticator = aptos.sign.transaction({ signer: singleSignerSecp256k1Account, transaction });
          const secondarySignerAuthenticator = aptos.sign.transaction({ signer: secondarySignerAccount, transaction });

          const response = await aptos.submit.multiAgentTransaction({
            transaction,
            senderAuthenticator,
            additionalSignersAuthenticators: [secondarySignerAuthenticator],
          });

          await waitForTransaction({
            aptosConfig: config,
            transactionHash: response.hash,
          });
          expect(response.signature?.type).toBe("multi_agent_signature");
        },
        longTestTimeout,
      );
    });
    describe("fee payer", () => {
      test("with script payload", async () => {
        const transaction = await aptos.build.transaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });

        const senderAuthenticator = aptos.sign.transaction({ signer: singleSignerSecp256k1Account, transaction });
        const feePayerSignerAuthenticator = aptos.sign.transactionAsFeePayer({
          signer: feePayerAccount,
          transaction,
        });

        const response = await aptos.submit.transaction({
          transaction,
          senderAuthenticator,
          feePayerAuthenticator: feePayerSignerAuthenticator,
        });

        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("fee_payer_signature");
      });
      test("with entry function payload", async () => {
        const transaction = await aptos.build.transaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        const senderAuthenticator = aptos.sign.transaction({ signer: singleSignerSecp256k1Account, transaction });
        const feePayerSignerAuthenticator = aptos.sign.transactionAsFeePayer({
          signer: feePayerAccount,
          transaction,
        });

        const response = await aptos.submit.transaction({
          transaction,
          senderAuthenticator,
          feePayerAuthenticator: feePayerSignerAuthenticator,
        });

        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("fee_payer_signature");
      });
      test("with multi agent transaction", async () => {
        const transaction = await aptos.build.multiAgentTransaction({
          sender: singleSignerSecp256k1Account.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::two_by_two`,
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

        const senderAuthenticator = aptos.sign.transaction({ signer: singleSignerSecp256k1Account, transaction });
        const secondarySignerAuthenticator = aptos.sign.transaction({ signer: secondarySignerAccount, transaction });
        const feePayerSignerAuthenticator = aptos.sign.transactionAsFeePayer({
          signer: feePayerAccount,
          transaction,
        });

        const response = await aptos.submit.multiAgentTransaction({
          transaction,
          senderAuthenticator,
          additionalSignersAuthenticators: [secondarySignerAuthenticator],
          feePayerAuthenticator: feePayerSignerAuthenticator,
        });

        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("fee_payer_signature");
      });
    });
  });
  describe("Legacy ED25519", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const transaction = await aptos.build.transaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const response = await aptos.signAndSubmitTransaction({
          signer: legacyED25519SenderAccount,
          transaction,
        });
        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("ed25519_signature");
      });
      test("with entry function payload", async () => {
        const transaction = await aptos.build.transaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const response = await aptos.signAndSubmitTransaction({
          signer: legacyED25519SenderAccount,
          transaction,
        });
        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("ed25519_signature");
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const transaction = await aptos.build.multiAgentTransaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
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
        const senderAuthenticator = aptos.sign.transaction({ signer: legacyED25519SenderAccount, transaction });
        const secondarySignerAuthenticator = aptos.sign.transaction({ signer: secondarySignerAccount, transaction });

        const response = await aptos.submit.multiAgentTransaction({
          transaction,
          senderAuthenticator,
          additionalSignersAuthenticators: [secondarySignerAuthenticator],
        });

        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("multi_agent_signature");
      });

      test(
        "with entry function payload",
        async () => {
          const transaction = await aptos.build.multiAgentTransaction({
            sender: legacyED25519SenderAccount.accountAddress.toString(),
            secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
            data: {
              function: `${contractPublisherAccount.accountAddress.toString()}::transfer::two_by_two`,
              functionArguments: [
                new U64(100),
                new U64(200),
                receiverAccounts[0].accountAddress,
                receiverAccounts[1].accountAddress,
                new U64(50),
              ],
            },
          });

          const senderAuthenticator = aptos.sign.transaction({ signer: legacyED25519SenderAccount, transaction });
          const secondarySignerAuthenticator = aptos.sign.transaction({ signer: secondarySignerAccount, transaction });

          const response = await aptos.submit.multiAgentTransaction({
            transaction,
            senderAuthenticator,
            additionalSignersAuthenticators: [secondarySignerAuthenticator],
          });

          await waitForTransaction({
            aptosConfig: config,
            transactionHash: response.hash,
          });
          expect(response.signature?.type).toBe("multi_agent_signature");
        },
        longTestTimeout,
      );
    });
    describe("fee payer", () => {
      test("with script payload", async () => {
        const transaction = await aptos.build.transaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        const senderAuthenticator = aptos.sign.transaction({ signer: legacyED25519SenderAccount, transaction });
        const feePayerSignerAuthenticator = aptos.sign.transactionAsFeePayer({
          signer: feePayerAccount,
          transaction,
        });

        const response = await aptos.submit.transaction({
          transaction,
          senderAuthenticator,
          feePayerAuthenticator: feePayerSignerAuthenticator,
        });

        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("fee_payer_signature");
      });
      test("with entry function payload", async () => {
        const transaction = await aptos.build.transaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
          withFeePayer: true,
        });
        const senderAuthenticator = aptos.sign.transaction({ signer: legacyED25519SenderAccount, transaction });
        const feePayerSignerAuthenticator = aptos.sign.transactionAsFeePayer({
          signer: feePayerAccount,
          transaction,
        });

        const response = await aptos.submit.transaction({
          transaction,
          senderAuthenticator,
          feePayerAuthenticator: feePayerSignerAuthenticator,
        });

        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("fee_payer_signature");
      });
      test("with multi agent transaction", async () => {
        const transaction = await aptos.build.multiAgentTransaction({
          sender: legacyED25519SenderAccount.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          data: {
            function: `${contractPublisherAccount.accountAddress.toString()}::transfer::two_by_two`,
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

        const senderAuthenticator = aptos.sign.transaction({ signer: legacyED25519SenderAccount, transaction });
        const secondarySignerAuthenticator = aptos.sign.transaction({ signer: secondarySignerAccount, transaction });
        const feePayerSignerAuthenticator = aptos.sign.transactionAsFeePayer({
          signer: feePayerAccount,
          transaction,
        });

        const response = await aptos.submit.multiAgentTransaction({
          transaction,
          senderAuthenticator,
          additionalSignersAuthenticators: [secondarySignerAuthenticator],
          feePayerAuthenticator: feePayerSignerAuthenticator,
        });

        await waitForTransaction({
          aptosConfig: config,
          transactionHash: response.hash,
        });
        expect(response.signature?.type).toBe("fee_payer_signature");
      });
    });
  });
  describe("Multi Key", () => {
    test("it submits a multi key transaction", async () => {
      const multiKey = new MultiKey({
        publicKeys: [
          singleSignerED25519SenderAccount.publicKey,
          legacyED25519SenderAccount.publicKey,
          singleSignerSecp256k1Account.publicKey,
        ],
        signaturesRequired: 2,
      });

      const authKey = AuthenticationKey.fromPublicKey({ publicKey: multiKey });

      const multiKeyAccountAddress = authKey.derivedAddress();

      await aptos.fundAccount({ accountAddress: multiKeyAccountAddress.toString(), amount: 100_000_000 });

      const transaction = await aptos.build.transaction({
        sender: multiKeyAccountAddress.toString(),
        data: {
          function: `0x${contractPublisherAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
          functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
        },
      });
      // create a bitmap where singleSignerED25519SenderAccount and singleSignerSecp256k1Account
      const bitmap = multiKey.createBitmap({ bits: [0, 2] });

      // account1 and account3 sign the transaction
      const account1Authenticator = aptos.sign.transaction({ signer: singleSignerED25519SenderAccount, transaction });
      const account3Authenticator = aptos.sign.transaction({ signer: singleSignerSecp256k1Account, transaction });

      const multiKeyAuth = new AccountAuthenticatorMultiKey(
        multiKey,
        [
          // TODO find a fix
          (account1Authenticator as AccountAuthenticatorSingleKey).signature,
          (account3Authenticator as AccountAuthenticatorSingleKey).signature,
        ],
        bitmap,
      );

      const response = await aptos.submit.transaction({ transaction, senderAuthenticator: multiKeyAuth });
      await waitForTransaction({
        aptosConfig: config,
        transactionHash: response.hash,
      });
      expect(response.signature?.type).toBe("single_sender");
    });
  });
  describe("publish move module", () => {
    const account = Account.generate();
    const metadataBytes =
      // eslint-disable-next-line max-len
      "107472616e73616374696f6e5f746573740100000000000000004035364643333939394442364244363842383430304539323438363839393837413338313439344644413241343631334144373946333630323134353539324545ba011f8b08000000000002ff5d8f3d0ec2300c85779f0265e944032b12030b97a8aaca4d4c1b95fc284e0bc72729a503f2e2a7f7d97e6e02aa09076ac1a1a5c3f5205244c7a892f1ae4bc449c04291b32ae6a9ce25001a4d819c26a70c717d0bc9f33de6052f1fa7160693325c8d2905be4899e538f7b5f25662218f4fec796b958f5467a082484b19b2685c053cf7dac4a2bf98f50bc9c7efc236bbeb2a0742ad233113b7b0baddeeaeb9df6701ff9f15a3131fec1509190201000001087472616e73666572ca021f8b08000000000002ff9552cb4ec33010bcf72bf654a522dc10071790101f12b9f1a6582476e407a142fd77fc48d23826125891627b661fb39e4e32db22184585a6b5e1525406b52124dc34a8e07b07e03eab11686fa4ae1a453b1ca4fa20245ed4928be33629c03b87f6f6d4f21a50187581c60a3083ac4e97cafd0a07c7d570e5cac35ef3b34055cef71a6b29d82f00eda415a61ae3ece343064da109c6f41c431953a8758a4d413988bdd43c2f780893f2ab45035e74a4c07338103270f3ce141d9e6e5323e4d5efdfdcf6a508ec32d17338ae53c6b6fe9c33d2cb741287f01a7e457e87ea8cc5beb3cbb6cb65bd5bc45623f8e50c539b3ccb520edca58dc07d3acd75632358cc6f552e52cfb3c9b993ea5481e75e6381dc89a3db8b85df0443b5e9b7959b14d61c3f3d3ff14bee897fbc9caf3fcd6f43ec54364a9d355e7f00fb8d2dcfd603000000000300000000000000000000000000000000000000000000000000000000000000010e4170746f734672616d65776f726b00000000000000000000000000000000000000000000000000000000000000010b4170746f735374646c696200000000000000000000000000000000000000000000000000000000000000010a4d6f76655374646c696200";
    // eslint-disable-next-line max-len
    const byteCode = `a11ceb0b060000000801000602060a031022043208053a4e0788015208da01400c9a024c000001010102020404010001010508000000000100000302010002060506010002070701010002080901010002090a060100020403040404050403060c03050007060c060c0303050503010b0001080101080102060c03010b0001090002050b00010900030b000108010b000108010b0001080102070b000109000b0001090002070b0001090003087472616e736665720a6170746f735f636f696e04636f696e0a74776f5f62795f74776f04436f696e094170746f73436f696e087769746864726177076465706f736974056d657267650765787472616374${account.accountAddress.toStringWithoutPrefix()}00000000000000000000000000000000000000000000000000000000000000010001040003080b000b0138000c030b020b0338010201010400081a0b000a0238000c070b010a0338000c080d070b0838020d070b020b03160b061738030c090b040b0738010b050b0938010200`;
    beforeAll(async () => {
      await aptos.fundAccount({ accountAddress: account.accountAddress.toString(), amount: 100_000_000 });
    });

    test("it generates a publish move module transaction successfully", async () => {
      const transaction = await aptos.publishPackageTransaction({
        account: account.accountAddress.toString(),
        // eslint-disable-next-line max-len
        metadataBytes,
        moduleBytecode: [byteCode],
      });
      expect(transaction.rawTransaction instanceof RawTransaction).toBeTruthy();
      const deserializer = new Deserializer(transaction.rawTransaction.bcsToBytes());
      const deserializedTransaction = RawTransaction.deserialize(deserializer);
      expect(deserializedTransaction instanceof RawTransaction).toBeTruthy();
      expect(deserializedTransaction.payload instanceof TransactionPayloadEntryFunction).toBeTruthy();
    });

    test("it submits a publish move module transaction successfully", async () => {
      const transaction = await aptos.publishPackageTransaction({
        account: account.accountAddress.toString(),
        // eslint-disable-next-line max-len
        metadataBytes,
        moduleBytecode: [byteCode],
      });
      const response = await aptos.signAndSubmitTransaction({
        signer: account,
        transaction,
      });
      await waitForTransaction({
        aptosConfig: config,
        transactionHash: response.hash,
      });
      const accountModules = await aptos.getAccountModules({ accountAddress: account.accountAddress.toString() });
      expect(accountModules[0].bytecode).toEqual(`0x${byteCode}`);
    });
  });
  describe("validate fee payer data on transaction submission", () => {
    test("it throws when trying to simluate a fee payer transaction without the feePayerAuthenticator", async () => {
      const transaction = await aptos.build.transaction({
        sender: legacyED25519SenderAccount.accountAddress.toString(),
        data: {
          function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
          functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
        },
        withFeePayer: true,
      });
      const senderAuthenticator = aptos.sign.transaction({ signer: legacyED25519SenderAccount, transaction });

      await expect(
        aptos.submit.transaction({
          transaction,
          senderAuthenticator,
        }),
      ).rejects.toThrow();
    });

    test("it throws when trying to simluate a multi agent fee payer transaction without the feePayerPublicKey", async () => {
      const transaction = await aptos.build.multiAgentTransaction({
        sender: legacyED25519SenderAccount.accountAddress.toString(),
        secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
        data: {
          function: `${contractPublisherAccount.accountAddress.toString()}::transfer::transfer`,
          functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
        },
        withFeePayer: true,
      });
      const senderAuthenticator = aptos.sign.transaction({ signer: legacyED25519SenderAccount, transaction });
      const secondarySignerAuthenticator = aptos.sign.transaction({ signer: secondarySignerAccount, transaction });

      await expect(
        aptos.submit.multiAgentTransaction({
          transaction,
          senderAuthenticator,
          additionalSignersAuthenticators: [secondarySignerAuthenticator],
        }),
      ).rejects.toThrow();
    });
  });
});
