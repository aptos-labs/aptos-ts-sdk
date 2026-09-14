import { numberToBytesLE } from "@noble/curves/utils.js";
import { ristretto255 } from "@noble/curves/ed25519.js";
import {
  AVAILABLE_BALANCE_CHUNK_COUNT,
  CHUNK_BITS,
  ChunkedAmount,
  TRANSFER_AMOUNT_CHUNK_COUNT,
} from "./chunkedAmount.js";
import { AnyNumber } from "@aptos-labs/ts-sdk";
import { batchRangeProof, batchVerifyProof } from "@aptos-labs/confidential-asset-bindings";
import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey, H_RISTRETTO } from "./twistedEd25519.js";
import { TwistedElGamalCiphertext } from "./twistedElGamal.js";
import { ed25519GenListOfRandom } from "../utils.js";
import { EncryptedAmount } from "./encryptedAmount.js";
import type { SigmaProtocolProof } from "./sigmaProtocol.js";
import { proveTransfer } from "./sigmaProtocolTransfer.js";

export type ConfidentialTransferRangeProof = {
  rangeProofAmount: Uint8Array;
  rangeProofNewBalance: Uint8Array;
};

export type CreateConfidentialTransferOpArgs = {
  senderDecryptionKey: TwistedEd25519PrivateKey;
  senderAvailableBalanceCipherText: TwistedElGamalCiphertext[];
  amount: AnyNumber;
  recipientEncryptionKey: TwistedEd25519PublicKey;
  /**
   * Whether the last element in auditorEncryptionKeys is the effective (asset-level / global) auditor.
   * Extras are all preceding elements. This affects the sigma protocol statement layout and
   * domain separator.
   */
  hasEffectiveAuditor?: boolean;
  auditorEncryptionKeys?: TwistedEd25519PublicKey[];
  transferAmountRandomness?: bigint[];
  /** 32-byte sender address */
  senderAddress: Uint8Array;
  /** 32-byte recipient address */
  recipientAddress: Uint8Array;
  /** 32-byte token address */
  tokenAddress: Uint8Array;
  /** Chain ID for domain separation */
  chainId: number;
};

export class ConfidentialTransfer {
  senderDecryptionKey: TwistedEd25519PrivateKey;

  recipientEncryptionKey: TwistedEd25519PublicKey;

  hasEffectiveAuditor: boolean;

  auditorEncryptionKeys: TwistedEd25519PublicKey[];

  transferAmountEncryptedByAuditors: EncryptedAmount[];

  /**
   * The encrypted actual balance, which is the on-chain representation of the balance of the sender before the transfer.
   * This can be decrypted with the sender decryption key.
   */
  senderEncryptedAvailableBalance: EncryptedAmount;

  /**
   * The encrypted amount being transferred, which is the amount to be transferred encrypted with the public key of senderDecryptionKey
   * and transferAmountRandomness.
   */
  transferAmountEncryptedBySender: EncryptedAmount;

  /**
   * The encrypted balance remaining after the transfer. It is computed by encrypting confidentialBalanceAfterTransfer
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

  /** Optional: new balance encrypted under each auditor key */
  auditorEncryptedBalancesAfterTransfer: EncryptedAmount[];

  senderAddress: Uint8Array;

  recipientAddress: Uint8Array;

  tokenAddress: Uint8Array;

  chainId: number;

