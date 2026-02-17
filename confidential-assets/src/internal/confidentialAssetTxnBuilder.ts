// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AccountAddressInput,
  AnyNumber,
  Aptos,
  AptosConfig,
  InputGenerateTransactionOptions,
  LedgerVersionArg,
  SimpleTransaction,
} from "@aptos-labs/ts-sdk";
import { concatBytes } from "@noble/hashes/utils";
import {
  TwistedElGamal,
  ConfidentialNormalization,
  ConfidentialKeyRotation,
  ConfidentialTransfer,
  ConfidentialWithdraw,
  TwistedEd25519PublicKey,
  TwistedEd25519PrivateKey,
} from "../crypto";
import { DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS, MODULE_NAME } from "../consts";
import { getBalance, getEncryptionKey, isBalanceNormalized, isPendingBalanceFrozen } from "./viewFunctions";

/**
 * A class to handle creating transactions for confidential asset operations
 */
export class ConfidentialAssetTransactionBuilder {
  readonly client: Aptos;
  readonly confidentialAssetModuleAddress: string;

  constructor(config: AptosConfig, confidentialAssetModuleAddress = DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS) {
    this.client = new Aptos(config);
    this.confidentialAssetModuleAddress = confidentialAssetModuleAddress;
    TwistedElGamal.initializeSolver();
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
    tokenAddress: AccountAddressInput;
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
    tokenAddress: AccountAddressInput;
    amount: AnyNumber;
    /** If not set we will use the sender's address. */
    recipient?: AccountAddressInput;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { tokenAddress, amount, recipient = args.sender } = args;
    validateAmount({ amount });

    const amountString = String(amount);

    return this.client.transaction.build.simple({
      ...args,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::deposit_to`,
        functionArguments: [tokenAddress, recipient, amountString],
      },
    });
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
    tokenAddress: AccountAddressInput;
    amount: AnyNumber;
    /** If not set we will use the sender's address. */
    recipient?: AccountAddressInput;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { sender, tokenAddress, amount, senderDecryptionKey, recipient = args.sender, options } = args;
    validateAmount({ amount });

    // Get the sender's available balance from the chain
    const { available: senderEncryptedAvailableBalance } = await getBalance({
      client: this.client,
      moduleAddress: this.confidentialAssetModuleAddress,
      accountAddress: sender,
      tokenAddress,
      decryptionKey: senderDecryptionKey,
    });

    const confidentialWithdraw = await ConfidentialWithdraw.create({
      decryptionKey: senderDecryptionKey,
      senderAvailableBalanceCipherText: senderEncryptedAvailableBalance.getCipherText(),
      amount: BigInt(amount),
    });

    const [{ sigmaProof, rangeProof }, encryptedAmountAfterWithdraw] = await confidentialWithdraw.authorizeWithdrawal();

    return this.client.transaction.build.simple({
      ...args,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::withdraw_to`,
        functionArguments: [
          tokenAddress,
          recipient,
          String(amount),
          encryptedAmountAfterWithdraw.getCipherTextBytes(),
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
    tokenAddress: AccountAddressInput;
    withFreezeBalance?: boolean;
    withFeePayer?: boolean;
    checkNormalized?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { checkNormalized = true, withFreezeBalance = false } = args;
    if (checkNormalized) {
      const isNormalized = await isBalanceNormalized({
        client: this.client,
        moduleAddress: this.confidentialAssetModuleAddress,
        accountAddress: args.sender,
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
    tokenAddress: AccountAddressInput;
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
    return new TwistedEd25519PublicKey(globalAuditorPubKey);
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
    tokenAddress: AccountAddressInput;
    amount: AnyNumber;
    senderDecryptionKey: TwistedEd25519PrivateKey;
    additionalAuditorEncryptionKeys?: TwistedEd25519PublicKey[];
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { senderDecryptionKey, recipient, tokenAddress, amount, additionalAuditorEncryptionKeys = [] } = args;
    validateAmount({ amount });

    // Get the auditor public key for the token
    const globalAuditorPubKey = await this.getAssetAuditorEncryptionKey({
      tokenAddress,
    });

    let recipientEncryptionKey: TwistedEd25519PublicKey;
    try {
      recipientEncryptionKey = await getEncryptionKey({
        client: this.client,
        moduleAddress: this.confidentialAssetModuleAddress,
        accountAddress: recipient,
        tokenAddress,
      });
    } catch (e) {
      throw new Error(`Failed to get encryption key for recipient - ${e}`);
    }
    const isFrozen = await isPendingBalanceFrozen({
      client: this.client,
      moduleAddress: this.confidentialAssetModuleAddress,
      accountAddress: recipient,
      tokenAddress,
    });
    if (isFrozen) {
      throw new Error("Recipient balance is frozen");
    }
    // Get the sender's available balance from the chain
    const { available: senderEncryptedAvailableBalance } = await getBalance({
      client: this.client,
      moduleAddress: this.confidentialAssetModuleAddress,
      accountAddress: args.sender,
      tokenAddress,
      decryptionKey: senderDecryptionKey,
    });

    // Create the confidential transfer object
    const confidentialTransfer = await ConfidentialTransfer.create({
      senderDecryptionKey,
      senderAvailableBalanceCipherText: senderEncryptedAvailableBalance.getCipherText(),
      amount,
      recipientEncryptionKey,
      auditorEncryptionKeys: [
        ...(globalAuditorPubKey ? [globalAuditorPubKey] : []),
        ...additionalAuditorEncryptionKeys,
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

    const auditorEncryptionKeys = confidentialTransfer.auditorEncryptionKeys.map((pk) => pk.toUint8Array());
    const auditorBalances = auditorsCBList.map((el) => el.getCipherTextBytes());

    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::confidential_transfer`,
        functionArguments: [
          tokenAddress,
          recipient,
          encryptedAmountAfterTransfer.getCipherTextBytes(),
          confidentialTransfer.transferAmountEncryptedBySender.getCipherTextBytes(),
          encryptedAmountByRecipient.getCipherTextBytes(),
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
    newSenderDecryptionKey: TwistedEd25519PrivateKey;
    tokenAddress: AccountAddressInput;
    checkPendingBalanceEmpty?: boolean;
    withUnfreezePendingBalance?: boolean;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const {
      sender,
      senderDecryptionKey,
      newSenderDecryptionKey,
      checkPendingBalanceEmpty = true,
      tokenAddress,
      withUnfreezePendingBalance = await isPendingBalanceFrozen({
        client: this.client,
        moduleAddress: this.confidentialAssetModuleAddress,
        accountAddress: sender,
        tokenAddress,
      }),
    } = args;

    // Get the sender's balance from the chain
    const { available: currentEncryptedAvailableBalance, pending: currentEncryptedPendingBalance } = await getBalance({
      client: this.client,
      moduleAddress: this.confidentialAssetModuleAddress,
      accountAddress: sender,
      tokenAddress,
      decryptionKey: senderDecryptionKey,
    });

    if (checkPendingBalanceEmpty) {
      if (currentEncryptedPendingBalance.getAmount() > 0n) {
        throw new Error("Pending balance must be 0 before rotating encryption key");
      }
    }

    // Create the confidential key rotation object
    const confidentialKeyRotation = await ConfidentialKeyRotation.create({
      senderDecryptionKey,
      newSenderDecryptionKey,
      currentEncryptedAvailableBalance,
    });

    // Create the sigma proof and range proof
    const [{ sigmaProof, rangeProof }, newEncryptedAvailableBalance] =
      await confidentialKeyRotation.authorizeKeyRotation();

    const newPublicKeyBytes = args.newSenderDecryptionKey.publicKey().toUint8Array();

    const method = withUnfreezePendingBalance ? "rotate_encryption_key_and_unfreeze" : "rotate_encryption_key";

    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      sender: args.sender,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::${method}`,
        functionArguments: [
          args.tokenAddress,
          newPublicKeyBytes,
          newEncryptedAvailableBalance.getCipherTextBytes(),
          rangeProof,
          ConfidentialKeyRotation.serializeSigmaProof(sigmaProof),
        ],
      },
      options: args.options,
    });
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
    tokenAddress: AccountAddressInput;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { sender, senderDecryptionKey, tokenAddress, withFeePayer, options } = args;
    const { available } = await getBalance({
      client: this.client,
      moduleAddress: this.confidentialAssetModuleAddress,
      accountAddress: sender,
      tokenAddress,
      decryptionKey: senderDecryptionKey,
    });

    const confidentialNormalization = await ConfidentialNormalization.create({
      decryptionKey: senderDecryptionKey,
      unnormalizedAvailableBalance: available,
    });

    return confidentialNormalization.createTransaction({
      client: this.client,
      sender,
      confidentialAssetModuleAddress: this.confidentialAssetModuleAddress,
      tokenAddress,
      withFeePayer,
      options,
    });
  }
}

function validateAmount(args: { amount: AnyNumber }) {
  if (BigInt(args.amount) < 0n) {
    throw new Error("Amount must not be negative");
  }
}
