// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { waitForIndexer } from "../internal/transaction";
import { AnyNumber } from "../types";
import { ProcessorType } from "../utils/const";
import { AptosConfig } from "./aptosConfig";

/**
 * A Api based abstract class for all Api classes. This class contains common method
 * `waitForIndexer` to wait for the indexer to sync up to the given ledger version
 */
export abstract class Api {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Wait for the indexer to sync up to the given ledger version
   * @param args.minimumLedgerVersion The minimum ledger version to wait for
   * @param args.processorType The processor type to wait for
   */
  protected async waitForIndexer(args: {
    minimumLedgerVersion?: AnyNumber;
    processorType?: ProcessorType;
  }): Promise<void> {
    const { processorType, minimumLedgerVersion } = args;
    if (minimumLedgerVersion === undefined) {
      return;
    }

    await waitForIndexer({
      aptosConfig: this.config,
      minimumLedgerVersion,
      processorType,
    });
  }
}
