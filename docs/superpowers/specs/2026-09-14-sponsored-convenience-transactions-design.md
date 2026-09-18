# Sponsored Convenience Transactions — Design

**Date:** 2026-09-14
**Status:** Approved (pending spec review)
**Issue:** [#283](https://github.com/aptos-labs/aptos-ts-sdk/issues/283)

## Goal

Allow every public convenience transaction builder in `@aptos-labs/ts-sdk` to generate a
fee-payer transaction using the same `withFeePayer?: boolean` input already supported by
`aptos.transaction.build.simple(...)` and `aptos.transaction.build.multiAgent(...)`.

The issue links the digital-asset and fungible-asset APIs as examples. The same omission exists in
the coin, ANS, keyless, package publication, authentication-key rotation, and account-abstraction
builders, so the fix covers the complete convenience-builder surface.

## Current behavior

The common `generateTransaction(...)` function already accepts `withFeePayer?: boolean`. When the
value is `true`, it builds a `SimpleTransaction` whose `feePayerAddress` is the zero address. The
deferred sponsor flow later replaces that marker with the actual fee payer address when the fee
payer signs.

Convenience builders currently accept `options?: InputGenerateTransactionOptions`, but they omit
the sibling `withFeePayer` input. Their internal implementations also reconstruct the
`generateTransaction(...)` arguments explicitly, so an untyped extra property supplied by a caller
would not be forwarded.

## Public API

Each affected builder gains this additive sibling property:

```ts
withFeePayer?: boolean;
```

It remains separate from `options`, matching the existing transaction-builder API:

```ts
const transaction = await aptos.transferFungibleAsset({
  sender,
  fungibleAssetMetadataAddress,
  recipient,
  amount,
  withFeePayer: true,
});
```

No builder accepts an explicit fee payer address. `withFeePayer: true` intentionally selects the
existing deferred-sponsor flow, and the fee payer signing step supplies the final address.

## Scope

The following object-oriented methods and their exported standalone internal functions are
included:

| Area | Convenience builders |
| --- | --- |
| Digital assets | `createCollectionTransaction`, `mintDigitalAssetTransaction`, `transferDigitalAssetTransaction`, `mintSoulBoundTransaction`, `burnDigitalAssetTransaction`, `freezeDigitalAssetTransaferTransaction`, `unfreezeDigitalAssetTransaferTransaction`, `setDigitalAssetDescriptionTransaction`, `setDigitalAssetNameTransaction`, `setDigitalAssetURITransaction`, `addDigitalAssetPropertyTransaction`, `removeDigitalAssetPropertyTransaction`, `updateDigitalAssetPropertyTransaction`, `addDigitalAssetTypedPropertyTransaction`, `updateDigitalAssetTypedPropertyTransaction` |
| Fungible assets | `transferFungibleAsset`, `transferFungibleAssetBetweenStores` |
| Coin | `transferCoinTransaction` |
| ANS | `setTargetAddress`, `clearTargetAddress`, `setPrimaryName`, `registerName`, `renewDomain` |
| Keyless | `updateFederatedKeylessJwkSetTransaction` |
| Transaction | `publishPackageTransaction`, `rotateAuthKey`, `rotateAuthKeyUnverified` |
| Account abstraction | `addAuthenticationFunctionTransaction`, `removeAuthenticationFunctionTransaction`, `removeDispatchableAuthenticatorTransaction`, `enableAccountAbstractionTransaction`, `disableAccountAbstractionTransaction` |

The account-abstraction enable alias inherits the updated add-function signature. The disable
method declares `withFeePayer` and forwards it through either removal path.

## Data flow

For every builder:

1. The public API method accepts `withFeePayer?: boolean` and forwards it to its corresponding
   internal function.
2. The exported internal function accepts and destructures `withFeePayer`.
3. Every `generateTransaction(...)` call made by that function includes `withFeePayer`.
4. The existing transaction generation code converts `true` into
   `feePayerAddress = AccountAddress.ZERO`; omitted or `false` values preserve single-signer
   behavior.

Methods with multiple transaction-generation branches, particularly ANS registration, primary-name
updates, authentication-key rotation, and account-abstraction disablement, forward the value along
every branch.

## Compatibility and error behavior

- The change is source-compatible because the new field is optional.
- Existing calls retain their current transaction payloads, sender handling, options, return types,
  and error behavior.
- Sponsored convenience builders continue returning `SimpleTransaction`; fee-payer metadata is
  already represented by its optional `feePayerAddress`.
- `withFeePayer` does not move into `InputGenerateTransactionOptions`, avoiding an inconsistent API
  and silent non-forwarding.
- Multi-agent support is not added to convenience builders. The issue requests sponsorship, and a
  sponsored single-sender transaction is already represented by `SimpleTransaction`.

## Testing

Implementation follows test-first development:

1. Add or extend unit tests for each affected internal builder to call it with
   `withFeePayer: true` and verify the mocked `generateTransaction(...)` input contains
   `withFeePayer: true`.
2. Cover every branch in multi-path builders so sponsorship cannot be dropped by one branch.
3. Extend public wrapper tests to verify the flag reaches the internal function, including both
   account-abstraction disablement paths.
4. Add at least one non-mocked transaction-generation assertion showing a convenience builder
   produces a `SimpleTransaction` with a zero `feePayerAddress`.
5. Run the affected unit tests, the TypeScript build, and repository formatting/lint checks.

## Documentation

Add `@param args.withFeePayer` documentation to each affected public and standalone builder and add
an entry under `packages/ts-sdk/CHANGELOG.md#Unreleased`.

## Out of scope

- Changing transaction signing, fee-payer signing, submission, or simulation behavior.
- Adding explicit sponsor-address inputs to convenience builders.
- Adding multi-agent inputs to convenience builders.
- Changing the confidential-asset package, which already supports `withFeePayer`.
- Renaming the existing misspelled digital-asset `Transafer` methods.
