// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { concatBytes } from "@noble/hashes/utils";
import {
  AccountAddress,
  AccountAddressInput,
  TwistedEd25519PrivateKey,
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

const VEILED_COIN_MODULE_ADDRESS = "0xcbd21318a3fe6eb6c01f3c371d9aca238a6cd7201d3fc75627767b11b87dcbf5";

/**
 * A class to handle veiled balance operations
 */
export class VeiledBalance {
  constructor(readonly config: AptosConfig) {}

  async getBalance(args: {
    accountAddress: AccountAddress;
    tokenAddress: string;
    options?: LedgerVersionArg;
  }): Promise<{
    pending: TwistedElGamalCiphertext[];
    actual: TwistedElGamalCiphertext[];
  }> {
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

  async withdraw(args: {
    privateKey: TwistedEd25519PrivateKey | HexInput;
    encryptedBalance: TwistedElGamalCiphertext[];
    amount: bigint;
    sender: AccountAddressInput;
    tokenAddress: string;
    randomness?: bigint[];
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const veiledWithdraw = await VeiledWithdraw.create({
      privateKey: toTwistedEd25519PrivateKey(args.privateKey),
      encryptedActualBalance: args.encryptedBalance,
      amountToWithdraw: args.amount,
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
          String(args.amount),
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

  async safeRolloverPendingVeiledBalanceTransaction(args: {
    sender: AccountAddressInput;
    tokenAddress: string;
    withFreezeBalance?: boolean;

    privateKey: TwistedEd25519PrivateKey;
    unnormilizedEncryptedBalance: TwistedElGamalCiphertext[];
    balanceAmount: bigint;
    randomness?: bigint[];

    options?: InputGenerateTransactionOptions;
  }) {
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
        accountAddress: AccountAddress.from(args.sender),
        tokenAddress: args.tokenAddress,

        privateKey: args.privateKey,
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
    const resp = await view<[AccountAddressInput, { vec: Uint8Array }]>({
      aptosConfig: this.config,
      options: args?.options,
      payload: {
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::get_auditor`,
      },
    });

    return resp;
  }

  async transferCoin(args: {
    senderPrivateKey: TwistedEd25519PrivateKey | HexInput;
    recipientPublicKey: TwistedEd25519PublicKey | HexInput;
    encryptedBalance: TwistedElGamalCiphertext[];
    amount: bigint;
    auditorPublicKeys?: (TwistedEd25519PublicKey | HexInput)[];
    randomness?: bigint[];

    sender: AccountAddressInput;
    tokenAddress: string;
    recipient: AccountAddressInput;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const [, { vec: globalAuditorPubKey }] = await this.getGlobalAuditor();

    const veiledTransfer = await VeiledTransfer.create({
      senderPrivateKey: toTwistedEd25519PrivateKey(args.senderPrivateKey),
      encryptedActualBalance: args.encryptedBalance,
      amountToTransfer: args.amount,
      recipientPublicKey: toTwistedEd25519PublicKey(args.recipientPublicKey),
      auditorPublicKeys: [
        ...(globalAuditorPubKey?.length ? [toTwistedEd25519PublicKey(globalAuditorPubKey)] : []),
        ...(args.auditorPublicKeys?.map((el) => toTwistedEd25519PublicKey(el)) || []),
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
    const auditorEks = veiledTransfer.auditorsU8PublicKeys;
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
          args.recipient,
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

  async rotateVBKey(args: {
    oldPrivateKey: TwistedEd25519PrivateKey | HexInput;
    newPrivateKey: TwistedEd25519PrivateKey | HexInput;
    balance: bigint;
    oldEncryptedBalance: TwistedElGamalCiphertext[];
    randomness?: bigint[];
    sender: AccountAddressInput;
    tokenAddress: string;
    withUnfreezeBalance: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const veiledKeyRotation = await VeiledKeyRotation.create({
      currPrivateKey: toTwistedEd25519PrivateKey(args.oldPrivateKey),
      newPrivateKey: toTwistedEd25519PrivateKey(args.newPrivateKey),
      currEncryptedBalance: args.oldEncryptedBalance,
    });

    const [{ sigmaProof, rangeProof }, newVB] = await veiledKeyRotation.authorizeKeyRotation();

    const newPublicKeyU8 = toTwistedEd25519PrivateKey(args.newPrivateKey).publicKey().toUint8Array();

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

  async safeRotateVBKey(args: {
    oldPrivateKey: TwistedEd25519PrivateKey | HexInput;
    newPrivateKey: TwistedEd25519PrivateKey | HexInput;
    balance: bigint;
    oldEncryptedBalance: TwistedElGamalCiphertext[];
    randomness?: bigint[];
    sender: AccountAddressInput;
    tokenAddress: string;
    withUnfreezeBalance: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction[]> {
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

    if (!isFrozen) {
      const rolloverWithFreezeTx = await this.rolloverPendingBalance({
        sender: args.sender,
        tokenAddress: args.tokenAddress,

        withFreezeBalance: true,
        options: {
          ...args.options,
          accountSequenceNumber: Number(accountSequenceNumber),
        },
      });
      txList.push(rolloverWithFreezeTx);
    }

    const rotateKeyTx = await this.rotateVBKey({
      oldPrivateKey: args.oldPrivateKey,
      newPrivateKey: args.newPrivateKey,
      balance: args.balance,
      oldEncryptedBalance: args.oldEncryptedBalance,
      randomness: args.randomness,

      sender: args.sender,
      tokenAddress: args.tokenAddress,
      withUnfreezeBalance: args.withUnfreezeBalance,

      options: {
        ...args.options,
        accountSequenceNumber: txList?.length ? Number(accountSequenceNumber) + 1 : Number(accountSequenceNumber),
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

  async normalizeUserBalance(args: {
    accountAddress: AccountAddress;
    tokenAddress: string;

    privateKey: TwistedEd25519PrivateKey;
    unnormilizedEncryptedBalance: TwistedElGamalCiphertext[];
    balanceAmount: bigint;
    randomness?: bigint[];

    sender: AccountAddressInput;

    options?: InputGenerateTransactionOptions;
  }) {
    const veiledNormalization = await VeiledNormalization.create({
      privateKey: args.privateKey,
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
