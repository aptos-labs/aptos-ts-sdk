/**
 * Types and utilities for managing permissions in the system.
 * Includes permission types for fungible assets, gas, NFTs and NFT collections,
 * along with interfaces and factory functions for creating and revoking permissions.
 */

import { Deserializer } from "../bcs/deserializer";
import { Serializable, Serializer } from "../bcs/serializer";
import { AccountAddress } from "../core/accountAddress";

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

export enum NFTCollectionCapability {
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
export class FungibleAssetPermission extends Serializable {
  readonly type = PermissionType.FungibleAsset;

  readonly asset: AccountAddress;

  readonly balance: string;

  constructor({ asset, balance }: { asset: AccountAddress; balance: string }) {
    super();
    this.asset = asset;
    this.balance = balance;
  }

  static from(args: { asset: AccountAddress; balance: string }): FungibleAssetPermission {
    return new FungibleAssetPermission(args);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.type);
    this.asset.serialize(serializer);
    serializer.serializeStr(this.balance);
  }

  static deserialize(deserializer: Deserializer): FungibleAssetPermission {
    deserializer.deserializeStr() as PermissionType.FungibleAsset; // type, is this needed?;
    const asset = AccountAddress.deserialize(deserializer);
    const balance = deserializer.deserializeStr();
    return FungibleAssetPermission.from({ asset, balance });
  }
}

export class GasPermission extends Serializable {
  readonly type = PermissionType.Gas;

  readonly amount: number;

  constructor({ amount }: { amount: number }) {
    super();
    this.amount = amount;
  }

  static from = (args: { amount: number }): GasPermission => new GasPermission(args);

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.type);
    serializer.serializeU16(this.amount);
  }

  static deserialize(deserializer: Deserializer): GasPermission {
    deserializer.deserializeStr() as PermissionType.Gas; // type, is this needed?;
    const amount = deserializer.deserializeU16();
    return GasPermission.from({ amount });
  }
}

export class NFTPermission extends Serializable {
  readonly type = PermissionType.NFT;

  readonly assetAddress: AccountAddress;

  readonly capabilities: Record<NFTCapability, boolean>; // (string[], bool[])

  constructor({
    assetAddress,
    capabilities,
  }: {
    assetAddress: AccountAddress;
    capabilities: Record<NFTCapability, boolean>;
  }) {
    super();
    this.assetAddress = assetAddress;
    this.capabilities = capabilities;
  }

  static from = (args: { assetAddress: AccountAddress; capabilities: Record<NFTCapability, boolean> }): NFTPermission =>
    NFTPermission.from(args);

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.type);
    this.assetAddress.serialize(serializer);

    const [capabilityKeys, capabilityValues] = Object.entries(this.capabilities).reduce(
      ([keys, values], [key, value]) => [keys.concat(key), values.concat(value)],
      [[] as string[], [] as boolean[]],
    );
    serializer.serializeStr(JSON.stringify(capabilityKeys));
    serializer.serializeStr(JSON.stringify(capabilityValues));
  }

  static deserialize(deserializer: Deserializer): NFTPermission {
    deserializer.deserializeStr() as PermissionType.NFT; // type, is this needed?;
    const assetAddress = AccountAddress.deserialize(deserializer);
    const capabilityKeys = JSON.parse(deserializer.deserializeStr()) as string[];
    const capabilityValues = JSON.parse(deserializer.deserializeStr()) as boolean[];
    const capabilities = capabilityKeys.reduce(
      (acc, key, i) => ({ ...acc, [key]: capabilityValues[i] }),
      {} as Record<NFTCapability, boolean>,
    );
    return NFTPermission.from({ assetAddress, capabilities });
  }
}

export class NFTCollectionPermission extends Serializable {
  readonly type = PermissionType.NFTCollection;

  collectionAddress: AccountAddress;

  capabilities: Record<NFTCollectionCapability, boolean>;

  constructor({
    collectionAddress,
    capabilities,
  }: {
    collectionAddress: AccountAddress;
    capabilities: Record<NFTCollectionCapability, boolean>;
  }) {
    super();
    this.collectionAddress = collectionAddress;
    this.capabilities = capabilities;
  }

  static from = (args: {
    collectionAddress: AccountAddress;
    capabilities: Record<NFTCollectionCapability, boolean>;
  }): NFTCollectionPermission => new NFTCollectionPermission(args);

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.type);
    this.collectionAddress.serialize(serializer);

    const [capabilityKeys, capabilityValues] = Object.entries(this.capabilities).reduce(
      ([keys, values], [key, value]) => [keys.concat(key), values.concat(value)],
      [[] as string[], [] as boolean[]],
    );
    serializer.serializeStr(JSON.stringify(capabilityKeys));
    serializer.serializeStr(JSON.stringify(capabilityValues));
  }

  static deserialize(deserializer: Deserializer): NFTCollectionPermission {
    deserializer.deserializeStr() as PermissionType.NFTCollection; // type, is this needed?;
    const collectionAddress = AccountAddress.deserialize(deserializer);
    const capabilityKeys = JSON.parse(deserializer.deserializeStr()) as string[];
    const capabilityValues = JSON.parse(deserializer.deserializeStr()) as boolean[];
    const capabilities = capabilityKeys.reduce(
      (acc, key, i) => ({ ...acc, [key]: capabilityValues[i] }),
      {} as Record<NFTCapability, boolean>,
    );
    return NFTCollectionPermission.from({ collectionAddress, capabilities });
  }
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
