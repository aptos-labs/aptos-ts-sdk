// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AccountAddressInput,
  AnyNumber,
  AptosConfig,
  CommittedTransactionResponse,
  HexInput,
  InputGenerateTransactionOptions,
  LedgerVersionArg,
  SimpleTransaction,
} from "@aptos-labs/ts-sdk";
import { TwistedEd25519PublicKey, TwistedEd25519PrivateKey, ConfidentialNormalization } from "../crypto";
import { clearBalanceCache, clearEncryptionKeyCache, getEncryptionKeyCacheKey, setCache } from "../utils/memoize";
import {
  ConfidentialAssetTransactionBuilder,
  ConfidentialBalance,
  getBalance,
  getEncryptionKey,
  isBalanceNormalized,
  isPendingBalanceFrozen,
} from "../internal";

// Constants
import { DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS, MODULE_NAME } from "../consts";

// Base param types
type ConfidentialAssetSubmissionParams = {
  signer: Account;
  tokenAddress: AccountAddressInput;
  withFeePayer?: boolean;
  options?: InputGenerateTransactionOptions;
  signAndSubmitCallback?: (transaction: SimpleTransaction, account: Account) => Promise<HexInput>;
};

type RegisterBalanceParams = ConfidentialAssetSubmissionParams & {
  decryptionKey: TwistedEd25519PrivateKey;
};

type DepositParams = ConfidentialAssetSubmissionParams & {
  amount: AnyNumber;
  recipient?: AccountAddressInput;
};

type WithdrawParams = ConfidentialAssetSubmissionParams & {
  senderDecryptionKey: TwistedEd25519PrivateKey;
  amount: AnyNumber;
  recipient?: AccountAddressInput;
};

type TransferParams = WithdrawParams & {
  additionalAuditorEncryptionKeys?: TwistedEd25519PublicKey[];
};

type RolloverParams = ConfidentialAssetSubmissionParams & {
  senderDecryptionKey?: TwistedEd25519PrivateKey;
  withFreezeBalance?: boolean;
};

type RotateKeyParams = ConfidentialAssetSubmissionParams & {
  senderDecryptionKey: TwistedEd25519PrivateKey;
  newSenderDecryptionKey: TwistedEd25519PrivateKey;
};

type NormalizeBalanceParams = ConfidentialAssetSubmissionParams & {
  senderDecryptionKey: TwistedEd25519PrivateKey;
};

/**
 * A class to handle confidential balance operations
 *
 * TODO: Add key caching to avoid fetching the same key multiple times
 */
export class ConfidentialAsset {
  transaction: ConfidentialAssetTransactionBuilder;
  signAndSubmitCallback: (transaction: SimpleTransaction, account: Account) => Promise<HexInput>;

  constructor(args: {
    config: AptosConfig;
    confidentialAssetModuleAddress?: string;
    signAndSubmitCallback?: (transaction: SimpleTransaction, account: Account) => Promise<HexInput>;
  }) {
    const {
      config,
      confidentialAssetModuleAddress = DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS,
      signAndSubmitCallback,
    } = args;
    this.transaction = new ConfidentialAssetTransactionBuilder(config, { confidentialAssetModuleAddress });
    this.signAndSubmitCallback =
      signAndSubmitCallback ??
      (async (transaction: SimpleTransaction, account: Account) => {
        const pendingTx = await this.client().signAndSubmitTransaction({ transaction, signer: account });
        return pendingTx.hash;
      });
  }

  setSignAndSubmitCallback(
    signAndSubmitCallback: (transaction: SimpleTransaction, account: Account) => Promise<HexInput>,
  ) {
    this.signAndSubmitCallback = signAndSubmitCallback;
  }

  private client() {
    return this.transaction.client;
  }

  private moduleAddress() {
    return this.transaction.confidentialAssetModuleAddress;
  }

