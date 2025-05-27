// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AccountAddress,
  AccountAddressInput,
  AnyNumber,
  Aptos,
  AptosConfig,
  InputGenerateTransactionOptions,
  LedgerVersionArg,
  MoveStructId,
  SimpleTransaction,
} from "@aptos-labs/ts-sdk";
import { TwistedElGamalCiphertext } from "./twistedElGamal";
import { ConfidentialNormalization } from "./confidentialNormalization";
import { ConfidentialKeyRotation } from "./confidentialKeyRotation";
import { toTwistedEd25519PrivateKey, toTwistedEd25519PublicKey } from "./helpers";
import { concatBytes } from "@noble/hashes/utils";
import { ConfidentialTransfer } from "./confidentialTransfer";
import { ConfidentialWithdraw } from "./confidentialWithdraw";
import { TwistedEd25519PublicKey, TwistedEd25519PrivateKey } from "./twistedEd25519";
import { DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS, MODULE_NAME } from "./consts";
import { ConfidentialAmount } from "./confidentialAmount";
import { preloadTables } from "./preloadKangarooTables";

export type ConfidentialBalanceResponse = {
  chunks: {
    left: { data: string };
    right: { data: string };
  }[];
}[];

export type DecryptedBalance = {
  available: bigint;
  pending: bigint;
};

export type ConfidentialBalance = {
  pending: TwistedElGamalCiphertext[];
  available: TwistedElGamalCiphertext[];
};

/**
 * A class to handle confidential balance operations
 *
 * TODO: Add key caching to avoid fetching the same key multiple times
 */
export class ConfidentialAsset {
  client: Aptos;
  confidentialAssetModuleAddress: string;
  private preloadTablesPromise: Promise<void>;
  private tablesPreloaded: boolean;

  constructor(
    readonly config: AptosConfig,
    {
      confidentialAssetModuleAddress = DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS,
    }: { confidentialAssetModuleAddress?: string } = {},
  ) {
    this.client = new Aptos(config);
    this.confidentialAssetModuleAddress = confidentialAssetModuleAddress;
    this.preloadTablesPromise = this.preloadTables();
    this.tablesPreloaded = false;
  }

  private async preloadTables(): Promise<void> {
    try {
      await preloadTables();
      this.tablesPreloaded = true;
    } catch (error) {
      throw new Error(`Failed to preload tables: ${error}`);
    }
  }

  private async ensurePreloaded(): Promise<void> {
    if (!this.tablesPreloaded) {
      await this.preloadTablesPromise;
    }
  }

  /**
   * Get the decrypted balance for an account
   * @param args.accountAddress - The account address to get the balance for
   * @param args.tokenAddress - The token address of the asset to get the balance for
   * @param args.decryptionKey - The decryption key to decrypt the encrypted balance fetched from the chain
   * @param args.options.ledgerVersion - The ledger version to use for the lookup
   * @returns The decrypted balance as an object with available and pending amounts
   */
  async getDecryptedBalance(args: {
    accountAddress: AccountAddress;
    tokenAddress: string;
    decryptionKey: TwistedEd25519PrivateKey;
    options?: LedgerVersionArg;
  }): Promise<DecryptedBalance> {
    await this.ensurePreloaded();
    const { accountAddress, tokenAddress, decryptionKey, options } = args;
    const { available, pending } = await this.getEncryptedBalance({
      accountAddress,
      tokenAddress,
      options,
    });

    const decryptedActualBalance = await ConfidentialAmount.fromEncrypted(available, decryptionKey);
    const decryptedPendingBalance = await ConfidentialAmount.fromEncrypted(pending, decryptionKey);

    return {
      available: decryptedActualBalance.amount,
      pending: decryptedPendingBalance.amount,
    };
  }

