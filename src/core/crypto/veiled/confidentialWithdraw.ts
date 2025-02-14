import { bytesToNumberLE, concatBytes, numberToBytesLE } from "@noble/curves/abstract/utils";
import { RistrettoPoint } from "@noble/curves/ed25519";
import { utf8ToBytes } from "@noble/hashes/utils";
import { genFiatShamirChallenge, publicKeyToU8 } from "./helpers";
import { H_RISTRETTO, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";
import { TwistedElGamalCiphertext } from "../twistedElGamal";
import { PROOF_CHUNK_SIZE, SIGMA_PROOF_WITHDRAW_SIZE } from "./consts";
import { ed25519GenListOfRandom, ed25519GenRandom, ed25519InvertN, ed25519modN } from "../utils";
import { RangeProofExecutor } from "../rangeProof";
import { ConfidentialAmount } from "./confidentialAmount";

export type ConfidentialWithdrawSigmaProof = {
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

export type CreateConfidentialWithdrawOpArgs = {
  decryptionKey: TwistedEd25519PrivateKey;
  encryptedActualBalance: TwistedElGamalCiphertext[];
  amountToWithdraw: bigint;
  randomness?: bigint[];
};

export class ConfidentialWithdraw {
  decryptionKey: TwistedEd25519PrivateKey;

  encryptedActualBalanceAmount: TwistedElGamalCiphertext[];

  veiledAmountToWithdraw: ConfidentialAmount;

  veiledAmountAfterWithdraw: ConfidentialAmount;

  randomness: bigint[];

  constructor(args: {
    decryptionKey: TwistedEd25519PrivateKey;
    encryptedActualBalance: TwistedElGamalCiphertext[];
    veiledAmountToWithdraw: ConfidentialAmount;
    veiledAmountAfterWithdraw: ConfidentialAmount;
    randomness: bigint[];
  }) {
    this.decryptionKey = args.decryptionKey;
    this.encryptedActualBalanceAmount = args.encryptedActualBalance;

    this.veiledAmountToWithdraw = args.veiledAmountToWithdraw;

    this.randomness = args.randomness;

    this.veiledAmountAfterWithdraw = args.veiledAmountAfterWithdraw;
  }

  static async create(args: CreateConfidentialWithdrawOpArgs) {
    const randomness = args.randomness ?? ed25519GenListOfRandom(ConfidentialAmount.CHUNKS_COUNT);

    const veiledAmountToWithdraw = ConfidentialAmount.fromAmount(args.amountToWithdraw, {
      chunksCount: ConfidentialAmount.CHUNKS_COUNT / 2,
    });
    const actualBalance = await ConfidentialAmount.fromEncrypted(args.encryptedActualBalance, args.decryptionKey);

    const veiledAmountAfterWithdraw = ConfidentialAmount.fromAmount(
      actualBalance.amount - veiledAmountToWithdraw.amount,
    );
    veiledAmountAfterWithdraw.encrypt(args.decryptionKey.publicKey(), randomness);

    return new ConfidentialWithdraw({
      decryptionKey: args.decryptionKey,
      encryptedActualBalance: args.encryptedActualBalance,
      veiledAmountToWithdraw,
      veiledAmountAfterWithdraw,
      randomness,
    });
  }

  static FIAT_SHAMIR_SIGMA_DST = "AptosVeiledCoin/WithdrawalProofFiatShamir";

  static serializeSigmaProof(sigmaProof: ConfidentialWithdrawSigmaProof): Uint8Array {
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

  static deserializeSigmaProof(sigmaProof: Uint8Array): ConfidentialWithdrawSigmaProof {
    if (sigmaProof.length !== SIGMA_PROOF_WITHDRAW_SIZE) {
      throw new Error(
        `Invalid sigma proof length of veiled withdraw: got ${sigmaProof.length}, expected ${SIGMA_PROOF_WITHDRAW_SIZE}`,
      );
    }

    const proofArr: Uint8Array[] = [];
    for (let i = 0; i < SIGMA_PROOF_WITHDRAW_SIZE; i += PROOF_CHUNK_SIZE) {
      proofArr.push(sigmaProof.subarray(i, i + PROOF_CHUNK_SIZE));
    }

    const alpha1 = proofArr[0];
    const alpha2 = proofArr[1];
    const alpha3 = proofArr[2];
    const alpha4List = proofArr.slice(3, 3 + ConfidentialAmount.CHUNKS_COUNT);
    const alpha5List = proofArr.slice(7, 7 + ConfidentialAmount.CHUNKS_COUNT);
    const X1 = proofArr[11];
    const X2 = proofArr[12];
    const X3List = proofArr.slice(13, 13 + ConfidentialAmount.CHUNKS_COUNT);
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

  async genSigmaProof(): Promise<ConfidentialWithdrawSigmaProof> {
    if (this.randomness && this.randomness.length !== ConfidentialAmount.CHUNKS_COUNT) {
      throw new Error("Invalid length list of randomness");
    }

    const x1 = ed25519GenRandom();
    const x2 = ed25519GenRandom();
    const x3 = ed25519GenRandom();

    const x4List = ed25519GenListOfRandom(ConfidentialAmount.CHUNKS_COUNT);
    const x5List = ed25519GenListOfRandom(ConfidentialAmount.CHUNKS_COUNT);

    const X1 = RistrettoPoint.BASE.multiply(x1).add(
      this.encryptedActualBalanceAmount.reduce((acc, el, i) => {
        const { D } = el;
        const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);

        const DCoef = D.multiply(coef);

        const DCoefX2 = DCoef.multiply(x2);

        return acc.add(DCoefX2);
      }, RistrettoPoint.ZERO),
    );
    const X2 = H_RISTRETTO.multiply(x3);
    const X3List = x4List.map((item, index) =>
      RistrettoPoint.BASE.multiply(item).add(H_RISTRETTO.multiply(x5List[index])),
    );
    const X4List = x5List.map((item) =>
      RistrettoPoint.fromHex(this.decryptionKey.publicKey().toUint8Array()).multiply(item),
    );

    const p = genFiatShamirChallenge(
      utf8ToBytes(ConfidentialWithdraw.FIAT_SHAMIR_SIGMA_DST),
      concatBytes(...this.veiledAmountToWithdraw.amountChunks.map((a) => numberToBytesLE(a, 32))),
      this.decryptionKey.publicKey().toUint8Array(),
      concatBytes(...this.encryptedActualBalanceAmount.map((el) => el.serialize()).flat()),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      X1.toRawBytes(),
      X2.toRawBytes(),
      ...X3List.map((el) => el.toRawBytes()),
      ...X4List.map((el) => el.toRawBytes()),
    );

    const sLE = bytesToNumberLE(this.decryptionKey.toUint8Array());
    const invertSLE = ed25519InvertN(sLE);

    const pt = ed25519modN(p * this.veiledAmountAfterWithdraw.amount);
    const ps = ed25519modN(p * sLE);
    const psInvert = ed25519modN(p * invertSLE);

    const alpha1 = ed25519modN(x1 - pt);
    const alpha2 = ed25519modN(x2 - ps);
    const alpha3 = ed25519modN(x3 - psInvert);
    const alpha4List = x4List.map((x4, i) => {
      const pChunk = ed25519modN(p * this.veiledAmountAfterWithdraw.amountChunks[i]);
      return ed25519modN(x4 - pChunk);
    });
    const alpha5List = x5List.map((x5, i) => {
      const pRand = ed25519modN(p * this.randomness[i]);
      return ed25519modN(x5 - pRand);
    });

    return {
      alpha1: numberToBytesLE(alpha1, 32),
      alpha2: numberToBytesLE(alpha2, 32),
      alpha3: numberToBytesLE(alpha3, 32),
      alpha4List: alpha4List.map((el) => numberToBytesLE(el, 32)),
      alpha5List: alpha5List.map((el) => numberToBytesLE(el, 32)),
      X1: X1.toRawBytes(),
      X2: X2.toRawBytes(),
      X3List: X3List.map((el) => el.toRawBytes()),
      X4List: X4List.map((el) => el.toRawBytes()),
    };
  }

  static verifySigmaProof(opts: {
    sigmaProof: ConfidentialWithdrawSigmaProof;
    encryptedActualBalance: TwistedElGamalCiphertext[];
    encryptedActualBalanceAfterWithdraw: TwistedElGamalCiphertext[];
    publicKey: TwistedEd25519PublicKey;
    amountToWithdraw: bigint;
  }): boolean {
    const publicKeyU8 = publicKeyToU8(opts.publicKey);
    const veiledAmountToWithdraw = ConfidentialAmount.fromAmount(opts.amountToWithdraw, {
      chunksCount: ConfidentialAmount.CHUNKS_COUNT / 2,
    });

    const alpha1LE = bytesToNumberLE(opts.sigmaProof.alpha1);
    const alpha2LE = bytesToNumberLE(opts.sigmaProof.alpha2);
    const alpha3LE = bytesToNumberLE(opts.sigmaProof.alpha3);
    const alpha4LEList = opts.sigmaProof.alpha4List.map((a) => bytesToNumberLE(a));
    const alpha5LEList = opts.sigmaProof.alpha5List.map((a) => bytesToNumberLE(a));

    const p = genFiatShamirChallenge(
      utf8ToBytes(ConfidentialWithdraw.FIAT_SHAMIR_SIGMA_DST),
      ...veiledAmountToWithdraw.amountChunks.map((a) => numberToBytesLE(a, 32)),
      publicKeyU8,
      ...opts.encryptedActualBalance.map((el) => el.serialize()).flat(),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      opts.sigmaProof.X1,
      opts.sigmaProof.X2,
      ...opts.sigmaProof.X3List,
      ...opts.sigmaProof.X4List,
    );

    const { DOldSum, COldSum } = opts.encryptedActualBalance.reduce(
      (acc, { C, D }, i) => {
        const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
        return {
          DOldSum: acc.DOldSum.add(D.multiply(coef)),
          COldSum: acc.COldSum.add(C.multiply(coef)),
        };
      },
      { DOldSum: RistrettoPoint.ZERO, COldSum: RistrettoPoint.ZERO },
    );

    const X1 = RistrettoPoint.BASE.multiply(alpha1LE)
      .add(DOldSum.multiply(alpha2LE))
      .add(COldSum.multiply(p))
      .subtract(RistrettoPoint.BASE.multiply(p).multiply(veiledAmountToWithdraw.amount));
    const X2 = H_RISTRETTO.multiply(alpha3LE).add(RistrettoPoint.fromHex(publicKeyU8).multiply(p));

    const X3List = alpha4LEList.map((a, i) => {
      const aG = RistrettoPoint.BASE.multiply(a);
      const aH = H_RISTRETTO.multiply(alpha5LEList[i]);
      const pC = opts.encryptedActualBalanceAfterWithdraw![i].C.multiply(p);
      return aG.add(aH).add(pC);
    });
    const X4List = alpha5LEList.map((a, i) =>
      RistrettoPoint.fromHex(publicKeyU8).multiply(a).add(opts.encryptedActualBalanceAfterWithdraw[i].D.multiply(p)),
    );

    return (
      X1.equals(RistrettoPoint.fromHex(opts.sigmaProof.X1)) &&
      X2.equals(RistrettoPoint.fromHex(opts.sigmaProof.X2)) &&
      X3List.every((X3, i) => X3.equals(RistrettoPoint.fromHex(opts.sigmaProof.X3List[i]))) &&
      X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(opts.sigmaProof.X4List[i])))
    );
  }

  async genRangeProof() {
    const rangeProof = await Promise.all(
      this.veiledAmountAfterWithdraw.amountChunks.map((chunk, i) =>
        RangeProofExecutor.generateRangeZKP({
          v: chunk,
          r: numberToBytesLE(this.randomness[i], 32),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          // randBase: this.veiledAmountAfterWithdraw.amountEncrypted![i].D.toRawBytes(),
          randBase: H_RISTRETTO.toRawBytes(),
          bits: ConfidentialAmount.CHUNK_BITS,
        }),
      ),
    );

    return rangeProof.map((el) => el.proof);
  }

  async authorizeWithdrawal(): Promise<
    [
      {
        sigmaProof: ConfidentialWithdrawSigmaProof;
        rangeProof: Uint8Array[];
      },
      TwistedElGamalCiphertext[],
    ]
  > {
    const sigmaProof = await this.genSigmaProof();
    const rangeProof = await this.genRangeProof();

    return [{ sigmaProof, rangeProof }, this.veiledAmountAfterWithdraw.amountEncrypted!];
  }

  static async verifyRangeProof(opts: {
    rangeProof: Uint8Array[];
    encryptedActualBalanceAfterWithdraw: TwistedElGamalCiphertext[];
  }) {
    const rangeProofVerificationResults = await Promise.all(
      opts.rangeProof.map((proof, i) =>
        RangeProofExecutor.verifyRangeZKP({
          proof,
          commitment: opts.encryptedActualBalanceAfterWithdraw[i].C.toRawBytes(),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          // randBase: opts.encryptedActualBalanceAfterWithdraw[i].D.toRawBytes(),
          randBase: H_RISTRETTO.toRawBytes(),
          bits: ConfidentialAmount.CHUNK_BITS,
        }),
      ),
    );

    return rangeProofVerificationResults.every((isValid) => isValid);
  }
}