  async getBalance(args: {
    accountAddress: AccountAddressInput;
    tokenAddress: AccountAddressInput;
    decryptionKey: TwistedEd25519PrivateKey;
    useCachedValue?: boolean;
    options?: LedgerVersionArg;
  }): Promise<ConfidentialBalance> {
    return getBalance({
      client: this.client(),
      moduleAddress: this.moduleAddress(),
      ...args,
    });
  }

  /**
   * Register a confidential balance for an account
   *
   * @param args.signer - The address of the sender of the transaction
   * @param args.tokenAddress - The token address of the asset to register the balance for
   * @param args.decryptionKey - The decryption key for which the corresponding encryption key will be used registered for the balance
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @param args.options - Optional transaction options
   * @returns A SimpleTransaction to register the balance
   */
  async registerBalance(args: RegisterBalanceParams): Promise<CommittedTransactionResponse> {
    const { signer, ...rest } = args;
    const tx = await this.transaction.registerBalance({ ...rest, sender: signer.accountAddress });
    const transactionHash = await this.signAndSubmitCallback(tx, signer);
    return this.client().waitForTransaction({ transactionHash });
  }

  /**
   * Deposit an amount from a non-confidential asset balance into a confidential asset balance.
   *
   * This can be used by an account to convert their own non-confidential asset balance into a confidential asset balance if they have
   * already registered a balance for the token.
   *
   * @param args.tokenAddress - The token address of the asset to deposit to
   * @param args.amount - The amount to deposit
   * @param args.recipient - The account address to deposit to. This is the senders address if not set.
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @param args.options - Optional transaction options
   * @returns A SimpleTransaction to deposit the amount
   */
  async deposit(args: DepositParams): Promise<CommittedTransactionResponse> {
    const { signer, ...rest } = args;
    const tx = await this.transaction.deposit({ ...rest, sender: signer.accountAddress });
    const result = await this.submitTxn({ signer, transaction: tx });
    clearBalanceCache(signer.accountAddress, args.tokenAddress, this.client().config.network);
    return result;
  }

  /**
   * Withdraw an amount from a confidential asset balance.
   *
   * This can be used by an account to convert their own confidential asset balance into a non-confidential asset balance.
   *
   * @param args.signer - The account that will sign the transaction
   * @param args.senderDecryptionKey - The decryption key of the sender
   * @param args.tokenAddress - The token address of the asset to withdraw from
   * @param args.amount - The amount to withdraw
   * @param args.recipient - The account address to withdraw to. This is the signer's address if not set
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @param args.usePendingBalance - If true, will attempt to rollover pending balance if needed
   * @param args.options - Optional transaction options
   * @param args.signAndSubmitCallback - Optional callback for custom transaction submission
   * @returns A single transaction response, or array of responses if using pending balance
   * @throws {Error} If the amount to withdraw is greater than the available balance
   */
  async withdraw(
    args: ConfidentialAssetSubmissionParams & {
      senderDecryptionKey: TwistedEd25519PrivateKey;
      amount: AnyNumber;
      usePendingBalance: true;
      recipient?: AccountAddressInput;
    },
  ): Promise<CommittedTransactionResponse[]>;

  async withdraw(
    args: ConfidentialAssetSubmissionParams & {
      senderDecryptionKey: TwistedEd25519PrivateKey;
      amount: AnyNumber;
      usePendingBalance?: false;
      recipient?: AccountAddressInput;
    },
  ): Promise<CommittedTransactionResponse>;

