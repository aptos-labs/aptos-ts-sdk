// Copyright (c) Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * TypeScript types for rows in the `confidential_asset_activities` indexer
 * table. These mirror the Postgres schema and the JSONB `event_data` shapes
 * produced by the confidential asset processor (event_data_version "1.0.0").
 *
 * The main export is the discriminated union {@link ConfidentialAssetActivity},
 * keyed on `event_type`. Each variant precisely describes which columns are
 * non-null so consumers never need to defensively check fields that are
 * guaranteed to be present (or absent) for a given event type.
 */

// ─── Shared sub-types used inside event_data JSONB ──────────────────────────

/** A compressed Ristretto point, hex-encoded. */
export interface CompressedRistrettoPoint {
  data: string;
}

/** Auditor hint indicating which auditor config was effective. */
export interface EffectiveAuditorHintV1 {
  __variant__: "V1";
  is_global: boolean;
  epoch: number;
}

export type EffectiveAuditorHint = EffectiveAuditorHintV1;

// ─── Per-event event_data shapes ────────────────────────────────────────────

export interface RegisteredEventData {
  ek: CompressedRistrettoPoint;
}

export type DepositedEventData = Record<string, never>;

export interface WithdrawnEventData {
  auditor_hint: EffectiveAuditorHint | null;
}

export interface TransferredEventData {
  amount_P: CompressedRistrettoPoint[];
  amount_R_sender: CompressedRistrettoPoint[];
  amount_R_recip: CompressedRistrettoPoint[];
  amount_R_eff_aud: CompressedRistrettoPoint[];
  amount_R_volun_auds: CompressedRistrettoPoint[][];
  ek_volun_auds: CompressedRistrettoPoint[];
  sender_auditor_hint: EffectiveAuditorHint | null;
  memo: string;
}

export interface NormalizedEventData {
  auditor_hint: EffectiveAuditorHint | null;
}

export type RolledOverEventData = Record<string, never>;

export interface KeyRotatedEventData {
  new_ek: CompressedRistrettoPoint;
}

export interface IncomingTransfersPauseChangedEventData {
  paused: boolean;
}

export interface AllowListingChangedEventData {
  enabled: boolean;
}

export interface ConfidentialityForAssetTypeChangedEventData {
  allowed: boolean;
}

export interface AuditorChangedEventData {
  auditor_ek: CompressedRistrettoPoint | null;
  auditor_epoch: number;
}

// ─── Row-level field groups ─────────────────────────────────────────────────
//
// Columns present on every row. Postgres bigint and numeric come back as
// strings from most drivers (pg, prisma, etc.) since they exceed JS
// Number.MAX_SAFE_INTEGER.

export interface ActivityBase {
  transaction_version: string;
  event_index: string;
  owner_address: string;
  owner_primary_aptos_name: string | null;
  event_data_version: string;
  block_height: string;
  is_transaction_success: boolean;
  entry_function_id_str: string | null;
  transaction_timestamp: string;
}

/** Events scoped to a specific fungible asset. */
interface WithAssetType {
  asset_type: string;
}

/** Events not scoped to a specific fungible asset. */
interface WithoutAssetType {
  asset_type: null;
}

/** Events involving two parties (e.g. transfer, withdraw). */
interface WithCounterparty {
  counterparty_address: string;
  counterparty_primary_aptos_name: string | null;
}

/** Events involving only one party. */
interface WithoutCounterparty {
  counterparty_address: null;
  counterparty_primary_aptos_name: null;
}

/** Events with a plaintext amount (deposit, withdraw). */
interface WithAmount {
  amount: string;
}

/** Events without a plaintext amount (encrypted or N/A). */
interface WithoutAmount {
  amount: null;
}

// ─── Per-event-type activity rows ───────────────────────────────────────────

export type RegisteredActivity = ActivityBase &
  WithAssetType &
  WithoutCounterparty &
  WithoutAmount & {
    event_type: "Registered";
    event_data: RegisteredEventData;
  };

