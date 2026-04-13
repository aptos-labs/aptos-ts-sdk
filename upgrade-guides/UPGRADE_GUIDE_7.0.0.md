# UPGRADE_GUIDE_7.0.0.md

## Overview

Version 7.0.0 converts the Aptos TypeScript SDK to **ESM-only** output. CommonJS `require()` syntax is no longer supported.

## Node.js Version Requirement

**Node.js 22+ is now required** (was Node.js 20.0.0+).

---

## Migration Steps

### 1. Update Import Syntax

#### Before (CommonJS):

```javascript
const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");

const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);
```

#### After (ESM):

```javascript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);
```

### 2. Add "type": "module" to Your Project

If your project uses `.js` extension files, add this to your `package.json`:

```json
{
  "name": "your-project",
  "type": "module"
}
```

Alternatively, rename your JavaScript files to `.mjs` extension.

### 3. Update `require()` to `import`

Search your codebase for patterns like:

```javascript
require("@aptos-labs/ts-sdk")
require("@aptos-labs/ts-sdk/dist/...")
```

Replace with:

```javascript
import ... from "@aptos-labs/ts-sdk"
```

---

## Examples

### Before (JavaScript with CommonJS):

```javascript
// old-example.js
const dotenv = require("dotenv");
dotenv.config();
const { Account, Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");

async function main() {
  const aptos = new Aptos(new AptosConfig({ network: Network.DEVNET }));
  const account = Account.generate();
  console.log(account.accountAddress);
}

main();
```

### After (JavaScript with ESM):

```javascript
// new-example.js
import dotenv from "dotenv";
import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

dotenv.config();

async function main() {
  const aptos = new Aptos(new AptosConfig({ network: Network.DEVNET }));
  const account = Account.generate();
  console.log(account.accountAddress);
}

main();
```

---

## Troubleshooting

### Error: `require() of ES Module ... not supported`

This error occurs when trying to use `require()` with the new ESM-only SDK.

**Solution**: Replace `require()` with `import` syntax as shown above.

### Error: `Cannot use import statement outside a module`

This error occurs when running ESM code without proper configuration.

**Solution**: Either:
1. Add `"type": "module"` to your `package.json`, OR
2. Rename your file to `.mjs` extension

---

## Additional Resources

- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [MDN Web Docs - ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

---

## Questions?

If you encounter issues during migration, please open an issue at:
https://github.com/aptos-labs/aptos-ts-sdk/issues
