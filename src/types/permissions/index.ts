/**
 * Types and utilities for managing permissions in the system.
 * Includes permission types for fungible assets, gas, NFTs and NFT collections,
 * along with interfaces and factory functions for creating and revoking permissions.
 */

import type { Deserializer } from "../../bcs/deserializer";
import { Serializer, Serializable } from "../../bcs/serializer";
import { AccountAddress } from "../../core/accountAddress";


export type Permissions = FungibleAssetPermission | GasPermission | NFTPermission;

/**
 * Core permission type definitions
 */
export abstract class Permission extends Serializable {
  static readonly type: string;

  abstract readonly capabilities: Record<string, boolean>;

  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): Permission {
    const type = deserializer.deserializeStr();

    switch (type) {
      case FungibleAssetPermission.type:
        return FungibleAssetPermission.deserializeData(deserializer);
      case GasPermission.type:
        return GasPermission.deserializeData(deserializer);
      case NFTPermission.type:
        return NFTPermission.deserializeData(deserializer);
      default:
        throw new Error(`Unknown permission type: ${type}`);
    }
  }
}

export enum FungibleAssetPermissionCapability {
  Withdraw = "0x1::fungible_asset::WithdrawPermission",
}

export class FungibleAssetPermission extends Permission {
  /**
   * Static readonly type for the permission
   */
  static readonly type = "fungible-asset-permission";

  /**
   * State
   */
  readonly asset: AccountAddress;

  readonly amount: bigint;

  readonly capabilities: Record<FungibleAssetPermissionCapability, boolean> = {
    [FungibleAssetPermissionCapability.Withdraw]: true,
  };

  constructor({ asset, amount }: { asset: AccountAddress; amount: number | bigint }) {
    super();
    this.asset = asset;
    this.amount = BigInt(amount);
  }

  static from(args: { asset: AccountAddress; amount: number | bigint }): FungibleAssetPermission {
    return new FungibleAssetPermission(args);
  }

  static revoke(args: { asset: AccountAddress }): FungibleAssetPermission {
    return new FungibleAssetPermission({ asset: args.asset, amount: 0n });
  }

  serialize(serializer: Serializer): void {
    serializer.serializeStr(FungibleAssetPermission.type);
    this.asset.serialize(serializer);
    serializer.serializeStr(this.amount.toString());
  }

  static deserializeData(deserializer: Deserializer): FungibleAssetPermission {
    const asset = AccountAddress.deserialize(deserializer);
    const amount = BigInt(deserializer.deserializeStr());
    return FungibleAssetPermission.from({ asset, amount });
  }
}

export enum GasPermissionCapability {
  Withdraw = "0x1::gas::WithdrawPermission",
}

export class GasPermission extends Permission {
  /**
   * Static readonly type for the permission
   */
  static readonly type = "gas-permission";

  /**
   * State
   */
  readonly amount: bigint;

  readonly capabilities: Record<GasPermissionCapability, boolean> = {
    [GasPermissionCapability.Withdraw]: true,
  };

  constructor({ amount }: { amount: number | bigint }) {
    super();
    this.amount = BigInt(amount);
  }

  static from = (args: { amount: number | bigint }): GasPermission => new GasPermission(args);

  static revoke(): GasPermission {
    return new GasPermission({ amount: 0n });
  }

  serialize(serializer: Serializer): void {
    serializer.serializeStr(GasPermission.type);
    serializer.serializeStr(this.amount.toString());
  }

  static deserializeData(deserializer: Deserializer): GasPermission {
    const amount = BigInt(deserializer.deserializeStr());
    return GasPermission.from({ amount });
  }
}

export enum NFTPermissionCapability {
  transfer = "0x1::object::TransferPermission",
  mutate = "mutate",
}

export class NFTPermission extends Permission {
  /**
   * Static readonly type for the permission
   */
  static readonly type = "nft-permission";

  /**
   * State
   */
  readonly assetAddress: AccountAddress;

  readonly capabilities: Record<NFTPermissionCapability, boolean>;

  constructor({
    assetAddress,
    capabilities,
  }: {
    assetAddress: AccountAddress;
    capabilities: Record<NFTPermissionCapability, boolean>;
  }) {
    super();
    this.assetAddress = assetAddress;
    this.capabilities = capabilities;
  }

  static from = (args: {
    assetAddress: AccountAddress;
    capabilities: Record<NFTPermissionCapability, boolean>;
  }): NFTPermission => new NFTPermission(args);

  static revoke(args: { assetAddress: AccountAddress }): NFTPermission {
    return new NFTPermission({
      assetAddress: args.assetAddress,
      capabilities: {
        [NFTPermissionCapability.mutate]: false,
        [NFTPermissionCapability.transfer]: false,
      },
    });
  }

  serialize(serializer: Serializer): void {
    serializer.serializeStr(NFTPermission.type);
    this.assetAddress.serialize(serializer);
    const [capabilityKeys, capabilityValues] = Object.entries(this.capabilities).reduce(
      ([keys, values], [key, value]) => [keys.concat(key), values.concat(value)],
      [[] as string[], [] as boolean[]],
    );
    serializer.serializeStr(JSON.stringify(capabilityKeys));
    serializer.serializeStr(JSON.stringify(capabilityValues));
  }

  static deserializeData(deserializer: Deserializer): NFTPermission {
    const assetAddress = AccountAddress.deserialize(deserializer);
    const capabilityKeys = JSON.parse(deserializer.deserializeStr()) as string[];
    const capabilityValues = JSON.parse(deserializer.deserializeStr()) as boolean[];
    const capabilities = capabilityKeys.reduce(
      (acc, key, i) => ({ ...acc, [key]: capabilityValues[i] }),
      {} as Record<NFTPermissionCapability, boolean>,
    );
    return NFTPermission.from({ assetAddress, capabilities });
  }
}
