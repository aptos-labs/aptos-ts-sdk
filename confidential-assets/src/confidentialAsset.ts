// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, AccountAddress, AccountAddressInput, AnyNumber, Aptos, AptosConfig, CommittedTransactionResponse, HexInput, InputGenerateSingleSignerRawTransactionArgs, InputGenerateTransactionPayloadData, LedgerVersionArg, MoveStructId, SimpleTransaction } from "@aptos-labs/ts-sdk";
import { TwistedElGamalCiphertext } from "./twistedElGamal";
import { ConfidentialNormalization, CreateConfidentialNormalizationOpArgs } from "./confidentialNormalization";
import { ConfidentialKeyRotation, CreateConfidentialKeyRotationOpArgs } from "./confidentialKeyRotation";
import { publicKeyToU8, toTwistedEd25519PrivateKey, toTwistedEd25519PublicKey } from "./helpers";
import { concatBytes } from "@noble/hashes/utils";
import { ConfidentialAmount } from "./confidentialAmount";
import { CreateConfidentialTransferOpArgs, ConfidentialTransfer } from "./confidentialTransfer";
import { CreateConfidentialWithdrawOpArgs, ConfidentialWithdraw } from "./confidentialWithdraw";
import { TwistedEd25519PublicKey, TwistedEd25519PrivateKey } from "./twistedEd25519";
import { DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS, MODULE_NAME } from "./consts";

export type ConfidentialBalanceResponse = {
  chunks: {
    left: { data: string };
    right: { data: string };
  }[];
}[];

export type ConfidentialBalance = {
  pending: TwistedElGamalCiphertext[];
  actual: TwistedElGamalCiphertext[];
};

/**
 * A class to handle confidential balance operations
 */
export class ConfidentialAsset {
  client: Aptos;
  confidentialAssetModuleAddress: string;

  constructor(readonly config: AptosConfig, { confidentialAssetModuleAddress = DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS }: { confidentialAssetModuleAddress?: string } = {}) {
    this.client = new Aptos(config);
    this.confidentialAssetModuleAddress = confidentialAssetModuleAddress;
  }

  async getBalance(args: {
    accountAddress: AccountAddress;
    tokenAddress: string;
    options?: LedgerVersionArg;
  }): Promise<ConfidentialBalance> {
    const { accountAddress, tokenAddress, options } = args;
    const [[chunkedPendingBalance], [chunkedActualBalances]] = await Promise.all([
      this.client.view<ConfidentialBalanceResponse>({
        payload: {
          function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::pending_balance`,
          typeArguments: [],
          functionArguments: [accountAddress, tokenAddress],
        },
        options,
      }),
      this.client.view<ConfidentialBalanceResponse>({
        payload: {
          function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::actual_balance`,
          typeArguments: [],
          functionArguments: [accountAddress, tokenAddress],
        },
        options,
      }),
    ]);

    return {
      pending: chunkedPendingBalance.chunks.map(
        (el) => new TwistedElGamalCiphertext(el.left.data.slice(2), el.right.data.slice(2)),
      ),
      actual: chunkedActualBalances.chunks.map(
        (el) => new TwistedElGamalCiphertext(el.left.data.slice(2), el.right.data.slice(2)),
      ),
    };
  }

