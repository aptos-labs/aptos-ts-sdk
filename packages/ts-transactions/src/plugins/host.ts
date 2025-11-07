import type { AptosConfig } from "@aptos-labs/ts-client";
import type { AccountAddressInput } from "@aptos-labs/ts-core";
import type {
  AccountData,
  GasEstimation,
  HexInput,
  LedgerInfo,
  LedgerVersionArg,
  MoveModuleBytecode,
  PendingTransactionResponse,
  UserTransactionResponse,
  WaitForTransactionOptions,
  CommittedTransactionResponse,
} from "@aptos-labs/ts-types";

export interface TransactionPluginHost {
  getAccountInfo(args: { aptosConfig: AptosConfig; accountAddress: AccountAddressInput }): Promise<AccountData>;
  getLedgerInfo(args: { aptosConfig: AptosConfig }): Promise<LedgerInfo>;
  getGasPriceEstimation(args: { aptosConfig: AptosConfig }): Promise<GasEstimation>;
  getModule(args: {
    aptosConfig: AptosConfig;
    accountAddress: AccountAddressInput;
    moduleName: string;
    options?: LedgerVersionArg;
  }): Promise<MoveModuleBytecode>;
  submitTransaction(args: {
    aptosConfig: AptosConfig;
    signedTransaction: Uint8Array;
  }): Promise<PendingTransactionResponse>;
  simulateTransaction(args: {
    aptosConfig: AptosConfig;
    signedTransaction: Uint8Array;
    options?: {
      estimateGasUnitPrice?: boolean;
      estimateMaxGasAmount?: boolean;
      estimatePrioritizedGasUnitPrice?: boolean;
    };
  }): Promise<UserTransactionResponse[]>;
  waitForTransaction(args: {
    aptosConfig: AptosConfig;
    transactionHash: HexInput;
    options?: WaitForTransactionOptions;
  }): Promise<CommittedTransactionResponse>;
}

let currentHost: TransactionPluginHost | undefined;

export function setTransactionPluginHost(host: TransactionPluginHost): void {
  currentHost = host;
}

export function getTransactionPluginHost(): TransactionPluginHost {
  if (!currentHost) {
    throw new Error("Transaction plugin host has not been configured.");
  }
  return currentHost;
}
