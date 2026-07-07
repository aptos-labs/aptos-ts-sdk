// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";
import { AccountAddress } from "../../../src/core/index.js";
import {
  buildTransactionPayload,
  buildRawTransaction,
  generateTransaction,
} from "../../../src/internal/transactionSubmission.js";
import { SimpleTransaction } from "../../../src/transactions/instances/simpleTransaction.js";
import { MultiAgentTransaction } from "../../../src/transactions/instances/multiAgentTransaction.js";
import {
  TransactionPayloadEntryFunction,
  EntryFunction,
} from "../../../src/transactions/instances/transactionPayload.js";
import { ModuleId } from "../../../src/transactions/instances/moduleId.js";
import { Identifier } from "../../../src/transactions/instances/identifier.js";

vi.mock("../../../src/transactions/transactionBuilder/transactionBuilder.js", () => ({
  buildTransaction: vi.fn(),
  generateTransactionPayload: vi.fn(),
}));

import {
  buildTransaction,
  generateTransactionPayload,
} from "../../../src/transactions/transactionBuilder/transactionBuilder.js";

const mockedBuildTransaction = buildTransaction as MockedFunction<typeof buildTransaction>;
const mockedGenerateTransactionPayload = generateTransactionPayload as MockedFunction<
  typeof generateTransactionPayload
>;

const aptosConfig = new AptosConfig({ network: Network.LOCAL });
const sender = Account.generate();

function makeEntryPayload(): TransactionPayloadEntryFunction {
  const moduleId = new ModuleId(AccountAddress.ONE, new Identifier("aptos_account"));
  return new TransactionPayloadEntryFunction(new EntryFunction(moduleId, new Identifier("transfer"), [], []));
}

describe("internal/transactionSubmission — build paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGenerateTransactionPayload.mockResolvedValue(makeEntryPayload());
    mockedBuildTransaction.mockResolvedValue(new SimpleTransaction({} as never));
  });

  describe("buildTransactionPayload", () => {
    it("builds a script payload directly when bytecode is provided", async () => {
      const scriptPayload = makeEntryPayload();
      mockedGenerateTransactionPayload.mockResolvedValue(scriptPayload as never);

      const payload = await buildTransactionPayload({
        aptosConfig,
        sender: sender.accountAddress,
        data: { bytecode: "0x01", typeArguments: [], functionArguments: [] },
      });

      expect(payload).toBe(scriptPayload);
      expect(mockedGenerateTransactionPayload).toHaveBeenCalledWith({
        bytecode: "0x01",
        typeArguments: [],
        functionArguments: [],
      });
    });

    it("merges aptosConfig for multisig entry-function payloads", async () => {
      await buildTransactionPayload({
        aptosConfig,
        sender: sender.accountAddress,
        data: {
          multisigAddress: "0x2",
          function: "0x1::coin::transfer",
          functionArguments: [],
          typeArguments: [],
        },
      });

      expect(mockedGenerateTransactionPayload).toHaveBeenCalledWith({
        aptosConfig,
        multisigAddress: "0x2",
        function: "0x1::coin::transfer",
        functionArguments: [],
        typeArguments: [],
        abi: undefined,
      });
    });

    it("merges aptosConfig for plain entry-function payloads", async () => {
      await buildTransactionPayload({
        aptosConfig,
        sender: sender.accountAddress,
        data: {
          function: "0x1::coin::transfer",
          functionArguments: [],
          typeArguments: [],
        },
      });

      expect(mockedGenerateTransactionPayload).toHaveBeenCalledWith({
        aptosConfig,
        function: "0x1::coin::transfer",
        functionArguments: [],
        typeArguments: [],
        abi: undefined,
      });
    });
  });

  describe("buildRawTransaction", () => {
    it("returns a SimpleTransaction for single-signer input", async () => {
      const simple = new SimpleTransaction({} as never);
      mockedBuildTransaction.mockResolvedValue(simple);

      const txn = await buildRawTransaction({
        aptosConfig,
        sender: sender.accountAddress,
        data: { function: "0x1::coin::transfer", functionArguments: [], typeArguments: [] },
      });

      expect(txn).toBe(simple);
      expect(mockedBuildTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          aptosConfig,
          sender: sender.accountAddress,
          feePayerAddress: undefined,
        }),
      );
    });

    it("sets feePayerAddress to ZERO for sponsored transactions", async () => {
      await buildRawTransaction({
        aptosConfig,
        sender: sender.accountAddress,
        withFeePayer: true,
        data: { function: "0x1::coin::transfer", functionArguments: [], typeArguments: [] },
      });

      expect(mockedBuildTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          feePayerAddress: AccountAddress.ZERO.toString(),
        }),
      );
    });

    it("forwards secondarySignerAddresses for multi-agent transactions", async () => {
      const multi = new MultiAgentTransaction({} as never, [AccountAddress.A]);
      mockedBuildTransaction.mockResolvedValue(multi);
      const secondary = [Account.generate().accountAddress];

      const txn = await buildRawTransaction({
        aptosConfig,
        sender: sender.accountAddress,
        secondarySignerAddresses: secondary,
        data: { function: "0x1::coin::transfer", functionArguments: [], typeArguments: [] },
      });

      expect(txn).toBe(multi);
      expect(mockedBuildTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ secondarySignerAddresses: secondary }),
      );
    });
  });

  describe("generateTransaction", () => {
    it("chains buildTransactionPayload and buildRawTransaction", async () => {
      const simple = new SimpleTransaction({} as never);
      mockedBuildTransaction.mockResolvedValue(simple);

      const txn = await generateTransaction({
        aptosConfig,
        sender: sender.accountAddress,
        data: { function: "0x1::coin::transfer", functionArguments: [], typeArguments: [] },
      });

      expect(txn).toBe(simple);
      expect(mockedGenerateTransactionPayload).toHaveBeenCalled();
      expect(mockedBuildTransaction).toHaveBeenCalled();
    });
  });
});
