import { Account, Ed25519Account, MultiEd25519Account } from "../account";
import { AccountAddress, AccountAddressInput, AccountPublicKey, Ed25519PrivateKey } from "../core";
import { AptosApiError } from "../errors";
import { RegisterNameParameters } from "../internal/ans";
import { CreateCollectionOptions, PropertyType, PropertyValue } from "../internal/digitalAsset";
import {
  ChainId,
  InputGenerateTransactionOptions,
  InputGenerateTransactionPayloadData,
  RawTransaction,
  SimpleTransaction,
} from "../transactions";
import {
  MoveStructId,
  AnyNumber,
  HexInput,
  UserTransactionResponse,
  TransactionSubmitter,
  AptosSettings,
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
  ? Args extends { sender?: any; account?: any; creator?: any; [key: string]: any }
    ? (args: Omit<Args, "sender" | "account" | "creator" | "fromAccount">) => Return
    : T
  : T;

// Helper type to transform function return type from Promise<SimpleTransaction> to TransactionContext
type TransformReturnType<T> = T extends (...args: infer Args) => Promise<SimpleTransaction>
  ? (...args: Args) => TransactionContext
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
  constructor(aptos: Aptos) {
    const aptosConfig = new AptosConfig({
      ...aptos.config,
    });
    this.aptos = new Aptos(aptosConfig);
  }
  abstract submit(): Promise<UserTransactionResponse>;
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
export class TransactionContext extends ContextBase {
  /** Sender account for the transaction */
  senderAccount?: Account;

  /** Function to generate the transaction */
  transactionGenerationFunction: TransactionGenerationFunction;

  /** Maximum amount of gas units that can be used to execute the transaction */
  maxGasAmountVal: number;

  /** Price per gas unit for the transaction */
  gasUnitPriceVal: number | undefined;

  /** Transaction ordering mode - either "sequential" or "orderless" */
  orderMode?: OrderMode;

  /** Nonce used for replay protection in orderless transactions */
  replayProtectionNonceVal: AnyNumber | undefined;

  /** Account sequence number used for sequential transactions */
  accountSequenceNumberVal: AnyNumber | undefined;

  /** Default transaction expiry time in seconds from now */
  defaultTxnExpirySecsFromNow: number;

  /** Transaction expiry time in seconds from now, overrides default if set */
  txnExpirySecsFromNow?: number;

  /** Absolute transaction expiry timestamp in seconds, overrides txnExpirySecsFromNow if set */
  expiryTimestampSecsVal?: number;

  /** Whether this transaction uses a fee payer */
  withFeePayerBool: boolean;

  /** Optional parameters passed to transaction plugins */
  pluginParams?: Record<string, any>;

  /** Optional custom transaction submitter */
  transactionSubmitter?: TransactionSubmitter | null;

  /** Timeout in seconds when waiting for transaction */
  timeoutSecs: number;

  /** Whether to wait for transaction to be indexed */
  waitForIndexerBool: boolean;

  /** Whether to check transaction success status */
  checkSuccessBool: boolean;

  /** Optional fee payer account */
  feePayerAccount: Account | undefined;

  constructor(manager: TransactionManager, transactionGenerationFunction: TransactionGenerationFunction) {
    super(manager.getClient());
    this.maxGasAmountVal = manager.getDefaultMaxGasAmount();
    this.gasUnitPriceVal = manager.getDefaultGasUnitPrice();
    this.defaultTxnExpirySecsFromNow = manager.getDefaulTxnExpirySecFromNow();
    this.withFeePayerBool = manager.getDefaultWithFeePayer();
    this.orderMode = manager.getDefaultOrderMode();
    this.senderAccount = manager.getDefaultSender();
    this.transactionSubmitter = manager.getDefaultTransactionSubmitter();
    this.pluginParams = manager.getDefaultPluginParams();
    this.timeoutSecs = manager.getDefaultTxnTimeoutSecs();
    this.waitForIndexerBool = manager.getDefaultWaitForIndexer();
    this.checkSuccessBool = manager.getDefaultCheckSuccess();
    this.transactionGenerationFunction = transactionGenerationFunction;
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
  clientOverride(aptos: Aptos): this {
    this.aptos = this.createAptosWithConfig({ ...aptos.config });
    this.validateSettings();
    return this;
  }

  /**
   * Set the network for this transaction context.
   *
   * @param network - The network to use
   * @returns This transaction context instance
   */
  network(network: Network): this {
    this.aptos = this.createAptosWithConfig({ network });
    this.validateSettings();
    return this;
  }

  /**
   * Set this transaction to be orderless with a replay protection nonce.
   *
   * @param replayProtectionNonce - The nonce to use for replay protection
   * @returns This transaction context instance
   */
  orderless(replayProtectionNonce: AnyNumber): this {
    this.setProperty("orderMode", "orderless");
    this.setProperty("replayProtectionNonceVal", replayProtectionNonce);
    return this;
  }

  /**
   * Set this transaction to be sequential with an optional account sequence number.
   *
   * @param accountSequenceNumber - The account sequence number to use
   * @returns This transaction context instance
   */
  sequential(accountSequenceNumber?: AnyNumber): this {
    this.setProperty("orderMode", "sequential");
    this.setProperty("accountSequenceNumberVal", accountSequenceNumber);
    return this;
  }

  /**
   * Set the maximum gas amount for this transaction.
   *
   * @param amount - The maximum gas amount
   * @returns This transaction context instance
   */
  maxGasAmount(amount: number): this {
    this.setProperty("maxGasAmountVal", amount);
    return this;
  }

  /**
   * Set the gas unit price for this transaction.
   *
   * @param gasUnitPrice - The gas unit price
   * @returns This transaction context instance
   */
  gasUnitPrice(gasUnitPrice: number): this {
    this.setProperty("gasUnitPriceVal", gasUnitPrice);
    return this;
  }

  /**
   * Set the transaction expiry time in seconds from now.
   *
   * @param txnExpirySecsFromNow - The number of seconds from now when the transaction expires
   * @returns This transaction context instance
   */
  expiresAfter(txnExpirySecsFromNow: number): this {
    this.setProperty("txnExpirySecsFromNow", txnExpirySecsFromNow);
    return this;
  }

  /**
   * Set the transaction expiry timestamp.
   *
   * @param expiryTimestampSecs - The timestamp in seconds when the transaction expires
   * @returns This transaction context instance
   */
  expiresAt(expiryTimestampSecs: number): this {
    this.setProperty("expiryTimestampSecsVal", expiryTimestampSecs);
    return this;
  }

  /**
   * Configure this transaction to use a gas station for fee payment.
   *
   * @param gasStation - The gas station transaction submitter
   * @returns This transaction context instance
   */
  withGasStation(gasStation: TransactionSubmitter): this {
    this.setProperty("transactionSubmitter", gasStation);
    this.setProperty("withFeePayerBool", true);
    return this;
  }

  /**
   * Enable or disable fee payer for this transaction.
   *
   * @param useFeePayer - Whether to use a fee payer (defaults to true)
   * @returns This transaction context instance
   */
  useFeePayer(useFeePayer?: boolean): this {
    this.setProperty("withFeePayerBool", useFeePayer ?? true);
    return this;
  }

  /**
   * Set the fee payer account for this transaction.
   *
   * @param feePayerAccount - The fee payer account
   * @returns This transaction context instance
   */
  feePayer(feePayerAccount: Account | undefined): this {
    this.setProperty("withFeePayerBool", true);
    this.setProperty("feePayerAccount", feePayerAccount);
    return this;
  }

  /**
   * Configure a transaction submitter with optional plugin parameters.
   *
   * @param transactionSubmitter - The transaction submitter to use
   * @param pluginParams - Optional plugin parameters
   * @returns This transaction context instance
   */
  withSubmitter(transactionSubmitter: TransactionSubmitter, pluginParams?: Record<string, any>): this {
    this.setProperty("transactionSubmitter", transactionSubmitter);
    this.setProperty("pluginParams", pluginParams);
    return this;
  }

  /**
   * Ignore any configured transaction submitter.
   *
   * @returns This transaction context instance
   */
  ignoreSubmitter(): this {
    this.setProperty("transactionSubmitter", null);
    return this;
  }

  /**
   * Set the timeout duration for waiting for transaction completion.
   *
   * @param timeoutSecs - The timeout duration in seconds
   * @returns This transaction context instance
   */
  timeoutAfter(timeoutSecs: number): this {
    this.setProperty("timeoutSecs", timeoutSecs);
    return this;
  }

  /**
   * Skip waiting for the transaction to be indexed.
   *
   * @returns This transaction context instance
   */
  skipWaitForIndexer(): this {
    this.setProperty("waitForIndexerBool", false);
    return this;
  }

  /**
   * Skip checking for transaction success.
   *
   * @returns This transaction context instance
   */
  skipCheckSuccess(): this {
    this.setProperty("checkSuccessBool", false);
    return this;
  }

  /**
   * Set the sender account for this transaction.
   *
   * @param sender - The sender account
   * @returns This transaction context instance
   */
  sender(sender: Account): this {
    this.setProperty("senderAccount", sender);
    return this;
  }

  // Client
  getClient(): Aptos {
    return this.aptos;
  }

  validateSettings(): void {
    if (this.orderMode === "orderless" && this.accountSequenceNumberVal !== undefined) {
      throw new Error("Cannot set accountSequenceNumber when using orderless transactions");
    }
    if (this.orderMode === "sequential" && this.replayProtectionNonceVal !== undefined) {
      throw new Error("Must set orderless to true when using replayProtectionNonce");
    }
    if (this.txnExpirySecsFromNow !== undefined && this.expiryTimestampSecsVal !== undefined) {
      throw new Error("Cannot set both txnExpirySecFromNow and expiryTimestamp");
    }
    if (this.feePayerAccount && this.withFeePayerBool === false) {
      throw new Error("Fee payer account is set but the withFeePayer is false");
    }
  }

  private setProperty<K extends keyof TransactionContext>(key: K, value: TransactionContext[K]): void {
    (this as any)[key] = value;
    this.validateSettings();
  }

  async submit(): Promise<UserTransactionResponse> {
    if (!this.senderAccount) {
      throw new Error("Sender account is not set");
    }
    try {
      const accountAddress = this.senderAccount.accountAddress;
      const accountInfo = await this.aptos.getAccountInfo({ accountAddress });
      if (AccountAddress.from(accountInfo.authentication_key).toStringLong() !== accountAddress.toStringLong()) {
        const ledgerInfo = await this.aptos.getLedgerInfo();
        const accounts = await this.aptos.deriveOwnedAccountsFromSigner({
          signer: this.senderAccount,
          minimumLedgerVersion: Number(ledgerInfo.ledger_version),
          options: { includeUnverified: true },
        });
        const matchingAccount = accounts.find(
          (account) => account.accountAddress.toStringLong() === accountAddress.toStringLong(),
        );
        if (matchingAccount) {
          this.senderAccount = matchingAccount;
        } else {
          throw new Error(`Invalid auth key for account ${accountAddress.toString()}. Please check your private key.`);
        }
      }

      const transaction = await this.generateTransaction();

      const pendingTransaction = await this.getClient().signAndSubmitTransaction({
        transaction: transaction,
        signer: this.senderAccount,
        transactionSubmitter: this.transactionSubmitter,
        pluginParams: this.pluginParams,
        ...(this.feePayerAccount ? { feePayer: this.feePayerAccount } : { feePayer: undefined }),
      });

      const committedTransaction = await this.getClient().transaction.waitForTransaction({
        transactionHash: pendingTransaction.hash,
        options: { timeoutSecs: this.timeoutSecs },
      });
      return committedTransaction as UserTransactionResponse;
    } catch (error) {
      throw error;
    }
  }

  async generateTransaction(): Promise<SimpleTransaction> {
    const expireTimestamp =
      this.expiryTimestampSecsVal ??
      Math.floor(Date.now() / 1000) + (this.txnExpirySecsFromNow ?? this.defaultTxnExpirySecsFromNow);

    let options: InputGenerateTransactionOptions;
    if (this.orderMode === "sequential") {
      options = {
        maxGasAmount: this.maxGasAmountVal,
        gasUnitPrice: this.gasUnitPriceVal,
        expireTimestamp,
        accountSequenceNumber: this.accountSequenceNumberVal,
      };
    } else {
      options = {
        maxGasAmount: this.maxGasAmountVal,
        gasUnitPrice: this.gasUnitPriceVal,
        expireTimestamp,
        replayProtectionNonce: this.replayProtectionNonceVal,
      };
    }

    if (!this.senderAccount) {
      throw new Error("Sender account is not set");
    }

    const transaction = await this.transactionGenerationFunction({
      sender: this.senderAccount,
      options,
      aptos: this.getClient(),
    });

    if (this.withFeePayerBool) {
      transaction.feePayerAddress = AccountAddress.ZERO;
    }

    return transaction;
  }
}

class FaucetContext extends ContextBase {
  amountVal: number;
  accountAddress?: AccountAddressInput;

  timeoutSecs: number;
  checkSuccess: boolean;
  waitForIndexer: boolean;

  constructor(manager: TransactionManager) {
    super(manager.getClient());
    this.amountVal = manager.getDefaultFundAmount();
    this.accountAddress = manager.getDefaultSender()?.accountAddress;
    this.timeoutSecs = manager.getDefaultTxnTimeoutSecs();
    this.checkSuccess = manager.getDefaultCheckSuccess();
    this.waitForIndexer = manager.getDefaultWaitForIndexer();
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
    return this.aptos.fundAccount({ accountAddress: this.accountAddress, amount: this.amountVal, options });
  }

  amount(amount: number): this {
    this.amountVal = amount;
    return this;
  }

  account(account: AccountAddressInput | Account): this {
    if (typeof account === "object" && "accountAddress" in account) {
      this.accountAddress = account.accountAddress;
    } else {
      this.accountAddress = AccountAddress.from(account);
    }
    return this;
  }
}

type OrderMode = "orderless" | "sequential";

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
   * Set the default sender for TransactionContext instances.
   *
   * @param sender - The account to use as the default sender.
   */
  defaultSender(sender: Account): this {
    this.sender = sender;
    return this;
  }

  /**
   * Generate a default sender for TransactionContext instances. This is useful for testing.
   */
  generateDefaultSender(): this {
    this.sender = Account.generate();
    return this;
  }

  /**
   * Create a `FaucetContext` instance for funding an account.
   *
   * @param account - The account to fund. If not provided, the default sender will be used.
   * @returns A `FaucetContext` instance.
   */
  fundAccount(account?: Account | AccountAddressInput): FaucetContext {
    if (!account) {
      return new FaucetContext(this);
    }
    return new FaucetContext(this).account(account);
  }

  /**
   * Set the default maximum gas amount for transactions
   * @param maxGasAmount The maximum amount of gas units that can be used for the transaction
   * @returns The transaction manager instance for chaining
   */
  defaultMaxGasAmount(maxGasAmount: number): this {
    this.maxGasAmount = maxGasAmount;
    return this;
  }

  /**
   * Set the default gas unit price for transactions
   * @param gasUnitPrice The price in Octas for each unit of gas
   * @returns The transaction manager instance for chaining
   */
  defaultGasUnitPrice(gasUnitPrice: number): this {
    this.gasUnitPrice = gasUnitPrice;
    return this;
  }

  /**
   * Set the default expiration time in seconds from now for transactions
   * @param expireTimestamp The number of seconds from now when transactions will expire
   * @returns The transaction manager instance for chaining
   */
  defaultTxnExpirySecFromNow(txnExpirySecFromNow: number): this {
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
  defaultWithFeePayer(withFeePayer: boolean): this {
    this.withFeePayer = withFeePayer;
    return this;
  }

  /**
   * Set the default order mode for transactions. Transactions will be processed sequentially by default.
   *
   * @param orderMode The order mode to use
   * @returns The transaction manager instance for chaining
   */
  defaultOrderMode(orderMode: OrderMode): this {
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
  defaultTransactionSubmitter(
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
  defaultPluginParams(pluginParams: Record<string, any>): this {
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
  defaultTxnTimeoutSecs(txnTimeoutSec: number): this {
    this.txnTimeoutSecs = txnTimeoutSec;
    return this;
  }

  /**
   * Set whether to wait for the indexer by default.
   *
   * @param waitForIndexer Whether to wait for the indexer
   * @returns The transaction manager instance for chaining
   */
  defaultWaitForIndexer(waitForIndexer: boolean): this {
    this.waitForIndexer = waitForIndexer;
    return this;
  }

  /**
   * Set whether to check for transaction success by default
   *
   * @param checkSuccess Whether to check if transactions succeeded
   * @returns The transaction manager instance for chaining
   */
  defaultCheckSuccess(checkSuccess: boolean): this {
    this.checkSuccess = checkSuccess;
    return this;
  }

  /**
   * Set a gas station as the default transaction submitter and enable fee payer
   *
   * @param gasStation The gas station to use as transaction submitter
   * @returns The transaction manager instance for chaining
   */
  defaultGasStation(gasStation: TransactionSubmitter): this {
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
  defaultFundAmount(amount: number): this {
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
  getDefaultOrderMode(): OrderMode | undefined {
    return this.orderMode;
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

  private createTransactionContext<T>(
    args: T,
    transactionBuilder: (txnArgs: TransactionGenerationArgs, args: T) => Promise<SimpleTransaction>,
  ): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      transactionBuilder(txnContextArgs, args),
    );
  }

  /**
   * Create a `TransactionContext` instance from a `SimpleTransaction` object.
   *
   * It will use transaction parameters from the `TransactionContext` instance.
   *
   * @param transaction - The `SimpleTransaction` object to create a `TransactionContext` from.
   * @returns A `TransactionContext` instance.
   */
  fromTransaction(transaction: SimpleTransaction): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) => {
      const { aptos, sender, options } = txnContextArgs;
      const { maxGasAmount, gasUnitPrice, expireTimestamp, accountSequenceNumber, replayProtectionNonce } = options;
      let chainId: ChainId;
      if (NetworkToChainId[aptos.config.network]) {
        chainId = new ChainId(NetworkToChainId[aptos.config.network]);
      } else {
        const info = await aptos.getLedgerInfo();
        chainId = new ChainId(info.chain_id);
      }
      const newRawTransaction = new RawTransaction(
        sender.accountAddress,
        accountSequenceNumber ? BigInt(accountSequenceNumber) : transaction.rawTransaction.sequence_number,
        transaction.rawTransaction.payload,
        maxGasAmount ? BigInt(maxGasAmount) : transaction.rawTransaction.max_gas_amount,
        gasUnitPrice ? BigInt(gasUnitPrice) : transaction.rawTransaction.gas_unit_price,
        expireTimestamp ? BigInt(expireTimestamp) : transaction.rawTransaction.expiration_timestamp_secs,
        chainId,
      );
      return new SimpleTransaction(newRawTransaction, transaction.feePayerAddress);
    });
  }

  /**
   * Create a `TransactionContext` instance from a `InputGenerateTransactionPayloadData` object to build
   * a simple transaction.
   *
   * @param args - The `InputGenerateTransactionPayloadData` object to create a `TransactionContext` from.
   * @returns A `TransactionContext` instance.
   */
  build(args: { data: InputGenerateTransactionPayloadData }): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.transaction.build.simple({ ...args, sender: txnArgs.sender.accountAddress }),
    );
  }

  /**
   * Create a `TransactionContext` instance to publish a package to the Aptos blockchain.
   *
   * @param args.metadataBytes - The metadata bytes of the package to publish
   * @param args.moduleBytecode - The bytecode of the modules to publish
   * @returns A `TransactionContext` instance
   */
  publishPackageTransaction(args: { metadataBytes: HexInput; moduleBytecode: Array<HexInput> }): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.publishPackageTransaction({
        ...args,
        account: txnArgs.sender.accountAddress,
        options: txnArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to rotate an account's authentication key.
   *
   * @param args.toAccount - The new Ed25519 or MultiEd25519 account to rotate to
   * @param args.toNewPrivateKey - The new Ed25519 private key to rotate to
   * @returns A `TransactionContext` instance
   */
  rotateAuthKey(
    args: { toAccount: Ed25519Account | MultiEd25519Account } | { toNewPrivateKey: Ed25519PrivateKey },
  ): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.rotateAuthKey({ ...args, fromAccount: txnArgs.sender, options: txnArgs.options }),
    );
  }

  /**
   * Create a `TransactionContext` instance to rotate an account's authentication key without verification.
   *
   * @param args.toNewPublicKey - The new public key to rotate to
   * @returns A `TransactionContext` instance
   */
  rotateAuthKeyUnverified(args: { toNewPublicKey: AccountPublicKey }): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.rotateAuthKeyUnverified({ ...args, fromAccount: txnArgs.sender, options: txnArgs.options }),
    );
  }

  /**
   * Create a `TransactionContext` instance to set a target address for a name.
   *
   * @param args.name - The name to set the target address for
   * @param args.address - The target address to set
   * @returns A `TransactionContext` instance
   */
  setTargetAddress(args: { name: string; address: AccountAddressInput }): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.setTargetAddress({ ...args, sender: txnArgs.sender, options: txnArgs.options }),
    );
  }

  /**
   * Create a `TransactionContext` instance to set a primary name for an account.
   *
   * @param args.name - The name to set as primary
   * @returns A `TransactionContext` instance
   */
  setPrimaryName(args: { name?: string }): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.setPrimaryName({ ...args, sender: txnArgs.sender, options: txnArgs.options }),
    );
  }

  /**
   * Create a `TransactionContext` instance to register a name.
   *
   * @param args - The parameters for registering a name, excluding aptosConfig and sender
   * @returns A `TransactionContext` instance
   */
  registerName(args: Omit<RegisterNameParameters, "aptosConfig" | "sender">): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.registerName({ ...args, sender: txnArgs.sender, options: txnArgs.options }),
    );
  }

  /**
   * Create a `TransactionContext` instance to renew a domain name.
   *
   * @param args.name - The domain name to renew
   * @param args.years - The number of years to renew for (default: 1)
   * @returns A `TransactionContext` instance
   */
  renewDomain(args: { name: string; years?: 1 }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.renewDomain({ ...args, sender: txnContextArgs.sender, options: txnContextArgs.options }),
    );
  }

  /**
   * Create a `TransactionContext` instance to transfer coins.
   *
   * @param args.recipient - The recipient's account address
   * @param args.amount - The amount of coins to transfer
   * @param args.coinType - The type of coin to transfer (optional)
   * @returns A `TransactionContext` instance
   */
  transferCoinTransaction(args: {
    recipient: AccountAddressInput;
    amount: AnyNumber;
    coinType?: MoveStructId;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.transferCoinTransaction({
        ...args,
        sender: txnContextArgs.sender.accountAddress,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to create a collection.
   *
   * @param args.description - The description of the collection
   * @param args.name - The name of the collection
   * @param args.uri - The URI of the collection
   * @returns A `TransactionContext` instance
   */
  createCollectionTransaction(
    args: { description: string; name: string; uri: string } & CreateCollectionOptions,
  ): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.createCollectionTransaction({
        ...args,
        creator: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to mint a digital asset.
   *
   * @param args.collection - The collection name
   * @param args.description - The description of the digital asset
   * @param args.name - The name of the digital asset
   * @param args.uri - The URI of the digital asset
   * @param args.propertyKeys - The property keys of the digital asset (optional)
   * @param args.propertyTypes - The property types of the digital asset (optional)
   * @param args.propertyValues - The property values of the digital asset (optional)
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
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.mintDigitalAssetTransaction({
        ...args,
        creator: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to transfer a digital asset.
   *
   * @param args.digitalAssetAddress - The address of the digital asset
   * @param args.recipient - The recipient's account address
   * @param args.digitalAssetType - The type of digital asset (optional)
   * @returns A `TransactionContext` instance
   */
  transferDigitalAssetTransaction(args: {
    digitalAssetAddress: AccountAddressInput;
    recipient: AccountAddress;
    digitalAssetType?: MoveStructId;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.transferDigitalAssetTransaction({
        ...args,
        sender: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to mint a soul bound token.
   *
   * @param args.collection - The collection name
   * @param args.description - The description of the token
   * @param args.name - The name of the token
   * @param args.uri - The URI of the token
   * @param args.recipient - The recipient's account address
   * @param args.propertyKeys - The property keys of the token (optional)
   * @param args.propertyTypes - The property types of the token (optional)
   * @param args.propertyValues - The property values of the token (optional)
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
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.mintSoulBoundTransaction({
        ...args,
        account: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to burn a digital asset.
   *
   * @param args.digitalAssetAddress - The address of the digital asset
   * @param args.digitalAssetType - The type of digital asset (optional)
   * @returns A `TransactionContext` instance
   */
  burnDigitalAssetTransaction(args: {
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.burnDigitalAssetTransaction({
        ...args,
        creator: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to freeze a digital asset's transfer capability.
   *
   * @param args.digitalAssetAddress - The address of the digital asset
   * @param args.digitalAssetType - The type of digital asset (optional)
   * @returns A `TransactionContext` instance
   */
  freezeDigitalAssetTransaferTransaction(args: {
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.freezeDigitalAssetTransaferTransaction({
        ...args,
        creator: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to unfreeze a digital asset's transfer capability.
   *
   * @param args.digitalAssetAddress - The address of the digital asset
   * @param args.digitalAssetType - The type of digital asset (optional)
   * @returns A `TransactionContext` instance
   */
  unfreezeDigitalAssetTransaferTransaction(args: {
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.unfreezeDigitalAssetTransaferTransaction({
        ...args,
        creator: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to set a digital asset's description.
   *
   * @param args.description - The new description
   * @param args.digitalAssetAddress - The address of the digital asset
   * @param args.digitalAssetType - The type of digital asset (optional)
   * @returns A `TransactionContext` instance
   */
  setDigitalAssetDescriptionTransaction(args: {
    description: string;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.setDigitalAssetDescriptionTransaction({
        ...args,
        creator: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to set a digital asset's name.
   *
   * @param args.name - The new name
   * @param args.digitalAssetAddress - The address of the digital asset
   * @param args.digitalAssetType - The type of digital asset (optional)
   * @returns A `TransactionContext` instance
   */
  setDigitalAssetNameTransaction(args: {
    name: string;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.setDigitalAssetNameTransaction({
        ...args,
        creator: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to set a digital asset's URI.
   *
   * @param args.uri - The new URI
   * @param args.digitalAssetAddress - The address of the digital asset
   * @param args.digitalAssetType - The type of digital asset (optional)
   * @returns A `TransactionContext` instance
   */
  setDigitalAssetURITransaction(args: {
    uri: string;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.setDigitalAssetURITransaction({
        ...args,
        creator: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to add a property to a digital asset.
   *
   * @param args.propertyKey - The key of the property
   * @param args.propertyType - The type of the property
   * @param args.propertyValue - The value of the property
   * @param args.digitalAssetAddress - The address of the digital asset
   * @param args.digitalAssetType - The type of digital asset (optional)
   * @returns A `TransactionContext` instance
   */
  addDigitalAssetPropertyTransaction(args: {
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.addDigitalAssetPropertyTransaction({
        ...args,
        creator: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to remove a property from a digital asset.
   *
   * @param args.propertyKey - The key of the property
   * @param args.propertyType - The type of the property
   * @param args.propertyValue - The value of the property
   * @param args.digitalAssetAddress - The address of the digital asset
   * @param args.digitalAssetType - The type of digital asset (optional)
   * @returns A `TransactionContext` instance
   */
  removeDigitalAssetPropertyTransaction(args: {
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.removeDigitalAssetPropertyTransaction({
        ...args,
        creator: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to update a property of a digital asset.
   *
   * @param args.propertyKey - The key of the property
   * @param args.propertyType - The type of the property
   * @param args.propertyValue - The value of the property
   * @param args.digitalAssetAddress - The address of the digital asset
   * @param args.digitalAssetType - The type of digital asset (optional)
   * @returns A `TransactionContext` instance
   */
  updateDigitalAssetPropertyTransaction(args: {
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.updateDigitalAssetPropertyTransaction({
        ...args,
        creator: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to add a typed property to a digital asset.
   *
   * @param args.propertyKey - The key of the property
   * @param args.propertyType - The type of the property
   * @param args.propertyValue - The value of the property
   * @param args.digitalAssetAddress - The address of the digital asset
   * @param args.digitalAssetType - The type of digital asset (optional)
   * @returns A `TransactionContext` instance
   */
  addDigitalAssetTypedPropertyTransaction(args: {
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.addDigitalAssetTypedPropertyTransaction({
        ...args,
        creator: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to update a typed property of a digital asset.
   *
   * @param args.propertyKey - The key of the property
   * @param args.propertyType - The type of the property
   * @param args.propertyValue - The value of the property
   * @param args.digitalAssetAddress - The address of the digital asset
   * @param args.digitalAssetType - The type of digital asset (optional)
   * @returns A `TransactionContext` instance
   */
  updateDigitalAssetTypedPropertyTransaction(args: {
    propertyKey: string;
    propertyType: PropertyType;
    propertyValue: PropertyValue;
    digitalAssetAddress: AccountAddressInput;
    digitalAssetType?: MoveStructId;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.updateDigitalAssetTypedPropertyTransaction({
        ...args,
        creator: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to transfer a fungible asset.
   *
   * @param args.fungibleAssetMetadataAddress - The metadata address of the fungible asset
   * @param args.recipient - The recipient's account address
   * @param args.amount - The amount to transfer
   * @returns A `TransactionContext` instance
   */
  transferFungibleAsset(args: {
    fungibleAssetMetadataAddress: AccountAddressInput;
    recipient: AccountAddressInput;
    amount: AnyNumber;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.transferFungibleAsset({
        ...args,
        sender: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to transfer a fungible asset between stores.
   *
   * @param args.fromStore - The source store address
   * @param args.toStore - The destination store address
   * @param args.amount - The amount to transfer
   * @returns A `TransactionContext` instance
   */
  transferFungibleAssetBetweenStores(args: {
    fromStore: AccountAddressInput;
    toStore: AccountAddressInput;
    amount: AnyNumber;
  }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.transferFungibleAssetBetweenStores({
        ...args,
        sender: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }

  /**
   * Create a `TransactionContext` instance to update a federated keyless JWK set.
   *
   * @param args.iss - The issuer
   * @param args.jwksUrl - The JWKS URL (optional)
   * @returns A `TransactionContext` instance
   */
  updateFederatedKeylessJwkSetTransaction(args: { iss: string; jwksUrl?: string }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.updateFederatedKeylessJwkSetTransaction({
        ...args,
        sender: txnContextArgs.sender,
        options: txnContextArgs.options,
      }),
    );
  }
}
