import { bytesToNumberLE, concatBytes, numberToBytesLE } from "@noble/curves/abstract/utils";
import { RistrettoPoint } from "@noble/curves/ed25519";
import { utf8ToBytes } from "@noble/hashes/utils";
import { amountToChunks, chunksToAmount, genFiatShamirChallenge, publicKeyToU8 } from "./helpers";
import { H_RISTRETTO, TwistedEd25519PrivateKey } from "../twistedEd25519";
import { TwistedElGamal, TwistedElGamalCiphertext } from "../twistedElGamal";
import { CHUNK_BITS_BI, PROOF_CHUNK_SIZE, SIGMA_PROOF_WITHDRAW_SIZE, VEILED_BALANCE_CHUNK_SIZE } from "./consts";
import { ed25519GenListOfRandom, ed25519GenRandom, ed25519InvertN, ed25519modN } from "../utils";
import { generateRangeZKP, verifyRangeZKP } from "./rangeProof";

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

export class VeiledWithdraw {
  isInitialized = false;

  twistedEd25519PublicKey: TwistedEd25519PrivateKey;

  encryptedActualBalance: TwistedElGamalCiphertext[];

  amountToWithdraw: bigint;

  balanceAfterWithdraw?: bigint;

  encryptedActualBalanceAfterWithdraw?: TwistedElGamalCiphertext[];

  randomness: bigint[];

  constructor(
    twistedEd25519PublicKey: TwistedEd25519PrivateKey,
    encryptedActualBalance: TwistedElGamalCiphertext[],
    amountToWithdraw: bigint,
    randomness?: bigint[],
  ) {
    this.twistedEd25519PublicKey = twistedEd25519PublicKey;
    this.encryptedActualBalance = encryptedActualBalance;
    this.amountToWithdraw = amountToWithdraw;

    this.randomness = randomness ?? ed25519GenListOfRandom();
  }

  static FIAT_SHAMIR_SIGMA_DST = "AptosVeiledCoin/WithdrawalSubproofFiatShamir";

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
    if (!this.isInitialized) throw new TypeError("VeiledWithdraw is not initialized");

    const decryptedBalanceChunks = await Promise.all(
      this.encryptedActualBalance.map((el) =>
        TwistedElGamal.decryptWithPK(el, this.twistedEd25519PublicKey, {
          // FIXME: mocked, should be removed, once algo is ready
          start: 0n,
          end: 1000n,
        }),
      ),
    );

    const decryptedBalance = chunksToAmount(decryptedBalanceChunks);

    this.balanceAfterWithdraw = decryptedBalance - this.amountToWithdraw;

    const chunkedBalanceAfterWithdraw = amountToChunks(this.balanceAfterWithdraw, VEILED_BALANCE_CHUNK_SIZE);
    this.encryptedActualBalanceAfterWithdraw = chunkedBalanceAfterWithdraw.map((chunk, i) =>
      TwistedElGamal.encryptWithPK(chunk, this.twistedEd25519PublicKey.publicKey(), this.randomness[i]),
    );

