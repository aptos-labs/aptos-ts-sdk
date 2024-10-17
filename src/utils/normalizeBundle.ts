// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Deserializer, Serializable } from "../bcs";
/**
 * @group Implementation
 * @category Utils
 */
export type DeserializableClass<T extends Serializable> = {
  /**
   * Deserializes a serialized object using the provided deserializer.
   * This function allows you to reconstruct an object from its serialized form.
   *
   * @param deserializer - An instance of the Deserializer used to read the serialized data.
   * @group Implementation
   * @category Utils
   */
  deserialize(deserializer: Deserializer): T;
};

/**
 * Normalizes an instance of a class by deserializing it from its byte representation.
 * This function allows the `instanceof` operator to work correctly when the input objects originate from a different bundle.
 *
 * @param cls - The class of the object to normalize.
 * @param value - The instance to normalize.
 * @group Implementation
 * @category Utils
 */
export function normalizeBundle<T extends Serializable>(cls: DeserializableClass<T>, value: T) {
  const serializedBytes = value.bcsToBytes();
  const deserializer = new Deserializer(serializedBytes);
  return cls.deserialize(deserializer);
}
