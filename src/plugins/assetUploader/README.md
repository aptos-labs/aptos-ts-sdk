# NFT Asset Uploader Guide

## Pre-requisite

Before you begin, make sure you have the following:

1. SDK version:
   Ensure you have version 1.9.1-tmp.0 of `@aptos-labs/ts-sdk`.
   [SDK Package](https://www.npmjs.com/package/@aptos-labs/ts-sdk/v/1.9.1-tmp.0?activeTab=versions)

2. Install the SDK with `pnpm`:
   ```bash
   pnpm install @aptos-labs/ts-sdk@1.9.1-tmp.0
   ```

3. Install the Irys SDK with `npm`:
   ```bash
   npm install @irys/sdk
   ```

4. Prepare your NFT media and metadata files:
   Begin with the metadata template and replace the content as necessary.
   ```json
   {
       "name": "Asset Name",
       "description": "Lorem ipsum...",
       "image": "",
       "properties": {
           "simple_property": "example value"
       }
   }
   ```
   Supported media types include: `png`, `jpg`, `jpeg`, `gif`, etc.

   Ensure that the file name in the metadata corresponds to the media file name.

   Each metadata file and corresponding NFT media should be unique.


## How to Use

Below is a sample TypeScript script that demonstrates how to use the uploader:

```ts
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
      files.forEach(file => {
          const filePath = path.join(folderPath, file);
          if (filePath.endsWith(".json")) {
              // Assuming the corresponding image has the same base name as the JSON file
              const baseName = path.basename(file, ".json");
              // Find the corresponding image file
              const imageFile = files.find(f => path.basename(f, path.extname(f)) === baseName);
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
    let collectionMediaManifestID = uploadFileResponse.id;
    let collectionMediaURI = `https://arweave.net/${collectionMediaManifestID}`;
    console.log("Collection Media URL:", collectionMediaURI);

    // Update collection metadata JSON file
    const collectionMetadataJsonPath = "/collection_metadata_json_file_path"; // Update this path
    updateImageField(collectionMetadataJsonPath, collectionMediaURI);

    // Upload updated collection metadata json
    const uploadJsonResponse = await assetUploader.uploadFile({
        account,
        file: collectionMetadataJsonPath,
    });
    let collectionMetadataJsonManifestID = uploadJsonResponse.id;
    let collectionMetadataJsonURI = `https://arweave.net/${collectionMetadataJsonManifestID}`;
    console.log("Collection metadata json URL:", collectionMetadataJsonURI);

    // Upload token media folder
    const tokenMediaFolderPath = "/token_media_folder_path"; // Update this path
    const uploadFolderResponse = await assetUploader.uploadFolder({
        account,
        folder: tokenMediaFolderPath,
    });
    let tokenMediaFolderManifestID = uploadFolderResponse!.id;
    let tokenMediaFolderURI = `https://arweave.net/${tokenMediaFolderManifestID}`;
    console.log("Token media URL folder:", tokenMediaFolderURI);


    // Update token metadata JSON files with token media URL
    const tokenMetadataJsonFolderPath = "/token_metadata_json_folder_path"; // Update this path
    updateImageFieldsInFolder(tokenMetadataJsonFolderPath, tokenMediaFolderURI);

    // Upload the updated token metadata json folder
    const uploadMetadataFolderResponse = await assetUploader.uploadFolder({
        account,
        folder: tokenMetadataJsonFolderPath,
    });
    let tokenMetadataJsonManifestID = uploadMetadataFolderResponse!.id;
    let tokenMetadataJsonFolderURI = `https://arweave.net/${tokenMetadataJsonManifestID}`;
    console.log("Token metadata json URL folder:", tokenMetadataJsonFolderURI);

    // DONE
};

example();
```

To use the provided example code, follow these steps:
1. Replace the placeholders with the correct paths to your files.
2. Run the script in a TypeScript-supported environment.
3. Check the console logs to confirm the media and metadata have been uploaded successfully.

## Helper Functions

Within the example code, there are helper functions designed to:
- Update the image field in a JSON metadata file.
- Recursively update the image fields in all JSON files within a folder.

These functions are essential for linking your NFT media with the correct metadata before uploading to the network.

Remember to test the code in a development environment before deploying it to production to ensure everything works as expected.
