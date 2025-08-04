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
  ? Args extends { sender?: any; account?: any; creator?: any;[key: string]: any }
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

export class TransactionContext extends ContextBase {
  senderAccount?: Account;

  transactionGenerationFunction: TransactionGenerationFunction;

  maxGasAmountVal: number;
  gasUnitPriceVal: number | undefined;
  defaultTxnExpirySecsFromNow: number;
  txnExpirySecsFromNow?: number;
  withFeePayerBool: boolean;
  expiryTimestampSecsVal?: number;

  orderMode?: OrderMode;

  accountSequenceNumberVal: AnyNumber | undefined;
  replayProtectionNonceVal: AnyNumber | undefined;

  pluginParams?: Record<string, any>;
  transactionSubmitter?: TransactionSubmitter | null;

  timeoutSecs: number;
  waitForIndexerBool: boolean;
  checkSuccessBool: boolean;

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
  clientOverride(aptos: Aptos): this {
    this.aptos = this.createAptosWithConfig({ ...aptos.config });
    this.validateSettings();
    return this;
  }
  network(network: Network): this {
    this.aptos = this.createAptosWithConfig({ network });
    this.validateSettings();
    return this;
  }

  // InputGenerateTransactionOptions
  orderless(replayProtectionNonce: AnyNumber): this {
    this.setProperty("orderMode", "orderless");
    this.setProperty("replayProtectionNonceVal", replayProtectionNonce);
    return this;
  }
  sequential(accountSequenceNumber?: AnyNumber): this {
    this.setProperty("orderMode", "sequential");
    this.setProperty("accountSequenceNumberVal", accountSequenceNumber);
    return this;
  }
  maxGasAmount(amount: number): this {
    this.setProperty("maxGasAmountVal", amount);
    return this;
  }
  gasUnitPrice(gasUnitPrice: number): this {
    this.setProperty("gasUnitPriceVal", gasUnitPrice);
    return this;
  }
  expiresAfter(txnExpirySecsFromNow: number): this {
    this.setProperty("txnExpirySecsFromNow", txnExpirySecsFromNow);
    return this;
  }
  expiresAt(expiryTimestampSecs: number): this {
    this.setProperty("expiryTimestampSecsVal", expiryTimestampSecs);
    return this;
  }
  withGasStation(gasStation: TransactionSubmitter): this {
    this.setProperty("transactionSubmitter", gasStation);
    this.setProperty("withFeePayerBool", true);
    return this;
  }
  useFeePayer(useFeePayer?: boolean): this {
    this.setProperty("withFeePayerBool", useFeePayer ?? true);
    return this;
  }
  feePayer(feePayerAccount: Account | undefined): this {
    this.setProperty("withFeePayerBool", true);
    this.setProperty("feePayerAccount", feePayerAccount);
    return this;
  }

  // InputTransactionPluginData
  withSubmitter(transactionSubmitter: TransactionSubmitter, pluginParams?: Record<string, any>): this {
    this.setProperty("transactionSubmitter", transactionSubmitter);
    this.setProperty("pluginParams", pluginParams);
    return this;
  }

  ignoreSubmitter(): this {
    this.setProperty("transactionSubmitter", null);
    return this;
  }

  // WaitForTransactionOptions
  timeoutAfter(timeoutSecs: number): this {
    this.setProperty("timeoutSecs", timeoutSecs);
    return this;
  }
  skipWaitForIndexer(): this {
    this.setProperty("waitForIndexerBool", false);
    return this;
  }
  skipCheckSuccess(): this {
    this.setProperty("checkSuccessBool", false);
    return this;
  }

  // Sender
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
        const accounts = await this.aptos.deriveOwnedAccountsFromSigner({ signer: this.senderAccount, minimumLedgerVersion: Number(ledgerInfo.ledger_version), options: { includeUnverified: true } });
        const matchingAccount = accounts.find((account) => account.accountAddress.toStringLong() === accountAddress.toStringLong());
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
    const expireTimestamp = this.expiryTimestampSecsVal ?? Math.floor(Date.now() / 1000) + (this.txnExpirySecsFromNow ?? this.defaultTxnExpirySecsFromNow);

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
    if (typeof account === 'object' && 'accountAddress' in account) {
      this.accountAddress = account.accountAddress;
    } else {
      this.accountAddress = AccountAddress.from(account);
    }
    return this;
  }
}

