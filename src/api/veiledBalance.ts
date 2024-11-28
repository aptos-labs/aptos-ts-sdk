// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AccountAddress,
  AccountAddressInput,
  ProofVeiledTransferInputs,
  SigmaProofVeiledKeyRotationInputs,
  TwistedEd25519PrivateKey,
  TwistedEd25519PublicKey,
  TwistedElGamalCiphertext,
} from "../core";
import {
  depositToVeiledBalanceTransaction,
  getVeiledBalances,
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
    changedBalance: bigint;
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

  async transferCoin(
    args: ProofVeiledTransferInputs & {
      sender: AccountAddressInput;
      tokenAddress: string;
      recipient: AccountAddressInput;
      options?: InputGenerateTransactionOptions;
    },
  ): Promise<SimpleTransaction> {
    return veiledTransferCoinTransaction({ aptosConfig: this.config, ...args });
  }

  async keyRotation(
    args: SigmaProofVeiledKeyRotationInputs & {
      sender: AccountAddressInput;
      tokenAddress: string;
      withUnfreezeBalance: boolean;
      options?: InputGenerateTransactionOptions;
    },
  ): Promise<SimpleTransaction> {
    return veiledBalanceKeyRotationTransaction({ aptosConfig: this.config, ...args });
  }
}
