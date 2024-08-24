// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AnyNumber, GetObjectDataQueryResponse, OrderByArg, PaginationArgs } from "../types";
import { AccountAddressInput } from "../core";
import { AptosConfig } from "./aptosConfig";
import { ProcessorType } from "../utils";
import { waitForIndexerOnVersion } from "./utils";
import { getObjectDataByObjectAddress } from "../internal/object";

/**
 * A class to query all `Object` related queries on Aptos.
 */
export class AptosObject {
  constructor(readonly config: AptosConfig) {}

/**
 * Fetch the object data based on the specified object address.
 * 
 * @param args.objectAddress - The object address to retrieve data for.
 * @param args.minimumLedgerVersion - The minimum ledger version to wait for before fetching the data.
 * @param args.options - Configuration options for pagination and ordering of the results.
 * 
 * @returns The object data associated with the given address.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching object data for a specific object address
 *   const objectData = await aptos.getObjectDataByObjectAddress({
 *     objectAddress: "0x123", // replace with a real object address
 *   });
 * 
 *   console.log(objectData);
 * }
 * runExample().catch(console.error);
 * ```
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
      aptosConfig: this.config,
      ...args,
    });
  }
}