  async withdraw(
    args: ConfidentialAssetSubmissionParams & {
      senderDecryptionKey: TwistedEd25519PrivateKey;
      amount: AnyNumber;
      usePendingBalance?: boolean;
      recipient?: AccountAddressInput;
    },
  ): Promise<CommittedTransactionResponse | CommittedTransactionResponse[]> {
    const { signer, ...rest } = args;

    if (args.usePendingBalance) {
      const results: CommittedTransactionResponse[] = [];

      const committedRolloverTxs = await this.checkSufficientBalanceAndRolloverIfNeeded({
        signer,
        tokenAddress: args.tokenAddress,
        amount: args.amount,
        senderDecryptionKey: args.senderDecryptionKey,
        withFeePayer: args.withFeePayer,
        options: args.options,
      });
      results.push(...committedRolloverTxs);

      const tx = await this.transaction.withdraw({ ...rest, sender: signer.accountAddress });
      results.push(
        await this.submitTxn({
          signer,
          transaction: tx,
          signAndSubmitCallback: args.signAndSubmitCallback,
        }),
      );
      clearBalanceCache(signer.accountAddress, args.tokenAddress, this.client().config.network);
      return results;
    } else {
      const tx = await this.transaction.withdraw({ ...rest, sender: signer.accountAddress });
      const result = await this.submitTxn({
        signer,
        transaction: tx,
        signAndSubmitCallback: args.signAndSubmitCallback,
      });
      clearBalanceCache(signer.accountAddress, args.tokenAddress, this.client().config.network);
      return result;
    }
  }

  /**
   * Rollover an account's pending balance for an asset into the available balance.
   *
   * @param args.signer - The address of the sender of the transaction
   * @param args.tokenAddress - The token address of the asset to roll over
   * @param args.withFreezeBalance - Whether to freeze the balance after rolling over. Default is false.
   * @param args.checkNormalized - Whether to check if the balance is normalized before rolling over. Default is true.
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @returns A SimpleTransaction to roll over the balance
   * @throws {Error} If the balance is not normalized before rolling over, unless checkNormalized is false.
   */
  async rolloverPendingBalance(args: RolloverParams): Promise<CommittedTransactionResponse[]> {
    const { signer, ...rest } = args;
    const results: CommittedTransactionResponse[] = [];
    const isNormalized = await this.isBalanceNormalized({
      accountAddress: signer.accountAddress,
      tokenAddress: args.tokenAddress,
    });
    if (!isNormalized) {
      if (!args.senderDecryptionKey) {
        throw new Error(
          "Rollover failed. Available balance is not normalized and no sender decryption key was provided.",
        );
      }
      const commitedNormalizeTx = await this.normalizeBalance({
        signer,
        senderDecryptionKey: args.senderDecryptionKey,
        tokenAddress: args.tokenAddress,
        withFeePayer: args.withFeePayer,
        options: args.options,
      });
      results.push(commitedNormalizeTx);
    }
    const transaction = await this.transaction.rolloverPendingBalance({
      ...rest,
      sender: signer.accountAddress,
    });
    const committedRolloverTx = await this.submitTxn({
      signer,
      transaction,
    });
    clearBalanceCache(signer.accountAddress, args.tokenAddress, this.client().config.network);
    results.push(committedRolloverTx);
    return results;
  }

  /**
   * Get the encryption key for the asset auditor for a given token address.
   *
   * @param args.tokenAddress - The token address of the asset to get the auditor for
   * @param args.options.ledgerVersion - The ledger version to use for the view call
   * @returns The encryption key for the asset auditor or undefined if no auditor is set
   */
  async getAssetAuditorEncryptionKey(args: {
    tokenAddress: AccountAddressInput;
    options?: LedgerVersionArg;
  }): Promise<TwistedEd25519PublicKey | undefined> {
    const [{ vec: globalAuditorPubKey }] = await this.client().view<[{ vec: Uint8Array }]>({
      options: args.options,
      payload: {
        function: `${this.moduleAddress()}::${MODULE_NAME}::get_auditor`,
        functionArguments: [args.tokenAddress],
      },
    });
    if (globalAuditorPubKey.length === 0) {
      return undefined;
    }
    return new TwistedEd25519PublicKey(globalAuditorPubKey);
  }

