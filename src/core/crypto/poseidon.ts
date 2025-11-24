const BYTES_PACKED_PER_SCALAR = 31;
const MAX_NUM_INPUT_SCALARS = 16;
const MAX_NUM_INPUT_BYTES = (MAX_NUM_INPUT_SCALARS - 1) * BYTES_PACKED_PER_SCALAR;

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
export function padAndPackBytesNoLen(bytes: Uint8Array, maxSizeBytes: number): bigint[] {
  if (bytes.length > maxSizeBytes) {
    throw new Error(`Input bytes of length ${bytes} is longer than ${maxSizeBytes}`);
  }
  const paddedStrBytes = padUint8ArrayWithZeros(bytes, maxSizeBytes);
  return packBytes(paddedStrBytes);
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