/**
 * Types and utilities for managing permissions in the system.
 * Includes permission types for fungible assets, gas, NFTs and NFT collections,
 * along with interfaces and factory functions for creating and revoking permissions.
 */

import type { Deserializer } from "../../bcs/deserializer";
import { Serializer, Serializable } from "../../bcs/serializer";
import { AccountAddress } from "../../core/accountAddress";

/**
 * Core permission type definitions
 */
export type Permission = FungibleAssetPermission | GasPermission | NFTPermission | NFTCollectionPermission;

export enum MoveVMPermissionType {
  FungibleAsset = "0x1::fungible_asset::WithdrawPermission",
  TransferPermission = "0x1::object::TransferPermission",
}

/**
 * Permission handle metadata and configuration
 */
export interface PermissionHandle {
  expiration: number;
  transactionsPerSecond: number;
  permissions: Permission[];
}

export class FungibleAssetPermission extends Serializable {
  readonly asset: AccountAddress;

  readonly amount: bigint;

  constructor({ asset, amount }: { asset: AccountAddress; amount: number | bigint }) {
    super();
    this.asset = asset;
    this.amount = BigInt(amount);
  }

  static from(args: { asset: AccountAddress; amount: number | bigint }): FungibleAssetPermission {
    return new FungibleAssetPermission(args);
  }

  serialize(serializer: Serializer): void {
    this.asset.serialize(serializer);
    serializer.serializeStr(this.amount.toString());
  }

  static deserialize(deserializer: Deserializer): FungibleAssetPermission {
    const asset = AccountAddress.deserialize(deserializer);
    const amount = BigInt(deserializer.deserializeStr());
    return FungibleAssetPermission.from({ asset, amount });
  }
}

export class GasPermission extends Serializable {
  readonly amount: bigint;

  constructor({ amount }: { amount: number | bigint }) {
    super();
    this.amount = BigInt(amount);
  }

  static from = (args: { amount: number | bigint }): GasPermission => new GasPermission(args);

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.amount.toString());
  }

  static deserialize(deserializer: Deserializer): GasPermission {
    const amount = BigInt(deserializer.deserializeStr());
    return GasPermission.from({ amount });
  }
}

enum NFTCapability {
  transfer = "transfer",
  mutate = "mutate",
}

export class NFTPermission extends Serializable {
  readonly assetAddress: AccountAddress;

  readonly capabilities: Record<NFTCapability, boolean>;

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
    new NFTPermission(args);

  serialize(serializer: Serializer): void {
    this.assetAddress.serialize(serializer);

    const [capabilityKeys, capabilityValues] = Object.entries(this.capabilities).reduce(
      ([keys, values], [key, value]) => [keys.concat(key), values.concat(value)],
      [[] as string[], [] as boolean[]],
    );
    serializer.serializeStr(JSON.stringify(capabilityKeys));
    serializer.serializeStr(JSON.stringify(capabilityValues));
  }

  static deserialize(deserializer: Deserializer): NFTPermission {
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

enum NFTCollectionCapability {
  transfer = "transfer",
  mutate = "mutate",
}

export class NFTCollectionPermission extends Serializable {
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
    this.collectionAddress.serialize(serializer);

    const [capabilityKeys, capabilityValues] = Object.entries(this.capabilities).reduce(
      ([keys, values], [key, value]) => [keys.concat(key), values.concat(value)],
      [[] as string[], [] as boolean[]],
    );
    serializer.serializeStr(JSON.stringify(capabilityKeys));
    serializer.serializeStr(JSON.stringify(capabilityValues));
  }

  static deserialize(deserializer: Deserializer): NFTCollectionPermission {
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
