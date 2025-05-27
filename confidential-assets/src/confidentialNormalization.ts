import { RistrettoPoint } from "@noble/curves/ed25519";
import { utf8ToBytes } from "@noble/hashes/utils";
import { bytesToNumberLE, concatBytes, numberToBytesLE } from "@noble/curves/abstract/utils";
import { PROOF_CHUNK_SIZE, SIGMA_PROOF_NORMALIZATION_SIZE } from "./consts";
import { genFiatShamirChallenge, publicKeyToU8 } from "./helpers";
import { RangeProofExecutor } from "./rangeProof";
import { TwistedEd25519PrivateKey, H_RISTRETTO, TwistedEd25519PublicKey } from "./twistedEd25519";
import { TwistedElGamalCiphertext } from "./twistedElGamal";
import { ed25519GenListOfRandom, ed25519GenRandom, ed25519modN, ed25519InvertN } from "./utils";
import { EncryptedAmount } from "./encryptedAmount";
import { ChunkedAmount } from "./chunkedAmount";

export type ConfidentialNormalizationSigmaProof = {
  alpha1List: Uint8Array[];
  alpha2: Uint8Array;
  alpha3: Uint8Array;
  alpha4List: Uint8Array[];
  X1: Uint8Array;
  X2: Uint8Array;
  X3List: Uint8Array[];
  X4List: Uint8Array[];
};

export type CreateConfidentialNormalizationOpArgs = {
  decryptionKey: TwistedEd25519PrivateKey;
  unnormalizedAvailableBalanceCipherText: TwistedElGamalCiphertext[];
  randomness?: bigint[];
};

export class ConfidentialNormalization {
  decryptionKey: TwistedEd25519PrivateKey;

  unnormalizedEncryptedAvailableBalance: EncryptedAmount;

  normalizedEncryptedAvailableBalance: EncryptedAmount;

  randomness: bigint[];

  constructor(args: {
    decryptionKey: TwistedEd25519PrivateKey;
    unnormalizedEncryptedAvailableBalance: EncryptedAmount;
    normalizedEncryptedAvailableBalance: EncryptedAmount;
  }) {
    this.decryptionKey = args.decryptionKey;
    this.unnormalizedEncryptedAvailableBalance = args.unnormalizedEncryptedAvailableBalance;
    this.normalizedEncryptedAvailableBalance = args.normalizedEncryptedAvailableBalance;
    const randomness = this.normalizedEncryptedAvailableBalance.getRandomness();
    if (!randomness) {
      throw new Error("Randomness is not set");
    }
    this.randomness = randomness;
  }

  static async create(args: CreateConfidentialNormalizationOpArgs) {
    const { decryptionKey, randomness = ed25519GenListOfRandom(ChunkedAmount.CHUNKS_COUNT) } = args;

    const unnormalizedEncryptedAvailableBalance = await EncryptedAmount.fromCipherTextAndPrivateKey(
      args.unnormalizedAvailableBalanceCipherText,
      decryptionKey,
    );

    const normalizedEncryptedAvailableBalance = EncryptedAmount.fromAmountAndPublicKey({
      amount: unnormalizedEncryptedAvailableBalance.getAmount(),
      publicKey: decryptionKey.publicKey(),
      randomness,
    });
    return new ConfidentialNormalization({
      decryptionKey,
      unnormalizedEncryptedAvailableBalance,
      normalizedEncryptedAvailableBalance,
    });
  }

  static FIAT_SHAMIR_SIGMA_DST = "AptosConfidentialAsset/NormalizationProofFiatShamir";

  static serializeSigmaProof(sigmaProof: ConfidentialNormalizationSigmaProof): Uint8Array {
    return concatBytes(
      ...sigmaProof.alpha1List,
      sigmaProof.alpha2,
      sigmaProof.alpha3,
      ...sigmaProof.alpha4List,
      sigmaProof.X1,
      sigmaProof.X2,
      ...sigmaProof.X3List,
      ...sigmaProof.X4List,
    );
  }

