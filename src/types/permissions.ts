/**
 * Types and utilities for managing permissions in the system.
 * Includes permission types for fungible assets, gas, NFTs and NFT collections,
 * along with interfaces and factory functions for creating and revoking permissions.
 */

/**
 * Core permission type definitions
 */
export type Permission = FungibleAssetPermission | GasPermission | NFTPermission | NFTCollectionPermission;
export type RevokePermission = RevokeFungibleAssetPermission | RevokeNFTPermission | Permission;
export type FilteredPermissions<T extends PermissionType> = Array<Extract<Permission, { type: T }>>;

/**
 * Permission handle metadata and configuration
 */
export interface PermissionHandle {
  // Question: Best way to approach time or date here. Date object, Epoch time string, time in milliseconds
  // The contract will have this as an epoch time in seconds as a number
  expiration: number;
  // Question: Should this be a field at all? Should dapps be able to raise their own rate limit?
  // Question: Should this be a number (1, 10, 100, etc) or a string (low, medium, high)?
  transactionsPerSecond: number;
  permissions: Permission[];
}

/**
 * Capability and permission type enums
 */
export enum NFTCapability {
  transfer = "transfer",
  mutate = "mutate",
}

export enum PermissionType {
  FungibleAsset = "FungibleAsset",
  Gas = "Gas",
  NFT = "NFT",
  NFTCollection = "Collection",
}

/**
 * Permission interfaces for different asset types
 */
export interface FungibleAssetPermission {
  type: PermissionType.FungibleAsset;
  asset: string;
  // Question: best type here?: number | string | bigint
  balance: string;
}

export interface GasPermission {
  type: PermissionType.Gas;
  amount: number;
}

export interface NFTPermission {
  type: PermissionType.NFT;
  assetAddress: string;
  capabilities: Record<NFTCapability, boolean>;
}

export interface NFTCollectionPermission {
  type: PermissionType.NFTCollection;
  collectionAddress: string;
  capabilities: Record<NFTCollectionCapability, boolean>;
}

export enum NFTCollectionCapability {
  transfer = "transfer",
  mutate = "mutate",
}

/**
 * Revoke permission types
 */
export type RevokeFungibleAssetPermission = Pick<FungibleAssetPermission, "type" | "asset">;
export type RevokeNFTPermission = Pick<NFTPermission, "type" | "assetAddress">;

export enum MoveVMPermissionType {
  FungibleAsset = "0x1::fungible_asset::WithdrawPermission",
  TransferPermission = "0x1::object::TransferPermission",
}

/**
 * Factory functions for creating permissions
 */
export function buildFungibleAssetPermission(args: Omit<FungibleAssetPermission, "type">): FungibleAssetPermission {
  return { type: PermissionType.FungibleAsset, ...args };
}
export function buildGasPermission(args: Omit<GasPermission, "type">): GasPermission {
  return { type: PermissionType.Gas, ...args };
}
export function buildNFTPermission(args: Omit<NFTPermission, "type">): NFTPermission {
  return { type: PermissionType.NFT, ...args };
}
export function buildNFTCollectionPermission(args: Omit<NFTCollectionPermission, "type">): NFTCollectionPermission {
  return { type: PermissionType.NFTCollection, ...args };
}

/**
 * Factory functions for creating revoke permissions
 */
export function buildRevokeFungibleAssetPermission(
  args: Omit<RevokeFungibleAssetPermission, "type">,
): RevokeFungibleAssetPermission {
  return { type: PermissionType.FungibleAsset, ...args };
}
export function buildRevokeNFTPermission(args: Omit<RevokeNFTPermission, "type">): RevokeNFTPermission {
  return { type: PermissionType.NFT, ...args };
}