export type DepositedActivity = ActivityBase &
  WithAssetType &
  WithoutCounterparty &
  WithAmount & {
    event_type: "Deposited";
    event_data: DepositedEventData;
  };

export type WithdrawnActivity = ActivityBase &
  WithAssetType &
  WithCounterparty &
  WithAmount & {
    event_type: "Withdrawn";
    event_data: WithdrawnEventData;
  };

export type TransferredActivity = ActivityBase &
  WithAssetType &
  WithCounterparty &
  WithoutAmount & {
    event_type: "Transferred";
    event_data: TransferredEventData;
  };

export type NormalizedActivity = ActivityBase &
  WithAssetType &
  WithoutCounterparty &
  WithoutAmount & {
    event_type: "Normalized";
    event_data: NormalizedEventData;
  };

export type RolledOverActivity = ActivityBase &
  WithAssetType &
  WithoutCounterparty &
  WithoutAmount & {
    event_type: "RolledOver";
    event_data: RolledOverEventData;
  };

export type KeyRotatedActivity = ActivityBase &
  WithAssetType &
  WithoutCounterparty &
  WithoutAmount & {
    event_type: "KeyRotated";
    event_data: KeyRotatedEventData;
  };

export type IncomingTransfersPauseChangedActivity = ActivityBase &
  WithAssetType &
  WithoutCounterparty &
  WithoutAmount & {
    event_type: "IncomingTransfersPauseChanged";
    event_data: IncomingTransfersPauseChangedEventData;
  };

export type AllowListingChangedActivity = ActivityBase &
  WithoutAssetType &
  WithoutCounterparty &
  WithoutAmount & {
    event_type: "AllowListingChanged";
    event_data: AllowListingChangedEventData;
  };

export type ConfidentialityForAssetTypeChangedActivity = ActivityBase &
  WithAssetType &
  WithoutCounterparty &
  WithoutAmount & {
    event_type: "ConfidentialityForAssetTypeChanged";
    event_data: ConfidentialityForAssetTypeChangedEventData;
  };

export type GlobalAuditorChangedActivity = ActivityBase &
  WithoutAssetType &
  WithoutCounterparty &
  WithoutAmount & {
    event_type: "GlobalAuditorChanged";
    event_data: AuditorChangedEventData;
  };

export type AssetSpecificAuditorChangedActivity = ActivityBase &
  WithAssetType &
  WithoutCounterparty &
  WithoutAmount & {
    event_type: "AssetSpecificAuditorChanged";
    event_data: AuditorChangedEventData;
  };

// ─── Discriminated union ────────────────────────────────────────────────────

/**
 * A row from the `confidential_asset_activities` indexer table.
 *
 * Discriminate on `event_type` to narrow to the specific activity variant:
 *
 * ```ts
 * if (activity.event_type === "Transferred") {
 *   // activity is TransferredActivity — counterparty_address is string, not null
 *   console.log(activity.counterparty_address);
 *   console.log(activity.event_data.amount_P);
 * }
 * ```
 */
export type ConfidentialAssetActivity =
  | RegisteredActivity
  | DepositedActivity
  | WithdrawnActivity
  | TransferredActivity
  | NormalizedActivity
  | RolledOverActivity
  | KeyRotatedActivity
  | IncomingTransfersPauseChangedActivity
  | AllowListingChangedActivity
  | ConfidentialityForAssetTypeChangedActivity
  | GlobalAuditorChangedActivity
  | AssetSpecificAuditorChangedActivity;

/** All possible `event_type` string values. */
export type ConfidentialAssetEventType = ConfidentialAssetActivity["event_type"];

/** All possible `event_type` values as a const array, useful for iteration. */
export const CONFIDENTIAL_ASSET_EVENT_TYPES: readonly ConfidentialAssetEventType[] = [
  "Registered",
  "Deposited",
  "Withdrawn",
  "Transferred",
  "Normalized",
  "RolledOver",
  "KeyRotated",
  "IncomingTransfersPauseChanged",
  "AllowListingChanged",
  "ConfidentialityForAssetTypeChanged",
  "GlobalAuditorChanged",
  "AssetSpecificAuditorChanged",
] as const;
