// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/event}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * event namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { AccountAddress, AccountAddressInput } from "../core";
import { AnyNumber, GetEventsResponse, PaginationArgs, MoveStructId, OrderByArg, WhereArg } from "../types";
import { GetEventsQuery } from "../types/generated/operations";
import { GetEvents } from "../types/generated/queries";
import { EventsBoolExp, InputMaybe } from "../types/generated/types";
import { queryIndexer } from "./general";

const MAX_EVENT_TYPE_LENGTH = 300;
const checkEventTypeLength = (eventType?: InputMaybe<string>) => {
  if (eventType && eventType.length > MAX_EVENT_TYPE_LENGTH) {
    throw new Error(`Event type length exceeds the maximum length of ${MAX_EVENT_TYPE_LENGTH}`);
  }
};

export async

/**
 * Retrieves events of a specific type from the Aptos blockchain.
 * Use this function to filter and obtain events based on a specified Move struct ID.
 * 
 * @param args - The arguments for retrieving module events.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.eventType - The Move struct ID representing the type of events to retrieve.
 * @param args.options - Optional pagination and ordering parameters for the event retrieval.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve events of a specific type
 *   const events = await aptos.event.getModuleEventsByEventType({
 *     aptosConfig: config,
 *     eventType: "0x1::coin::CoinMint", // replace with a real Move struct ID
 *     options: {
 *       limit: 10, // specify the number of events to retrieve
 *       orderBy: { creation_number: "desc" } // specify the order of events
 *     }
 *   });
 * 
 *   console.log(events);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getModuleEventsByEventType(args: {
  aptosConfig: AptosConfig;
  eventType: MoveStructId;
  options?: PaginationArgs & OrderByArg<GetEventsResponse[0]>;
}): Promise<GetEventsResponse> {
  const { aptosConfig, eventType, options } = args;

  const whereCondition: EventsBoolExp = {
    account_address: { _eq: "0x0000000000000000000000000000000000000000000000000000000000000000" },
    creation_number: { _eq: "0" },
    sequence_number: { _eq: "0" },
    indexed_type: { _eq: eventType },
  };

  return getEvents({ aptosConfig, options: { ...options, where: whereCondition } });
}

export async

/**
 * Retrieves events associated with an account based on its creation number.
 * 
 * @param args - The parameters for retrieving account events.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account to query events for.
 * @param args.creationNumber - The creation number of the account to filter events.
 * @param args.options - Optional pagination and ordering parameters for the event retrieval.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve events for a specific account by its creation number
 *   const events = await aptos.event.getAccountEventsByCreationNumber({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *     creationNumber: 1, // specify the creation number of the account
 *   });
 * 
 *   console.log(events);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountEventsByCreationNumber(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  creationNumber: AnyNumber;
  options?: PaginationArgs & OrderByArg<GetEventsResponse[0]>;
}): Promise<GetEventsResponse> {
  const { accountAddress, aptosConfig, creationNumber, options } = args;
  const address = AccountAddress.from(accountAddress);

  const whereCondition: EventsBoolExp = {
    account_address: { _eq: address.toStringLong() },
    creation_number: { _eq: creationNumber },
  };

  return getEvents({ aptosConfig, options: { ...options, where: whereCondition } });
}

export async

/**
 * Retrieves events associated with a specific account and event type.
 * This function allows you to filter events based on the account address and the type of event you are interested in.
 * 
 * @param args - The parameters for retrieving account events.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.accountAddress - The address of the account whose events you want to retrieve.
 * @param args.eventType - The type of event to filter by, specified as a MoveStructId.
 * @param args.options - Optional pagination and ordering parameters for the event retrieval.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const accountAddress = "0x1"; // replace with a real account address
 *   const eventType = "0x1::coin::CoinMint"; // replace with a real event type
 * 
 *   const events = await aptos.event.getAccountEventsByEventType({
 *     aptosConfig: config,
 *     accountAddress,
 *     eventType,
 *   });
 * 
 *   console.log(events);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getAccountEventsByEventType(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  eventType: MoveStructId;
  options?: PaginationArgs & OrderByArg<GetEventsResponse[0]>;
}): Promise<GetEventsResponse> {
  const { accountAddress, aptosConfig, eventType, options } = args;
  const address = AccountAddress.from(accountAddress).toStringLong();

  const whereCondition: EventsBoolExp = {
    account_address: { _eq: address },
    indexed_type: { _eq: eventType },
  };

  return getEvents({ aptosConfig, options: { ...options, where: whereCondition } });
}

export async

/**
 * Retrieves events based on specified query parameters.
 * 
 * @param args - The arguments for the event retrieval.
 * @param args.aptosConfig - The configuration object for Aptos, specifying the network and other settings.
 * @param args.options - Optional parameters for pagination and filtering the events.
 * @param args.options.offset - The number of events to skip before starting to collect the result set.
 * @param args.options.limit - The maximum number of events to return.
 * @param args.options.orderBy - Specifies the order in which to return the events.
 * @param args.options.where - Conditions to filter the events based on specific criteria.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve events with a limit of 10 and no offset
 *   const events = await aptos.getEvents({
 *     aptosConfig: config,
 *     options: {
 *       limit: 10, // specify the number of events to return
 *       offset: 0, // specify how many events to skip
 *     },
 *   });
 * 
 *   console.log(events); // Log the retrieved events
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getEvents(args: {
  aptosConfig: AptosConfig;
  options?: PaginationArgs & OrderByArg<GetEventsResponse[0]> & WhereArg<EventsBoolExp>;
}): Promise<GetEventsResponse> {
  const { aptosConfig, options } = args;
  // eslint-disable-next-line no-underscore-dangle
  checkEventTypeLength(options?.where?.indexed_type?._eq);

  const graphqlQuery = {
    query: GetEvents,
    variables: {
      where_condition: options?.where,
      offset: options?.offset,
      limit: options?.limit,
      order_by: options?.orderBy,
    },
  };

  const data = await queryIndexer<GetEventsQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getEvents",
  });

  return data.events;
}