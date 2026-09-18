## Examples

These examples show how to build common tasks in Javascript and Typescript.

### Running an example

These examples use a linked version of `@aptos-labs/ts-sdk` from `packages/ts-sdk`. To run a test, first install the
root workspace and build that package.

```bash
pnpm install
pnpm turbo run build --filter=@aptos-labs/ts-sdk
```

At this point, you can run any of the examples in this directory. For example, to run the `simple_transfer` example:

```bash
  cd examples/javascript
  pnpm install
  pnpm run simple_transfer
```

This will then print out the results of the test accordingly.

### Moving an example to use the published package

Simply just replace the line in the associated `package.json` file:

```json
"@aptos-labs/ts-sdk": "link:../../packages/ts-sdk"
```

with the appropriate version e.g.:

```json
"@aptos-labs/ts-sdk": "latest"
```

You should be able then simply run:

```bash
pnpm install
pnpm test
```
