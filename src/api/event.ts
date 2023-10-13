// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { getEventsByCreationNumber } from "../internal/event";
import { AnyNumber, GetEventsResponse } from "../types";
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
   * Get events by creation number and the address
   *
   * @param args.address - The account address
   * @param args.creationNumber - The event creation number
   * @returns Promise<GetEventsByCreationNumberResponse>
   */
  async getEventsByCreationNumber(args: { address: string; creationNumber: AnyNumber }): Promise<GetEventsResponse> {
    return getEventsByCreationNumber({ aptosConfig: this.config, ...args });
  }
}
