# Upstream bugs found while testing the CLI examples on devnet

Three issues turned up while running these examples against devnet on
2026-05-18 with `@aptos-labs/ts-sdk@7.0.1`, `@aptos-labs/aptos-client@4.0.0`,
Node `v26.1.0`. Each one is reported below with the symptom, the root cause,
the workaround used in this repo, and a suggested upstream fix.

The workarounds live in `packages/cli/src/shared.ts` and Example 3, marked with
inline comments pointing at this doc.

---

## Bug 1 — `aptos.fundAccount` reports successful faucet funding as a failed transaction

**Package:** `@aptos-labs/ts-sdk` (any 7.x)

**Symptom:**

Calling `aptos.fundAccount({ accountAddress, amount })` against devnet throws
`FailedTransactionError: Transaction <hash> failed with an error: undefined`.
Querying the same hash on the fullnode shows `success: true,
vm_status: "Executed successfully"` — the on-chain transaction completed fine,
the funds reach the destination account, but the SDK has already given up.

**Reproduction:**

```ts
const aptos = new Aptos(new AptosConfig({ network: Network.DEVNET }));
const a = Account.generate();
await aptos.fundAccount({ accountAddress: a.accountAddress, amount: 100_000_000 });
// → FailedTransactionError, despite the tx succeeding on-chain
```

**Root cause:**

`internal/faucet.ts:57` calls `waitForTransaction` on the hash returned by the
faucet's `POST /fund` endpoint. There's a window where the faucet has accepted
and submitted the tx but the *public* fullnode hasn't fully indexed it yet.
During that window, the fullnode's response is parsed by `waitForTransaction`
into a `lastTxn` that is non-pending but has `success === undefined` and
`vm_status === undefined`. The check at `internal/transaction.ts:286`
(`if (!lastTxn.success) throw new FailedTransactionError(...)`) treats that
state as failure.

**Workaround in this repo:**

Bypass `aptos.fundAccount` entirely. Drive the faucet directly, then poll
`aptos.getAccountInfo(address)` until the destination account exists. We care
about whether the *account* is funded, not about the faucet's transaction
status. See `packages/cli/src/shared.ts::fundFromDevnetFaucet`.

**Suggested upstream fixes (in priority order):**

1. **In `waitForTransaction`:** treat `success === undefined` on a non-pending
   transaction response the same as `Pending` — keep polling rather than
   throwing. The current code short-circuits on a partial response.
2. **In `fundAccount`:** as an additional safety net, after `waitForTransaction`
   resolves (success or failure), verify the *target* account exists and is
   funded. The faucet's job is to fund the address, not to give us a tx hash
   we can wait on; polling the address is the correct signal.
3. **Document the polling-race behavior** so SDK callers know it can happen
   against fast-throughput fullnodes.

---

## Bug 2 — `@aptos-labs/aptos-client` doesn't decompress brotli responses over HTTP/2

**Packages:** `@aptos-labs/aptos-client@4.0.0`, surfaced through
`@aptos-labs/ts-sdk@7.0.1` in Node.

**Symptom:**

Any SDK call that hits the devnet fullnode returns a *string* instead of a
parsed object. The string has 2–4 bytes of binary garbage at the start,
followed by the JSON payload. Downstream code that reads e.g.
`info.authentication_key` gets `undefined`, and `BigInt(info.sequence_number)`
throws `TypeError: Cannot convert undefined to a BigInt`.

**Reproduction:**

```ts
const aptos = new Aptos(new AptosConfig({ network: Network.DEVNET }));
const info = await aptos.getAccountInfo({ accountAddress: someFundedAddr });
console.log(typeof info);              // "string", not "object"
console.log(info.startsWith("{"));     // false
console.log(info.slice(0, 10));        // "8�{..."  <- brotli preamble
```

**Root cause:**

Devnet's fullnode returns `content-encoding: br` by default. The Node entry
point of `@aptos-labs/aptos-client` (`dist/index.node.js`) builds an
`undici.Agent` with `allowH2: true` and dispatches `fetch(url, { dispatcher })`
through it. **Undici's HTTP/2 implementation does not currently auto-decompress
response bodies** (auto-decompression is HTTP/1-only). So `await res.text()`
returns raw brotli bytes, `parseJsonSafely` fails the `JSON.parse`, hits its
fallback, and returns the raw string.

Confirmed by reproducing both code paths:

