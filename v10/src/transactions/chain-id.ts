// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";

/**
 * BCS-serializable wrapper around a numeric Aptos chain identifier.
 *
 * The chain ID is included in every {@link RawTransaction} to prevent replay attacks across
 * different Aptos networks (e.g. mainnet vs. testnet).
 *
 * @example
 * ```typescript
 * const chainId = new ChainId(1); // mainnet
 * const bytes = chainId.bcsToBytes();
 * ```
 */
export class ChainId extends Serializable {
  /** The numeric chain identifier. */
  public readonly chainId: number;

  /**
   * Creates a new `ChainId` wrapper.
   *
   * @param chainId - The numeric identifier of the target Aptos network.
   */
  constructor(chainId: number) {
    super();
    this.chainId = chainId;
  }

  /**
   * Serializes the chain ID as a single unsigned 8-bit integer.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU8(this.chainId);
  }

  /**
   * Deserializes a `ChainId` from BCS bytes.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `ChainId` instance.
   */
  static deserialize(deserializer: Deserializer): ChainId {
    const chainId = deserializer.deserializeU8();
    return new ChainId(chainId);
  }
}
