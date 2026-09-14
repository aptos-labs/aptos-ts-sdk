// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { Build } from "../../../src/api/transactionSubmission/build.js";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { AccountAddress } from "../../../src/core/index.js";
import { SimpleTransaction } from "../../../src/transactions/instances/simpleTransaction.js";
import { MultiAgentTransaction } from "../../../src/transactions/instances/multiAgentTransaction.js";

vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  generateTransaction: vi.fn(),
}));

import { generateTransaction } from "../../../src/internal/transactionSubmission.js";

const mockGenerate = generateTransaction as MockedFunction<typeof generateTransaction>;

describe("api/transactionSubmission.Build", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const build = new Build(config);
  const sender = AccountAddress.ONE;
  const data = {
    function: "0x1::aptos_account::transfer" as const,
    functionArguments: [AccountAddress.from("0x2"), 100],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("simple forwards sender, payload data, and options to generateTransaction", async () => {
    const txn = {} as SimpleTransaction;
    mockGenerate.mockResolvedValue(txn);

    const result = await build.simple({
      sender,
      data,
      options: { maxGasAmount: 500 },
      withFeePayer: true,
    });

    expect(result).toBe(txn);
    expect(mockGenerate).toHaveBeenCalledWith({
      aptosConfig: config,
      sender,
      data,
      options: { maxGasAmount: 500 },
      withFeePayer: true,
    });
  });

  it("multiAgent forwards secondary signer addresses to generateTransaction", async () => {
    const txn = {} as MultiAgentTransaction;
    mockGenerate.mockResolvedValue(txn);
    const secondarySignerAddresses = [AccountAddress.from("0x3"), AccountAddress.from("0x4")];

    const result = await build.multiAgent({
      sender,
      data,
      secondarySignerAddresses,
      withFeePayer: false,
    });

    expect(result).toBe(txn);
    expect(mockGenerate).toHaveBeenCalledWith({
      aptosConfig: config,
      sender,
      data,
      secondarySignerAddresses,
      withFeePayer: false,
    });
  });
});
