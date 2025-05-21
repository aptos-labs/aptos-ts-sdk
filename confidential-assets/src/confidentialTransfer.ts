import { bytesToNumberLE, concatBytes, numberToBytesLE } from "@noble/curves/abstract/utils";
import { RistrettoPoint } from "@noble/curves/ed25519";
import { utf8ToBytes } from "@noble/hashes/utils";
import { PROOF_CHUNK_SIZE, SIGMA_PROOF_TRANSFER_SIZE } from "./consts";
import { genFiatShamirChallenge, publicKeyToU8 } from "./helpers";
import { ConfidentialAmount } from "./confidentialAmount";
import { HexInput } from "@aptos-labs/ts-sdk";
import { RangeProofExecutor } from "./rangeProof";
import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey, H_RISTRETTO } from "./twistedEd25519";
import { TwistedElGamalCiphertext, TwistedElGamal } from "./twistedElGamal";
import { ed25519GenListOfRandom, ed25519GenRandom, ed25519modN, ed25519InvertN } from "./utils";

export type ConfidentialTransferSigmaProof = {
  alpha1List: Uint8Array[];
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
  X8List: Uint8Array[];
};

export type ConfidentialTransferRangeProof = {
  rangeProofAmount: Uint8Array;
  rangeProofNewBalance: Uint8Array;
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

  newBalanceRandomness: bigint[];

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
    newBalanceRandomness: bigint[];
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
    this.newBalanceRandomness = args.newBalanceRandomness;
  }

  static async create(args: CreateConfidentialTransferOpArgs) {
    const randomness = args.randomness ?? ed25519GenListOfRandom(ConfidentialAmount.CHUNKS_COUNT);
    const newBalanceRandomness = ed25519GenListOfRandom(ConfidentialAmount.CHUNKS_COUNT);
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
      newBalanceRandomness,
    });
  }

  static FIAT_SHAMIR_SIGMA_DST = "AptosConfidentialAsset/TransferProofFiatShamir";

  static serializeSigmaProof(sigmaProof: ConfidentialTransferSigmaProof): Uint8Array {
    return concatBytes(
      ...sigmaProof.alpha1List,
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
      ...sigmaProof.X8List,
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

    const half = ConfidentialAmount.CHUNKS_COUNT / 2;

    const alpha1List = baseProofArray.slice(0, half);
    const alpha2 = baseProofArray[half];
    const alpha3List = baseProofArray.slice(half + 1, half + 1 + ConfidentialAmount.CHUNKS_COUNT);
    const alpha4List = baseProofArray.slice(
      half + 1 + ConfidentialAmount.CHUNKS_COUNT,
      half + 1 + ConfidentialAmount.CHUNKS_COUNT + ConfidentialAmount.CHUNKS_COUNT,
    );
    const alpha5 = baseProofArray[half + 1 + ConfidentialAmount.CHUNKS_COUNT + ConfidentialAmount.CHUNKS_COUNT];
    const alpha6List = baseProofArray.slice(
      half + 1 + ConfidentialAmount.CHUNKS_COUNT + ConfidentialAmount.CHUNKS_COUNT + 1,
      half + 1 + ConfidentialAmount.CHUNKS_COUNT * 2 + 1,
    );

    const X1 = baseProofArray[half + 1 + ConfidentialAmount.CHUNKS_COUNT * 2 + 1];
    const X2List = baseProofArray.slice(
      half + 1 + ConfidentialAmount.CHUNKS_COUNT * 2 + 1 + 1,
      half + 1 + ConfidentialAmount.CHUNKS_COUNT * 3 + 1,
    );
    const X3List = baseProofArray.slice(
      half + 1 + ConfidentialAmount.CHUNKS_COUNT * 3 + 1,
      half + 1 + ConfidentialAmount.CHUNKS_COUNT * 4 + 1,
    );
    const X4List = baseProofArray.slice(
      half + 1 + ConfidentialAmount.CHUNKS_COUNT * 4 + 1,
      half + 1 + ConfidentialAmount.CHUNKS_COUNT * 5 + 1,
    );
    const X5 = baseProofArray[half + 1 + ConfidentialAmount.CHUNKS_COUNT * 5 + 1];
    const X6List = baseProofArray.slice(
      half + 1 + ConfidentialAmount.CHUNKS_COUNT * 5 + 1 + 1,
      half + 1 + ConfidentialAmount.CHUNKS_COUNT * 6 + 1,
    );
    const X8List = baseProofArray.slice(
      half + 1 + ConfidentialAmount.CHUNKS_COUNT * 6 + 1,
      half + 1 + ConfidentialAmount.CHUNKS_COUNT * 7 + 1,
    );

    return {
      alpha1List,
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
      X8List,
    };
  }

  async genSigmaProof(): Promise<ConfidentialTransferSigmaProof> {
    if (this.randomness && this.randomness.length !== ConfidentialAmount.CHUNKS_COUNT)
      throw new TypeError("Invalid length list of randomness");

    if (this.confidentialAmountToTransfer.amount > 2n ** (2n * ConfidentialAmount.CHUNK_BITS_BI) - 1n)
      throw new TypeError(`Amount must be less than 2n**${ConfidentialAmount.CHUNK_BITS_BI * 2n}`);

    const senderPKRistretto = RistrettoPoint.fromHex(this.senderDecryptionKey.publicKey().toUint8Array());
    const recipientPKRistretto = RistrettoPoint.fromHex(this.recipientEncryptionKeyU8);

    // Prover selects random x1, x2, x3i[], x4j[], x5, x6i[], where i in {0, 3} and j in {0, 1}
    const i = ConfidentialAmount.CHUNKS_COUNT;
    const j = ConfidentialAmount.CHUNKS_COUNT / 2;

    const x1List = ed25519GenListOfRandom(i);
    const x2 = ed25519GenRandom();
    const x3List = ed25519GenListOfRandom(j);
    const x4List = ed25519GenListOfRandom(j);
    const x5 = ed25519GenRandom();
    const x6List = ed25519GenListOfRandom(i);

    // const lastHalfIndexesOfChunksCount = Array.from(
    //   { length: ConfidentialAmount.CHUNKS_COUNT / 2 },
    //   // eslint-disable-next-line @typescript-eslint/no-shadow
    //   (_, i) => i + ConfidentialAmount.CHUNKS_COUNT / 2,
    // );

    const X1 = RistrettoPoint.BASE.multiply(
      ed25519modN(
        x1List.reduce((acc, el, i) => {
          const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
          const x1i = el * coef;

          return acc + x1i;
        }, 0n),
      ),
    )
      .add(
        H_RISTRETTO.multiply(
          ed25519modN(
            x6List.reduce((acc, el, i) => {
              const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
              const x6i = el * coef;

              return acc + x6i;
            }, 0n),
          ),
        ).subtract(
          H_RISTRETTO.multiply(
            ed25519modN(
              x3List.reduce((acc, el, i) => {
                const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
                const x3i = el * coef;

                return acc + x3i;
              }, 0n),
            ),
          ),
        ),
      )
      .add(
        this.encryptedActualBalance
          .reduce(
            (acc, { D }, idx) => acc.add(D.multiply(2n ** (BigInt(idx) * ConfidentialAmount.CHUNK_BITS_BI))),
            RistrettoPoint.ZERO,
          )
          .multiply(x2),
      )
      .subtract(
        this.confidentialAmountAfterTransfer
          .getAmountEncrypted(this.senderDecryptionKey.publicKey(), this.newBalanceRandomness)
          .reduce(
            (acc, { D }, idx) => acc.add(D.multiply(2n ** (BigInt(idx) * ConfidentialAmount.CHUNK_BITS_BI))),
            RistrettoPoint.ZERO,
          )
          .multiply(x2),
      )
      // .add(
      //   lastHalfIndexesOfChunksCount.reduce(
      //     (acc, curr) =>
      //       acc.add(
      //         H_RISTRETTO.multiply(x3List[curr]).multiply(2n ** (ConfidentialAmount.CHUNK_BITS_BI * BigInt(curr))),
      //       ),
      //     RistrettoPoint.ZERO,
      //   ),
      // )
      .toRawBytes();
    const X2List = x6List.map((el) => senderPKRistretto.multiply(el).toRawBytes());
    const X3List = x3List.slice(0, j).map((x3) => recipientPKRistretto.multiply(x3).toRawBytes());
    const X4List = x4List
      .slice(0, j)
      .map((x4, idx) => RistrettoPoint.BASE.multiply(x4).add(H_RISTRETTO.multiply(x3List[idx])).toRawBytes());
    const X5 = H_RISTRETTO.multiply(x5).toRawBytes();
    const X6List = x1List.map((el, idx) => {
      const x1iG = RistrettoPoint.BASE.multiply(el);
      const x6iH = H_RISTRETTO.multiply(x6List[idx]);

      return x1iG.add(x6iH).toRawBytes();
    });
    const X7List =
      this.auditorsU8EncryptionKeys?.map((pk) =>
        x3List.slice(0, j).map((el) => RistrettoPoint.fromHex(pk).multiply(el).toRawBytes()),
      ) ?? [];
    const X8List = x3List.map((el) => senderPKRistretto.multiply(el).toRawBytes());

    const p = genFiatShamirChallenge(
      utf8ToBytes(ConfidentialTransfer.FIAT_SHAMIR_SIGMA_DST),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      this.senderDecryptionKey.publicKey().toUint8Array(),
      this.recipientEncryptionKeyU8,
      ...this.auditorsU8EncryptionKeys,
      ...this.encryptedActualBalance.map((el) => el.serialize()).flat(),
      ...this.encryptedAmountByRecipient.map((el) => el.serialize()).flat(),
      ...(this.auditorsCBList?.flat()?.map(({ D }) => D.toRawBytes()) ?? []),
      ...this.confidentialAmountToTransfer
        .getAmountEncrypted(this.senderDecryptionKey.publicKey(), this.randomness)
        .map(({ D }) => D.toRawBytes())
        .flat(),
      ...this.confidentialAmountAfterTransfer
        .getAmountEncrypted(this.senderDecryptionKey.publicKey(), this.newBalanceRandomness)
        .map((el) => el.serialize())
        .flat(),
      X1,
      ...X2List,
      ...X3List,
      ...X4List,
      X5,
      ...X6List,
      ...X7List.flat(),
      ...X8List,
    );

    const sLE = bytesToNumberLE(this.senderDecryptionKey.toUint8Array());
    const invertSLE = ed25519InvertN(sLE);

    const alpha1List = x1List.map((x1, idx) =>
      ed25519modN(x1 - ed25519modN(p * this.confidentialAmountAfterTransfer.amountChunks[idx])),
    );
    const alpha2 = ed25519modN(x2 - p * sLE);
    const alpha3List = x3List.map((el, idx) => ed25519modN(BigInt(el) - p * BigInt(this.randomness[idx])));
    const alpha4List = x4List
      .slice(0, j)
      .map((el, idx) => ed25519modN(el - p * this.confidentialAmountToTransfer.amountChunks[idx]));
    const alpha5 = ed25519modN(x5 - p * invertSLE);
    const alpha6List = x6List.map((el, idx) => ed25519modN(el - p * this.newBalanceRandomness[idx]));

    return {
      alpha1List: alpha1List.map((a) => numberToBytesLE(a, 32)),
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
      X8List,
    };
  }

  static verifySigmaProof(opts: {
    senderPrivateKey: TwistedEd25519PrivateKey;
    recipientPublicKey: TwistedEd25519PublicKey;
    encryptedActualBalance: TwistedElGamalCiphertext[];
    encryptedActualBalanceAfterTransfer: TwistedElGamalCiphertext[];
    encryptedTransferAmountByRecipient: TwistedElGamalCiphertext[];
    encryptedTransferAmountBySender: TwistedElGamalCiphertext[];
    sigmaProof: ConfidentialTransferSigmaProof;
    auditors?: {
      publicKeys: (TwistedEd25519PublicKey | HexInput)[];
      auditorsCBList: TwistedElGamalCiphertext[][];
    };
  }): boolean {
    const auditorPKs = opts?.auditors?.publicKeys.map((pk) => publicKeyToU8(pk)) ?? [];
    const proofX7List = opts.sigmaProof.X7List ?? [];

    const alpha1LEList = opts.sigmaProof.alpha1List.map((a) => bytesToNumberLE(a));
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
      ...opts.encryptedActualBalance.map((el) => el.serialize()).flat(),
      ...opts.encryptedTransferAmountByRecipient.map((el) => el.serialize()).flat(),
      ...(opts.auditors?.auditorsCBList?.flat().map(({ D }) => D.toRawBytes()) || []),
      ...opts.encryptedTransferAmountBySender.map(({ D }) => D.toRawBytes()).flat(),
      ...opts.encryptedActualBalanceAfterTransfer.map((el) => el.serialize()).flat(),
      opts.sigmaProof.X1,
      ...opts.sigmaProof.X2List,
      ...opts.sigmaProof.X3List,
      ...opts.sigmaProof.X4List,
      opts.sigmaProof.X5,
      ...opts.sigmaProof.X6List,
      ...proofX7List,
      ...opts.sigmaProof.X8List,
    );

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

    // const lastHalfIndexesOfChunksCount = Array.from(
    //   { length: ConfidentialAmount.CHUNKS_COUNT / 2 },
    //   (_, i) => i + ConfidentialAmount.CHUNKS_COUNT / 2,
    // );

    const amountCSum = opts.encryptedTransferAmountByRecipient.slice(0, j).reduce((acc, { C }, i) => {
      const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
      return acc.add(C.multiply(coef));
    }, RistrettoPoint.ZERO);

    const X1 = RistrettoPoint.BASE.multiply(
      ed25519modN(
        alpha1LEList.reduce((acc, curr, i) => {
          const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
          const a1i = curr * coef;

          return acc + a1i;
        }, 0n),
      ),
    )
      .add(
        H_RISTRETTO.multiply(
          ed25519modN(
            alpha6LEList.reduce((acc, el, i) => {
              const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
              const a6i = el * coef;

              return acc + a6i;
            }, 0n),
          ),
        ).subtract(
          H_RISTRETTO.multiply(
            ed25519modN(
              alpha3LEList.reduce((acc, el, i) => {
                const coef = 2n ** (BigInt(i) * ConfidentialAmount.CHUNK_BITS_BI);
                const a3i = el * coef;

                return acc + a3i;
              }, 0n),
            ),
          ),
        ),
      )
      .add(oldDSum.multiply(alpha2LE))
      .subtract(newDSum.multiply(alpha2LE))
      .add(oldCSum.multiply(p))
      .subtract(amountCSum.multiply(p));
    // .add(
    //   lastHalfIndexesOfChunksCount.reduce(
    //     (acc, curr) =>
    //       acc.add(
    //         H_RISTRETTO.multiply(alpha3LEList[curr]).multiply(
    //           2n ** (ConfidentialAmount.CHUNK_BITS_BI * BigInt(curr)),
    //         ),
    //       ),
    //     RistrettoPoint.ZERO,
    //   ),
    // )
    const X2List = alpha6LEList.map((el, i) =>
      senderPKRistretto.multiply(el).add(opts.encryptedActualBalanceAfterTransfer[i].D.multiply(p)),
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
    const X6List = alpha1LEList.map((el, i) => {
      const a1iG = RistrettoPoint.BASE.multiply(el);
      const a6iH = H_RISTRETTO.multiply(alpha6LEList[i]);
      const pC = opts.encryptedActualBalanceAfterTransfer[i].C.multiply(p);
      return a1iG.add(a6iH).add(pC);
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
    const X8List = alpha3LEList.map((el, i) => {
      const a3P = senderPKRistretto.multiply(el);
      const pD = opts.encryptedTransferAmountBySender[i].D.multiply(p);
      return a3P.add(pD);
    });

    return (
      X1.equals(RistrettoPoint.fromHex(opts.sigmaProof.X1)) &&
      X2List.every((X2, i) => X2.equals(RistrettoPoint.fromHex(opts.sigmaProof.X2List[i]))) &&
      X3List.every((X3, i) => X3.equals(RistrettoPoint.fromHex(opts.sigmaProof.X3List[i]))) &&
      X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(opts.sigmaProof.X4List[i]))) &&
      X5.equals(RistrettoPoint.fromHex(opts.sigmaProof.X5)) &&
      X6List.every((X6, i) => X6.equals(RistrettoPoint.fromHex(opts.sigmaProof.X6List[i]))) &&
      X7List.flat().every((X7, i) => X7.equals(RistrettoPoint.fromHex(proofX7List[i]))) &&
      X8List.every((X8, i) => X8.equals(RistrettoPoint.fromHex(opts.sigmaProof.X8List[i])))
    );
  }

  async genRangeProof(): Promise<ConfidentialTransferRangeProof> {
    const rangeProofAmount = await RangeProofExecutor.genBatchRangeZKP({
      v: this.confidentialAmountToTransfer.amountChunks,
      rs: this.randomness.slice(0, ConfidentialAmount.CHUNKS_COUNT / 2).map((el) => numberToBytesLE(el, 32)),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: ConfidentialAmount.CHUNK_BITS,
    });

    const rangeProofNewBalance = await RangeProofExecutor.genBatchRangeZKP({
      v: this.confidentialAmountAfterTransfer.amountChunks,
      rs: this.newBalanceRandomness.map((el) => numberToBytesLE(el, 32)),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: ConfidentialAmount.CHUNK_BITS,
    });

    return {
      rangeProofAmount: rangeProofAmount.proof,
      rangeProofNewBalance: rangeProofNewBalance.proof,
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

    return [
      {
        sigmaProof,
        rangeProof,
      },
      this.confidentialAmountAfterTransfer.getAmountEncrypted(
        this.senderDecryptionKey.publicKey(),
        this.newBalanceRandomness,
      ),
      this.encryptedAmountByRecipient,
      this.auditorsCBList,
    ];
  }

  static async verifyRangeProof(opts: {
    encryptedAmountByRecipient: TwistedElGamalCiphertext[];
    encryptedActualBalanceAfterTransfer: TwistedElGamalCiphertext[];
    rangeProofAmount: Uint8Array;
    rangeProofNewBalance: Uint8Array;
  }) {
    const isRangeProofAmountValid = await RangeProofExecutor.verifyBatchRangeZKP({
      proof: opts.rangeProofAmount,
      comm: opts.encryptedAmountByRecipient.map((el) => el.C.toRawBytes()),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: ConfidentialAmount.CHUNK_BITS,
    });
    const rangeProofNewBalance = await RangeProofExecutor.verifyBatchRangeZKP({
      proof: opts.rangeProofNewBalance,
      comm: opts.encryptedActualBalanceAfterTransfer.map((el) => el.C.toRawBytes()),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: ConfidentialAmount.CHUNK_BITS,
    });

    return isRangeProofAmountValid && rangeProofNewBalance;
  }
}
