import { bytesToNumberLE, concatBytes, numberToBytesLE } from "@noble/curves/abstract/utils";
import { RistrettoPoint } from "@noble/curves/ed25519";
import { utf8ToBytes } from "@noble/hashes/utils";
import { genFiatShamirChallenge, publicKeyToU8 } from "./helpers";
import { PROOF_CHUNK_SIZE, SIGMA_PROOF_WITHDRAW_SIZE } from "./consts";
import { ConfidentialAmount } from "./confidentialAmount";
import { RangeProofExecutor } from "./rangeProof";
import { TwistedEd25519PrivateKey, H_RISTRETTO, TwistedEd25519PublicKey } from "./twistedEd25519";
import { TwistedElGamalCiphertext } from "./twistedElGamal";
import { ed25519GenListOfRandom, ed25519GenRandom, ed25519modN, ed25519InvertN } from "./utils";

export type ConfidentialWithdrawSigmaProof = {
  alpha1List: Uint8Array[];
  alpha2: Uint8Array;
  alpha3: Uint8Array;
  alpha4List: Uint8Array[];
  X1: Uint8Array;
  X2: Uint8Array;
  X3List: Uint8Array[];
  X4List: Uint8Array[];
};

export type CreateConfidentialWithdrawOpArgs = {
  decryptionKey: TwistedEd25519PrivateKey;
  senderEncryptedAvailableBalance: TwistedElGamalCiphertext[];
  amount: bigint;
  randomness?: bigint[];
};

export class ConfidentialWithdraw {
  decryptionKey: TwistedEd25519PrivateKey;

  senderEncryptedAvailableBalance: TwistedElGamalCiphertext[];

  amount: ConfidentialAmount;

  senderAvailableBalanceAfterWithdrawal: ConfidentialAmount;

  senderEncryptedAvailableBalanceAfterWithdrawal: TwistedElGamalCiphertext[];

  randomness: bigint[];

  constructor(args: {
    decryptionKey: TwistedEd25519PrivateKey;
    senderEncryptedAvailableBalance: TwistedElGamalCiphertext[];
    amount: ConfidentialAmount;
    senderAvailableBalanceAfterWithdrawal: ConfidentialAmount;
    randomness: bigint[];
  }) {
    this.decryptionKey = args.decryptionKey;
    this.senderEncryptedAvailableBalance = args.senderEncryptedAvailableBalance;
    this.amount = args.amount;
    this.randomness = args.randomness;
    this.senderAvailableBalanceAfterWithdrawal = args.senderAvailableBalanceAfterWithdrawal;

    this.senderEncryptedAvailableBalanceAfterWithdrawal = this.senderAvailableBalanceAfterWithdrawal.getAmountEncrypted(
      this.decryptionKey.publicKey(),
      this.randomness,
    );
  }

  static async create(args: CreateConfidentialWithdrawOpArgs) {
    const randomness = args.randomness ?? ed25519GenListOfRandom(ConfidentialAmount.CHUNKS_COUNT);

    const confidentialAmountToWithdraw = ConfidentialAmount.fromAmount(args.amount, {
      chunksCount: ConfidentialAmount.CHUNKS_COUNT / 2,
    });
    const currentBalance = await ConfidentialAmount.fromEncrypted(
      args.senderEncryptedAvailableBalance,
      args.decryptionKey,
    );

    const senderAvailableBalanceAfterWithdrawal = ConfidentialAmount.fromAmount(
      currentBalance.amount - confidentialAmountToWithdraw.amount,
    );

    return new ConfidentialWithdraw({
      decryptionKey: args.decryptionKey,
      senderEncryptedAvailableBalance: args.senderEncryptedAvailableBalance,
      amount: confidentialAmountToWithdraw,
      senderAvailableBalanceAfterWithdrawal,
      randomness,
    });
  }

  static FIAT_SHAMIR_SIGMA_DST = "AptosConfidentialAsset/WithdrawalProofFiatShamir";

