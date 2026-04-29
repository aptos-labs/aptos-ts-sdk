import { numberToBytesLE } from "@noble/curves/utils";
import { ristretto255 } from "@noble/curves/ed25519";
import { ed25519GenListOfRandom } from "../utils";
import {
  AVAILABLE_BALANCE_CHUNK_COUNT,
  CHUNK_BITS,
  TwistedEd25519PrivateKey,
  TwistedEd25519PublicKey,
  H_RISTRETTO,
  TwistedElGamalCiphertext,
  EncryptedAmount,
} from ".";
import { batchRangeProof, batchVerifyProof } from "@aptos-labs/confidential-asset-bindings";
import type { SigmaProtocolProof } from "./sigmaProtocol";
import { proveWithdrawal } from "./sigmaProtocolWithdraw";

export type CreateConfidentialWithdrawOpArgs = {
  decryptionKey: TwistedEd25519PrivateKey;
  senderAvailableBalanceCipherText: TwistedElGamalCiphertext[];
  amount: bigint;
  /** 32-byte sender address */
  senderAddress: Uint8Array;
  /** 32-byte token address */
  tokenAddress: Uint8Array;
  /** Chain ID for domain separation */
  chainId: number;
  /** Optional auditor encryption key */
  auditorEncryptionKey?: TwistedEd25519PublicKey;
  randomness?: bigint[];
};

export class ConfidentialWithdraw {
  decryptionKey: TwistedEd25519PrivateKey;

  senderEncryptedAvailableBalance: EncryptedAmount;

  amount: bigint;

  senderEncryptedAvailableBalanceAfterWithdrawal: EncryptedAmount;

  /** Optional: new balance encrypted with an auditor key */
  auditorEncryptedBalanceAfterWithdrawal?: EncryptedAmount;

  randomness: bigint[];

  senderAddress: Uint8Array;

  tokenAddress: Uint8Array;

  auditorEncryptionKey?: TwistedEd25519PublicKey;

  chainId: number;

