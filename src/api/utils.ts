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
export async function waitForIndexerOnVersion(args: {
  config: AptosConfig;
  minimumLedgerVersion?: AnyNumber;
  processorTypes: Array<ProcessorType>;
}) {
  if (args.minimumLedgerVersion !== undefined) {
    // eslint-disable-next-line no-restricted-syntax

    // Collect all of the promises to wait at the same time
    // TODO(greg): This needs to be refactored to be handled at the query time.  It involves rewriting
    // a bunch of the logic for wait for indexer
    const promises: Array<Promise<void>> = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const processorType of args.processorTypes) {
      promises.push(
        waitForIndexer({
          aptosConfig: args.config,
          minimumLedgerVersion: args.minimumLedgerVersion,
          processorType,
        }),
      );
    }

    await Promise.all(promises);
  }
}