  private constructor(args: {
    senderDecryptionKey: TwistedEd25519PrivateKey;
    recipientEncryptionKey: TwistedEd25519PublicKey;
    amount: bigint;
    hasEffectiveAuditor: boolean;
    auditorEncryptionKeys: TwistedEd25519PublicKey[];
    senderEncryptedAvailableBalance: EncryptedAmount;
    transferAmountEncryptedBySender: EncryptedAmount;
    transferAmountEncryptedByRecipient: EncryptedAmount;
    transferAmountEncryptedByAuditors: EncryptedAmount[];
    senderEncryptedAvailableBalanceAfterTransfer: EncryptedAmount;
    auditorEncryptedBalancesAfterTransfer: EncryptedAmount[];
    senderAddress: Uint8Array;
    recipientAddress: Uint8Array;
    tokenAddress: Uint8Array;
    chainId: number;
  }) {
    const {
      senderDecryptionKey,
      recipientEncryptionKey,
      hasEffectiveAuditor,
      auditorEncryptionKeys,
      senderEncryptedAvailableBalance,
      amount,
      transferAmountEncryptedBySender,
      transferAmountEncryptedByRecipient,
      transferAmountEncryptedByAuditors,
      senderEncryptedAvailableBalanceAfterTransfer,
      auditorEncryptedBalancesAfterTransfer,
      senderAddress,
      recipientAddress,
      tokenAddress,
      chainId,
    } = args;
    this.senderDecryptionKey = senderDecryptionKey;
    this.recipientEncryptionKey = recipientEncryptionKey;
    this.hasEffectiveAuditor = hasEffectiveAuditor;
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
    this.auditorEncryptedBalancesAfterTransfer = auditorEncryptedBalancesAfterTransfer;

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

    this.senderAddress = senderAddress;
    this.recipientAddress = recipientAddress;
    this.tokenAddress = tokenAddress;
    this.chainId = chainId;
  }

