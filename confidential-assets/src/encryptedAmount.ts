import { TwistedElGamal, TwistedElGamalCiphertext } from "./twistedElGamal";
import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "./twistedEd25519";
import { ed25519GenRandom } from "./utils";
import { ChunkedAmount } from "./chunkedAmount";
import { concatBytes } from "@noble/hashes/utils";

export class EncryptedAmount {
  // private amount: bigint;

  // private amountChunks: bigint[];

  readonly publicKey: TwistedEd25519PublicKey;

  chunkedAmount: ChunkedAmount;

  /**
   * The randomness used to encrypt the amount. This may not be set d. This is maintained
   * for debugging purposes.
   */
  private randomness?: bigint[];

  /**
   * The ciphertext of the encrypted amount.
   */
  private cipherText: TwistedElGamalCiphertext[];

  constructor(args: {
    chunkedAmount: ChunkedAmount;
    publicKey: TwistedEd25519PublicKey;
    randomness?: bigint[];
    cipherText?: TwistedElGamalCiphertext[];
  }) {
    const { chunkedAmount, cipherText, publicKey, randomness } = args;
    this.chunkedAmount = chunkedAmount;
    this.publicKey = publicKey;
    this.randomness = randomness;

    if (cipherText) {
      this.cipherText = cipherText;
    } else {
      this.randomness =
        randomness ??
        Array(this.getAmountChunks().length)
          .fill(0)
          .map(() => ed25519GenRandom());
      this.cipherText = this.getAmountChunks().map((chunk, i) =>
        TwistedElGamal.encryptWithPK(chunk, publicKey, randomness?.[i]),
      );
    }
  }

  getAmount(): bigint {
    return this.chunkedAmount.amount;
  }

  getCipherText(): TwistedElGamalCiphertext[] {
    return this.cipherText;
  }

  getCipherTextBytes(): Uint8Array {
    return concatBytes(...this.cipherText.map((el) => el.serialize()).flat());
  }

  getCipherTextDPointBytes(): Uint8Array {
    return concatBytes(...this.cipherText.map((el) => el.D.toRawBytes()).flat());
  }

  getRandomness(): bigint[] | undefined {
    return this.randomness;
  }

  getAmountChunks(): bigint[] {
    return this.chunkedAmount.amountChunks;
  }

  getChunkCount(): number {
    return this.chunkedAmount.chunksCount;
  }

  getChunkBits(): number {
    return this.chunkedAmount.chunkBits;
  }

  static fromAmountAndPublicKey(args: {
    amount: bigint;
    publicKey: TwistedEd25519PublicKey;
    randomness?: bigint[];
    opts?: {
      chunksCount?: number;
      chunkBits?: number;
    };
  }): EncryptedAmount {
    const { amount, publicKey, randomness, opts } = args;
    const chunkedAmount = ChunkedAmount.fromAmount(amount, opts);
    return new EncryptedAmount({ chunkedAmount, publicKey, randomness, ...opts });
  }

  static decryptBalanceFn: (
    encrypted: TwistedElGamalCiphertext[],
    privateKey: TwistedEd25519PrivateKey,
  ) => Promise<bigint[]>;

  static setDecryptBalanceFn(fn: typeof EncryptedAmount.decryptBalanceFn) {
    EncryptedAmount.decryptBalanceFn = fn;
  }

  static async fromCipherTextAndPrivateKey(
    cipherText: TwistedElGamalCiphertext[],
    privateKey: TwistedEd25519PrivateKey,
    opts?: {
      chunksCount?: number;
      chunkBits?: number;
    },
  ) {
    const chunksCount = opts?.chunksCount || cipherText.length;
    const chunkBits = opts?.chunkBits || ChunkedAmount.CHUNK_BITS;

    const decryptedAmountChunks: bigint[] = EncryptedAmount.decryptBalanceFn
      ? await EncryptedAmount.decryptBalanceFn(cipherText, privateKey)
      : await Promise.all(cipherText.map((el) => TwistedElGamal.decryptWithPK(el, privateKey)));

    const chunkedAmount = new ChunkedAmount({
      amountChunks: decryptedAmountChunks,
      chunksCount,
      chunkBits,
    });

    return new EncryptedAmount({
      chunkedAmount,
      cipherText,
      publicKey: privateKey.publicKey(),
    });
  }
}
