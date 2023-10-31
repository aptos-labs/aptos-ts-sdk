import { Serializer } from "../../bcs";
import { Hex } from "../hex";
import type { Serializable } from "./interfaces";

/**
 * Serializes a `Serializable` value to its BCS representation.
 * This function is the Typescript SDK equivalent of `bcs::to_bytes` in Move.
 * @returns the BCS representation of the Serializable instance as a byte buffer
 */
export function bcsToBytes(serializable: Serializable): Uint8Array {
  const serializer = new Serializer();
  serializable.serialize(serializer);
  return serializer.toUint8Array();
}

/**
 * Helper function to get a value's BCS-serialized bytes as a Hex instance.
 * @returns a Hex instance with the BCS-serialized bytes loaded into its underlying Uint8Array
 */
export function bcsToHex(serializable: Serializable): Hex {
  const serializedBytes = bcsToBytes(serializable);
  return Hex.fromHexInput(serializedBytes);
}
