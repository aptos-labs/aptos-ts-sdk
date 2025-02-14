// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { concatBytes } from "@noble/hashes/utils";
import {
  AccountAddress,
  AccountAddressInput,
  CreateConfidentialKeyRotationOpArgs,
  CreateVeiledNormalizationOpArgs,
  CreateVeiledTransferOpArgs,
  CreateVeiledWithdrawOpArgs,
  TwistedEd25519PrivateKey,
  TwistedEd25519PublicKey,
  TwistedElGamalCiphertext,
  ConfidentialKeyRotation,
  VeiledNormalization,
  VeiledTransfer,
  VeiledWithdraw,
  ConfidentialAmount,
} from "../core";
import { publicKeyToU8, toTwistedEd25519PrivateKey, toTwistedEd25519PublicKey } from "../core/crypto/veiled/helpers";
import { generateTransaction } from "../internal/transactionSubmission";
import { view } from "../internal/view";
import {
  InputGenerateTransactionOptions,
  InputGenerateTransactionPayloadData,
  SimpleTransaction,
} from "../transactions";
import { AnyNumber, CommittedTransactionResponse, HexInput, LedgerVersionArg } from "../types";
import { AptosConfig } from "./aptosConfig";
import type { Aptos } from "./aptos";
import { Account } from "../account";

export type VeiledBalanceResponse = {
  chunks: {
    left: { data: string };
    right: { data: string };
  }[];
}[];

export type VeiledBalance = {
  pending: TwistedElGamalCiphertext[];
  actual: TwistedElGamalCiphertext[];
};

// 8 chunks module
const VEILED_COIN_MODULE_ADDRESS = "0x78812b8cb4980793621276f253f1be30e991beb8fca6c058362c39a9722d3503";

/**
 * A class to handle veiled balance operations
 */
export class ConfidentialCoin {
  constructor(readonly config: AptosConfig) {}

  static VEILED_COIN_MODULE_ADDRESS = VEILED_COIN_MODULE_ADDRESS;

  static setVeiledCoinModuleAddress(addr: string) {
    this.VEILED_COIN_MODULE_ADDRESS = addr;
  }

