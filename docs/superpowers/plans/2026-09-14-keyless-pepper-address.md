# Keyless Pepper and Address Fetch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a backward-compatible Keyless API that fetches pepper bytes and the initial account address from BCS-serialized ephemeral public data.

**Architecture:** A private helper in `internal/keyless.ts` owns construction and submission of the pepper-service `fetch` request. Existing `getPepper` adapts an `EphemeralKeyPair` to that helper and preserves its byte-only result, while new `getPepperAndAddress` adapts public components and parses the complete response. The `Keyless` namespace and keyless subpath expose the new function without adding it to the SDK's eager main bundle.

**Tech Stack:** TypeScript, Aptos SDK `Hex`/`AccountAddress`, Vitest, mocked Aptos client, Biome, Turbo/pnpm.

## Global Constraints

- Preserve the existing `getPepper({ jwt, ephemeralKeyPair, ... })` signature and `Promise<Uint8Array>` return type.
- `ephemeralPublicKey` is a BCS-serialized ephemeral public key supplied as `HexInput`.
- `expiryDateSecs` is an absolute Unix timestamp in seconds.
- `blinder` is supplied as `HexInput`.
- Return pepper as `Uint8Array` and the service's initial address as `AccountAddress`.
- The new API maps JWT/EPK data to an address; it must not claim to prove ephemeral private-key possession.
- Do not use Node-only APIs in `packages/ts-sdk/src/`.
- Do not add dependencies or edit generated code under `packages/ts-sdk/src/types/generated/`, `packages/ts-sdk/src/internal/queries/`, or `docs/@aptos-labs/`.

---

### Task 1: Internal pepper request and result API

**Files:**
- Modify: `packages/ts-sdk/tests/unit/internal/keyless-pepper.test.ts`
- Modify: `packages/ts-sdk/src/types/keyless.ts`
- Modify: `packages/ts-sdk/src/internal/keyless.ts`

**Interfaces:**
- Consumes: `HexInput`, `Hex`, `AccountAddress`, `PepperFetchRequest`, `PepperFetchResponse`, and the existing pepper-service client.
- Produces:

```ts
export async function getPepperAndAddress(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralPublicKey: HexInput;
  expiryDateSecs: number;
  blinder: HexInput;
  uidKey?: string;
  derivationPath?: string;
}): Promise<{ pepper: Uint8Array; address: AccountAddress }>;
```

- [ ] **Step 1: Write the failing internal test**

Extend the existing pepper responder to return an address and add this test:

```ts
it("getPepperAndAddress accepts public EPK components and returns the complete response", async () => {
  const mock = createMockClient(mockOpts);
  const address = AccountAddress.ONE;
  mock.setResponder((req) => {
    if (req.url?.includes("pepper") && req.method === "POST") {
      return { data: { pepper: keylessTestObject.pepper, address: address.toString() } };
    }
    return { data: {} };
  });

  const result = await getPepperAndAddress({
    aptosConfig: mock.config,
    jwt: keylessTestObject.JWT,
    ephemeralPublicKey: EPHEMERAL_KEY_PAIR.getPublicKey().bcsToHex().toString(),
    expiryDateSecs: EPHEMERAL_KEY_PAIR.expiryDateSecs,
    blinder: EPHEMERAL_KEY_PAIR.blinder,
    uidKey: "email",
    derivationPath: "m/44'/637'/0'/0'/0'",
  });

  expect(Hex.fromHexInput(result.pepper).toString()).toBe(keylessTestObject.pepper);
  expect(result.address).toEqual(address);
  const pepperReq = mock.requests.find((request) => request.url?.includes("pepper"));
  expect(pepperReq?.body).toEqual({
    jwt_b64: keylessTestObject.JWT,
    epk: EPHEMERAL_KEY_PAIR.getPublicKey().bcsToHex().toStringWithoutPrefix(),
    exp_date_secs: EPHEMERAL_KEY_PAIR.expiryDateSecs,
    epk_blinder: Hex.fromHexInput(EPHEMERAL_KEY_PAIR.blinder).toStringWithoutPrefix(),
    uid_key: "email",
    derivation_path: "m/44'/637'/0'/0'/0'",
  });
  expectRequest(pepperReq!, { method: "POST", urlIncludes: "fetch" });
});
```

