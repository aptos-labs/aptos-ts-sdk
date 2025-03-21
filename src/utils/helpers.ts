// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { decode } from "js-base64";
import { MoveFunctionId, MoveStructId } from "../types";
import { AccountAddress } from "../core/accountAddress";
import { createObjectAddress } from "../core/account/utils/address";

/**
 * Sleep for the specified amount of time in milliseconds.
 * This function can be used to introduce delays in asynchronous operations.
 *
 * @param timeMs - The time in milliseconds to sleep.
 * @group Implementation
 * @category Utils
 */
export async function sleep(timeMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
}

/**
 * Get the error message from an unknown error.
 *
 * @param error The error to get the message from
 * @returns The error message
 * @group Implementation
 * @category Utils
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @group Implementation
 * @category Utils
 */
export const nowInSeconds = () => Math.floor(Date.now() / 1000);

/**
 * Floors the given timestamp to the nearest whole hour.
 * This function is useful for normalizing timestamps to hourly intervals.
 *
 * @param timestampInSeconds - The timestamp in seconds to be floored.
 * @group Implementation
 * @category Utils
 */
export function floorToWholeHour(timestampInSeconds: number): number {
  const date = new Date(timestampInSeconds * 1000);
  // Reset minutes and seconds to zero
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Decodes a base64 URL-encoded string into its original form.
 * This function is useful for converting base64 URL-encoded data back to a readable format.
 *
 * @param base64Url - The base64 URL-encoded string to decode.
 * @returns The decoded string.
 * @group Implementation
 * @category Utils
 */
export function base64UrlDecode(base64Url: string): string {
  // Replace base64url-specific characters
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  // Pad the string with '=' characters if needed
  const paddedBase64 = base64 + "==".substring(0, (3 - (base64.length % 3)) % 3);
  const decodedString = decode(paddedBase64);
  return decodedString;
}

export function base64UrlToBytes(base64Url: string): Uint8Array {
  // Convert Base64Url to Base64
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  // Use Buffer to convert base64 to Uint8Array
  return new Uint8Array(Buffer.from(base64, "base64"));
}

/**
 * Amount is represented in the smallest unit format on chain, this function converts
 * a human-readable amount format to the smallest unit format
 * @example
 * human-readable amount format: 500
 * on chain amount format when decimal is 8: 50000000000
 *
 * @param value The value in human-readable format
 * @param decimal The token decimal
 * @returns The value in the smallest units
 * @group Implementation
 * @category Utils
 */
export const convertAmountFromHumanReadableToOnChain = (value: number, decimal: number) => value * 10 ** decimal;

/**
 * Amount is represented in the smallest unit format on chain, this function converts
 * the smallest unit format to a human-readable amount format
 * @example
 * human-readable amount format: 500
 * on chain amount format when decimal is 8: 50000000000
 *
 * @param value The value in human-readable format
 * @param decimal The token decimal
 * @returns The value in the smallest units
 * @group Implementation
 * @category Utils
 */
export const convertAmountFromOnChainToHumanReadable = (value: number, decimal: number) => value / 10 ** decimal;

/**
 * Convert a hex string to an ascii string with the `0x` prefix.
 *
 * `0x6170746f735f636f696e` --> `aptos_coin`
 *
 * @param hex The hex string to convert (e.g. `0x6170746f735f636f696e`)
 * @returns The ascii string
 * @group Implementation
 * @category Utils
 */
const hexToAscii = (hex: string) => {
  let str = "";
  for (let n = 2; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substring(n, n + 2), 16));
  }
  return str;
};

/**
 * Convert an encoded struct to a MoveStructId.
 *
 * @example
 * const structObj = {
 *   account_address: "0x1",
 *   module_name: "0x6170746f735f636f696e",
 *   struct_name: "0x4170746f73436f696e",
 * };
 * // structId is "0x1::aptos_coin::AptosCoin"
 * const structId = parseEncodedStruct(structObj);
 *
 * @param structObj The struct with account_address, module_name, and struct_name properties
 * @returns The MoveStructId
 * @group Implementation
 * @category Utils
 */
export const parseEncodedStruct = (structObj: {
  account_address: string;
  module_name: string;
  struct_name: string;
}): MoveStructId => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { account_address, module_name, struct_name } = structObj;
  const moduleName = hexToAscii(module_name);
  const structName = hexToAscii(struct_name);
  return `${account_address}::${moduleName}::${structName}`;
};

/**
 * Determines whether the given object is an encoded struct type with the following properties:
 * - account_address: string
 * - module_name: string
 * - struct_name: string
 *
 * @param structObj The object to check
 * @returns Whether the object is an encoded struct type
 * @group Implementation
 * @category Utils
 */
