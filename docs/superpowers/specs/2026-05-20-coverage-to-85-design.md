# Coverage to 85% — Design

**Date:** 2026-05-20
**Branch:** `add-coverage`
**Scope:** `@aptos-labs/ts-sdk` (root package). `confidential-asset/` is out of scope.

## Goal

Raise combined `unit + e2e` coverage to **≥ 85% across all four v8 metrics** (statements, branches, functions, lines) and lock that in via vitest thresholds. Every new test must assert something meaningful so the gate prevents regressions, not just code execution.

## Baseline

Measured 2026-05-20 from `pnpm test:coverage:unit` (unit-only):

| Metric | Coverage |
|---|---|
| Statements | 56.07% (3802/6780) |
| Branches | 49.47% (1502/3036) |
| Functions | 60.50% (991/1638) |
| Lines | 55.87% (3676/6579) |

Combined `unit + e2e` is expected to be ~75% statements but lower on branches because e2e exercises happy paths only. Phase 0 captures the real combined baseline.

## Strategic Decisions

1. **Suite that must hit 85%:** combined `unit + e2e` (matches `vitest.config.ts` thresholds, not codecov-only).
2. **Test mix:** unit tests with mocked HTTP for error / validation branches; e2e (existing) for happy-path flows.
3. **Hard-to-test modules:** excluded from coverage with one-line justifications rather than padded with trivial tests.
4. **Enforcement:** vitest thresholds raised to 85; codecov stays informational.

## Meaningful-Assertion Rules

Every test added under this initiative must follow these rules. Reviewers reject PRs that violate them.

1. **No bare smoke tests.** Every `it()` makes ≥ 1 `expect()` call that checks state, value, or error — never just "did not throw."
2. **Errors:** use `expect(...).toThrow(SpecificErrorClass)` and assert the message includes a fixed substring describing the cause.
3. **HTTP-mocked tests:** assert (a) the URL, method, body/variables sent AND (b) the parsed return value. Both halves required — checking only the request misses parsing bugs; checking only the result misses request-shape regressions.
4. **BCS / serializable types:** round-trip `serialize → deserialize → equals` (or deep-equal of fields). Bytes-level assertions against a fixture for at least one canonical case per type.
5. **No shared mutable state between tests.** Every fixture is freshly constructed inside `beforeEach` or the test body.
6. **Fixtures are explicit.** No `expect.anything()` or `expect.any(Object)` to paper over unstable output — if the output is non-deterministic, the test is wrong.

## Phase 0 — Baseline + Scaffolding (PR 1)

1. Run `pnpm test --coverage` (combined) once, save the textual summary and the per-file table to `coverage/baseline-2026-05-20.md`. Commit it so future PRs can diff against the snapshot.
2. Add `tests/helpers/mockClient.ts`. It wraps `AptosConfig` so unit tests can inject a fake `aptosRequest` returning canned `{ status, statusText, headers, data, config, request }`. Helper exposes `expectRequest(matcher)` to assert URL/method/body/headers in addition to the parsed result.
3. Add `coverage.exclude` entries (with justification comments) for files we choose not to chase:
   - `src/cli/**` — Node-only, child-process driven, covered by integration in `examples/`.
   - `src/utils/normalizeBundle.ts` — bundler shim, no runtime behavior.
   - `src/transactions/management/asyncQueue.ts` — long-running event loop, behaviorally covered by `tests/e2e/transactionManagement/asyncQueue.test.ts`; unit-mocking would test the mock.
   - `src/index.ts`, `src/version.ts` — re-exports / constants.
4. No threshold change in this PR.

**Definition of done:** baseline file committed, helper imported into one example test, combined `pnpm test:coverage` runs locally.

## Phase 1 — High-Yield Branch Coverage (PRs 2–4)

These modules already get happy-path coverage from e2e; the gap is error branches and rarely-used variants. Each row is one PR-sized chunk.

