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
import { EventsBoolExp } from "../types/generated/types";
import { queryIndexer } from "./general";

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

  const customOptions = {
    where: whereCondition,
    pagination: options,
    orderBy: options?.orderBy,
  };

  return getEvents({ aptosConfig, options: customOptions });
}

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

  const customOptions = {
    where: whereCondition,
    pagination: options,
    orderBy: options?.orderBy,
  };

  return getEvents({ aptosConfig, options: customOptions });
}

export async function getEvents(args: {
  aptosConfig: AptosConfig;
  options?: PaginationArgs & OrderByArg<GetEventsResponse[0]> & WhereArg<EventsBoolExp>;
}): Promise<GetEventsResponse> {
  const { aptosConfig, options } = args;

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
