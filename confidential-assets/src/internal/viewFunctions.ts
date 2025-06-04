// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddressInput, Aptos, LedgerVersionArg } from "@aptos-labs/ts-sdk";
import {
  TwistedEd25519PrivateKey,
  TwistedEd25519PublicKey,
  EncryptedAmount,
  TwistedElGamalCiphertext,
} from "../crypto";
import {
  getAvailableBalanceCacheKey,
  getCache,
  getPendingBalanceCacheKey,
  memoizeAsync,
  setCache,
} from "../utils/memoize";
import { DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS, MODULE_NAME } from "../consts";

type ViewFunctionParams = {
  client: Aptos;
  accountAddress: AccountAddressInput;
  tokenAddress: AccountAddressInput;
  options?: LedgerVersionArg;
  moduleAddress?: string;
};

export type ConfidentialBalanceResponse = {
  chunks: {
    left: { data: string };
    right: { data: string };
  }[];
}[];

/**
 * Represents a confidential balance containing both available and pending amounts
 */
export class ConfidentialBalance {
  /**
   * Creates a new ConfidentialBalance instance
   * @param available - The available encrypted amount
   * @param pending - The pending encrypted amount
   */
  available: EncryptedAmount;
  pending: EncryptedAmount;

  constructor(available: EncryptedAmount, pending: EncryptedAmount) {
    this.available = available;
    this.pending = pending;
  }

  /**
   * Get the decrypted available balance amount
   * @returns The available balance as a bigint
   */
  availableBalance(): bigint {
    return this.available.getAmount();
  }

  /**
   * Get the decrypted pending balance amount
   * @returns The pending balance as a bigint
   */
  pendingBalance(): bigint {
    return this.pending.getAmount();
  }

  /**
   * Get the encrypted available balance ciphertext
   * @returns Array of TwistedElGamal ciphertexts representing the available balance
   */
  availableBalanceCipherText(): TwistedElGamalCiphertext[] {
    return this.available.getCipherText();
  }

  /**
   * Get the encrypted pending balance ciphertext
   * @returns Array of TwistedElGamal ciphertexts representing the pending balance
   */
  pendingBalanceCipherText(): TwistedElGamalCiphertext[] {
    return this.pending.getCipherText();
  }
}

/**
 * Get the balance for an account with optional caching
 *
 * @param args.client - The Aptos client instance
 * @param args.accountAddress - The account address to get the balance for
 * @param args.tokenAddress - The token address of the asset
 * @param args.decryptionKey - The decryption key to decrypt the balance
 * @param args.useCachedValue - Whether to use cached balance values (defaults to false)
 * @param args.options - Optional ledger version for the view call
 * @param args.moduleAddress - Optional module address (defaults to DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS)
 * @returns The confidential balance containing available and pending amounts
 * @throws {Error} If the balance cannot be retrieved or decrypted
 */
export async function getBalance(
  args: ViewFunctionParams & {
    decryptionKey: TwistedEd25519PrivateKey;
    useCachedValue?: boolean;
  },
): Promise<ConfidentialBalance> {
  const { accountAddress, tokenAddress, useCachedValue = false } = args;
  try {
    if (useCachedValue) {
      const cachedAvailableBalance = getCache<EncryptedAmount>(
        getAvailableBalanceCacheKey(accountAddress, tokenAddress, args.client.config.network),
        1000 * 30, // 30 seconds
      );
      const cachedPendingBalance = getCache<EncryptedAmount>(
        getPendingBalanceCacheKey(accountAddress, tokenAddress, args.client.config.network),
        1000 * 30, // 30 seconds
      );
      if (cachedAvailableBalance !== undefined && cachedPendingBalance !== undefined) {
        return new ConfidentialBalance(cachedAvailableBalance, cachedPendingBalance);
      }
    }

    const balance = await getBalanceInternal(args);

    setCache(getAvailableBalanceCacheKey(accountAddress, tokenAddress, args.client.config.network), balance.available);
    setCache(getPendingBalanceCacheKey(accountAddress, tokenAddress, args.client.config.network), balance.pending);
    return balance;
  } catch (error) {
    throw error;
  }
}

/**
 * Internal helper function to get and decrypt balance
 *
 * @param args.client - The Aptos client instance
 * @param args.accountAddress - The account address to get the balance for
 * @param args.tokenAddress - The token address of the asset
 * @param args.decryptionKey - The decryption key to decrypt the balance
 * @param args.options - Optional ledger version for the view call
 * @param args.moduleAddress - Optional module address
 * @returns The decrypted confidential balance
 */
