// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Offline coverage for src/transactions/transactionBuilder/transactionBuilder.ts
 * helpers that do not require a live fullnode when sequence/gas options are supplied.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";
import { AccountAddress } from "../../../src/core/index.js";
import { Ed25519PrivateKey } from "../../../src/core/crypto/ed25519.js";
import { Secp256k1PrivateKey } from "../../../src/core/crypto/secp256k1.js";
import { KeylessPublicKey } from "../../../src/core/crypto/keyless.js";
import { MultiKey } from "../../../src/core/crypto/multiKey.js";
import { MultiEd25519PublicKey, MultiEd25519Signature } from "../../../src/core/crypto/multiEd25519.js";
import { AnyPublicKey, AnySignature } from "../../../src/core/crypto/singleKey.js";
import { AnyPublicKeyVariant } from "../../../src/types/types.js";
import { keylessTestObject } from "../helper.js";
import {
  AccountAuthenticatorEd25519,
  AccountAuthenticatorMultiEd25519,
  AccountAuthenticatorSingleKey,
} from "../../../src/transactions/authenticator/account.js";
import {
  buildTransaction,
  convertPayloadToInnerPayload,
  generateRawTransaction,
  generateSignedTransaction,
  generateSignedTransactionForSimulation,
  generateTransactionPayload,
  generateUserTransactionHash,
  generateViewFunctionPayloadWithABI,
  getAuthenticatorForSimulation,
  hashValues,
} from "../../../src/transactions/transactionBuilder/transactionBuilder.js";
import {
  EntryFunction,
  MultiSig,
  MultiSigTransactionPayload,
  Script,
  TransactionPayloadEntryFunction,
  TransactionPayloadMultiSig,
  TransactionPayloadScript,
  TransactionExecutableEntryFunction,
  TransactionInnerPayloadV1,
} from "../../../src/transactions/instances/transactionPayload.js";
import {
  generateTransactionPayloadWithABI,
  generateViewFunctionPayload,
} from "../../../src/transactions/transactionBuilder/transactionBuilder.js";
import type { FunctionABI } from "../../../src/transactions/types.js";
import { TypeTagAddress, TypeTagU64 } from "../../../src/transactions/typeTag/index.js";
import { ModuleId } from "../../../src/transactions/instances/moduleId.js";
import { Identifier } from "../../../src/transactions/instances/identifier.js";
import { SimpleTransaction } from "../../../src/transactions/instances/simpleTransaction.js";
import { MultiAgentTransaction } from "../../../src/transactions/instances/multiAgentTransaction.js";
import { RawTransaction } from "../../../src/transactions/instances/rawTransaction.js";
import { ChainId } from "../../../src/transactions/instances/chainId.js";
import { createMockClient } from "../../helpers/mockClient.js";
import { clearMemoizeCache } from "../../../src/utils/memoize.js";

const aptosConfig = new AptosConfig({ network: Network.LOCAL });
const sender = Account.generate();

function makeEntryPayload(): TransactionPayloadEntryFunction {
  const moduleId = new ModuleId(AccountAddress.ONE, new Identifier("aptos_account"));
  return new TransactionPayloadEntryFunction(new EntryFunction(moduleId, new Identifier("transfer"), [], []));
}

function makeRaw(seq = 1n): RawTransaction {
  return new RawTransaction(
    sender.accountAddress,
    seq,
    makeEntryPayload(),
    200000n,
    100n,
    9_999_999_999n,
    new ChainId(4),
  );
}

