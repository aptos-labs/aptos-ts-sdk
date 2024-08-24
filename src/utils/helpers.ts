// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { decode } from "js-base64";

/**
 * Sleep the current thread for the given amount of time
 * @param timeMs time in milliseconds to sleep
 */
export async

/**
 * Pauses execution for a specified duration in milliseconds.
 * This function is useful for creating delays in asynchronous operations, such as waiting for a process to complete or for a specific condition to be met.
 * 
 * @param timeMs - The duration to sleep in milliseconds.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   console.log("Starting the sleep function...");
 * 
 *   // This will pause execution for 200 milliseconds
 *   await aptos.sleep(200);
 * 
 *   console.log("Finished sleeping!");
 * }
 * runExample().catch(console.error);
 * ```
 */
 function sleep(timeMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
}

export const nowInSeconds = () => Math.floor(Date.now() / 1000);

export function floorToWholeHour(timestampInSeconds: number): number {
  const date = new Date(timestampInSeconds * 1000);
  // Reset minutes and seconds to zero
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return Math.floor(date.getTime() / 1000);
}

export function base64UrlDecode(base64Url: string): string {
  // Replace base64url-specific characters
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  // Pad the string with '=' characters if needed
  const paddedBase64 = base64 + "==".substring(0, (3 - (base64.length % 3)) % 3);
  const decodedString = decode(paddedBase64);
  return decodedString;
}

/**
 * Amount is represented in the smallest unit format on chain, this function converts
 * a human readable amount format to the smallest unit format
 * @example
 * human readable amount format: 500
 * on chain amount format when decimal is 8: 50000000000
 *
 * @param value The value in human readable format
 * @param decimal The token decimal
 * @returns The value is smallest units
 */
export const convertAmountFromHumanReadableToOnChain = (value: number, decimal: number) => value * 10 ** decimal;

/**
 * Amount is represented in the smallest unit format on chain, this function converts
 * the smallest unit format to a human readable amount format
 * @example
 * human readable amount format: 500
 * on chain amount format when decimal is 8: 50000000000
 *
 * @param value The value in human readable format
 * @param decimal The token decimal
 * @returns The value is smallest units
 */
export const convertAmountFromOnChainToHumanReadable = (value: number, decimal: number) => value / 10 ** decimal;