  /**
   * Transfer an amount from a confidential asset balance to a recipient.
   *
   * This can be used by an account to transfer their own confidential asset balance to a recipient.
   *
   * @param args.signer - The account that will sign the transaction
   * @param args.recipient - The address of the recipient
   * @param args.tokenAddress - The token address of the asset to transfer
   * @param args.amount - The amount to transfer
   * @param args.senderDecryptionKey - The decryption key of the sender
   * @param args.usePendingBalance - If true, will attempt to rollover pending balance if needed
   * @param args.additionalAuditorEncryptionKeys - Optional additional auditor encryption keys
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @param args.options - Optional transaction options
   * @param args.signAndSubmitCallback - Optional callback for custom transaction submission
   * @returns A single transaction response, or array of responses if using pending balance
   * @throws {Error} If the recipient's encryption key cannot be found
   * @throws {Error} If the amount to transfer is greater than the available balance
   */
  async transfer(
    args: ConfidentialAssetSubmissionParams & {
      recipient: AccountAddressInput;
      amount: AnyNumber;
      senderDecryptionKey: TwistedEd25519PrivateKey;
      usePendingBalance: true;
      additionalAuditorEncryptionKeys?: TwistedEd25519PublicKey[];
    },
  ): Promise<CommittedTransactionResponse[]>;

  async transfer(
    args: ConfidentialAssetSubmissionParams & {
      recipient: AccountAddressInput;
      amount: AnyNumber;
      senderDecryptionKey: TwistedEd25519PrivateKey;
      usePendingBalance?: false;
      additionalAuditorEncryptionKeys?: TwistedEd25519PublicKey[];
    },
  ): Promise<CommittedTransactionResponse>;

  async transfer(
    args: ConfidentialAssetSubmissionParams & {
      recipient: AccountAddressInput;
      amount: AnyNumber;
      senderDecryptionKey: TwistedEd25519PrivateKey;
      usePendingBalance?: boolean;
      additionalAuditorEncryptionKeys?: TwistedEd25519PublicKey[];
    },
  ): Promise<CommittedTransactionResponse | CommittedTransactionResponse[]> {
    const { signer, ...rest } = args;
    const results: CommittedTransactionResponse[] = [];

    if (args.usePendingBalance) {
      const committedRolloverTxs = await this.checkSufficientBalanceAndRolloverIfNeeded({
        signer,
        tokenAddress: args.tokenAddress,
        amount: args.amount,
        senderDecryptionKey: args.senderDecryptionKey,
        withFeePayer: args.withFeePayer,
      });
      results.push(...committedRolloverTxs);
      const transaction = await this.transaction.transfer({ ...rest, sender: signer.accountAddress });

      results.push(
        await this.submitTxn({
          signer,
          transaction,
          signAndSubmitCallback: args.signAndSubmitCallback,
        }),
      );
      clearBalanceCache(signer.accountAddress, args.tokenAddress, this.client().config.network);
      return results;
    } else {
      const transaction = await this.transaction.transfer({ ...rest, sender: signer.accountAddress });
      const result = await this.submitTxn({
        signer,
        transaction,
        signAndSubmitCallback: args.signAndSubmitCallback,
      });
      clearBalanceCache(signer.accountAddress, args.tokenAddress, this.client().config.network);
      return result;
    }
  }

  /**
   * Check if a user's balance is frozen.
   *
   * A user's balance would likely be frozen if they plan to rotate their encryption key after a rollover. Rotating the encryption key requires
   * the pending balance to be empty so a user may want to freeze their balance to prevent others from transferring into their pending balance
   * which would interfere with the rotation, as it would require a user to rollover their pending balance.
   *
   * @param args.accountAddress - The account address to check
   * @param args.tokenAddress - The token address of the asset to check
   * @param args.options.ledgerVersion - The ledger version to use for the view call
   * @returns A boolean indicating if the user's balance is frozen
   * @throws {AptosApiError} If the there is no registered confidential balance for token address on the account
   */
  async isPendingBalanceFrozen(args: {
    accountAddress: AccountAddressInput;
    tokenAddress: AccountAddressInput;
    options?: LedgerVersionArg;
  }): Promise<boolean> {
    return isPendingBalanceFrozen({
      client: this.client(),
      moduleAddress: this.moduleAddress(),
      ...args,
    });
  }

