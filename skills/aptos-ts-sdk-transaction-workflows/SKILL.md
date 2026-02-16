---
name: aptos-ts-sdk-transaction-workflows
description: Build and troubleshoot transaction workflows with the Aptos TypeScript SDK for external community users. Use when requests involve composing Aptos transaction code (build, simulate, sign, submit, wait), sponsored transactions, multi-agent transactions, external signing, ABI-aware performance tuning, or moving from snippets to runnable examples on Devnet, Testnet, or Mainnet. Prioritize transaction scenarios first; treat multisig and fungible/digital assets as secondary coverage.
---

# Aptos TS SDK Transaction Workflows

Use a snippet-first workflow, then assemble snippets into runnable examples only when requested.

## Operate

1. Detect intent and map it to a transaction pattern.
2. Produce composable code blocks for each stage:
- `config/client`
- `payload`
- `build`
- `simulate` (optional)
- `sign` (single, fee payer, multi-agent, or external)
- `submit`
- `wait`
3. Keep each block minimal and typed.
4. Explain how blocks connect through concrete input/output values.
5. Offer a runnable full example only if user asks for end-to-end output.

## Priorities

1. Cover transaction workflows first.
2. Cover multisig and fungible/digital assets only after transaction path is stable.

## Pattern Mapping

Use these references first:
- `references/transaction-patterns.md`
- `references/scenario-catalog.md`
- `references/snippet-library.md`
- `references/mainnet-safety.md`

Map common requests:
- "Transfer/send coin" -> Simple transaction.
- "Gas paid by another account" -> Sponsored transaction (`withFeePayer`).
- "Two signers" -> Multi-agent transaction.
- "Sign off-device/HSM/cold wallet" -> External signing flow.
- "Need speed / lower builder overhead" -> Predefined ABI flow.

## Output Contract

Default output:
- Provide modular snippets with short glue instructions.

If user requests runnable code:
- Assemble snippets into one file with imports, constants, and `main()`.
- State network assumptions explicitly.

For Mainnet:
- Require explicit confirmation assumptions in code comments (no faucet usage, real funds, stricter checks).

## Guardrails

1. Work from this skill's built-in references instead of assuming repository file access.
2. Avoid introducing APIs not present in current SDK examples unless clearly marked as inferred.
3. Prefer explicit error handling around submission and waiting.
4. For external signing, separate "signing message generation" from "submission".
5. For fee payer and multi-agent, show each signer authenticator distinctly.

## Secondary Coverage

After transaction requests are handled:
1. Reuse the same modular pattern for multisig workflows.
2. Reuse the same modular pattern for fungible/digital asset transfers.
3. Keep these as add-on references, not the default response path.

For fungible/digital assets, use:
- `references/fungible-digital-scenarios.md`
- `references/fungible-digital-snippets.md`
