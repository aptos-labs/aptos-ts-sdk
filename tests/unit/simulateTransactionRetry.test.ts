import { simulateTransaction } from "../../src/internal/transactionSubmission";
import { AptosConfig } from "../../src/api/aptosConfig";
import { Network } from "../../src/utils/apiEndpoints";
import { UserTransactionResponse } from "../../src/types";
import { postAptosFullNode } from "../../src/client";

jest.mock("../../src/client", () => ({
  postAptosFullNode: jest.fn(),
}));

jest.mock("../../src/transactions/transactionBuilder/transactionBuilder", () => ({
  ...jest.requireActual("../../src/transactions/transactionBuilder/transactionBuilder"),
  generateSignedTransactionForSimulation: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
}));

const mockPostAptosFullNode = postAptosFullNode as jest.MockedFunction<typeof postAptosFullNode>;

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

describe("simulateTransaction retry on gas estimation failure", () => {
  const aptosConfig = new AptosConfig({ network: Network.LOCAL });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("retries without estimateMaxGasAmount when server returns MAX_GAS_UNITS_BELOW_MIN_TRANSACTION_GAS_UNITS", async () => {
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

    mockPostAptosFullNode
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

    expect(mockPostAptosFullNode).toHaveBeenCalledTimes(2);

    // First call should have estimate_max_gas_amount: true
    expect(mockPostAptosFullNode.mock.calls[0][0].params).toEqual(
      expect.objectContaining({ estimate_max_gas_amount: true }),
    );

    // Retry call should have estimate_max_gas_amount: false
    expect(mockPostAptosFullNode.mock.calls[1][0].params).toEqual(
      expect.objectContaining({ estimate_max_gas_amount: false }),
    );

    // Retry should preserve other estimation flags
    expect(mockPostAptosFullNode.mock.calls[1][0].params).toEqual(
      expect.objectContaining({ estimate_gas_unit_price: true }),
    );

    // Should return the retry result
    expect(result).toEqual([successResponse]);
  });

  test("does not retry when estimateMaxGasAmount is false", async () => {
    const failedResponse = makeSimulationResponse({
      success: false,
      vm_status: "MAX_GAS_UNITS_BELOW_MIN_TRANSACTION_GAS_UNITS",
      max_gas_amount: "2",
    });

    mockPostAptosFullNode.mockResolvedValueOnce({ data: [failedResponse] } as any);

    const result = await simulateTransaction({
      aptosConfig,
      transaction: dummyTransaction,
      options: {
        estimateMaxGasAmount: false,
      },
    });

    expect(mockPostAptosFullNode).toHaveBeenCalledTimes(1);
    expect(result).toEqual([failedResponse]);
  });

  test("does not retry when simulation succeeds", async () => {
    const successResponse = makeSimulationResponse({
      success: true,
      vm_status: "Executed successfully",
    });

    mockPostAptosFullNode.mockResolvedValueOnce({ data: [successResponse] } as any);

    const result = await simulateTransaction({
      aptosConfig,
      transaction: dummyTransaction,
      options: {
        estimateMaxGasAmount: true,
      },
    });

    expect(mockPostAptosFullNode).toHaveBeenCalledTimes(1);
    expect(result).toEqual([successResponse]);
  });

  test("does not retry when vm_status is a different error", async () => {
    const failedResponse = makeSimulationResponse({
      success: false,
      vm_status: "INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE",
    });

    mockPostAptosFullNode.mockResolvedValueOnce({ data: [failedResponse] } as any);

    const result = await simulateTransaction({
      aptosConfig,
      transaction: dummyTransaction,
      options: {
        estimateMaxGasAmount: true,
      },
    });

    expect(mockPostAptosFullNode).toHaveBeenCalledTimes(1);
    expect(result).toEqual([failedResponse]);
  });
});
