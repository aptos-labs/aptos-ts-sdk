// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Deserializer } from "../../bcs/deserializer";
import { Serializable, Serializer } from "../../bcs/serializer";

/**
 * Represents an Identifier that can be serialized and deserialized.
 * This class is used to denote the module "name" in "ModuleId" and
 * the "function name" in "EntryFunction".
 *
 * @extends Serializable
 * @group Implementation
 * @category Transactions
 */
export class Identifier extends Serializable {
  public identifier: string;

  /**
   * Creates an instance of the class with a specified identifier.
   *
   * @param identifier - The unique identifier for the instance.
   * @group Implementation
   * @category Transactions
   */
  constructor(identifier: string) {
    super();
    this.identifier = identifier;
  }

  /**
   * Serializes the identifier of the current instance using the provided serializer.
   *
   * @param serializer - The serializer instance used to perform the serialization.
   * @group Implementation
   * @category Transactions
   */
  public serialize(serializer: Serializer): void {
    serializer.serializeStr(this.identifier);
  }

  /**
   * Deserializes an identifier from the provided deserializer.
   * This function is useful for reconstructing an Identifier object from a serialized format.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   * @group Implementation
   * @category Transactions
   */
  static deserialize(deserializer: Deserializer): Identifier {
    const identifier = deserializer.deserializeStr();
    return new Identifier(identifier);
  }
}
