// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { concatBytes } from "@noble/hashes/utils";
import {
  AccountAddress,
  AccountAddressInput,
  CreateVeiledKeyRotationOpArgs,
  CreateVeiledNormalizationOpArgs,
  CreateVeiledTransferOpArgs,
  CreateVeiledWithdrawOpArgs,
  TwistedEd25519PublicKey,
  TwistedElGamalCiphertext,
  VeiledKeyRotation,
  VeiledNormalization,
  VeiledTransfer,
  VeiledWithdraw,
} from "../core";
import { publicKeyToU8, toTwistedEd25519PrivateKey, toTwistedEd25519PublicKey } from "../core/crypto/veiled/helpers";
import { generateTransaction } from "../internal/transactionSubmission";
import { view } from "../internal/view";
import { InputGenerateTransactionOptions, SimpleTransaction } from "../transactions";
import { AnyNumber, HexInput, LedgerVersionArg } from "../types";
import { AptosConfig } from "./aptosConfig";
import { Account } from "./account";

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

const VEILED_COIN_MODULE_ADDRESS = "0xcbd21318a3fe6eb6c01f3c371d9aca238a6cd7201d3fc75627767b11b87dcbf5";

/**
 * A class to handle veiled balance operations
 */
export class VeiledCoin {
  constructor(readonly config: AptosConfig) {}

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

