// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/event}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * event namespace and without having a dependency cycle error.
 * @group Implementation
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

/**
 * Retrieves events associated with a specific module event type.
 * This function allows you to filter events based on the event type and pagination options.
 *
 * @param args - The arguments for retrieving module events.
 * @param args.aptosConfig - The configuration object for Aptos.
 * @param args.eventType - The MoveStructId representing the type of event to retrieve.
 * @param [args.options] - Optional pagination and ordering parameters for the event retrieval.
 * @group Implementation
 */
export async function getModuleEventsByEventType(args: {
  aptosConfig: AptosConfig;
  eventType: MoveStructId;
  options?: PaginationArgs & OrderByArg<GetEventsResponse[0]>;
}): Promise<GetEventsResponse> {
  const { aptosConfig, eventType, options } = args;

  const whereCondition: EventsBoolExp = {
    _or: [
      // EventHandle events
      { account_address: { _eq: eventType.split("::")[0] } },
      // Module events
      {
        account_address: { _eq: "0x0000000000000000000000000000000000000000000000000000000000000000" },
        sequence_number: { _eq: 0 },
        creation_number: { _eq: 0 },
      },
    ],
    indexed_type: { _eq: eventType },
  };

  return getEvents({ aptosConfig, options: { ...options, where: whereCondition } });
}

/**
 * Retrieve events associated with a specific account and creation number.
 *
 * @param args - The parameters for retrieving account events.
 * @param args.aptosConfig - The configuration settings for the Aptos client.
 * @param args.accountAddress - The address of the account for which events are being retrieved.
 * @param args.creationNumber - The creation number to filter events.
 * @param args.options - Optional pagination and ordering parameters for the event retrieval.
 * @group Implementation
 */
export async function getAccountEventsByCreationNumber(args: {
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

/**
 * Retrieves events associated with a specific account and event type.
 *
 * @param args - The parameters for retrieving account events.
 * @param args.aptosConfig - The configuration for connecting to the Aptos blockchain.
 * @param args.accountAddress - The address of the account for which to retrieve events.
 * @param args.eventType - The type of event to filter by.
 * @param args.options - Optional pagination and ordering parameters for the event retrieval.
 * @group Implementation
 */
export async function getAccountEventsByEventType(args: {
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

/**
 * Retrieves a list of events based on specified filtering and pagination options.
 *
 * @param args - The arguments for retrieving events.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param [args.options] - Optional parameters for pagination and filtering.
 * @param [args.options.offset] - The number of records to skip before starting to collect the result set.
 * @param [args.options.limit] - The maximum number of records to return.
 * @param [args.options.orderBy] - Defines the order in which to return the events.
 * @param [args.options.where] - Conditions to filter the events.
 * @param [args.options.where.indexed_type] - Filters events by the indexed type.
 * @group Implementation
 */
export async function getEvents(args: {
  aptosConfig: AptosConfig;
  options?: PaginationArgs & OrderByArg<GetEventsResponse[0]> & WhereArg<EventsBoolExp>;
}): Promise<GetEventsResponse> {
  const { aptosConfig, options } = args;

  /**
   * Checks the length of event types based on the provided filtering options.
   *
   * @param options - The options for querying event types.
   * @param options.where - The conditions to filter the event types.
   * @param options.where.indexed_type - The indexed type to filter by.
   * @param options.where.indexed_type._eq - The specific value to match for the indexed type.
   * @param options.offset - The number of items to skip before starting to collect the result set.
   * @param options.limit - The maximum number of items to return.
   * @param options.orderBy - The criteria to sort the results.
   * @group Implementation
   */
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
