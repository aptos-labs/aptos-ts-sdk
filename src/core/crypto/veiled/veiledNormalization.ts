import { RistrettoPoint } from "@noble/curves/ed25519";
import { utf8ToBytes } from "@noble/hashes/utils";
import { bytesToNumberLE, concatBytes, numberToBytesLE } from "@noble/curves/abstract/utils";
import { PROOF_CHUNK_SIZE, SIGMA_PROOF_NORMALIZATION_SIZE } from "./consts";
import { genFiatShamirChallenge, publicKeyToU8 } from "./helpers";
import { ed25519GenListOfRandom, ed25519GenRandom, ed25519InvertN, ed25519modN } from "../utils";
import { H_RISTRETTO, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";
import { TwistedElGamalCiphertext } from "../twistedElGamal";
import { RangeProofExecutor } from "../rangeProof";
import { VeiledAmount } from "./veiledAmount";

export type VeiledNormalizationSigmaProof = {
  alpha1: Uint8Array;
  alpha2: Uint8Array;
  alpha3: Uint8Array;
  alpha4List: Uint8Array[];
  alpha5List: Uint8Array[];
  X1: Uint8Array;
  X2: Uint8Array;
  X3List: Uint8Array[];
  X4List: Uint8Array[];
};

export type CreateVeiledNormalizationOpArgs = {
  decryptionKey: TwistedEd25519PrivateKey;
  unnormalizedEncryptedBalance: TwistedElGamalCiphertext[];
  balanceAmount: bigint;
  randomness?: bigint[];
};

export class VeiledNormalization {
  decryptionKey: TwistedEd25519PrivateKey;

  unnormalizedEncryptedBalance: TwistedElGamalCiphertext[];

  balanceAmount: bigint;

  normalizedVeiledAmount: VeiledAmount;

  randomness: bigint[];

  constructor(args: {
    decryptionKey: TwistedEd25519PrivateKey;
    unnormalizedEncryptedBalance: TwistedElGamalCiphertext[];
    balanceAmount: bigint;
    normalizedVeiledAmount: VeiledAmount;
    randomness: bigint[];
  }) {
    this.decryptionKey = args.decryptionKey;
    this.unnormalizedEncryptedBalance = args.unnormalizedEncryptedBalance;
    this.balanceAmount = args.balanceAmount;
    this.normalizedVeiledAmount = args.normalizedVeiledAmount;
    this.randomness = args.randomness;
  }

  static async create(args: CreateVeiledNormalizationOpArgs) {
    const randomness = args.randomness ?? ed25519GenListOfRandom();

    const normalizedVeiledAmount = VeiledAmount.fromAmount(args.balanceAmount);
    normalizedVeiledAmount.encrypt(args.decryptionKey.publicKey(), randomness);

    return new VeiledNormalization({
      decryptionKey: args.decryptionKey,
      unnormalizedEncryptedBalance: args.unnormalizedEncryptedBalance,
      balanceAmount: args.balanceAmount,
      normalizedVeiledAmount,
      randomness,
    });
  }

  static FIAT_SHAMIR_SIGMA_DST = "AptosVeiledCoin/NormalizationProofFiatShamir";

  static serializeSigmaProof(sigmaProof: VeiledNormalizationSigmaProof): Uint8Array {
    return concatBytes(
      sigmaProof.alpha1,
      sigmaProof.alpha2,
      sigmaProof.alpha3,
      ...sigmaProof.alpha4List,
      ...sigmaProof.alpha5List,
      sigmaProof.X1,
      sigmaProof.X2,
      ...sigmaProof.X3List,
      ...sigmaProof.X4List,
    );
  }

  static deserializeSigmaProof(sigmaProof: Uint8Array): VeiledNormalizationSigmaProof {
    if (sigmaProof.length !== SIGMA_PROOF_NORMALIZATION_SIZE) {
      throw new Error(
        `Invalid sigma proof length of veiled normalization: got ${sigmaProof.length}, expected ${SIGMA_PROOF_NORMALIZATION_SIZE}`,
      );
    }

    const proofArr: Uint8Array[] = [];
    for (let i = 0; i < SIGMA_PROOF_NORMALIZATION_SIZE; i += PROOF_CHUNK_SIZE) {
      proofArr.push(sigmaProof.subarray(i, i + PROOF_CHUNK_SIZE));
    }

    const alpha1 = proofArr[0];
    const alpha2 = proofArr[1];
    const alpha3 = proofArr[2];
    const alpha4List = proofArr.slice(3, 3 + VeiledAmount.CHUNKS_COUNT);
    const alpha5List = proofArr.slice(7, 7 + VeiledAmount.CHUNKS_COUNT);
    const X1 = proofArr[11];
    const X2 = proofArr[12];
    const X3List = proofArr.slice(13, 13 + VeiledAmount.CHUNKS_COUNT);
    const X4List = proofArr.slice(17);

    return {
      alpha1,
      alpha2,
      alpha3,
      alpha4List,
      alpha5List,
      X1,
      X2,
      X3List,
      X4List,
    };
  }

  async genSigmaProof(): Promise<VeiledNormalizationSigmaProof> {
    if (this.randomness && this.randomness.length !== VeiledAmount.CHUNKS_COUNT) {
      throw new Error("Invalid length list of randomness");
    }

    const x1 = ed25519GenRandom();
    const x2 = ed25519GenRandom();
    const x3 = ed25519GenRandom();

    const x4List = ed25519GenListOfRandom();
    const x5List = ed25519GenListOfRandom();

    const X1 = RistrettoPoint.BASE.multiply(x1).add(
      this.unnormalizedEncryptedBalance
        .reduce(
          (acc, ciphertext, i) => acc.add(ciphertext.D.multiply(2n ** (BigInt(i) * VeiledAmount.CHUNK_BITS_BI))),
          RistrettoPoint.ZERO,
        )
        .multiply(x2),
    );
    const X2 = H_RISTRETTO.multiply(x3);
    const X3List = x4List.map((x4, index) => RistrettoPoint.BASE.multiply(x4).add(H_RISTRETTO.multiply(x5List[index])));
    const X4List = x5List.map((item) =>
      RistrettoPoint.fromHex(this.decryptionKey.publicKey().toUint8Array()).multiply(item),
    );

    const p = genFiatShamirChallenge(
      utf8ToBytes(VeiledNormalization.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      this.decryptionKey.publicKey().toUint8Array(),
      ...this.unnormalizedEncryptedBalance.map((el) => el.serialize()).flat(),
      ...this.normalizedVeiledAmount.amountEncrypted!.map((el) => el.serialize()).flat(),
      X1.toRawBytes(),
      X2.toRawBytes(),
      ...X3List.map((X3) => X3.toRawBytes()),
      ...X4List.map((X4) => X4.toRawBytes()),
    );

    const sLE = bytesToNumberLE(this.decryptionKey.toUint8Array());
    const invertSLE = ed25519InvertN(sLE);

    const pt = ed25519modN(p * this.balanceAmount);
    const ps = ed25519modN(p * sLE);
    const psInvert = ed25519modN(p * invertSLE);

    const alpha1 = ed25519modN(x1 - pt);
    const alpha2 = ed25519modN(x2 - ps);
    const alpha3 = ed25519modN(x3 - psInvert);
    const alpha4List = x4List.map((x4, i) =>
      numberToBytesLE(ed25519modN(x4 - p * this.normalizedVeiledAmount!.amountChunks![i]), 32),
    );
    const alpha5List = x5List.map((x5, i) => numberToBytesLE(ed25519modN(x5 - p * this.randomness[i]), 32));

    return {
      alpha1: numberToBytesLE(alpha1, 32),
      alpha2: numberToBytesLE(alpha2, 32),
      alpha3: numberToBytesLE(alpha3, 32),
      alpha4List,
      alpha5List,
      X1: X1.toRawBytes(),
      X2: X2.toRawBytes(),
      X3List: X3List.map((X3) => X3.toRawBytes()),
      X4List: X4List.map((X4) => X4.toRawBytes()),
    };
  }

  static verifySigmaProof(opts: {
    publicKey: TwistedEd25519PublicKey;
    sigmaProof: VeiledNormalizationSigmaProof;

    unnormalizedEncryptedBalance: TwistedElGamalCiphertext[];
    normalizedEncryptedBalance: TwistedElGamalCiphertext[];
  }): boolean {
    const publicKeyU8 = publicKeyToU8(opts.publicKey);

    const alpha1LE = bytesToNumberLE(opts.sigmaProof.alpha1);
    const alpha2LE = bytesToNumberLE(opts.sigmaProof.alpha2);
    const alpha3LE = bytesToNumberLE(opts.sigmaProof.alpha3);
    const alpha4LEList = opts.sigmaProof.alpha4List.map((a) => bytesToNumberLE(a));
    const alpha5LEList = opts.sigmaProof.alpha5List.map((a) => bytesToNumberLE(a));

    const p = genFiatShamirChallenge(
      utf8ToBytes(VeiledNormalization.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      publicKeyU8,
      ...opts.unnormalizedEncryptedBalance.map((el) => el.serialize()).flat(),
      ...opts.normalizedEncryptedBalance.map((el) => el.serialize()).flat(),
      opts.sigmaProof.X1,
      opts.sigmaProof.X2,
      ...opts.sigmaProof.X3List,
      ...opts.sigmaProof.X4List,
    );
    const alpha1G = RistrettoPoint.BASE.multiply(alpha1LE);
    const alpha2D = opts.unnormalizedEncryptedBalance
      .reduce(
        (acc, { D }, i) => acc.add(D.multiply(2n ** (BigInt(i) * VeiledAmount.CHUNK_BITS_BI))),
        RistrettoPoint.ZERO,
      )
      .multiply(alpha2LE);
    const pBalOld = opts.unnormalizedEncryptedBalance
      .reduce((acc, ciphertext, i) => {
        const chunk = ciphertext.C.multiply(2n ** (BigInt(i) * VeiledAmount.CHUNK_BITS_BI));
        return acc.add(chunk);
      }, RistrettoPoint.ZERO)
      .multiply(p);

    const alpha3H = H_RISTRETTO.multiply(alpha3LE);
    const pP = RistrettoPoint.fromHex(publicKeyU8).multiply(p);
    const X1 = alpha1G.add(alpha2D).add(pBalOld);
    const X2 = alpha3H.add(pP);
    const X3List = alpha4LEList.map((a, i) => {
      const aG = RistrettoPoint.BASE.multiply(a);
      const aH = H_RISTRETTO.multiply(alpha5LEList[i]);
      const pC = opts.normalizedEncryptedBalance[i].C.multiply(p);
      return aG.add(aH).add(pC);
    });
    const X4List = alpha5LEList.map((a, i) =>
      RistrettoPoint.fromHex(publicKeyU8).multiply(a).add(opts.normalizedEncryptedBalance[i].D.multiply(p)),
    );

    return (
      X1.equals(RistrettoPoint.fromHex(opts.sigmaProof.X1)) &&
      X2.equals(RistrettoPoint.fromHex(opts.sigmaProof.X2)) &&
      X3List.every((X3, i) => X3.equals(RistrettoPoint.fromHex(opts.sigmaProof.X3List[i]))) &&
      X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(opts.sigmaProof.X4List[i])))
    );
  }

  async genRangeProof(): Promise<Uint8Array[]> {
    const rangeProof = await Promise.all(
      this.normalizedVeiledAmount.amountChunks.map((chunk, i) =>
        RangeProofExecutor.generateRangeZKP({
          v: chunk,
          // r: this.decryptionKey.toUint8Array(),
          r: numberToBytesLE(this.randomness[i], 32),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          // randBase: this.normalizedVeiledAmount!.amountEncrypted![i].D.toRawBytes(),
          randBase: H_RISTRETTO.toRawBytes(),
        }),
      ),
    );

    return rangeProof.map(({ proof }) => proof);
  }

  static async verifyRangeProof(opts: {
    rangeProof: Uint8Array[];
    normalizedEncryptedBalance: TwistedElGamalCiphertext[];
  }): Promise<boolean> {
    const isRangeProofValidations = await Promise.all(
      opts.rangeProof.map((proof, i) =>
        RangeProofExecutor.verifyRangeZKP({
          proof,
          commitment: opts.normalizedEncryptedBalance[i].C.toRawBytes(),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          // randBase: opts.normalizedEncryptedBalance[i].D.toRawBytes(),
          randBase: H_RISTRETTO.toRawBytes(),
        }),
      ),
    );
    return isRangeProofValidations.every((isValid) => isValid);
  }

  async authorizeNormalization(): Promise<
    [{ sigmaProof: VeiledNormalizationSigmaProof; rangeProof: Uint8Array[] }, TwistedElGamalCiphertext[]]
  > {
    const sigmaProof = await this.genSigmaProof();
    const rangeProof = await this.genRangeProof();

    return [{ sigmaProof, rangeProof }, this.normalizedVeiledAmount.amountEncrypted!];
  }
}
