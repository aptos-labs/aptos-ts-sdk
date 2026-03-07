// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "../core/account-address.js";
import { Identifier } from "../core/type-tag.js";
import type { MoveModuleId } from "./types.js";

export class ModuleId extends Serializable {
  public readonly address: AccountAddress;
  public readonly name: Identifier;

  constructor(address: AccountAddress, name: Identifier) {
    super();
    this.address = address;
    this.name = name;
  }

  static fromStr(moduleId: MoveModuleId): ModuleId {
    const parts = moduleId.split("::");
    if (parts.length !== 2) {
      throw new Error("Invalid module id.");
    }
    return new ModuleId(AccountAddress.fromString(parts[0]), new Identifier(parts[1]));
  }

  serialize(serializer: Serializer): void {
    this.address.serialize(serializer);
    this.name.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): ModuleId {
    const address = AccountAddress.deserialize(deserializer);
    const name = Identifier.deserialize(deserializer);
    return new ModuleId(address, name);
  }
}
