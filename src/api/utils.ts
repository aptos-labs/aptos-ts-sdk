import { waitForIndexer } from "../internal/transaction";
import { ProcessorType } from "../utils";
import { AptosConfig } from "./aptosConfig";
import { AnyNumber } from "../types";

/**
 * Utility function to handle optional waiting on indexer for APIs
 *
 * This is purposely placed here to not expose this internal function.
 * @param args
 */
export async

/**
 * Waits for the indexer to reach a specified ledger version.
 * This function is useful for ensuring that the indexer is synchronized with the blockchain before proceeding with further operations.
 * 
 * @param args - The parameters for the function.
 * @param args.config - The configuration object for Aptos.
 * @param [args.minimumLedgerVersion] - The minimum ledger version to wait for. If not specified, the function will not wait.
 * @param args.processorType - The type of processor to check the indexer status against.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, ProcessorType } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Wait for the indexer to reach a specific ledger version
 *   await aptos.waitForIndexerOnVersion({
 *     config: config,
 *     minimumLedgerVersion: 10, // replace with a real ledger version
 *     processorType: ProcessorType.DEFAULT,
 *   });
 * 
 *   console.log("Indexer is synchronized with the specified ledger version.");
 * }
 * runExample().catch(console.error);
 * ```
 */
 function waitForIndexerOnVersion(args: {
  config: AptosConfig;
  minimumLedgerVersion?: AnyNumber;
  processorType: ProcessorType;
}) {
  if (args.minimumLedgerVersion !== undefined) {
    await waitForIndexer({
      aptosConfig: args.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: args.processorType,
    });
  }
}