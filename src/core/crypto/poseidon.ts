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
 * Hashes a string to a field element via poseidon
 *
 * @returns bigint result of the hash
 */
export function hashStrToField(str: string, maxSizeBytes: number): bigint {
  const textEncoder = new TextEncoder();
  const strBytes = textEncoder.encode(str);
  return hashBytesWithLen(strBytes, maxSizeBytes);
}

function hashBytesWithLen(bytes: Uint8Array, maxSizeBytes: number): bigint {
  if (bytes.length > maxSizeBytes) {
    throw new Error(`Inputted bytes of length ${bytes} is longer than ${maxSizeBytes}`);
  }
  const packed = padAndPackBytesWithLen(bytes, maxSizeBytes);
  return poseidonHash(packed);
}

function padAndPackBytesNoLen(bytes: Uint8Array, maxSizeBytes: number): bigint[] {
  if (bytes.length > maxSizeBytes) {
    throw new Error(`Input bytes of length ${bytes} is longer than ${maxSizeBytes}`);
  }
  const paddedStrBytes = padUint8ArrayWithZeros(bytes, maxSizeBytes);
  return packBytes(paddedStrBytes);
}

export function padAndPackBytesWithLen(bytes: Uint8Array, maxSizeBytes: number): bigint[] {
  if (bytes.length > maxSizeBytes) {
    throw new Error(`Input bytes of length ${bytes} is longer than ${maxSizeBytes}`);
  }
  return padAndPackBytesNoLen(bytes, maxSizeBytes).concat([BigInt(bytes.length)]);
}

function packBytes(bytes: Uint8Array): bigint[] {
  if (bytes.length > MAX_NUM_INPUT_BYTES) {
    throw new Error(`Can't pack more than ${MAX_NUM_INPUT_BYTES}.  Was given ${bytes.length} bytes`);
  }
  return chunkUint8Array(bytes, BYTES_PACKED_PER_SCALAR).map((chunk) => bytesToBigIntLE(chunk));
}

function chunkUint8Array(array: Uint8Array, chunkSize: number): Uint8Array[] {
  const result: Uint8Array[] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.subarray(i, i + chunkSize));
  }
  return result;
}

export function bytesToBigIntLE(bytes: Uint8Array): bigint {
  let result = BigInt(0);
  for (let i = bytes.length - 1; i >= 0; i -= 1) {
    result = (result << BigInt(8)) | BigInt(bytes[i]);
  }
  return result;
}

export function bigIntToBytesLE(value: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = Number(value & BigInt(0xff));
    // eslint-disable-next-line no-param-reassign
    value >>= BigInt(8);
  }
  return bytes;
}

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
 * Hashes up to 16 scalar elements via the poseidon hashing algorithm.
 *
 * Each element must be scalar fields of the BN254 elliptic curve group.
 *
 * @returns bigint result of the hash
 */
export function poseidonHash(inputs: (number | bigint | string)[]): bigint {
  if (inputs.length > numInputsToPoseidonFunc.length) {
    throw new Error(
      `Unable to hash input of length ${inputs.length}.  Max input length is ${numInputsToPoseidonFunc.length}`,
    );
  }
  return numInputsToPoseidonFunc[inputs.length - 1](inputs);
}