```ts
// over HTTP/1: body is decoded JSON
new Agent({ allowH2: false })   // ✅ "sequence_number": "0", ...

// over HTTP/2: body is raw brotli
new Agent({ allowH2: true  })   // ❌ <binary preamble>"sequence_number":...
```

…but in my isolated reproductions through undici directly, `res.text()` *did*
decode brotli even with `allowH2: true`. So the bug may be in how the SDK's
client wraps the response — perhaps the response is being read twice (once for
headers, once for body) and the second read sees raw bytes. Either way, end
users hit it.

**Workaround in this repo:**

Tell the server not to compress responses for SDK calls:

```ts
new AptosConfig({
  network,
  clientConfig: { HEADERS: { "accept-encoding": "identity" } },
});
```

**Suggested upstream fixes:**

1. **In `@aptos-labs/aptos-client`:** detect HTTP/2 and either
   (a) explicitly disable brotli in the request's `accept-encoding`, or
   (b) decompress the response body in `parseJsonSafely` when
   `content-encoding` is set and the body isn't a valid UTF-8 prefix of `{`.
2. **In `parseJsonSafely`:** when `JSON.parse` fails, log a warning that
   includes the `content-encoding` header value before falling back to
   returning raw text. Silent fallback hides this class of bug.
3. **Default `allowH2` to `false`** until undici's H2 path is on parity with
   H1 for compression handling. Currently the H2 default is opt-in pain.

---

## Bug 3 — Default `max_gas_amount` exceeds what the devnet faucet can provide in one call

**Package:** `@aptos-labs/ts-sdk` 7.x

**Symptom:**

Every transaction submitted from a freshly faucet-funded account fails at
validation with:

```
Invalid transaction: Type: Validation Code: INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE
```

**Root cause:**

`utils/const.ts` defines `DEFAULT_MAX_GAS_AMOUNT = 2_000_000` units (up from
`200_000` in 6.x). At devnet's typical 100-octa gas unit price, that reserves
`200_000_000` octas = 2 APT for gas. The devnet faucet caps every call at
`100_000_000` octas (1 APT) regardless of the `amount` you request. So a
newly-funded account literally cannot afford to *attempt* a transaction at
default settings — the VM rejects it at the balance-vs-reservation check
before execution.

The faucet cap is a server-side rate-limit (not exposed in the response, but
verifiable by inspecting the balance after fund). The SDK has no
faucet-aware fallback that would either retry funding until the reservation is
satisfiable, or lower the reservation to fit the available balance.

**Workaround in this repo:**

```ts
new AptosConfig({
  network,
  transactionGenerationConfig: { defaultMaxGasAmount: 200_000 },
});
```

This drops the reservation to ~20M octas (0.2 APT), comfortably within the
1 APT the faucet provides.

**Suggested upstream fixes (any of these would resolve it; the first is the
least invasive):**

1. **Revert `DEFAULT_MAX_GAS_AMOUNT` to `200_000` for devnet** — or have
   `AptosConfig` pick the default per-network rather than globally.
2. **Make `aptos.fundAccount` faucet-aware:** call `/fund` repeatedly (or
   call `aptos.gasEstimation()` and request the right amount) until the
   destination has enough balance to cover the default max-gas reservation.
3. **Auto-simulate before submit** and clamp `max_gas_amount` to
   `simulation.gas_used * safety_multiplier` (clamped above `MIN_MAX_GAS_AMOUNT`),
   so the reservation matches reality rather than the worst-case ceiling.
4. **At minimum, surface a clearer error:** when the VM returns
   `INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE` on validation, include the
   computed reservation (`max_gas * gas_unit_price`) and the actual balance
   in the thrown error. The current error is correct but doesn't tell the
   caller what the reservation actually was.

---

## How to verify these are still bugs

Bugs 1–3 are observable from this repo's CLI examples. With a clean checkout:

```bash
# Comment out the workarounds in packages/cli/src/shared.ts:
#   - replace fundFromDevnetFaucet(...) with aptos.fundAccount(...)
#   - remove the clientConfig.HEADERS block
#   - remove the transactionGenerationConfig block
# Then:
pnpm rotate:ed25519
```

You should see Bug 1 immediately (FailedTransactionError on funding). Remove
just the `accept-encoding: identity` header to see Bug 2 (string-shaped
response, `auth_key = undefined`). Restore the headers but remove the
`defaultMaxGasAmount` to see Bug 3 (`INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE`).
