// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AptosConfig,
  Network,
  Aptos,
  AccountAddress,
  Bool,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
  TransactionFeePayerSignature,
  TransactionMultiAgentSignature,
  EntryFunctionArgumentTypes,
  SigningScheme,
  TransactionSignature,
} from "../../../src";
import {
  MAX_U128_BIG_INT,
  MAX_U16_NUMBER,
  MAX_U256_BIG_INT,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U8_NUMBER,
} from "../../../src/bcs/consts";
import { MoveObject, MoveOption, MoveString, MoveVector } from "../../../src/bcs/serializable/moveStructs";
import {
  fundAccounts,
  rawTransactionHelper,
  rawTransactionMultiAgentHelper,
  publishArgumentTestModule,
} from "./helper";

jest.setTimeout(10000);

// This test looks enormous, but the breakdown is quite simple:
//  the `transactionArguments` array contains every possible argument type
//  the `rawTransactionHelper` and `rawTransactionMultiAgentHelper` functions are helpers to generate the transactions,
//    respectively for single signer transactions and for (multi signer & fee payer) transactions
// In any transaction with a `&signer` the move function asserts that the first argument is the senderAccountEd25519's address:
// `senderAccountEd25519_address: address` or all of the `&signer` addresses: `signer_addresses: vector<address>`
// At the end of the tests with fee payers and secondary signers, we assert that the normalized
//   `fee_payer_address` and `secondary_signer_addresses` are correct
//
// TODO: assert that the SignerScheme is correct in the response type

