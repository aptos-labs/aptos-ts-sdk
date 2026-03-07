// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";

export class ChainId extends Serializable {
  public readonly chainId: number;

  constructor(chainId: number) {
    super();
    this.chainId = chainId;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU8(this.chainId);
  }

  static deserialize(deserializer: Deserializer): ChainId {
    const chainId = deserializer.deserializeU8();
    return new ChainId(chainId);
  }
}
