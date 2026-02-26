import { numberToBytesLE } from "@noble/curves/abstract/utils";
import { RistrettoPoint } from "@noble/curves/ed25519";
import {
  AVAILABLE_BALANCE_CHUNK_COUNT,
  CHUNK_BITS,
  ChunkedAmount,
  TRANSFER_AMOUNT_CHUNK_COUNT,
} from "./chunkedAmount";
import { AnyNumber } from "@aptos-labs/ts-sdk";
import { RangeProofExecutor } from "./rangeProof";
import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey, H_RISTRETTO } from ".";
import { TwistedElGamalCiphertext } from "./twistedElGamal";
import { ed25519GenListOfRandom } from "../utils";
import { EncryptedAmount } from "./encryptedAmount";

/** Stub type — sigma proof is not yet implemented. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ConfidentialTransferSigmaProof = {};

export type ConfidentialTransferRangeProof = {
  rangeProofAmount: Uint8Array;
  rangeProofNewBalance: Uint8Array;
};

export type CreateConfidentialTransferOpArgs = {
  senderDecryptionKey: TwistedEd25519PrivateKey;
  senderAvailableBalanceCipherText: TwistedElGamalCiphertext[];
  amount: AnyNumber;
  recipientEncryptionKey: TwistedEd25519PublicKey;
  auditorEncryptionKeys?: TwistedEd25519PublicKey[];
  transferAmountRandomness?: bigint[];
};

export class ConfidentialTransfer {
  senderDecryptionKey: TwistedEd25519PrivateKey;

  recipientEncryptionKey: TwistedEd25519PublicKey;

  auditorEncryptionKeys: TwistedEd25519PublicKey[];

  transferAmountEncryptedByAuditors: EncryptedAmount[];

  /**
   * The encrypted actual balance, which is the on-chain representation of the balance of the sender before the transfer.
   * This is can be decrypted with the sender decryption key.
   */
  senderEncryptedAvailableBalance: EncryptedAmount;

  /**
   * The encrypted amount being transferred, which is the amount to be transferred encrypted with the public key of senderDecryptionKey
   * and transferAmountRandomness.
   */
  transferAmountEncryptedBySender: EncryptedAmount;

  /**
   * The encrypted balance remaining after the transfer. It is the computed by encrypting confidentialBalanceAfterTransfer
   * with the public key of senderDecryptionKey and newBalanceRandomness.
   **/
  senderEncryptedAvailableBalanceAfterTransfer: EncryptedAmount;

  /**
   * The encrypted amount being transferred, which is the amount to be transferred encrypted with recipientEncryptionKey
   * and transferAmountRandomness.
   */
  transferAmountEncryptedByRecipient: EncryptedAmount;

  /**
   * The randomness used to encrypt the amount to be transferred.
   */
  transferAmountRandomness: bigint[];

  /**
   * The randomness used to encrypt the balance after the transfer.
   */
  newBalanceRandomness: bigint[];

  private constructor(args: {
    senderDecryptionKey: TwistedEd25519PrivateKey;
    recipientEncryptionKey: TwistedEd25519PublicKey;
    amount: bigint;
    auditorEncryptionKeys: TwistedEd25519PublicKey[];
    senderEncryptedAvailableBalance: EncryptedAmount;
    transferAmountEncryptedBySender: EncryptedAmount;
    transferAmountEncryptedByRecipient: EncryptedAmount;
    transferAmountEncryptedByAuditors: EncryptedAmount[];
    senderEncryptedAvailableBalanceAfterTransfer: EncryptedAmount;
  }) {
    const {
      senderDecryptionKey,
      recipientEncryptionKey,
      auditorEncryptionKeys,
      senderEncryptedAvailableBalance,
      amount,
      transferAmountEncryptedBySender,
      transferAmountEncryptedByRecipient,
      transferAmountEncryptedByAuditors,
      senderEncryptedAvailableBalanceAfterTransfer,
    } = args;
    this.senderDecryptionKey = senderDecryptionKey;
    this.recipientEncryptionKey = recipientEncryptionKey;
    this.auditorEncryptionKeys = auditorEncryptionKeys;
    this.senderEncryptedAvailableBalance = senderEncryptedAvailableBalance;
    if (amount < 0n) {
      throw new Error("Amount to transfer must not be negative");
    }
    const remainingBalance = senderEncryptedAvailableBalance.getAmount() - amount;
    if (remainingBalance < 0n) {
      throw new Error(
        `Insufficient balance. Available balance: ${senderEncryptedAvailableBalance.getAmount().toString()}, Amount to transfer: ${amount.toString()}`,
      );
    }
    this.transferAmountEncryptedBySender = transferAmountEncryptedBySender;
    this.transferAmountEncryptedByRecipient = transferAmountEncryptedByRecipient;
    this.transferAmountEncryptedByAuditors = transferAmountEncryptedByAuditors;
    this.senderEncryptedAvailableBalanceAfterTransfer = senderEncryptedAvailableBalanceAfterTransfer;

    const transferAmountRandomness = transferAmountEncryptedBySender.getRandomness();
    if (!transferAmountRandomness) {
      throw new Error("Transfer amount randomness is not set");
    }
    this.transferAmountRandomness = transferAmountRandomness;

    const newBalanceRandomness = senderEncryptedAvailableBalanceAfterTransfer.getRandomness();
    if (!newBalanceRandomness) {
      throw new Error("New balance randomness is not set");
    }
    this.newBalanceRandomness = newBalanceRandomness;
  }

  static async create(args: CreateConfidentialTransferOpArgs) {
    const {
      senderAvailableBalanceCipherText,
      senderDecryptionKey,
      recipientEncryptionKey,
      auditorEncryptionKeys = [],
      transferAmountRandomness = ed25519GenListOfRandom(AVAILABLE_BALANCE_CHUNK_COUNT),
    } = args;
    const amount = BigInt(args.amount);
    const newBalanceRandomness = ed25519GenListOfRandom(AVAILABLE_BALANCE_CHUNK_COUNT);

    const senderEncryptedAvailableBalance = await EncryptedAmount.fromCipherTextAndPrivateKey(
      senderAvailableBalanceCipherText,
      senderDecryptionKey,
    );
    const remainingBalance = senderEncryptedAvailableBalance.getAmount() - amount;
    const senderEncryptedAvailableBalanceAfterTransfer = EncryptedAmount.fromAmountAndPublicKey({
      amount: remainingBalance,
      publicKey: senderDecryptionKey.publicKey(),
      randomness: newBalanceRandomness,
    });

    const chunkedAmount = ChunkedAmount.createTransferAmount(amount);
    const transferAmountEncryptedBySender = new EncryptedAmount({
      chunkedAmount,
      publicKey: senderDecryptionKey.publicKey(),
      randomness: transferAmountRandomness,
    });

    const transferAmountEncryptedByRecipient = new EncryptedAmount({
      chunkedAmount,
      publicKey: recipientEncryptionKey,
      randomness: transferAmountRandomness,
    });

    const transferAmountEncryptedByAuditors = auditorEncryptionKeys.map(
      (encryptionKey) =>
        new EncryptedAmount({
          chunkedAmount,
          publicKey: encryptionKey,
          randomness: transferAmountRandomness,
        }),
    );

    return new ConfidentialTransfer({
      senderDecryptionKey,
      recipientEncryptionKey,
      auditorEncryptionKeys,
      senderEncryptedAvailableBalance,
      amount,
      transferAmountEncryptedBySender,
      transferAmountEncryptedByRecipient,
      transferAmountEncryptedByAuditors,
      senderEncryptedAvailableBalanceAfterTransfer,
    });
  }

  /** Returns an empty sigma proof (stub — sigma proof is not yet implemented). */
  static serializeSigmaProof(): Uint8Array {
    return new Uint8Array(0);
  }

  /** Stub — always returns an empty sigma proof. */
  async genSigmaProof(): Promise<ConfidentialTransferSigmaProof> {
    return {} as ConfidentialTransferSigmaProof;
  }

  /** Stub — always returns true. */
  static verifySigmaProof(_opts: {
    senderPrivateKey: TwistedEd25519PrivateKey;
    recipientPublicKey: TwistedEd25519PublicKey;
    encryptedActualBalance: TwistedElGamalCiphertext[];
    encryptedActualBalanceAfterTransfer: EncryptedAmount;
    encryptedTransferAmountByRecipient: EncryptedAmount;
    encryptedTransferAmountBySender: EncryptedAmount;
    sigmaProof: ConfidentialTransferSigmaProof;
    auditors?: {
      publicKeys: TwistedEd25519PublicKey[];
      auditorsCBList: TwistedElGamalCiphertext[][];
    };
  }): boolean {
    return true;
  }

  async genRangeProof(): Promise<ConfidentialTransferRangeProof> {
    const rangeProofAmount = await RangeProofExecutor.genBatchRangeZKP({
      v: this.transferAmountEncryptedBySender.getAmountChunks(),
      rs: this.transferAmountRandomness.slice(0, TRANSFER_AMOUNT_CHUNK_COUNT).map((el) => numberToBytesLE(el, 32)),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: CHUNK_BITS,
    });

    const rangeProofNewBalance = await RangeProofExecutor.genBatchRangeZKP({
      v: this.senderEncryptedAvailableBalanceAfterTransfer.getAmountChunks(),
      rs: this.newBalanceRandomness.map((el) => numberToBytesLE(el, 32)),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: CHUNK_BITS,
    });

    return {
      rangeProofAmount: rangeProofAmount.proof,
      rangeProofNewBalance: rangeProofNewBalance.proof,
    };
  }

  async authorizeTransfer(): Promise<
    [
      { sigmaProof: Uint8Array; rangeProof: ConfidentialTransferRangeProof },
      EncryptedAmount,
      EncryptedAmount,
      EncryptedAmount[],
    ]
  > {
    const sigmaProof = ConfidentialTransfer.serializeSigmaProof();
    const rangeProof = await this.genRangeProof();

    return [
      {
        sigmaProof,
        rangeProof,
      },
      this.senderEncryptedAvailableBalanceAfterTransfer,
      this.transferAmountEncryptedByRecipient,
      this.transferAmountEncryptedByAuditors,
    ];
  }

  static async verifyRangeProof(opts: {
    encryptedAmountByRecipient: EncryptedAmount;
    encryptedActualBalanceAfterTransfer: EncryptedAmount;
    rangeProofAmount: Uint8Array;
    rangeProofNewBalance: Uint8Array;
  }) {
    const isRangeProofAmountValid = await RangeProofExecutor.verifyBatchRangeZKP({
      proof: opts.rangeProofAmount,
      comm: opts.encryptedAmountByRecipient.getCipherText().map((el) => el.C.toRawBytes()),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: CHUNK_BITS,
    });
    const rangeProofNewBalance = await RangeProofExecutor.verifyBatchRangeZKP({
      proof: opts.rangeProofNewBalance,
      comm: opts.encryptedActualBalanceAfterTransfer.getCipherText().map((el) => el.C.toRawBytes()),
      val_base: RistrettoPoint.BASE.toRawBytes(),
      rand_base: H_RISTRETTO.toRawBytes(),
      num_bits: CHUNK_BITS,
    });

    return isRangeProofAmountValid && rangeProofNewBalance;
  }
}