Import `AccountAddress` and `getPepperAndAddress` in the test file. Keep the existing `getPepper` test as the compatibility assertion.

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
pnpm --filter @aptos-labs/ts-sdk exec vitest run --config vitest.config.unit.ts tests/unit/internal/keyless-pepper.test.ts
```

Expected: FAIL because `getPepperAndAddress` is not exported by `src/internal/keyless.ts`.

- [ ] **Step 3: Correct the wire request type**

Update `PepperFetchRequest` to match the existing JSON request:

```ts
export type PepperFetchRequest = {
  jwt_b64: string;
  epk: string;
  exp_date_secs: number;
  epk_blinder: string;
  uid_key: string;
  derivation_path?: string;
};
```

- [ ] **Step 4: Add the shared request helper and new function**

In `internal/keyless.ts`, import `AccountAddress` alongside `AccountAddressInput`. Add a private helper:

```ts
async function fetchPepper(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralPublicKey: HexInput;
  expiryDateSecs: number;
  blinder: HexInput;
  uidKey: string;
  derivationPath?: string;
  originMethod: string;
}): Promise<PepperFetchResponse> {
  const {
    aptosConfig,
    jwt,
    ephemeralPublicKey,
    expiryDateSecs,
    blinder,
    uidKey,
    derivationPath,
    originMethod,
  } = args;
  const body: PepperFetchRequest = {
    jwt_b64: jwt,
    epk: Hex.fromHexInput(ephemeralPublicKey).toStringWithoutPrefix(),
    exp_date_secs: expiryDateSecs,
    epk_blinder: Hex.fromHexInput(blinder).toStringWithoutPrefix(),
    uid_key: uidKey,
    derivation_path: derivationPath,
  };
  const { data } = await postAptosPepperService<PepperFetchRequest, PepperFetchResponse>({
    aptosConfig,
    path: "fetch",
    body,
    originMethod,
    overrides: { WITH_CREDENTIALS: false },
  });
  return data;
}
```

Refactor existing `getPepper` to call `fetchPepper` with
`ephemeralKeyPair.getPublicKey().bcsToBytes()`, `expiryDateSecs`,
`ephemeralKeyPair.blinder`, and `originMethod: "getPepper"`, then continue to
return decoded `data.pepper`.

Add the new exported function:

```ts
export async function getPepperAndAddress(args: {
  aptosConfig: AptosConfig;
  jwt: string;
  ephemeralPublicKey: HexInput;
  expiryDateSecs: number;
  blinder: HexInput;
  uidKey?: string;
  derivationPath?: string;
}): Promise<{ pepper: Uint8Array; address: AccountAddress }> {
  const {
    aptosConfig,
    jwt,
    ephemeralPublicKey,
    expiryDateSecs,
    blinder,
    uidKey = "sub",
    derivationPath,
  } = args;
  const data = await fetchPepper({
    aptosConfig,
    jwt,
    ephemeralPublicKey,
    expiryDateSecs,
    blinder,
    uidKey,
    derivationPath,
    originMethod: "getPepperAndAddress",
  });
  return {
    pepper: Hex.fromHexInput(data.pepper).toUint8Array(),
    address: AccountAddress.from(data.address),
  };
}
```

Place this TSDoc immediately above the new function:

```ts
/**
 * Retrieves pepper bytes and the initial Keyless account address from public
 * ephemeral key components.
 *
 * The ephemeral public key must be BCS-serialized. The returned address is the
 * initial address derived by the pepper service; it does not account for later
 * authentication-key rotation. This lookup does not prove possession of the
 * ephemeral private key. Off-chain authentication must additionally verify a
 * signature over a fresh, replay-protected challenge.
 *
 * @group Implementation
 */
