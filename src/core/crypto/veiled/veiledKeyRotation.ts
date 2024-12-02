import { bytesToNumberLE, concatBytes, numberToBytesLE } from "@noble/curves/abstract/utils";
import { utf8ToBytes } from "@noble/hashes/utils";
import { PROOF_CHUNK_SIZE, SIGMA_PROOF_KEY_ROTATION_SIZE } from "./consts";
import { generateRangeZKP, verifyRangeZKP } from "./rangeProof";
import { H_RISTRETTO, RistrettoPoint, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";
import { TwistedElGamalCiphertext } from "../twistedElGamal";
import { genFiatShamirChallenge } from "./helpers";
import { ed25519GenListOfRandom, ed25519GenRandom, ed25519InvertN, ed25519modN } from "../utils";
import { VeiledAmount } from "./veiledAmount";

export type VeiledKeyRotationSigmaProof = {
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

export class VeiledKeyRotation {
  isInitialized = false;

  randomness: bigint[];

  currPrivateKey: TwistedEd25519PrivateKey;

  newPrivateKey: TwistedEd25519PrivateKey;

  currEncryptedBalance: TwistedElGamalCiphertext[];

  currVeiledAmount?: VeiledAmount;

  newVeiledAmount?: VeiledAmount;

  // currDecryptedBalance?: bigint[];

  // currDecryptedBalanceAmount?: bigint;

  // newEncryptedBalance?: TwistedElGamalCiphertext[];

  constructor(
    currPrivateKey: TwistedEd25519PrivateKey,
    newPrivateKey: TwistedEd25519PrivateKey,
    currEncryptedBalance: TwistedElGamalCiphertext[],
    randomness?: bigint[],
  ) {
    this.randomness = randomness ?? ed25519GenListOfRandom();
    this.currPrivateKey = currPrivateKey;
    this.newPrivateKey = newPrivateKey;
    this.currEncryptedBalance = currEncryptedBalance;
  }

  static FIAT_SHAMIR_SIGMA_DST = "AptosVeiledCoin/RotationSubproofFiatShamir";

  static serializeSigmaProof(sigmaProof: VeiledKeyRotationSigmaProof): Uint8Array {
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

  static deserializeSigmaProof(sigmaProof: Uint8Array): VeiledKeyRotationSigmaProof {
    if (sigmaProof.length !== SIGMA_PROOF_KEY_ROTATION_SIZE) {
      throw new Error(
        `Invalid sigma proof length of veiled key rotation: got ${sigmaProof.length}, expected ${SIGMA_PROOF_KEY_ROTATION_SIZE}`,
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
    const alpha5List = proofArr.slice(4, 4 + VeiledAmount.CHUNKS_COUNT);
    const alpha6List = proofArr.slice(8, 8 + VeiledAmount.CHUNKS_COUNT);
    const X1 = proofArr[12];
    const X2 = proofArr[13];
    const X3 = proofArr[14];
    const X4List = proofArr.slice(15, 15 + VeiledAmount.CHUNKS_COUNT);
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

  async init() {
    const currentBalance = await VeiledAmount.fromEncrypted(this.currEncryptedBalance, this.currPrivateKey);
    this.currVeiledAmount = currentBalance;

    // this.currDecryptedBalance = this.currEncryptedBalance.map((ciphertext) =>
    //   TwistedElGamal.decryptWithPK(ciphertext, this.currPrivateKey, {
    //     // TODO: mocked, replace with algo once it's implemented
    //     start: 0n,
    //     end: 1000n,
    //   }),
    // );
    // this.currDecryptedBalanceAmount = chunksToAmount(this.currDecryptedBalance);

    const newBalance = VeiledAmount.fromAmount(currentBalance.amount);
    newBalance.encryptBalance(this.newPrivateKey.publicKey(), this.randomness);
    this.newVeiledAmount = newBalance;

    // this.newEncryptedBalance = amountToChunks(this.currDecryptedBalanceAmount, VEILED_BALANCE_CHUNK_SIZE).map(
    //   (chunk, i) => TwistedElGamal.encryptWithPK(chunk, this.newPrivateKey.publicKey(), this.randomness[i]),
    // );

    this.isInitialized = true;
  }

  async genSigmaProof(): Promise<VeiledKeyRotationSigmaProof> {
    if (this.randomness && this.randomness.length !== VeiledAmount.CHUNKS_COUNT) {
      throw new Error("Invalid length list of randomness");
    }

    if (!this.isInitialized) throw new TypeError("VeiledKeyRotation is not initialized");

    if (!this.currVeiledAmount) throw new TypeError("this.currVeiledAmount is not defined");

    if (!this.newVeiledAmount) throw new TypeError("this.newVeiledAmount is not defined");

    const x1 = ed25519GenRandom();
    const x2 = ed25519GenRandom();
    const x3 = ed25519GenRandom();
    const x4 = ed25519GenRandom();

    const x5List = ed25519GenListOfRandom();
    const x6List = ed25519GenListOfRandom();

    const X1 = RistrettoPoint.BASE.multiply(x1).add(
      this.currEncryptedBalance
        .reduce((acc, ciphertext, i) => acc.add(ciphertext.D.multiply(2n ** (BigInt(i) * 32n))), RistrettoPoint.ZERO)
        .multiply(x2),
    );
    const X2 = H_RISTRETTO.multiply(x3);
    const X3 = H_RISTRETTO.multiply(x4);
    const X4List = x5List.map((item, index) =>
      RistrettoPoint.BASE.multiply(item).add(H_RISTRETTO.multiply(x6List[index])).toRawBytes(),
    );
    const X5List = x6List.map((item) =>
      RistrettoPoint.fromHex(this.newPrivateKey.publicKey().toUint8Array()).multiply(item).toRawBytes(),
    );

    const p = genFiatShamirChallenge(
      utf8ToBytes(VeiledKeyRotation.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      this.currPrivateKey.publicKey().toUint8Array(),
      this.newPrivateKey.publicKey().toUint8Array(),
      ...this.currEncryptedBalance.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      ...this.newVeiledAmount.encryptedAmount!.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      X1.toRawBytes(),
      X2.toRawBytes(),
      X3.toRawBytes(),
      ...X4List,
      ...X5List,
    );

    const oldSLE = bytesToNumberLE(this.currPrivateKey.toUint8Array());
    const invertOldSLE = ed25519InvertN(oldSLE);
    const newSLE = bytesToNumberLE(this.newPrivateKey.toUint8Array());
    const invertNewSLE = ed25519InvertN(newSLE);

    const alpha1 = ed25519modN(x1 - p * this.currVeiledAmount.amount);
    const alpha2 = ed25519modN(x2 - p * oldSLE);
    const alpha3 = ed25519modN(x3 - p * invertOldSLE);
    const alpha4 = ed25519modN(x4 - p * invertNewSLE);
    const alpha5List = x5List.map((x5, i) => {
      const pChunk = ed25519modN(p * this.currVeiledAmount!.amountChunks![i]);
      return numberToBytesLE(ed25519modN(x5 - pChunk), 32);
    });
    const alpha6List = x6List.map((x6, i) => {
      const pRand = ed25519modN(p * this.randomness[i]);
      return numberToBytesLE(ed25519modN(x6 - pRand), 32);
    });

    return {
      alpha1: numberToBytesLE(alpha1, 32),
      alpha2: numberToBytesLE(alpha2, 32),
      alpha3: numberToBytesLE(alpha3, 32),
      alpha4: numberToBytesLE(alpha4, 32),
      alpha5List,
      alpha6List,
      X1: X1.toRawBytes(),
      X2: X2.toRawBytes(),
      X3: X3.toRawBytes(),
      X4List,
      X5List,
    };
  }

  static verifySigmaProof(opts: {
    sigmaProof: VeiledKeyRotationSigmaProof;
    currPublicKey: TwistedEd25519PublicKey;
    newPublicKey: TwistedEd25519PublicKey;
    currEncryptedBalance: TwistedElGamalCiphertext[];
    newEncryptedBalance: TwistedElGamalCiphertext[];
  }) {
    const alpha1LE = bytesToNumberLE(opts.sigmaProof.alpha1);
    const alpha2LE = bytesToNumberLE(opts.sigmaProof.alpha2);
    const alpha3LE = bytesToNumberLE(opts.sigmaProof.alpha3);
    const alpha4LE = bytesToNumberLE(opts.sigmaProof.alpha4);
    const alpha5LEList = opts.sigmaProof.alpha5List.map((a) => bytesToNumberLE(a));
    const alpha6LEList = opts.sigmaProof.alpha6List.map((a) => bytesToNumberLE(a));

    const p = genFiatShamirChallenge(
      utf8ToBytes(VeiledKeyRotation.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      opts.currPublicKey.toUint8Array(),
      opts.newPublicKey.toUint8Array(),
      ...opts.currEncryptedBalance.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      ...opts.newEncryptedBalance.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      opts.sigmaProof.X1,
      opts.sigmaProof.X2,
      opts.sigmaProof.X3,
      ...opts.sigmaProof.X4List,
      ...opts.sigmaProof.X5List,
    );

    const alpha1G = RistrettoPoint.BASE.multiply(alpha1LE);
    const { DOldSum, COldSum } = opts.currEncryptedBalance.reduce(
      (acc, { C, D }, i) => {
        const coef = 2n ** (BigInt(i) * VeiledAmount.CHUNK_BITS_BI);
        return {
          DOldSum: acc.DOldSum.add(D.multiply(coef)),
          COldSum: acc.COldSum.add(C.multiply(coef)),
        };
      },
      { DOldSum: RistrettoPoint.ZERO, COldSum: RistrettoPoint.ZERO },
    );

    const X1 = alpha1G.add(DOldSum.multiply(alpha2LE)).add(COldSum.multiply(p));

    const alpha3H = H_RISTRETTO.multiply(alpha3LE);
    const alpha4H = H_RISTRETTO.multiply(alpha4LE);
    const pkOldRist = RistrettoPoint.fromHex(opts.currPublicKey.toUint8Array());
    const pkNewRist = RistrettoPoint.fromHex(opts.newPublicKey.toUint8Array());

    const X2 = alpha3H.add(pkOldRist.multiply(p));
    const X3 = alpha4H.add(pkNewRist.multiply(p));
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

  async genRangeProof(): Promise<Uint8Array[]> {
    if (!this.isInitialized) throw new TypeError("VeiledKeyRotation is not initialized");

    if (!this.currVeiledAmount) throw new TypeError("this.currVeiledAmount is not defined");

    if (!this.newVeiledAmount) throw new TypeError("this.newVeiledAmount is not defined");

    const rangeProof = await Promise.all(
      this.currVeiledAmount.amountChunks.map((chunk, i) =>
        generateRangeZKP({
          v: chunk,
          r: this.newPrivateKey.toUint8Array(),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          randBase: this.newVeiledAmount!.encryptedAmount![i].D.toRawBytes(),
        }),
      ),
    );

    return rangeProof.map(({ proof }) => proof);
  }

  async authorizeKeyRotation(): Promise<
    [
      {
        sigmaProof: VeiledKeyRotationSigmaProof;
        rangeProof: Uint8Array[];
      },
      TwistedElGamalCiphertext[],
    ]
  > {
    if (!this.isInitialized) throw new TypeError("VeiledKeyRotation is not initialized");

    if (!this.newVeiledAmount) throw new TypeError("this.newVeiledAmount is not defined");

    const sigmaProof = await this.genSigmaProof();

    const rangeProof = await this.genRangeProof();

    return [
      {
        sigmaProof,
        rangeProof,
      },
      this.newVeiledAmount.encryptedAmount!,
    ];
  }

  static async verifyRangeProof(opts: { rangeProof: Uint8Array[]; newEncryptedBalance: TwistedElGamalCiphertext[] }) {
    const rangeProofValidations = await Promise.all(
      opts.rangeProof.map((proof, i) =>
        verifyRangeZKP({
          proof,
          commitment: opts.newEncryptedBalance[i].C.toRawBytes(),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          randBase: opts.newEncryptedBalance[i].D.toRawBytes(),
        }),
      ),
    );

    return rangeProofValidations.every((isValid) => isValid);
  }
}