  static deserializeSigmaProof(sigmaProof: Uint8Array): ConfidentialNormalizationSigmaProof {
    if (sigmaProof.length !== SIGMA_PROOF_NORMALIZATION_SIZE) {
      throw new Error(
        `Invalid sigma proof length of confidential normalization: got ${sigmaProof.length}, expected ${SIGMA_PROOF_NORMALIZATION_SIZE}`,
      );
    }

    const proofArr: Uint8Array[] = [];
    for (let i = 0; i < SIGMA_PROOF_NORMALIZATION_SIZE; i += PROOF_CHUNK_SIZE) {
      proofArr.push(sigmaProof.subarray(i, i + PROOF_CHUNK_SIZE));
    }

    const alpha1List = proofArr.slice(0, 3);
    const alpha2 = proofArr[3];
    const alpha3 = proofArr[4];
    const alpha4List = proofArr.slice(5, 5 + ChunkedAmount.CHUNKS_COUNT);
    const X1 = proofArr[5 + 2 * ChunkedAmount.CHUNKS_COUNT];
    const X2 = proofArr[5 + 2 * ChunkedAmount.CHUNKS_COUNT + 1];
    const X3List = proofArr.slice(5 + 2 * ChunkedAmount.CHUNKS_COUNT + 2, 5 + 3 * ChunkedAmount.CHUNKS_COUNT + 2);
    const X4List = proofArr.slice(5 + 3 * ChunkedAmount.CHUNKS_COUNT + 2, 5 + 4 * ChunkedAmount.CHUNKS_COUNT + 2);

    return {
      alpha1List,
      alpha2,
      alpha3,
      alpha4List,
      X1,
      X2,
      X3List,
      X4List,
    };
  }

