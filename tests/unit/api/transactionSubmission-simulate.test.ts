// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { Simulate } from "../../../src/api/transactionSubmission/simulate.js";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";
import { SimpleTransaction } from "../../../src/transactions/instances/simpleTransaction.js";

vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  simulateTransaction: vi.fn(),
}));

import { simulateTransaction } from "../../../src/internal/transactionSubmission.js";

const mockSimulate = simulateTransaction as MockedFunction<typeof simulateTransaction>;

describe("api/transactionSubmission.Simulate", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const simulate = new Simulate(config);
  const account = Account.generate();
  const transaction = {} as SimpleTransaction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSimulate.mockResolvedValue([{ hash: "0xsim" } as never]);
  });

  it("simple forwards signer public key and options to simulateTransaction", async () => {
    const responses = await simulate.simple({
      signerPublicKey: account.publicKey,
      transaction,
      options: { estimateGasUnitPrice: true },
    });

    expect(responses[0].hash).toBe("0xsim");
    expect(mockSimulate).toHaveBeenCalledWith({
      aptosConfig: config,
      signerPublicKey: account.publicKey,
      transaction,
      options: { estimateGasUnitPrice: true },
    });
  });

  it("multiAgent forwards secondary signer public keys to simulateTransaction", async () => {
    const secondary = Account.generate();

    await simulate.multiAgent({
      signerPublicKey: account.publicKey,
      transaction,
      secondarySignersPublicKeys: [secondary.publicKey, undefined],
      feePayerPublicKey: account.publicKey,
    });

    expect(mockSimulate).toHaveBeenCalledWith({
      aptosConfig: config,
      signerPublicKey: account.publicKey,
      transaction,
      secondarySignersPublicKeys: [secondary.publicKey, undefined],
      feePayerPublicKey: account.publicKey,
    });
  });
});
