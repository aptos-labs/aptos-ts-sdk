// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { LedgerVersionArg } from "../types";
import { AptosConfig } from "./aptosConfig";
import { InputViewFunctionData } from "../transactions";
import { viewBinary } from "../internal/experimental";

/**
 * A class to have experimental functionality to the SDK.  Anything used here is subject to change.
 * @group Experimental
 * @experimental
 */
export class Experimental {
  /**
   * Initializes a new instance of the Aptos client with the provided configuration.
   *
   * @param config - The configuration settings for the Aptos client.
   * @param config.network - The network to connect to (e.g., Testnet, Mainnet).
   * @param config.nodeUrl - The URL of the Aptos node to connect to.
   * @param config.faucetUrl - The URL of the faucet to use for funding accounts.
   *
   * @example
   * ```typescript
   * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a new Aptos client with Testnet configuration
   *     const config = new AptosConfig({ network: Network.TESTNET }); // Specify your own network if needed
   *     const aptos = new Aptos(config);
   *
   *     console.log("Aptos client initialized:", aptos);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Experimental
   * @experimental
   */
  constructor(readonly config: AptosConfig) {}

  async viewBinary(args: {
    payload: InputViewFunctionData;
    options?: LedgerVersionArg & { convert?: undefined };
  }): Promise<Uint8Array>;
  async viewBinary<T extends {}>(args: {
    payload: InputViewFunctionData;
    options: LedgerVersionArg & { convert: (input: Uint8Array) => T };
  }): Promise<T>;

  /**
   * Returns BCS encoded results of the view function.  It can also convert the results to a specific type, if a
   * converter is provided.
   *
   * @experimental
   * @group Experimental
   * @param args
   */
  async viewBinary<T extends {} = Uint8Array>(args: {
    payload: InputViewFunctionData;
    options?: LedgerVersionArg & { convert?: (input: Uint8Array) => T };
  }): Promise<Uint8Array | T> {
    return viewBinary<T>({ ...args, aptosConfig: this.config });
  }
}
