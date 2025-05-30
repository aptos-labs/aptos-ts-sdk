import { waitForIndexer } from "../internal/transaction";
import { ProcessorType } from "../utils";
import { CedraConfig } from "./cedraConfig";
import { AnyNumber } from "../types";

/**
 * Waits for the indexer to reach a specified ledger version, allowing for synchronization with the blockchain.
 * This function is useful for ensuring that your application is working with the most up-to-date data before proceeding.
 *
 * @param args - The parameters for waiting on the indexer.
 * @param args.config - The configuration object for Cedra.
 * @param [args.minimumLedgerVersion] - The minimum ledger version to wait for. If not specified, the function will not wait.
 * @param args.processorType - The type of processor to wait for.
 *
 * @example
 * ```typescript
 * import { Cedra, CedraConfig, Network, ProcessorType } from "@cedra-labs/ts-sdk";
 *
 * const config = new CedraConfig({ network: Network.TESTNET });
 * const cedra = new Cedra(config);
 *
 * async function runExample() {
 *   // Wait for the indexer to reach a specific ledger version
 *   await cedra.waitForIndexerOnVersion({
 *     config: config,
 *     minimumLedgerVersion: 1000n, // replace with a real ledger version
 *     processorType: ProcessorType.DEFAULT,
 *   });
 *
 *   console.log("Indexer is synced to the specified ledger version.");
 * }
 * runExample().catch(console.error);
 * ```
 * @group Implementation
 */
export async function waitForIndexerOnVersion(args: {
  config: CedraConfig;
  minimumLedgerVersion?: AnyNumber;
  processorType: ProcessorType;
}) {
  if (args.minimumLedgerVersion !== undefined) {
    await waitForIndexer({
      cedraConfig: args.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: args.processorType,
    });
  }
}