  static serializeSigmaProof(sigmaProof: ConfidentialWithdrawSigmaProof): Uint8Array {
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

  static deserializeSigmaProof(sigmaProof: Uint8Array): ConfidentialWithdrawSigmaProof {
    if (sigmaProof.length !== SIGMA_PROOF_WITHDRAW_SIZE) {
      throw new Error(
        `Invalid sigma proof length of confidential withdraw: got ${sigmaProof.length}, expected ${SIGMA_PROOF_WITHDRAW_SIZE}`,
      );
    }

    const proofArr: Uint8Array[] = [];
    for (let i = 0; i < SIGMA_PROOF_WITHDRAW_SIZE; i += PROOF_CHUNK_SIZE) {
      proofArr.push(sigmaProof.subarray(i, i + PROOF_CHUNK_SIZE));
    }

    const alpha1List = proofArr.slice(0, 3);
    const alpha2 = proofArr[3];
    const alpha3 = proofArr[4];
    const alpha4List = proofArr.slice(5, 5 + ConfidentialAmount.CHUNKS_COUNT);
    const X1 = proofArr[11];
    const X2 = proofArr[12];
    const X3List = proofArr.slice(13, 13 + ConfidentialAmount.CHUNKS_COUNT);
    const X4List = proofArr.slice(13 + ConfidentialAmount.CHUNKS_COUNT, 13 + 2 * ConfidentialAmount.CHUNKS_COUNT);

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

  async genSigmaProof(): Promise<ConfidentialWithdrawSigmaProof> {
    if (this.randomness && this.randomness.length !== ConfidentialAmount.CHUNKS_COUNT) {
      throw new Error("Invalid length list of randomness");
    }

    const x1List = ed25519GenListOfRandom(ConfidentialAmount.CHUNKS_COUNT);
    const x2 = ed25519GenRandom();
    const x3 = ed25519GenRandom();

    const x4List = ed25519GenListOfRandom(ConfidentialAmount.CHUNKS_COUNT);
    // const x5List = ed25519GenListOfRandom(ConfidentialAmount.CHUNKS_COUNT);

    const X1 = RistrettoPoint.BASE.multiply(
      ed25519modN(
        x1List.reduce((acc, el, i) => {
          const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
          const x1i = el * coef;

          return acc + x1i;
        }, 0n),
      ),
    ).add(
      this.senderEncryptedAvailableBalance.reduce((acc, el, i) => {
        const { D } = el;
        const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);

        const DCoef = D.multiply(coef);

        const DCoefX2 = DCoef.multiply(x2);

        return acc.add(DCoefX2);
      }, RistrettoPoint.ZERO),
    );
    const X2 = H_RISTRETTO.multiply(x3);
    const X3List = x1List.map((item, idx) => RistrettoPoint.BASE.multiply(item).add(H_RISTRETTO.multiply(x4List[idx])));
    const X4List = x4List.map((item) =>
      RistrettoPoint.fromHex(this.decryptionKey.publicKey().toUint8Array()).multiply(item),
    );

    const p = genFiatShamirChallenge(
      utf8ToBytes(ConfidentialWithdraw.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      this.decryptionKey.publicKey().toUint8Array(),
      concatBytes(
        ...this.amount.amountChunks.slice(0, ConfidentialAmount.CHUNKS_COUNT / 2).map((a) => numberToBytesLE(a, 32)),
      ),
      concatBytes(...this.senderEncryptedAvailableBalance.map((el) => el.serialize()).flat()),
      X1.toRawBytes(),
      X2.toRawBytes(),
      ...X3List.map((el) => el.toRawBytes()),
      ...X4List.map((el) => el.toRawBytes()),
    );

    const sLE = bytesToNumberLE(this.decryptionKey.toUint8Array());
    const invertSLE = ed25519InvertN(sLE);

    const ps = ed25519modN(p * sLE);
    const psInvert = ed25519modN(p * invertSLE);

    const alpha1List = x1List.map((el, i) => {
      const pChunk = ed25519modN(p * this.senderAvailableBalanceAfterWithdrawal.amountChunks[i]);
      return ed25519modN(el - pChunk);
    });
    const alpha2 = ed25519modN(x2 - ps);
    const alpha3 = ed25519modN(x3 - psInvert);
    const alpha4List = x4List.map((el, i) => {
      const rChunk = ed25519modN(p * this.randomness[i]);
      return ed25519modN(el - rChunk);
    });

    return {
      alpha1List: alpha1List.map((el) => numberToBytesLE(el, 32)),
      alpha2: numberToBytesLE(alpha2, 32),
      alpha3: numberToBytesLE(alpha3, 32),
      alpha4List: alpha4List.map((el) => numberToBytesLE(el, 32)),
      X1: X1.toRawBytes(),
      X2: X2.toRawBytes(),
      X3List: X3List.map((el) => el.toRawBytes()),
      X4List: X4List.map((el) => el.toRawBytes()),
    };
  }

  static verifySigmaProof(opts: {
    sigmaProof: ConfidentialWithdrawSigmaProof;
    senderEncryptedAvailableBalance: TwistedElGamalCiphertext[];
    senderEncryptedAvailableBalanceAfterWithdrawal: TwistedElGamalCiphertext[];
    publicKey: TwistedEd25519PublicKey;
    amountToWithdraw: bigint;
  }): boolean {
    const publicKeyU8 = publicKeyToU8(opts.publicKey);
    const confidentialAmountToWithdraw = ConfidentialAmount.fromAmount(opts.amountToWithdraw, {
      chunksCount: ConfidentialAmount.CHUNKS_COUNT / 2,
    });

    const alpha1LEList = opts.sigmaProof.alpha1List.map((a) => bytesToNumberLE(a));
    const alpha2LE = bytesToNumberLE(opts.sigmaProof.alpha2);
    const alpha3LE = bytesToNumberLE(opts.sigmaProof.alpha3);
    const alpha4LEList = opts.sigmaProof.alpha4List.map((a) => bytesToNumberLE(a));

    const p = genFiatShamirChallenge(
      utf8ToBytes(ConfidentialWithdraw.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      publicKeyU8,
      ...confidentialAmountToWithdraw.amountChunks
        .slice(0, ConfidentialAmount.CHUNKS_COUNT / 2)
        .map((a) => numberToBytesLE(a, 32)),
      ...opts.senderEncryptedAvailableBalance.map((el) => el.serialize()).flat(),
      opts.sigmaProof.X1,
      opts.sigmaProof.X2,
      ...opts.sigmaProof.X3List,
      ...opts.sigmaProof.X4List,
    );

    const { DOldSum, COldSum } = opts.senderEncryptedAvailableBalance.reduce(
      (acc, { C, D }, i) => {
        const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
        return {
          DOldSum: acc.DOldSum.add(D.multiply(coef)),
          COldSum: acc.COldSum.add(C.multiply(coef)),
        };
      },
      { DOldSum: RistrettoPoint.ZERO, COldSum: RistrettoPoint.ZERO },
    );

    const X1 = RistrettoPoint.BASE.multiply(
      ed25519modN(
        alpha1LEList.reduce((acc, el, i) => {
          const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
          const elCoef = el * coef;

          return acc + elCoef;
        }, 0n),
      ),
    )
      .add(DOldSum.multiply(alpha2LE))
      .add(COldSum.multiply(p))
      .subtract(RistrettoPoint.BASE.multiply(p).multiply(confidentialAmountToWithdraw.amount));
    const X2 = H_RISTRETTO.multiply(alpha3LE).add(RistrettoPoint.fromHex(publicKeyU8).multiply(p));

    const X3List = alpha1LEList.map((el, i) => {
      const a1iG = RistrettoPoint.BASE.multiply(el);
      const a4iH = H_RISTRETTO.multiply(alpha4LEList[i]);
      const pC = opts.senderEncryptedAvailableBalanceAfterWithdrawal![i].C.multiply(p);
      return a1iG.add(a4iH).add(pC);
    });
    const X4List = alpha4LEList.map((el, i) => {
      const a4iP = RistrettoPoint.fromHex(publicKeyU8).multiply(el);

      const pDNew = opts.senderEncryptedAvailableBalanceAfterWithdrawal[i].D.multiply(p);

      return a4iP.add(pDNew);
    });

    return (
      X1.equals(RistrettoPoint.fromHex(opts.sigmaProof.X1)) &&
      X2.equals(RistrettoPoint.fromHex(opts.sigmaProof.X2)) &&
      X3List.every((X3, i) => X3.equals(RistrettoPoint.fromHex(opts.sigmaProof.X3List[i]))) &&
      X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(opts.sigmaProof.X4List[i])))
    );
  }

  async genRangeProof() {
    const rangeProof = await RangeProofExecutor.genBatchRangeZKP({
      v: this.senderAvailableBalanceAfterWithdrawal.amountChunks.map((chunk) => chunk),
      rs: this.randomness.map((chunk) => numberToBytesLE(chunk, 32)),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: ConfidentialAmount.CHUNK_BITS,
    });

    return rangeProof.proof;
  }

  async authorizeWithdrawal(): Promise<
    [
      {
        sigmaProof: ConfidentialWithdrawSigmaProof;
        rangeProof: Uint8Array;
      },
      TwistedElGamalCiphertext[],
    ]
  > {
    const sigmaProof = await this.genSigmaProof();
    const rangeProof = await this.genRangeProof();

    return [{ sigmaProof, rangeProof }, this.senderEncryptedAvailableBalanceAfterWithdrawal];
  }

  static async verifyRangeProof(opts: {
    rangeProof: Uint8Array;
    senderEncryptedAvailableBalanceAfterWithdrawal: TwistedElGamalCiphertext[];
  }) {
    return RangeProofExecutor.verifyBatchRangeZKP({
      proof: opts.rangeProof,
      comm: opts.senderEncryptedAvailableBalanceAfterWithdrawal.map((el) => el.C.toRawBytes()),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: ConfidentialAmount.CHUNK_BITS,
    });
  }
}
