// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import { AnyNumber, GetObjectDataQueryResponse, OrderByArg, PaginationArgs } from "../types";
import { AccountAddressInput } from "../core";
import { CedraConfig } from "./cedraConfig";
import { ProcessorType } from "../utils";
import { waitForIndexerOnVersion } from "./utils";
import { getObjectDataByObjectAddress } from "../internal/object";

/**
 * A class to query all `Object` related queries on Cedra.
 * @group Object
 */
export class CedraObject {
  /**
   * Creates an instance of the Cedra client with the provided configuration.
   * This allows interaction with the Cedra blockchain using the specified settings.
   *
   * @param config - The configuration settings for the Cedra client.
   * @param config.network - The network to connect to (e.g., mainnet, testnet).
   * @param config.nodeUrl - The URL of the Cedra node to connect to.
   * @param config.faucetUrl - The URL of the faucet for funding accounts (optional).
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * async function runExample() {
   *     // Create a configuration for the Cedra client
   *     const config = new CedraConfig({
   *         network: Network.TESTNET, // Specify the desired network
   *         nodeUrl: "https://testnet.cedra.dev", // Replace with your node URL
   *     });
   *
   *     // Create an instance of the Cedra client
   *     const cedra = new Cedra(config);
   *
   *     console.log("Cedra client created successfully", cedra);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Object
   */
  constructor(readonly config: CedraConfig) {}

  /**
   * Fetches the object data based on the specified object address.
   *
   * @param args.objectAddress - The object address to retrieve data for.
   * @param args.minimumLedgerVersion - Optional minimum ledger version to wait for.
   * @param args.options - Optional configuration options for pagination and ordering.
   *
   * @returns The object data corresponding to the provided address.
   *
   * @example
   * ```typescript
   * import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";
   *
   * const config = new CedraConfig({ network: Network.TESTNET });
   * const cedra = new Cedra(config);
   *
   * async function runExample() {
   *   // Fetching object data by object address
   *   const objectData = await cedra.getObjectDataByObjectAddress({
   *     objectAddress: "0x1", // replace with a real object address
   *   });
   *
   *   console.log(objectData);
   * }
   * runExample().catch(console.error);
   * ```
   * @group Object
   */
  async getObjectDataByObjectAddress(args: {
    objectAddress: AccountAddressInput;
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & OrderByArg<GetObjectDataQueryResponse[0]>;
  }): Promise<GetObjectDataQueryResponse[0]> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.OBJECT_PROCESSOR,
    });
    return getObjectDataByObjectAddress({
      cedraConfig: this.config,
      ...args,
    });
  }
}
