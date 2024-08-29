/* eslint-disable no-console */
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const whale0 = "0xc02399a3dadb83d363802e3fc990eceade0e9b2a9a6dc180a092a60b0c17566f";
const whale1 = "0x89fa1b72e65fab3da9a42dfe28047c658a5f1ab8857daaf9621b62156baec9f4";

const aptos = new Aptos(new AptosConfig({ network: Network.MAINNET }));

async function main() {
  const whaleCoins = await aptos.getCurrentFungibleAssetBalances({
    options: { where: { owner_address: { _in: [whale0, whale1] } }, limit: 50 },
  });
  console.log("Whale Coins: ", whaleCoins);

  // Query random metadata

  const [metadata0, metadata1, metadata2, metadata3] = await Promise.all([
    aptos.getFungibleAssetMetadataByAssetType({
      assetType: "0x0dfa6f5fd2d4d2f847c33134fc6d1ba8030d49e988e23c72c475db28fe46617d",
    }),
    aptos.getFungibleAssetMetadataByAssetType({
      assetType: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt",
    }),
    aptos.getFungibleAssetMetadataByCreatorAddress({
      creatorAddress: "0x4a1bec3758817777212c1b45da1ab26e6c29c1e5e405b5a7d2ff539e77dff290",
    }),
    aptos.getFungibleAssetMetadataByCreatorAddress({
      creatorAddress: "0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06",
    }),
  ]);
  console.log("Metadata: ", [metadata0, metadata1, metadata2, metadata3]);
}

main();
