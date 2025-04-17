// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { concatBytes } from "@noble/hashes/utils";
import {
  AccountAddress,
  AccountAddressInput,
  CreateConfidentialKeyRotationOpArgs,
  CreateConfidentialNormalizationOpArgs,
  CreateConfidentialTransferOpArgs,
  CreateConfidentialWithdrawOpArgs,
  TwistedEd25519PrivateKey,
  TwistedEd25519PublicKey,
  TwistedElGamalCiphertext,
  ConfidentialKeyRotation,
  ConfidentialNormalization,
  ConfidentialTransfer,
  ConfidentialWithdraw,
  ConfidentialAmount,
} from "../core";
import {
  publicKeyToU8,
  toTwistedEd25519PrivateKey,
  toTwistedEd25519PublicKey,
} from "../core/crypto/confidential/helpers";
import { generateTransaction } from "../internal/transactionSubmission";
import { view } from "../internal/view";
import {
  InputGenerateSingleSignerRawTransactionArgs,
  InputGenerateTransactionPayloadData,
  SimpleTransaction,
} from "../transactions";
import { AnyNumber, CommittedTransactionResponse, HexInput, LedgerVersionArg, MoveStructId } from "../types";
import { AptosConfig } from "./aptosConfig";
import type { Aptos } from "./aptos";
import { Account } from "../account";

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

const CONFIDENTIAL_COIN_MODULE_ADDRESS = "0xcbd21318a3fe6eb6c01f3c371d9aca238a6cd7201d3fc75627767b11b87dcbf5";
const MODULE_NAME = "confidential_asset";

/**
 * A class to handle confidential balance operations
 */
export class ConfidentialAsset {
  constructor(readonly config: AptosConfig) { }

  static CONFIDENTIAL_COIN_MODULE_ADDRESS = CONFIDENTIAL_COIN_MODULE_ADDRESS;

  static setConfidentialCoinModuleAddress(addr: string) {
    this.CONFIDENTIAL_COIN_MODULE_ADDRESS = addr;
  }

