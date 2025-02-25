import { bytesToNumberLE, concatBytes, numberToBytesLE } from "@noble/curves/abstract/utils";
import { RistrettoPoint } from "@noble/curves/ed25519";
import { utf8ToBytes } from "@noble/hashes/utils";
import { H_RISTRETTO, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";
import { TwistedElGamal, TwistedElGamalCiphertext } from "../twistedElGamal";
import { ed25519GenListOfRandom, ed25519GenRandom, ed25519InvertN, ed25519modN } from "../utils";
import { PROOF_CHUNK_SIZE, SIGMA_PROOF_TRANSFER_SIZE } from "./consts";
import { genFiatShamirChallenge, publicKeyToU8 } from "./helpers";
import { HexInput } from "../../../types";
import { RangeProofExecutor } from "../rangeProof";
import { ConfidentialAmount } from "./confidentialAmount";

export type ConfidentialTransferSigmaProof = {
  alpha1: Uint8Array;
  alpha2: Uint8Array;
  alpha3List: Uint8Array[];
  alpha4List: Uint8Array[];
  alpha5: Uint8Array;
  alpha6List: Uint8Array[];
  X1: Uint8Array;
  X2List: Uint8Array[];
  X3List: Uint8Array[];
  X4List: Uint8Array[];
  X5: Uint8Array;
  X6List: Uint8Array[];
  X7List?: Uint8Array[];
};

export type ConfidentialTransferRangeProof = {
  rangeProofAmount: Uint8Array[];
  rangeProofNewBalance: Uint8Array[];
};

export type CreateConfidentialTransferOpArgs = {
  senderDecryptionKey: TwistedEd25519PrivateKey;
  encryptedActualBalance: TwistedElGamalCiphertext[];
  amountToTransfer: bigint;
  recipientEncryptionKey: TwistedEd25519PublicKey;
  auditorEncryptionKeys?: TwistedEd25519PublicKey[];
  randomness?: bigint[];
};

export class ConfidentialTransfer {
  senderDecryptionKey: TwistedEd25519PrivateKey;

  recipientEncryptionKey: TwistedEd25519PublicKey;

  recipientEncryptionKeyU8: Uint8Array;

  auditorEncryptionKeys: TwistedEd25519PublicKey[];

  auditorsU8EncryptionKeys: Uint8Array[];

  auditorsCBList: TwistedElGamalCiphertext[][];

  encryptedActualBalance: TwistedElGamalCiphertext[];

  confidentialAmountToTransfer: ConfidentialAmount;

  confidentialAmountAfterTransfer: ConfidentialAmount;

  encryptedAmountByRecipient: TwistedElGamalCiphertext[];

  randomness: bigint[];

  constructor(args: {
    senderDecryptionKey: TwistedEd25519PrivateKey;
    recipientEncryptionKey: TwistedEd25519PublicKey;
    recipientEncryptionKeyU8: Uint8Array;
    auditorEncryptionKeys: TwistedEd25519PublicKey[];
    auditorsU8EncryptionKeys: Uint8Array[];
    auditorsCBList: TwistedElGamalCiphertext[][];
    encryptedActualBalance: TwistedElGamalCiphertext[];
    confidentialAmountToTransfer: ConfidentialAmount;
    confidentialAmountAfterTransfer: ConfidentialAmount;
    encryptedAmountByRecipient: TwistedElGamalCiphertext[];
    randomness: bigint[];
  }) {
    this.senderDecryptionKey = args.senderDecryptionKey;
    this.recipientEncryptionKey = args.recipientEncryptionKey;
    this.recipientEncryptionKeyU8 = args.recipientEncryptionKeyU8;
    this.auditorEncryptionKeys = args.auditorEncryptionKeys;
    this.auditorsU8EncryptionKeys = args.auditorsU8EncryptionKeys;
    this.auditorsCBList = args.auditorsCBList;
    this.encryptedActualBalance = args.encryptedActualBalance;
    this.confidentialAmountToTransfer = args.confidentialAmountToTransfer;
    this.confidentialAmountAfterTransfer = args.confidentialAmountAfterTransfer;
    this.encryptedAmountByRecipient = args.encryptedAmountByRecipient;
    this.randomness = args.randomness;
  }

  static async create(args: CreateConfidentialTransferOpArgs) {
    const randomness = args.randomness ?? ed25519GenListOfRandom(ConfidentialAmount.CHUNKS_COUNT);
    const recipientPublicKeyU8 = publicKeyToU8(args.recipientEncryptionKey);

    const confidentialAmountToTransfer = ConfidentialAmount.fromAmount(args.amountToTransfer, {
      chunksCount: ConfidentialAmount.CHUNKS_COUNT / 2,
    });
    const encryptedAmountByRecipient = confidentialAmountToTransfer.amountChunks.map((chunk, i) =>
      TwistedElGamal.encryptWithPK(chunk, new TwistedEd25519PublicKey(recipientPublicKeyU8), randomness[i]),
    );

    const auditorsU8PublicKeys = args.auditorEncryptionKeys?.map((pk) => publicKeyToU8(pk)) ?? [];

    const auditorsCBList =
      args.auditorEncryptionKeys?.map((el) =>
        confidentialAmountToTransfer.amountChunks.map((chunk, i) =>
          TwistedElGamal.encryptWithPK(chunk, el, randomness[i]),
        ),
      ) || [];

    const actualBalance = await ConfidentialAmount.fromEncrypted(args.encryptedActualBalance, args.senderDecryptionKey);

    const confidentialAmountAfterTransfer = ConfidentialAmount.fromAmount(
      actualBalance.amount - confidentialAmountToTransfer.amount,
    );
    confidentialAmountAfterTransfer.encrypt(args.senderDecryptionKey.publicKey(), randomness);

    return new ConfidentialTransfer({
      senderDecryptionKey: args.senderDecryptionKey,
      recipientEncryptionKey: args.recipientEncryptionKey,
      recipientEncryptionKeyU8: recipientPublicKeyU8,
      auditorEncryptionKeys: args.auditorEncryptionKeys ?? [],
      auditorsU8EncryptionKeys: auditorsU8PublicKeys,
      auditorsCBList,
      encryptedActualBalance: args.encryptedActualBalance,
      confidentialAmountToTransfer,
      confidentialAmountAfterTransfer,
      encryptedAmountByRecipient,
      randomness,
    });
  }

  static FIAT_SHAMIR_SIGMA_DST = "AptosConfidentialAsset/TransferProofFiatShamir";

  static serializeSigmaProof(sigmaProof: ConfidentialTransferSigmaProof): Uint8Array {
    return concatBytes(
      sigmaProof.alpha1,
      sigmaProof.alpha2,
      ...sigmaProof.alpha3List,
      ...sigmaProof.alpha4List,
      sigmaProof.alpha5,
      ...sigmaProof.alpha6List,
      sigmaProof.X1,
      ...sigmaProof.X2List,
      ...sigmaProof.X3List,
      ...sigmaProof.X4List,
      sigmaProof.X5,
      ...sigmaProof.X6List,
      ...(sigmaProof.X7List ?? []),
    );
  }

  static deserializeSigmaProof(sigmaProof: Uint8Array): ConfidentialTransferSigmaProof {
    if (sigmaProof.length % PROOF_CHUNK_SIZE !== 0) {
      throw new Error(`Invalid sigma proof length: the length must be a multiple of ${PROOF_CHUNK_SIZE}`);
    }

    if (sigmaProof.length < SIGMA_PROOF_TRANSFER_SIZE) {
      throw new Error(
        `Invalid sigma proof length of confidential transfer: got ${sigmaProof.length}, expected minimum ${SIGMA_PROOF_TRANSFER_SIZE}`,
      );
    }

    const baseProof = sigmaProof.slice(0, SIGMA_PROOF_TRANSFER_SIZE);

    const X7List: Uint8Array[] = [];
    const baseProofArray: Uint8Array[] = [];

    for (let i = 0; i < SIGMA_PROOF_TRANSFER_SIZE; i += PROOF_CHUNK_SIZE) {
      baseProofArray.push(baseProof.subarray(i, i + PROOF_CHUNK_SIZE));
    }

    if (sigmaProof.length > SIGMA_PROOF_TRANSFER_SIZE) {
      const auditorsPartLength = sigmaProof.length - SIGMA_PROOF_TRANSFER_SIZE;
      const auditorsPart = sigmaProof.slice(SIGMA_PROOF_TRANSFER_SIZE);

      for (let i = 0; i < auditorsPartLength; i += PROOF_CHUNK_SIZE) {
        X7List.push(auditorsPart.subarray(i, i + PROOF_CHUNK_SIZE));
      }
    }

    const alpha1 = baseProofArray[0];
    const alpha2 = baseProofArray[1];
    const alpha3List = baseProofArray.slice(2, 2 + ConfidentialAmount.CHUNKS_COUNT);
    const alpha4List = baseProofArray.slice(6, 6 + ConfidentialAmount.CHUNKS_COUNT);
    const alpha5 = baseProofArray[10];
    const alpha6List = baseProofArray.slice(11, 11 + ConfidentialAmount.CHUNKS_COUNT);
    const X1 = baseProofArray[15];
    const X2List = baseProofArray.slice(16, 16 + ConfidentialAmount.CHUNKS_COUNT);
    const X3List = baseProofArray.slice(20, 20 + ConfidentialAmount.CHUNKS_COUNT);
    const X4List = baseProofArray.slice(24, 24 + ConfidentialAmount.CHUNKS_COUNT);
    const X5 = baseProofArray[28];
    const X6List = baseProofArray.slice(29);

    return {
      alpha1,
      alpha2,
      alpha3List,
      alpha4List,
      alpha5,
      alpha6List,
      X1,
      X2List,
      X3List,
      X4List,
      X5,
      X6List,
      X7List,
    };
  }

  async genSigmaProof(): Promise<ConfidentialTransferSigmaProof> {
    if (this.randomness && this.randomness.length !== ConfidentialAmount.CHUNKS_COUNT)
      throw new TypeError("Invalid length list of randomness");

    if (this.confidentialAmountToTransfer.amount > 2n ** (2n * ConfidentialAmount.CHUNK_BITS_BI) - 1n)
      throw new TypeError(`Amount must be less than 2n**${ConfidentialAmount.CHUNK_BITS_BI * 2n}`);

    const senderPKRistretto = RistrettoPoint.fromHex(this.senderDecryptionKey.publicKey().toUint8Array());
    const recipientPKRistretto = RistrettoPoint.fromHex(this.recipientEncryptionKeyU8);

    const senderNewEncryptedBalance = this.confidentialAmountAfterTransfer.amountChunks.map((chunk, i) =>
      TwistedElGamal.encryptWithPK(chunk, this.senderDecryptionKey.publicKey(), this.randomness[i]),
    );

    // Prover selects random x1, x2, x3i[], x4j[], x5, x6i[], where i in {0, 3} and j in {0, 1}
    const i = ConfidentialAmount.CHUNKS_COUNT;
    const j = ConfidentialAmount.CHUNKS_COUNT / 2;

    const x1 = ed25519GenRandom();
    const x2 = ed25519GenRandom();
    const x3List = ed25519GenListOfRandom(i);
    const x4List = ed25519GenListOfRandom(j);
    const x5 = ed25519GenRandom();
    const x6List = ed25519GenListOfRandom(i);

    const DBal = this.encryptedActualBalance.reduce(
      (acc, { D }, idx) => acc.add(D.multiply(2n ** (BigInt(idx) * ConfidentialAmount.CHUNK_BITS_BI))),
      RistrettoPoint.ZERO,
    );
    const DNewBal = senderNewEncryptedBalance.reduce(
      (acc, { D }, idx) => acc.add(D.multiply(2n ** (BigInt(idx) * ConfidentialAmount.CHUNK_BITS_BI))),
      RistrettoPoint.ZERO,
    );

    const lastHalfIndexesOfChunksCount = Array.from(
      { length: ConfidentialAmount.CHUNKS_COUNT / 2 },
      (_, i) => i + ConfidentialAmount.CHUNKS_COUNT / 2,
    );

    const X1 = RistrettoPoint.BASE.multiply(x1)
      .add(DBal.multiply(x2))
      .subtract(DNewBal.multiply(x2))
      .add(
        lastHalfIndexesOfChunksCount.reduce(
          (acc, curr) =>
            acc.add(
              H_RISTRETTO.multiply(x3List[curr]).multiply(2n ** (ConfidentialAmount.CHUNK_BITS_BI * BigInt(curr))),
            ),
          RistrettoPoint.ZERO,
        ),
      )
      .toRawBytes();
    const X2List = x3List.map((x3) => senderPKRistretto.multiply(x3).toRawBytes());
    const X3List = x3List.slice(0, j).map((x3) => recipientPKRistretto.multiply(x3).toRawBytes());
    const X4List = x4List
      .slice(0, j)
      .map((x4, idx) => RistrettoPoint.BASE.multiply(x4).add(H_RISTRETTO.multiply(x3List[idx])).toRawBytes());
    const X5 = H_RISTRETTO.multiply(x5).toRawBytes();
    const X6List = x6List.map((x6, idx) =>
      RistrettoPoint.BASE.multiply(x6).add(H_RISTRETTO.multiply(x3List[idx])).toRawBytes(),
    );

    const X7List =
      this.auditorsU8EncryptionKeys?.map((pk) =>
        x3List.slice(0, j).map((el) => RistrettoPoint.fromHex(pk).multiply(el).toRawBytes()),
      ) ?? [];

    const p = genFiatShamirChallenge(
      utf8ToBytes(ConfidentialTransfer.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      this.senderDecryptionKey.publicKey().toUint8Array(),
      this.recipientEncryptionKeyU8,
      ...this.auditorsU8EncryptionKeys,
      ...this.encryptedActualBalance.map((el) => el.serialize()).flat(),
      ...senderNewEncryptedBalance.map((el) => el.serialize()).flat(),
      ...this.encryptedAmountByRecipient.map((el) => el.serialize()).flat(),
      ...(this.auditorsCBList?.flat()?.map(({ D }) => D.toRawBytes()) ?? []),
      X1,
      ...X2List,
      ...X3List,
      ...X4List,
      X5,
      ...X6List,
      ...X7List.flat(),
    );

    const sLE = bytesToNumberLE(this.senderDecryptionKey.toUint8Array());
    const invertSLE = ed25519InvertN(sLE);

    const alpha1 = ed25519modN(x1 - p * this.confidentialAmountAfterTransfer.amount);
    const alpha2 = ed25519modN(x2 - p * sLE);
    const alpha3List = x3List.map((el, idx) => ed25519modN(BigInt(el) - BigInt(p) * BigInt(this.randomness[idx])));
    const alpha4List = x4List
      .slice(0, j)
      .map((el, idx) => ed25519modN(el - p * this.confidentialAmountToTransfer.amountChunks[idx]));
    const alpha5 = ed25519modN(x5 - p * invertSLE);
    const alpha6List = x6List.map(
      (x6, idx) => ed25519modN(x6 - p * this.confidentialAmountAfterTransfer.amountChunks[idx]),
      ConfidentialAmount.CHUNK_BITS,
    );

    return {
      alpha1: numberToBytesLE(alpha1, 32),
      alpha2: numberToBytesLE(alpha2, 32),
      alpha3List: alpha3List.map((a) => numberToBytesLE(a, 32)),
      alpha4List: alpha4List.map((a) => numberToBytesLE(a, 32)),
      alpha5: numberToBytesLE(alpha5, 32),
      alpha6List: alpha6List.map((a) => numberToBytesLE(a, 32)),
      X1,
      X2List,
      X3List,
      X4List,
      X5,
      X6List,
      X7List: X7List.flat(),
    };
  }

  static verifySigmaProof(opts: {
    senderPrivateKey: TwistedEd25519PrivateKey;
    recipientPublicKey: TwistedEd25519PublicKey;
    encryptedActualBalance: TwistedElGamalCiphertext[];
    encryptedActualBalanceAfterTransfer: TwistedElGamalCiphertext[];
    encryptedTransferAmountByRecipient: TwistedElGamalCiphertext[];
    sigmaProof: ConfidentialTransferSigmaProof;
    auditors?: {
      publicKeys: (TwistedEd25519PublicKey | HexInput)[];
      // decryptionKeys: HexInput[][];
      auditorsCBList: TwistedElGamalCiphertext[][];
    };
  }): boolean {
    const auditorPKs = opts?.auditors?.publicKeys.map((pk) => publicKeyToU8(pk)) ?? [];
    // const auditorDecryptionKeys =
    //   opts?.auditors?.decryptionKeys.map((arr) => arr.map((key) => Hex.fromHexInput(key).toUint8Array())) ?? [];
    const proofX7List = opts.sigmaProof.X7List ?? [];

    const alpha1LE = bytesToNumberLE(opts.sigmaProof.alpha1);
    const alpha2LE = bytesToNumberLE(opts.sigmaProof.alpha2);
    const alpha3LEList = opts.sigmaProof.alpha3List.map((a) => bytesToNumberLE(a));
    const alpha4LEList = opts.sigmaProof.alpha4List.map((a) => bytesToNumberLE(a));
    const alpha5LE = bytesToNumberLE(opts.sigmaProof.alpha5);
    const alpha6LEList = opts.sigmaProof.alpha6List.map((a) => bytesToNumberLE(a));

    const senderPublicKeyU8 = publicKeyToU8(opts.senderPrivateKey.publicKey());
    const recipientPublicKeyU8 = publicKeyToU8(opts.recipientPublicKey);
    const senderPKRistretto = RistrettoPoint.fromHex(senderPublicKeyU8);
    const recipientPKRistretto = RistrettoPoint.fromHex(recipientPublicKeyU8);

    const p = genFiatShamirChallenge(
      utf8ToBytes(ConfidentialTransfer.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      senderPublicKeyU8,
      recipientPublicKeyU8,
      ...auditorPKs,
      ...opts.encryptedActualBalance.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      ...opts.encryptedActualBalanceAfterTransfer.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      ...opts.encryptedTransferAmountByRecipient.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
      // ...auditorDecryptionKeys.flat(),
      ...(opts.auditors?.auditorsCBList?.flat().map(({ D }) => D.toRawBytes()) || []),
      opts.sigmaProof.X1,
      ...opts.sigmaProof.X2List,
      ...opts.sigmaProof.X3List,
      ...opts.sigmaProof.X4List,
      opts.sigmaProof.X5,
      ...opts.sigmaProof.X6List,
      ...proofX7List,
    );

    const alpha1G = RistrettoPoint.BASE.multiply(alpha1LE);

    const { oldDSum, oldCSum } = opts.encryptedActualBalance.reduce(
      (acc, { C, D }, i) => {
        const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
        return {
          oldDSum: acc.oldDSum.add(D.multiply(coef)),
          oldCSum: acc.oldCSum.add(C.multiply(coef)),
        };
      },
      { oldDSum: RistrettoPoint.ZERO, oldCSum: RistrettoPoint.ZERO },
    );

    const newDSum = opts.encryptedActualBalanceAfterTransfer.reduce((acc, { D }, i) => {
      const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
      return acc.add(D.multiply(coef));
    }, RistrettoPoint.ZERO);

    const j = ConfidentialAmount.CHUNKS_COUNT / 2;

    const lastHalfIndexesOfChunksCount = Array.from(
      { length: ConfidentialAmount.CHUNKS_COUNT / 2 },
      (_, i) => i + ConfidentialAmount.CHUNKS_COUNT / 2,
    );

    const amountCSum = opts.encryptedTransferAmountByRecipient.slice(0, j).reduce((acc, { C }, i) => {
      const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
      return acc.add(C.multiply(coef));
    }, RistrettoPoint.ZERO);

    const X1 = alpha1G
      .add(oldDSum.multiply(alpha2LE))
      .subtract(newDSum.multiply(alpha2LE))
      .add(
        lastHalfIndexesOfChunksCount.reduce(
          (acc, curr) =>
            acc.add(
              H_RISTRETTO.multiply(alpha3LEList[curr]).multiply(
                2n ** (ConfidentialAmount.CHUNK_BITS_BI * BigInt(curr)),
              ),
            ),
          RistrettoPoint.ZERO,
        ),
      )
      .add(oldCSum.multiply(p))
      .subtract(amountCSum.multiply(p));
    const X2List = alpha3LEList.map((a3, i) =>
      senderPKRistretto.multiply(a3).add(opts.encryptedActualBalanceAfterTransfer[i].D.multiply(p)),
    );
    const X3List = alpha3LEList
      .slice(0, j)
      .map((a3, i) => recipientPKRistretto.multiply(a3).add(opts.encryptedTransferAmountByRecipient[i].D.multiply(p)));
    const X4List = alpha4LEList.slice(0, j).map((a4, i) => {
      const a4G = RistrettoPoint.BASE.multiply(a4);
      const a3H = H_RISTRETTO.multiply(alpha3LEList[i]);
      const pC = opts.encryptedTransferAmountByRecipient[i].C.multiply(p);
      return a4G.add(a3H).add(pC);
    });
    const X5 = H_RISTRETTO.multiply(alpha5LE).add(senderPKRistretto.multiply(p));
    const X6List = alpha6LEList.map((a6, i) => {
      const aG = RistrettoPoint.BASE.multiply(a6);
      const aH = H_RISTRETTO.multiply(alpha3LEList[i]);
      const pC = opts.encryptedActualBalanceAfterTransfer[i].C.multiply(p);
      return aG.add(aH).add(pC);
    });
    const X7List = auditorPKs.map((auPk, auPubKIdx) =>
      alpha3LEList
        .slice(0, j)
        .map((a3, idxJ) =>
          RistrettoPoint.fromHex(auPk)
            .multiply(a3)
            .add(RistrettoPoint.fromHex(opts.auditors!.auditorsCBList[auPubKIdx][idxJ].D.toRawBytes()).multiply(p)),
        ),
    );

    return (
      X1.equals(RistrettoPoint.fromHex(opts.sigmaProof.X1)) &&
      X2List.every((X2, i) => X2.equals(RistrettoPoint.fromHex(opts.sigmaProof.X2List[i]))) &&
      X3List.every((X3, i) => X3.equals(RistrettoPoint.fromHex(opts.sigmaProof.X3List[i]))) &&
      X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(opts.sigmaProof.X4List[i]))) &&
      X5.equals(RistrettoPoint.fromHex(opts.sigmaProof.X5)) &&
      X6List.every((X6, i) => X6.equals(RistrettoPoint.fromHex(opts.sigmaProof.X6List[i]))) &&
      X7List.flat().every((X7, i) => X7.equals(RistrettoPoint.fromHex(proofX7List[i])))
    );
  }

  async genRangeProof(): Promise<ConfidentialTransferRangeProof> {
    const rangeProofAmountPromise = Promise.all(
      this.confidentialAmountToTransfer.amountChunks.map((chunk, i) =>
        RangeProofExecutor.generateRangeZKP({
          v: chunk,
          r: numberToBytesLE(this.randomness[i], 32),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          randBase: H_RISTRETTO.toRawBytes(),
          bits: ConfidentialAmount.CHUNK_BITS,
        }),
      ),
    );

    const rangeProofNewBalancePromise = Promise.all(
      this.confidentialAmountAfterTransfer.amountChunks.map((chunk, i) =>
        RangeProofExecutor.generateRangeZKP({
          v: chunk,
          r: numberToBytesLE(this.randomness[i], 32),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          randBase: H_RISTRETTO.toRawBytes(),
          bits: ConfidentialAmount.CHUNK_BITS,
        }),
      ),
    );

    const [rangeProofAmount, rangeProofNewBalance] = await Promise.all([
      rangeProofAmountPromise,
      rangeProofNewBalancePromise,
    ]);

    return {
      rangeProofAmount: rangeProofAmount.map((proof) => proof.proof),
      rangeProofNewBalance: rangeProofNewBalance.map((proof) => proof.proof),
    };
  }

  async authorizeTransfer(): Promise<
    [
      { sigmaProof: ConfidentialTransferSigmaProof; rangeProof: ConfidentialTransferRangeProof },
      TwistedElGamalCiphertext[],
      TwistedElGamalCiphertext[],
      TwistedElGamalCiphertext[][],
    ]
  > {
    const sigmaProof = await this.genSigmaProof();

    const rangeProof = await this.genRangeProof();

    if (!this.confidentialAmountAfterTransfer?.amountEncrypted)
      throw new TypeError("this.confidentialAmountAfterTransfer.encryptedAmount is not defined");

    return [
      {
        sigmaProof,
        rangeProof,
      },
      this.confidentialAmountAfterTransfer.amountEncrypted,
      this.encryptedAmountByRecipient,
      this.auditorsCBList,
    ];
  }

  static async verifyRangeProof(opts: {
    encryptedAmountByRecipient: TwistedElGamalCiphertext[];
    encryptedActualBalanceAfterTransfer: TwistedElGamalCiphertext[];
    rangeProofAmount: Uint8Array[];
    rangeProofNewBalance: Uint8Array[];
  }) {
    const rangeProofsValidations = await Promise.all([
      ...opts.rangeProofAmount.map((proof, i) =>
        RangeProofExecutor.verifyRangeZKP({
          proof,
          commitment: opts.encryptedAmountByRecipient[i].C.toRawBytes(),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          randBase: H_RISTRETTO.toRawBytes(),
          bits: ConfidentialAmount.CHUNK_BITS,
        }),
      ),
      ...opts.rangeProofNewBalance.map((proof, i) =>
        RangeProofExecutor.verifyRangeZKP({
          proof,
          commitment: opts.encryptedActualBalanceAfterTransfer[i].C.toRawBytes(),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          // randBase: opts.encryptedActualBalanceAfterTransfer[i].D.toRawBytes(),
          randBase: H_RISTRETTO.toRawBytes(),
          bits: ConfidentialAmount.CHUNK_BITS,
        }),
      ),
    ]);

    return rangeProofsValidations.every((isValid) => isValid);
  }
}
