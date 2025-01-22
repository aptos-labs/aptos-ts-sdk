import { TwistedElGamal, TwistedElGamalCiphertext } from "../twistedElGamal";
import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";

/**
 * Number of chunks for veiled balance
 */
const CHUNKS_COUNT = 8;

/**
 * Max bits of amount in a chunk for normalized veiled balance
 */
const CHUNK_BITS = 16;

// TODO: encrypt pending balance as (CHUNKS_COUNT / 2)
export class VeiledAmount {
  amount: bigint;

  amountChunks: bigint[];

  chunksCount = CHUNKS_COUNT;

  chunkBits = CHUNK_BITS;

  amountEncrypted?: TwistedElGamalCiphertext[];

  static CHUNKS_COUNT = CHUNKS_COUNT;

  static CHUNK_BITS = CHUNK_BITS;

  static CHUNK_BITS_BI = BigInt(VeiledAmount.CHUNK_BITS);

  constructor(args: {
    amount: bigint;
    amountChunks: bigint[];
    encryptedAmount?: TwistedElGamalCiphertext[];
    chunksCount?: number;
    chunkBits?: number;
  }) {
    this.amount = args.amount;
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
  static chunksToAmount(chunks: bigint[], chunkBits = VeiledAmount.CHUNK_BITS): bigint {
    const chunkBitsBi = BigInt(chunkBits);

    return chunks.reduce((acc, chunk, i) => acc + chunk * 2n ** (chunkBitsBi * BigInt(i)), 0n);
  }

  /**
   * Returns a list of chunks of the given length from the amount, where each chunk is represented as a 32-bit number
   *
   * @example
   * const amount = 10n + 20n * (2n ** 32n) + 30n (2n ** 64n) + 40n * (2n ** 96n )
   * const chunkedAmount = amountToChunks(a, 4)
   * // an example of the returned data
   * ```
   * chunkedAmount = [10n, 20n, 30n, 40n]
   * ```
   */
  static amountToChunks(
    amount: bigint,
    chunksCount = VeiledAmount.CHUNKS_COUNT,
    chunkBits = VeiledAmount.CHUNK_BITS,
  ): bigint[] {
    const chunks: bigint[] = [];
    const chunkBitsBi = BigInt(chunkBits);

    for (let i = 0; i < chunksCount; i++) {
      chunks.push((amount >> (chunkBitsBi * BigInt(i))) & ((1n << chunkBitsBi) - 1n));
    }

    return chunks;
  }

  static fromAmount(
    amount: bigint,
    opts?: {
      chunksCount?: number;
      chunkBits?: number;
    },
  ): VeiledAmount {
    const amountChunks = VeiledAmount.amountToChunks(amount, opts?.chunksCount, opts?.chunkBits);

    return new VeiledAmount({ amount, amountChunks, ...opts });
  }

  static fromChunks(chunks: bigint[]): VeiledAmount {
    const amount = VeiledAmount.chunksToAmount(chunks);

    return new VeiledAmount({ amount, amountChunks: chunks });
  }

  static decryptBalanceFn: (
    encrypted: TwistedElGamalCiphertext[],
    privateKey: TwistedEd25519PrivateKey,
  ) => Promise<bigint[]>;

  static setDecryptBalanceFn(fn: typeof VeiledAmount.decryptBalanceFn) {
    VeiledAmount.decryptBalanceFn = fn;
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
    const chunkBits = opts?.chunkBits || encrypted[0].C.toRawBytes().length;

    const decryptedAmountChunks: bigint[] = VeiledAmount.decryptBalanceFn
      ? await VeiledAmount.decryptBalanceFn(encrypted, privateKey)
      : await Promise.all(encrypted.map((el) => TwistedElGamal.decryptWithPK(el, privateKey)));

    const amount = VeiledAmount.chunksToAmount(decryptedAmountChunks, chunkBits);

    return new VeiledAmount({
      amount,
      amountChunks: decryptedAmountChunks,
      encryptedAmount: encrypted,
      chunksCount,
      chunkBits,
    });
  }

  encrypt(publicKey: TwistedEd25519PublicKey, randomness?: bigint[]): TwistedElGamalCiphertext[] {
    this.amountEncrypted = this.amountChunks.map((chunk, i) =>
      TwistedElGamal.encryptWithPK(chunk, publicKey, randomness?.[i]),
    );

    return this.amountEncrypted;
  }
}
