# Mainnet Safety

Apply these constraints when users target Mainnet.

## Defaults

1. Do not assume faucet availability.
2. Treat balances and gas as real cost.
3. Require explicit network configuration in snippets.

## Required Checks

1. Verify sender and recipient addresses before submission.
2. Show simulation or dry-run step when feasible.
3. Include explicit `maxGasAmount` and `gasUnitPrice` when user asks for deterministic behavior.
4. Confirm transaction hash and execution status after submit.

## Response Style for Mainnet Requests

1. Keep snippets conservative and explicit.
2. Avoid "quick demo shortcuts" that hide signing or fee behavior.
3. Call out irreversible effects before submit step.
