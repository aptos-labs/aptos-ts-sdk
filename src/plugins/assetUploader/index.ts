import { AptosConfig } from "../../api/aptosConfig";
import { Account } from "../../core";
import { IrysAssetUploader } from "./irys";
import { FundResponse, IAssetUploader, UploadResponse } from "./types";

export class AssetUploader {
  readonly config: AptosConfig;

  readonly assetUploader: IAssetUploader;

  private constructor(config: AptosConfig, assetUploader: IAssetUploader) {
    this.config = config;
    this.assetUploader = assetUploader;
  }

  static async init(config: AptosConfig) {
    switch (config.assetUploaderProvider) {
      case "irys": {
        const assetUploader = await IrysAssetUploader.init(config);
        return new AssetUploader(config, assetUploader);
      }
      default:
        throw new Error("Invalid asset uploader provided");
    }
  }

  /**
   * Funds the node you connected to with the specified amount of tokens
   *
   * @param args.account The account to sign and pay the fund transaction with
   * @param args.amount The amount to fund the node in
   *
   * @return FundResponse
   */
  async fundNode(args: { account: Account; amount: number }): Promise<FundResponse> {
    return this.assetUploader.fundNode({ ...args });
  }

  /**
   * Upload a data
   *
   * @param args.account The account to sign and pay the fund transaction with
   * @param args.data The data to upload
   *
   * @return UploadResponse
   */
  async uploadData(args: { account: Account; data: string | Buffer; options?: any }): Promise<UploadResponse> {
    return this.assetUploader.uploadData({ ...args });
  }

  /**
   * Upload a file
   *
   * @param args.account The account to sign and pay the upload file transaction with
   * @param args.filePathToUpload The file to upload as the file path
   *
   * @return UploadResponse
   */
  async uploadFile(args: { account: Account; filePathToUpload: string; options?: any }): Promise<UploadResponse> {
    return this.assetUploader.uploadFile({ ...args });
  }

  /**
   * Upload a folder
   *
   * @param args.account The account to sign and pay the upload folder transaction with
   * @param args.folderToUpload The folder to upload as the folder path
   *
   * @return UploadResponse | undefined
   */
  async uploadFolder(args: {
    account: Account;
    folderToUpload: string;
    options?: any;
  }): Promise<UploadResponse | undefined> {
    return this.assetUploader.uploadFolder({ ...args });
  }
}