describe("various transaction arguments", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);
  const publisherAccount = Account.generate(SigningScheme.Ed25519);
  const senderAccountEd25519 = Account.generate(SigningScheme.Ed25519);
  const senderAccountSecp256k1 = Account.generate(SigningScheme.Secp256k1Ecdsa);
  const secondarySignerAccounts = [
    Account.generate(SigningScheme.Ed25519),
    Account.generate(SigningScheme.Ed25519),
    Account.generate(SigningScheme.Secp256k1Ecdsa),
    Account.generate(SigningScheme.Secp256k1Ecdsa),
  ];
  const feePayerAccountEd25519 = Account.generate(SigningScheme.Ed25519);
  const feePayerAccountSecp256k1 = Account.generate(SigningScheme.Secp256k1Ecdsa);
  const moduleObjects: Array<MoveObject> = [];
  let transactionArguments: EntryFunctionArgumentTypes[];

  beforeAll(async () => {
    await fundAccounts(aptos, [
      publisherAccount,
      senderAccountEd25519,
      senderAccountSecp256k1,
      ...secondarySignerAccounts,
      feePayerAccountEd25519,
      feePayerAccountSecp256k1,
    ]);
    await publishArgumentTestModule(aptos, publisherAccount);

    // when deploying, `init_module` creates 3 objects and stores them into the `SetupData` resource
    // within that resource is 3 fields: `empty_object_1`, `empty_object_2`, `empty_object_3`
    // we need to extract those objects and use them as arguments for the entry functions
    const accountResources = await aptos.getAccountResources({
      accountAddress: publisherAccount.accountAddress.toString(),
    });

    accountResources.forEach((resource) => {
      const data = resource.data as any;
      if (data.empty_object_1 !== undefined) {
        moduleObjects.push(new MoveObject(data.empty_object_1.inner));
        moduleObjects.push(new MoveObject(data.empty_object_2.inner));
        moduleObjects.push(new MoveObject(data.empty_object_3.inner));
      }
    });

    transactionArguments = [
      new Bool(true),
      new U8(1),
      new U16(2),
      new U32(3),
      new U64(4),
      new U128(5),
      new U256(6),
      publisherAccount.accountAddress,
      new MoveString("expected_string"),
      moduleObjects[0],
      new MoveVector([]),
      MoveVector.Bool([true, false, true]),
      MoveVector.U8([0, 1, 2, MAX_U8_NUMBER - 2, MAX_U8_NUMBER - 1, MAX_U8_NUMBER]),
      MoveVector.U16([0, 1, 2, MAX_U16_NUMBER - 2, MAX_U16_NUMBER - 1, MAX_U16_NUMBER]),
      MoveVector.U32([0, 1, 2, MAX_U32_NUMBER - 2, MAX_U32_NUMBER - 1, MAX_U32_NUMBER]),
      MoveVector.U64([0, 1, 2, MAX_U64_BIG_INT - BigInt(2), MAX_U64_BIG_INT - BigInt(1), MAX_U64_BIG_INT]),
      MoveVector.U128([0, 1, 2, MAX_U128_BIG_INT - BigInt(2), MAX_U128_BIG_INT - BigInt(1), MAX_U128_BIG_INT]),
      MoveVector.U256([0, 1, 2, MAX_U256_BIG_INT - BigInt(2), MAX_U256_BIG_INT - BigInt(1), MAX_U256_BIG_INT]),
      new MoveVector([
        AccountAddress.fromStringRelaxed("0x0"),
        AccountAddress.fromStringRelaxed("0xabc"),
        AccountAddress.fromStringRelaxed("0xdef"),
        AccountAddress.fromStringRelaxed("0x123"),
        AccountAddress.fromStringRelaxed("0x456"),
        AccountAddress.fromStringRelaxed("0x789"),
      ]),
      MoveVector.MoveString(["expected_string", "abc", "def", "123", "456", "789"]),
      new MoveVector(moduleObjects),
      new MoveOption(),
      new MoveOption(new Bool(true)),
      new MoveOption(new U8(1)),
      new MoveOption(new U16(2)),
      new MoveOption(new U32(3)),
      new MoveOption(new U64(4)),
      new MoveOption(new U128(5)),
      new MoveOption(new U256(6)),
      new MoveOption(publisherAccount.accountAddress),
      new MoveOption(new MoveString("expected_string")),
      new MoveOption(moduleObjects[0]),
    ];
  });

  describe("single signer entry functions", () => {
    async function buildAndTestSingleSignerTx(senderAccount: Account, functionName: string, signatureType: string) {
      const response = await rawTransactionHelper(
        aptos,
        publisherAccount,
        senderAccount,
        functionName,
        [],
        [...transactionArguments],
      );
      expect(response.success).toBe(true);
      expect((response.signature! as TransactionSignature).type).toEqual(signatureType);
    }
    describe("sender is ed25519", () => {
      it("successfully submits a public entry fn with all argument types", async () => {
        await buildAndTestSingleSignerTx(senderAccountEd25519, "public_arguments", "ed25519_signature");
      });

      it("successfully submits a private entry fn with all argument types", async () => {
        await buildAndTestSingleSignerTx(senderAccountEd25519, "private_arguments", "ed25519_signature");
      });
    });

    describe("sender is secp256k1", () => {
      it("successfully submits a public entry fn with all argument types", async () => {
        await buildAndTestSingleSignerTx(senderAccountSecp256k1, "public_arguments", "secp256k1_ecdsa_signature");
      });

      it("successfully submits a private entry fn with all argument types", async () => {
        await buildAndTestSingleSignerTx(senderAccountSecp256k1, "private_arguments", "secp256k1_ecdsa_signature");
      });
    });
  });

  // secondary signers are always half ed25519 and secp256k1
  describe("multi signer transaction with all entry function arguments", () => {
    async function buildAndTestMultiSignerTx(senderAccount: Account, functionName: string) {
      const secondarySignerAddresses = secondarySignerAccounts.map((account) => account.accountAddress);
      const response = await rawTransactionMultiAgentHelper(
        aptos,
        publisherAccount,
        senderAccount,
        functionName,
        [],
        [
          new MoveVector<AccountAddress>([senderAccount.accountAddress, ...secondarySignerAddresses]),
          ...transactionArguments,
        ],
        secondarySignerAccounts,
      );
      expect(response.success).toBe(true);
      const responseSignature = response.signature as TransactionMultiAgentSignature;
      const secondarySignerAddressesParsed = responseSignature.secondary_signer_addresses.map((address) =>
        AccountAddress.fromStringRelaxed(address),
      );
      expect(secondarySignerAddressesParsed.map((s) => s.toString())).toEqual(
        secondarySignerAddresses.map((address) => address.toString()),
      );
      expect((responseSignature as any).fee_payer_address).toBeUndefined();
      expect(responseSignature.type).toEqual("multi_agent_signature");
    }

    describe("sender is ed25519", () => {
      it("successfully submits a public entry multi signer transaction with all argument types", async () => {
        await buildAndTestMultiSignerTx(senderAccountEd25519, "public_arguments_multiple_signers");
      });
      it("successfully submits a private entry multi signer transaction with all argument types", async () => {
        await buildAndTestMultiSignerTx(senderAccountEd25519, "private_arguments_multiple_signers");
      });
    });
    describe("sender is secp256k1", () => {
      it("successfully submits a public entry multi signer transaction with all argument types", async () => {
        await buildAndTestMultiSignerTx(senderAccountSecp256k1, "public_arguments_multiple_signers");
      });
      it("successfully submits a private entry multi signer transaction with all argument types", async () => {
        await buildAndTestMultiSignerTx(senderAccountSecp256k1, "private_arguments_multiple_signers");
      });
    });
  });

  describe("fee payer transactions with various numbers of signers", () => {
    async function buildAndTestFeePayerTx(
      senderAccount: Account,
      feePayerAccount: Account,
      secondarySigners: Array<Account>,
      functionName: string,
    ) {
      let txArgs;
      // If there are secondary signers, we need to add them to the transaction arguments,
      // because it verifies them in the Move function
      const secondarySignerAddresses = secondarySigners.map((account) => account.accountAddress);
      if (secondarySigners.length > 0) {
        const allSignerAddresses = [senderAccount.accountAddress, ...secondarySignerAddresses];
        txArgs = [new MoveVector<AccountAddress>(allSignerAddresses), ...transactionArguments];
      } else {
        txArgs = [...transactionArguments];
      }
      const response = await rawTransactionMultiAgentHelper(
        aptos,
        publisherAccount,
        senderAccount,
        functionName,
        [],
        [...txArgs],
        [...secondarySigners], // secondary signers, empty in some test cases.
        feePayerAccount,
      );
      expect(response.success).toBe(true);
      const responseSignature = response.signature as TransactionFeePayerSignature;
      expect(responseSignature.secondary_signer_addresses.length).toEqual(secondarySigners.length);
      const secondarySignerAddressesParsed = responseSignature.secondary_signer_addresses.map((address) =>
        AccountAddress.fromStringRelaxed(address),
      );
      expect(secondarySignerAddressesParsed.map((s) => s.toString())).toEqual(
        secondarySignerAddresses.map((address) => address.toString()),
      );
      expect(AccountAddress.fromStringRelaxed(responseSignature.fee_payer_address).toString()).toEqual(
        feePayerAccount.accountAddress.toString(),
      );
      expect(responseSignature.type).toEqual("fee_payer_signature");
    }

    describe("sender and fee payer are ed25519", () => {
      it("successfully submits a sponsored transaction with all argument types", async () => {
        await buildAndTestFeePayerTx(senderAccountEd25519, feePayerAccountEd25519, [], "public_arguments");
      });

      it("successfully submits a sponsored multi signer transaction with all argument types", async () => {
        await buildAndTestFeePayerTx(
          senderAccountEd25519,
          feePayerAccountEd25519,
          secondarySignerAccounts,
          "public_arguments_multiple_signers",
        );
      });
    });
    describe("sender and fee payer are secp2565k1", () => {
      it("successfully submits a sponsored transaction with all argument types", async () => {
        await buildAndTestFeePayerTx(senderAccountSecp256k1, feePayerAccountSecp256k1, [], "public_arguments");
      });

      it("successfully submits a sponsored multi signer transaction with all argument types", async () => {
        await buildAndTestFeePayerTx(
          senderAccountSecp256k1,
          feePayerAccountSecp256k1,
          secondarySignerAccounts,
          "public_arguments_multiple_signers",
        );
      });
    });
  });
});
