import { RistrettoPoint } from "@noble/curves/ed25519";
import { numberToBytesLE } from "@noble/curves/abstract/utils";
import { MODULE_NAME } from "../consts";
import { RangeProofExecutor } from "./rangeProof";
import { TwistedEd25519PrivateKey, H_RISTRETTO, TwistedEd25519PublicKey } from ".";
import { ed25519GenListOfRandom } from "../utils";
import { EncryptedAmount } from "./encryptedAmount";
import { AVAILABLE_BALANCE_CHUNK_COUNT, CHUNK_BITS } from "./chunkedAmount";
import { Aptos, SimpleTransaction, AccountAddressInput, InputGenerateTransactionOptions } from "@aptos-labs/ts-sdk";
import type { SigmaProtocolProof } from "./sigmaProtocol";
import { proveNormalization } from "./sigmaProtocolWithdraw";

export type CreateConfidentialNormalizationOpArgs = {
  decryptionKey: TwistedEd25519PrivateKey;
  unnormalizedAvailableBalance: EncryptedAmount;
  /** 32-byte sender address */
  senderAddress: Uint8Array;
  /** 32-byte token address */
  tokenAddress: Uint8Array;
  /** Optional auditor encryption key */
  auditorEncryptionKey?: TwistedEd25519PublicKey;
  randomness?: bigint[];
};

export class ConfidentialNormalization {
  decryptionKey: TwistedEd25519PrivateKey;

  unnormalizedEncryptedAvailableBalance: EncryptedAmount;

  normalizedEncryptedAvailableBalance: EncryptedAmount;

  /** Optional: normalized balance encrypted under auditor key */
  auditorEncryptedNormalizedBalance?: EncryptedAmount;

  randomness: bigint[];

  senderAddress: Uint8Array;

  tokenAddress: Uint8Array;

  auditorEncryptionKey?: TwistedEd25519PublicKey;

  constructor(args: {
    decryptionKey: TwistedEd25519PrivateKey;
    unnormalizedEncryptedAvailableBalance: EncryptedAmount;
    normalizedEncryptedAvailableBalance: EncryptedAmount;
    auditorEncryptedNormalizedBalance?: EncryptedAmount;
    senderAddress: Uint8Array;
    tokenAddress: Uint8Array;
    auditorEncryptionKey?: TwistedEd25519PublicKey;
  }) {
    this.decryptionKey = args.decryptionKey;
    this.unnormalizedEncryptedAvailableBalance = args.unnormalizedEncryptedAvailableBalance;
    this.normalizedEncryptedAvailableBalance = args.normalizedEncryptedAvailableBalance;
    this.auditorEncryptedNormalizedBalance = args.auditorEncryptedNormalizedBalance;
    this.senderAddress = args.senderAddress;
    this.tokenAddress = args.tokenAddress;
    this.auditorEncryptionKey = args.auditorEncryptionKey;
    const randomness = this.normalizedEncryptedAvailableBalance.getRandomness();
    if (!randomness) {
      throw new Error("Randomness is not set");
    }
    this.randomness = randomness;
  }

  static async create(args: CreateConfidentialNormalizationOpArgs) {
    const {
      decryptionKey,
      randomness = ed25519GenListOfRandom(AVAILABLE_BALANCE_CHUNK_COUNT),
      senderAddress,
      tokenAddress,
      auditorEncryptionKey,
    } = args;

    const unnormalizedEncryptedAvailableBalance = args.unnormalizedAvailableBalance;

    const normalizedEncryptedAvailableBalance = EncryptedAmount.fromAmountAndPublicKey({
      amount: unnormalizedEncryptedAvailableBalance.getAmount(),
      publicKey: decryptionKey.publicKey(),
      randomness,
    });

    // If auditor is set, encrypt the normalized balance under the auditor key with the same randomness
    let auditorEncryptedNormalizedBalance: EncryptedAmount | undefined;
    if (auditorEncryptionKey) {
      auditorEncryptedNormalizedBalance = EncryptedAmount.fromAmountAndPublicKey({
        amount: unnormalizedEncryptedAvailableBalance.getAmount(),
        publicKey: auditorEncryptionKey,
        randomness,
      });
    }

    return new ConfidentialNormalization({
      decryptionKey,
      unnormalizedEncryptedAvailableBalance,
      normalizedEncryptedAvailableBalance,
      auditorEncryptedNormalizedBalance,
      senderAddress,
      tokenAddress,
      auditorEncryptionKey,
    });
  }

