/* eslint-disable no-console */
import { Account, AptosConfig, Network, Aptos, AssetUploader } from "@aptos-labs/ts-sdk";
import * as fs from "fs";
import * as path from "path";

const example = async () => {
  const updateImageField = (jsonFilePath: string, imageUrl: string) => {
    const metadataContent = fs.readFileSync(jsonFilePath, "utf8");
    const metadataJson = JSON.parse(metadataContent);
    metadataJson.image = imageUrl;
    fs.writeFileSync(jsonFilePath, JSON.stringify(metadataJson, null, 4));
    return metadataJson;
  };

  // Function to recursively update the image fields in all JSON files in a folder synchronously
  const updateImageFieldsInFolder = (folderPath: string, mediaFolderUrl: string) => {
    const files = fs.readdirSync(folderPath);
    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      if (filePath.endsWith(".json")) {
        // Assuming the corresponding image has the same base name as the JSON file
        const baseName = path.basename(file, ".json");
        // Find the corresponding image file
        const imageFile = files.find((f) => path.basename(f, path.extname(f)) === baseName);
        if (imageFile) {
          const imageUrl = `${mediaFolderUrl}/${imageFile}`;
          updateImageField(filePath, imageUrl);
        }
      }
    });
  };

  const account = Account.generate();
  const aptosConfig = new AptosConfig({
    network: Network.TESTNET,
  });
  const aptos = new Aptos(aptosConfig);

  const assetUploader = await AssetUploader.init(aptosConfig);

  await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 1_000_000 });

  // Fund a node
  const fundResponse = await assetUploader.fundNode({ account, amount: 1_000_000 });
  console.log("fund response", fundResponse);

  // Upload collection media
  const collectionMediaPath = "/collection_media_file_path"; // Update this path
  const uploadFileResponse = await assetUploader.uploadFile({
    account,
    file: collectionMediaPath,
  });
  const collectionMediaManifestID = uploadFileResponse.id;
  const collectionMediaURI = `https://arweave.net/${collectionMediaManifestID}`;
  console.log("Collection Media URL:", collectionMediaURI);

  // Update collection metadata JSON file
  const collectionMetadataJsonPath = "/collection_metadata_json_file_path"; // Update this path
  updateImageField(collectionMetadataJsonPath, collectionMediaURI);

  // Upload updated collection metadata json
  const uploadJsonResponse = await assetUploader.uploadFile({
    account,
    file: collectionMetadataJsonPath,
  });
  const collectionMetadataJsonManifestID = uploadJsonResponse.id;
  const collectionMetadataJsonURI = `https://arweave.net/${collectionMetadataJsonManifestID}`;
  console.log("Collection metadata json URL:", collectionMetadataJsonURI);

  // Upload token media folder
  const tokenMediaFolderPath = "/token_media_folder_path"; // Update this path
  const uploadFolderResponse = await assetUploader.uploadFolder({
    account,
    folder: tokenMediaFolderPath,
  });
  const tokenMediaFolderManifestID = uploadFolderResponse!.id;
  const tokenMediaFolderURI = `https://arweave.net/${tokenMediaFolderManifestID}`;
  console.log("Token media URL folder:", tokenMediaFolderURI);

  // Update token metadata JSON files with token media URL
  const tokenMetadataJsonFolderPath = "/token_metadata_json_folder_path"; // Update this path
  updateImageFieldsInFolder(tokenMetadataJsonFolderPath, tokenMediaFolderURI);

  // Upload the updated token metadata json folder
  const uploadMetadataFolderResponse = await assetUploader.uploadFolder({
    account,
    folder: tokenMetadataJsonFolderPath,
  });
  const tokenMetadataJsonManifestID = uploadMetadataFolderResponse!.id;
  const tokenMetadataJsonFolderURI = `https://arweave.net/${tokenMetadataJsonManifestID}`;
  console.log("Token metadata json URL folder:", tokenMetadataJsonFolderURI);

  // DONE
};

example();