  /**
   * Get the encrypted balance for an account
   * @param args.accountAddress - The account address to get the balance for
   * @param args.tokenAddress - The token address of the asset to get the balance for
   * @param args.options.ledgerVersion - The ledger version to use for the lookup
   * @returns The encrypted balance as an object with pending and available balances
   */
  async getEncryptedBalance(args: {
    accountAddress: AccountAddress;
    tokenAddress: string;
    options?: LedgerVersionArg;
  }): Promise<ConfidentialBalance> {
    const { accountAddress, tokenAddress, options } = args;
    const [[chunkedPendingBalance], [chunkedActualBalances]] = await Promise.all([
      this.client.view<ConfidentialBalanceResponse>({
        payload: {
          function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::pending_balance`,
          typeArguments: [],
          functionArguments: [accountAddress, tokenAddress],
        },
        options,
      }),
      this.client.view<ConfidentialBalanceResponse>({
        payload: {
          function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::actual_balance`,
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
      available: chunkedActualBalances.chunks.map(
        (el) => new TwistedElGamalCiphertext(el.left.data.slice(2), el.right.data.slice(2)),
      ),
    };
  }

  /**
   * Get the encryption key for an account for a given token
   * @param args.accountAddress - The account address to get the encryption key for
   * @param args.tokenAddress - The token address of the asset to get the encryption key for
   * @param args.options.ledgerVersion - The ledger version to use for the lookup
   * @returns The encryption key as a TwistedEd25519PublicKey
   */
  async getEncryptionKey(args: {
    accountAddress: AccountAddress;
    tokenAddress: string;
    options?: LedgerVersionArg;
  }): Promise<TwistedEd25519PublicKey> {
    const [{ point }] = await this.client.view<[{ point: { data: string } }]>({
      options: args.options,
      payload: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::encryption_key`,
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
    });

    return toTwistedEd25519PublicKey(point.data);
  }

  /**
   * Register a confidential balance for an account
   *
   * @param args.sender - The address of the sender of the transaction
   * @param args.tokenAddress - The token address of the asset to register the balance for
   * @param args.decryptionKey - The decryption key for which the corresponding encryption key will be used registered for the balance
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @param args.options - Optional transaction options
   * @returns A SimpleTransaction to register the balance
   */
  async registerBalance(args: {
    sender: AccountAddressInput;
    tokenAddress: string;
    decryptionKey: TwistedEd25519PrivateKey;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { tokenAddress, decryptionKey } = args;
    return this.client.transaction.build.simple({
      ...args,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::register`,
        functionArguments: [tokenAddress, decryptionKey.publicKey().toUint8Array()],
      },
    });
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
  async deposit(args: {
    sender: AccountAddressInput;
    tokenAddress?: string;
    coinType?: MoveStructId;
    amount: AnyNumber;
    /** If not set we will use the sender's address. */
    recipient?: AccountAddress;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { tokenAddress, coinType, amount, recipient = args.sender } = args;
    validateAmount({ amount });
    await this.ensurePreloaded();

    if (tokenAddress && coinType) {
      throw new Error("Only one of tokenAddress or coinType can be set");
    }

    const amountString = String(amount);
    if (tokenAddress) {
      return this.client.transaction.build.simple({
        ...args,
        data: {
          function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::deposit_to`,
          functionArguments: [tokenAddress, recipient, amountString],
        },
      });
    } else if (coinType) {
      return this.client.transaction.build.simple({
        ...args,
        data: {
          function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::deposit_coins_to`,
          functionArguments: [recipient, amountString],
          typeArguments: [coinType],
        },
      });
    } else {
      throw new Error("Must set either tokenAddress or coinType");
    }
  }

  /**
   * Withdraw an amount from a confidential asset balance.
   *
   * This can be used by an account to convert their own confidential asset balance into a non-confidential asset balance.
   *
   * @param args.sender - The address of the sender of the transaction
   * @param args.senderDecryptionKey - The decryption key of the sender
   * @param args.tokenAddress - The token address of the asset to withdraw from
   * @param args.amount - The amount to withdraw
   * @param args.recipient - The account address to withdraw to. This is the senders address if not set.
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @returns A SimpleTransaction to withdraw the amount
   * @throws {Error} If the amount to withdraw is greater than the available balance
   */
  async withdraw(args: {
    sender: AccountAddressInput;
    senderDecryptionKey: TwistedEd25519PrivateKey;
    tokenAddress: string;
    amount: AnyNumber;
    /** If not set we will use the sender's address. */
    recipient?: AccountAddressInput;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { sender, tokenAddress, amount, senderDecryptionKey, recipient = args.sender, options } = args;
    validateAmount({ amount });
    await this.ensurePreloaded();
    // Get the sender's available balance from the chain
    const { available: senderEncryptedAvailableBalance } = await this.getEncryptedBalance({
      accountAddress: AccountAddress.from(sender),
      tokenAddress,
    });

    const confidentialWithdraw = await ConfidentialWithdraw.create({
      decryptionKey: senderDecryptionKey,
      senderEncryptedAvailableBalance,
      amount: BigInt(amount),
    });

    const [{ sigmaProof, rangeProof }, confidentialAmountAfterWithdraw] =
      await confidentialWithdraw.authorizeWithdrawal();

    return this.client.transaction.build.simple({
      ...args,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::withdraw_to`,
        functionArguments: [
          tokenAddress,
          recipient,
          String(amount),
          concatBytes(...confidentialAmountAfterWithdraw.map((el) => el.serialize()).flat()),
          rangeProof,
          ConfidentialWithdraw.serializeSigmaProof(sigmaProof),
        ],
      },
      options,
    });
  }

  /**
   * Rollover an account's pending balance for an asset into the available balance.
   *
   * @param args.sender - The address of the sender of the transaction
   * @param args.tokenAddress - The token address of the asset to roll over
   * @param args.withFreezeBalance - Whether to freeze the balance after rolling over. Default is false.
   * @param args.checkNormalized - Whether to check if the balance is normalized before rolling over. Default is true.
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @returns A SimpleTransaction to roll over the balance
   * @throws {Error} If the balance is not normalized before rolling over, unless checkNormalized is false.
   */
  async rolloverPendingBalance(args: {
    sender: AccountAddressInput;
    tokenAddress: string;
    withFreezeBalance?: boolean;
    withFeePayer?: boolean;
    checkNormalized?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { checkNormalized = true, withFreezeBalance = false } = args;
    await this.ensurePreloaded();
    if (checkNormalized) {
      const isNormalized = await this.isBalanceNormalized({
        accountAddress: AccountAddress.from(args.sender),
        tokenAddress: args.tokenAddress,
      });
      if (!isNormalized) {
        throw new Error("Balance must be normalized before rollover");
      }
    }

    const functionName = withFreezeBalance ? "rollover_pending_balance_and_freeze" : "rollover_pending_balance";

    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      sender: args.sender,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::${functionName}`,
        functionArguments: [args.tokenAddress],
      },
      options: args.options,
    });
  }

  /**
   * Get the encryption key for the asset auditor for a given token address.
   *
   * @param args.tokenAddress - The token address of the asset to get the auditor for
   * @param args.options.ledgerVersion - The ledger version to use for the view call
   * @returns The encryption key for the asset auditor or undefined if no auditor is set
   */
  async getAssetAuditorEncryptionKey(args: {
    tokenAddress: string;
    options?: LedgerVersionArg;
  }): Promise<TwistedEd25519PublicKey | undefined> {
    const [{ vec: globalAuditorPubKey }] = await this.client.view<[{ vec: Uint8Array }]>({
      options: args.options,
      payload: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::get_auditor`,
        functionArguments: [args.tokenAddress],
      },
    });
    if (globalAuditorPubKey.length === 0) {
      return undefined;
    }
    return toTwistedEd25519PublicKey(globalAuditorPubKey);
  }

  /**
   * Transfer an amount from a confidential asset balance to a recipient.
   *
   * This can be used by an account to transfer their own confidential asset balance to a recipient.
   *
   * TODO: Parallelize the view calls to get the encrypted balance and the encryption key
   *
   * @param args.sender - The address of the sender of the transaction
   * @param args.senderDecryptionKey - The decryption key of the sender
   * @param args.tokenAddress - The token address of the asset to transfer
   * @param args.amount - The amount to transfer
   * @param args.recipient - The address of the recipient
   * @param args.additionalAuditorEncryptionKeys - The encryption keys of the auditors. If not set we will fetch the encryption keys from the chain.
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @returns A SimpleTransaction to transfer the amount
   * @throws {Error} If the recipient's encryption key cannot be found
   * @throws {Error} If the amount to transfer is greater than the available balance
   */
  async transfer(args: {
    sender: AccountAddressInput;
    recipient: AccountAddressInput;
    tokenAddress: string;
    amount: AnyNumber;
    senderDecryptionKey: TwistedEd25519PrivateKey;
    additionalAuditorEncryptionKeys?: TwistedEd25519PublicKey[];
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { senderDecryptionKey, recipient, tokenAddress, amount, additionalAuditorEncryptionKeys = [] } = args;
    validateAmount({ amount });
    await this.ensurePreloaded();
    // Get the auditor public key for the token
    const globalAuditorPubKey = await this.getAssetAuditorEncryptionKey({
      tokenAddress,
    });

    let recipientEncryptionKey: TwistedEd25519PublicKey;
    try {
      recipientEncryptionKey = await this.getEncryptionKey({
        accountAddress: AccountAddress.from(recipient),
        tokenAddress,
      });
    } catch (e) {
      throw new Error("Failed to get encryption key for recipient.", { cause: e });
    }

    // Get the sender's available balance from the chain
    const { available: senderEncryptedAvailableBalance } = await this.getEncryptedBalance({
      accountAddress: AccountAddress.from(args.sender),
      tokenAddress,
    });

    // Create the confidential transfer object
    const confidentialTransfer = await ConfidentialTransfer.create({
      senderDecryptionKey,
      senderEncryptedAvailableBalance,
      amount,
      recipientEncryptionKey,
      auditorEncryptionKeys: [
        ...(globalAuditorPubKey ? [globalAuditorPubKey] : []),
        ...additionalAuditorEncryptionKeys.map((el) => toTwistedEd25519PublicKey(el)),
      ],
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
    const amountBySender = confidentialTransfer.transferAmountEncryptedBySender.map((el) => el.serialize()).flat();
    const amountByRecipient = encryptedAmountByRecipient.map((el) => el.serialize()).flat();
    const auditorEncryptionKeys = confidentialTransfer.auditorEncryptionKeys.map((pk) => pk.toUint8Array());
    const auditorBalances = auditorsCBList
      .flat()
      .map((el) => el.serialize())
      .flat();

    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::confidential_transfer`,
        functionArguments: [
          tokenAddress,
          recipient,
          concatBytes(...newBalance),
          concatBytes(...amountBySender.flat()),
          concatBytes(...amountByRecipient.flat()),
          concatBytes(...auditorEncryptionKeys),
          concatBytes(...auditorBalances),
          rangeProofNewBalance,
          rangeProofAmount,
          ConfidentialTransfer.serializeSigmaProof(sigmaProof),
        ],
      },
    });
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
  async isBalanceFrozen(args: {
    accountAddress: AccountAddress;
    tokenAddress: string;
    options?: LedgerVersionArg;
  }): Promise<boolean> {
    const [isFrozen] = await this.client.view<[boolean]>({
      options: args.options,
      payload: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::is_frozen`,
        typeArguments: [],
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
    });

    return isFrozen;
  }

  /**
   * Rotate the encryption key for a confidential asset balance.
   *
   * This will by default check if the pending balance is empty and throw an error if it is not. It also checks if the balance is frozen and
   * will unfreeze it if it is.
   *
   * TODO: Parallelize the view calls
   *
   * @param args.sender - The address of the sender of the transaction who's encryption key is being rotated
   * @param args.senderDecryptionKey - The decryption key of the sender
   * @param args.newDecryptionKey - The new decryption key
   * @param args.tokenAddress - The token address of the asset to rotate the encryption key for
   * @param args.checkPendingBalanceEmpty - Whether to check if the pending balance is empty before rotating the encryption key. Default is true.
   * @param args.withUnfreezeBalance - Whether to unfreeze the balance after rotating the encryption key. By default it will check the chain to
   * see if the balance is frozen and if so, will unfreeze it.
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @returns A SimpleTransaction to rotate the encryption key
   * @throws {Error} If the pending balance is not 0 before rotating the encryption key, unless checkPendingBalanceEmpty is false.
   */
  async rotateEncryptionKey(args: {
    sender: AccountAddressInput;
    senderDecryptionKey: TwistedEd25519PrivateKey;
    newDecryptionKey: TwistedEd25519PrivateKey;
    tokenAddress: string;
    checkPendingBalanceEmpty?: boolean;
    withUnfreezeBalance?: boolean;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const {
      checkPendingBalanceEmpty = true,
      withUnfreezeBalance = await this.isBalanceFrozen({
        accountAddress: AccountAddress.from(args.sender),
        tokenAddress: args.tokenAddress,
      }),
    } = args;
    await this.ensurePreloaded();
    // Get the sender's balance from the chain
    const { available: currEncryptedBalance, pending: currPendingEncryptedBalance } = await this.getEncryptedBalance({
      accountAddress: AccountAddress.from(args.sender),
      tokenAddress: args.tokenAddress,
    });

    if (checkPendingBalanceEmpty) {
      const currPendingConfidentialAmount = await ConfidentialAmount.fromEncrypted(
        currPendingEncryptedBalance,
        args.senderDecryptionKey,
      );
      if (currPendingConfidentialAmount.amount > 0n) {
        throw new Error("Pending balance must be 0 before rotating encryption key");
      }
    }

    // Create the confidential key rotation object
    const confidentialKeyRotation = await ConfidentialKeyRotation.create({
      currDecryptionKey: toTwistedEd25519PrivateKey(args.senderDecryptionKey),
      newDecryptionKey: toTwistedEd25519PrivateKey(args.newDecryptionKey),
      currEncryptedBalance,
    });

    // Create the sigma proof and range proof
    const [{ sigmaProof, rangeProof }, newCB] = await confidentialKeyRotation.authorizeKeyRotation();

    const newPublicKeyBytes = toTwistedEd25519PrivateKey(args.newDecryptionKey).publicKey().toUint8Array();

    const serializedNewBalance = concatBytes(...newCB.map((el) => [el.C.toRawBytes(), el.D.toRawBytes()]).flat());

    const method = withUnfreezeBalance ? "rotate_encryption_key_and_unfreeze" : "rotate_encryption_key";

    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      sender: args.sender,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::${method}`,
        functionArguments: [
          args.tokenAddress,
          newPublicKeyBytes,
          serializedNewBalance,
          rangeProof,
          ConfidentialKeyRotation.serializeSigmaProof(sigmaProof),
        ],
      },
      options: args.options,
    });
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
    accountAddress: AccountAddress;
    tokenAddress: string;
    options?: LedgerVersionArg;
  }): Promise<boolean> {
    const [isRegister] = await this.client.view<[boolean]>({
      payload: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::has_confidential_asset_store`,
        typeArguments: [],
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
      options: args.options,
    });

    return isRegister;
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
    accountAddress: AccountAddress;
    tokenAddress: string;
    options?: LedgerVersionArg;
  }): Promise<boolean> {
    const [isNormalized] = await this.client.view<[boolean]>({
      payload: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::is_normalized`,
        typeArguments: [],
        functionArguments: [args.accountAddress, args.tokenAddress],
      },
      options: args.options,
    });

    return isNormalized;
  }

  /**
   * Normalize a user's balance.
   *
   * This can be used to normalize a user's balance for a given token address.
   *
   * @param args.sender - The address of the sender of the transaction who's balance is being normalized
   * @param args.senderDecryptionKey - The decryption key of the sender
   * @param args.tokenAddress - The token address of the asset to normalize
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @returns A SimpleTransaction to normalize the balance
   */
  async normalizeBalance(args: {
    sender: AccountAddressInput;
    senderDecryptionKey: TwistedEd25519PrivateKey;
    tokenAddress: string;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { sender, senderDecryptionKey, tokenAddress } = args;
    await this.ensurePreloaded();
    const { available: unnormalizedEncryptedAvailableBalance } = await this.getEncryptedBalance({
      accountAddress: AccountAddress.from(sender),
      tokenAddress,
    });

    const confidentialNormalization = await ConfidentialNormalization.create({
      decryptionKey: senderDecryptionKey,
      unnormalizedEncryptedAvailableBalance,
    });

    const [{ sigmaProof, rangeProof }, normalizedCB] = await confidentialNormalization.authorizeNormalization();

    return this.client.transaction.build.simple({
      ...args,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::normalize`,
        functionArguments: [
          tokenAddress,
          concatBytes(...normalizedCB.map((el) => el.serialize()).flat()),
          rangeProof,
          ConfidentialNormalization.serializeSigmaProof(sigmaProof),
        ],
      },
      options: args.options,
    });
  }
}

function validateAmount(args: { amount: AnyNumber }) {
  if (BigInt(args.amount) < 0n) {
    throw new Error("Amount must not be negative");
  }
}
