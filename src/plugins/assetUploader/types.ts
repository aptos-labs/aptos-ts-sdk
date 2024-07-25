import type { FundResponse, UploadResponse, CreateAndUploadOptions } from "@irys/sdk/build/cjs/common/types";
import type { TaggedFile } from "@irys/sdk/build/cjs/web/upload";
import type { NodeIrys } from "@irys/sdk/build/cjs/node/irys";
import type { WebIrys } from "@irys/sdk/build/cjs/web/irys";
import type { Account } from "../../account/Account";
import type { AsyncAccount } from "../../account/AsyncAccount";

export { FundResponse, UploadResponse, TaggedFile, CreateAndUploadOptions, NodeIrys, WebIrys };

/**
 * Shared interface for asset uploader providers to implement
 *
 * When extending the SDK to use different providers, we might need to use generic
 * inputs and outputs.
 */
export interface IAssetUploader {
  fundNode(args: { account: Account | AsyncAccount; amount: number }): Promise<FundResponse>;
  uploadData(args: { account: Account | AsyncAccount; data: string | Buffer; options?: any }): Promise<UploadResponse>;
  uploadFile(args: { account: Account | AsyncAccount; file: string | File; options?: any }): Promise<UploadResponse>;
  uploadFolder(args: {
    account: Account | AsyncAccount;
    folder: string | TaggedFile[];
    options?: any;
  }): Promise<UploadResponse | undefined>;
  estimateFolderPrice(args: {
    account: Account | AsyncAccount;
    folderInfo: number[] | { fileCount: number; totalBytes: number; headerSizeAvg?: number };
  }): Promise<number>;
  getLoadedBalance(args: { account: Account | AsyncAccount }): Promise<number>;
}

export enum AssetUploaderProvider {
  Irys = "irys",
}
