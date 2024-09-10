// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  getAccountEventsByCreationNumber,
  getAccountEventsByEventType,
  getModuleEventsByEventType,
  getEvents,
} from "../internal/event";
import { AnyNumber, GetEventsResponse, MoveStructId, OrderByArg, PaginationArgs, WhereArg } from "../types";
import { EventsBoolExp } from "../types/generated/types";
import { AccountAddressInput } from "../core";
import { ProcessorType } from "../utils/const";
import { AptosConfig } from "./aptosConfig";
import { waitForIndexerOnVersion } from "./utils";

/**
 * A class to query all `Event` Aptos related queries
 */
export class Event {
  constructor(readonly config: AptosConfig) {}

/**
 * Get module events by event type.
 * This function retrieves events associated with a specific module event type, allowing users to monitor and react to specific occurrences in the blockchain.
 *
 * @param args.eventType - The event type to filter events.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @param args.options - Optional pagination and ordering options for the event results.
 *
 * @returns Promise<GetEventsResponse>
 *
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 *
 * async function runExample() {
 *   // Fetch module events by event type
 *   const events = await aptos.getModuleEventsByEventType({
 *     eventType: "0x1::transaction_fee::FeeStatement", // specify the event type
 *   });
 *
 *   console.log(events); // Log the retrieved events
 * }
 * runExample().catch(console.error);
 */


  async getModuleEventsByEventType(args: {
    eventType: MoveStructId;
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & OrderByArg<GetEventsResponse[0]>;
  }): Promise<GetEventsResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.EVENTS_PROCESSOR,
    });
    return getModuleEventsByEventType({ aptosConfig: this.config, ...args });
  }

/**
 * Retrieve events associated with a specific account address and its creation number.
 *
 * @param args - The parameters for retrieving account events.
 * @param args.accountAddress - The account address to query events for.
 * @param args.creationNumber - The event creation number to filter events.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * 
 * @returns Promise<GetEventsResponse>
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve events for the specified account address and creation number
 *   const events = await aptos.getAccountEventsByCreationNumber({
 *     accountAddress: "0x123", // replace with a real account address
 *     creationNumber: 0,
 *   });
 * 
 *   console.log(events);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async getAccountEventsByCreationNumber(args: {
    accountAddress: AccountAddressInput;
    creationNumber: AnyNumber;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<GetEventsResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.EVENTS_PROCESSOR,
    });
    return getAccountEventsByCreationNumber({ aptosConfig: this.config, ...args });
  }

/**
 * Retrieve events associated with a specific account and event type.
 *
 * @param args.accountAddress - The account address to query events for.
 * @param args.eventType - The type of event to filter by.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @param args.options - Optional pagination and ordering parameters for the results.
 *
 * @returns Promise<GetEventsResponse>
 *
 * @example
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 *
 * async function runExample() {
 *   // Get events for a specific account and event type
 *   const events = await aptos.getAccountEventsByEventType({
 *     accountAddress: "0x1", // replace with a real account address
 *     eventType: "0x1::transaction_fee::FeeStatement", // replace with a real event type
 *   });
 *
 *   console.log(events);
 * }
 * runExample().catch(console.error);
 */


  async getAccountEventsByEventType(args: {
    accountAddress: AccountAddressInput;
    eventType: MoveStructId;
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & OrderByArg<GetEventsResponse[0]>;
  }): Promise<GetEventsResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args.minimumLedgerVersion,
      processorType: ProcessorType.EVENTS_PROCESSOR,
    });
    return getAccountEventsByEventType({ aptosConfig: this.config, ...args });
  }

/**
 * Get all events from the Aptos blockchain. 
 * An optional `where` can be passed in to filter the response.
 * 
 * @param args - Optional parameters for the request.
 * @param args.minimumLedgerVersion - Optional ledger version to sync up to before querying.
 * @param args.options - Optional pagination and filtering options.
 * @param args.options.where - Conditions to filter the events.
 * @param args.options.offset - Number of events to skip.
 * @param args.options.limit - Maximum number of events to return.
 * @param args.options.orderBy - Field to order the results by.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetch all events
 *   const events = await aptos.getEvents();
 * 
 *   // Fetch events with filtering by account address
 *   const filteredEvents = await aptos.getEvents({
 *     options: {
 *       where: { account_address: { _eq: "0x123" } } // replace with a real account address
 *     }
 *   });
 * 
 *   console.log(events);
 *   console.log(filteredEvents);
 * }
 * runExample().catch(console.error);
 * ```
 * 
 * @returns GetEventsQuery response type
 */


  async getEvents(args?: {
    minimumLedgerVersion?: AnyNumber;
    options?: PaginationArgs & OrderByArg<GetEventsResponse[0]> & WhereArg<EventsBoolExp>;
  }): Promise<GetEventsResponse> {
    await waitForIndexerOnVersion({
      config: this.config,
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.EVENTS_PROCESSOR,
    });
    return getEvents({ aptosConfig: this.config, ...args });
  }
}