import aptosClient from "@aptos-labs/aptos-client";
import { Account, Ed25519Account, MultiEd25519Account } from "../account";
import { AccountAddress, AccountAddressInput, AccountPublicKey, Ed25519PrivateKey } from "../core";
import { AptosApiError } from "../errors";
import { RegisterNameParameters } from "../internal/ans";
import { CreateCollectionOptions, PropertyType, PropertyValue } from "../internal/digitalAsset";
import {
  ChainId,
  generateRawTransaction,
  InputGenerateTransactionOptions,
  InputGenerateTransactionPayloadData,
  RawTransaction,
  SimpleTransaction,
  TransactionPayload,
} from "../transactions";
import {
  MoveStructId,
  AnyNumber,
  HexInput,
  UserTransactionResponse,
  TransactionSubmitter,
  AptosSettings,
  PendingTransactionResponse,
} from "../types";
import { DEFAULT_TXN_TIMEOUT_SEC, Network, NetworkToChainId } from "../utils";
import { Aptos } from "./aptos";
import { AptosConfig } from "./aptosConfig";

type FunctionsWithReturnType<T, ReturnType> = {
  [K in keyof T]: T[K] extends (...args: any[]) => ReturnType
  ? T[K] extends <M extends {} = any>(...args: any[]) => Promise<M>
  ? never
  : K
  : never;
}[keyof T];

// Helper type to remove 'sender', 'account', and 'creator' from function parameters
type RemoveSender<T> = T extends (args: infer Args) => infer Return
  ? Args extends { sender?: any; account?: any; creator?: any;[key: string]: any }
  ? (args: Omit<Args, "sender" | "account" | "creator" | "fromAccount">) => Return
  : T
  : T;

// Helper type to transform function return type from Promise<SimpleTransaction> to TransactionContext
type TransformReturnType<T> = T extends (...args: infer Args) => Promise<SimpleTransaction>
  ? (...args: Args) => SenderlessTransactionContext
  : T;

type SimpleTransactionGenerator = {
  [K in FunctionsWithReturnType<Aptos, Promise<SimpleTransaction>>]: TransformReturnType<RemoveSender<Aptos[K]>>;
};

type TransactionGenerationArgs = {
  sender: Account;
  options: InputGenerateTransactionOptions;
  aptos: Aptos;
};

type TransactionGenerationFunction = (args: TransactionGenerationArgs) => Promise<SimpleTransaction>;

abstract class ContextBase {
  aptos: Aptos;

  timeoutSecs: number;
  checkSuccess: boolean;
  waitForIndexer: boolean;

  constructor(args: { aptos: Aptos, timeoutSecs: number, checkSuccess: boolean, waitForIndexer: boolean }) {
    const { aptos, timeoutSecs, checkSuccess, waitForIndexer } = args;
    const aptosConfig = new AptosConfig({
      ...aptos.config,
    });
    this.aptos = new Aptos(aptosConfig);
    this.timeoutSecs = timeoutSecs;
    this.checkSuccess = checkSuccess;
    this.waitForIndexer = waitForIndexer;
  }
}

/**
 * Contains all the information needed to generate and submit a transaction to the Aptos blockchain.
 *
 * Provides a builder pattern for setting the transaction parameters. Use the `TransactionManager` to
 * create `TransactionContext` instances for interacting with the Aptos blockchain.
 *
 * Each `TransactionContext` instance has its own Aptos client which is copied at creation time.
 *
 * @example
 * ```typescript
 * const account = Account.generate();
 * const recipient = Account.generate();
 *
 * const txnManager = TransactionManager.new(aptos);
 *
 * await txnManager.fundAccount(account).submit();
 *
 * const response = await txnManager
 *   .transferCoinTransaction({
 *     recipient: recipient.accountAddress,
 *     amount: TRANSFER_AMOUNT,
 *   })
 *   .sender(account)
 *   .submit();
 * ```
 */
export class SenderlessTransactionContext extends ContextBase {
  /** Function to generate the transaction */
  transactionGenerationFunction: TransactionGenerationFunction;

  /** Maximum amount of gas units that can be used to execute the transaction */
  maxGasAmount: number;

  /** Price per gas unit for the transaction */
  gasUnitPrice?: number;

  /** Transaction ordering mode - either "sequential" or "orderless" */
  orderMode?: OrderMode;

  /** Transaction expiry time in seconds from now, overrides default if set */
  txnExpirySecsFromNow: number;

  /** Whether this transaction uses a fee payer */
  withFeePayer: boolean;

  /** Optional parameters passed to transaction plugins */
  pluginParams?: Record<string, any>;

  /** Optional custom transaction submitter */
  transactionSubmitter?: TransactionSubmitter | null;

  /** Timeout in seconds when waiting for transaction */
  timeoutSecs: number;

  /** Whether to wait for transaction to be indexed */
  waitForIndexer: boolean;

  /** Whether to check transaction success status */
  checkSuccess: boolean;

  /** Optional fee payer account */
  feePayerAccount: Account | undefined;

