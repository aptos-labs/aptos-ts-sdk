// Copyright (c) Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AccountAddress,
  AccountAddressInput,
  AnyNumber,
  Aptos,
  AptosConfig,
  InputGenerateTransactionOptions,
  LedgerVersionArg,
  SimpleTransaction,
} from "@aptos-labs/ts-sdk";
import {
  TwistedElGamal,
  ConfidentialNormalization,
  ConfidentialKeyRotation,
  ConfidentialTransfer,
  ConfidentialWithdraw,
  TwistedEd25519PublicKey,
  TwistedEd25519PrivateKey,
} from "../crypto";
import { proveRegistration } from "../crypto/sigmaProtocolRegistration";
import { DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS, MODULE_NAME } from "../consts";
import { getBalance, getEncryptionKey, isBalanceNormalized, isIncomingTransfersPaused } from "./viewFunctions";

/**
 * A class to handle creating transactions for confidential asset operations
 */
export class ConfidentialAssetTransactionBuilder {
  readonly client: Aptos;
  readonly confidentialAssetModuleAddress: string;

  private _chainId?: number;

  async getChainId(): Promise<number> {
    if (!this._chainId) {
      this._chainId = await this.client.getChainId();
    }
    return this._chainId;
  }

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
    const { sender, tokenAddress, decryptionKey } = args;

    // Resolve addresses to 32-byte arrays
    const senderAddr = AccountAddress.from(sender);
    const tokenAddr = AccountAddress.from(tokenAddress);

    // Get chain ID for domain separation
    const chainId = await this.getChainId();

    // Generate the registration sigma proof
    const sigmaProof = proveRegistration({
      dk: decryptionKey,
      senderAddress: senderAddr.toUint8Array(),
      tokenAddress: tokenAddr.toUint8Array(),
      chainId,
    });

    return this.client.transaction.build.simple({
      ...args,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::register_raw`,
        functionArguments: [
          tokenAddress,
          decryptionKey.publicKey().toUint8Array(),
          sigmaProof.commitment,
          sigmaProof.response,
        ],
      },
    });
  }

  /**
   * Deposit an amount from a non-confidential asset balance into the sender's own confidential asset balance.
   *
   * This can be used by an account to convert their own non-confidential asset balance into a confidential asset balance if they have
   * already registered a balance for the token.
   *
   * @param args.tokenAddress - The token address of the asset to deposit to
   * @param args.amount - The amount to deposit
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @param args.options - Optional transaction options
   * @returns A SimpleTransaction to deposit the amount
   */
  async deposit(args: {
    sender: AccountAddressInput;
    tokenAddress: AccountAddressInput;
    amount: AnyNumber;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { tokenAddress, amount } = args;
    validateAmount({ amount });

    const amountString = String(amount);

    return this.client.transaction.build.simple({
      ...args,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::deposit`,
        functionArguments: [tokenAddress, amountString],
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

    // Resolve addresses to 32-byte arrays
    const senderAddr = AccountAddress.from(sender);
    const tokenAddr = AccountAddress.from(tokenAddress);

    // Get chain ID for domain separation
    const chainId = await this.getChainId();

    // Get the auditor public key for the token
    const effectiveAuditorPubKey = await this.getAssetAuditorEncryptionKey({ tokenAddress });

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
      senderAddress: senderAddr.toUint8Array(),
      tokenAddress: tokenAddr.toUint8Array(),
      chainId,
      auditorEncryptionKey: effectiveAuditorPubKey,
    });

    const [{ sigmaProof, rangeProof }, encryptedAmountAfterWithdraw, auditorEncryptedBalance] =
      await confidentialWithdraw.authorizeWithdrawal();

    // Build auditor A components (D points encrypted under auditor key)
    const newBalanceA = auditorEncryptedBalance
      ? auditorEncryptedBalance.getCipherText().map((ct) => ct.D.toRawBytes())
      : ([] as Uint8Array[]);

