import { numberToBytesLE } from "@noble/curves/abstract/utils";
import { RistrettoPoint } from "@noble/curves/ed25519";
import { ed25519GenListOfRandom } from "../utils";
import {
  AVAILABLE_BALANCE_CHUNK_COUNT,
  CHUNK_BITS,
  RangeProofExecutor,
  TwistedEd25519PrivateKey,
  H_RISTRETTO,
  TwistedElGamalCiphertext,
  EncryptedAmount,
} from ".";

/** Stub type — sigma proof is not yet implemented. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ConfidentialWithdrawSigmaProof = {};

export type CreateConfidentialWithdrawOpArgs = {
  decryptionKey: TwistedEd25519PrivateKey;
  senderAvailableBalanceCipherText: TwistedElGamalCiphertext[];
  amount: bigint;
  randomness?: bigint[];
};

export class ConfidentialWithdraw {
  decryptionKey: TwistedEd25519PrivateKey;

  senderEncryptedAvailableBalance: EncryptedAmount;

  amount: bigint;

  senderEncryptedAvailableBalanceAfterWithdrawal: EncryptedAmount;

  randomness: bigint[];

  constructor(args: {
    decryptionKey: TwistedEd25519PrivateKey;
    senderEncryptedAvailableBalance: EncryptedAmount;
    amount: bigint;
    senderEncryptedAvailableBalanceAfterWithdrawal: EncryptedAmount;
    randomness: bigint[];
  }) {
    const {
      decryptionKey,
      senderEncryptedAvailableBalance,
      amount,
      randomness,
      senderEncryptedAvailableBalanceAfterWithdrawal,
    } = args;
    if (amount < 0n) {
      throw new Error("Amount to withdraw must not be negative");
    }
    if (
      senderEncryptedAvailableBalanceAfterWithdrawal.getAmount() !==
      senderEncryptedAvailableBalance.getAmount() - amount
    ) {
      throw new Error(
        "Balance after withdrawal doesn't equal the balance before withdrawal minus the amount to withdraw",
      );
    }
    if (senderEncryptedAvailableBalanceAfterWithdrawal.getAmount() < 0n) {
      throw new Error(
        `Insufficient balance. Available balance: ${senderEncryptedAvailableBalance.getAmount().toString()}, Amount to withdraw: ${amount.toString()}`,
      );
    }

    this.amount = amount;
    this.decryptionKey = decryptionKey;
    this.senderEncryptedAvailableBalance = senderEncryptedAvailableBalance;
    this.randomness = randomness;
    this.senderEncryptedAvailableBalanceAfterWithdrawal = senderEncryptedAvailableBalanceAfterWithdrawal;
  }

  static async create(args: CreateConfidentialWithdrawOpArgs) {
    const { amount, randomness = ed25519GenListOfRandom(AVAILABLE_BALANCE_CHUNK_COUNT) } = args;

    const senderEncryptedAvailableBalance = await EncryptedAmount.fromCipherTextAndPrivateKey(
      args.senderAvailableBalanceCipherText,
      args.decryptionKey,
    );
    const senderEncryptedAvailableBalanceAfterWithdrawal = EncryptedAmount.fromAmountAndPublicKey({
      amount: senderEncryptedAvailableBalance.getAmount() - amount,
      publicKey: args.decryptionKey.publicKey(),
      randomness,
    });

    return new ConfidentialWithdraw({
      decryptionKey: args.decryptionKey,
      amount,
      senderEncryptedAvailableBalance,
      senderEncryptedAvailableBalanceAfterWithdrawal,
      randomness,
    });
  }

  /** Returns an empty sigma proof (stub — sigma proof is not yet implemented). */
  static serializeSigmaProof(): Uint8Array {
    return new Uint8Array(0);
  }

  /** Stub — always returns an empty sigma proof. */
  async genSigmaProof(): Promise<ConfidentialWithdrawSigmaProof> {
    return {} as ConfidentialWithdrawSigmaProof;
  }

  /** Stub — always returns true. */
  static verifySigmaProof(_opts: {
    sigmaProof: ConfidentialWithdrawSigmaProof;
    senderEncryptedAvailableBalance: EncryptedAmount;
    senderEncryptedAvailableBalanceAfterWithdrawal: EncryptedAmount;
    amountToWithdraw: bigint;
  }): boolean {
    return true;
  }

  async genRangeProof() {
    const rangeProof = await RangeProofExecutor.genBatchRangeZKP({
      v: this.senderEncryptedAvailableBalanceAfterWithdrawal.getAmountChunks(),
      rs: this.randomness.map((chunk) => numberToBytesLE(chunk, 32)),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: CHUNK_BITS,
    });

    return rangeProof.proof;
  }

  async authorizeWithdrawal(): Promise<
    [
      {
        sigmaProof: Uint8Array;
        rangeProof: Uint8Array;
      },
      EncryptedAmount,
    ]
  > {
    const sigmaProof = ConfidentialWithdraw.serializeSigmaProof();
    const rangeProof = await this.genRangeProof();

    return [{ sigmaProof, rangeProof }, this.senderEncryptedAvailableBalanceAfterWithdrawal];
  }

  static async verifyRangeProof(opts: {
    rangeProof: Uint8Array;
    senderEncryptedAvailableBalanceAfterWithdrawal: EncryptedAmount;
  }) {
    return RangeProofExecutor.verifyBatchRangeZKP({
      proof: opts.rangeProof,
      comm: opts.senderEncryptedAvailableBalanceAfterWithdrawal.getCipherText().map((el) => el.C.toRawBytes()),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: CHUNK_BITS,
    });
  }
}
