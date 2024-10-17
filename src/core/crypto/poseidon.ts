/* eslint-disable no-bitwise */
import {
  poseidon1,
  poseidon2,
  poseidon3,
  poseidon4,
  poseidon5,
  poseidon6,
  poseidon7,
  poseidon8,
  poseidon9,
  poseidon10,
  poseidon11,
  poseidon12,
  poseidon13,
  poseidon14,
  poseidon15,
  poseidon16,
} from "poseidon-lite";

const numInputsToPoseidonFunc = [
  poseidon1,
  poseidon2,
  poseidon3,
  poseidon4,
  poseidon5,
  poseidon6,
  poseidon7,
  poseidon8,
  poseidon9,
  poseidon10,
  poseidon11,
  poseidon12,
  poseidon13,
  poseidon14,
  poseidon15,
  poseidon16,
];

const BYTES_PACKED_PER_SCALAR = 31;
const MAX_NUM_INPUT_SCALARS = 16;
const MAX_NUM_INPUT_BYTES = (MAX_NUM_INPUT_SCALARS - 1) * BYTES_PACKED_PER_SCALAR;

/**
 * Hashes a string to a field element via Poseidon hashing.
 * This function is useful for converting a string into a fixed-size hash that can be used in cryptographic applications.
 *
 * @param str - The string to be hashed.
 * @param maxSizeBytes - The maximum size in bytes for the resulting hash.
 * @returns bigint - The result of the hash.
 * @group Implementation
 * @category Serialization
 */
export function hashStrToField(str: string, maxSizeBytes: number): bigint {
  const textEncoder = new TextEncoder();
  const strBytes = textEncoder.encode(str);
  return hashBytesWithLen(strBytes, maxSizeBytes);
}

/**
 * Computes a Poseidon hash of the provided byte array, ensuring that the byte array does not exceed the specified maximum size.
 * This function is useful for generating a hash from a byte array while enforcing size constraints.
 *
 * @param bytes - The byte array to be hashed.
 * @param maxSizeBytes - The maximum allowed size for the byte array.
 * @throws Error if the length of the inputted bytes exceeds the specified maximum size.
 * @group Implementation
 * @category Serialization
 */
function hashBytesWithLen(bytes: Uint8Array, maxSizeBytes: number): bigint {
  if (bytes.length > maxSizeBytes) {
    throw new Error(`Inputted bytes of length ${bytes} is longer than ${maxSizeBytes}`);
  }
  const packed = padAndPackBytesWithLen(bytes, maxSizeBytes);
  return poseidonHash(packed);
}

/**
 * Pads the input byte array with zeros to a specified maximum size and then packs the bytes.
 * This function ensures that the byte array does not exceed the specified maximum size, throwing an error if it does.
 *
 * @param bytes - The byte array to be padded and packed.
 * @param maxSizeBytes - The maximum size in bytes that the input array can have.
 * @throws Error if the input byte array exceeds the specified maximum size.
 * @group Implementation
 * @category Serialization
 */
function padAndPackBytesNoLen(bytes: Uint8Array, maxSizeBytes: number): bigint[] {
  if (bytes.length > maxSizeBytes) {
    throw new Error(`Input bytes of length ${bytes} is longer than ${maxSizeBytes}`);
  }
  const paddedStrBytes = padUint8ArrayWithZeros(bytes, maxSizeBytes);
  return packBytes(paddedStrBytes);
}

/**
 * Pads and packs the given byte array to a specified maximum size and appends its length.
 * This function ensures that the byte array does not exceed the maximum size, throwing an error if it does.
 * It is useful for preparing byte data for further processing or transmission by ensuring a consistent format.
 *
 * @param bytes - The byte array to be padded and packed.
 * @param maxSizeBytes - The maximum allowed size for the byte array.
 * @throws Error if the length of the input bytes exceeds the maximum size.
 * @returns A new Uint8Array that contains the padded and packed bytes along with the length of the original byte array.
 * @group Implementation
 * @category Serialization
 */
export function padAndPackBytesWithLen(bytes: Uint8Array, maxSizeBytes: number): bigint[] {
  if (bytes.length > maxSizeBytes) {
    throw new Error(`Input bytes of length ${bytes} is longer than ${maxSizeBytes}`);
  }
  return padAndPackBytesNoLen(bytes, maxSizeBytes).concat([BigInt(bytes.length)]);
}