    return this.client.transaction.build.simple({
      ...args,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::withdraw_to_raw`,
        functionArguments: [
          tokenAddress,
          recipient,
          String(amount),
          encryptedAmountAfterWithdraw.getCipherText().map((ct) => ct.C.toRawBytes()), // new_balance_C
          encryptedAmountAfterWithdraw.getCipherText().map((ct) => ct.D.toRawBytes()), // new_balance_D
          newBalanceA, // new_balance_A
          rangeProof,
          sigmaProof.commitment,
          sigmaProof.response,
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
   * @param args.withPauseIncoming - Whether to pause incoming transfers after rolling over. Default is false.
   * @param args.checkNormalized - Whether to check if the balance is normalized before rolling over. Default is true.
   * @param args.withFeePayer - Whether to use the fee payer for the transaction
   * @returns A SimpleTransaction to roll over the balance
   * @throws {Error} If the balance is not normalized before rolling over, unless checkNormalized is false.
   */
  async rolloverPendingBalance(args: {
    sender: AccountAddressInput;
    tokenAddress: AccountAddressInput;
    withPauseIncoming?: boolean;
    withFeePayer?: boolean;
    checkNormalized?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { checkNormalized = true, withPauseIncoming = false } = args;
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

    const functionName = withPauseIncoming ? "rollover_pending_balance_and_pause" : "rollover_pending_balance";

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
    // EffectiveAuditorConfig::V1 { is_global: bool, config: AuditorConfig::V1 { ek: Option<CompressedRistretto>, epoch: u64 } }
    type EffectiveAuditorConfigResponse = {
      is_global: boolean;
      config: {
        ek: { vec: { data: string }[] };
        epoch: string;
      };
    };
    const [{ config }] = await this.client.view<[EffectiveAuditorConfigResponse]>({
      options: args.options,
      payload: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::get_effective_auditor_config`,
        functionArguments: [args.tokenAddress],
      },
    });
    if (config.ek.vec.length === 0) {
      return undefined;
    }
    return new TwistedEd25519PublicKey(config.ek.vec[0].data);
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
    memo?: Uint8Array;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const { sender, senderDecryptionKey, recipient, tokenAddress, amount, additionalAuditorEncryptionKeys = [], memo = new Uint8Array() } = args;
    validateAmount({ amount });

    // Resolve addresses to 32-byte arrays
    const senderAddr = AccountAddress.from(sender);
    const recipientAddr = AccountAddress.from(recipient);
    const tokenAddr = AccountAddress.from(tokenAddress);

    // Get chain ID for domain separation
    const chainId = await this.getChainId();

    // Get the auditor public key for the token
    const effectiveAuditorPubKey = await this.getAssetAuditorEncryptionKey({
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
    const isPaused = await isIncomingTransfersPaused({
      client: this.client,
      moduleAddress: this.confidentialAssetModuleAddress,
      accountAddress: recipient,
      tokenAddress,
    });
    if (isPaused) {
      throw new Error("Recipient's incoming transfers are paused");
    }
    // Get the sender's available balance from the chain
    const { available: senderEncryptedAvailableBalance } = await getBalance({
      client: this.client,
      moduleAddress: this.confidentialAssetModuleAddress,
      accountAddress: args.sender,
      tokenAddress,
      decryptionKey: senderDecryptionKey,
    });

    // Build the full auditor list for proof generation: [...voluntary, global (if set)]
    // The contract will append the global auditor itself, so we only send voluntary auditor EKs on-chain.
    const allAuditorEncryptionKeys = [
      ...additionalAuditorEncryptionKeys,
      ...(effectiveAuditorPubKey ? [effectiveAuditorPubKey] : []),
    ];

    // Create the confidential transfer object
    const confidentialTransfer = await ConfidentialTransfer.create({
      senderDecryptionKey,
      senderAvailableBalanceCipherText: senderEncryptedAvailableBalance.getCipherText(),
      amount,
      recipientEncryptionKey,
      hasEffectiveAuditor: !!effectiveAuditorPubKey,
      auditorEncryptionKeys: allAuditorEncryptionKeys,
      senderAddress: senderAddr.toUint8Array(),
      recipientAddress: recipientAddr.toUint8Array(),
      tokenAddress: tokenAddr.toUint8Array(),
      chainId,
    });

    const [
      {
        sigmaProof,
        rangeProof: { rangeProofAmount, rangeProofNewBalance },
      },
      encryptedAmountAfterTransfer,
      encryptedAmountByRecipient,
      allAuditorAmountCiphertexts,
      auditorNewBalanceList,
    ] = await confidentialTransfer.authorizeTransfer();

    // Only send voluntary auditor EKs on-chain (not the global auditor, which the contract fetches itself)
    const volunAuditorEncryptionKeys = additionalAuditorEncryptionKeys.map((pk) => pk.toUint8Array());

    // Only send D components for recipient and auditors (C components are shared with sender_amount)
    const recipientDPoints = encryptedAmountByRecipient.getCipherText().map((ct) => ct.D.toRawBytes());
    // Split auditor D points into effective (last, if present) and voluntary (remaining)
    const effectiveAuditorDPoints = effectiveAuditorPubKey
      ? allAuditorAmountCiphertexts[allAuditorAmountCiphertexts.length - 1].getCipherText().map((ct) => ct.D.toRawBytes())
      : [];
    const volunAuditorDPoints = (effectiveAuditorPubKey
      ? allAuditorAmountCiphertexts.slice(0, -1)
      : allAuditorAmountCiphertexts
    ).map((cb) => cb.getCipherText().map((ct) => ct.D.toRawBytes()));

    // Build R_aud components for new balance (D points encrypted under the effective auditor key, i.e., the last one)
    // Only populated when there IS an effective auditor — voluntary auditors don't get new balance R components.
    const newBalanceA = effectiveAuditorPubKey
      ? auditorNewBalanceList[auditorNewBalanceList.length - 1].getCipherText().map((ct) => ct.D.toRawBytes())
      : [];

    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::confidential_transfer_raw`,
        functionArguments: [
          tokenAddress,
          recipient,
          encryptedAmountAfterTransfer.getCipherText().map((ct) => ct.C.toRawBytes()), // new_balance_C
          encryptedAmountAfterTransfer.getCipherText().map((ct) => ct.D.toRawBytes()), // new_balance_D
          newBalanceA, // new_balance_A
          confidentialTransfer.transferAmountEncryptedBySender.getCipherText().map((ct) => ct.C.toRawBytes()), // sender_amount_C
          confidentialTransfer.transferAmountEncryptedBySender.getCipherText().map((ct) => ct.D.toRawBytes()), // sender_amount_D
          recipientDPoints,
          effectiveAuditorDPoints,
          volunAuditorEncryptionKeys,
          volunAuditorDPoints,
          rangeProofNewBalance,
          rangeProofAmount,
          sigmaProof.commitment,
          sigmaProof.response,
          memo,
        ],
      },
    });
  }

  /**
   * Rotate the encryption key for a confidential asset balance.
   *
   * This will by default check if the pending balance is empty and throw an error if it is not.
   * The new entry function uses the Sigma protocol for key rotation proofs and supports an `unpause` flag.
   *
   * @param args.sender - The address of the sender of the transaction who's encryption key is being rotated
   * @param args.senderDecryptionKey - The decryption key of the sender
   * @param args.newSenderDecryptionKey - The new decryption key
   * @param args.tokenAddress - The token address of the asset to rotate the encryption key for
   * @param args.checkPendingBalanceEmpty - Whether to check if the pending balance is empty before rotating. Default is true.
   * @param args.unpause - Whether to unpause incoming transfers after rotation. Default is true.
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
    unpause?: boolean;
    withFeePayer?: boolean;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    const {
      sender,
      senderDecryptionKey,
      newSenderDecryptionKey,
      checkPendingBalanceEmpty = true,
      tokenAddress,
      unpause = true,
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

    // Resolve the sender and token addresses to 32-byte arrays
    const senderAddr = AccountAddress.from(sender);
    const tokenAddr = AccountAddress.from(tokenAddress);

    // Get chain ID for domain separation
    const chainId = await this.getChainId();

    // Create the confidential key rotation object and generate the proof
    const confidentialKeyRotation = ConfidentialKeyRotation.create({
      senderDecryptionKey,
      newSenderDecryptionKey,
      currentEncryptedAvailableBalance,
      senderAddress: senderAddr.toUint8Array(),
      tokenAddress: tokenAddr.toUint8Array(),
      chainId,
    });

    const { newEkBytes, newDBytes, proof } = confidentialKeyRotation.authorizeKeyRotation();

    return this.client.transaction.build.simple({
      ...args,
      withFeePayer: args.withFeePayer,
      sender: args.sender,
      data: {
        function: `${this.confidentialAssetModuleAddress}::${MODULE_NAME}::rotate_encryption_key_raw`,
        functionArguments: [
          args.tokenAddress,
          newEkBytes,
          unpause,
          newDBytes,
          proof.commitment,
          proof.response,
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

    // Resolve addresses to 32-byte arrays
    const senderAddr = AccountAddress.from(sender);
    const tokenAddr = AccountAddress.from(tokenAddress);

    // Get chain ID for domain separation
    const chainId = await this.getChainId();

    // Get the auditor public key for the token
    const effectiveAuditorPubKey = await this.getAssetAuditorEncryptionKey({ tokenAddress });

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
      senderAddress: senderAddr.toUint8Array(),
      tokenAddress: tokenAddr.toUint8Array(),
      chainId,
      auditorEncryptionKey: effectiveAuditorPubKey,
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
