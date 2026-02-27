import { RistrettoPoint } from "@noble/curves/ed25519";
import { numberToBytesLE } from "@noble/curves/abstract/utils";
import { MODULE_NAME } from "../consts";
import { RangeProofExecutor } from "./rangeProof";
import { TwistedEd25519PrivateKey, H_RISTRETTO, TwistedEd25519PublicKey } from ".";
import { ed25519GenListOfRandom } from "../utils";
import { EncryptedAmount } from "./encryptedAmount";
import { AVAILABLE_BALANCE_CHUNK_COUNT, CHUNK_BITS } from "./chunkedAmount";
import { Aptos, SimpleTransaction, AccountAddressInput, InputGenerateTransactionOptions } from "@aptos-labs/ts-sdk";

/** Stub type — sigma proof is not yet implemented. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ConfidentialNormalizationSigmaProof = {};

export type CreateConfidentialNormalizationOpArgs = {
  decryptionKey: TwistedEd25519PrivateKey;
  unnormalizedAvailableBalance: EncryptedAmount;
  randomness?: bigint[];
};

export class ConfidentialNormalization {
  decryptionKey: TwistedEd25519PrivateKey;

  unnormalizedEncryptedAvailableBalance: EncryptedAmount;

  normalizedEncryptedAvailableBalance: EncryptedAmount;

  randomness: bigint[];

  constructor(args: {
    decryptionKey: TwistedEd25519PrivateKey;
    unnormalizedEncryptedAvailableBalance: EncryptedAmount;
    normalizedEncryptedAvailableBalance: EncryptedAmount;
  }) {
    this.decryptionKey = args.decryptionKey;
    this.unnormalizedEncryptedAvailableBalance = args.unnormalizedEncryptedAvailableBalance;
    this.normalizedEncryptedAvailableBalance = args.normalizedEncryptedAvailableBalance;
    const randomness = this.normalizedEncryptedAvailableBalance.getRandomness();
    if (!randomness) {
      throw new Error("Randomness is not set");
    }
    this.randomness = randomness;
  }

  static async create(args: CreateConfidentialNormalizationOpArgs) {
    const { decryptionKey, randomness = ed25519GenListOfRandom(AVAILABLE_BALANCE_CHUNK_COUNT) } = args;

    const unnormalizedEncryptedAvailableBalance = args.unnormalizedAvailableBalance;

    const normalizedEncryptedAvailableBalance = EncryptedAmount.fromAmountAndPublicKey({
      amount: unnormalizedEncryptedAvailableBalance.getAmount(),
      publicKey: decryptionKey.publicKey(),
      randomness,
    });
    return new ConfidentialNormalization({
      decryptionKey,
      unnormalizedEncryptedAvailableBalance,
      normalizedEncryptedAvailableBalance,
    });
  }

  /** Returns an empty sigma proof (stub — sigma proof is not yet implemented). */
  static serializeSigmaProof(): Uint8Array {
    return new Uint8Array(0);
  }

  /** Stub — always returns an empty sigma proof. */
  async genSigmaProof(): Promise<ConfidentialNormalizationSigmaProof> {
    return {} as ConfidentialNormalizationSigmaProof;
  }

  /** Stub — always returns true. */
  static verifySigmaProof(_opts: {
    publicKey: TwistedEd25519PublicKey;
    sigmaProof: ConfidentialNormalizationSigmaProof;
    unnormalizedEncryptedBalance: EncryptedAmount;
    normalizedEncryptedBalance: EncryptedAmount;
  }): boolean {
    return true;
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

  async authorizeNormalization(): Promise<[{ sigmaProof: Uint8Array; rangeProof: Uint8Array }, EncryptedAmount]> {
    const sigmaProof = ConfidentialNormalization.serializeSigmaProof();
    const rangeProof = await this.genRangeProof();

    return [{ sigmaProof, rangeProof }, this.normalizedEncryptedAvailableBalance];
  }

  async createTransaction(args: {
    client: Aptos;
    sender: AccountAddressInput;
    confidentialAssetModuleAddress: string;
    tokenAddress: AccountAddressInput;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const [{ rangeProof }, normalizedCB] = await this.authorizeNormalization();

    return args.client.transaction.build.simple({
      ...args,
      data: {
        function: `${args.confidentialAssetModuleAddress}::${MODULE_NAME}::normalize_raw`,
        functionArguments: [
          args.tokenAddress,
          normalizedCB.getCipherTextBytes(),
          rangeProof,
          [] as Uint8Array[], // sigma_proto_comm (stub)
          [] as Uint8Array[], // sigma_proto_resp (stub)
        ],
      },
      options: args.options,
    });
  }
}
