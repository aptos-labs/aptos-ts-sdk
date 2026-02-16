# Fungible and Digital Assets Snippet Library

Use these as modular blocks. Keep snippets independent unless user requests a full runnable script.

## 1) Transfer Fungible Asset (Primary Store)

```ts
import { AccountAddress } from "@aptos-labs/ts-sdk";

const tx = await aptos.transferFungibleAsset({
  sender,
  fungibleAssetMetadataAddress: AccountAddress.from(faMetadataAddress),
  recipient,
  amount,
});

const pending = await aptos.signAndSubmitTransaction({ signer: sender, transaction: tx });
await aptos.waitForTransaction({ transactionHash: pending.hash });
```

## 2) Transfer Fungible Asset Between Stores

```ts
const tx = await aptos.transferFungibleAssetBetweenStores({
  sender,
  fromStore,
  toStore,
  amount,
});

const pending = await aptos.signAndSubmitTransaction({ signer: sender, transaction: tx });
await aptos.waitForTransaction({ transactionHash: pending.hash });
```

## 3) Resolve Primary Store Address (View)

```ts
const payload = {
  function: "0x1::primary_fungible_store::primary_store",
  typeArguments: ["0x1::object::ObjectCore"],
  functionArguments: [owner.accountAddress, metadataAddress],
};
const [primaryStore] = await aptos.view<[{ inner: string }]>({ payload });
```

## 4) Publish Custom FA Package

```ts
const publishTx = await aptos.publishPackageTransaction({
  account: admin.accountAddress,
  metadataBytes,
  moduleBytecode,
});

const pending = await aptos.signAndSubmitTransaction({
  signer: admin,
  transaction: publishTx,
});
await aptos.waitForTransaction({ transactionHash: pending.hash });
```

## 5) Admin Mint/Burn/Freeze/Unfreeze via Module Function

```ts
const tx = await aptos.transaction.build.simple({
  sender: admin.accountAddress,
  data: {
    function: `${admin.accountAddress}::fa_coin::mint`,
    functionArguments: [receiver.accountAddress, amount],
  },
});

const auth = aptos.transaction.sign({ signer: admin, transaction: tx });
const pending = await aptos.transaction.submit.simple({
  transaction: tx,
  senderAuthenticator: auth,
});
await aptos.waitForTransaction({ transactionHash: pending.hash });
```

Swap `mint` with `burn`, `freeze_account`, or `unfreeze_account` and update args.

## 6) Create Collection

```ts
const createCollectionTx = await aptos.createCollectionTransaction({
  creator,
  name: collectionName,
  description: collectionDescription,
  uri: collectionUri,
});

const pending = await aptos.signAndSubmitTransaction({
  signer: creator,
  transaction: createCollectionTx,
});
await aptos.waitForTransaction({ transactionHash: pending.hash });
```

## 7) Mint Digital Asset

```ts
const mintTx = await aptos.mintDigitalAssetTransaction({
  creator,
  collection: collectionName,
  name: tokenName,
  description: tokenDescription,
  uri: tokenUri,
});

const pending = await aptos.signAndSubmitTransaction({
  signer: creator,
  transaction: mintTx,
});
await aptos.waitForTransaction({ transactionHash: pending.hash });
```

## 8) Transfer Digital Asset

```ts
const transferTx = await aptos.transferDigitalAssetTransaction({
  sender,
  digitalAssetAddress,
  recipient,
});

const pending = await aptos.signAndSubmitTransaction({
  signer: sender,
  transaction: transferTx,
});
await aptos.waitForTransaction({ transactionHash: pending.hash });
```

## 9) Check Owned Digital Assets

```ts
const assets = await aptos.getOwnedDigitalAssets({
  ownerAddress: owner.accountAddress,
});
```
