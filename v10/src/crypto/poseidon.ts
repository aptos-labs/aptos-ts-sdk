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
 * Hashes a UTF-8 string to a finite-field element using Poseidon, padding it
 * to `maxSizeBytes` before hashing.
 *
 * The string is encoded as UTF-8 bytes, padded with zeros to `maxSizeBytes`,
 * packed into 31-byte scalars, and then Poseidon-hashed together with the
 * original byte length.
 *
 * @param str - The string to hash.
 * @param maxSizeBytes - The maximum allowed (and padded-to) byte length of the
 *   string.
 * @returns The Poseidon hash as a `bigint` field element.
 * @throws If the UTF-8 encoding of `str` exceeds `maxSizeBytes`.
 *
 * @example
 * ```ts
 * const fieldElement = hashStrToField("user@example.com", MAX_UID_VAL_BYTES);
 * ```
 */
const TEXT_ENCODER = new TextEncoder();

export function hashStrToField(str: string, maxSizeBytes: number): bigint {
  const strBytes = TEXT_ENCODER.encode(str);
  return hashBytesWithLen(strBytes, maxSizeBytes);
}

function hashBytesWithLen(bytes: Uint8Array, maxSizeBytes: number): bigint {
  if (bytes.length > maxSizeBytes) {
    throw new Error(`Inputted bytes of length ${bytes.length} is longer than ${maxSizeBytes}`);
  }
  const packed = padAndPackBytesWithLen(bytes, maxSizeBytes);
  return poseidonHash(packed);
}

function padAndPackBytesNoLen(bytes: Uint8Array, maxSizeBytes: number): bigint[] {
  if (bytes.length > maxSizeBytes) {
    throw new Error(`Input bytes of length ${bytes.length} is longer than ${maxSizeBytes}`);
  }
  const paddedStrBytes = padUint8ArrayWithZeros(bytes, maxSizeBytes);
  return packBytes(paddedStrBytes);
}

/**
 * Pads `bytes` with zeros to `maxSizeBytes`, packs them into 31-byte little-
 * endian scalars, and appends the original byte length as an additional scalar.
 *
 * @param bytes - The byte array to pad and pack.
 * @param maxSizeBytes - The size to pad to (and the maximum permitted length).
 * @returns An array of `bigint` scalars suitable for {@link poseidonHash}.
 * @throws If `bytes.length` exceeds `maxSizeBytes`.
 */
export function padAndPackBytesWithLen(bytes: Uint8Array, maxSizeBytes: number): bigint[] {
  if (bytes.length > maxSizeBytes) {
    throw new Error(`Input bytes of length ${bytes.length} is longer than ${maxSizeBytes}`);
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

/**
 * Interprets a `Uint8Array` as a little-endian unsigned integer and returns it
 * as a `bigint`.
 *
 * @param bytes - The byte array to convert.
 * @returns The little-endian `bigint` value.
 *
 * @example
 * ```ts
 * bytesToBigIntLE(new Uint8Array([1, 0])); // 1n
 * bytesToBigIntLE(new Uint8Array([0, 1])); // 256n
 * ```
 */
const BIGINT_0 = BigInt(0);
const BIGINT_8 = BigInt(8);
const BIGINT_0xFF = BigInt(0xff);

export function bytesToBigIntLE(bytes: Uint8Array): bigint {
  let result = BIGINT_0;
  for (let i = bytes.length - 1; i >= 0; i -= 1) {
    result = (result << BIGINT_8) | BigInt(bytes[i]);
  }
  return result;
}

/**
 * Encodes a `bigint` (or `number`) as a little-endian `Uint8Array` of exactly
 * `length` bytes.
 *
 * @param value - The integer value to encode.
 * @param length - The desired byte length of the output.
 * @returns A `Uint8Array` of `length` bytes in little-endian order.
 *
 * @example
 * ```ts
 * bigIntToBytesLE(256n, 4); // Uint8Array([0, 1, 0, 0])
 * ```
 */
export function bigIntToBytesLE(value: bigint | number, length: number): Uint8Array {
  let val = BigInt(value);
  if (val < 0n) {
    throw new Error(`bigIntToBytesLE does not support negative values, received ${val}`);
  }
  const maxVal = (1n << BigInt(length * 8)) - 1n;
  if (val > maxVal) {
    throw new Error(`Value ${val} does not fit in ${length} bytes (max ${maxVal})`);
  }
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = Number(val & BIGINT_0xFF);
    val >>= BIGINT_8;
  }
  return bytes;
}

function padUint8ArrayWithZeros(inputArray: Uint8Array, paddedSize: number): Uint8Array {
  if (paddedSize < inputArray.length) {
    throw new Error("Padded size must be greater than or equal to the input array size.");
  }
  const paddedArray = new Uint8Array(paddedSize);
  paddedArray.set(inputArray);
  return paddedArray;
}

/**
 * Computes the Poseidon hash of up to 16 field-element inputs.
 *
 * Selects the correct arity-specific Poseidon function from `poseidon-lite`
 * based on the number of inputs.
 *
 * @param inputs - An array of 1–16 numeric, `bigint`, or string field-element
 *   inputs.
 * @returns The Poseidon hash as a `bigint` field element.
 * @throws If `inputs` is empty or has more than 16 elements.
 *
 * @example
 * ```ts
 * poseidonHash([1n, 2n, 3n]); // bigint hash of three field elements
 * ```
 */
export function poseidonHash(inputs: (number | bigint | string)[]): bigint {
  if (inputs.length === 0) {
    throw new Error("Poseidon hash requires at least 1 input");
  }
  if (inputs.length > numInputsToPoseidonFunc.length) {
    throw new Error(
      `Unable to hash input of length ${inputs.length}.  Max input length is ${numInputsToPoseidonFunc.length}`,
    );
  }
  return numInputsToPoseidonFunc[inputs.length - 1](inputs);
}
