import { FundResponse, UploadResponse, CreateAndUploadOptions } from "@irys/sdk/build/cjs/common/types";
import type { NodeIrys } from "@irys/sdk/build/cjs/node/irys";
import { Account } from "../../core";

export { FundResponse, UploadResponse, NodeIrys, CreateAndUploadOptions };

/**
 * Shared interface for asset uploader providers to implement
 *
 * When extending the SDK to use different providers, we might need to use generic
 * inputs and outputs.
 */
export interface IAssetUploader {
  fundNode(args: { account: Account; amount: number }): Promise<FundResponse>;
  uploadData(args: { account: Account; data: string | Buffer; options?: any }): Promise<UploadResponse>;
  uploadFile(args: { account: Account; filePathToUpload: string; options?: any }): Promise<UploadResponse>;
  uploadFolder(args: { account: Account; folderToUpload: string; options?: any }): Promise<UploadResponse | undefined>;
}
