// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "../core/account-address.js";
import { Identifier } from "../core/type-tag.js";
import type { MoveModuleId } from "./types.js";

/**
 * BCS-serializable representation of a Move module identifier.
 *
 * A module is uniquely identified by the combination of the deploying account address and
 * the module name.  `ModuleId` is used inside {@link EntryFunction} to specify which module
 * the function belongs to.
 *
 * @example
 * ```typescript
 * const moduleId = ModuleId.fromStr("0x1::coin");
 * ```
 */
export class ModuleId extends Serializable {
  /** The on-chain address that published this module. */
  public readonly address: AccountAddress;

  /** The name of the module within the publishing account. */
  public readonly name: Identifier;

  /**
   * Creates a new `ModuleId` from an address and module name.
   *
   * @param address - The account address that published the module.
   * @param name - The module name identifier.
   */
  constructor(address: AccountAddress, name: Identifier) {
    super();
    this.address = address;
    this.name = name;
  }

  /**
   * Parses a `ModuleId` from a string in `<address>::<module>` format.
   *
   * @param moduleId - A fully-qualified module identifier string, e.g. `"0x1::coin"`.
   * @returns A new `ModuleId` instance.
   * @throws Error if the string does not contain exactly two `::` separated parts.
   *
   * @example
   * ```typescript
   * const moduleId = ModuleId.fromStr("0x1::coin");
   * ```
   */
  static fromStr(moduleId: MoveModuleId): ModuleId {
    const parts = moduleId.split("::");
    if (parts.length !== 2) {
      throw new Error("Invalid module id.");
    }
    return new ModuleId(AccountAddress.fromString(parts[0]), new Identifier(parts[1]));
  }

  /**
   * Serializes this `ModuleId` into BCS bytes (address followed by name).
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    this.address.serialize(serializer);
    this.name.serialize(serializer);
  }

  /**
   * Deserializes a `ModuleId` from BCS bytes.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `ModuleId` instance.
   */
  static deserialize(deserializer: Deserializer): ModuleId {
    const address = AccountAddress.deserialize(deserializer);
    const name = Identifier.deserialize(deserializer);
    return new ModuleId(address, name);
  }
}
