// Copyright (c) Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Query helpers for the `confidential_asset_activities` indexer table.
 * Imports generated Hasura types from {@link ./generated} and re-exports
 * the subset that callers need for filtering and ordering.
 */

import { Aptos } from "@aptos-labs/ts-sdk";
import type { ConfidentialAssetActivity } from "./types";
import { GetConfidentialAssetActivities } from "./generated/queries";
import type { GetConfidentialAssetActivitiesQuery } from "./generated/operations";
import { convertActivities } from "./generated/convert";
import type {
  ConfidentialAssetActivitiesBoolExp,
  ConfidentialAssetActivitiesOrderBy,
} from "./generated/types";

export type { ConfidentialAssetActivitiesBoolExp, ConfidentialAssetActivitiesOrderBy };

// ─── Query options ─────────────────────────────────────────────────────────

export interface GetConfidentialAssetActivitiesArgs {
  where?: ConfidentialAssetActivitiesBoolExp;
  orderBy?: ConfidentialAssetActivitiesOrderBy[];
  offset?: number;
  limit?: number;
}

// ─── Query helper ──────────────────────────────────────────────────────────

/**
 * Query confidential asset activities from the indexer via the GraphQL API.
 *
 * @param aptos - An {@link Aptos} client instance configured for the target network.
 * @param args  - Optional filtering, ordering, and pagination parameters.
 * @returns An array of {@link ConfidentialAssetActivity} rows.
 *
 * @example
 * ```ts
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * import { getConfidentialAssetActivities } from "@aptos-labs/confidential-asset";
 *
 * const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
 * const activities = await getConfidentialAssetActivities(aptos, {
 *   where: { owner_address: { _eq: "0x1" } },
 *   orderBy: [{ transaction_version: "desc" }],
 *   limit: 50,
 * });
 *
 * for (const a of activities) {
 *   if (a.event_type === "Transferred") {
 *     console.log(a.counterparty_address, a.event_data.memo);
 *   }
 * }
 * ```
 */
export async function getConfidentialAssetActivities(
  aptos: Aptos,
  args?: GetConfidentialAssetActivitiesArgs,
): Promise<ConfidentialAssetActivity[]> {
  const data = await aptos.queryIndexer<GetConfidentialAssetActivitiesQuery>({
    query: {
      query: GetConfidentialAssetActivities,
      variables: {
        where_condition: args?.where,
        order_by: args?.orderBy,
        offset: args?.offset,
        limit: args?.limit,
      },
    },
  });
  return convertActivities(data.confidential_asset_activities);
}
