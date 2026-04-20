// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Fetches and caches the encryption key from the fullnode API.
 * The key is per-epoch; cache by epoch and refresh when epoch changes.
 */

import { AptosConfig } from "../api/aptosConfig";
import { Hex } from "../core";
import { Deserializer } from "../bcs/deserializer";
import { EncryptionKey } from "../core/crypto/encryption";
import { getLedgerInfo } from "./general";

interface CachedEncryptionKey {
  epoch: string;
  key: EncryptionKey;
}

export type FetchedEncryptionKey = {
  key: EncryptionKey;
  /** Ledger epoch for the cached key (matches aptos-core `EncryptionKeyState.epoch` / `EncryptedInner.encryption_epoch`). */
  epoch: bigint;
};

const encryptionKeyCache = new Map<string, CachedEncryptionKey>();

/**
 * Fetches the encryption key from the fullnode index endpoint, deserializes it,
 * and caches it by epoch + network. Returns null if the node does not support
 * encrypted transactions.
 *
 * @param args.aptosConfig - Aptos configuration.
 * @param args.forceRefresh - If true, bypass cache and fetch fresh.
 */
export async function fetchAndCacheEncryptionKey(args: {
  aptosConfig: AptosConfig;
  forceRefresh?: boolean;
}): Promise<FetchedEncryptionKey | null> {
  const { aptosConfig, forceRefresh } = args;
  const cacheKey = `encryption-key-${aptosConfig.network}`;

  const ledgerInfo = await getLedgerInfo({ aptosConfig });
  const epochBig = BigInt(ledgerInfo.epoch);

  if (!forceRefresh) {
    const cached = encryptionKeyCache.get(cacheKey);
    if (cached && cached.epoch === ledgerInfo.epoch) {
      return { key: cached.key, epoch: epochBig };
    }
  }

  const hexKey = ledgerInfo.encryption_key;
  if (!hexKey) {
    return null;
  }

  const keyBytes = Hex.fromHexInput(hexKey).toUint8Array();
  const deserializer = new Deserializer(keyBytes);
  const key = EncryptionKey.deserialize(deserializer);

  encryptionKeyCache.set(cacheKey, { epoch: ledgerInfo.epoch, key });
  return { key, epoch: epochBig };
}

/**
 * Clears the cached encryption key for a given network. Useful for testing
 * or when an epoch boundary is detected.
 */
export function clearEncryptionKeyCache(aptosConfig: AptosConfig): void {
  encryptionKeyCache.delete(`encryption-key-${aptosConfig.network}`);
}
