import type { NodeIrys } from "@irys/sdk/build/cjs/node/irys";
import { CreateAndUploadOptions } from "@irys/sdk/build/cjs/common/types";
import { FundResponse, IAssetUploader, UploadResponse } from "./types";
import { AptosConfig } from "../../api/aptosConfig";
import { Account } from "../../core";
import { Network } from "../../utils";

/**
 * Irys asset uploader
 *
 * Keeping the class here for now for simplicity, when/if extending the SDK
 * to more providers encourged to get this out to its own file
 */
export class IrysAssetUploader implements IAssetUploader {
  readonly config: AptosConfig;

  private irysApp: typeof NodeIrys | undefined;

  private constructor(config: AptosConfig, irysApp: typeof NodeIrys) {
    this.config = config;
    this.irysApp = irysApp;
  }

  static async init(config: AptosConfig) {
    try {
      const irys = await import("@irys/sdk");
      console.log("irys", irys);
      return new IrysAssetUploader(config, irys.default);
    } catch (e: any) {
      throw new Error("To use the Irys service, please install the `@irys/sdk` package");
    }
  }

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
        throw new Error("Unsupported network");
    }
  }

  async getIrys(args: { account: Account }) {
    if (!this.irysApp) {
      throw new Error("Irys has not been initialized");
    }
    const { irysNode, providerUrl } = this.resolveProvider();
    console.log("this.irysApp", this.irysApp);
    const irys = this.irysApp.init({
      url: irysNode, // Irys node
      token: "aptos", // Token used for payment and signing
      publicKey: args.account.publicKey.toString(), // Aptos wallet publicKey
      providerUrl, // Aptos Network
      signingFunction: async (msg: Uint8Array) => args.account.sign(msg).toUint8Array(), // Signing function Irys will use
    });
    return irys;
  }

  async fundNode(args: { account: Account; amount: number }): Promise<FundResponse> {
    const { account, amount } = args;
    const irys = await this.getIrys({ account });
    try {
      return await irys.fund(amount);
    } catch (e) {
      throw new Error(`Error funding irys node ${e}`);
    }
  }

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

  async uploadFile(args: {
    account: Account;
    filePathToUpload: string;
    options?: CreateAndUploadOptions;
  }): Promise<UploadResponse> {
    const { account, filePathToUpload, options } = args;
    const irys = await this.getIrys({ account });

    try {
      return await irys.uploadFile(filePathToUpload, options);
    } catch (e) {
      throw new Error(`Error uploading file to irys ${e}`);
    }
  }

  async uploadFolder(args: {
    account: Account;
    folderToUpload: string;
    options?: any;
  }): Promise<UploadResponse | undefined> {
    const { account, folderToUpload, options } = args;
    const irys = await this.getIrys({ account });

    try {
      return await irys.uploadFolder(folderToUpload, options);
    } catch (e) {
      throw new Error(`Error uploading folder to irys ${e}`);
    }
  }
}
