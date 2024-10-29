// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Serializable, Serializer } from "../../bcs/serializer";
import { Deserializer } from "../../bcs/deserializer";
import { AccountAddress } from "../../core";
import { Identifier } from "./identifier";
import { MoveModuleId } from "../../types";

/**
 * Represents a ModuleId that can be serialized and deserialized.
 * A ModuleId consists of a module address (e.g., "0x1") and a module name (e.g., "coin").
 */
export class ModuleId extends Serializable {
  public readonly address: AccountAddress;

  public readonly name: Identifier;

  /**
   * Initializes a new instance of the module with the specified account address and name.
   *
   * @param address - The account address, e.g., "0x1".
   * @param name - The module name under the specified address, e.g., "coin".
   */
  constructor(address: AccountAddress, name: Identifier) {
    super();
    this.address = address;
    this.name = name;
  }

  /**
   * Converts a string literal in the format "account_address::module_name" to a ModuleId.
   * @param moduleId - A string literal representing the module identifier.
   * @throws Error if the provided moduleId is not in the correct format.
   * @returns ModuleId - The corresponding ModuleId object.
   */
  static fromStr(moduleId: MoveModuleId): ModuleId {
    const parts = moduleId.split("::");
    if (parts.length !== 2) {
      throw new Error("Invalid module id.");
    }
    return new ModuleId(AccountAddress.fromString(parts[0]), new Identifier(parts[1]));
  }

  /**
   * Serializes the address and name properties using the provided serializer.
   * This function is essential for converting the object's data into a format suitable for transmission or storage.
   *
   * @param serializer - The serializer instance used to perform the serialization.
   */
  serialize(serializer: Serializer): void {
    this.address.serialize(serializer);
    this.name.serialize(serializer);
  }

  /**
   * Deserializes a ModuleId from the provided deserializer.
   * This function retrieves the account address and identifier to construct a ModuleId instance.
   *
   * @param deserializer - The deserializer instance used to read the data.
   */
  static deserialize(deserializer: Deserializer): ModuleId {
    const address = AccountAddress.deserialize(deserializer);
    const name = Identifier.deserialize(deserializer);
    return new ModuleId(address, name);
  }
}