  constructor(args: {
    decryptionKey: TwistedEd25519PrivateKey;
    senderEncryptedAvailableBalance: EncryptedAmount;
    amount: bigint;
    senderEncryptedAvailableBalanceAfterWithdrawal: EncryptedAmount;
    auditorEncryptedBalanceAfterWithdrawal?: EncryptedAmount;
    randomness: bigint[];
    senderAddress: Uint8Array;
    tokenAddress: Uint8Array;
    chainId: number;
    auditorEncryptionKey?: TwistedEd25519PublicKey;
  }) {
    const {
      decryptionKey,
      senderEncryptedAvailableBalance,
      amount,
      randomness,
      senderEncryptedAvailableBalanceAfterWithdrawal,
      auditorEncryptedBalanceAfterWithdrawal,
      senderAddress,
      tokenAddress,
      chainId,
      auditorEncryptionKey,
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
    this.auditorEncryptedBalanceAfterWithdrawal = auditorEncryptedBalanceAfterWithdrawal;
    this.senderAddress = senderAddress;
    this.tokenAddress = tokenAddress;
    this.chainId = chainId;
    this.auditorEncryptionKey = auditorEncryptionKey;
  }

  static async create(args: CreateConfidentialWithdrawOpArgs) {
    const {
      amount,
      randomness = ed25519GenListOfRandom(AVAILABLE_BALANCE_CHUNK_COUNT),
      senderAddress,
      tokenAddress,
      chainId,
      auditorEncryptionKey,
    } = args;

    const senderEncryptedAvailableBalance = await EncryptedAmount.fromCipherTextAndPrivateKey(
      args.senderAvailableBalanceCipherText,
      args.decryptionKey,
    );
    const senderEncryptedAvailableBalanceAfterWithdrawal = EncryptedAmount.fromAmountAndPublicKey({
      amount: senderEncryptedAvailableBalance.getAmount() - amount,
      publicKey: args.decryptionKey.publicKey(),
      randomness,
    });

    // If auditor is set, encrypt the new balance under the auditor key with the same randomness
    let auditorEncryptedBalanceAfterWithdrawal: EncryptedAmount | undefined;
    if (auditorEncryptionKey) {
      auditorEncryptedBalanceAfterWithdrawal = EncryptedAmount.fromAmountAndPublicKey({
        amount: senderEncryptedAvailableBalance.getAmount() - amount,
        publicKey: auditorEncryptionKey,
        randomness,
      });
    }

    return new ConfidentialWithdraw({
      decryptionKey: args.decryptionKey,
      amount,
      senderEncryptedAvailableBalance,
      senderEncryptedAvailableBalanceAfterWithdrawal,
      auditorEncryptedBalanceAfterWithdrawal,
      randomness,
      senderAddress,
      tokenAddress,
      chainId,
      auditorEncryptionKey,
    });
  }

  /**
   * Generate the sigma protocol proof for withdrawal.
   */
  genSigmaProof(): SigmaProtocolProof {
    const oldCipherTexts = this.senderEncryptedAvailableBalance.getCipherText();
    const newCipherTexts = this.senderEncryptedAvailableBalanceAfterWithdrawal.getCipherText();

    const oldBalanceC = oldCipherTexts.map((ct) => ct.C);
    const oldBalanceD = oldCipherTexts.map((ct) => ct.D);
    const newBalanceC = newCipherTexts.map((ct) => ct.C);
    const newBalanceD = newCipherTexts.map((ct) => ct.D);

    let auditorEncryptionKey: TwistedEd25519PublicKey | undefined;
    let newBalanceDAud: import(".").RistPoint[] | undefined;
    if (this.auditorEncryptionKey && this.auditorEncryptedBalanceAfterWithdrawal) {
      auditorEncryptionKey = this.auditorEncryptionKey;
      newBalanceDAud = this.auditorEncryptedBalanceAfterWithdrawal.getCipherText().map((ct) => ct.D);
    }

    return proveWithdrawal({
      dk: this.decryptionKey,
      senderAddress: this.senderAddress,
      tokenAddress: this.tokenAddress,
      chainId: this.chainId,
      amount: this.amount,
      oldBalanceC,
      oldBalanceD,
      newBalanceC,
      newBalanceD,
      newAmountChunks: this.senderEncryptedAvailableBalanceAfterWithdrawal.getAmountChunks(),
      newRandomness: this.randomness,
      auditorEncryptionKey,
      newBalanceDAud,
    });
  }

  async genRangeProof() {
    const rangeProof = await batchRangeProof({
      v: this.senderEncryptedAvailableBalanceAfterWithdrawal.getAmountChunks(),
      rs: this.randomness.map((chunk) => numberToBytesLE(chunk, 32)),
      valBase: ristretto255.Point.BASE.toBytes(),
      randBase: H_RISTRETTO.toBytes(),
      numBits: CHUNK_BITS,
    });

    return rangeProof.proof;
  }

  async authorizeWithdrawal(): Promise<
    [
      {
        sigmaProof: SigmaProtocolProof;
        rangeProof: Uint8Array;
      },
      EncryptedAmount,
      EncryptedAmount | undefined,
    ]
  > {
    const sigmaProof = this.genSigmaProof();
    const rangeProof = await this.genRangeProof();

    return [
      { sigmaProof, rangeProof },
      this.senderEncryptedAvailableBalanceAfterWithdrawal,
      this.auditorEncryptedBalanceAfterWithdrawal,
    ];
  }

  static async verifyRangeProof(opts: {
    rangeProof: Uint8Array;
    senderEncryptedAvailableBalanceAfterWithdrawal: EncryptedAmount;
  }) {
    return batchVerifyProof({
      proof: opts.rangeProof,
      comms: opts.senderEncryptedAvailableBalanceAfterWithdrawal.getCipherText().map((el) => el.C.toBytes()),
      valBase: ristretto255.Point.BASE.toBytes(),
      randBase: H_RISTRETTO.toBytes(),
      numBits: CHUNK_BITS,
    });
  }
}
