// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AccountAddress,
  AccountAddressInput,
  TwistedEd25519PrivateKey,
  TwistedEd25519PublicKey,
  TwistedElGamalCiphertext,
} from "../core";
import {
  depositToVeiledBalanceTransaction,
  getVeiledBalances,
  hasUserRegistered,
  isUserBalanceNormalized,
  normalizeUserBalance,
  registerVeiledBalanceTransaction,
  rolloverPendingVeiledBalanceTransaction,
  veiledBalanceKeyRotationTransaction,
  veiledTransferCoinTransaction,
  veiledWithdrawTransaction,
} from "../internal/veiledBalance";
import { InputGenerateTransactionOptions, SimpleTransaction } from "../transactions";
import { AnyNumber, HexInput, LedgerVersionArg } from "../types";
import { AptosConfig } from "./aptosConfig";

/**
 * A class to handle veiled balance operations
 */
export class VeiledBalance {
  constructor(readonly config: AptosConfig) {}

  async getBalance(args: {
    accountAddress: AccountAddress;
    tokenAddress: string;
    options?: LedgerVersionArg;
  }): ReturnType<typeof getVeiledBalances> {
    return getVeiledBalances({ aptosConfig: this.config, ...args });
  }

  async registerBalance(args: {
    sender: AccountAddressInput;
    tokenAddress: string;
    publicKey: HexInput | TwistedEd25519PublicKey;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return registerVeiledBalanceTransaction({ aptosConfig: this.config, ...args });
  }

  async deposit(args: {
    sender: AccountAddressInput;
    tokenAddress: string;
    amount: AnyNumber;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return depositToVeiledBalanceTransaction({ aptosConfig: this.config, ...args });
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
    return veiledWithdrawTransaction({ aptosConfig: this.config, ...args });
  }

  async rolloverPendingBalance(args: {
    sender: AccountAddressInput;
    tokenAddress: string;
    withFreezeBalance?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return rolloverPendingVeiledBalanceTransaction({ aptosConfig: this.config, ...args });
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
    return veiledTransferCoinTransaction({ aptosConfig: this.config, ...args });
  }

  async keyRotation(args: {
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
    return veiledBalanceKeyRotationTransaction({ aptosConfig: this.config, ...args });
  }

  async hasUserRegistered(args: { accountAddress: AccountAddress; tokenAddress: string; options?: LedgerVersionArg }) {
    return hasUserRegistered({ aptosConfig: this.config, ...args });
  }

  async isUserBalanceNormalized(args: {
    accountAddress: AccountAddress;
    tokenAddress: string;
    options?: LedgerVersionArg;
  }) {
    return isUserBalanceNormalized({ aptosConfig: this.config, ...args });
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
    return normalizeUserBalance({ aptosConfig: this.config, ...args });
  }
}