describe("transactionBuilder/transactionBuilder", () => {
  beforeEach(() => {
    clearMemoizeCache();
    vi.restoreAllMocks();
  });

  describe("hashValues + generateUserTransactionHash", () => {
    it("hashValues concatenates sha3 inputs in order", () => {
      const a = hashValues(["hello", new Uint8Array([1, 2])]);
      const b = hashValues(["hello", new Uint8Array([1, 2])]);
      expect(a).toEqual(b);
      expect(a.length).toBe(32);
    });

    it("generateUserTransactionHash returns a 0x-prefixed hex digest", () => {
      const simple = new SimpleTransaction(makeRaw());
      const sk = new Ed25519PrivateKey(new Uint8Array(32).fill(7));
      const auth = new AccountAuthenticatorEd25519(sk.publicKey(), sk.sign(new Uint8Array([1])));

      const hash = generateUserTransactionHash({
        transaction: simple,
        senderAuthenticator: auth,
      });

      expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
    });
  });

  describe("convertPayloadToInnerPayload", () => {
    it("wraps an entry-function payload with replay protection nonce", () => {
      const inner = convertPayloadToInnerPayload(makeEntryPayload(), 42n);
      expect(inner).toBeInstanceOf(TransactionInnerPayloadV1);
      expect((inner as TransactionInnerPayloadV1).executable).toBeInstanceOf(TransactionExecutableEntryFunction);
    });

    it("wraps script and multisig payload variants", () => {
      const scriptPayload = new TransactionPayloadScript(new Script(new Uint8Array([1]), [], []));
      const scriptInner = convertPayloadToInnerPayload(scriptPayload, 1n);
      expect(scriptInner).toBeInstanceOf(TransactionInnerPayloadV1);

      const entry = makeEntryPayload();
      const msPayload = new TransactionPayloadMultiSig(
        new MultiSig(AccountAddress.A, new MultiSigTransactionPayload(entry.entryFunction)),
      );
      const msInner = convertPayloadToInnerPayload(msPayload, 2n);
      expect(msInner).toBeInstanceOf(TransactionInnerPayloadV1);

      const scriptMsPayload = new TransactionPayloadMultiSig(
        new MultiSig(AccountAddress.A, new MultiSigTransactionPayload(new Script(new Uint8Array([2]), [], []))),
      );
      expect(convertPayloadToInnerPayload(scriptMsPayload)).toBeInstanceOf(TransactionInnerPayloadV1);

      const emptyMsPayload = new TransactionPayloadMultiSig(new MultiSig(AccountAddress.A));
      expect(convertPayloadToInnerPayload(emptyMsPayload)).toBeInstanceOf(TransactionInnerPayloadV1);
    });

    it("throws for unsupported payload instances", () => {
      expect(() => convertPayloadToInnerPayload({} as never)).toThrow(/Unsupported payload type/);
    });
  });

  describe("generateRawTransaction", () => {
    it("uses accountSequenceNumber from options without hitting the network", async () => {
      const raw = await generateRawTransaction({
        aptosConfig,
        sender: sender.accountAddress,
        payload: makeEntryPayload(),
        options: { accountSequenceNumber: 99, gasUnitPrice: 100, maxGasAmount: 50000 },
      });

      expect(raw.sequence_number).toBe(99n);
      expect(raw.gas_unit_price).toBe(100n);
      expect(raw.max_gas_amount).toBe(50000n);
      expect(raw.chain_id.chainId).toBe(4);
    });

    it("throws when both replayProtectionNonce and accountSequenceNumber are set", async () => {
      await expect(
        generateRawTransaction({
          aptosConfig,
          sender: sender.accountAddress,
          payload: makeEntryPayload(),
          options: { replayProtectionNonce: 1, accountSequenceNumber: 2 },
        }),
      ).rejects.toThrow(/Cannot specify both replayProtectionNonce and accountSequenceNumber/);
    });

    it("uses sequence u64::MAX for orderless replayProtectionNonce", async () => {
      const raw = await generateRawTransaction({
        aptosConfig,
        sender: sender.accountAddress,
        payload: makeEntryPayload(),
        options: { replayProtectionNonce: 7, gasUnitPrice: 100 },
      });

      expect(raw.sequence_number).toBe(18_446_744_073_709_551_615n);
    });

    it("fetches sequence_number from fullnode when not provided in options", async () => {
      const mock = createMockClient();
      mock.enqueue({ data: { sequence_number: "12", authentication_key: "0x1" } });

      const raw = await generateRawTransaction({
        aptosConfig: mock.config,
        sender: sender.accountAddress,
        payload: makeEntryPayload(),
        options: { gasUnitPrice: 50 },
      });

      expect(raw.sequence_number).toBe(12n);
    });
  });

  describe("buildTransaction", () => {
    it("returns SimpleTransaction for single-signer args", async () => {
      const txn = await buildTransaction({
        aptosConfig,
        sender: sender.accountAddress,
        payload: makeEntryPayload(),
        options: { accountSequenceNumber: 1, gasUnitPrice: 100 },
      });

      expect(txn).toBeInstanceOf(SimpleTransaction);
      expect(txn.feePayerAddress).toBeUndefined();
    });

    it("returns MultiAgentTransaction when secondary signers are provided", async () => {
      const secondary = Account.generate().accountAddress;
      const txn = await buildTransaction({
        aptosConfig,
        sender: sender.accountAddress,
        payload: makeEntryPayload(),
        secondarySignerAddresses: [secondary],
        feePayerAddress: AccountAddress.ZERO,
        options: { accountSequenceNumber: 1, gasUnitPrice: 100 },
      });

      expect(txn).toBeInstanceOf(MultiAgentTransaction);
      expect(txn.secondarySignerAddresses).toHaveLength(1);
      expect(txn.feePayerAddress?.toString()).toBe(AccountAddress.ZERO.toString());
    });
  });

  describe("generateTransactionPayload (script)", () => {
    it("builds a script payload from bytecode", async () => {
      const payload = await generateTransactionPayload({
        bytecode: "0x00",
        typeArguments: [],
        functionArguments: [],
      });

      expect(payload).toBeInstanceOf(TransactionPayloadScript);
    });
  });

  describe("generateTransactionPayload (multisig script)", () => {
    it("wraps script bytecode in a multisig payload when multisigAddress is set", async () => {
      const payload = await generateTransactionPayload({
        bytecode: "0x00",
        typeArguments: [],
        functionArguments: [],
        multisigAddress: AccountAddress.A,
      });

      expect(payload).toBeInstanceOf(TransactionPayloadMultiSig);
    });
  });

  describe("generateTransactionPayloadWithABI", () => {
    const transferAbi: FunctionABI = {
      typeParameters: [],
      parameters: [new TypeTagAddress(), new TypeTagU64()],
    };

    it("throws when type argument count mismatches the ABI", () => {
      expect(() =>
        generateTransactionPayloadWithABI({
          function: "0x1::aptos_account::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [Account.generate().accountAddress, 1],
          abi: transferAbi,
        }),
      ).toThrow(/Type argument count mismatch, expected 0, received 1/);
    });

    it("builds a multisig entry-function payload when multisigAddress is provided", () => {
      const payload = generateTransactionPayloadWithABI({
        function: "0x1::aptos_account::transfer",
        typeArguments: [],
        functionArguments: [Account.generate().accountAddress, 1],
        abi: transferAbi,
        multisigAddress: AccountAddress.A,
      });

      expect(payload).toBeInstanceOf(TransactionPayloadMultiSig);
    });
  });

  describe("generateViewFunctionPayload", () => {
    beforeEach(() => clearMemoizeCache());

    it("fetches a view ABI and returns an EntryFunction", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: {
          abi: {
            address: "0x1",
            name: "chain_id",
            friends: [],
            exposed_functions: [
              {
                name: "get",
                visibility: "public",
                is_entry: false,
                is_view: true,
                generic_type_params: [],
                params: [],
                return: ["u8"],
              },
            ],
            structs: [],
          },
        },
      });

      const entry = await generateViewFunctionPayload({
        aptosConfig: mock.config,
        function: "0x1::chain_id::get",
      });

      expect(entry).toBeInstanceOf(EntryFunction);
    });
  });

  describe("generateViewFunctionPayloadWithABI", () => {
    const viewAbi: FunctionABI = {
      typeParameters: [],
      parameters: [],
    };

    it("throws on type-argument and function-argument mismatches", () => {
      expect(() =>
        generateViewFunctionPayloadWithABI({
          function: "0x1::chain_id::get",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          abi: viewAbi,
        }),
      ).toThrow(/Type argument count mismatch/);

      expect(() =>
        generateViewFunctionPayloadWithABI({
          function: "0x1::chain_id::get",
          typeArguments: [],
          functionArguments: [1],
          abi: viewAbi,
        }),
      ).toThrow(/Too many arguments/);
    });

    it("builds an EntryFunction for a zero-arg view ABI", () => {
      const entry = generateViewFunctionPayloadWithABI({
        function: "0x1::chain_id::get",
        typeArguments: [],
        abi: viewAbi,
      });
      expect(entry).toBeInstanceOf(EntryFunction);
    });
  });

  describe("generateRawTransaction — network lookups", () => {
    it("fetches gas price estimation when gasUnitPrice is omitted on non-local networks", async () => {
      const mock = createMockClient({ network: Network.TESTNET });
      mock.enqueue({ data: { gas_estimate: 77 } });
      mock.enqueue({ data: { sequence_number: "3", authentication_key: "0x1" } });

      const raw = await generateRawTransaction({
        aptosConfig: mock.config,
        sender: sender.accountAddress,
        payload: makeEntryPayload(),
        options: {},
      });

      expect(raw.gas_unit_price).toBe(77n);
    });

    it("uses sequence number 0 for sponsored transactions when the sender account is missing", async () => {
      const mock = createMockClient();
      mock.enqueueError(new Error("account not found"));

      const raw = await generateRawTransaction({
        aptosConfig: mock.config,
        sender: sender.accountAddress,
        payload: makeEntryPayload(),
        feePayerAddress: AccountAddress.ZERO,
        options: { gasUnitPrice: 100 },
      });

      expect(raw.sequence_number).toBe(0n);
    });
  });

  describe("generateTransactionPayload (entry function via remote ABI)", () => {
    beforeEach(() => clearMemoizeCache());

    it("fetches ABI and builds an entry-function payload", async () => {
      const mock = createMockClient();
      mock.enqueue({
        data: {
          abi: {
            address: "0x1",
            name: "aptos_account",
            friends: [],
            exposed_functions: [
              {
                name: "transfer",
                visibility: "public",
                is_entry: true,
                is_view: false,
                generic_type_params: [],
                params: ["address", "u64"],
                return: [],
              },
            ],
            structs: [],
          },
        },
      });

      const payload = await generateTransactionPayload({
        aptosConfig: mock.config,
        function: "0x1::aptos_account::transfer",
        functionArguments: [Account.generate().accountAddress, 1],
        typeArguments: [],
      });

      expect(payload).toBeInstanceOf(TransactionPayloadEntryFunction);
    });
  });

  describe("generateSignedTransaction", () => {
    const simple = new SimpleTransaction(makeRaw());
    const sk = new Ed25519PrivateKey(new Uint8Array(32).fill(3));
    const edAuth = new AccountAuthenticatorEd25519(sk.publicKey(), sk.sign(new Uint8Array([2])));

    it("serializes a single-signer ed25519 transaction", () => {
      const bytes = generateSignedTransaction({ transaction: simple, senderAuthenticator: edAuth });
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);
    });

    it("throws when fee payer authenticator is missing", () => {
      const feePayerTxn = new SimpleTransaction(makeRaw(), AccountAddress.A);
      expect(() => generateSignedTransaction({ transaction: feePayerTxn, senderAuthenticator: edAuth })).toThrow(
        /Must provide a feePayerAuthenticator/,
      );
    });

    it("throws when multi-agent additional authenticators are missing", () => {
      const multi = new MultiAgentTransaction(makeRaw(), [AccountAddress.A]);
      expect(() => generateSignedTransaction({ transaction: multi, senderAuthenticator: edAuth })).toThrow(
        /Must provide a additionalSignersAuthenticators/,
      );
    });
  });

  describe("getAuthenticatorForSimulation + generateSignedTransactionForSimulation", () => {
    it("returns a no-op authenticator when public key is omitted", async () => {
      const auth = await getAuthenticatorForSimulation(undefined);
      expect(auth).toBeDefined();
    });

    it("builds signed bytes for a simple transaction simulation", async () => {
      const simple = new SimpleTransaction(makeRaw());
      const bytes = await generateSignedTransactionForSimulation({
        transaction: simple,
        signerPublicKey: sender.publicKey,
      });
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);
    });

    it("builds signed bytes for a fee-payer simple transaction without secondary signers", async () => {
      const feePayerTxn = new SimpleTransaction(makeRaw(), AccountAddress.A);
      const bytes = await generateSignedTransactionForSimulation({
        transaction: feePayerTxn,
        signerPublicKey: sender.publicKey,
        feePayerPublicKey: Account.generate().publicKey,
      });
      expect(bytes.length).toBeGreaterThan(0);
    });

    it("builds signed bytes for a fee-payer multi-agent simulation", async () => {
      const secondary = Account.generate().accountAddress;
      const multi = new MultiAgentTransaction(makeRaw(), [secondary], AccountAddress.A);
      const bytes = await generateSignedTransactionForSimulation({
        transaction: multi,
        signerPublicKey: sender.publicKey,
        feePayerPublicKey: Account.generate().publicKey,
        secondarySignersPublicKeys: [Account.generate().publicKey],
      });
      expect(bytes.length).toBeGreaterThan(0);
    });

    it("uses placeholder secondary authenticators when secondary signer keys are omitted", async () => {
      const secondary = Account.generate().accountAddress;
      const multi = new MultiAgentTransaction(makeRaw(), [secondary]);
      const bytes = await generateSignedTransactionForSimulation({
        transaction: multi,
        signerPublicKey: sender.publicKey,
      });
      expect(bytes.length).toBeGreaterThan(0);
    });

    it("wraps Secp256k1 and keyless public keys for simulation", async () => {
      const secp = new Secp256k1PrivateKey(new Uint8Array(32).fill(8));
      const secpAuth = await getAuthenticatorForSimulation(secp.publicKey());
      expect(secpAuth).toBeDefined();

      const keylessPk = new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment);
      const keylessAuth = await getAuthenticatorForSimulation(keylessPk);
      expect(keylessAuth).toBeDefined();
    });

    it("builds a multi-key simulation authenticator with mixed key types", async () => {
      const ed = Account.generate();
      const keylessPk = new AnyPublicKey(new KeylessPublicKey(keylessTestObject.iss, keylessTestObject.idCommitment));
      const mk = new MultiKey({ publicKeys: [ed.publicKey, keylessPk], signaturesRequired: 2 });
      const auth = await getAuthenticatorForSimulation(mk);
      expect(auth).toBeDefined();
    });

    it("throws for unsupported public key types in simulation", async () => {
      class FakePublicKey {
        toUint8Array() {
          return new Uint8Array(32);
        }
      }
      await expect(getAuthenticatorForSimulation(new FakePublicKey() as never)).rejects.toThrow(
        /Unsupported PublicKey used for simulations/,
      );
    });

    it("serializes a no-account-authenticator simple simulation", async () => {
      const simple = new SimpleTransaction(makeRaw());
      const bytes = await generateSignedTransactionForSimulation({
        transaction: simple,
        signerPublicKey: undefined,
      });
      expect(bytes.length).toBeGreaterThan(0);
    });
  });

  describe("generateSignedTransaction — success paths", () => {
    const simple = new SimpleTransaction(makeRaw());
    const sk = new Ed25519PrivateKey(new Uint8Array(32).fill(3));
    const edAuth = new AccountAuthenticatorEd25519(sk.publicKey(), sk.sign(new Uint8Array([2])));

    it("serializes a fee-payer transaction when feePayerAuthenticator is supplied", () => {
      const feePayerTxn = new SimpleTransaction(makeRaw(), AccountAddress.A);
      const feePayerSk = new Ed25519PrivateKey(new Uint8Array(32).fill(4));
      const feePayerAuth = new AccountAuthenticatorEd25519(
        feePayerSk.publicKey(),
        feePayerSk.sign(new Uint8Array([3])),
      );

      const bytes = generateSignedTransaction({
        transaction: feePayerTxn,
        senderAuthenticator: edAuth,
        feePayerAuthenticator: feePayerAuth,
      });
      expect(bytes.length).toBeGreaterThan(0);
    });

    it("serializes a multi-agent transaction when additional authenticators are supplied", () => {
      const multi = new MultiAgentTransaction(makeRaw(), [AccountAddress.A]);
      const secondarySk = new Ed25519PrivateKey(new Uint8Array(32).fill(5));
      const secondaryAuth = new AccountAuthenticatorEd25519(
        secondarySk.publicKey(),
        secondarySk.sign(new Uint8Array([4])),
      );

      const bytes = generateSignedTransaction({
        transaction: multi,
        senderAuthenticator: edAuth,
        additionalSignersAuthenticators: [secondaryAuth],
      });
      expect(bytes.length).toBeGreaterThan(0);
    });

    it("serializes legacy multi-ed25519 and single-key sender authenticators", () => {
      const k1 = new Ed25519PrivateKey(new Uint8Array(32).fill(10));
      const k2 = new Ed25519PrivateKey(new Uint8Array(32).fill(11));
      const multiPub = new MultiEd25519PublicKey({
        publicKeys: [k1.publicKey(), k2.publicKey()],
        threshold: 2,
      });
      const msg = new Uint8Array([9]);
      const multiAuth = new AccountAuthenticatorMultiEd25519(
        multiPub,
        new MultiEd25519Signature({ signatures: [k1.sign(msg), k2.sign(msg)], bitmap: [0, 1] }),
      );

      const multiBytes = generateSignedTransaction({
        transaction: simple,
        senderAuthenticator: multiAuth,
      });
      expect(multiBytes.length).toBeGreaterThan(0);

      const secp = new Secp256k1PrivateKey(new Uint8Array(32).fill(12));
      const anyPk = new AnyPublicKey(secp.publicKey(), AnyPublicKeyVariant.Secp256k1);
      const singleKeyAuth = new AccountAuthenticatorSingleKey(anyPk, new AnySignature(secp.sign(msg)));
      const singleKeyBytes = generateSignedTransaction({
        transaction: simple,
        senderAuthenticator: singleKeyAuth,
      });
      expect(singleKeyBytes.length).toBeGreaterThan(0);
    });
  });
});