    this.isInitialized = true;
  }

  async genSigmaProof(): Promise<VeiledWithdrawSigmaProof> {
    if (this.randomness && this.randomness.length !== VEILED_BALANCE_CHUNK_SIZE) {
      throw new Error("Invalid length list of randomness");
    }

    const chunkedAmountToWithdraw = amountToChunks(this.amountToWithdraw, 2);

    const chunkedBalanceAfterWithdraw = amountToChunks(this.balanceAfterWithdraw!, VEILED_BALANCE_CHUNK_SIZE);

    const x1 = ed25519GenRandom();
    const x2 = ed25519GenRandom();
    const x3 = ed25519GenRandom();

    const x4List = ed25519GenListOfRandom();
    const x5List = ed25519GenListOfRandom();

    const X1 = RistrettoPoint.BASE.multiply(x1).add(
      this.encryptedActualBalance
        .reduce((acc, ciphertext, i) => acc.add(ciphertext.D.multiply(2n ** (BigInt(i) * 32n))), RistrettoPoint.ZERO)
        .multiply(x2),
    );
    const X2 = H_RISTRETTO.multiply(x3);
    const X3List = x4List.map((item, index) =>
      RistrettoPoint.BASE.multiply(item).add(H_RISTRETTO.multiply(x5List[index])).toRawBytes(),
    );
    const X4List = x5List.map((item) =>
      RistrettoPoint.fromHex(this.twistedEd25519PublicKey.publicKey().toUint8Array()).multiply(item).toRawBytes(),
    );

    const p = genFiatShamirChallenge(
      utf8ToBytes(VeiledWithdraw.FIAT_SHAMIR_SIGMA_DST),
      ...chunkedAmountToWithdraw.map((a) => numberToBytesLE(a, 32)),
      this.twistedEd25519PublicKey.publicKey().toUint8Array(),
      ...this.encryptedActualBalance.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      X1.toRawBytes(),
      X2.toRawBytes(),
      ...X3List,
      ...X4List,
    );

    const sLE = bytesToNumberLE(this.twistedEd25519PublicKey.toUint8Array());
    const invertSLE = ed25519InvertN(sLE);

    const pt = ed25519modN(p * this.balanceAfterWithdraw!);
    const ps = ed25519modN(p * sLE);
    const psInvert = ed25519modN(p * invertSLE);

    const alpha1 = ed25519modN(x1 - pt);
    const alpha2 = ed25519modN(x2 - ps);
    const alpha3 = ed25519modN(x3 - psInvert);
    const alpha4List = x4List.map((x4, i) => {
      const pChunk = ed25519modN(p * chunkedBalanceAfterWithdraw[i]);
      return numberToBytesLE(ed25519modN(x4 - pChunk), 32);
    });
    const alpha5List = x5List.map((x5, i) => {
      const pRand = ed25519modN(p * this.randomness[i]);
      return numberToBytesLE(ed25519modN(x5 - pRand), 32);
    });

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

  verifySigmaProof(sigmaProof: VeiledWithdrawSigmaProof): boolean {
    if (!this.encryptedActualBalanceAfterWithdraw) throw new TypeError("Encrypted balance after withdraw is not set");

    const publicKeyU8 = publicKeyToU8(this.twistedEd25519PublicKey.publicKey());
    const chunkedAmount = amountToChunks(this.amountToWithdraw, 2);

    const alpha1LE = bytesToNumberLE(sigmaProof.alpha1);
    const alpha2LE = bytesToNumberLE(sigmaProof.alpha2);
    const alpha3LE = bytesToNumberLE(sigmaProof.alpha3);
    const alpha4LEList = sigmaProof.alpha4List.map((a) => bytesToNumberLE(a));
    const alpha5LEList = sigmaProof.alpha5List.map((a) => bytesToNumberLE(a));

    const p = genFiatShamirChallenge(
      utf8ToBytes(VeiledWithdraw.FIAT_SHAMIR_SIGMA_DST),
      ...chunkedAmount.map((a) => numberToBytesLE(a, 32)),
      publicKeyU8,
      ...this.encryptedActualBalance.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      sigmaProof.X1,
      sigmaProof.X2,
      ...sigmaProof.X3List,
      ...sigmaProof.X4List,
    );

    const alpha1G = RistrettoPoint.BASE.multiply(alpha1LE);
    const { DOldSum, COldSum } = this.encryptedActualBalance.reduce(
      (acc, { C, D }, i) => {
        const coef = 2n ** (BigInt(i) * CHUNK_BITS_BI);
        return {
          DOldSum: acc.DOldSum.add(D.multiply(coef)),
          COldSum: acc.COldSum.add(C.multiply(coef)),
        };
      },
      { DOldSum: RistrettoPoint.ZERO, COldSum: RistrettoPoint.ZERO },
    );
    const alpha2DOld = DOldSum.multiply(alpha2LE);
    const amountG = RistrettoPoint.BASE.multiply(this.amountToWithdraw);

    const alpha3H = H_RISTRETTO.multiply(alpha3LE);
    const pP = RistrettoPoint.fromHex(publicKeyU8).multiply(p);

    const X1 = alpha1G.add(alpha2DOld).add(COldSum.subtract(amountG).multiply(p));
    const X2 = alpha3H.add(pP);

    // FIXME: this.encryptedActualBalanceAfterWithdraw ts server not responding
    const X3List = alpha4LEList.map((a, i) => {
      const aG = RistrettoPoint.BASE.multiply(a);
      const aH = H_RISTRETTO.multiply(alpha5LEList[i]);
      const pC = this.encryptedActualBalanceAfterWithdraw![i].C.multiply(p);
      return aG.add(aH).add(pC);
    });
    const X4List = alpha5LEList.map((a, i) =>
      RistrettoPoint.fromHex(publicKeyU8).multiply(a).add(this.encryptedActualBalanceAfterWithdraw![i].D.multiply(p)),
    );

    return (
      X1.equals(RistrettoPoint.fromHex(sigmaProof.X1)) &&
      X2.equals(RistrettoPoint.fromHex(sigmaProof.X2)) &&
      X3List.every((X3, i) => X3.equals(RistrettoPoint.fromHex(sigmaProof.X3List[i]))) &&
      X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(sigmaProof.X4List[i])))
    );
  }

  async genRangeProof() {
    if (!this.isInitialized) throw new TypeError("VeiledWithdraw is not initialized");

    if (!this.balanceAfterWithdraw) throw new TypeError("this.balanceAfterWithdraw is not set");

    if (!this.encryptedActualBalanceAfterWithdraw)
      throw new TypeError("this.encryptedActualBalanceAfterWithdraw is not set");

    const rangeProof = await Promise.all(
      amountToChunks(this.balanceAfterWithdraw!, VEILED_BALANCE_CHUNK_SIZE).map((chunk, i) =>
        generateRangeZKP({
          v: chunk,
          r: this.twistedEd25519PublicKey.toUint8Array(),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          randBase: this.encryptedActualBalanceAfterWithdraw![i].D.toRawBytes(),
        }),
      ),
    );

    return rangeProof.map((el) => el.proof);
  }

  async verifyRangeProof(rangeProof: Uint8Array[]) {
    if (!this.encryptedActualBalanceAfterWithdraw)
      throw new TypeError("this.encryptedActualBalanceAfterWithdraw is not set");

    const rangeProofVerificationResults = await Promise.all(
      rangeProof.map((proof, i) =>
        verifyRangeZKP({
          proof,
          // commitment: opts.newEncryptedBalance[i].C.toRawBytes(),
          commitment: this.encryptedActualBalanceAfterWithdraw![i].C.toRawBytes(),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          randBase: this.encryptedActualBalanceAfterWithdraw![i].D.toRawBytes(),
        }),
      ),
    );

    return rangeProofVerificationResults.every((isValid) => isValid);
  }
}