```

- [ ] **Step 5: Run the focused internal tests to verify GREEN**

Run:

```bash
pnpm --filter @aptos-labs/ts-sdk exec vitest run --config vitest.config.unit.ts tests/unit/internal/keyless-pepper.test.ts
```

Expected: all tests in `keyless-pepper.test.ts` pass.

- [ ] **Step 6: Commit Task 1**

```bash
git add packages/ts-sdk/tests/unit/internal/keyless-pepper.test.ts packages/ts-sdk/src/types/keyless.ts packages/ts-sdk/src/internal/keyless.ts
git commit -m "feat(keyless): fetch pepper and initial address"
```

---

### Task 2: Public Keyless API and documentation

**Files:**
- Modify: `packages/ts-sdk/tests/unit/api/keyless-wrappers.test.ts`
- Modify: `packages/ts-sdk/src/api/keyless.ts`
- Modify: `packages/ts-sdk/src/functions/keyless.ts`
- Modify: `packages/ts-sdk/CHANGELOG.md`

**Interfaces:**
- Consumes: Task 1's `getPepperAndAddress` function.
- Produces:

```ts
class Keyless {
  getPepperAndAddress(args: {
    jwt: string;
    ephemeralPublicKey: HexInput;
    expiryDateSecs: number;
    blinder: HexInput;
    uidKey?: string;
    derivationPath?: string;
  }): Promise<{ pepper: Uint8Array; address: AccountAddress }>;
}
```

and a standalone `getPepperAndAddress` export from `@aptos-labs/ts-sdk/keyless`.

- [ ] **Step 1: Write the failing wrapper test**

Add `getPepperAndAddress: vi.fn()` to the internal module mock, import and
register the typed mock, then add:

```ts
it("getPepperAndAddress forwards public EPK components to the internal implementation", async () => {
  const pepper = new Uint8Array(31).fill(5);
  const address = AccountAddress.ONE;
  mocks.getPepperAndAddress.mockResolvedValue({ pepper, address });
  const ephemeralPublicKey = EPHEMERAL_KEY_PAIR.getPublicKey().bcsToHex().toString();

  const result = await keyless.getPepperAndAddress({
    jwt: keylessTestObject.JWT,
    ephemeralPublicKey,
    expiryDateSecs: EPHEMERAL_KEY_PAIR.expiryDateSecs,
    blinder: EPHEMERAL_KEY_PAIR.blinder,
    uidKey: "email",
    derivationPath: "m/44'/637'/0'/0'/0'",
  });

  expect(result).toEqual({ pepper, address });
  expect(mocks.getPepperAndAddress).toHaveBeenCalledWith({
    aptosConfig: config,
    jwt: keylessTestObject.JWT,
    ephemeralPublicKey,
    expiryDateSecs: EPHEMERAL_KEY_PAIR.expiryDateSecs,
    blinder: EPHEMERAL_KEY_PAIR.blinder,
    uidKey: "email",
    derivationPath: "m/44'/637'/0'/0'/0'",
  });
});
```

- [ ] **Step 2: Run the wrapper test to verify RED**

Run:

```bash
pnpm --filter @aptos-labs/ts-sdk exec vitest run --config vitest.config.unit.ts tests/unit/api/keyless-wrappers.test.ts
```

Expected: FAIL because `Keyless.getPepperAndAddress` does not exist.

- [ ] **Step 3: Add the namespace method and subpath export**

Import Task 1's function and `AccountAddress` in `api/keyless.ts`. Add this
method and TSDoc:

```ts
/**
 * Fetches pepper bytes and the initial Keyless account address from public
 * ephemeral key components.
 *
 * `ephemeralPublicKey` must contain the BCS-serialized ephemeral public key.
 * The returned address is the initial address derived by the pepper service
 * and does not reflect later authentication-key rotation.
 *
 * This lookup validates the JWT-to-EPK association but does not prove
 * possession of the corresponding ephemeral private key. An off-chain
 * authentication flow must additionally verify the client's signature over a
 * fresh, replay-protected challenge.
 *
 * @param args - Public ephemeral key data committed into the JWT nonce.
 * @param args.jwt - JWT issued for the Keyless session.
 * @param args.ephemeralPublicKey - BCS-serialized ephemeral public key.
 * @param args.expiryDateSecs - EPK expiration as a Unix timestamp in seconds.
 * @param args.blinder - Blinder committed with the EPK and expiration.
 * @param args.uidKey - JWT claim containing the user ID. Defaults to `"sub"`.
 * @param args.derivationPath - Optional SLIP-0010 derivation path.
 * @returns Pepper bytes and the initial Keyless account address.
 * @group Keyless
 */
async getPepperAndAddress(args: {
  jwt: string;
  ephemeralPublicKey: HexInput;
  expiryDateSecs: number;
  blinder: HexInput;
  uidKey?: string;
  derivationPath?: string;
}): Promise<{ pepper: Uint8Array; address: AccountAddress }> {
  return getPepperAndAddress({ aptosConfig: this.config, ...args });
}
```

Add `getPepperAndAddress` beside `getPepper` in the standalone export list in
`src/functions/keyless.ts`:

```ts
export {
  getPepper,
  getPepperAndAddress,
  getProof,
  deriveKeylessAccount,
  updateFederatedKeylessJwkSetTransaction,
} from "../internal/keyless.js";
```

- [ ] **Step 4: Update the changelog**

Replace the design-only Unreleased bullet with:

```md
- Add backward-compatible `getPepperAndAddress` Keyless APIs that accept BCS-serialized ephemeral public data and return both pepper bytes and the initial account address for off-chain flows; existing `getPepper` behavior remains unchanged.
```

- [ ] **Step 5: Run wrapper and internal tests to verify GREEN**

Run:

```bash
pnpm --filter @aptos-labs/ts-sdk exec vitest run --config vitest.config.unit.ts tests/unit/internal/keyless-pepper.test.ts tests/unit/api/keyless-wrappers.test.ts
```

Expected: all tests in both files pass.

- [ ] **Step 6: Format and run repository checks**

Run:

```bash
pnpm fmt
pnpm check
pnpm build
```

Expected: all commands exit with status 0 and report no errors.

- [ ] **Step 7: Commit Task 2**

```bash
git add packages/ts-sdk/tests/unit/api/keyless-wrappers.test.ts packages/ts-sdk/src/api/keyless.ts packages/ts-sdk/src/functions/keyless.ts packages/ts-sdk/CHANGELOG.md
git commit -m "feat(keyless): expose pepper address lookup"
```

---

### Task 3: Final compatibility verification

**Files:**
- Verify only; no planned source edits.

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: evidence that the feature and existing Keyless unit behavior pass together.

- [ ] **Step 1: Run all Keyless unit tests**

Run:

```bash
pnpm --filter @aptos-labs/ts-sdk exec vitest run --config vitest.config.unit.ts tests/unit/internal/keyless-*.test.ts tests/unit/api/keyless-wrappers.test.ts
```

Expected: all selected Keyless tests pass with zero failures.

- [ ] **Step 2: Review the branch diff**

Run:

```bash
git diff --check origin/main...HEAD
git status --short
```

Expected: no whitespace errors and no uncommitted files.