  async getBalance(args: {
    accountAddress: AccountAddress;
    tokenAddress: string;
    options?: LedgerVersionArg;
  }): Promise<ConfidentialBalance> {
    const { accountAddress, tokenAddress, options } = args;
    const [[chunkedPendingBalance], [chunkedActualBalances]] = await Promise.all([
      view<ConfidentialBalanceResponse>({
        aptosConfig: this.config,
        payload: {
          function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::pending_balance`,
          typeArguments: [],
          functionArguments: [accountAddress, tokenAddress],
        },
        options,
      }),
      view<ConfidentialBalanceResponse>({
        aptosConfig: this.config,
        payload: {
          function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::actual_balance`,
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
    const [{ point }] = await view<[{ point: { data: string } }]>({
      aptosConfig: this.config,
      options: args.options,
      payload: {
        function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::encryption_key`,
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
    });

    return point.data;
  }

  async registerBalance(args: {
    tokenAddress: string;
    publicKey: HexInput | TwistedEd25519PublicKey;
  } & Omit<InputGenerateSingleSignerRawTransactionArgs, 'payload' | 'aptosConfig'>): Promise<SimpleTransaction> {
    const pkU8 = publicKeyToU8(args.publicKey);
    return generateTransaction({
      ...args,
      withFeePayer: Boolean(args.feePayerAddress),
      aptosConfig: this.config,
      data: {
        function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::register`,
        functionArguments: [args.tokenAddress, pkU8],
      },
    });
  }

  async deposit(args: {
    tokenAddress: string;
    amount: AnyNumber;
    to?: AccountAddress;
  } & Omit<InputGenerateSingleSignerRawTransactionArgs, 'payload' | 'aptosConfig'>): Promise<SimpleTransaction> {
    return generateTransaction({
      ...args,
      withFeePayer: Boolean(args.feePayerAddress),
      aptosConfig: this.config,
      sender: args.sender,
      data: {
        function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::deposit_to`,
        functionArguments: [args.tokenAddress, args.to || args.sender, String(args.amount)],
      },
      options: args.options,
    });
  }

  async depositCoin(args: {
    coinType: MoveStructId;
    amount: AnyNumber;
    to?: AccountAddress;
  } & Omit<InputGenerateSingleSignerRawTransactionArgs, 'payload' | 'aptosConfig'>) {
    return generateTransaction({
      ...args,
      withFeePayer: Boolean(args.feePayerAddress),
      aptosConfig: this.config,
      sender: args.sender,
      data: {
        function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::deposit_coins_to`,
        functionArguments: [args.to || args.sender, String(args.amount)],
        typeArguments: [args.coinType],
      },
      options: args.options,
    });
  }

  async withdraw(
    args: CreateConfidentialWithdrawOpArgs & {
      to?: AccountAddressInput;
      tokenAddress: string;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, 'payload' | 'aptosConfig'>,
  ): Promise<SimpleTransaction> {
    const confidentialWithdraw = await ConfidentialWithdraw.create({
      decryptionKey: toTwistedEd25519PrivateKey(args.decryptionKey),
      encryptedActualBalance: args.encryptedActualBalance,
      amountToWithdraw: args.amountToWithdraw,
      randomness: args.randomness,
    });

    const [{ sigmaProof, rangeProof }, confidentialAmountAfterWithdraw] =
      await confidentialWithdraw.authorizeWithdrawal();

    return generateTransaction({
      ...args,
      withFeePayer: Boolean(args.feePayerAddress),
      aptosConfig: this.config,
      sender: args.sender,
      data: {
        function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::withdraw_to`,
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

  static buildRolloverPendingBalanceTxPayload(args: {
    tokenAddress: string;
    withFreezeBalance?: boolean;
  } & Omit<InputGenerateSingleSignerRawTransactionArgs, 'payload' | 'aptosConfig'>): InputGenerateTransactionPayloadData {
    const method = args.withFreezeBalance ? "rollover_pending_balance_and_freeze" : "rollover_pending_balance";

    return {
      function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::${method}`,
      functionArguments: [args.tokenAddress],
    };
  }

  async rolloverPendingBalance(args: {
    tokenAddress: string;
    withFreezeBalance?: boolean;
  } & Omit<InputGenerateSingleSignerRawTransactionArgs, 'payload' | 'aptosConfig'>): Promise<SimpleTransaction> {
    return generateTransaction({
      ...args,
      withFeePayer: Boolean(args.feePayerAddress),
      aptosConfig: this.config,
      sender: args.sender,
      data: ConfidentialAsset.buildRolloverPendingBalanceTxPayload(args),
      options: args.options,
    });
  }

  async safeRolloverPendingCB(args: {
    sender: AccountAddressInput;
    tokenAddress: string;
    withFreezeBalance?: boolean;
    decryptionKey: TwistedEd25519PrivateKey;
  } & Omit<InputGenerateSingleSignerRawTransactionArgs, 'payload' | 'aptosConfig'>): Promise<InputGenerateTransactionPayloadData[]> {
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
      });
      txPayloadsList.push(normalizationTxPayload);
    }

    const rolloverTx = ConfidentialAsset.buildRolloverPendingBalanceTxPayload(args);

    txPayloadsList.push(rolloverTx);

    return txPayloadsList;
  }

  async getAssetAuditor(args: { tokenAddress: string; options?: LedgerVersionArg }) {
    return view<[{ vec: Uint8Array }]>({
      aptosConfig: this.config,
      options: args.options,
      payload: {
        function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::get_auditor`,
        functionArguments: [args.tokenAddress],
      },
    });
  }

  async transferCoin(
    args: CreateConfidentialTransferOpArgs & {
      recipientAddress: AccountAddressInput;
      tokenAddress: string;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, 'payload' | 'aptosConfig'>,
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
    const transferBalance = encryptedAmountByRecipient.map((el) => el.serialize()).flat();
    const auditorEks = confidentialTransfer.auditorsU8EncryptionKeys;
    const auditorBalances = auditorsCBList
      .flat()
      .map((el) => el.serialize())
      .flat();

    return generateTransaction({
      ...args,
      withFeePayer: Boolean(args.feePayerAddress),
      aptosConfig: this.config,
      data: {
        function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::confidential_transfer`,
        functionArguments: [
          args.tokenAddress,
          args.recipientAddress,
          concatBytes(...newBalance),
          concatBytes(...transferBalance),
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
    const [isFrozen] = await view<[boolean]>({
      aptosConfig: this.config,
      options: args.options,
      payload: {
        function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::is_frozen`,
        typeArguments: [],
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
    });

    return isFrozen;
  }

  static async buildRotateCBKeyTxPayload(
    args: CreateConfidentialKeyRotationOpArgs & {
      tokenAddress: string;

      withUnfreezeBalance: boolean;
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
      function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::${method}`,
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
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, 'payload' | 'aptosConfig'>,
  ): Promise<SimpleTransaction> {
    return generateTransaction({
      ...args,
      withFeePayer: Boolean(args.feePayerAddress),
      aptosConfig: this.config,
      sender: args.sender,
      data: await ConfidentialAsset.buildRotateCBKeyTxPayload(args),
      options: args.options,
    });
  }

  static async safeRotateCBKey(
    aptosClient: Aptos,
    signer: Account,
    args: CreateConfidentialKeyRotationOpArgs & {
      tokenAddress: string;
      withUnfreezeBalance: boolean;
    } & Omit<InputGenerateSingleSignerRawTransactionArgs, 'payload' | 'aptosConfig'>,
  ): Promise<CommittedTransactionResponse> {
    const isFrozen = await aptosClient.confidentialAsset.isBalanceFrozen({
      accountAddress: AccountAddress.from(args.sender),
      tokenAddress: args.tokenAddress,
    });

    let currEncryptedBalance = [...args.currEncryptedBalance];
    if (!isFrozen) {
      const rolloverWithFreezeTxBody = await aptosClient.confidentialAsset.rolloverPendingBalance({
        ...args,
        sender: args.sender,
        tokenAddress: args.tokenAddress,
        withFreezeBalance: true,
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

      const currConfidentialBalances = await aptosClient.confidentialAsset.getBalance({
        accountAddress: AccountAddress.from(args.sender),
        tokenAddress: args.tokenAddress,
      });

      currEncryptedBalance = currConfidentialBalances.actual;
    }

    const rotateKeyTxBody = await aptosClient.confidentialAsset.rotateCBKey({
      ...args,
      currEncryptedBalance,
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
    const [isRegister] = await view<[boolean]>({
      aptosConfig: this.config,
      payload: {
        function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::has_confidential_asset_store`,
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
    const [isNormalized] = await view<[boolean]>({
      aptosConfig: this.config,
      payload: {
        function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::is_normalized`,
        typeArguments: [],
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
      options: args.options,
    });

    return isNormalized;
  }

  static async buildNormalizationTxPayload(
    args: CreateConfidentialNormalizationOpArgs & {
      tokenAddress: string;
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
      function: `${ConfidentialAsset.CONFIDENTIAL_COIN_MODULE_ADDRESS}::${MODULE_NAME}::normalize`,
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

    } & Omit<InputGenerateSingleSignerRawTransactionArgs, 'payload' | 'aptosConfig'>,
  ) {
    return generateTransaction({
      ...args,
      withFeePayer: Boolean(args.feePayerAddress),
      aptosConfig: this.config,
      sender: args.sender,
      data: await ConfidentialAsset.buildNormalizationTxPayload(args),
      options: args.options,
    });
  }
}
