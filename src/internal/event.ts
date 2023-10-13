// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/event}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * event namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptos_config";
import { AccountAddress } from "../core";
import { AnyNumber, GetEventsResponse, HexInput } from "../types";
import { GetEventsQuery } from "../types/generated/operations";
import { GetEvents } from "../types/generated/queries";
import { queryIndexer } from "./general";

/**
 * Get events by creation number and the address
 *
 * @param args.aptosConfig - The aptos config
 * @param args.address - The account address
 * @param args.creationNumber - The event creation number
 * @returns Promise<GetEventsByCreationNumberResponse>
 */
export async function getEventsByCreationNumber(args: {
  aptosConfig: AptosConfig;
  address: HexInput;
  creationNumber: AnyNumber;
}): Promise<GetEventsResponse> {
  const { aptosConfig, creationNumber } = args;
  const address = AccountAddress.fromHexInput({ input: args.address }).toString();

  const whereCondition: any = {
    account_address: { _eq: address },
    creation_number: { _eq: creationNumber },
  };

  const graphqlQuery = {
    query: GetEvents,
    variables: { where_condition: whereCondition },
  };

  const data = await queryIndexer<GetEventsQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getEventsByCreationNumber",
  });

  return data.events;
}