  /**
   * Generate the sigma protocol proof for normalization.
   * Normalization is the same as withdrawal with v = 0.
   */
  genSigmaProof(): SigmaProtocolProof {
    const oldCipherTexts = this.unnormalizedEncryptedAvailableBalance.getCipherText();
    const newCipherTexts = this.normalizedEncryptedAvailableBalance.getCipherText();

    const oldBalanceC = oldCipherTexts.map((ct) => ct.C);
    const oldBalanceD = oldCipherTexts.map((ct) => ct.D);
    const newBalanceC = newCipherTexts.map((ct) => ct.C);
    const newBalanceD = newCipherTexts.map((ct) => ct.D);

    let auditorEncryptionKey: TwistedEd25519PublicKey | undefined;
    let newBalanceDAud: import(".").RistPoint[] | undefined;
    if (this.auditorEncryptionKey && this.auditorEncryptedNormalizedBalance) {
      auditorEncryptionKey = this.auditorEncryptionKey;
      newBalanceDAud = this.auditorEncryptedNormalizedBalance.getCipherText().map((ct) => ct.D);
    }

    return proveNormalization({
      dk: this.decryptionKey,
      senderAddress: this.senderAddress,
      tokenAddress: this.tokenAddress,
      amount: 0n,
      oldBalanceC,
      oldBalanceD,
      newBalanceC,
      newBalanceD,
      newAmountChunks: this.normalizedEncryptedAvailableBalance.getAmountChunks(),
      newRandomness: this.randomness,
      auditorEncryptionKey,
      newBalanceDAud,
    });
  }

  async genRangeProof(): Promise<Uint8Array> {
    const rangeProof = await RangeProofExecutor.genBatchRangeZKP({
      v: this.normalizedEncryptedAvailableBalance.getAmountChunks(),
      rs: this.randomness.map((el) => numberToBytesLE(el, 32)),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: CHUNK_BITS,
    });

    return rangeProof.proof;
  }

  static async verifyRangeProof(opts: {
    rangeProof: Uint8Array;
    normalizedEncryptedBalance: EncryptedAmount;
  }): Promise<boolean> {
    return RangeProofExecutor.verifyBatchRangeZKP({
      proof: opts.rangeProof,
      comm: opts.normalizedEncryptedBalance.getCipherText().map((el) => el.C.toRawBytes()),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: CHUNK_BITS,
    });
  }

  async authorizeNormalization(): Promise<
    [
      { sigmaProof: SigmaProtocolProof; rangeProof: Uint8Array },
      EncryptedAmount,
      EncryptedAmount | undefined,
    ]
  > {
    const sigmaProof = this.genSigmaProof();
    const rangeProof = await this.genRangeProof();

    return [
      { sigmaProof, rangeProof },
      this.normalizedEncryptedAvailableBalance,
      this.auditorEncryptedNormalizedBalance,
    ];
  }

  async createTransaction(args: {
    client: Aptos;
    sender: AccountAddressInput;
    confidentialAssetModuleAddress: string;
    tokenAddress: AccountAddressInput;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const [{ sigmaProof, rangeProof }, normalizedCB, auditorCB] = await this.authorizeNormalization();

    // Build auditor A components (D points encrypted under auditor key)
    const newBalanceA = auditorCB
      ? auditorCB.getCipherText().map((ct) => ct.D.toRawBytes())
      : ([] as Uint8Array[]);

    return args.client.transaction.build.simple({
      ...args,
      data: {
        function: `${args.confidentialAssetModuleAddress}::${MODULE_NAME}::normalize_raw`,
        functionArguments: [
          args.tokenAddress,
          normalizedCB.getCipherText().map((ct) => ct.C.toRawBytes()), // new_balance_C
          normalizedCB.getCipherText().map((ct) => ct.D.toRawBytes()), // new_balance_D
          newBalanceA, // new_balance_A
          rangeProof,
          sigmaProof.commitment,
          sigmaProof.response,
        ],
      },
      options: args.options,
    });
  }
}