  constructor(args: {
    aptos: Aptos;
    maxGasAmount: number;
    gasUnitPrice?: number;
    txnExpirySecsFromNow: number;
    withFeePayer: boolean;
    orderMode?: OrderMode;
    transactionSubmitter?: TransactionSubmitter | null;
    pluginParams?: Record<string, any>;
    timeoutSecs: number;
    waitForIndexer: boolean;
    checkSuccess: boolean;
    transactionGenerationFunction: TransactionGenerationFunction;
  }) {
    const { aptos, 
      maxGasAmount, 
      gasUnitPrice, 
      txnExpirySecsFromNow, 
      withFeePayer,
      orderMode,
      transactionSubmitter,
      pluginParams,
      timeoutSecs,
      waitForIndexer,
      checkSuccess,
      transactionGenerationFunction
    } = args;
    super({ aptos, timeoutSecs, checkSuccess, waitForIndexer });
    this.maxGasAmount = maxGasAmount;
    this.gasUnitPrice = gasUnitPrice;
    this.txnExpirySecsFromNow = txnExpirySecsFromNow;
    this.withFeePayer = withFeePayer;
    this.orderMode = orderMode;
    // this.senderAccount = manager.getDefaultSender();
    this.transactionSubmitter = transactionSubmitter;
    this.pluginParams = pluginParams;
    this.timeoutSecs = timeoutSecs;
    this.checkSuccess = checkSuccess;
    this.waitForIndexer = waitForIndexer;
    this.transactionGenerationFunction = transactionGenerationFunction;
  }

  setSender(sender: Account): TransactionContext {
    return new TransactionContext({
      ...this,
      senderAccount: sender,
    });
  }
}

export class TransactionContext extends SenderlessTransactionContext implements SubmittableContext {
  sender: Account;

  constructor(args: {
    aptos: Aptos;
    maxGasAmount: number;
    gasUnitPrice?: number;
    txnExpirySecsFromNow: number;
    withFeePayer: boolean;
    orderMode?: OrderMode;
    transactionSubmitter?: TransactionSubmitter | null;
    pluginParams?: Record<string, any>;
    timeoutSecs: number;
    waitForIndexer: boolean;
    transactionGenerationFunction: TransactionGenerationFunction;
    senderAccount: Account
    checkSuccess: boolean;
  }) {
    super(args);
    this.sender = args.senderAccount;
  }

  private createAptosWithConfig(overrides: Partial<AptosSettings> = {}): Aptos {
    const newConfig = new AptosConfig({
      ...this.aptos.config,
      ...overrides,
    });
    return new Aptos(newConfig);
  }
  /**
   * Override the client configuration for this transaction context.
   *
   * @param aptos - The Aptos client instance to use
   * @returns This transaction context instance
   */
  setClient(aptos: Aptos): this {
    this.aptos = this.createAptosWithConfig({ ...aptos.config });
    return this;
  }

  /**
   * Set the network for this transaction context.
   *
   * @param network - The network to use
   * @returns This transaction context instance
   */
  setNetwork(network: Network): this {
    this.aptos = this.createAptosWithConfig({ network });
    return this;
  }

  /**
   * Set this transaction to be orderless with a replay protection nonce.
   *
   * @param replayProtectionNonce - The nonce to use for replay protection
   * @returns This transaction context instance
   */
  setOrderless(orderless: boolean = true): this {
    this.orderMode = orderless ? "orderless" : "sequential";
    return this;
  }

  /**
   * Set this transaction to be sequential with an optional account sequence number.
   *
   * @param accountSequenceNumber - The account sequence number to use
   * @returns This transaction context instance
   */
  setSequential(sequential: boolean = true): this {
    this.orderMode = sequential ? "sequential" : "orderless";
    return this;
  }

  /**
   * Set the maximum gas amount for this transaction.
   *
   * @param amount - The maximum gas amount
   * @returns This transaction context instance
   */
  setMaxGasAmount(amount: number): this {
    this.maxGasAmount = amount;
    return this;
  }

  /**
   * Set the gas unit price for this transaction.
   *
   * @param gasUnitPrice - The gas unit price
   * @returns This transaction context instance
   */
  setGasUnitPrice(gasUnitPrice: number): this {
    this.gasUnitPrice = gasUnitPrice;
    return this;
  }

  /**
   * Set the transaction expiry time in seconds from now.
   *
   * @param txnExpirySecsFromNow - The number of seconds from now when the transaction expires
   * @returns This transaction context instance
   */
  setExpiresAfter(txnExpirySecsFromNow: number): this {
    this.txnExpirySecsFromNow = txnExpirySecsFromNow;
    return this;
  }

  /**
   * Configure this transaction to use a gas station for fee payment.
   *
   * @param gasStation - The gas station transaction submitter
   * @returns This transaction context instance
   */
  setGasStation(gasStation: TransactionSubmitter): this {
    this.transactionSubmitter = gasStation;
    this.withFeePayer = true;
    return this;
  }

  /**
   * Enable or disable fee payer for this transaction.
   *
   * @param useFeePayer - Whether to use a fee payer (defaults to true)
   * @returns This transaction context instance
   */
  setWithFeePayer(withFeePayer?: boolean): this {
    this.withFeePayer = withFeePayer ?? true;
    return this;
  }

  /**
   * Set the fee payer account for this transaction.
   *
   * @param feePayerAccount - The fee payer account
   * @returns This transaction context instance
   */
  setFeePayerAccount(feePayerAccount: Account): this {
    this.withFeePayer = true;
    this.feePayerAccount = feePayerAccount;
    return this;
  }

