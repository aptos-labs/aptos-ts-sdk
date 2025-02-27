import { bytesToNumberLE, concatBytes, numberToBytesLE } from "@noble/curves/abstract/utils";
import { utf8ToBytes } from "@noble/hashes/utils";
import { PROOF_CHUNK_SIZE, SIGMA_PROOF_KEY_ROTATION_SIZE } from "./consts";
import { RangeProofExecutor } from "../rangeProof";
import { H_RISTRETTO, RistrettoPoint, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";
import { TwistedElGamalCiphertext } from "../twistedElGamal";
import { genFiatShamirChallenge } from "./helpers";
import { ed25519GenListOfRandom, ed25519GenRandom, ed25519InvertN, ed25519modN } from "../utils";
import { ConfidentialAmount } from "./confidentialAmount";

export type ConfidentialKeyRotationSigmaProof = {
  alpha1: Uint8Array;
  alpha2: Uint8Array;
  alpha3: Uint8Array;
  alpha4: Uint8Array;
  alpha5List: Uint8Array[];
  alpha6List: Uint8Array[];
  X1: Uint8Array;
  X2: Uint8Array;
  X3: Uint8Array;
  X4List: Uint8Array[];
  X5List: Uint8Array[];
};

export type CreateConfidentialKeyRotationOpArgs = {
  currDecryptionKey: TwistedEd25519PrivateKey;
  newDecryptionKey: TwistedEd25519PrivateKey;
  currEncryptedBalance: TwistedElGamalCiphertext[];
  randomness?: bigint[];
};

export class ConfidentialKeyRotation {
  randomness: bigint[];

  currDecryptionKey: TwistedEd25519PrivateKey;

  newDecryptionKey: TwistedEd25519PrivateKey;

  currEncryptedBalance: TwistedElGamalCiphertext[];

  currConfidentialAmount: ConfidentialAmount;

  newConfidentialAmount: ConfidentialAmount;

  constructor(args: {
    currDecryptionKey: TwistedEd25519PrivateKey;
    newDecryptionKey: TwistedEd25519PrivateKey;
    currEncryptedBalance: TwistedElGamalCiphertext[];
    randomness: bigint[];
    currConfidentialAmount: ConfidentialAmount;
    newConfidentialAmount: ConfidentialAmount;
  }) {
    this.randomness = args.randomness;
    this.currDecryptionKey = args.currDecryptionKey;
    this.newDecryptionKey = args.newDecryptionKey;
    this.currEncryptedBalance = args.currEncryptedBalance;
    this.currConfidentialAmount = args.currConfidentialAmount;
    this.newConfidentialAmount = args.newConfidentialAmount;
  }

  static FIAT_SHAMIR_SIGMA_DST = "AptosConfidentialAsset/RotationProofFiatShamir";

  static async create(args: CreateConfidentialKeyRotationOpArgs) {
    const randomness = args.randomness ?? ed25519GenListOfRandom(ConfidentialAmount.CHUNKS_COUNT);

    const currentBalance = await ConfidentialAmount.fromEncrypted(args.currEncryptedBalance, args.currDecryptionKey);

    const newBalance = ConfidentialAmount.fromAmount(currentBalance.amount);
    newBalance.encrypt(args.newDecryptionKey.publicKey(), randomness);

    return new ConfidentialKeyRotation({
      currDecryptionKey: args.currDecryptionKey,
      newDecryptionKey: args.newDecryptionKey,
      currEncryptedBalance: args.currEncryptedBalance,
      randomness,
      currConfidentialAmount: currentBalance,
      newConfidentialAmount: newBalance,
    });
  }

  static serializeSigmaProof(sigmaProof: ConfidentialKeyRotationSigmaProof): Uint8Array {
    return concatBytes(
      sigmaProof.alpha1,
      sigmaProof.alpha2,
      sigmaProof.alpha3,
      sigmaProof.alpha4,
      ...sigmaProof.alpha5List,
      ...sigmaProof.alpha6List,
      sigmaProof.X1,
      sigmaProof.X2,
      sigmaProof.X3,
      ...sigmaProof.X4List,
      ...sigmaProof.X5List,
    );
  }

  static deserializeSigmaProof(sigmaProof: Uint8Array): ConfidentialKeyRotationSigmaProof {
    if (sigmaProof.length !== SIGMA_PROOF_KEY_ROTATION_SIZE) {
      throw new Error(
        `Invalid sigma proof length of confidential key rotation: got ${sigmaProof.length}, expected ${SIGMA_PROOF_KEY_ROTATION_SIZE}`,
      );
    }

    const proofArr: Uint8Array[] = [];
    for (let i = 0; i < SIGMA_PROOF_KEY_ROTATION_SIZE; i += PROOF_CHUNK_SIZE) {
      proofArr.push(sigmaProof.subarray(i, i + PROOF_CHUNK_SIZE));
    }

    const alpha1 = proofArr[0];
    const alpha2 = proofArr[1];
    const alpha3 = proofArr[2];
    const alpha4 = proofArr[3];
    const alpha5List = proofArr.slice(4, 4 + ConfidentialAmount.CHUNKS_COUNT);
    const alpha6List = proofArr.slice(8, 8 + ConfidentialAmount.CHUNKS_COUNT);
    const X1 = proofArr[12];
    const X2 = proofArr[13];
    const X3 = proofArr[14];
    const X4List = proofArr.slice(15, 15 + ConfidentialAmount.CHUNKS_COUNT);
    const X5List = proofArr.slice(19);

    return {
      alpha1,
      alpha2,
      alpha3,
      alpha4,
      alpha5List,
      alpha6List,
      X1,
      X2,
      X3,
      X4List,
      X5List,
    };
  }

  async genSigmaProof(): Promise<ConfidentialKeyRotationSigmaProof> {
    if (this.randomness && this.randomness.length !== ConfidentialAmount.CHUNKS_COUNT) {
      throw new Error("Invalid length list of randomness");
    }

    const x1 = ed25519GenRandom();
    const x2 = ed25519GenRandom();
    const x3 = ed25519GenRandom();
    const x4 = ed25519GenRandom();

    const x5List = ed25519GenListOfRandom(ConfidentialAmount.CHUNKS_COUNT);
    const x6List = ed25519GenListOfRandom(ConfidentialAmount.CHUNKS_COUNT);

    const X1 = RistrettoPoint.BASE.multiply(x1).add(
      this.currEncryptedBalance
        .reduce(
          (acc, el, i) => acc.add(el.D.multiply(2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI))),
          RistrettoPoint.ZERO,
        )
        .multiply(x2),
    );
    const X2 = H_RISTRETTO.multiply(x3);
    const X3 = H_RISTRETTO.multiply(x4);
    const X4List = x5List.map((item, index) =>
      RistrettoPoint.BASE.multiply(item).add(H_RISTRETTO.multiply(x6List[index])).toRawBytes(),
    );
    const X5List = x6List.map((item) =>
      RistrettoPoint.fromHex(this.newDecryptionKey.publicKey().toUint8Array()).multiply(item).toRawBytes(),
    );

    const p = genFiatShamirChallenge(
      utf8ToBytes(ConfidentialKeyRotation.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      this.currDecryptionKey.publicKey().toUint8Array(),
      this.newDecryptionKey.publicKey().toUint8Array(),
      ...this.currEncryptedBalance.map((el) => el.serialize()).flat(),
      ...this.newConfidentialAmount.amountEncrypted!.map((el) => el.serialize()).flat(),
      X1.toRawBytes(),
      X2.toRawBytes(),
      X3.toRawBytes(),
      ...X4List,
      ...X5List,
    );

    const oldSLE = bytesToNumberLE(this.currDecryptionKey.toUint8Array());
    const invertOldSLE = ed25519InvertN(oldSLE);
    const newSLE = bytesToNumberLE(this.newDecryptionKey.toUint8Array());
    const invertNewSLE = ed25519InvertN(newSLE);

    const alpha1 = ed25519modN(x1 - p * this.currConfidentialAmount.amount);
    const alpha2 = ed25519modN(x2 - p * oldSLE);
    const alpha3 = ed25519modN(x3 - p * invertOldSLE);
    const alpha4 = ed25519modN(x4 - p * invertNewSLE);
    const alpha5List = x5List.map((x5, i) => ed25519modN(x5 - p * this.currConfidentialAmount.amountChunks[i]));
    const alpha6List = x6List.map((x6, i) => ed25519modN(x6 - p * this.randomness[i]));

    return {
      alpha1: numberToBytesLE(alpha1, 32),
      alpha2: numberToBytesLE(alpha2, 32),
      alpha3: numberToBytesLE(alpha3, 32),
      alpha4: numberToBytesLE(alpha4, 32),
      alpha5List: alpha5List.map((el) => numberToBytesLE(el, 32)),
      alpha6List: alpha6List.map((el) => numberToBytesLE(el, 32)),
      X1: X1.toRawBytes(),
      X2: X2.toRawBytes(),
      X3: X3.toRawBytes(),
      X4List,
      X5List,
    };
  }

  static verifySigmaProof(opts: {
    sigmaProof: ConfidentialKeyRotationSigmaProof;
    currPublicKey: TwistedEd25519PublicKey;
    newPublicKey: TwistedEd25519PublicKey;
    currEncryptedBalance: TwistedElGamalCiphertext[];
    newEncryptedBalance: TwistedElGamalCiphertext[];
  }) {
    const alpha1LE = bytesToNumberLE(opts.sigmaProof.alpha1);
    const alpha2LE = bytesToNumberLE(opts.sigmaProof.alpha2);
    const alpha3LE = bytesToNumberLE(opts.sigmaProof.alpha3);
    const alpha4LE = bytesToNumberLE(opts.sigmaProof.alpha4);
    const alpha5LEList = opts.sigmaProof.alpha5List.map(bytesToNumberLE);
    const alpha6LEList = opts.sigmaProof.alpha6List.map(bytesToNumberLE);

    const p = genFiatShamirChallenge(
      utf8ToBytes(ConfidentialKeyRotation.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      opts.currPublicKey.toUint8Array(),
      opts.newPublicKey.toUint8Array(),
      ...opts.currEncryptedBalance.map((el) => el.serialize()).flat(),
      ...opts.newEncryptedBalance.map((el) => el.serialize()).flat(),
      opts.sigmaProof.X1,
      opts.sigmaProof.X2,
      opts.sigmaProof.X3,
      ...opts.sigmaProof.X4List,
      ...opts.sigmaProof.X5List,
    );

    const pkOldRist = RistrettoPoint.fromHex(opts.currPublicKey.toUint8Array());
    const pkNewRist = RistrettoPoint.fromHex(opts.newPublicKey.toUint8Array());

    const { DOldSum, COldSum } = opts.currEncryptedBalance.reduce(
      (acc, { C, D }, i) => {
        const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
        return {
          DOldSum: acc.DOldSum.add(D.multiply(coef)),
          COldSum: acc.COldSum.add(C.multiply(coef)),
        };
      },
      { DOldSum: RistrettoPoint.ZERO, COldSum: RistrettoPoint.ZERO },
    );

    const X1 = RistrettoPoint.BASE.multiply(alpha1LE).add(DOldSum.multiply(alpha2LE)).add(COldSum.multiply(p));
    const X2 = H_RISTRETTO.multiply(alpha3LE).add(pkOldRist.multiply(p));
    const X3 = H_RISTRETTO.multiply(alpha4LE).add(pkNewRist.multiply(p));
    const X4List = alpha5LEList.map((a, i) => {
      const aG = RistrettoPoint.BASE.multiply(a);
      const aH = H_RISTRETTO.multiply(alpha6LEList[i]);
      const pC = opts.newEncryptedBalance[i].C.multiply(p);
      return aG.add(aH).add(pC);
    });
    const X5List = alpha6LEList.map((a, i) => {
      const aPK = pkNewRist.multiply(a);
      const pD = opts.newEncryptedBalance[i].D.multiply(p);
      return aPK.add(pD);
    });

    return (
      X1.equals(RistrettoPoint.fromHex(opts.sigmaProof.X1)) &&
      X2.equals(RistrettoPoint.fromHex(opts.sigmaProof.X2)) &&
      X3.equals(RistrettoPoint.fromHex(opts.sigmaProof.X3)) &&
      X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(opts.sigmaProof.X4List[i]))) &&
      X5List.every((X5, i) => X5.equals(RistrettoPoint.fromHex(opts.sigmaProof.X5List[i])))
    );
  }

  async genRangeProof(): Promise<Uint8Array> {
    const rangeProof = await RangeProofExecutor.genBatchRangeZKP({
      v: this.currConfidentialAmount.amountChunks,
      rs: this.randomness.map((chunk) => numberToBytesLE(chunk, 32)),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: ConfidentialAmount.CHUNK_BITS,
    });

    return rangeProof.proof;
  }

  async authorizeKeyRotation(): Promise<
    [
      {
        sigmaProof: ConfidentialKeyRotationSigmaProof;
        rangeProof: Uint8Array;
      },
      TwistedElGamalCiphertext[],
    ]
  > {
    const sigmaProof = await this.genSigmaProof();

    const rangeProof = await this.genRangeProof();

    return [
      {
        sigmaProof,
        rangeProof,
      },
      this.newConfidentialAmount.amountEncrypted!,
    ];
  }

  static async verifyRangeProof(opts: { rangeProof: Uint8Array; newEncryptedBalance: TwistedElGamalCiphertext[] }) {
    return RangeProofExecutor.verifyBatchRangeZKP({
      proof: opts.rangeProof,
      comm: opts.newEncryptedBalance.map((el) => el.C.toRawBytes()),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: ConfidentialAmount.CHUNK_BITS,
    });
  }
}
