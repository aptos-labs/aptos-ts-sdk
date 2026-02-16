# Fungible and Digital Assets Scenarios

Use this file when user asks for fungible asset or digital asset workflows.

## Fungible Assets (FA)

## FA-1: Transfer in Primary Store

Intent:
- Transfer fungible asset balance between users through primary stores.

Core APIs:
1. `aptos.transferFungibleAsset`
2. `aptos.signAndSubmitTransaction`
3. `aptos.waitForTransaction`
4. `aptos.getAccountCoinAmount`

Inputs:
- signer account
- recipient address
- fungible metadata address
- amount

Outputs:
- transaction hash
- updated source and destination balances

## FA-2: Transfer Between Stores (Primary/Secondary)

Intent:
- Move fungible assets between primary and secondary stores, or across secondary stores.

Core APIs:
1. `aptos.transferFungibleAssetBetweenStores`
2. `aptos.signAndSubmitTransaction`
3. `aptos.waitForTransaction`

Supporting helpers:
1. Primary store view via `0x1::primary_fungible_store::primary_store`
2. Custom secondary store view function in module

Inputs:
- sender
- `fromStore` address
- `toStore` address
- amount

Outputs:
- transfer hash
- updated per-store balances

## FA-3: Admin-Managed Coin Module Flow

Intent:
- Admin mints, burns, freezes, unfreezes, or force-transfers custom FA using a deployed Move module.

Core APIs:
1. `aptos.publishPackageTransaction`
2. `aptos.transaction.build.simple` for module entry functions
3. `aptos.transaction.sign` + `aptos.transaction.submit.simple`
4. `aptos.waitForTransaction`

Typical module functions:
- `mint`
- `burn`
- `freeze_account`
- `unfreeze_account`
- admin `transfer`

Inputs:
- admin account
- module function IDs
- target addresses
- amount

Outputs:
- operation hash per action
- admin-controlled state changes

## Digital Assets (DA)

## DA-1: Collection + Mint

Intent:
- Create collection and mint a digital asset (NFT-style flow).

Core APIs:
1. `aptos.createCollectionTransaction`
2. `aptos.mintDigitalAssetTransaction`
3. `aptos.signAndSubmitTransaction`
4. `aptos.waitForTransaction`
5. `aptos.getCollectionData`
6. `aptos.getOwnedDigitalAssets`

Inputs:
- creator account
- collection name/description/uri
- token name/description/uri

Outputs:
- collection creation hash
- mint hash
- minted digital asset metadata

## DA-2: Transfer Digital Asset

Intent:
- Transfer an owned digital asset to another account.

Core APIs:
1. `aptos.transferDigitalAssetTransaction`
2. `aptos.signAndSubmitTransaction`
3. `aptos.waitForTransaction`
4. `aptos.getOwnedDigitalAssets`

Inputs:
- sender account
- recipient address
- `digitalAssetAddress` (token data ID from owned assets query)

Outputs:
- transfer hash
- ownership change reflected in asset queries

## Mainnet Notes

1. Avoid assuming test faucet.
2. Query balances/ownership before and after every transfer.
3. Include explicit retry/timeout strategy for indexer-backed reads.
