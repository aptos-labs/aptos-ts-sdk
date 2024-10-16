// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Serializer, Serializable } from "../../bcs/serializer";
import { Deserializer } from "../../bcs/deserializer";

/**
 * Represents a ChainId that can be serialized and deserialized.
 *
 * @extends Serializable
 */
export class ChainId extends Serializable {
  public readonly chainId: number;

  /**
   * Initializes a new instance of the class with the specified chain ID.
   *
   * @param chainId - The ID of the blockchain network to be used.
   */
  constructor(chainId: number) {
    super();
    this.chainId = chainId;
  }

  /**
   * Serializes the current object using the provided serializer.
   * This function helps in converting the object into a format suitable for transmission or storage.
   *
   * @param serializer - The serializer instance used to perform the serialization.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU8(this.chainId);
  }

  /**
   * Deserializes a ChainId from the provided deserializer.
   * This function allows you to reconstruct a ChainId object from serialized data.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   */
  static deserialize(deserializer: Deserializer): ChainId {
    const chainId = deserializer.deserializeU8();
    return new ChainId(chainId);
  }
}