  async rolloverPendingBalance(args: {
    sender: AccountAddressInput;
    tokenAddress: string;
    withFreezeBalance?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const method = args.withFreezeBalance ? "rollover_pending_balance_and_freeze" : "rollover_pending_balance";

    return generateTransaction({
      aptosConfig: this.config,
      sender: args.sender,
      data: {
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::${method}`,
        functionArguments: [args.tokenAddress],
      },
      options: args.options,
    });
  }

  async safeRolloverPendingVB(
    args: CreateVeiledNormalizationOpArgs & {
      sender: AccountAddressInput;
      tokenAddress: string;
      withFreezeBalance?: boolean;

      options?: InputGenerateTransactionOptions;
    },
  ) {
    const txList: SimpleTransaction[] = [];

    const isNormalized = await this.isUserBalanceNormalized({
      accountAddress: AccountAddress.from(args.sender),
      tokenAddress: args.tokenAddress,
    });

    let accountSequenceNumber = args.options?.accountSequenceNumber;

    if (!accountSequenceNumber) {
      const account = new Account(this.config);

      const senderAccountInfo = await account.getAccountInfo({
        accountAddress: args.sender,
      });

      accountSequenceNumber = Number(senderAccountInfo.sequence_number);
    }

    if (!isNormalized) {
      const normalizeTx = await this.normalizeUserBalance({
        tokenAddress: args.tokenAddress,

        decryptionKey: args.decryptionKey,
        unnormilizedEncryptedBalance: args.unnormilizedEncryptedBalance,
        balanceAmount: args.balanceAmount,
        randomness: args.randomness,

        sender: args.sender,

        options: { ...args.options, accountSequenceNumber: Number(accountSequenceNumber) },
      });

      txList.push(normalizeTx);
    }

    const rolloverTx = await this.rolloverPendingBalance({
      sender: args.sender,
      tokenAddress: args.tokenAddress,
      withFreezeBalance: args.withFreezeBalance,
      options: {
        ...args.options,
        accountSequenceNumber: txList?.length ? Number(accountSequenceNumber) + 1 : Number(accountSequenceNumber),
      },
    });

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

  async rotateVBKey(
    args: CreateVeiledKeyRotationOpArgs & {
      sender: AccountAddressInput;
      tokenAddress: string;

      withUnfreezeBalance: boolean;
      options?: InputGenerateTransactionOptions;
    },
  ): Promise<SimpleTransaction> {
    const veiledKeyRotation = await VeiledKeyRotation.create({
      currDecryptionKey: toTwistedEd25519PrivateKey(args.currDecryptionKey),
      newDecryptionKey: toTwistedEd25519PrivateKey(args.newDecryptionKey),
      currEncryptedBalance: args.currEncryptedBalance,
      randomness: args.randomness,
    });

    const [{ sigmaProof, rangeProof }, newVB] = await veiledKeyRotation.authorizeKeyRotation();

    const newPublicKeyU8 = toTwistedEd25519PrivateKey(args.newDecryptionKey).publicKey().toUint8Array();

    const serializedNewBalance = concatBytes(...newVB.map((el) => [el.C.toRawBytes(), el.D.toRawBytes()]).flat());

    const method = args.withUnfreezeBalance ? "rotate_encryption_key_and_unfreeze" : "rotate_encryption_key";

    return generateTransaction({
      aptosConfig: this.config,
      sender: args.sender,
      data: {
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::${method}`,
        functionArguments: [
          args.tokenAddress,
          newPublicKeyU8,
          serializedNewBalance,
          rangeProof,
          VeiledKeyRotation.serializeSigmaProof(sigmaProof),
        ],
      },
      options: args.options,
    });
  }

  async safeRotateVBKey(
    args: CreateVeiledKeyRotationOpArgs &
      CreateVeiledNormalizationOpArgs & {
        sender: AccountAddressInput;
        tokenAddress: string;
        withUnfreezeBalance: boolean;
        options?: InputGenerateTransactionOptions;
      },
  ): Promise<SimpleTransaction[]> {
    const isFrozen = await this.isBalanceFrozen({
      accountAddress: AccountAddress.from(args.sender),
      tokenAddress: args.tokenAddress,
    });

    let accountSequenceNumber = args.options?.accountSequenceNumber;

    if (!accountSequenceNumber) {
      const account = new Account(this.config);

      const senderAccountInfo = await account.getAccountInfo({
        accountAddress: args.sender,
      });

      accountSequenceNumber = Number(senderAccountInfo.sequence_number);
    }

    const txList: SimpleTransaction[] = [];

    const { currEncryptedBalance } = args;

    if (!isFrozen) {
      const rolloverWithFreezeTx = await this.safeRolloverPendingVB({
        sender: args.sender,
        tokenAddress: args.tokenAddress,
        withFreezeBalance: true,

        decryptionKey: args.currDecryptionKey,
        unnormilizedEncryptedBalance: currEncryptedBalance,
        balanceAmount: args.balanceAmount,

        options: {
          ...args.options,
          accountSequenceNumber: txList?.length
            ? txList[txList.length - 1].rawTransaction.sequence_number
            : Number(accountSequenceNumber),
        },
      });
      txList.push(...rolloverWithFreezeTx);
    }

    const rotateKeyTx = await this.rotateVBKey({
      currDecryptionKey: args.currDecryptionKey,
      newDecryptionKey: args.newDecryptionKey,
      currEncryptedBalance: args.currEncryptedBalance,
      randomness: args.randomness,

      sender: args.sender,
      tokenAddress: args.tokenAddress,
      withUnfreezeBalance: args.withUnfreezeBalance,

      options: {
        ...args.options,
        accountSequenceNumber: txList?.length
          ? txList[txList.length - 1].rawTransaction.sequence_number
          : Number(accountSequenceNumber),
      },
    });
    txList.push(rotateKeyTx);

    return txList;
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

  async normalizeUserBalance(
    args: CreateVeiledNormalizationOpArgs & {
      sender: AccountAddressInput;
      tokenAddress: string;

      options?: InputGenerateTransactionOptions;
    },
  ) {
    const veiledNormalization = await VeiledNormalization.create({
      decryptionKey: args.decryptionKey,
      unnormilizedEncryptedBalance: args.unnormilizedEncryptedBalance,
      balanceAmount: args.balanceAmount,
      randomness: args.randomness,
    });

    const [{ sigmaProof, rangeProof }, normalizedVB] = await veiledNormalization.authorizeNormalization();

    return generateTransaction({
      aptosConfig: this.config,
      sender: args.sender,
      data: {
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::normalize`,
        functionArguments: [
          args.tokenAddress,
          concatBytes(...normalizedVB.map((el) => el.serialize()).flat()),
          rangeProof,
          VeiledNormalization.serializeSigmaProof(sigmaProof),
        ],
      },
      options: args.options,
    });
  }
}
