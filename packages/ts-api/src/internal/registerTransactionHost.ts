import type { TransactionPluginHost } from "@aptos-labs/ts-transactions";
import { getInfo, getModule } from "./account";
import { getLedgerInfo } from "./general";
import { getGasPriceEstimation, waitForTransaction } from "./transaction";
import { postAptosFullNode } from "@aptos-labs/ts-client";
import { MimeType, PendingTransactionResponse, UserTransactionResponse } from "@aptos-labs/ts-types";

export const apiTransactionPluginHost: TransactionPluginHost = {
  getAccountInfo: getInfo,
  getLedgerInfo,
  getGasPriceEstimation,
  getModule,
  submitTransaction: async ({ aptosConfig, signedTransaction }) => {
    const { data } = await postAptosFullNode<Uint8Array, PendingTransactionResponse>({
      aptosConfig,
      body: signedTransaction,
      path: "transactions",
      originMethod: "submitTransaction",
      contentType: MimeType.BCS_SIGNED_TRANSACTION,
    });
    return data;
  },
  simulateTransaction: async ({ aptosConfig, signedTransaction, options }) => {
    const { data } = await postAptosFullNode<Uint8Array, UserTransactionResponse[]>({
      aptosConfig,
      body: signedTransaction,
      path: "transactions/simulate",
      params: {
        estimate_gas_unit_price: options?.estimateGasUnitPrice ?? false,
        estimate_max_gas_amount: options?.estimateMaxGasAmount ?? false,
        estimate_prioritized_gas_unit_price: options?.estimatePrioritizedGasUnitPrice ?? false,
      },
      originMethod: "simulateTransaction",
      contentType: MimeType.BCS_SIGNED_TRANSACTION,
    });
    return data;
  },
  waitForTransaction,
};