| Module | Current (unit) | Branches missing | Meaningful assertions required |
|---|---|---|---|
| `src/internal/transaction.ts` | 40% | 4xx/5xx error mapping; `waitForTransaction` indexer-lag retry exhaustion; malformed response | Assert thrown error class + message substring; assert retry count and final version returned; assert request URL per attempt |
| `src/internal/transactionSubmission.ts` | 14% | Multi-agent, fee-payer, sponsored, simulation-only paths | Built `RawTransaction` BCS bytes equal fixture; signer set length and addresses match |
| `src/transactions/transactionBuilder/transactionBuilder.ts` | 24% | Script payload; view-function arg coercion; ABI mismatch errors | `script.bcsToBytes()` equals fixture; ABI mismatch throws with exact message including arg index |
| `src/transactions/transactionBuilder/remoteAbi.ts` | 40% | Generic/struct ABI resolution; option/vector arg fetching; ABI-not-found | Resolved `TypeTag` deep-equals expected; mocked fetch called exactly N times with expected module IDs |
| `src/transactions/authenticator/{account,transaction}.ts` | 12–24% | Multi-key, fee-payer, multi-agent variants | Per variant: `Authenticator.deserialize(auth.bcsToBytes())` deep-equals original |
| `src/transactions/instances/{multiAgentTransaction,feePayerTransaction,multisigPayload,proofChallenge}.ts` | 0% | Constructors + BCS round-trip + equality | Construct, serialize, deserialize, deep-equal field by field |
| `src/internal/keyless.ts` | 48% | Pepper/proof fetch error paths; JWT validation failures | Specific error class on bad JWT; mocked pepper service receives exact request body |

## Phase 2 — Internal Modules Without e2e Coverage (PR 5)

For each `src/internal/*.ts` listed below, add unit tests with the mocked client. One test per public function, each asserting:

- the exact endpoint or GraphQL query + variables sent,
- the parsed return value structure (no `expect.any`),
- the specific error class thrown on empty/malformed indexer or fullnode response.

Files: `ans.ts`, `coin.ts`, `digitalAsset.ts`, `fungibleAsset.ts`, `object.ts`, `staking.ts`, `table.ts`, `view.ts`, `general.ts`, `faucet.ts`, `abstraction.ts`, `encryptionKey.ts`.

## Phase 3 — BCS, Hex, Crypto Edge Cases (PR 6)

- `src/bcs/serializer.ts` and `deserializer.ts` — boundary integers (`MAX_U8`, `MAX_U16`, `MAX_U32`, `MAX_U64`, `MAX_U128`, `MAX_U256`, `0`, `-1` rejection); empty vector; truncated-bytes deserialize throws the expected error class.
- `src/core/crypto/keyless.ts`, `derivableKeyless.ts` — `VerifiableProof` equality; public-key serialization round-trip; bad-input rejection.
- `src/core/crypto/encryption/ciphertext.ts` — deserialize each envelope variant; assert each malformed variant throws.
- `src/transactions/typeTag/index.ts` — error branches in coin-struct-tag factories; nesting depth limit produces a specific error.

## Phase 4 — Enforce + Land (PR 7)

1. Raise `vitest.config.ts` thresholds from 80 to 85 for all four metrics.
2. Add `test:coverage` script (combined) to `package.json` and wire it into CI so threshold breaches fail the build.
3. Update `codecov.yml` `ignore` list to mirror the new `coverage.exclude`.
4. Document the testing patterns (`tests/helpers/mockClient.ts`, BCS round-trip pattern, meaningful-assertion rules) in `CONTRIBUTING.md` under a new "Writing tests" section.

## Out of Scope

- `confidential-asset/` package — separate package with its own changelog and coverage story.
- Migrating any existing test from e2e to unit (or vice versa).
- Adding new runtime targets (React Native, Deno, Bun) to the coverage tally.
- Re-architecting `src/client/core.ts` beyond the minimum needed to make `aptosRequest` injectable for mocks.

## Risks and Open Questions

- **Mockability of `src/client/core.ts`:** Phase 0 needs to confirm we can swap the request function via `AptosConfig` without a wider refactor. If not, Phase 0 expands to include a small adapter.
- **Branch coverage ceiling:** some branches only fire in specific runtimes (e.g., `process.env` guards in `src/utils/runtime.ts`). Where unreachable in the test runtime, add `/* v8 ignore next -- reason */` with a comment, not a fake test.
- **CI duration:** combined coverage adds ~5 min to PRs (Docker + e2e). Acceptable given existing pipeline.
- **Drift:** the 85% gate prevents regressions only if reviewers enforce the meaningful-assertion rules. `CONTRIBUTING.md` codifies them; PR template should remind reviewers.

## Success Criteria

- `pnpm test:coverage` reports ≥ 85% on all four metrics on the `add-coverage` branch and on `main` after merge.
- `vitest.config.ts` thresholds set to 85; CI fails when they break.
- Every new test added under this initiative satisfies the meaningful-assertion rules.
- `coverage/baseline-2026-05-20.md` exists and is referenced from PR descriptions so future regressions are easy to spot.
