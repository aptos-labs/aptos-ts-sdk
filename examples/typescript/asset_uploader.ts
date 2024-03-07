/* eslint-disable no-console */
import { Account, AptosConfig, Network, Aptos, AssetUploader } from "@aptos-labs/ts-sdk";

const example = async () => {
  const account = Account.generate();
  const aptosConfig = new AptosConfig({
    network: Network.TESTNET,
  });
  const aptos = new Aptos(aptosConfig);

  const assetUploader = await AssetUploader.init(aptosConfig);

  await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 1_000_000 });

  // Fund a node
  const fundResponse = await assetUploader.fundNode({ account, amount: 1000 });
  console.log("fund response", fundResponse);

  // Upload data
  const uploadDataResponse = await assetUploader.uploadData({ account, data: "Hello Aptos" });
  console.log("upload response", uploadDataResponse);

  // Upload file
  const uploadFileResponse = await assetUploader.uploadFile({
    account,
    file: "/Users/maayansavir/Desktop/pfp.jpeg",
  });
  console.log("uploadFileResponse", uploadFileResponse);

  // Upload folder
  const uploadFolderResponse = await assetUploader.uploadFolder({
    account,
    folder: "/Users/maayansavir/Desktop/test-apps/web-app",
  });
  console.log("uploadFolderResponse", uploadFolderResponse);
  process.exit(0);
};

example();
