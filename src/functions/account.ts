// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Standalone account functions for tree-shakeable imports.
 * @module
 */

export {
  getInfo as getAccountInfo,
  getModules as getAccountModules,
  getModulesPage as getAccountModulesPage,
  getModule as getAccountModule,
  getTransactions as getAccountTransactions,
  getResources as getAccountResources,
  getResourcesPage as getAccountResourcesPage,
  getResource as getAccountResource,
  lookupOriginalAccountAddress,
  getAccountTokensCount,
  getAccountOwnedTokens,
  getAccountOwnedTokensFromCollectionAddress,
  getAccountCollectionsWithOwnedTokens,
  getAccountTransactionsCount,
  getAccountCoinAmount,
  getAccountCoinsData,
  getAccountCoinsCount,
  getBalance,
  getAccountOwnedObjects,
  deriveAccountFromPrivateKey,
  isAccountExist,
  rotateAuthKey,
  rotateAuthKeyUnverified,
  getAccountsForPublicKey,
  deriveOwnedAccountsFromSigner,
} from "../internal/account";