  static async create(args: CreateConfidentialTransferOpArgs) {
    const {
      senderAvailableBalanceCipherText,
      senderDecryptionKey,
      recipientEncryptionKey,
      hasEffectiveAuditor = false,
      auditorEncryptionKeys = [],
      transferAmountRandomness = ed25519GenListOfRandom(AVAILABLE_BALANCE_CHUNK_COUNT),
      senderAddress,
      recipientAddress,
      tokenAddress,
      chainId,
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

    // Encrypt the new balance under each auditor key with the same randomness
    const auditorEncryptedBalancesAfterTransfer = auditorEncryptionKeys.map((encryptionKey) =>
      EncryptedAmount.fromAmountAndPublicKey({
        amount: remainingBalance,
        publicKey: encryptionKey,
        randomness: newBalanceRandomness,
      }),
    );

    return new ConfidentialTransfer({
      senderDecryptionKey,
      recipientEncryptionKey,
      hasEffectiveAuditor,
      auditorEncryptionKeys,
      senderEncryptedAvailableBalance,
      amount,
      transferAmountEncryptedBySender,
      transferAmountEncryptedByRecipient,
      transferAmountEncryptedByAuditors,
      senderEncryptedAvailableBalanceAfterTransfer,
      auditorEncryptedBalancesAfterTransfer,
      senderAddress,
      recipientAddress,
      tokenAddress,
      chainId,
    });
  }

  /**
   * Generate the sigma protocol proof for transfer.
   */
  genSigmaProof(): SigmaProtocolProof {
    const oldCipherTexts = this.senderEncryptedAvailableBalance.getCipherText();
    const newCipherTexts = this.senderEncryptedAvailableBalanceAfterTransfer.getCipherText();
    const senderTransferCipherTexts = this.transferAmountEncryptedBySender.getCipherText();
    const recipientTransferCipherTexts = this.transferAmountEncryptedByRecipient.getCipherText();

    const oldBalanceC = oldCipherTexts.map((ct) => ct.C);
    const oldBalanceD = oldCipherTexts.map((ct) => ct.D);
    const newBalanceC = newCipherTexts.map((ct) => ct.C);
    const newBalanceD = newCipherTexts.map((ct) => ct.D);
    const transferAmountC = senderTransferCipherTexts.map((ct) => ct.C);
    const transferAmountDSender = senderTransferCipherTexts.map((ct) => ct.D);
    const transferAmountDRecipient = recipientTransferCipherTexts.map((ct) => ct.D);

    // Auditor data
    const auditorEncryptionKeys = this.auditorEncryptionKeys.length > 0 ? this.auditorEncryptionKeys : undefined;
    const newBalanceDAud =
      this.auditorEncryptedBalancesAfterTransfer.length > 0
        ? this.auditorEncryptedBalancesAfterTransfer.map((ea) => ea.getCipherText().map((ct) => ct.D))
        : undefined;
    const transferAmountDAud =
      this.transferAmountEncryptedByAuditors.length > 0
        ? this.transferAmountEncryptedByAuditors.map((ea) => ea.getCipherText().map((ct) => ct.D))
        : undefined;

    return proveTransfer({
      dk: this.senderDecryptionKey,
      senderAddress: this.senderAddress,
      recipientAddress: this.recipientAddress,
      tokenAddress: this.tokenAddress,
      chainId: this.chainId,
      senderEncryptionKey: this.senderDecryptionKey.publicKey(),
      recipientEncryptionKey: this.recipientEncryptionKey,
      oldBalanceC,
      oldBalanceD,
      newBalanceC,
      newBalanceD,
      newAmountChunks: this.senderEncryptedAvailableBalanceAfterTransfer.getAmountChunks(),
      newRandomness: this.newBalanceRandomness,
      transferAmountC,
      transferAmountDSender,
      transferAmountDRecipient,
      transferAmountChunks: this.transferAmountEncryptedBySender.getAmountChunks(),
      transferRandomness: this.transferAmountRandomness.slice(0, TRANSFER_AMOUNT_CHUNK_COUNT),
      hasEffectiveAuditor: this.hasEffectiveAuditor,
      auditorEncryptionKeys,
      newBalanceDAud,
      transferAmountDAud,
    });
  }

  async genRangeProof(): Promise<ConfidentialTransferRangeProof> {
    const rangeProofAmount = await batchRangeProof({
      v: this.transferAmountEncryptedBySender.getAmountChunks(),
      rs: this.transferAmountRandomness.slice(0, TRANSFER_AMOUNT_CHUNK_COUNT).map((el) => numberToBytesLE(el, 32)),
      valBase: ristretto255.Point.BASE.toBytes(),
      randBase: H_RISTRETTO.toBytes(),
      numBits: CHUNK_BITS,
    });

    const rangeProofNewBalance = await batchRangeProof({
      v: this.senderEncryptedAvailableBalanceAfterTransfer.getAmountChunks(),
      rs: this.newBalanceRandomness.map((el) => numberToBytesLE(el, 32)),
      valBase: ristretto255.Point.BASE.toBytes(),
      randBase: H_RISTRETTO.toBytes(),
      numBits: CHUNK_BITS,
    });

    return {
      rangeProofAmount: rangeProofAmount.proof,
      rangeProofNewBalance: rangeProofNewBalance.proof,
    };
  }

  async authorizeTransfer(): Promise<
    [
      { sigmaProof: SigmaProtocolProof; rangeProof: ConfidentialTransferRangeProof },
      EncryptedAmount,
      EncryptedAmount,
      EncryptedAmount[],
      EncryptedAmount[],
    ]
  > {
    const sigmaProof = this.genSigmaProof();
    const rangeProof = await this.genRangeProof();

    return [
      {
        sigmaProof,
        rangeProof,
      },
      this.senderEncryptedAvailableBalanceAfterTransfer,
      this.transferAmountEncryptedByRecipient,
      this.transferAmountEncryptedByAuditors,
      this.auditorEncryptedBalancesAfterTransfer,
    ];
  }

  static async verifyRangeProof(opts: {
    encryptedAmountByRecipient: EncryptedAmount;
    encryptedActualBalanceAfterTransfer: EncryptedAmount;
    rangeProofAmount: Uint8Array;
    rangeProofNewBalance: Uint8Array;
  }) {
    const isRangeProofAmountValid = await batchVerifyProof({
      proof: opts.rangeProofAmount,
      comms: opts.encryptedAmountByRecipient.getCipherText().map((el) => el.C.toBytes()),
      valBase: ristretto255.Point.BASE.toBytes(),
      randBase: H_RISTRETTO.toBytes(),
      numBits: CHUNK_BITS,
    });
    const rangeProofNewBalance = await batchVerifyProof({
      proof: opts.rangeProofNewBalance,
      comms: opts.encryptedActualBalanceAfterTransfer.getCipherText().map((el) => el.C.toBytes()),
      valBase: ristretto255.Point.BASE.toBytes(),
      randBase: H_RISTRETTO.toBytes(),
      numBits: CHUNK_BITS,
    });

    return isRangeProofAmountValid && rangeProofNewBalance;
  }
}
