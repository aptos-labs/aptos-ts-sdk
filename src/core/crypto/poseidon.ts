type PoseidonFunc = (inputs: (number | bigint | string)[]) => bigint;

let numInputsToPoseidonFunc: PoseidonFunc[] | undefined;
let loadPromise: Promise<void> | undefined;

/**
 * Dynamically loads the poseidon-lite module and caches the result.
 *
 * For most async APIs (e.g. `poseidonHash`, `hashStrToField`, `deriveKeylessAccount`,
 * `EphemeralKeyPair.generate`), this is called automatically on first use, so most users
 * do not need to call it directly.
 *
 * Explicit preloading is only required for synchronous entry points that depend on Poseidon
 * (e.g. `poseidonHashSync`, `hashStrToFieldSync`, `*.createSync`, constructors/deserialization),
 * or when you want to prefetch the poseidon-lite chunk ahead of time to avoid a lazy-load
 * latency spike.
 *
 * Bundlers (webpack, rollup, vite, esbuild) will automatically code-split the poseidon-lite
 * module into a separate chunk, keeping it out of the main bundle. This reduces the initial
 * bundle size by ~421KB (minified+gzipped) for applications that don't use Keyless accounts.
 *
 * @group Implementation
 * @category Serialization
 */
export function ensurePoseidonLoaded(): Promise<void> {
  if (numInputsToPoseidonFunc !== undefined) {
    return Promise.resolve();
  }
  if (loadPromise === undefined) {
    loadPromise = import("poseidon-lite")
      .then((mod) => {
        numInputsToPoseidonFunc = [
          mod.poseidon1,
          mod.poseidon2,
          mod.poseidon3,
          mod.poseidon4,
          mod.poseidon5,
          mod.poseidon6,
          mod.poseidon7,
          mod.poseidon8,
          mod.poseidon9,
          mod.poseidon10,
          mod.poseidon11,
          mod.poseidon12,
          mod.poseidon13,
          mod.poseidon14,
          mod.poseidon15,
          mod.poseidon16,
        ];
      })
      .catch((error) => {
        loadPromise = undefined;
        numInputsToPoseidonFunc = undefined;
        throw error;
      });
  }
  return loadPromise;
}

const BYTES_PACKED_PER_SCALAR = 31;
const MAX_NUM_INPUT_SCALARS = 16;
const MAX_NUM_INPUT_BYTES = (MAX_NUM_INPUT_SCALARS - 1) * BYTES_PACKED_PER_SCALAR;

/**
 * Hashes a string to a field element via Poseidon hashing.
 * Automatically loads poseidon-lite on first call.
 *
 * @param str - The string to be hashed.
 * @param maxSizeBytes - The maximum size in bytes for the resulting hash.
 * @returns Promise<bigint> - The result of the hash.
 * @group Implementation
 * @category Serialization
 */
export async function hashStrToField(str: string, maxSizeBytes: number): Promise<bigint> {
  const textEncoder = new TextEncoder();
  const strBytes = textEncoder.encode(str);
  if (strBytes.length > maxSizeBytes) {
    throw new Error(`Inputted bytes of length ${strBytes.length} is longer than ${maxSizeBytes}`);
  }
  const packed = padAndPackBytesWithLen(strBytes, maxSizeBytes);
  return poseidonHash(packed);
}

/**
 * Synchronous version of `hashStrToField` for use in contexts that cannot be async
 * (e.g. constructors, deserialization). Requires that poseidon-lite has been loaded first.
 *
 * @param str - The string to be hashed.
 * @param maxSizeBytes - The maximum size in bytes for the resulting hash.
 * @returns bigint - The result of the hash.
 * @group Implementation
 * @category Serialization
 */
export function hashStrToFieldSync(str: string, maxSizeBytes: number): bigint {
  const textEncoder = new TextEncoder();
  const strBytes = textEncoder.encode(str);
  if (strBytes.length > maxSizeBytes) {
    throw new Error(`Inputted bytes of length ${strBytes.length} is longer than ${maxSizeBytes}`);
  }
  const packed = padAndPackBytesWithLen(strBytes, maxSizeBytes);
  return poseidonHashSync(packed);
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
    throw new Error(`Input bytes of length ${bytes.length} is longer than ${maxSizeBytes}`);
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
    throw new Error(`Input bytes of length ${bytes.length} is longer than ${maxSizeBytes}`);
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

  const paddedArray = new Uint8Array(paddedSize);
  paddedArray.set(inputArray);

  for (let i = inputArray.length; i < paddedSize; i += 1) {
    paddedArray[i] = 0;
  }

  return paddedArray;
}

/**
 * Hashes up to 16 scalar elements via the Poseidon hashing algorithm.
 * Each element must be scalar fields of the BN254 elliptic curve group.
 *
 * Automatically loads poseidon-lite on first call. Bundlers will code-split this
 * into a separate chunk (~421KB), so it's only fetched when Keyless features are used.
 *
 * @param inputs - An array of elements to be hashed, which can be of type number, bigint, or string.
 * @returns Promise<bigint> - The result of the hash.
 * @throws Error - Throws an error if the input length exceeds the maximum allowed.
 * @group Implementation
 * @category Serialization
 */
export async function poseidonHash(inputs: (number | bigint | string)[]): Promise<bigint> {
  await ensurePoseidonLoaded();
  return poseidonHashSync(inputs);
}

/**
 * Synchronous version of `poseidonHash` for use in contexts that cannot be async
 * (e.g. constructors, deserialization). Requires that `ensurePoseidonLoaded()` or any
 * async poseidon function has been called first.
 *
 * @param inputs - An array of elements to be hashed, which can be of type number, bigint, or string.
 * @returns bigint - The result of the hash.
 * @throws Error - Throws an error if poseidon-lite has not been loaded or the input length exceeds the maximum allowed.
 * @group Implementation
 * @category Serialization
 */
export function poseidonHashSync(inputs: (number | bigint | string)[]): bigint {
  if (numInputsToPoseidonFunc === undefined) {
    throw new Error(
      "poseidon-lite has not been loaded yet. Call `await ensurePoseidonLoaded()` before using Keyless features, " +
        "or use the SDK's async entry points (e.g. deriveKeylessAccount, EphemeralKeyPair.generate) which handle this automatically.",
    );
  }
  if (inputs.length > numInputsToPoseidonFunc.length) {
    throw new Error(
      `Unable to hash input of length ${inputs.length}.  Max input length is ${numInputsToPoseidonFunc.length}`,
    );
  }
  return numInputsToPoseidonFunc[inputs.length - 1](inputs);
}
