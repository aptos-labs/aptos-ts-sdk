// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { getAccountEventsByCreationNumber, getAccountEventsByEventType, getEvents } from "../internal/event";
import { AnyNumber, GetEventsResponse, MoveResourceType, OrderBy, PaginationArgs } from "../types";
import { EventsBoolExp } from "../types/generated/types";
import { AptosConfig } from "./aptos_config";

/**
 * A class to query all `Event` Aptos related queries
 */
export class Event {
  readonly config: AptosConfig;

  constructor(config: AptosConfig) {
    this.config = config;
  }

  /**
   * Get events by creation number and an account address
   *
   * @param args.address - The account address
   * @param args.creationNumber - The event creation number
   *
   * @returns Promise<GetEventsResponse>
   */
  async getAccountEventsByCreationNumber(args: {
    address: string;
    creationNumber: AnyNumber;
  }): Promise<GetEventsResponse> {
    return getAccountEventsByCreationNumber({ aptosConfig: this.config, ...args });
  }

  /**
   * Get events by event type and an account address
   *
   * @param args.address - The account address
   * @param args.eventType - The event type
   *
   * @returns Promise<GetEventsResponse>
   */
  async getAccountEventsByEventType(args: {
    address: string;
    eventType: MoveResourceType;
    options?: {
      pagination?: PaginationArgs;
      orderBy?: OrderBy<GetEventsResponse[0]>;
    };
  }): Promise<GetEventsResponse> {
    return getAccountEventsByEventType({ aptosConfig: this.config, ...args });
  }

  /**
   * Get all events
   *
   * An optional `where` can be passed in to filter out the response.
   *
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
    options?: {
      where?: EventsBoolExp;
      pagination?: PaginationArgs;
      orderBy?: OrderBy<GetEventsResponse[0]>;
    };
  }): Promise<GetEventsResponse> {
    return getEvents({ aptosConfig: this.config, ...args });
  }
}
