// Copyright (c) Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Converters from the loosely-typed GraphQL/Hasura response model (where
 * bigint, numeric, jsonb, and timestamp columns are all `any`) into the
 * strongly-typed discriminated union in {@link ../types}.
 */

import type { GetConfidentialAssetActivitiesQuery } from "./operations";
import type {
  ActivityBase,
  AllowListingChangedActivity,
  AssetSpecificAuditorChangedActivity,
  ConfidentialAssetActivity,
  ConfidentialityForAssetTypeChangedActivity,
  DepositedActivity,
  GlobalAuditorChangedActivity,
  IncomingTransfersPauseChangedActivity,
  KeyRotatedActivity,
  NormalizedActivity,
  RegisteredActivity,
  RolledOverActivity,
  TransferredActivity,
  WithdrawnActivity,
} from "../types";

/** A single row as returned by the generated GraphQL query. */
export type GraphqlActivityRow =
  GetConfidentialAssetActivitiesQuery["confidential_asset_activities"][number];

/**
 * Converts an array of Aptos name objects (as returned by the indexer) into a
 * human-readable name string, or `null` if no valid entry exists.
 *
 * - With subdomain: `"subdomain.domain"` (no `.apt` suffix)
 * - Domain only:    `"domain.apt"`
 */
export function parseAptosName(names: Array<{ domain?: string | null, subdomain?: string | null }>): string | null {
  const name = names[0];
  if (!name?.domain) return null;
  return name.subdomain ? `${name.subdomain}.${name.domain}` : `${name.domain}.apt`;
}

function base(row: GraphqlActivityRow): ActivityBase {
  return {
    transaction_version: String(row.transaction_version),
    event_index: String(row.event_index),
    owner_address: row.owner_address,
    owner_primary_aptos_name: parseAptosName(row.owner_primary_aptos_name),
    event_data_version: row.event_data_version,
    block_height: String(row.block_height),
    is_transaction_success: row.is_transaction_success,
    entry_function_id_str: row.entry_function_id_str ?? null,
    transaction_timestamp: String(row.transaction_timestamp),
  } satisfies ActivityBase;
}

/**
 * Convert a single GraphQL activity row into a strongly-typed
 * {@link ConfidentialAssetActivity}.
 *
 * Each branch is checked with `satisfies` so that field assignments are
 * validated against the exact variant type at compile time.
 */
export function convertActivity(row: GraphqlActivityRow): ConfidentialAssetActivity {
  const b = base(row);

  switch (row.event_type) {
    case "Registered":
      return {
        ...b,
        event_type: "Registered",
        asset_type: row.asset_type!,
        counterparty_address: null,
        counterparty_primary_aptos_name: null,
        amount: null,
        event_data: row.event_data,
      } satisfies RegisteredActivity;

    case "Deposited":
      return {
        ...b,
        event_type: "Deposited",
        asset_type: row.asset_type!,
        counterparty_address: null,
        counterparty_primary_aptos_name: null,
        amount: String(row.amount),
        event_data: row.event_data,
      } satisfies DepositedActivity;

    case "Withdrawn":
      return {
        ...b,
        event_type: "Withdrawn",
        asset_type: row.asset_type!,
        counterparty_address: row.counterparty_address!,
        counterparty_primary_aptos_name: parseAptosName(row.counterparty_primary_aptos_name),
        amount: String(row.amount),
        event_data: row.event_data,
      } satisfies WithdrawnActivity;

    case "Transferred":
      return {
        ...b,
        event_type: "Transferred",
        asset_type: row.asset_type!,
        counterparty_address: row.counterparty_address!,
        counterparty_primary_aptos_name: parseAptosName(row.counterparty_primary_aptos_name),
        amount: null,
        event_data: row.event_data,
      } satisfies TransferredActivity;

    case "Normalized":
      return {
        ...b,
        event_type: "Normalized",
        asset_type: row.asset_type!,
        counterparty_address: null,
        counterparty_primary_aptos_name: null,
        amount: null,
        event_data: row.event_data,
      } satisfies NormalizedActivity;

    case "RolledOver":
      return {
        ...b,
        event_type: "RolledOver",
        asset_type: row.asset_type!,
        counterparty_address: null,
        counterparty_primary_aptos_name: null,
        amount: null,
        event_data: row.event_data,
      } satisfies RolledOverActivity;

    case "KeyRotated":
      return {
        ...b,
        event_type: "KeyRotated",
        asset_type: row.asset_type!,
        counterparty_address: null,
        counterparty_primary_aptos_name: null,
        amount: null,
        event_data: row.event_data,
      } satisfies KeyRotatedActivity;

    case "IncomingTransfersPauseChanged":
      return {
        ...b,
        event_type: "IncomingTransfersPauseChanged",
        asset_type: row.asset_type!,
        counterparty_address: null,
        counterparty_primary_aptos_name: null,
        amount: null,
        event_data: row.event_data,
      } satisfies IncomingTransfersPauseChangedActivity;

    case "AllowListingChanged":
      return {
        ...b,
        event_type: "AllowListingChanged",
        asset_type: null,
        counterparty_address: null,
        counterparty_primary_aptos_name: null,
        amount: null,
        event_data: row.event_data,
      } satisfies AllowListingChangedActivity;

    case "ConfidentialityForAssetTypeChanged":
      return {
        ...b,
        event_type: "ConfidentialityForAssetTypeChanged",
        asset_type: row.asset_type!,
        counterparty_address: null,
        counterparty_primary_aptos_name: null,
        amount: null,
        event_data: row.event_data,
      } satisfies ConfidentialityForAssetTypeChangedActivity;

    case "GlobalAuditorChanged":
      return {
        ...b,
        event_type: "GlobalAuditorChanged",
        asset_type: null,
        counterparty_address: null,
        counterparty_primary_aptos_name: null,
        amount: null,
        event_data: row.event_data,
      } satisfies GlobalAuditorChangedActivity;

    case "AssetSpecificAuditorChanged":
      return {
        ...b,
        event_type: "AssetSpecificAuditorChanged",
        asset_type: row.asset_type!,
        counterparty_address: null,
        counterparty_primary_aptos_name: null,
        amount: null,
        event_data: row.event_data,
      } satisfies AssetSpecificAuditorChangedActivity;

    default:
      throw new Error(`Unknown confidential asset event_type: ${row.event_type}`);
  }
}

/** Batch-convert an array of GraphQL rows. */
export function convertActivities(
  rows: GraphqlActivityRow[],
): ConfidentialAssetActivity[] {
  return rows.map(convertActivity);
}