async function getBalanceInternal(
  args: ViewFunctionParams & {
    decryptionKey: TwistedEd25519PrivateKey;
  },
): Promise<ConfidentialBalance> {
  const { decryptionKey } = args;
  const { available, pending } = await getBalanceCipherText(args);

  const decryptedActualBalance = await EncryptedAmount.fromCipherTextAndPrivateKey(available, decryptionKey);
  const decryptedPendingBalance = await EncryptedAmount.fromCipherTextAndPrivateKey(pending, decryptionKey);
  return new ConfidentialBalance(decryptedActualBalance, decryptedPendingBalance);
}

/**
 * Get the encrypted balance for an account
 * @param args.accountAddress - The account address to get the balance for
 * @param args.tokenAddress - The token address of the asset to get the balance for
 * @param args.options.ledgerVersion - The ledger version to use for the lookup
 * @returns The encrypted balance as an object with pending and available balances
 */
async function getBalanceCipherText(args: ViewFunctionParams): Promise<{
  pending: TwistedElGamalCiphertext[];
  available: TwistedElGamalCiphertext[];
}> {
  const {
    client,
    accountAddress,
    tokenAddress,
    options,
    moduleAddress = DEFAULT_CONFIDENTIAL_COIN_MODULE_ADDRESS,
  } = args;
  const [[chunkedPendingBalance], [chunkedActualBalances]] = await Promise.all([
    client.view<ConfidentialBalanceResponse>({
      payload: {
        function: `${moduleAddress}::${MODULE_NAME}::pending_balance`,
        typeArguments: [],
        functionArguments: [accountAddress, tokenAddress],
      },
      options,
    }),
    client.view<ConfidentialBalanceResponse>({
      payload: {
        function: `${moduleAddress}::${MODULE_NAME}::actual_balance`,
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

export async function isBalanceNormalized(args: ViewFunctionParams): Promise<boolean> {
  const [isNormalized] = await args.client.view<[boolean]>({
    payload: {
      function: `${args.moduleAddress}::${MODULE_NAME}::is_normalized`,
      typeArguments: [],
      functionArguments: [args.accountAddress, args.tokenAddress],
    },
    options: args.options,
  });

  return isNormalized;
}

export async function isPendingBalanceFrozen(args: ViewFunctionParams): Promise<boolean> {
  const [isFrozen] = await args.client.view<[boolean]>({
    options: args.options,
    payload: {
      function: `${args.moduleAddress}::${MODULE_NAME}::is_frozen`,
      typeArguments: [],
      functionArguments: [args.accountAddress, args.tokenAddress],
    },
  });

  return isFrozen;
}

/**
 * Check if a user has registered a confidential asset balance
 *
 * @param args.client - The Aptos client instance
 * @param args.accountAddress - The account address to check
 * @param args.tokenAddress - The token address of the asset
 * @param args.options - Optional ledger version for the view call
 * @param args.moduleAddress - Optional module address
 * @returns A boolean indicating if the user has registered
 */
export async function hasUserRegistered(args: ViewFunctionParams): Promise<boolean> {
  const [isRegistered] = await args.client.view<[boolean]>({
    payload: {
      function: `${args.moduleAddress}::${MODULE_NAME}::has_confidential_asset_store`,
      typeArguments: [],
      functionArguments: [args.accountAddress, args.tokenAddress],
    },
    options: args.options,
  });

  return isRegistered;
}

/**
 * Get the encryption key for an account with optional caching
 *
 * @param args.client - The Aptos client instance
 * @param args.accountAddress - The account address to get the key for
 * @param args.tokenAddress - The token address of the asset
 * @param args.useCachedValue - Whether to use cached key value (defaults to false)
 * @param args.options - Optional ledger version for the view call
 * @param args.moduleAddress - Optional module address
 * @returns The encryption key as a TwistedEd25519PublicKey
 * @throws {Error} If the encryption key cannot be retrieved
 */
export async function getEncryptionKey(
  args: ViewFunctionParams & {
    useCachedValue?: boolean;
  },
): Promise<TwistedEd25519PublicKey> {
  const { accountAddress, tokenAddress, options, useCachedValue = false } = args;
  try {
    return await memoizeAsync(
      async () => {
        const [{ point }] = await args.client.view<[{ point: { data: string } }]>({
          options,
          payload: {
            function: `${args.moduleAddress}::${MODULE_NAME}::encryption_key`,
            functionArguments: [accountAddress, tokenAddress],
          },
        });
        return new TwistedEd25519PublicKey(point.data);
      },
      `${accountAddress}-encryption-key-for-${tokenAddress}-${args.client.config.network}`,
      1000 * 60 * 60, // 1 hour cache duration
      useCachedValue,
    )();
  } catch (error) {
    throw error;
  }
}