/**
 * Packs a Uint8Array into an array of BigInts, ensuring the input does not exceed the maximum allowed bytes.
 * @param bytes - The Uint8Array to be packed.
 * @throws {Error} Throws an error if the input exceeds the maximum number of bytes allowed.
 * @group Implementation
 * @category Serialization
 */
function packBytes(bytes: Uint8Array): bigint[] {
  if (bytes.length > MAX_NUM_INPUT_BYTES) {
    throw new Error(`Can't pack more than ${MAX_NUM_INPUT_BYTES}.  Was given ${bytes.length} bytes`);
  }
  return chunkUint8Array(bytes, BYTES_PACKED_PER_SCALAR).map((chunk) => bytesToBigIntLE(chunk));
}

/**
 * Splits a Uint8Array into smaller chunks of the specified size.
 * This function is useful for processing large arrays in manageable segments.
 *
 * @param array - The Uint8Array to be split into chunks.
 * @param chunkSize - The size of each chunk.
 * @returns An array of Uint8Array chunks.
 * @group Implementation
 * @category Serialization
 */
function chunkUint8Array(array: Uint8Array, chunkSize: number): Uint8Array[] {
  const result: Uint8Array[] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.subarray(i, i + chunkSize));
  }
  return result;
}

/**
 * Converts a little-endian byte array into a BigInt.
 * This function is useful for interpreting byte data as a numerical value in a way that respects the little-endian format.
 *
 * @param bytes - The byte array to convert.
 * @returns The resulting BigInt representation of the byte array.
 * @group Implementation
 * @category Serialization
 */
export function bytesToBigIntLE(bytes: Uint8Array): bigint {
  let result = BigInt(0);
  for (let i = bytes.length - 1; i >= 0; i -= 1) {
    result = (result << BigInt(8)) | BigInt(bytes[i]);
  }
  return result;
}

/**
 * Converts a bigint value into a little-endian byte array of a specified length.
 * This function is useful for representing large integers in a byte format, which is often required for cryptographic operations
 * or binary data manipulation.
 *
 * @param value - The number to convert into bytes.
 * @param length - The desired length of the resulting byte array.
 * @returns A Uint8Array containing the little-endian representation of the bigint value.
 * @group Implementation
 * @category Serialization
 */
export function bigIntToBytesLE(value: bigint | number, length: number): Uint8Array {
  let val = BigInt(value);
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = Number(val & BigInt(0xff));
    val >>= BigInt(8);
  }
  return bytes;
}

/**
 * Pads the input Uint8Array with zeros to achieve the specified size.
 * This function is useful for ensuring that a byte array meets a required length for further processing.
 *
 * @param inputArray - The Uint8Array to be padded.
 * @param paddedSize - The desired size of the padded array, which must be greater than or equal to the input array size.
 * @throws Error if paddedSize is less than the length of inputArray.
 * @group Implementation
 * @category Serialization
 */
function padUint8ArrayWithZeros(inputArray: Uint8Array, paddedSize: number): Uint8Array {
  if (paddedSize < inputArray.length) {
    throw new Error("Padded size must be greater than or equal to the input array size.");
  }

  // Create a new Uint8Array with the padded size
  const paddedArray = new Uint8Array(paddedSize);

  // Copy the content of the input array to the new array
  paddedArray.set(inputArray);

  // Fill the remaining space with zeros
  for (let i = inputArray.length; i < paddedSize; i += 1) {
    paddedArray[i] = 0;
  }

  return paddedArray;
}

/**
 * Hashes up to 16 scalar elements via the Poseidon hashing algorithm.
 * Each element must be scalar fields of the BN254 elliptic curve group.
 *
 * @param inputs - An array of elements to be hashed, which can be of type number, bigint, or string.
 * @returns bigint - The result of the hash.
 * @throws Error - Throws an error if the input length exceeds the maximum allowed.
 * @group Implementation
 * @category Serialization
 */
export function poseidonHash(inputs: (number | bigint | string)[]): bigint {
  if (inputs.length > numInputsToPoseidonFunc.length) {
    throw new Error(
      `Unable to hash input of length ${inputs.length}.  Max input length is ${numInputsToPoseidonFunc.length}`,
    );
  }
  return numInputsToPoseidonFunc[inputs.length - 1](inputs);
}