  async getBalance(args: {
    accountAddress: AccountAddress;
    tokenAddress: string;
    options?: LedgerVersionArg;
  }): Promise<VeiledBalance> {
    const { accountAddress, tokenAddress, options } = args;
    const [[chunkedPendingBalance], [chunkedActualBalances]] = await Promise.all([
      view<VeiledBalanceResponse>({
        aptosConfig: this.config,
        payload: {
          function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::pending_balance`,
          typeArguments: [],
          functionArguments: [accountAddress, tokenAddress],
        },
        options,
      }),
      view<VeiledBalanceResponse>({
        aptosConfig: this.config,
        payload: {
          function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::actual_balance`,
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

  async registerBalance(args: {
    sender: AccountAddressInput;
    tokenAddress: string;
    publicKey: HexInput | TwistedEd25519PublicKey;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const pkU8 = publicKeyToU8(args.publicKey);
    return generateTransaction({
      aptosConfig: this.config,
      sender: args.sender,
      data: {
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::register`,
        functionArguments: [args.tokenAddress, pkU8],
      },
      options: args.options,
    });
  }

  async deposit(args: {
    sender: AccountAddressInput;
    tokenAddress: string;
    amount: AnyNumber;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return generateTransaction({
      aptosConfig: this.config,
      sender: args.sender,
      data: {
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::veil_to`,
        functionArguments: [args.tokenAddress, args.sender, String(args.amount)],
      },
      options: args.options,
    });
  }

  async withdraw(
    args: CreateVeiledWithdrawOpArgs & {
      sender: AccountAddressInput;
      tokenAddress: string;
      options?: InputGenerateTransactionOptions;
    },
  ): Promise<SimpleTransaction> {
    const veiledWithdraw = await VeiledWithdraw.create({
      decryptionKey: toTwistedEd25519PrivateKey(args.decryptionKey),
      encryptedActualBalance: args.encryptedActualBalance,
      amountToWithdraw: args.amountToWithdraw,
      randomness: args.randomness,
    });

    const [{ sigmaProof, rangeProof }, veiledAmountAfterWithdraw] = await veiledWithdraw.authorizeWithdrawal();

    return generateTransaction({
      aptosConfig: this.config,
      sender: args.sender,
      data: {
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::unveil_to`,
        functionArguments: [
          args.tokenAddress,
          AccountAddress.from(args.sender),
          String(args.amountToWithdraw),
          concatBytes(...veiledAmountAfterWithdraw.map((el) => el.serialize()).flat()),
          rangeProof,
          VeiledWithdraw.serializeSigmaProof(sigmaProof),
        ],
      },
      options: args.options,
    });
  }

  static buildRolloverPendingBalanceTxPayload(args: {
    tokenAddress: string;
    withFreezeBalance?: boolean;
  }): InputGenerateTransactionPayloadData {
    const method = args.withFreezeBalance ? "rollover_pending_balance_and_freeze" : "rollover_pending_balance";

    return {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::${method}`,
      functionArguments: [args.tokenAddress],
    };
  }

  async rolloverPendingBalance(args: {
    sender: AccountAddressInput;
    tokenAddress: string;
    withFreezeBalance?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return generateTransaction({
      aptosConfig: this.config,
      sender: args.sender,
      data: ConfidentialCoin.buildRolloverPendingBalanceTxPayload(args),
      options: args.options,
    });
  }

  async safeRolloverPendingVB(args: {
    sender: AccountAddressInput;
    tokenAddress: string;
    withFreezeBalance?: boolean;
    decryptionKey: TwistedEd25519PrivateKey;
  }): Promise<InputGenerateTransactionPayloadData[]> {
    const txList: InputGenerateTransactionPayloadData[] = [];

    const isNormalized = await this.isUserBalanceNormalized({
      accountAddress: AccountAddress.from(args.sender),
      tokenAddress: args.tokenAddress,
    });

    if (!isNormalized) {
      const accountBalance = await this.getBalance({
        accountAddress: AccountAddress.from(args.sender),
        tokenAddress: args.tokenAddress,
      });

      const accountVB = await ConfidentialAmount.fromEncrypted(accountBalance.actual, args.decryptionKey);

      const normalizationTx = await ConfidentialCoin.buildNormalizationTxPayload({
        decryptionKey: args.decryptionKey,
        sender: args.sender,
        tokenAddress: args.tokenAddress,
        unnormalizedEncryptedBalance: accountBalance.actual,
        balanceAmount: accountVB.amount,
      });
      txList.push(normalizationTx);
    }

    const rolloverTx = ConfidentialCoin.buildRolloverPendingBalanceTxPayload(args);

    txList.push(rolloverTx);

    return txList;
  }

  async getGlobalAuditor(args?: { options?: LedgerVersionArg }) {
    return view<[AccountAddressInput, { vec: Uint8Array }]>({
      aptosConfig: this.config,
      options: args?.options,
      payload: {
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::get_auditor`,
      },
    });
  }

  async transferCoin(
    args: CreateVeiledTransferOpArgs & {
      sender: AccountAddressInput;
      recipientAddress: AccountAddressInput;
      tokenAddress: string;
      options?: InputGenerateTransactionOptions;
    },
  ): Promise<SimpleTransaction> {
    const [, { vec: globalAuditorPubKey }] = await this.getGlobalAuditor();

    const veiledTransfer = await VeiledTransfer.create({
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
      auditorsVBList,
    ] = await veiledTransfer.authorizeTransfer();

    const newBalance = encryptedAmountAfterTransfer.map((el) => el.serialize()).flat();
    const transferBalance = encryptedAmountByRecipient.map((el) => el.serialize()).flat();
    const auditorEks = veiledTransfer.auditorsU8EncryptionKeys;
    const auditorBalances = auditorsVBList
      .flat()
      .map((el) => el.serialize())
      .flat();

    return generateTransaction({
      aptosConfig: this.config,
      sender: args.sender,
      data: {
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::fully_veiled_transfer`,
        functionArguments: [
          args.tokenAddress,
          args.recipientAddress,
          concatBytes(...newBalance),
          concatBytes(...transferBalance),
          concatBytes(...auditorEks),
          concatBytes(...auditorBalances),
          rangeProofNewBalance,
          rangeProofAmount,
          VeiledTransfer.serializeSigmaProof(sigmaProof),
        ],
      },
      options: args.options,
    });
  }

  async isBalanceFrozen(args: { accountAddress: AccountAddress; tokenAddress: string; options?: LedgerVersionArg }) {
    const [isFrozen] = await view<[boolean]>({
      aptosConfig: this.config,
      options: args.options,
      payload: {
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::is_frozen`,
        typeArguments: [],
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
    });

    return isFrozen;
  }

  static async buildRotateVBKeyTxPayload(
    args: CreateConfidentialKeyRotationOpArgs & {
      sender: AccountAddressInput;
      tokenAddress: string;

      withUnfreezeBalance: boolean;
      options?: InputGenerateTransactionOptions;
    },
  ): Promise<InputGenerateTransactionPayloadData> {
    const veiledKeyRotation = await ConfidentialKeyRotation.create({
      currDecryptionKey: toTwistedEd25519PrivateKey(args.currDecryptionKey),
      newDecryptionKey: toTwistedEd25519PrivateKey(args.newDecryptionKey),
      currEncryptedBalance: args.currEncryptedBalance,
      randomness: args.randomness,
    });

    const [{ sigmaProof, rangeProof }, newVB] = await veiledKeyRotation.authorizeKeyRotation();

    const newPublicKeyU8 = toTwistedEd25519PrivateKey(args.newDecryptionKey).publicKey().toUint8Array();

    const serializedNewBalance = concatBytes(...newVB.map((el) => [el.C.toRawBytes(), el.D.toRawBytes()]).flat());

    const method = args.withUnfreezeBalance ? "rotate_encryption_key_and_unfreeze" : "rotate_encryption_key";

    return {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::${method}`,
      functionArguments: [
        args.tokenAddress,
        newPublicKeyU8,
        serializedNewBalance,
        rangeProof,
        ConfidentialKeyRotation.serializeSigmaProof(sigmaProof),
      ],
    };
  }

  async rotateVBKey(
    args: CreateConfidentialKeyRotationOpArgs & {
      sender: AccountAddressInput;
      tokenAddress: string;

      withUnfreezeBalance: boolean;
      options?: InputGenerateTransactionOptions;
    },
  ): Promise<SimpleTransaction> {
    return generateTransaction({
      aptosConfig: this.config,
      sender: args.sender,
      data: await ConfidentialCoin.buildRotateVBKeyTxPayload(args),
      options: args.options,
    });
  }

  static async safeRotateVBKey(
    aptosClient: Aptos,
    signer: Account,
    args: CreateConfidentialKeyRotationOpArgs & {
      sender: AccountAddressInput;
      tokenAddress: string;
      withUnfreezeBalance: boolean;
      options?: InputGenerateTransactionOptions;
    },
  ): Promise<CommittedTransactionResponse> {
    const isFrozen = await aptosClient.veiledCoin.isBalanceFrozen({
      accountAddress: AccountAddress.from(args.sender),
      tokenAddress: args.tokenAddress,
    });

    let currEncryptedBalance = [...args.currEncryptedBalance];
    if (!isFrozen) {
      const rolloverWithFreezeTxBody = await aptosClient.veiledCoin.rolloverPendingBalance({
        sender: args.sender,
        tokenAddress: args.tokenAddress,
        withFreezeBalance: true,
      });

      const pendingTxResponse = await aptosClient.signAndSubmitTransaction({
        signer,
        transaction: rolloverWithFreezeTxBody,
      });

      const committedTransactionResponse = await aptosClient.waitForTransaction({
        transactionHash: pendingTxResponse.hash,
      });

      if (!committedTransactionResponse.success) {
        throw new TypeError("Failed to freeze balance"); // FIXME: mb create specified error class
      }

      const currVeiledBalances = await aptosClient.veiledCoin.getBalance({
        accountAddress: AccountAddress.from(args.sender),
        tokenAddress: args.tokenAddress,
      });

      currEncryptedBalance = currVeiledBalances.actual;
    }

    const rotateKeyTxBody = await aptosClient.veiledCoin.rotateVBKey({
      ...args,
      currEncryptedBalance,
    });

    const pendingTxResponse = await aptosClient.signAndSubmitTransaction({
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
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::has_veiled_coin_store`,
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
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::is_normalized`,
        typeArguments: [],
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
      options: args.options,
    });

    return isNormalized;
  }

  static async buildNormalizationTxPayload(
    args: CreateVeiledNormalizationOpArgs & {
      sender: AccountAddressInput;
      tokenAddress: string;

      options?: InputGenerateTransactionOptions;
    },
  ): Promise<InputGenerateTransactionPayloadData> {
    const veiledNormalization = await VeiledNormalization.create({
      decryptionKey: args.decryptionKey,
      unnormalizedEncryptedBalance: args.unnormalizedEncryptedBalance,
      balanceAmount: args.balanceAmount,
      randomness: args.randomness,
    });

    const [{ sigmaProof, rangeProof }, normalizedVB] = await veiledNormalization.authorizeNormalization();

    return {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::normalize`,
      functionArguments: [
        args.tokenAddress,
        concatBytes(...normalizedVB.map((el) => el.serialize()).flat()),
        rangeProof,
        VeiledNormalization.serializeSigmaProof(sigmaProof),
      ],
    };
  }

  async normalizeUserBalance(
    args: CreateVeiledNormalizationOpArgs & {
      sender: AccountAddressInput;
      tokenAddress: string;

      options?: InputGenerateTransactionOptions;
    },
  ) {
    return generateTransaction({
      aptosConfig: this.config,
      sender: args.sender,
      data: await ConfidentialCoin.buildNormalizationTxPayload(args),
      options: args.options,
    });
  }
}
