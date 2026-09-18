# Off-chain Keyless Pepper and Address Fetch — Design

**Date:** 2026-09-14
**Status:** Approved (pending written spec review)
**Author:** Cursor Agent

## Goal

Let an off-chain service call the Aptos pepper service with the non-private
components of an ephemeral key and receive both the derived pepper and initial
Keyless account address. Preserve the existing `getPepper` API and its
`Uint8Array` return value.

## Public API

Add a standalone function and matching `Keyless` namespace method:

```ts
getPepperAndAddress({
  jwt,
  ephemeralPublicKey,
  expiryDateSecs,
  blinder,
  uidKey?,
  derivationPath?,
}): Promise<{
  pepper: Uint8Array;
  address: AccountAddress;
}>
```

The standalone function additionally requires `aptosConfig`, following the
existing standalone Keyless function convention. The namespace method obtains
the configuration from its `Keyless` instance.

- `ephemeralPublicKey` is the BCS-serialized ephemeral public key as `HexInput`.
- `expiryDateSecs` is an absolute Unix timestamp in seconds, matching the
  pepper service's `exp_date_secs`; it is not a relative duration.
- `blinder` is the EPK blinder as `HexInput`.
- `uidKey` defaults to `"sub"`.
- `derivationPath` remains optional and is forwarded unchanged.
- `pepper` is decoded from the service's hex string into a `Uint8Array`.
- `address` is parsed into `AccountAddress`. It is the initial account address
  returned by the pepper service, not an on-chain lookup of the current address
  after possible authentication-key rotation.

The existing `getPepper({ jwt, ephemeralKeyPair, ... })` signatures and return
types remain unchanged.

## Implementation

Introduce a private internal request helper that accepts the already-normalized
pepper request fields and returns the raw `PepperFetchResponse`.

- Existing `getPepper` converts its `EphemeralKeyPair` into those fields, calls
  the helper, and returns only decoded pepper bytes as it does today.
- New `getPepperAndAddress` converts the supplied hex fields, calls the same
  helper, and returns decoded pepper bytes plus a parsed `AccountAddress`.
- Export the standalone function from the Keyless subpath and expose a wrapper
  on the `Keyless` class.
- Correct `PepperFetchRequest.jwt_b64` to `string` and make
  `derivation_path` optional so its type matches the existing wire request.

Sharing the HTTP helper keeps endpoint path, credentials behavior, headers, and
future request changes consistent between both public functions.

## Error Handling

Existing HTTP errors continue to surface through the SDK's Aptos API error
handling. Invalid hex inputs fail during `Hex.fromHexInput`; a malformed address
in the service response fails during `AccountAddress.from`. The pepper service
remains authoritative for JWT, nonce, EPK, and expiration validation.

## Security Boundary

This API establishes the account address associated with a JWT and committed
EPK according to the pepper service. It does not prove that the caller possesses
the corresponding ephemeral private key. An off-chain authentication protocol
must issue a fresh server challenge, require an ephemeral-key signature over
that challenge, verify the signature against `ephemeralPublicKey`, and prevent
challenge replay before issuing its own session token.

Making `EphemeralKeyPair` constructible without a private key is explicitly out
of scope. That class signs and serializes private key material, so a public-only
instance would violate its invariants.

## Testing

- Internal unit test: component inputs produce the expected `fetch` request,
  including prefix-free EPK/blinder hex, the UID default, expiration timestamp,
  and optional derivation path.
- Internal unit test: the service response becomes pepper bytes and an
  `AccountAddress`.
- Compatibility unit test: existing `getPepper` continues to accept an
  `EphemeralKeyPair` and return only `Uint8Array`.
- API wrapper unit test: `Keyless.getPepperAndAddress` forwards all fields and
  its instance configuration.
- Run the focused Keyless unit tests, SDK build, formatting, and repository
  checks.

## Alternatives Rejected

1. Change `getPepper` directly. This would break existing callers and internal
   `getProof`/`deriveKeylessAccount` flows that expect pepper bytes.
2. Add shape-dependent `getPepper` overloads. Returning different types based
   on which fields are present makes the API harder to understand and maintain.
3. Expose a raw `fetchPepper` returning service strings. This leaks wire-format
   details and is less consistent with SDK-native `Uint8Array` and
   `AccountAddress` values.
