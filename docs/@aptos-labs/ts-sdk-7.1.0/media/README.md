## Examples

These examples show how to build common tasks in Javascript and Typescript.

### Running an example

These examples use a linked version of the `aptos` package from the main repository. To run a test, first build the
package in the top level directory of this repo.

```bash
  pnpm build
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
  "aptos": "link:../../.."
```

with the appropriate version e.g.:

```json
  "aptos": "latest"
```

You should be able then simply run:

```bash
    pnpm install
    pnpm test
```
