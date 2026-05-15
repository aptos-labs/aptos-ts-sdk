// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Fetches and caches the encryption key from the fullnode API.
 * The key is per-epoch; cache by epoch and refresh when epoch changes.
 */

import { AptosConfig } from "../api/aptosConfig.js";
import { Hex } from "../core/hex.js";
import { Deserializer } from "../bcs/deserializer.js";
import { EncryptionKey } from "../core/crypto/encryption/index.js";
import { getLedgerInfo } from "./general.js";

interface CachedEncryptionKey {
  epoch: string;
  key: EncryptionKey;
}

const encryptionKeyCache = new Map<string, CachedEncryptionKey>();

/**
 * Fetches the encryption key from the fullnode index endpoint, deserializes it,
 * and caches it by fullnode URL (or network label) + epoch. Returns null if the node does not support
 * encrypted transactions.
 *
 * @param args.aptosConfig - Aptos configuration.
 */
export async function fetchAndCacheEncryptionKey(args: {
  aptosConfig: AptosConfig;
}): Promise<{ key: EncryptionKey; epoch: bigint } | null> {
  const { aptosConfig } = args;
  const cacheKey = `encryption-key-${aptosConfig.fullnode ?? aptosConfig.network}`;

  const ledgerInfo = await getLedgerInfo({ aptosConfig });

  const cached = encryptionKeyCache.get(cacheKey);
  if (cached && cached.epoch === ledgerInfo.epoch) {
    return { key: cached.key, epoch: BigInt(cached.epoch) };
  }

  const hexKey = ledgerInfo.encryption_key;
  if (!hexKey) {
    return null;
  }

  const keyBytes = Hex.fromHexInput(hexKey).toUint8Array();
  const deserializer = new Deserializer(keyBytes);
  const key = EncryptionKey.deserialize(deserializer);

  encryptionKeyCache.set(cacheKey, { epoch: ledgerInfo.epoch, key });
  return { key, epoch: BigInt(ledgerInfo.epoch) };
}
