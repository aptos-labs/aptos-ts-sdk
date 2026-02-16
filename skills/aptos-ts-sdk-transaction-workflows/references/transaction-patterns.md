# Transaction Patterns

Use these patterns as the first response path.

## 1) Simple Transaction

Goal:
- Build and send a standard entry-function transaction.

Flow:
1. Create `Aptos` client from `AptosConfig`.
2. Build with `aptos.transaction.build.simple(...)`.
3. Sign with `aptos.transaction.sign(...)` or `aptos.signAndSubmitTransaction(...)`.
4. Submit and `waitForTransaction`.

## 2) Sponsored Transaction

Goal:
- Sender executes action; sponsor pays gas.

Flow:
1. Build with `withFeePayer: true`.
2. Generate sponsor authenticator via `signAsFeePayer`.
3. Submit with sender + fee payer authenticators.

## 3) Multi-Agent Transaction

Goal:
- Multiple required signers for one transaction.

Flow:
1. Build via `aptos.transaction.build.multiAgent(...)`.
2. Sign separately for sender and secondary signers.
3. Submit via `aptos.transaction.submit.multiAgent(...)`.

## 4) External Signing

Goal:
- Sign outside SDK (cold wallet/HSM/service boundary).

Flow:
1. Build transaction in SDK.
2. Serialize and pass signing material externally.
3. Reconstruct authenticator from returned signature bytes.
4. Submit using reconstructed authenticator.

## 5) ABI-Aware Performance

Goal:
- Reduce repeated ABI/network overhead.

Flow:
1. Provide predefined ABI when known.
2. Prefer typed BCS-ready inputs where practical.
3. Optionally cache sequence number and gas options when safe.

## Response Strategy

Default:
- Return composable snippets for each flow step.

On request:
- Merge snippets into one runnable file with minimal constants and setup.