  async genSigmaProof(): Promise<ConfidentialNormalizationSigmaProof> {
    if (this.randomness && this.randomness.length !== ChunkedAmount.CHUNKS_COUNT) {
      throw new Error("Invalid length list of randomness");
    }

    const x1List = ed25519GenListOfRandom(ChunkedAmount.CHUNKS_COUNT);
    const x2 = ed25519GenRandom();
    const x3 = ed25519GenRandom();

    const x4List = ed25519GenListOfRandom(ChunkedAmount.CHUNKS_COUNT);

    const X1 = RistrettoPoint.BASE.multiply(
      ed25519modN(
        x1List.reduce((acc, el, i) => {
          const coef = 2n ** (BigInt(i) * ChunkedAmount.CHUNK_BITS_BIG_INT);
          const x1i = el * coef;

          return acc + x1i;
        }, 0n),
      ),
    ).add(
      this.unnormalizedEncryptedAvailableBalance
        .getCipherText()
        .reduce(
          (acc, ciphertext, i) => acc.add(ciphertext.D.multiply(2n ** (BigInt(i) * ChunkedAmount.CHUNK_BITS_BIG_INT))),
          RistrettoPoint.ZERO,
        )
        .multiply(x2),
    );
    const X2 = H_RISTRETTO.multiply(x3);
    const X3List = x1List.map((el, index) => {
      const x1iG = RistrettoPoint.BASE.multiply(el);

      const x4iH = H_RISTRETTO.multiply(x4List[index]);

      return x1iG.add(x4iH);
    });
    const X4List = x4List.map((el) =>
      RistrettoPoint.fromHex(this.decryptionKey.publicKey().toUint8Array()).multiply(el),
    );

    const p = genFiatShamirChallenge(
      utf8ToBytes(ConfidentialNormalization.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      this.decryptionKey.publicKey().toUint8Array(),
      ...this.unnormalizedEncryptedAvailableBalance
        .getCipherText()
        .map((el) => el.serialize())
        .flat(),
      ...this.normalizedEncryptedAvailableBalance
        .getCipherText()
        .map((el) => el.serialize())
        .flat(),
      X1.toRawBytes(),
      X2.toRawBytes(),
      ...X3List.map((X3) => X3.toRawBytes()),
      ...X4List.map((X4) => X4.toRawBytes()),
    );

    const sLE = bytesToNumberLE(this.decryptionKey.toUint8Array());
    const invertSLE = ed25519InvertN(sLE);

    const ps = ed25519modN(p * sLE);
    const psInvert = ed25519modN(p * invertSLE);

    const alpha1List = x1List.map((x1, i) => {
      const pChunk = ed25519modN(p * this.normalizedEncryptedAvailableBalance.getAmountChunks()[i]);

      return ed25519modN(x1 - pChunk);
    });
    const alpha2 = ed25519modN(x2 - ps);
    const alpha3 = ed25519modN(x3 - psInvert);
    const alpha4List = x4List.map((el, i) => {
      const pri = ed25519modN(p * this.randomness[i]);

      return ed25519modN(el - pri);
    });

    return {
      alpha1List: alpha1List.map((alpha1) => numberToBytesLE(alpha1, 32)),
      alpha2: numberToBytesLE(alpha2, 32),
      alpha3: numberToBytesLE(alpha3, 32),
      alpha4List: alpha4List.map((alpha4) => numberToBytesLE(alpha4, 32)),
      X1: X1.toRawBytes(),
      X2: X2.toRawBytes(),
      X3List: X3List.map((X3) => X3.toRawBytes()),
      X4List: X4List.map((X4) => X4.toRawBytes()),
    };
  }

  static verifySigmaProof(opts: {
    publicKey: TwistedEd25519PublicKey;
    sigmaProof: ConfidentialNormalizationSigmaProof;
    unnormalizedEncryptedBalance: EncryptedAmount;
    normalizedEncryptedBalance: EncryptedAmount;
  }): boolean {
    const publicKeyU8 = publicKeyToU8(opts.publicKey);

    const alpha1LEList = opts.sigmaProof.alpha1List.map((a) => bytesToNumberLE(a));
    const alpha2LE = bytesToNumberLE(opts.sigmaProof.alpha2);
    const alpha3LE = bytesToNumberLE(opts.sigmaProof.alpha3);
    const alpha4LEList = opts.sigmaProof.alpha4List.map((a) => bytesToNumberLE(a));

    const p = genFiatShamirChallenge(
      utf8ToBytes(ConfidentialNormalization.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      publicKeyU8,
      ...opts.unnormalizedEncryptedBalance
        .getCipherText()
        .map((el) => el.serialize())
        .flat(),
      ...opts.normalizedEncryptedBalance
        .getCipherText()
        .map((el) => el.serialize())
        .flat(),
      opts.sigmaProof.X1,
      opts.sigmaProof.X2,
      ...opts.sigmaProof.X3List,
      ...opts.sigmaProof.X4List,
    );
    const alpha2D = opts.unnormalizedEncryptedBalance
      .getCipherText()
      .reduce(
        (acc, { D }, i) => acc.add(D.multiply(2n ** (BigInt(i) * ChunkedAmount.CHUNK_BITS_BIG_INT))),
        RistrettoPoint.ZERO,
      )
      .multiply(alpha2LE);
    const pBalOld = opts.unnormalizedEncryptedBalance
      .getCipherText()
      .reduce((acc, ciphertext, i) => {
        const chunk = ciphertext.C.multiply(2n ** (BigInt(i) * ChunkedAmount.CHUNK_BITS_BIG_INT));
        return acc.add(chunk);
      }, RistrettoPoint.ZERO)
      .multiply(p);

    const alpha3H = H_RISTRETTO.multiply(alpha3LE);
    const pP = RistrettoPoint.fromHex(publicKeyU8).multiply(p);

    const X1 = RistrettoPoint.BASE.multiply(
      ed25519modN(
        alpha1LEList.reduce((acc, el, i) => {
          const coef = 2n ** (BigInt(i) * ChunkedAmount.CHUNK_BITS_BIG_INT);
          const alpha1i = el * coef;
          return acc + alpha1i;
        }, 0n),
      ),
    )
      .add(alpha2D)
      .add(pBalOld);
    const X2 = alpha3H.add(pP);
    const X3List = alpha1LEList.map((el, i) => {
      const a1iG = RistrettoPoint.BASE.multiply(el);
      const a4iH = H_RISTRETTO.multiply(alpha4LEList[i]);
      const pC = opts.normalizedEncryptedBalance.getCipherText()[i].C.multiply(p);
      return a1iG.add(a4iH).add(pC);
    });
    const X4List = alpha4LEList.map((el, i) => {
      const a4iP = RistrettoPoint.fromHex(publicKeyU8).multiply(el);
      const pDnew = opts.normalizedEncryptedBalance.getCipherText()[i].D.multiply(p);

      return a4iP.add(pDnew);
    });

    return (
      X1.equals(RistrettoPoint.fromHex(opts.sigmaProof.X1)) &&
      X2.equals(RistrettoPoint.fromHex(opts.sigmaProof.X2)) &&
      X3List.every((X3, i) => X3.equals(RistrettoPoint.fromHex(opts.sigmaProof.X3List[i]))) &&
      X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(opts.sigmaProof.X4List[i])))
    );
  }

  async genRangeProof(): Promise<Uint8Array> {
    const rangeProof = await RangeProofExecutor.genBatchRangeZKP({
      v: this.normalizedEncryptedAvailableBalance.getAmountChunks(),
      rs: this.randomness.map((el) => numberToBytesLE(el, 32)),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: ChunkedAmount.CHUNK_BITS,
    });

    return rangeProof.proof;
  }

  static async verifyRangeProof(opts: {
    rangeProof: Uint8Array;
    normalizedEncryptedBalance: EncryptedAmount;
  }): Promise<boolean> {
    return RangeProofExecutor.verifyBatchRangeZKP({
      proof: opts.rangeProof,
      comm: opts.normalizedEncryptedBalance.getCipherText().map((el) => el.C.toRawBytes()),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: ChunkedAmount.CHUNK_BITS,
    });
  }

  async authorizeNormalization(): Promise<
    [{ sigmaProof: ConfidentialNormalizationSigmaProof; rangeProof: Uint8Array }, TwistedElGamalCiphertext[]]
  > {
    const sigmaProof = await this.genSigmaProof();
    const rangeProof = await this.genRangeProof();

    return [{ sigmaProof, rangeProof }, this.normalizedEncryptedAvailableBalance.getCipherText()];
  }
}