  /**
   * Rotate the encryption key for a confidential asset balance.
   *
   * This will check if the pending balance is empty and roll it over if needed. It also checks if the balance
   * is frozen and will unfreeze it if necessary.
   *
   * @param args.signer - The account that will sign the transaction
   * @param args.senderDecryptionKey - The current decryption key
   * @param args.newSenderDecryptionKey - The new decryption key to rotate to
   * @param args.tokenAddress - The token address of the asset
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @param args.options - Optional transaction options
   * @returns Array of transaction responses (may include rollover transactions)
   * @throws {Error} If the pending balance is not empty and cannot be rolled over
   */
  async rotateEncryptionKey(args: RotateKeyParams): Promise<CommittedTransactionResponse[]> {
    const { signer, senderDecryptionKey, newSenderDecryptionKey, tokenAddress, withFeePayer, options } = args;
    const results: CommittedTransactionResponse[] = [];

    const balance = await this.getBalance({
      accountAddress: signer.accountAddress,
      tokenAddress,
      decryptionKey: senderDecryptionKey,
    });
    if (balance.pendingBalance() > 0n) {
      const rolloverTxs = await this.rolloverPendingBalance({
        signer,
        senderDecryptionKey,
        tokenAddress,
        withFreezeBalance: true,
        withFeePayer,
        options,
      });
      results.push(...rolloverTxs);
    }
    const tx = await this.transaction.rotateEncryptionKey({
      sender: signer.accountAddress,
      senderDecryptionKey,
      newSenderDecryptionKey,
      tokenAddress,
      withFeePayer,
      options,
    });
    results.push(
      await this.submitTxn({
        signer,
        transaction: tx,
      }),
    );
    clearEncryptionKeyCache(signer.accountAddress, args.tokenAddress, this.client().config.network);
    setCache(
      getEncryptionKeyCacheKey(signer.accountAddress, args.tokenAddress, this.client().config.network),
      newSenderDecryptionKey,
    );
    return results;
  }