  async getEncryptionByAddr(args: {
    accountAddress: AccountAddress;
    tokenAddress: string;
    options?: LedgerVersionArg;
  }): Promise<string> {
    const [{ point }] = await this.client.view<[{ point: { data: string } }]>({
      options: args.options,
      payload: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::encryption_key`,
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
    });

    return point.data;
  }

  async registerBalance(
    args: {
      tokenAddress: string;
      publicKey: HexInput | TwistedEd25519PublicKey;
      withFeePayer?: boolean;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, "payload" | "aptosConfig" | "feePayerAddress">,
  ): Promise<SimpleTransaction> {
    const pkU8 = publicKeyToU8(args.publicKey);
    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::register`,
        functionArguments: [args.tokenAddress, pkU8],
      },
    });
  }

  async deposit(
    args: {
      tokenAddress: string;
      amount: AnyNumber;
      /** If not set we will use the sender's address. */
      to?: AccountAddress;
      withFeePayer?: boolean;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, "payload" | "aptosConfig" | "feePayerAddress">,
  ): Promise<SimpleTransaction> {
    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      sender: args.sender,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::deposit_to`,
        functionArguments: [args.tokenAddress, args.to || args.sender, String(args.amount)],
      },
      options: args.options,
    });
  }

  async depositCoin(
    args: {
      coinType: MoveStructId;
      amount: AnyNumber;
      /** If not set we will use the sender's address. */
      to?: AccountAddress;
      withFeePayer?: boolean;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, "payload" | "aptosConfig" | "feePayerAddress">,
  ) {
    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      sender: args.sender,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::deposit_coins_to`,
        functionArguments: [args.to || args.sender, String(args.amount)],
        typeArguments: [args.coinType],
      },
      options: args.options,
    });
  }

  async withdraw(
    args: CreateConfidentialWithdrawOpArgs & {
      tokenAddress: string;
      /** If not set we will use the sender's address. */
      to?: AccountAddressInput;
      withFeePayer?: boolean;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, "payload" | "aptosConfig" | "feePayerAddress">,
  ): Promise<SimpleTransaction> {
    const confidentialWithdraw = await ConfidentialWithdraw.create({
      decryptionKey: toTwistedEd25519PrivateKey(args.decryptionKey),
      encryptedActualBalance: args.encryptedActualBalance,
      amountToWithdraw: args.amountToWithdraw,
      randomness: args.randomness,
    });

    const [{ sigmaProof, rangeProof }, confidentialAmountAfterWithdraw] =
      await confidentialWithdraw.authorizeWithdrawal();

    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      sender: args.sender,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::withdraw_to`,
        functionArguments: [
          args.tokenAddress,
          args.to || AccountAddress.from(args.sender),
          String(args.amountToWithdraw),
          concatBytes(...confidentialAmountAfterWithdraw.map((el) => el.serialize()).flat()),
          rangeProof,
          ConfidentialWithdraw.serializeSigmaProof(sigmaProof),
        ],
      },
      options: args.options,
    });
  }

  /**
   * If you wish to use the default for the module address, just set
   * `confidentialAssetModuleAddress` to the default:
   * `DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS`.
   */
  static buildRolloverPendingBalanceTxPayload(
    args: {
      tokenAddress: string;
      confidentialAssetModuleAddress: string;
      withFreezeBalance?: boolean;
      withFeePayer?: boolean;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, "payload" | "aptosConfig" | "feePayerAddress">,
  ): InputGenerateTransactionPayloadData {
    const method = args.withFreezeBalance ? "rollover_pending_balance_and_freeze" : "rollover_pending_balance";
    return {
      function: `${args.confidentialAssetModuleAddress}::${MODULE_NAME}::${method}`,
      functionArguments: [args.tokenAddress],
    };
  }

  async rolloverPendingBalance(
    args: {
      tokenAddress: string;
      withFreezeBalance?: boolean;
      withFeePayer?: boolean;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, "payload" | "aptosConfig" | "feePayerAddress">,
  ): Promise<SimpleTransaction> {
    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      sender: args.sender,
      data: ConfidentialAsset.buildRolloverPendingBalanceTxPayload({
        ...args,
        confidentialAssetModuleAddress: this.confidentialAssetModuleAddress,
      }),
      options: args.options,
    });
  }

  async safeRolloverPendingCB(
    args: {
      sender: AccountAddressInput;
      tokenAddress: string;
      decryptionKey: TwistedEd25519PrivateKey;
      withFreezeBalance?: boolean;
      withFeePayer?: boolean;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, "payload" | "aptosConfig" | "feePayerAddress">,
  ): Promise<InputGenerateTransactionPayloadData[]> {
    const txPayloadsList: InputGenerateTransactionPayloadData[] = [];

    const isNormalized = await this.isUserBalanceNormalized({
      accountAddress: AccountAddress.from(args.sender),
      tokenAddress: args.tokenAddress,
    });

    if (!isNormalized) {
      const accountBalance = await this.getBalance({
        accountAddress: AccountAddress.from(args.sender),
        tokenAddress: args.tokenAddress,
      });

      const accountCB = await ConfidentialAmount.fromEncrypted(accountBalance.actual, args.decryptionKey);

      const normalizationTxPayload = await ConfidentialAsset.buildNormalizationTxPayload({
        ...args,
        decryptionKey: args.decryptionKey,
        tokenAddress: args.tokenAddress,
        unnormalizedEncryptedBalance: accountBalance.actual,
        balanceAmount: accountCB.amount,
        confidentialAssetModuleAddress: this.confidentialAssetModuleAddress,
      });
      txPayloadsList.push(normalizationTxPayload);
    }

    const rolloverTx = ConfidentialAsset.buildRolloverPendingBalanceTxPayload({
      ...args,
      confidentialAssetModuleAddress: this.confidentialAssetModuleAddress,
    });

    txPayloadsList.push(rolloverTx);

    return txPayloadsList;
  }

  async getAssetAuditor(args: { tokenAddress: string; options?: LedgerVersionArg }) {
    return this.client.view<[{ vec: Uint8Array }]>({
      options: args.options,
      payload: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::get_auditor`,
        functionArguments: [args.tokenAddress],
      },
    });
  }

  async transferCoin(
    args: CreateConfidentialTransferOpArgs & {
      recipientAddress: AccountAddressInput;
      tokenAddress: string;
      withFeePayer?: boolean;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, "payload" | "aptosConfig" | "feePayerAddress">,
  ): Promise<SimpleTransaction> {
    const [{ vec: globalAuditorPubKey }] = await this.getAssetAuditor({
      tokenAddress: args.tokenAddress,
    });

    const confidentialTransfer = await ConfidentialTransfer.create({
      senderDecryptionKey: toTwistedEd25519PrivateKey(args.senderDecryptionKey),
      encryptedActualBalance: args.encryptedActualBalance,
      amountToTransfer: args.amountToTransfer,
      recipientEncryptionKey: toTwistedEd25519PublicKey(args.recipientEncryptionKey),
      auditorEncryptionKeys: [
        ...(globalAuditorPubKey?.length ? [toTwistedEd25519PublicKey(globalAuditorPubKey)] : []),
        ...(args.auditorEncryptionKeys?.map((el) => toTwistedEd25519PublicKey(el)) || []),
      ],
      randomness: args.randomness,
    });

    const [
      {
        sigmaProof,
        rangeProof: { rangeProofAmount, rangeProofNewBalance },
      },
      encryptedAmountAfterTransfer,
      encryptedAmountByRecipient,
      auditorsCBList,
    ] = await confidentialTransfer.authorizeTransfer();

    const newBalance = encryptedAmountAfterTransfer.map((el) => el.serialize()).flat();
    const amountBySender = confidentialTransfer.confidentialAmountToTransfer.amountEncrypted!.map((el) => el.serialize()).flat();
    const amountByRecipient = encryptedAmountByRecipient.map((el) => el.serialize()).flat();
    const auditorEks = confidentialTransfer.auditorsU8EncryptionKeys;
    const auditorBalances = auditorsCBList
      .flat()
      .map((el) => el.serialize())
      .flat();

    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::confidential_transfer`,
        functionArguments: [
          args.tokenAddress,
          args.recipientAddress,
          concatBytes(...newBalance),
          concatBytes(...amountBySender.flat()),
          concatBytes(...amountByRecipient.flat()),
          concatBytes(...auditorEks),
          concatBytes(...auditorBalances),
          rangeProofNewBalance,
          rangeProofAmount,
          ConfidentialTransfer.serializeSigmaProof(sigmaProof),
        ],
      },
    });
  }

  async isBalanceFrozen(args: { accountAddress: AccountAddress; tokenAddress: string; options?: LedgerVersionArg }) {
    const [isFrozen] = await this.client.view<[boolean]>({
      options: args.options,
      payload: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::is_frozen`,
        typeArguments: [],
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
    });

    return isFrozen;
  }

  /**
   * If you wish to use the default for the module address, just set
   * `confidentialAssetModuleAddress` to the default:
   * `DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS`.
   */
  static async buildRotateCBKeyTxPayload(
    args: CreateConfidentialKeyRotationOpArgs & {
      tokenAddress: string;
      withUnfreezeBalance: boolean;
      confidentialAssetModuleAddress: string;
    },
  ): Promise<InputGenerateTransactionPayloadData> {
    const confidentialKeyRotation = await ConfidentialKeyRotation.create({
      currDecryptionKey: toTwistedEd25519PrivateKey(args.currDecryptionKey),
      newDecryptionKey: toTwistedEd25519PrivateKey(args.newDecryptionKey),
      currEncryptedBalance: args.currEncryptedBalance,
      randomness: args.randomness,
    });

    const [{ sigmaProof, rangeProof }, newCB] = await confidentialKeyRotation.authorizeKeyRotation();

    const newPublicKeyU8 = toTwistedEd25519PrivateKey(args.newDecryptionKey).publicKey().toUint8Array();

    const serializedNewBalance = concatBytes(...newCB.map((el) => [el.C.toRawBytes(), el.D.toRawBytes()]).flat());

    const method = args.withUnfreezeBalance ? "rotate_encryption_key_and_unfreeze" : "rotate_encryption_key";

    return {
      function: `${args.confidentialAssetModuleAddress}::${MODULE_NAME}::${method}`,
      functionArguments: [
        args.tokenAddress,
        newPublicKeyU8,
        serializedNewBalance,
        rangeProof,
        ConfidentialKeyRotation.serializeSigmaProof(sigmaProof),
      ],
    };
  }

  async rotateCBKey(
    args: CreateConfidentialKeyRotationOpArgs & {
      tokenAddress: string;
      withUnfreezeBalance: boolean;
      withFeePayer?: boolean;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, "payload" | "aptosConfig" | "feePayerAddress">,
  ): Promise<SimpleTransaction> {
    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      sender: args.sender,
      data: await ConfidentialAsset.buildRotateCBKeyTxPayload({
        ...args,
        confidentialAssetModuleAddress: this.confidentialAssetModuleAddress,
      }),
      options: args.options,
    });
  }

  async safeRotateCBKey(
    aptosClient: Aptos,
    signer: Account,
    args: CreateConfidentialKeyRotationOpArgs & {
      tokenAddress: string;
      withUnfreezeBalance: boolean;
      withFeePayer?: boolean;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, "payload" | "aptosConfig" | "feePayerAddress">,
  ): Promise<CommittedTransactionResponse> {
    const isFrozen = await this.isBalanceFrozen({
      accountAddress: AccountAddress.from(args.sender),
      tokenAddress: args.tokenAddress,
    });

    let currEncryptedBalance = [...args.currEncryptedBalance];
    if (!isFrozen) {
      const rolloverWithFreezeTxBody = await this.rolloverPendingBalance({
        ...args,
        sender: args.sender,
        tokenAddress: args.tokenAddress,
        withFreezeBalance: true,
        withFeePayer: args.withFeePayer,
      });

      const pendingTxResponse = await aptosClient.signAndSubmitTransaction({
        ...args,
        signer,
        transaction: rolloverWithFreezeTxBody,
      });

      const committedTransactionResponse = await aptosClient.waitForTransaction({
        transactionHash: pendingTxResponse.hash,
      });

      if (!committedTransactionResponse.success) {
        throw new TypeError("Failed to freeze balance"); // FIXME: mb create specified error class
      }

      const currConfidentialBalances = await this.getBalance({
        accountAddress: AccountAddress.from(args.sender),
        tokenAddress: args.tokenAddress,
      });

      currEncryptedBalance = currConfidentialBalances.actual;
    }

    const rotateKeyTxBody = await this.rotateCBKey({
      ...args,
      currEncryptedBalance,
      withFeePayer: args.withFeePayer,
    });

    const pendingTxResponse = await aptosClient.signAndSubmitTransaction({
      ...args,
      signer,
      transaction: rotateKeyTxBody,
    });

    return aptosClient.waitForTransaction({
      transactionHash: pendingTxResponse.hash,
    });
  }

  async hasUserRegistered(args: { accountAddress: AccountAddress; tokenAddress: string; options?: LedgerVersionArg }) {
    const [isRegister] = await this.client.view<[boolean]>({
      payload: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::has_confidential_asset_store`,
        typeArguments: [],
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
      options: args.options,
    });

    return isRegister;
  }

  async isUserBalanceNormalized(args: {
    accountAddress: AccountAddress;
    tokenAddress: string;
    options?: LedgerVersionArg;
  }) {
    const [isNormalized] = await this.client.view<[boolean]>({
      payload: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::is_normalized`,
        typeArguments: [],
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
      options: args.options,
    });

    return isNormalized;
  }

  /**
   * If you wish to use the default for the module address, just set
   * `confidentialAssetModuleAddress` to the default:
   * `DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS`.
   */
  static async buildNormalizationTxPayload(
    args: CreateConfidentialNormalizationOpArgs & {
      tokenAddress: string;
      confidentialAssetModuleAddress: string;
    },
  ): Promise<InputGenerateTransactionPayloadData> {
    const confidentialNormalization = await ConfidentialNormalization.create({
      decryptionKey: args.decryptionKey,
      unnormalizedEncryptedBalance: args.unnormalizedEncryptedBalance,
      balanceAmount: args.balanceAmount,
      randomness: args.randomness,
    });

    const [{ sigmaProof, rangeProof }, normalizedCB] = await confidentialNormalization.authorizeNormalization();

    return {
      function: `${args.confidentialAssetModuleAddress}::${MODULE_NAME}::normalize`,
      functionArguments: [
        args.tokenAddress,
        concatBytes(...normalizedCB.map((el) => el.serialize()).flat()),
        rangeProof,
        ConfidentialNormalization.serializeSigmaProof(sigmaProof),
      ],
    };
  }

  async normalizeUserBalance(
    args: CreateConfidentialNormalizationOpArgs & {
      tokenAddress: string;
      withFeePayer?: boolean;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, "payload" | "aptosConfig" | "feePayerAddress">,
  ) {
    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      sender: args.sender,
      data: await ConfidentialAsset.buildNormalizationTxPayload({
        ...args,
        confidentialAssetModuleAddress: this.confidentialAssetModuleAddress,
      }),
      options: args.options,
    });
  }
}