  /**
   * Configure a transaction submitter with optional plugin parameters.
   *
   * @param transactionSubmitter - The transaction submitter to use
   * @param pluginParams - Optional plugin parameters
   * @returns This transaction context instance
   */
  setSubmitter(transactionSubmitter: TransactionSubmitter, pluginParams?: Record<string, any>): this {
    this.transactionSubmitter = transactionSubmitter;
    this.pluginParams = pluginParams;
    return this;
  }

  /**
   * Ignore any configured transaction submitter.
   *
   * @returns This transaction context instance
   */
  setIgnoreSubmitter(): this {
    this.transactionSubmitter = null;
    return this;
  }

  /**
   * Set the timeout duration for waiting for transaction completion.
   *
   * @param timeoutSecs - The timeout duration in seconds
   * @returns This transaction context instance
   */
  setTimeout(timeoutSecs: number): this {
    this.timeoutSecs = timeoutSecs;
    return this;
  }

  /**
   * Skip waiting for the transaction to be indexed.
   *
   * @returns This transaction context instance
   */
  setWaitForIndexer(waitForIndexer: boolean): this {
    this.waitForIndexer = waitForIndexer;
    return this;
  }

  /**
   * Skip checking for transaction success.
   *
   * @returns This transaction context instance
   */
  setCheckSuccess(checkSuccess?: boolean): this {
    this.checkSuccess = checkSuccess ?? true;
    return this;
  }

  /**
   * Set the sender account for this transaction.
   * Returns a new context that is guaranteed to be submittable.
   */
  setSender(sender: Account): this {
    this.sender = sender;
    return this;
  }

  // Client
  getClient(): Aptos {
    return this.aptos;
  }


