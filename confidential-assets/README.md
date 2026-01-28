# Test

To test against a modified `aptos-core` repo:

First, run a local node from your modified `aptos-core` branch:
```
ulimit -n unlimited
cargo run -p aptos -- node run-localnet --with-indexer-api --assume-yes --force-restart
```

Second, run the SDK test of your choosing; e.g.:
```
pnpm test tests/e2e/confidentialAsset.test.ts
```

Or, run all tests:
```
pnpm test
```

## Useful tests to know about

### Decryption times

```
pnpm jest tests/units/kangaroo-decryption.test.ts
```
