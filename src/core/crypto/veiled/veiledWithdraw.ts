import { bytesToNumberLE, concatBytes, numberToBytesLE } from "@noble/curves/abstract/utils";
import { RistrettoPoint } from "@noble/curves/ed25519";
import { utf8ToBytes } from "@noble/hashes/utils";
import { genFiatShamirChallenge, publicKeyToU8 } from "./helpers";
import { H_RISTRETTO, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";
import { TwistedElGamalCiphertext } from "../twistedElGamal";
import { PROOF_CHUNK_SIZE, SIGMA_PROOF_WITHDRAW_SIZE } from "./consts";
import { ed25519GenListOfRandom, ed25519GenRandom, ed25519InvertN, ed25519modN } from "../utils";
import { RangeProofExecutor } from "../rangeProof";
import { VeiledAmount } from "./veiledAmount";

export type VeiledWithdrawSigmaProof = {
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

export type CreateVeiledWithdrawOpArgs = {
  decryptionKey: TwistedEd25519PrivateKey;
  encryptedActualBalance: TwistedElGamalCiphertext[];
  amountToWithdraw: bigint;
  randomness?: bigint[];
};

export class VeiledWithdraw {
  decryptionKey: TwistedEd25519PrivateKey;

  encryptedActualBalanceAmount: TwistedElGamalCiphertext[];

  veiledAmountToWithdraw: VeiledAmount;

  veiledAmountAfterWithdraw: VeiledAmount;

  randomness: bigint[];

  constructor(args: {
    decryptionKey: TwistedEd25519PrivateKey;
    encryptedActualBalance: TwistedElGamalCiphertext[];
    veiledAmountToWithdraw: VeiledAmount;
    veiledAmountAfterWithdraw: VeiledAmount;
    randomness: bigint[];
  }) {
    this.decryptionKey = args.decryptionKey;
    this.encryptedActualBalanceAmount = args.encryptedActualBalance;

    this.veiledAmountToWithdraw = args.veiledAmountToWithdraw;

    this.randomness = args.randomness;

    this.veiledAmountAfterWithdraw = args.veiledAmountAfterWithdraw;
  }

  static async create(args: CreateVeiledWithdrawOpArgs) {
    const randomness = args.randomness ?? ed25519GenListOfRandom();

    const veiledAmountToWithdraw = VeiledAmount.fromAmount(args.amountToWithdraw, {
      chunksCount: 2,
    });
    veiledAmountToWithdraw.encrypt(args.decryptionKey.publicKey(), randomness);

    const actualBalance = await VeiledAmount.fromEncrypted(args.encryptedActualBalance, args.decryptionKey);

    const veiledAmountAfterWithdraw = VeiledAmount.fromAmount(actualBalance.amount - veiledAmountToWithdraw.amount);
    veiledAmountAfterWithdraw.encrypt(args.decryptionKey.publicKey(), randomness);

    return new VeiledWithdraw({
      decryptionKey: args.decryptionKey,
      encryptedActualBalance: args.encryptedActualBalance,
      veiledAmountToWithdraw,
      veiledAmountAfterWithdraw,
      randomness,
    });
  }

  static FIAT_SHAMIR_SIGMA_DST = "AptosVeiledCoin/WithdrawalProofFiatShamir";

  static serializeSigmaProof(sigmaProof: VeiledWithdrawSigmaProof): Uint8Array {
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

  static deserializeSigmaProof(sigmaProof: Uint8Array): VeiledWithdrawSigmaProof {
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

  async genSigmaProof(): Promise<VeiledWithdrawSigmaProof> {
    if (this.randomness && this.randomness.length !== VeiledAmount.CHUNKS_COUNT) {
      throw new Error("Invalid length list of randomness");
    }

    const x1 = ed25519GenRandom();
    const x2 = ed25519GenRandom();
    const x3 = ed25519GenRandom();

    const x4List = ed25519GenListOfRandom();

    const x5List = ed25519GenListOfRandom();

    const X1 = RistrettoPoint.BASE.multiply(x1).add(
      this.encryptedActualBalanceAmount
        .reduce((acc, ciphertext, i) => acc.add(ciphertext.D.multiply(2n ** (BigInt(i) * 32n))), RistrettoPoint.ZERO)
        .multiply(x2),
    );
    const X2 = H_RISTRETTO.multiply(x3);
    const X3List = x4List.map((item, index) =>
      RistrettoPoint.BASE.multiply(item).add(H_RISTRETTO.multiply(x5List[index])),
    );
    const X4List = x5List.map((item) =>
      RistrettoPoint.fromHex(this.decryptionKey.publicKey().toUint8Array()).multiply(item),
    );

    const p = genFiatShamirChallenge(
      utf8ToBytes(VeiledWithdraw.FIAT_SHAMIR_SIGMA_DST),
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
    sigmaProof: VeiledWithdrawSigmaProof;
    encryptedActualBalance: TwistedElGamalCiphertext[];
    encryptedActualBalanceAfterWithdraw: TwistedElGamalCiphertext[];
    publicKey: TwistedEd25519PublicKey;
    amountToWithdraw: bigint;
  }): boolean {
    const publicKeyU8 = publicKeyToU8(opts.publicKey);
    const veiledAmountToWithdraw = VeiledAmount.fromAmount(opts.amountToWithdraw, {
      chunksCount: 2,
    });

    const alpha1LE = bytesToNumberLE(opts.sigmaProof.alpha1);
    const alpha2LE = bytesToNumberLE(opts.sigmaProof.alpha2);
    const alpha3LE = bytesToNumberLE(opts.sigmaProof.alpha3);
    const alpha4LEList = opts.sigmaProof.alpha4List.map((a) => bytesToNumberLE(a));
    const alpha5LEList = opts.sigmaProof.alpha5List.map((a) => bytesToNumberLE(a));

    const p = genFiatShamirChallenge(
      utf8ToBytes(VeiledWithdraw.FIAT_SHAMIR_SIGMA_DST),
      ...veiledAmountToWithdraw.amountChunks.map((a) => numberToBytesLE(a, 32)),
      publicKeyU8,
      ...opts.encryptedActualBalance.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      opts.sigmaProof.X1,
      opts.sigmaProof.X2,
      ...opts.sigmaProof.X3List,
      ...opts.sigmaProof.X4List,
    );

    const chunkBitsBI = BigInt(VeiledAmount.CHUNK_BITS);

    const alpha1G = RistrettoPoint.BASE.multiply(alpha1LE);
    const { DOldSum, COldSum } = opts.encryptedActualBalance.reduce(
      (acc, { C, D }, i) => {
        const coef = 2n ** (BigInt(i) * chunkBitsBI);
        return {
          DOldSum: acc.DOldSum.add(D.multiply(coef)),
          COldSum: acc.COldSum.add(C.multiply(coef)),
        };
      },
      { DOldSum: RistrettoPoint.ZERO, COldSum: RistrettoPoint.ZERO },
    );
    const alpha2DOld = DOldSum.multiply(alpha2LE);
    const amountG = RistrettoPoint.BASE.multiply(opts.amountToWithdraw);

    const alpha3H = H_RISTRETTO.multiply(alpha3LE);
    const pP = RistrettoPoint.fromHex(publicKeyU8).multiply(p);

    const X1 = alpha1G.add(alpha2DOld).add(COldSum.subtract(amountG).multiply(p));
    const X2 = alpha3H.add(pP);

    const X3List = alpha4LEList.map((a, i) => {
      const aG = RistrettoPoint.BASE.multiply(a);
      const aH = H_RISTRETTO.multiply(alpha5LEList[i]);
      const pC = opts.encryptedActualBalanceAfterWithdraw![i].C.multiply(p);
      return aG.add(aH).add(pC);
    });
    const X4List = alpha5LEList.map((a, i) =>
      RistrettoPoint.fromHex(publicKeyU8).multiply(a).add(opts.encryptedActualBalanceAfterWithdraw![i].D.multiply(p)),
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
          r: this.decryptionKey.toUint8Array(),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          randBase: this.veiledAmountAfterWithdraw.amountEncrypted![i].D.toRawBytes(),
        }),
      ),
    );

    return rangeProof.map((el) => el.proof);
  }

  async authorizeWithdrawal(): Promise<
    [
      {
        sigmaProof: VeiledWithdrawSigmaProof;
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
          randBase: opts.encryptedActualBalanceAfterWithdraw[i].D.toRawBytes(),
        }),
      ),
    );

    return rangeProofVerificationResults.every((isValid) => isValid);
  }
}
