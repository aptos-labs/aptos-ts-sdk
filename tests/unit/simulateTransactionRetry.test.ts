import { vi, type MockedFunction } from "vitest";
import { AptosConfig } from "../../src/api/aptosConfig";
import { Network } from "../../src/utils/apiEndpoints";
import type { UserTransactionResponse } from "../../src/types";
import type { postAptosFullNode as PostType } from "../../src/client";
import type { simulateTransaction as SimType } from "../../src/internal/transactionSubmission";

const makeSimulationResponse = (overrides: Partial<UserTransactionResponse> = {}): UserTransactionResponse =>
  ({
    version: "1",
    hash: "0x123",
    state_change_hash: "0x000",
    event_root_hash: "0x000",
    state_checkpoint_hash: null,
    gas_used: "100",
    success: true,
    vm_status: "Executed successfully",
    accumulator_root_hash: "0x000",
    changes: [],
    sender: "0x1",
    sequence_number: "0",
    max_gas_amount: "200000",
    gas_unit_price: "100",
    expiration_timestamp_secs: "9999999999",
    payload: { type: "entry_function_payload", function: "0x1::coin::transfer", type_arguments: [], arguments: [] },
    events: [],
    timestamp: "1000000",
    ...overrides,
  }) as unknown as UserTransactionResponse;

const dummyTransaction = {
  rawTransaction: {},
  feePayerAddress: undefined,
  secondarySignerAddresses: undefined,
} as any;

async function setupMocks() {
  vi.resetModules();

  vi.doMock("../../src/client", () => ({
    postAptosFullNode: vi.fn(),
  }));

  vi.doMock("../../src/transactions/transactionBuilder/transactionBuilder", () => ({
    generateSignedTransactionForSimulation: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
    buildTransaction: vi.fn(),
    generateTransactionPayload: vi.fn(),
    generateSignedTransaction: vi.fn(),
    getAuthenticatorForSimulation: vi.fn(),
  }));

  const { postAptosFullNode } = await import("../../src/client");
  const { simulateTransaction } = await import("../../src/internal/transactionSubmission");
  return {
    mockPost: postAptosFullNode as MockedFunction<typeof PostType>,
    simulateTransaction: simulateTransaction as typeof SimType,
  };
}

describe("simulateTransaction retry on gas estimation failure", () => {
  const aptosConfig = new AptosConfig({ network: Network.LOCAL });

  test("retries without estimateMaxGasAmount when server returns MAX_GAS_UNITS_BELOW_MIN_TRANSACTION_GAS_UNITS", async () => {
    const { mockPost, simulateTransaction } = await setupMocks();

    const failedResponse = makeSimulationResponse({
      success: false,
      vm_status: "MAX_GAS_UNITS_BELOW_MIN_TRANSACTION_GAS_UNITS",
      gas_used: "0",
      max_gas_amount: "2",
    });
    const successResponse = makeSimulationResponse({
      success: true,
      vm_status: "Executed successfully",
      max_gas_amount: "200000",
    });

    mockPost
      .mockResolvedValueOnce({ data: [failedResponse] } as any)
      .mockResolvedValueOnce({ data: [successResponse] } as any);

    const result = await simulateTransaction({
      aptosConfig,
      transaction: dummyTransaction,
      options: {
        estimateMaxGasAmount: true,
        estimateGasUnitPrice: true,
      },
    });

    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(mockPost.mock.calls[0][0].params).toEqual(expect.objectContaining({ estimate_max_gas_amount: true }));
    expect(mockPost.mock.calls[1][0].params).toEqual(expect.objectContaining({ estimate_max_gas_amount: false }));
    expect(mockPost.mock.calls[1][0].params).toEqual(expect.objectContaining({ estimate_gas_unit_price: true }));
    expect(result).toEqual([successResponse]);
  });

  test("does not retry when estimateMaxGasAmount is false", async () => {
    const { mockPost, simulateTransaction } = await setupMocks();

    const failedResponse = makeSimulationResponse({
      success: false,
      vm_status: "MAX_GAS_UNITS_BELOW_MIN_TRANSACTION_GAS_UNITS",
      max_gas_amount: "2",
    });

    mockPost.mockResolvedValueOnce({ data: [failedResponse] } as any);

    const result = await simulateTransaction({
      aptosConfig,
      transaction: dummyTransaction,
      options: { estimateMaxGasAmount: false },
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(result).toEqual([failedResponse]);
  });

  test("does not retry when simulation succeeds", async () => {
    const { mockPost, simulateTransaction } = await setupMocks();

    const successResponse = makeSimulationResponse({
      success: true,
      vm_status: "Executed successfully",
    });

    mockPost.mockResolvedValueOnce({ data: [successResponse] } as any);

    const result = await simulateTransaction({
      aptosConfig,
      transaction: dummyTransaction,
      options: { estimateMaxGasAmount: true },
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(result).toEqual([successResponse]);
  });

  test("does not retry when vm_status is a different error", async () => {
    const { mockPost, simulateTransaction } = await setupMocks();

    const failedResponse = makeSimulationResponse({
      success: false,
      vm_status: "INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE",
    });

    mockPost.mockResolvedValueOnce({ data: [failedResponse] } as any);

    const result = await simulateTransaction({
      aptosConfig,
      transaction: dummyTransaction,
      options: { estimateMaxGasAmount: true },
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(result).toEqual([failedResponse]);
  });
});
