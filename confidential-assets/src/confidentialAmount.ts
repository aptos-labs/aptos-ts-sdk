import { TwistedElGamal, TwistedElGamalCiphertext } from "./twistedElGamal";
import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "./twistedEd25519";
import { AnyNumber } from "@aptos-labs/ts-sdk";

/**
 * Number of chunks for confidential balance
 */
const CHUNKS_COUNT = 8;

/**
 * Max bits of amount in a chunk for normalized confidential balance
 */
const CHUNK_BITS = 16;

export class ConfidentialAmount {
  amount: bigint;

  amountChunks: bigint[];

  chunksCount = CHUNKS_COUNT;

  chunkBits = CHUNK_BITS;

  /** We keep this just as an optimization. */
  private amountEncrypted?: TwistedElGamalCiphertext[];

  static CHUNKS_COUNT = CHUNKS_COUNT;

  static CHUNK_BITS = CHUNK_BITS;

  static CHUNK_BITS_BI = BigInt(ConfidentialAmount.CHUNK_BITS);

  constructor(args: {
    amount: AnyNumber;
    amountChunks: bigint[];
    encryptedAmount?: TwistedElGamalCiphertext[];
    chunksCount?: number;
    chunkBits?: number;
  }) {
    this.amount = BigInt(args.amount);
    this.amountChunks = args.amountChunks;

    if (args.encryptedAmount) {
      this.amountEncrypted = args.encryptedAmount;
    }

    if (args.chunksCount) {
      this.chunksCount = args.chunksCount;
    }

    if (args.chunkBits) {
      this.chunkBits = args.chunkBits;
    }
  }

  /**
   * Returns the original amount from the provided chunks,
   * where each chunk is represented as a 32 bit number
   *
   * amount = a0 + a1 * (2 ** 32) + a2 * (2 ** 64) ... a_i * (2 ** 32 * i)
   */
  static chunksToAmount(chunks: bigint[], chunkBits = ConfidentialAmount.CHUNK_BITS): bigint {
    const chunkBitsBi = BigInt(chunkBits);

    return chunks.reduce((acc, chunk, i) => acc + chunk * 2n ** (chunkBitsBi * BigInt(i)), 0n);
  }

  /**
   * Splits a given bigint amount into an array of smaller "chunk" values (also as bigints).
   *
   * @param amount - The original amount as a bigint.
   * @param chunksCount - The number of chunks to split the amount into (default is ConfidentialAmount.CHUNKS_COUNT).
   * @param chunkBits - The number of bits each chunk should contain (default is ConfidentialAmount.CHUNK_BITS).
   * @returns An array of bigints, where each element represents a segment of the original amount.
   */
  static amountToChunks(
    amount: AnyNumber,
    chunksCount = ConfidentialAmount.CHUNKS_COUNT,
    chunkBits = ConfidentialAmount.CHUNK_BITS,
  ): bigint[] {
    // Initialize an empty array that will hold the chunked values.
    const chunks: bigint[] = [];

    // Convert chunkBits to a bigint so it can be used in bitwise operations with `amount`.
    const chunkBitsBi = BigInt(chunkBits);

    // Loop over the total number of chunks we want.
    for (let i = 0; i < chunksCount; i++) {
      /**
       * 1. Shift the amount right by (chunkBitsBi * i) bits to move the desired chunk
       *    into the lowest bits of the number.
       *
       * 2. Use a bitmask ( (1n << chunkBitsBi) - 1n ) to extract only those `chunkBits`
       *    bits. This mask is effectively a number with `chunkBits` 1s in binary.
       */
      const chunk = (BigInt(amount) >> (chunkBitsBi * BigInt(i))) & ((1n << chunkBitsBi) - 1n);

      // Add this extracted chunk to the chunks array.
      chunks.push(chunk);
    }

    // Return the array of chunked values.
    return chunks;
  }

  static fromAmount(
    amount: AnyNumber,
    opts?: {
      chunksCount?: number;
      chunkBits?: number;
    },
  ): ConfidentialAmount {
    const amountChunks = ConfidentialAmount.amountToChunks(amount, opts?.chunksCount, opts?.chunkBits);
    return new ConfidentialAmount({ amount, amountChunks, ...opts });
  }

  static fromChunks(chunks: bigint[]): ConfidentialAmount {
    const amount = ConfidentialAmount.chunksToAmount(chunks);

    return new ConfidentialAmount({ amount, amountChunks: chunks });
  }

  static decryptBalanceFn: (
    encrypted: TwistedElGamalCiphertext[],
    privateKey: TwistedEd25519PrivateKey,
  ) => Promise<bigint[]>;

  static setDecryptBalanceFn(fn: typeof ConfidentialAmount.decryptBalanceFn) {
    ConfidentialAmount.decryptBalanceFn = fn;
  }

  static async fromEncrypted(
    encrypted: TwistedElGamalCiphertext[],
    privateKey: TwistedEd25519PrivateKey,
    opts?: {
      chunksCount?: number;
      chunkBits?: number;
    },
  ) {
    const chunksCount = opts?.chunksCount || encrypted.length;
    const chunkBits = opts?.chunkBits || ConfidentialAmount.CHUNK_BITS;

    const decryptedAmountChunks: bigint[] = ConfidentialAmount.decryptBalanceFn
      ? await ConfidentialAmount.decryptBalanceFn(encrypted, privateKey)
      : await Promise.all(encrypted.map((el) => TwistedElGamal.decryptWithPK(el, privateKey)));

    const amount = ConfidentialAmount.chunksToAmount(decryptedAmountChunks, chunkBits);

    return new ConfidentialAmount({
      amount,
      amountChunks: decryptedAmountChunks,
      encryptedAmount: encrypted,
      chunksCount,
      chunkBits,
    });
  }

  private encrypt(publicKey: TwistedEd25519PublicKey, randomness?: bigint[]): TwistedElGamalCiphertext[] {
    this.amountEncrypted = this.amountChunks.map((chunk, i) =>
      TwistedElGamal.encryptWithPK(chunk, publicKey, randomness?.[i]),
    );

    return this.amountEncrypted;
  }

  public getAmountEncrypted(publicKey: TwistedEd25519PublicKey, randomness?: bigint[]): TwistedElGamalCiphertext[] {
    if (this.amountEncrypted === undefined) {
      return this.encrypt(publicKey, randomness);
    }
    return this.amountEncrypted;
  }
}
