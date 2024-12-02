import { TwistedElGamal, TwistedElGamalCiphertext } from "../twistedElGamal";
import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";

// TODO: encrypt pending balance as (2)
export class VeiledAmount {
  amount: bigint;

  amountChunks: bigint[];

  chunksCount = VeiledAmount.CHUNKS_COUNT;

  chunkBits = VeiledAmount.CHUNK_BITS;

  encryptedAmount?: TwistedElGamalCiphertext[];

  static CHUNKS_COUNT = 4;

  static CHUNK_BITS = 32;

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
      this.encryptedAmount = args.encryptedAmount;
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
    const chunkBitsBI = BigInt(chunkBits);

    const chunksCountBI = BigInt(chunksCount);
    if (amount > 2n ** (chunksCountBI * chunkBitsBI) - 1n) {
      throw new Error(`Amount must be less than 2n**${chunkBitsBI * chunksCountBI}`);
    }

    const chunks = [];
    let a = amount;
    for (let i = chunksCount - 1; i >= 0; i -= 1) {
      if (i === 0) {
        chunks[i] = a;
      } else {
        const bits = 2n ** (chunkBitsBI * BigInt(i));
        const aMod = a % bits;
        const chunk = a === aMod ? 0n : (a - aMod) / bits;
        chunks[i] = chunk;
        a = aMod;
      }
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

  static async fromEncrypted(
    encrypted: TwistedElGamalCiphertext[],
    privateKey: TwistedEd25519PrivateKey,
    opts?: {
      chunksCount?: number;
      chunkBits?: number;
    },
  ) {
    const decryptedAmountChunks = await Promise.all(
      encrypted.map((el) =>
        TwistedElGamal.decryptWithPK(el, privateKey, {
          // FIXME: mocked, should be removed, once algo is ready
          start: 0n,
          end: 1000n,
        }),
      ),
    );

    const amount = VeiledAmount.chunksToAmount(decryptedAmountChunks, opts?.chunkBits);

    return new VeiledAmount({ amount, amountChunks: decryptedAmountChunks, encryptedAmount: encrypted, ...opts });
  }

  encryptBalance(publicKey: TwistedEd25519PublicKey, randomness?: bigint[]): TwistedElGamalCiphertext[] {
    this.encryptedAmount = this.amountChunks.map((chunk, i) =>
      TwistedElGamal.encryptWithPK(chunk, publicKey, randomness?.[i]),
    );

    return this.encryptedAmount;
  }
}