export const isEncodedStruct = (
  structObj: any,
): structObj is {
  account_address: string;
  module_name: string;
  struct_name: string;
} =>
  typeof structObj === "object" &&
  !Array.isArray(structObj) &&
  structObj !== null &&
  "account_address" in structObj &&
  "module_name" in structObj &&
  "struct_name" in structObj &&
  typeof structObj.account_address === "string" &&
  typeof structObj.module_name === "string" &&
  typeof structObj.struct_name === "string";

/**
 * Splits a function identifier into its constituent parts: module address, module name, and function name.
 * This function helps in validating and extracting details from a function identifier string.
 *
 * @param functionArg - The function identifier string in the format "moduleAddress::moduleName::functionName".
 * @returns An object containing the module address, module name, and function name.
 * @throws Error if the function identifier does not contain exactly three parts.
 * @group Implementation
 * @category Transactions
 */
export function getFunctionParts(functionArg: MoveFunctionId) {
  const funcNameParts = functionArg.split("::");
  if (funcNameParts.length !== 3) {
    throw new Error(`Invalid function ${functionArg}`);
  }
  const moduleAddress = funcNameParts[0];
  const moduleName = funcNameParts[1];
  const functionName = funcNameParts[2];
  return { moduleAddress, moduleName, functionName };
}

/**
 * Validates the provided function information.
 *
 * @param functionInfo - The function information to validate.
 * @returns Whether the function information is valid.
 * @group Implementation
 * @category Utils
 */
export function isValidFunctionInfo(functionInfo: string): boolean {
  const parts = functionInfo.split("::");
  return parts.length === 3 && AccountAddress.isValid({ input: parts[0] }).valid;
}

/**
 * Truncates the provided wallet address at the middle with an ellipsis.
 *
 * @param address - The wallet address to truncate.
 * @param start - The number of characters to show at the beginning of the address.
 * @param end - The number of characters to show at the end of the address.
 * @returns The truncated address.
 * @group Implementation
 * @category Utils
 */
export function truncateAddress(address: string, start: number = 6, end: number = 5) {
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Constants for metadata address calculation
 */
const APTOS_COIN_TYPE_STR = "0x1::aptos_coin::AptosCoin";
const APT_METADATA_ADDRESS_HEX = AccountAddress.A.toStringLong();

/**
 * Helper function to standardize Move type string by converting all addresses to short form,
 * including addresses within nested type parameters
 */
function standardizeMoveTypeString(input: string): string {
  // Regular expression to match addresses in the type string, including those within type parameters
  // This regex matches "0x" followed by hex digits, handling both standalone addresses and those within <>
  const addressRegex = /0x[0-9a-fA-F]+/g;

  return input.replace(addressRegex, (match) => {
    // Use AccountAddress to handle the address
    return AccountAddress.from(match, { maxMissingChars: 63 }).toStringShort();
  });
}

/**
 * Calculates the paired FA metadata address for a given coin type.
 * This function is tolerant of various address formats in the coin type string,
 * including complex nested types.
 *
 * @example
 * // All these formats are valid and will produce the same result:
 * pairedFaMetadataAddress("0x1::aptos_coin::AptosCoin")  // simple form
 * pairedFaMetadataAddress("0x0000000000000000000000000000000000000000000000000000000000000001::aptos_coin::AptosCoin")  // long form
 * pairedFaMetadataAddress("0x00001::aptos_coin::AptosCoin")  // with leading zeros
 * pairedFaMetadataAddress("0x1::coin::Coin<0x1412::a::struct<0x0001::aptos_coin::AptosCoin>>")  // nested type parameters
 *
 * @param coinType - The coin type string in any of these formats:
 *   - Short form address: "0x1::aptos_coin::AptosCoin"
 *   - Long form address: "0x0000000000000000000000000000000000000000000000000000000000000001::aptos_coin::AptosCoin"
 *   - With leading zeros: "0x00001::aptos_coin::AptosCoin"
 *   - With nested types: "0x1::coin::Coin<0x1412::a::struct<0x0001::aptos_coin::AptosCoin>>"
 * @returns The calculated metadata address as an AccountAddress instance
 */
export function pairedFaMetadataAddress(coinType: `0x${string}::${string}::${string}`): AccountAddress {
  // Standardize the coin type string to handle any address format
  const standardizedMoveTypeName = standardizeMoveTypeString(coinType);

  return standardizedMoveTypeName === APTOS_COIN_TYPE_STR
    ? AccountAddress.A
    : createObjectAddress(AccountAddress.A, standardizedMoveTypeName);
}
