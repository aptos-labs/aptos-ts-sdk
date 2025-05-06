# Confidential Assets Tests

This directory contains tests for the Aptos confidential assets functionality. The tests are organized into:

- `e2e/`: End-to-end tests that verify the complete workflows of confidential assets.
- `units/`: Unit tests for individual components and functionality. These do not test anything against a network.
- `api/`: Tests that verify single pieces of the API. These tests are not run by default becuase the tests are not self contained. Use these only when you want to test specific behaviour of each operation.
- `helpers/`: Helper functions and utilities for testing

## Prerequisites

Before running the tests, ensure you have:

1. Node.js (v16 or later) installed
2. PNPM package manager installed
3. Access to an Aptos testnet node

## Environment Variables

The tests use environment variables to determine which accounts to use:

- `TESTNET_PK`: Private key for the Aptos account used in tests. If not provided we will generate a random account, though this will not work on testnet.
- `TESTNET_DK`: Private key for the TwistedEd25519 account used in tests. You do not generally need to set this. Even if you set `TESTNET_PK` we will derive `TESTNET_DK` from `TESTNET_PK`.

You may also set the following environment variables to configure the testing network and confidential assets module address:

- `TESTING_NETWORK`: The network to use for testing. Defaults to `devnet`.
- `CONFIDENTIAL_ASSETS_MODULE_ADDRESS`: The address of the confidential assets module. Will use the default from the SDK if not set.

For example, to run the E2E tests against testnet:
```
TESTING_NETWORK=testnet TESTNET_PK=<key> pnpm test:e2e
```

As you can see, we set the private key for the account we use in testing since we're testing against testnet.

Make sure the mock token is deployed at the default address, or you can set the address by setting the `MOCK_TOKEN_ADDRESS` environment variable. If you haven't deployed the mock token, you can do so like this:
```
todo
```

## Running Tests

To run a specific test file:

```bash
pnpm jest path/to/test/file.test.ts
```

## Test Coverage

After running tests, coverage reports will be generated in the `coverage` directory. You can view detailed coverage information by opening `coverage/lcov-report/index.html` in your browser.
