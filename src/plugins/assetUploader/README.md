# NFT Asset Uploader Guide

## Pre-requisite

Before you begin, make sure you have the following:

1. Install the SDK with `pnpm`:
   ```bash
   pnpm install @aptos-labs/ts-sdk@1.9.1-tmp.0
   ```

2. Install the Irys SDK with `pnpm`:
   ```bash
   pnpm install @irys/sdk
   ```

3. Prepare your NFT media and metadata files:
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
`examples/typescript/asset_uploader.ts`

To use the provided example code, follow these steps:
1. Replace the placeholders with the correct paths to your files.
2. Run the script in a TypeScript-supported Node environment.
3. Check the console logs to confirm the media and metadata have been uploaded successfully.

## Helper Functions

Within the example code, there are helper functions designed to:
- Update the image field in a JSON metadata file.
- Recursively update the image fields in all JSON files within a folder.

These functions are essential for linking your NFT media with the correct metadata before uploading to the network.

Remember to test the code in a development environment before deploying it to production to ensure everything works as expected.
