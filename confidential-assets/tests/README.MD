# Confidential Assets Tests

This directory contains tests for the Aptos confidential assets functionality. The tests are organized into:

- `e2e/`: End-to-end tests that verify the complete workflows of confidential assets
- `units/`: Unit tests for individual components and functionality
- `helpers/`: Helper functions and utilities for testing

## Prerequisites

Before running the tests, ensure you have:

1. Node.js (v16 or later) installed
2. PNPM package manager installed
3. Access to an Aptos testnet node

## Environment Variables

The tests use environment variables to determine which accounts to use:

- `TESTNET_PK`: Private key for the Aptos account used in tests
- `TESTNET_DK`: Private key for the TwistedEd25519 account used in tests

### Configuration

To use specific accounts for testing:

1. Create a file named `.env.development` in the confidential-assets directory
2. Add the following variables to the file:
```
TESTNET_PK=your_private_key_here
TESTNET_DK=your_twisted_ed25519_private_key_here
```

If these environment variables are not provided, the tests will automatically generate random accounts for testing purposes.

## Running Tests

To run a specific test file:

```bash
pnpm jest path/to/test/file.test.ts
```

## Test Coverage

After running tests, coverage reports will be generated in the `coverage` directory. You can view detailed coverage information by opening `coverage/lcov-report/index.html` in your browser.
