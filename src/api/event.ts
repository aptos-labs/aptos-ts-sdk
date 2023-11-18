// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { getAccountEventsByCreationNumber, getAccountEventsByEventType, getEvents } from "../internal/event";
import { AnyNumber, GetEventsResponse, MoveStructId, OrderBy, PaginationArgs } from "../types";
import { EventsBoolExp } from "../types/generated/types";
import { AccountAddressInput } from "../core";
import { Api } from "./api";
import { ProcessorType } from "../utils/const";

/**
 * A class to query all `Event` Aptos related queries
 */
export class Event extends Api {
  /**
   * Get events by creation number and an account address
   *
   * @param args.accountAddress - The account address
   * @param args.creationNumber - The event creation number
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   *
   * @returns Promise<GetEventsResponse>
   */
  async getAccountEventsByCreationNumber(args: {
    accountAddress: AccountAddressInput;
    creationNumber: AnyNumber;
    minimumLedgerVersion?: AnyNumber;
  }): Promise<GetEventsResponse> {
    await this.waitForIndexer({
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.EVENTS_PROCESSOR,
    });
    return getAccountEventsByCreationNumber({ aptosConfig: this.config, ...args });
  }

  /**
   * Get events by event type and an account address
   *
   * @param args.accountAddress - The account address
   * @param args.eventType - The event type
   * @param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   *
   * @returns Promise<GetEventsResponse>
   */
  async getAccountEventsByEventType(args: {
    accountAddress: AccountAddressInput;
    eventType: MoveStructId;
    minimumLedgerVersion?: AnyNumber;
    options?: {
      pagination?: PaginationArgs;
      orderBy?: OrderBy<GetEventsResponse[0]>;
    };
  }): Promise<GetEventsResponse> {
    await this.waitForIndexer({
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.EVENTS_PROCESSOR,
    });
    return getAccountEventsByEventType({ aptosConfig: this.config, ...args });
  }

  /**
   * Get all events
   *
   * An optional `where` can be passed in to filter out the response.
   *@param args.minimumLedgerVersion Optional ledger version to sync up to, before querying
   * @example
   * ```
   * { where:
   *  {
   *   transaction_version: { _eq: 123456 },
   *  }
   * }
   * ```
   *
   * @returns GetEventsQuery response type
   */
  async getEvents(args?: {
    minimumLedgerVersion?: AnyNumber;
    options?: {
      where?: EventsBoolExp;
      pagination?: PaginationArgs;
      orderBy?: OrderBy<GetEventsResponse[0]>;
    };
  }): Promise<GetEventsResponse> {
    await this.waitForIndexer({
      minimumLedgerVersion: args?.minimumLedgerVersion,
      processorType: ProcessorType.EVENTS_PROCESSOR,
    });
    return getEvents({ aptosConfig: this.config, ...args });
  }
}