type OrderMode = "orderless" | "sequential";

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
  defaultSender(sender: Account): this {
    this.sender = sender;
    return this;
  }

  generateDefaultSender(): this {
    this.sender = Account.generate();
    return this;
  }

  fundAccount(account?: Account | AccountAddressInput): FaucetContext {
    if (!account) {
      return new FaucetContext(this);
    }
    return new FaucetContext(this).account(account);
  }

  // InputGenerateTransactionOptions
  defaultMaxGasAmount(maxGasAmount: number): this {
    this.maxGasAmount = maxGasAmount;
    return this;
  }
  defaultGasUnitPrice(gasUnitPrice: number): this {
    this.gasUnitPrice = gasUnitPrice;
    return this;
  }
  defaultExpireTimestamp(expireTimestamp: number): this {
    this.txnExpirySecFromNow = expireTimestamp;
    return this;
  }
  defaultWithFeePayer(withFeePayer: boolean): this {
    this.withFeePayer = withFeePayer;
    return this;
  }
  defaultOrderMode(orderMode: OrderMode): this {
    this.orderMode = orderMode;
    return this;
  }

  // InputTransactionPluginData
  defaultTransactionSubmitter(
    transactionSubmitter: TransactionSubmitter | null,
    pluginParams?: Record<string, any>,
  ): this {
    this.transactionSubmitter = transactionSubmitter;
    this.pluginParams = pluginParams;
    return this;
  }
  defaultPluginParams(pluginParams: Record<string, any>): this {
    this.pluginParams = pluginParams;
    return this;
  }

  // WaitForTransactionOptions
  defaultTxnTimeoutSecs(txnTimeoutSec: number): this {
    this.txnTimeoutSecs = txnTimeoutSec;
    return this;
  }
  defaultWaitForIndexer(waitForIndexer: boolean): this {
    this.waitForIndexer = waitForIndexer;
    return this;
  }
  defaultCheckSuccess(checkSuccess: boolean): this {
    this.checkSuccess = checkSuccess;
    return this;
  }
  defaultGasStation(gasStation: TransactionSubmitter): this {
    this.transactionSubmitter = gasStation;
    this.withFeePayer = true;
    return this;
  }

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

  build(args: { data: InputGenerateTransactionPayloadData }): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.transaction.build.simple({ ...args, sender: txnArgs.sender.accountAddress }),
    );
  }

  publishPackageTransaction(args: { metadataBytes: HexInput; moduleBytecode: Array<HexInput> }): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.publishPackageTransaction({
        ...args,
        account: txnArgs.sender.accountAddress,
        options: txnArgs.options,
      }),
    );
  }
  rotateAuthKey(
    args: { toAccount: Ed25519Account | MultiEd25519Account } | { toNewPrivateKey: Ed25519PrivateKey },
  ): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.rotateAuthKey({ ...args, fromAccount: txnArgs.sender, options: txnArgs.options }),
    );
  }
  rotateAuthKeyUnverified(args: { toNewPublicKey: AccountPublicKey }): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.rotateAuthKeyUnverified({ ...args, fromAccount: txnArgs.sender, options: txnArgs.options }),
    );
  }
  setTargetAddress(args: { name: string; address: AccountAddressInput }): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.setTargetAddress({ ...args, sender: txnArgs.sender, options: txnArgs.options }),
    );
  }
  setPrimaryName(args: { name?: string }): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.setPrimaryName({ ...args, sender: txnArgs.sender, options: txnArgs.options }),
    );
  }
  registerName(args: Omit<RegisterNameParameters, "aptosConfig" | "sender">): TransactionContext {
    return this.createTransactionContext(args, (txnArgs, args) =>
      txnArgs.aptos.registerName({ ...args, sender: txnArgs.sender, options: txnArgs.options }),
    );
  }
  renewDomain(args: { name: string; years?: 1 }): TransactionContext {
    return new TransactionContext(this, async (txnContextArgs: TransactionGenerationArgs) =>
      txnContextArgs.aptos.renewDomain({ ...args, sender: txnContextArgs.sender, options: txnContextArgs.options }),
    );
  }
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
