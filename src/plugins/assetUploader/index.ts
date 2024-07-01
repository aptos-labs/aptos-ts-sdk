import { AptosConfig } from "../../api/aptosConfig";
import { Account } from "../../core";
import { IrysAssetUploader } from "./irys";
import { FundResponse, IAssetUploader, UploadResponse, TaggedFile, AssetUploaderProvider } from "./types";

export class AssetUploader {
  readonly config: AptosConfig;

  readonly assetUploader: IAssetUploader;

  private constructor(config: AptosConfig, assetUploader: IAssetUploader) {
    this.config = config;
    this.assetUploader = assetUploader;
  }

  /**
   * Static init function to initialize an AssetUploader instance
   *
   * @param config AptosConfig
   */
  static async init(config: AptosConfig) {
    switch (config.assetUploaderProvider) {
      case AssetUploaderProvider.Irys: {
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
   * @param args.file The file to upload as the file path
   *
   * @return UploadResponse
   */
  async uploadFile(args: { account: Account; file: string | File; options?: any }): Promise<UploadResponse> {
    return this.assetUploader.uploadFile({ ...args });
  }

  /**
   * Upload a folder
   *
   * @param args.account The account to sign and pay the upload folder transaction with
   * @param args.folder The folder to upload as the folder path
   *
   * @return UploadResponse | undefined
   */
  async uploadFolder(args: {
    account: Account;
    folder: string | TaggedFile[];
    options?: any;
  }): Promise<UploadResponse | undefined> {
    return this.assetUploader.uploadFolder({ ...args });
  }

  /**
   * Get cost estimate to upload
   *
   * @param args.account The account to sign the transaction
   * @param args.folderInfo either an array of file sizes in bytes,
   * or an object containing the total number of files
   *  and the sum total size of the files in bytes
   *
   * @return Cost to upload folder, unit is the token specified
   * when instantiating the Irys object Return value is in atomic units
   */
  async estimateFolderPrice(args: {
    account: Account;
    folderInfo: number[] | { fileCount: number; totalBytes: number; headerSizeAvg?: number };
  }): Promise<number> {
    return this.assetUploader.estimateFolderPrice({ ...args });
  }
}
