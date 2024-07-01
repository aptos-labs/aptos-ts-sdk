import {
  FundResponse,
  IAssetUploader,
  UploadResponse,
  NodeIrys,
  WebIrys,
  CreateAndUploadOptions,
  TaggedFile,
} from "./types";
import { AptosConfig } from "../../api/aptosConfig";
import { Account } from "../../account";
import { Network } from "../../utils";

/**
 * Irys asset uploader.
 *
 * This module uses the Irys SDK {@link https://docs.irys.xyz/developer-docs/irys-sdk}
 *
 * NOTE: Some limitation and potential issues may appear when using Irys
 *
 * Peer Dependencies:
 * When it comes to peer dependencies, It is a bit tricky with all the different web app frameworks
 * and the bundle tool each uses. If you experience any error like "coult not resolve @irys/sdk",
 * manually install the @irys/sdk package.
 *
 * Polyfill Nodejs:
 * Irys expects web apps to polyfill nodejs modules (i.e inject node modules code into a browser env).
 * If you want to use Irys and have installed the @irys/sdk package, you should polyfill nodejs.
 * Can follow Irys documentation around it:
 * Add polyfill to create-react-app {@link https://docs.irys.xyz/hands-on/tutorials/react}
 * Add polyfill to Vite app {@link https://docs.irys.xyz/hands-on/tutorials/vite}
 *
 * WebIrys module vs NodeIrys module:
 * Irys uses different modules to node and browser envs. That means functions expect different
 * argument inputs based on the env. We have documented it on the function code-doc.
 *
 */
export class IrysAssetUploader implements IAssetUploader {
  readonly config: AptosConfig;

  /**
   * Irys supports different modules for node and browser envs.
   */
  private irysApp: typeof NodeIrys | typeof WebIrys | undefined;

  private constructor(config: AptosConfig, irysApp: typeof NodeIrys) {
    this.config = config;
    this.irysApp = irysApp;
  }

  /**
   * Static init function to initialize an Irys instance
   *
   * @param config AptosConfig
   */
  static async init(config: AptosConfig) {
    try {
      const irys = await import("@irys/sdk");
      return new IrysAssetUploader(config, irys.default);
    } catch (e: any) {
      throw new Error("To use the Irys service, please install the `@irys/sdk` package");
    }
  }

  /**
   * Resolves the Irys provider to use based on the SDK configured network
   *
   * @returns {irysNode: "devnet" | "node1", providerUrl: Network.TESTNET | Network.MAINNET}
   * @throws if SDK configured network is devnet since Irys doesnt support Aptos devnet
   */
  resolveProvider(): { irysNode: string; providerUrl: Network } {
    switch (this.config.network) {
      case Network.DEVNET:
        // Irys does not support Aptos' devnet
        throw new Error("Irys does not support Aptos' devnet");
      case Network.TESTNET:
        return { irysNode: "devnet", providerUrl: Network.TESTNET };
      case Network.MAINNET:
        // Irys supports node1 and node2, there is no major difference between
        // those and it is recommended to simply use node1
        return { irysNode: "node1", providerUrl: Network.MAINNET };
      default:
        throw new Error(`${this.config.network} network is not supported`);
    }
  }

  /**
   * Get the Irys config to use when submitting a transaction to the Irys service
   *
   * @param args.account The account to sign the transaction
   *
   * @returns Promise<NodeIrys | WebIrys>
   */
  async getIrys(args: { account: Account }): Promise<NodeIrys | WebIrys> {
    if (!this.irysApp) {
      throw new Error("Irys has not been initialized");
    }
    const { irysNode, providerUrl } = this.resolveProvider();
    const irys = this.irysApp.init({
      url: irysNode, // Irys node
      token: "aptos", // Token used for payment and signing
      publicKey: args.account.publicKey.toString(), // Aptos wallet publicKey
      providerUrl, // Aptos Network
      signingFunction: async (msg: Uint8Array) => args.account.sign(msg).toUint8Array(), // Signing function Irys will use
    });
    return irys;
  }

  /**
   * Fund an Irys node
   *
   * @param args.account The account to sign the transaction
   * @param args.amount The amount to fund the node with
   *
   * @returns Irys FundResponse
   */
  async fundNode(args: { account: Account; amount: number }): Promise<FundResponse> {
    const { account, amount } = args;
    const irys = await this.getIrys({ account });
    try {
      return await irys.fund(amount);
    } catch (e) {
      throw new Error(`Error funding irys node ${e}`);
    }
  }

  /**
   * Upload a data to Irys
   *
   * @param args.account The account to sign the transaction
   * @param args.data The data to upload
   *
   * @returns Irys UploadResponse
   */
  async uploadData(args: {
    account: Account;
    data: string | Buffer;
    options?: CreateAndUploadOptions;
  }): Promise<UploadResponse> {
    const { account, data, options } = args;
    const irys = await this.getIrys({ account });
    try {
      return await irys.upload(data, options);
    } catch (e) {
      throw new Error(`Error uploading data to irys ${e}`);
    }
  }

  /**
   * Upload a file to Irys
   *
   * @param args.account The account to sign the transaction
   * @param args.file The file to upload.
   * If in node env it should be the file path as a string type.
   * If in a browser env it should be of a File object type
   *
   * @returns Irys UploadResponse
   */
  async uploadFile(args: {
    account: Account;
    file: string | File;
    options?: CreateAndUploadOptions;
  }): Promise<UploadResponse> {
    const { account, file, options } = args;
    const irys = await this.getIrys({ account });

    try {
      return await irys.uploadFile(file as any, options);
    } catch (e) {
      throw new Error(`Error uploading file to irys ${e}`);
    }
  }

  /**
   * Upload a folder to Irys
   *
   * @param args.account The account to sign the transaction
   * @param args.file The folder to upload.
   * If in node env it should be the folder path as a string type.
   * If in a browser env it should be an array of a File object type with optional tags
   *
   * @returns Irys UploadResponse
   */
  async uploadFolder(args: {
    account: Account;
    folder: string | TaggedFile[];
    options?: any;
  }): Promise<UploadResponse | undefined> {
    const { account, folder, options } = args;
    const irys = await this.getIrys({ account });

    try {
      return await irys.uploadFolder(folder as any, options);
    } catch (e) {
      throw new Error(`Error uploading folder to irys ${e}`);
    }
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
    const { account, folderInfo } = args;
    const irys = await this.getIrys({ account });

    try {
      return (await irys.utils.estimateFolderPrice(folderInfo)).toNumber();
    } catch (e) {
      throw new Error(`Error estimating folder price with irys: ${e}`);
    }
  }

  /**
   * Get account's loaded balance
   *
   * @param args.account The account to query balance from
   * @return account loaded balance
   */
  async getLoadedBalance(args: { account: Account }): Promise<number> {
    const { account } = args;
    const irys = await this.getIrys({ account });

    try {
      return (await irys.getLoadedBalance()).toNumber();
    } catch (e) {
      throw new Error(`Error getting loaded balance with irys: ${e}`);
    }
  }
}
