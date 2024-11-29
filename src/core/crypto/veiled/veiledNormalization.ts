import { RistrettoPoint } from "@noble/curves/ed25519";
import { utf8ToBytes } from "@noble/hashes/utils";
import { bytesToNumberLE, concatBytes, numberToBytesLE } from "@noble/curves/abstract/utils";
import { PROOF_CHUNK_SIZE, SIGMA_PROOF_NORMALIZATION_SIZE, VEILED_BALANCE_CHUNK_SIZE } from "./consts";
import { amountToChunks, genFiatShamirChallenge, publicKeyToU8 } from "./helpers";
import { ed25519GenListOfRandom, ed25519GenRandom, ed25519InvertN, ed25519modN } from "../utils";
import { H_RISTRETTO, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";
import { TwistedElGamal, TwistedElGamalCiphertext } from "../twistedElGamal";
import { generateRangeZKP, verifyRangeZKP } from "./rangeProof";

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

export class VeiledNormalization {
  isInitialized: boolean = false;

  privateKey: TwistedEd25519PrivateKey;

  unnormilizedEncryptedBalance: TwistedElGamalCiphertext[];

  balanceAmount: bigint;

  randomness: bigint[];

  normalizedBalance?: bigint[];

  normalizedEncryptedBalance?: TwistedElGamalCiphertext[];

  constructor(
    privateKey: TwistedEd25519PrivateKey,
    unnormilizedEncryptedBalance: TwistedElGamalCiphertext[],
    balanceAmount: bigint,
    randomness?: bigint[],
  ) {
    this.privateKey = privateKey;
    this.unnormilizedEncryptedBalance = unnormilizedEncryptedBalance;
    this.balanceAmount = balanceAmount;
    this.randomness = randomness ?? ed25519GenListOfRandom();
  }

  static FIAT_SHAMIR_SIGMA_DST = "AptosVeiledCoin/NormalizationSubproofFiatShamir";

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
    const alpha4List = proofArr.slice(3, 3 + VEILED_BALANCE_CHUNK_SIZE);
    const alpha5List = proofArr.slice(7, 7 + VEILED_BALANCE_CHUNK_SIZE);
    const X1 = proofArr[11];
    const X2 = proofArr[12];
    const X3List = proofArr.slice(13, 13 + VEILED_BALANCE_CHUNK_SIZE);
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

  async init() {
    this.normalizedBalance = amountToChunks(this.balanceAmount, VEILED_BALANCE_CHUNK_SIZE);
    this.normalizedEncryptedBalance = this.normalizedBalance.map((chunk, i) =>
      TwistedElGamal.encryptWithPK(chunk, this.privateKey.publicKey(), this.randomness[i]),
    );

    this.isInitialized = true;
  }

  async genSigmaProof(): Promise<VeiledNormalizationSigmaProof> {
    if (!this.isInitialized) throw new TypeError("VeiledNormalization instance is not initialized");

    if (!this.normalizedEncryptedBalance) throw new TypeError("this.normalizedEncryptedBalance is not defined");

    if (!this.normalizedBalance) throw new TypeError("this.normalizedBalance is not defined");

    if (this.randomness && this.randomness.length !== VEILED_BALANCE_CHUNK_SIZE) {
      throw new Error("Invalid length list of randomness");
    }

    const x1 = ed25519GenRandom();
    const x2 = ed25519GenRandom();
    const x3 = ed25519GenRandom();

    const x4List = ed25519GenListOfRandom();
    const x5List = ed25519GenListOfRandom();

    const X1 = RistrettoPoint.BASE.multiply(x1).add(
      this.unnormilizedEncryptedBalance
        .reduce((acc, ciphertext, i) => acc.add(ciphertext.D.multiply(2n ** (BigInt(i) * 32n))), RistrettoPoint.ZERO)
        .multiply(x2),
    );
    const X2 = H_RISTRETTO.multiply(x3);
    const X3List = x4List.map((item, index) =>
      RistrettoPoint.BASE.multiply(item).add(H_RISTRETTO.multiply(x5List[index])).toRawBytes(),
    );
    const X4List = x5List.map((item) =>
      RistrettoPoint.fromHex(this.privateKey.publicKey().toUint8Array()).multiply(item).toRawBytes(),
    );

    const p = genFiatShamirChallenge(
      utf8ToBytes(VeiledNormalization.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      this.privateKey.publicKey().toUint8Array(),
      ...this.unnormilizedEncryptedBalance.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      ...this.normalizedEncryptedBalance!.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      X1.toRawBytes(),
      X2.toRawBytes(),
      ...X3List,
      ...X4List,
    );

    const sLE = bytesToNumberLE(this.privateKey.toUint8Array());
    const invertSLE = ed25519InvertN(sLE);

    const pt = ed25519modN(p * this.balanceAmount);
    const ps = ed25519modN(p * sLE);
    const psInvert = ed25519modN(p * invertSLE);

    const alpha1 = ed25519modN(x1 - pt);
    const alpha2 = ed25519modN(x2 - ps);
    const alpha3 = ed25519modN(x3 - psInvert);
    const alpha4List = x4List.map((x4, i) => numberToBytesLE(ed25519modN(x4 - p * this.normalizedBalance![i]), 32));
    const alpha5List = x5List.map((x5, i) => numberToBytesLE(ed25519modN(x5 - p * this.randomness[i]), 32));

    return {
      alpha1: numberToBytesLE(alpha1, 32),
      alpha2: numberToBytesLE(alpha2, 32),
      alpha3: numberToBytesLE(alpha3, 32),
      alpha4List,
      alpha5List,
      X1: X1.toRawBytes(),
      X2: X2.toRawBytes(),
      X3List,
      X4List,
    };
  }

  static verifySigmaProof(opts: {
    publicKey: TwistedEd25519PublicKey;
    sigmaProof: VeiledNormalizationSigmaProof;

    unnormilizedEncryptedBalance: TwistedElGamalCiphertext[];
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
      ...opts.unnormilizedEncryptedBalance.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      ...opts.normalizedEncryptedBalance.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      opts.sigmaProof.X1,
      opts.sigmaProof.X2,
      ...opts.sigmaProof.X3List,
      ...opts.sigmaProof.X4List,
    );
    const alpha1G = RistrettoPoint.BASE.multiply(alpha1LE);
    const alpha2D = opts.unnormilizedEncryptedBalance
      .reduce((acc, { D }, i) => acc.add(D.multiply(2n ** (BigInt(i) * 32n))), RistrettoPoint.ZERO)
      .multiply(alpha2LE);
    const pBlaOld = opts.unnormilizedEncryptedBalance
      .reduce((acc, ciphertext, i) => {
        const chunk = ciphertext.C.multiply(2n ** (BigInt(i) * 32n));
        return acc.add(chunk);
      }, RistrettoPoint.ZERO)
      .multiply(p);

    const alpha3H = H_RISTRETTO.multiply(alpha3LE);
    const pP = RistrettoPoint.fromHex(publicKeyU8).multiply(p);
    const X1 = alpha1G.add(alpha2D).add(pBlaOld);
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
    if (!this.isInitialized) throw new TypeError("VeiledNormalization instance is not initialized");

    if (!this.normalizedEncryptedBalance) throw new TypeError("this.normalizedEncryptedBalance is not defined");

    const rangeProof = await Promise.all(
      amountToChunks(this.balanceAmount, VEILED_BALANCE_CHUNK_SIZE).map((chunk, i) =>
        generateRangeZKP({
          v: chunk,
          r: this.privateKey.toUint8Array(),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          randBase: this.normalizedEncryptedBalance![i].D.toRawBytes(),
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
        verifyRangeZKP({
          proof,
          commitment: opts.normalizedEncryptedBalance[i].C.toRawBytes(),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          randBase: opts.normalizedEncryptedBalance[i].D.toRawBytes(),
        }),
      ),
    );
    return isRangeProofValidations.every((isValid) => isValid);
  }
}