  async submitWithoutWaiting(): Promise<PendingTransactionResponse> {
    const sender = this.sender;
    try {
      const accountAddress = sender.accountAddress;
      const accountInfo = await this.aptos.getAccountInfo({ accountAddress });
      if (AccountAddress.from(accountInfo.authentication_key).toStringLong() !== accountAddress.toStringLong()) {
        const ledgerInfo = await this.aptos.getLedgerInfo();
        const accounts = await this.aptos.deriveOwnedAccountsFromSigner({
          signer: sender,
          minimumLedgerVersion: Number(ledgerInfo.ledger_version),
          options: { includeUnverified: true },
        });
        const matchingAccount = accounts.find(
          (account) => account.accountAddress.toStringLong() === accountAddress.toStringLong(),
        );
        if (matchingAccount) {
          this.sender = matchingAccount;
        } else {
          throw new Error(`Invalid auth key for account ${accountAddress.toString()}. Please check your private key.`);
        }
      }

      const transaction = await this.generateTransaction();

      return this.getClient().signAndSubmitTransaction({
        transaction: transaction,
        signer: sender,
        transactionSubmitter: this.transactionSubmitter,
        pluginParams: this.pluginParams,
        ...(this.feePayerAccount && this.withFeePayer ? { feePayer: this.feePayerAccount } : { feePayer: undefined }),
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit the transaction. Only available when sender is set.
   */
  async submit(): Promise<UserTransactionResponse> {
    try {
      const pendingTransaction = await this.submitWithoutWaiting();

      const committedTransaction = await this.getClient().transaction.waitForTransaction({
        transactionHash: pendingTransaction.hash,
        options: { timeoutSecs: this.timeoutSecs, waitForIndexer: this.waitForIndexer, checkSuccess: this.checkSuccess },
      });
      return committedTransaction as UserTransactionResponse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate transaction. Only available when sender is set.
   */
  async generateTransaction(): Promise<SimpleTransaction> {
    const expireTimestamp = Math.floor(Date.now() / 1000) + (this.txnExpirySecsFromNow ?? this.aptos.config.getDefaultTxnExpirySecFromNow());

    let options: InputGenerateTransactionOptions;
    if (this.orderMode === "sequential") {
      options = {
        maxGasAmount: this.maxGasAmount,
        gasUnitPrice: this.gasUnitPrice,
        expireTimestamp,
      };
    } else {
      options = {
        maxGasAmount: this.maxGasAmount,
        gasUnitPrice: this.gasUnitPrice,
        expireTimestamp,
        replayProtectionNonce: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
      };
    }

    const transaction = await this.transactionGenerationFunction({
      sender: this.sender!,
      options,
      aptos: this.getClient(),
    });

    if (this.withFeePayer) {
      transaction.feePayerAddress = AccountAddress.ZERO;
    }

    return transaction;
  }
}

class FaucetContext extends ContextBase implements SubmittableContext {
  fundAmount: number;
  accountAddress?: AccountAddressInput;

  constructor(args: {
    fundAmount: number;
    accountAddress?: AccountAddressInput;
    aptos: Aptos;
    timeoutSecs: number;
    checkSuccess: boolean;
    waitForIndexer: boolean;
  }) {
    const { fundAmount, accountAddress } = args;
    super(args);
    this.fundAmount = fundAmount;
    this.accountAddress = accountAddress;
  }

  async submit(): Promise<UserTransactionResponse> {
    if (this.aptos.config.network === Network.MAINNET) {
      throw new Error("Cannot fund with faucet on mainnet");
    }
    if (!this.accountAddress) {
      throw new Error("No account address set");
    }
    const options = {
      timeoutSecs: this.timeoutSecs,
      checkSuccess: this.checkSuccess,
      waitForIndexer: this.waitForIndexer,
    };
    return this.aptos.fundAccount({ accountAddress: this.accountAddress, amount: this.fundAmount, options });
  }

  setAmount(amount: number): this {
    this.fundAmount = amount;
    return this;
  }

  setAccountToFund(account: AccountAddressInput | Account): this {
    if (typeof account === "object" && "accountAddress" in account) {
      this.accountAddress = account.accountAddress;
    } else {
      this.accountAddress = AccountAddress.from(account);
    }
    return this;
  }
}

type OrderMode = "orderless" | "sequential";

interface SubmittableContext extends ContextBase {
  submit(): Promise<UserTransactionResponse>;
}
type HasSender<T> = T extends { sender: Account } ? true : false;

type ConditionalTransactionContext<T> = HasSender<T> extends true
  ? TransactionContext
  : SenderlessTransactionContext;

type TransactionManagerWithSender = TransactionManager & { sender: Account };

/**
 * TransactionManager is a class that allows for submitting transactions to the Aptos blockchain.
 *
 * Default parameters for transactions can be set for the transaction manager, and then overridden
 * on the `TransactionContext` instances.
 *
 * @example
 * ```typescript
 * const txnManager = TransactionManager.new(aptos);
 *
 * const response = await txnManager.transferCoinTransaction({
 *   recipient: recipient.accountAddress,
 *   amount: TRANSFER_AMOUNT,
 * })
 *   .sender(account)
 *   .submit();
 * ```
 */
export class TransactionManager implements SimpleTransactionGenerator {
  sender?: Account;

  maxGasAmount?: number;
  gasUnitPrice?: number;
  txnExpirySecFromNow?: number;
  orderMode?: OrderMode;

  transactionSubmitter?: TransactionSubmitter | null;
  pluginParams?: Record<string, any>;

  txnTimeoutSecs?: number;
  waitForIndexer?: boolean;
  checkSuccess?: boolean;

  aptos: Aptos;
  withFeePayer?: boolean;

  fundAmount?: number;

  private constructor(config: AptosConfig) {
    const newConfig = new AptosConfig({
      ...config,
    });
    this.aptos = new Aptos(newConfig);
  }

  /**
   * Create a new `TransactionManager` instance.
   *
   * @param aptosOrConfig - The `Aptos` instance or `AptosConfig` object to use for the transaction manager.
   * @returns A new `TransactionManager` instance.
   */
  static new(aptosOrConfig: Aptos | AptosConfig): TransactionManager {
    if (aptosOrConfig instanceof Aptos) {
      return new TransactionManager(aptosOrConfig.config);
    } else {
      return new TransactionManager(aptosOrConfig);
    }
  }

  private createAptosWithConfig(overrides: Partial<AptosSettings> = {}): Aptos {
    const newConfig = new AptosConfig({
      ...this.aptos.config,
      ...overrides,
    });
    return new Aptos(newConfig);
  }

  // Setters

  // Client
  setClient(aptos: Aptos): void {
    this.aptos = this.createAptosWithConfig({ ...aptos.config });
  }

  setDefaultNetwork(network: Network): void {
    this.aptos = this.createAptosWithConfig({ network });
  }

  // Sender

  /**
   * Generate a default sender for TransactionContext instances. This is useful for testing.
   */
  generateDefaultSender(): TransactionManagerWithSender {
    this.sender = Account.generate();
    return this as TransactionManagerWithSender;
  }


  /**
   * Set the default sender and return the same instance with mutated type
   */

  setSenderDefault(sender: Account): TransactionManagerWithSender {
    this.sender = sender;
    return this as TransactionManagerWithSender;
  }

  /**
   * Create a `FaucetContext` instance for funding an account.
   *
   * @param account - The account to fund. If not provided, the default sender will be used.
   * @returns A `FaucetContext` instance.
   */
  fundAccount(account?: Account | AccountAddressInput): FaucetContext {
    if (!account) {
      return new FaucetContext(this.getValues());
    }
    return new FaucetContext(this.getValues()).setAccountToFund(account);
  }

  /**
   * Set the default maximum gas amount for transactions
   * @param maxGasAmount The maximum amount of gas units that can be used for the transaction
   * @returns The transaction manager instance for chaining
   */
  setMaxGasAmountDefault(maxGasAmount: number): this {
    this.maxGasAmount = maxGasAmount;
    return this;
  }

  /**
   * Set the default gas unit price for transactions
   * @param gasUnitPrice The price in Octas for each unit of gas
   * @returns The transaction manager instance for chaining
   */
  setGasUnitPriceDefault(gasUnitPrice: number): this {
    this.gasUnitPrice = gasUnitPrice;
    return this;
  }

  /**
   * Set the default expiration time in seconds from now for transactions
   * @param expireTimestamp The number of seconds from now when transactions will expire
   * @returns The transaction manager instance for chaining
   */
  setTxnExpirySecFromNowDefault(txnExpirySecFromNow: number): this {
    this.txnExpirySecFromNow = txnExpirySecFromNow;
    return this;
  }

  /**
   * Set whether transactions should use a fee payer by default
   *
   * If a fee payer is used, the transaction manager will automatically set the fee payer address to the zero address.
   *
   * Submission will fail if a gas station or fee payer account is not set if withFeePayer is true.
   *
   * @param withFeePayer Whether to use a fee payer
   * @returns The transaction manager instance for chaining
   */
  setWithFeePayerDefault(withFeePayer: boolean): this {
    this.withFeePayer = withFeePayer;
    return this;
  }

  /**
   * Set the default order mode for transactions. Transactions will be processed sequentially by default.
   *
   * @param orderMode The order mode to use
   * @returns The transaction manager instance for chaining
   */
  setOrderModeDefault(orderMode: OrderMode): this {
    this.orderMode = orderMode;
    return this;
  }

  /**
   * Set the default transaction submitter and optional plugin parameters.
   *
   * @param transactionSubmitter The transaction submitter to use, or null to clear
   * @param pluginParams Optional plugin-specific parameters
   * @returns The transaction manager instance for chaining
   */
  setTransactionSubmitterDefault(
    transactionSubmitter: TransactionSubmitter | null,
    pluginParams?: Record<string, any>,
  ): this {
    this.transactionSubmitter = transactionSubmitter;
    this.pluginParams = pluginParams;
    return this;
  }

  /**
   * Set the default plugin parameters
   * @param pluginParams The plugin parameters to use
   * @returns The transaction manager instance for chaining
   */
  setPluginParamsDefault(pluginParams: Record<string, any>): this {
    this.pluginParams = pluginParams;
    return this;
  }

  /**
   * Set the default transaction timeout in seconds.
   *
   * If a timeout is not set, the transaction will wait for the default timeout of 20 seconds after submission.
   *
   * @param txnTimeoutSec The number of seconds to wait for transaction completion
   * @returns The transaction manager instance for chaining
   */
  setTxnTimeoutSecsDefault(txnTimeoutSec: number): this {
    this.txnTimeoutSecs = txnTimeoutSec;
    return this;
  }

  /**
   * Set whether to wait for the indexer by default.
   *
   * @param waitForIndexer Whether to wait for the indexer
   * @returns The transaction manager instance for chaining
   */
  setWaitForIndexerDefault(waitForIndexer: boolean): this {
    this.waitForIndexer = waitForIndexer;
    return this;
  }

  /**
   * Set whether to check for transaction success by default
   *
   * @param checkSuccess Whether to check if transactions succeeded
   * @returns The transaction manager instance for chaining
   */
  setCheckSuccessDefault(checkSuccess: boolean): this {
    this.checkSuccess = checkSuccess;
    return this;
  }

  /**
   * Set a gas station as the default transaction submitter and enable fee payer
   *
   * @param gasStation The gas station to use as transaction submitter
   * @returns The transaction manager instance for chaining
   */
  setGasStationDefault(gasStation: TransactionSubmitter): this {
    this.transactionSubmitter = gasStation;
    this.withFeePayer = true;
    return this;
  }

  /**
   * Set the default amount to fund accounts with
   *
   * @param amount The amount in Octas to fund accounts with
   * @returns The transaction manager instance for chaining
   */
  setFundAmountDefault(amount: number): this {
    this.fundAmount = amount;
    return this;
  }

  // Getters

  // Client
  getClient(): Aptos {
    return this.aptos;
  }
  getDefaultNetwork(): Network {
    return this.aptos.config.network;
  }

  // Sender
  getDefaultSender(): Account | undefined {
    return this.sender;
  }

  // InputGenerateTransactionOptions
  getDefaultMaxGasAmount(): number {
    return this.maxGasAmount ?? this.aptos.config.getDefaultMaxGasAmount();
  }
  getDefaultGasUnitPrice(): number | undefined {
    return this.gasUnitPrice;
  }
  getDefaulTxnExpirySecFromNow(): number {
    return this.txnExpirySecFromNow ?? this.aptos.config.getDefaultTxnExpirySecFromNow();
  }
  getDefaultOrderMode(): OrderMode {
    return this.orderMode ?? "sequential";
  }
  getDefaultWithFeePayer(): boolean {
    return this.withFeePayer ?? false;
  }

  // InputTransactionPluginData
  getDefaultTransactionSubmitter(): TransactionSubmitter | undefined {
    return this.transactionSubmitter || this.aptos.config.getTransactionSubmitter();
  }
  getDefaultPluginParams(): Record<string, any> | undefined {
    return this.pluginParams;
  }

  // WaitForTransactionOptions
  getDefaultTxnTimeoutSecs(): number {
    return this.txnTimeoutSecs ?? DEFAULT_TXN_TIMEOUT_SEC;
  }
  getDefaultWaitForIndexer(): boolean {
    return this.waitForIndexer ?? true;
  }
  getDefaultCheckSuccess(): boolean {
    return this.checkSuccess ?? true;
  }

  getDefaultFundAmount(): number {
    return this.fundAmount ?? 100_000_000;
  }

  getValues(): {
    aptos: Aptos;
    maxGasAmount: number;
    gasUnitPrice?: number;
    txnExpirySecsFromNow: number;
    withFeePayer: boolean;
    orderMode?: OrderMode;
    transactionSubmitter?: TransactionSubmitter | null;
    pluginParams?: Record<string, any> | undefined;
    timeoutSecs: number;
    fundAmount: number;
    waitForIndexer: boolean;
    checkSuccess: boolean;
  } {
    return {
      aptos: this.aptos,
      maxGasAmount: this.maxGasAmount ?? this.aptos.config.getDefaultMaxGasAmount(),
      gasUnitPrice: this.getDefaultGasUnitPrice(),
      txnExpirySecsFromNow: this.txnExpirySecFromNow ?? this.aptos.config.getDefaultTxnExpirySecFromNow(),
      withFeePayer: this.getDefaultWithFeePayer(),
      orderMode: this.getDefaultOrderMode(),
      transactionSubmitter: this.getDefaultTransactionSubmitter(),
      pluginParams: this.getDefaultPluginParams(),
      timeoutSecs: this.getDefaultTxnTimeoutSecs(),
      checkSuccess: this.getDefaultCheckSuccess(),
      fundAmount: this.getDefaultFundAmount(),
      waitForIndexer: this.getDefaultWaitForIndexer(),
    };
  }

  private createTransactionContext<T>(
    args: T,
    transactionBuilder: (txnArgs: TransactionGenerationArgs, args: T) => Promise<SimpleTransaction>,
  ): ConditionalTransactionContext<this> {
    const values = this.getValues();
    const context = new SenderlessTransactionContext({
      ...values,
      transactionGenerationFunction: async (txnContextArgs: TransactionGenerationArgs) =>
        transactionBuilder(txnContextArgs, args),
      waitForIndexer: values.waitForIndexer,
      checkSuccess: values.checkSuccess
    });
    if (this.sender) {
      return context.setSender(this.sender) as ConditionalTransactionContext<this>;
    }
    return context as ConditionalTransactionContext<this>;
  }

  /**
   * Creates a `TransactionContext` instance from a `SimpleTransaction` object.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param transaction - The `SimpleTransaction` object to create a context from
   * @returns A `TransactionContext` instance
   */
  fromTransaction(transaction: SimpleTransaction): ConditionalTransactionContext<this> {
    return this.fromPayload(transaction.rawTransaction.payload);
  }

  /**
   * Creates a `TransactionContext` instance from a transaction payload.
   * 
   * Uses transaction parameters from the current manager instance.
   *
   * @param payload - The transaction payload to create a context from
   * @returns A `TransactionContext` instance
   */
  fromPayload(payload: TransactionPayload): ConditionalTransactionContext<this> {
    return this.createTransactionContext(payload, async (txnContextArgs: TransactionGenerationArgs, payload: TransactionPayload) => {
      const { aptos, sender, options } = txnContextArgs;
      const rawTransaction = await generateRawTransaction({
        aptosConfig: aptos.config,
        sender: sender.accountAddress,
        payload,
        options,
      });
      return new SimpleTransaction(rawTransaction, undefined);
    });
  }

  /**
   * Creates a `TransactionContext` instance from transaction payload data.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - Object containing the transaction payload data
   * @param args.data - The transaction payload data to build from
   * @returns A `TransactionContext` instance
   */
  build(args: { data: InputGenerateTransactionPayloadData }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.transaction.build.simple({ ...args, sender: txnArgs.sender.accountAddress }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for transferring coins.
   *
   * Uses transaction parameters from the current manager instance.
   * Returns an unsubmittable context if no sender is set.
   *
   * @param args - The transfer parameters
   * @param args.recipient - The recipient's address
   * @param args.amount - The amount to transfer
   * @param args.coinType - Optional coin type to transfer (defaults to native APT)
   * @returns A `TransactionContext` instance
   */
  transferCoinTransaction(args: {
    recipient: AccountAddressInput;
    amount: AnyNumber;
    coinType?: MoveStructId;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.transferCoinTransaction({
        ...args,
        sender: txnArgs.sender.accountAddress,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for publishing a Move package.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The package publishing parameters
   * @param args.metadataBytes - The package metadata as hex bytes
   * @param args.moduleBytecode - Array of module bytecodes as hex
   * @returns A `TransactionContext` instance
   */
  publishPackageTransaction(args: { metadataBytes: HexInput; moduleBytecode: Array<HexInput> }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.publishPackageTransaction({
        ...args,
        account: txnArgs.sender.accountAddress,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for rotating an account's auth key.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The key rotation parameters
   * @param args.toAccount - The new Ed25519 or MultiEd25519 account to rotate to
   * @param args.toNewPrivateKey - Alternative: the new Ed25519 private key to rotate to
   * @returns A `TransactionContext` instance
   */
  rotateAuthKey(
    args: { toAccount: Ed25519Account | MultiEd25519Account } | { toNewPrivateKey: Ed25519PrivateKey },
  ): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.rotateAuthKey({ ...args, fromAccount: txnArgs.sender, options: txnArgs.options }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for rotating an account's auth key without verification.
   *
   * Uses transaction parameters from the current manager instance.
   * WARNING: This is unsafe as it skips signature verification.
   *
   * @param args - The key rotation parameters
   * @param args.toNewPublicKey - The new public key to rotate to
   * @returns A `TransactionContext` instance
   */
  rotateAuthKeyUnverified(args: { toNewPublicKey: AccountPublicKey }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.rotateAuthKeyUnverified({ ...args, fromAccount: txnArgs.sender, options: txnArgs.options }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for setting a target address for a name.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The name target parameters
   * @param args.name - The name to set the target for
   * @param args.address - The target address to set
   * @returns A `TransactionContext` instance
   */
  setTargetAddress(args: { name: string; address: AccountAddressInput }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.setTargetAddress({ ...args, sender: txnArgs.sender, options: txnArgs.options }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for setting a primary name.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The primary name parameters
   * @param args.name - Optional name to set as primary (clears if omitted)
   * @returns A `TransactionContext` instance
   */
  setPrimaryName(args: { name?: string }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.setPrimaryName({ ...args, sender: txnArgs.sender, options: txnArgs.options }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for registering a name.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The name registration parameters (excluding aptosConfig and sender)
   * @returns A `TransactionContext` instance
   */
  registerName(args: Omit<RegisterNameParameters, "aptosConfig" | "sender">): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.registerName({ ...args, sender: txnArgs.sender, options: txnArgs.options }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for renewing a domain name.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The domain renewal parameters
   * @param args.name - The domain name to renew
   * @param args.years - Optional number of years to renew for (default: 1)
   * @returns A `TransactionContext` instance
   */
  renewDomain(args: { name: string; years?: 1 }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.renewDomain({ ...args, sender: txnArgs.sender, options: txnArgs.options }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for creating a collection.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The collection creation parameters
   * @param args.description - The collection description
   * @param args.name - The collection name
   * @param args.uri - The collection URI
   * @returns A `TransactionContext` instance
   */
  createCollectionTransaction(
    args: { description: string; name: string; uri: string } & CreateCollectionOptions,
  ): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.createCollectionTransaction({
        ...args,
        creator: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for minting a digital asset.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The digital asset minting parameters
   * @param args.collection - The collection name
   * @param args.description - The asset description
   * @param args.name - The asset name
   * @param args.uri - The asset URI
   * @param args.propertyKeys - Optional property keys
   * @param args.propertyTypes - Optional property types
   * @param args.propertyValues - Optional property values
   * @returns A `TransactionContext` instance
   */
  mintDigitalAssetTransaction(args: {
    collection: string;
    description: string;
    name: string;
    uri: string;
    propertyKeys?: Array<string>;
    propertyTypes?: Array<PropertyType>;
    propertyValues?: Array<PropertyValue>;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.mintDigitalAssetTransaction({
        ...args,
        creator: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for transferring a digital asset.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The digital asset transfer parameters
   * @param args.digitalAssetAddress - The asset address
   * @param args.recipient - The recipient's address
   * @param args.digitalAssetType - Optional asset type
   * @returns A `TransactionContext` instance
   */
  transferDigitalAssetTransaction(args: {
    digitalAssetAddress: AccountAddressInput;
    recipient: AccountAddress;
    digitalAssetType?: MoveStructId;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.transferDigitalAssetTransaction({
        ...args,
        sender: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for minting a soul bound token.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The soul bound token minting parameters
   * @param args.collection - The collection name
   * @param args.description - The token description
   * @param args.name - The token name
   * @param args.uri - The token URI
   * @param args.recipient - The recipient's address
   * @param args.propertyKeys - Optional property keys
   * @param args.propertyTypes - Optional property types
   * @param args.propertyValues - Optional property values
   * @returns A `TransactionContext` instance
   */
  mintSoulBoundTransaction(args: {
    collection: string;
    description: string;
    name: string;
    uri: string;
    recipient: AccountAddressInput;
    propertyKeys?: Array<string>;
    propertyTypes?: Array<PropertyType>;
    propertyValues?: Array<PropertyValue>;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.mintSoulBoundTransaction({
        ...args,
        account: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for burning a digital asset.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The digital asset burn parameters
   * @param args.digitalAssetAddress - The asset address
   * @param args.digitalAssetType - Optional asset type
   * @returns A `TransactionContext` instance
   */
  burnDigitalAssetTransaction(args: {
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.burnDigitalAssetTransaction({
        ...args,
        creator: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for freezing a digital asset's transfer capability.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The digital asset freeze parameters
   * @param args.digitalAssetAddress - The asset address
   * @param args.digitalAssetType - Optional asset type
   * @returns A `TransactionContext` instance
   */
  freezeDigitalAssetTransaferTransaction(args: {
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.freezeDigitalAssetTransaferTransaction({
        ...args,
        creator: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for unfreezing a digital asset's transfer capability.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The digital asset unfreeze parameters
   * @param args.digitalAssetAddress - The asset address
   * @param args.digitalAssetType - Optional asset type
   * @returns A `TransactionContext` instance
   */
  unfreezeDigitalAssetTransaferTransaction(args: {
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.unfreezeDigitalAssetTransaferTransaction({
        ...args,
        creator: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for setting a digital asset's description.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The description update parameters
   * @param args.description - The new description
   * @param args.digitalAssetAddress - The asset address
   * @param args.digitalAssetType - Optional asset type
   * @returns A `TransactionContext` instance
   */
  setDigitalAssetDescriptionTransaction(args: {
    description: string;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.setDigitalAssetDescriptionTransaction({
        ...args,
        creator: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for setting a digital asset's name.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The name update parameters
   * @param args.name - The new name
   * @param args.digitalAssetAddress - The asset address
   * @param args.digitalAssetType - Optional asset type
   * @returns A `TransactionContext` instance
   */
  setDigitalAssetNameTransaction(args: {
    name: string;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.setDigitalAssetNameTransaction({
        ...args,
        creator: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for setting a digital asset's URI.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The URI update parameters
   * @param args.uri - The new URI
   * @param args.digitalAssetAddress - The asset address
   * @param args.digitalAssetType - Optional asset type
   * @returns A `TransactionContext` instance
   */
  setDigitalAssetURITransaction(args: {
    uri: string;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.setDigitalAssetURITransaction({
        ...args,
        creator: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for adding a property to a digital asset.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The property addition parameters
   * @param args.propertyKey - The property key
   * @param args.propertyType - The property type
   * @param args.propertyValue - The property value
   * @param args.digitalAssetAddress - The asset address
   * @param args.digitalAssetType - Optional asset type
   * @returns A `TransactionContext` instance
   */
  addDigitalAssetPropertyTransaction(args: {
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.addDigitalAssetPropertyTransaction({
        ...args,
        creator: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for removing a property from a digital asset.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The property removal parameters
   * @param args.propertyKey - The property key
   * @param args.propertyType - The property type
   * @param args.propertyValue - The property value
   * @param args.digitalAssetAddress - The asset address
   * @param args.digitalAssetType - Optional asset type
   * @returns A `TransactionContext` instance
   */
  removeDigitalAssetPropertyTransaction(args: {
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.removeDigitalAssetPropertyTransaction({
        ...args,
        creator: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for updating a property of a digital asset.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The property update parameters
   * @param args.propertyKey - The property key
   * @param args.propertyType - The property type
   * @param args.propertyValue - The property value
   * @param args.digitalAssetAddress - The asset address
   * @param args.digitalAssetType - Optional asset type
   * @returns A `TransactionContext` instance
   */
  updateDigitalAssetPropertyTransaction(args: {
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.updateDigitalAssetPropertyTransaction({
        ...args,
        creator: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for adding a typed property to a digital asset.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The typed property addition parameters
   * @param args.propertyKey - The property key
   * @param args.propertyType - The property type
   * @param args.propertyValue - The property value
   * @param args.digitalAssetAddress - The asset address
   * @param args.digitalAssetType - Optional asset type
   * @returns A `TransactionContext` instance
   */
  addDigitalAssetTypedPropertyTransaction(args: {
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.addDigitalAssetTypedPropertyTransaction({
        ...args,
        creator: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for updating a typed property of a digital asset.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The typed property update parameters
   * @param args.propertyKey - The property key
   * @param args.propertyType - The property type
   * @param args.propertyValue - The property value
   * @param args.digitalAssetAddress - The asset address
   * @param args.digitalAssetType - Optional asset type
   * @returns A `TransactionContext` instance
   */
  updateDigitalAssetTypedPropertyTransaction(args: {
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.updateDigitalAssetTypedPropertyTransaction({
        ...args,
        creator: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for transferring a fungible asset.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The fungible asset transfer parameters
   * @param args.fungibleAssetMetadataAddress - The asset metadata address
   * @param args.recipient - The recipient's address
   * @param args.amount - The amount to transfer
   * @returns A `TransactionContext` instance
   */
  transferFungibleAsset(args: {
    fungibleAssetMetadataAddress: AccountAddressInput;
    recipient: AccountAddressInput;
    amount: AnyNumber;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.transferFungibleAsset({
        ...args,
        sender: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for transferring a fungible asset between stores.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The store transfer parameters
   * @param args.fromStore - The source store address
   * @param args.toStore - The destination store address
   * @param args.amount - The amount to transfer
   * @returns A `TransactionContext` instance
   */
  transferFungibleAssetBetweenStores(args: {
    fromStore: AccountAddressInput;
    toStore: AccountAddressInput;
    amount: AnyNumber;
  }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.transferFungibleAssetBetweenStores({
        ...args,
        sender: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Creates a `TransactionContext` instance for updating a federated keyless JWK set.
   *
   * Uses transaction parameters from the current manager instance.
   *
   * @param args - The JWK set update parameters
   * @param args.iss - The issuer
   * @param args.jwksUrl - Optional JWKS URL
   * @returns A `TransactionContext` instance
   */
  updateFederatedKeylessJwkSetTransaction(args: { iss: string; jwksUrl?: string }): ConditionalTransactionContext<this> {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.updateFederatedKeylessJwkSetTransaction({
        ...args,
        sender: txnArgs.sender,
        options: txnArgs.options,
      }),
    );
  }
}

// const aptos = new Aptos(new AptosConfig({
//   network: Network.DEVNET,
// }));
// const senderAccount = Account.generate()

// const manager = TransactionManager.new(aptos).setFundAmountDefault(1000000000000000000);

// const txn = await manager.transferCoinTransaction({
//   recipient: Account.generate().accountAddress,
//   amount: 1000000000000000000,
// }).setSender(senderAccount).submitWithoutWaiting()


// console.log(txn)