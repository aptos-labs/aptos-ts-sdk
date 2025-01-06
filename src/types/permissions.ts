/**
 * Types and utilities for managing permissions in the system.
 * Includes permission types for fungible assets, gas, NFTs and NFT collections,
 * along with interfaces and factory functions for creating and revoking permissions.
 */

import type { Deserializer } from "../bcs/deserializer";
import type { Serializer } from "../bcs/serializer";
import { Serializable } from "../bcs/serializer";
import { AccountAddress } from "../core/accountAddress";

/**
 * Core permission type definitions
 */
export type Permission = FungibleAssetPermission | GasPermission | NFTPermission | NFTCollectionPermission;

export abstract class MovePermission extends Serializable {
  static type: string;

  abstract toString(): string;

  serialize(serializer: Serializer): void {
    serializer.serializeStr(this.toString());
  }

  static deserialize(deserializer: Deserializer): MovePermission {
    const payload = JSON.parse(deserializer.deserializeStr());
    switch (payload.type) {
      case FungibleAssetPermission.type:
        return FungibleAssetPermission.from(payload);
      case GasPermission.type:
        return GasPermission.from(payload);
      case NFTPermission.type:
        return NFTPermission.from(payload);
      case NFTCollectionPermission.type:
        return NFTCollectionPermission.from(payload);
      default:
        throw new Error(`Unknown permission type: ${payload}`);
    }
  }
}

export enum MoveVMPermissionType {
  FungibleAsset = "0x1::fungible_asset::WithdrawPermission",
  TransferPermission = "0x1::object::TransferPermission",
}

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

type ToPayload<T> = { [K in keyof T]: string } & { readonly type: string };

interface FungibleAssetPermissionProperties {
  readonly asset: AccountAddress;
  readonly amount: bigint | number;
}
type FungibleAssetPermissionPayload = ToPayload<FungibleAssetPermissionProperties>;

export class FungibleAssetPermission extends MovePermission implements FungibleAssetPermissionProperties {
  static readonly type = "FungibleAsset";

  readonly asset: AccountAddress;

  readonly amount: bigint;

  constructor({ asset, amount }: FungibleAssetPermissionProperties) {
    super();
    this.asset = asset;
    this.amount = BigInt(amount);
  }

  static from(args: FungibleAssetPermissionProperties): FungibleAssetPermission;
  static from(args: FungibleAssetPermissionPayload): FungibleAssetPermission;
  static from(args: FungibleAssetPermissionPayload | FungibleAssetPermissionProperties): FungibleAssetPermission {
    return new FungibleAssetPermission({
      amount: BigInt(args.amount),
      asset: AccountAddress.from(args.asset),
    });
  }

  toString(): string {
    const payload: FungibleAssetPermissionPayload = {
      type: FungibleAssetPermission.type,
      asset: this.asset.toString(),
      amount: this.amount.toString(),
    };

    return JSON.stringify(payload);
  }
}

interface GasPermissionProperties {
  readonly amount: bigint | number;
}
type GasPermissionPayload = ToPayload<GasPermissionProperties>;

export class GasPermission extends MovePermission implements GasPermissionProperties {
  static type = "Gas";

  readonly amount: bigint;

  constructor({ amount }: GasPermissionProperties) {
    super();
    this.amount = BigInt(amount);
  }

  static from(args: GasPermissionPayload): GasPermission;
  static from(args: GasPermissionProperties): GasPermission;
  static from(args: GasPermissionPayload | GasPermissionProperties): GasPermission {
    return new GasPermission({
      amount: BigInt(args.amount),
    });
  }

  toString(): string {
    const payload: GasPermissionPayload = {
      type: GasPermission.type,
      amount: this.amount.toString(),
    };
    return JSON.stringify(payload);
  }
}

enum NFTCapability {
  transfer = "transfer",
  mutate = "mutate",
}

interface NFTPermissionProperties {
  assetAddress: AccountAddress;
  capabilities: Record<NFTCapability, boolean>;
}
type NFTPermissionPayload = ToPayload<NFTPermissionProperties>;
export class NFTPermission extends MovePermission implements NFTPermissionProperties {
  static type = "NFT";

  readonly assetAddress: AccountAddress;

  readonly capabilities: Record<NFTCapability, boolean>;

  constructor({ assetAddress, capabilities }: NFTPermissionProperties) {
    super();
    this.assetAddress = assetAddress;
    this.capabilities = capabilities;
  }

  static from(args: NFTPermissionProperties): NFTPermission;
  static from(args: NFTPermissionPayload): NFTPermission;
  static from(args: NFTPermissionPayload | NFTPermissionProperties): NFTPermission {
    return new NFTPermission({
      assetAddress: AccountAddress.from(args.assetAddress),
      capabilities: typeof args.capabilities === "string" ? JSON.parse(args.capabilities) : args.capabilities,
    });
  }

  toString(): string {
    const payload: NFTPermissionPayload = {
      type: NFTPermission.type,
      assetAddress: this.assetAddress.toString(),
      capabilities: JSON.stringify(this.capabilities),
    };

    return JSON.stringify(payload);
  }
}

enum NFTCollectionCapability {
  transfer = "transfer",
  mutate = "mutate",
}

interface NFTCollectionPermissionProperties {
  collectionAddress: AccountAddress;
  capabilities: Record<NFTCollectionCapability, boolean>;
}
type NFTCollectionPermissionPayload = ToPayload<NFTCollectionPermissionProperties>;

export class NFTCollectionPermission extends MovePermission {
  static type = "NFTCollection";

  readonly collectionAddress: AccountAddress;

  readonly capabilities: Record<NFTCollectionCapability, boolean>;

  constructor({ collectionAddress, capabilities }: NFTCollectionPermissionProperties) {
    super();
    this.collectionAddress = collectionAddress;
    this.capabilities = capabilities;
  }

  static from(args: NFTCollectionPermissionProperties): NFTCollectionPermission;
  static from(args: NFTCollectionPermissionPayload): NFTCollectionPermission;
  static from(args: NFTCollectionPermissionPayload | NFTCollectionPermissionProperties): NFTCollectionPermission {
    return new NFTCollectionPermission({
      capabilities: typeof args.capabilities === "string" ? JSON.parse(args.capabilities) : args.capabilities,
      collectionAddress: AccountAddress.from(args.collectionAddress),
    });
  }

  toString(): string {
    const payload: NFTCollectionPermissionPayload = {
      type: NFTCollectionPermission.type,
      collectionAddress: this.collectionAddress.toString(),
      capabilities: JSON.stringify(this.capabilities),
    };
    return JSON.stringify(payload);
  }
}