  /**
   * Check if a user has registered a confidential asset balance for a particular token.
   *
   * @param args.accountAddress - The account address to check
   * @param args.tokenAddress - The token address of the asset to check
   * @param args.options.ledgerVersion - The ledger version to use for the view call
   * @returns A boolean indicating if the user has registered a confidential asset balance
   */
  async hasUserRegistered(args: {
    accountAddress: AccountAddressInput;
    tokenAddress: AccountAddressInput;
    options?: LedgerVersionArg;
  }): Promise<boolean> {
    const [isRegistered] = await this.client().view<[boolean]>({
      payload: {
        function: `${this.moduleAddress()}::${MODULE_NAME}::has_confidential_asset_store`,
        typeArguments: [],
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
      options: args.options,
    });

    return isRegistered;
  }

  /**
   * Check if a user's balance is normalized.
   *
   * This can be used to check if a user's balance is normalized for a given token address.
   *
   * @param args.accountAddress - The account address to check
   * @param args.tokenAddress - The token address of the asset to check
   * @param args.options.ledgerVersion - The ledger version to use for the view call
   * @returns A boolean indicating if the user's balance is normalized
   * @throws {AptosApiError} If the there is no registered confidential balance for token address on the account
   */
  async isBalanceNormalized(args: {
    accountAddress: AccountAddressInput;
    tokenAddress: AccountAddressInput;
    options?: LedgerVersionArg;
  }): Promise<boolean> {
    return isBalanceNormalized({
      client: this.client(),
      moduleAddress: this.moduleAddress(),
      ...args,
    });
  }

  /**
   * Get the encryption key for an account for a given token.
   *
   * @param args.accountAddress - The account address to get the encryption key for
   * @param args.tokenAddress - The token address of the asset
   * @param args.options - Optional ledger version for the view call
   * @returns The encryption key as a TwistedEd25519PublicKey
   * @throws {Error} If the encryption key cannot be found
   */
  async getEncryptionKey(args: {
    accountAddress: AccountAddressInput;
    tokenAddress: AccountAddressInput;
    options?: LedgerVersionArg;
  }): Promise<TwistedEd25519PublicKey> {
    return getEncryptionKey({
      client: this.client(),
      moduleAddress: this.moduleAddress(),
      ...args,
    });
  }

  /**
   * Normalize a user's balance.
   *
   * This can be used to normalize a user's balance for a given token address.
   *
   * @param args.signer - The account that will sign the transaction
   * @param args.senderDecryptionKey - The decryption key of the sender
   * @param args.tokenAddress - The token address of the asset to normalize
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @param args.options - Optional transaction options
   * @returns A committed transaction response
   * @throws {Error} If normalization fails
   */
  async normalizeBalance(args: NormalizeBalanceParams): Promise<CommittedTransactionResponse> {
    const { signer, senderDecryptionKey, tokenAddress, withFeePayer, options } = args;
    const { available, pending } = await this.getBalance({
      accountAddress: signer.accountAddress,
      tokenAddress,
      decryptionKey: senderDecryptionKey,
      useCachedValue: true,
    });

    const confidentialNormalization = await ConfidentialNormalization.create({
      decryptionKey: senderDecryptionKey,
      unnormalizedAvailableBalance: available,
    });

    const transaction = await confidentialNormalization.createTransaction({
      client: this.client(),
      sender: signer.accountAddress,
      confidentialAssetModuleAddress: this.transaction.confidentialAssetModuleAddress,
      tokenAddress,
      withFeePayer,
      options,
    });
    const committedTransaction = await this.submitTxn({
      signer,
      transaction,
    });
    const newBalance = new ConfidentialBalance(confidentialNormalization.normalizedEncryptedAvailableBalance, pending);
    setCache(`${signer.accountAddress}-balance-for-${tokenAddress}-${this.client().config.network}`, newBalance);
    return committedTransaction;
  }

  private async submitTxn(args: {
    signer: Account;
    transaction: SimpleTransaction;
    signAndSubmitCallback?: (transaction: SimpleTransaction, account: Account) => Promise<HexInput>;
  }) {
    const { signer, transaction, signAndSubmitCallback } = args;
    let transactionHash: HexInput;
    if (signAndSubmitCallback) {
      transactionHash = await signAndSubmitCallback(transaction, signer);
    } else {
      transactionHash = await this.signAndSubmitCallback(transaction, signer);
    }
    const committedTx = await this.client().waitForTransaction({
      transactionHash,
      options: {
        checkSuccess: true,
      },
    });
    return committedTx;
  }

  private async checkSufficientBalanceAndRolloverIfNeeded(args: {
    signer: Account;
    tokenAddress: AccountAddressInput;
    amount: AnyNumber;
    senderDecryptionKey: TwistedEd25519PrivateKey;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<CommittedTransactionResponse[]> {
    const { signer, ...rest } = args;
    const results: CommittedTransactionResponse[] = [];
    const balance = await this.getBalance({
      accountAddress: signer.accountAddress,
      tokenAddress: args.tokenAddress,
      decryptionKey: args.senderDecryptionKey,
    });
    if (balance.availableBalance() < BigInt(args.amount)) {
      if (balance.availableBalance() + balance.pendingBalance() < BigInt(args.amount)) {
        throw new Error(
          `Insufficient balance. Pending balance - ${balance.pendingBalance().toString()}, Available balance - ${balance.availableBalance().toString()}`,
        );
      }
      const committedRolloverTx = await this.rolloverPendingBalance({
        signer,
        senderDecryptionKey: args.senderDecryptionKey,
        tokenAddress: args.tokenAddress,
        withFeePayer: args.withFeePayer,
        options: args.options,
      });
      results.push(...committedRolloverTx);
    }
    return results;
  }
}
