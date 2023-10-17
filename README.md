# Typescript SDK for Aptos

[![Discord][discord-image]][discord-url]
[![NPM Package Version][npm-image-version]][npm-url]
[![NPM Package Downloads][npm-image-downloads]][npm-url]

The Aptos TypeScript SDK provides a convenient way to interact with the Aptos blockchain using TypeScript. It offers a 
set of utility functions, classes, and types to simplify the integration process and enhance developer productivity.

This repository supports version >= 0.0.0 of the [Aptos SDK npm package](https://www.npmjs.com/package/@aptos-labs/ts-sdk).

## Installation

##### For use in Node.js or a web application

Install with your favorite package manager such as npm, yarn, or pnpm:
```bash
npm install @aptos-labs/ts-sdk
```

##### For use in a browser

You can add the SDK to your web application using a script tag:
```html
<script src="https://unpkg.com/@aptos-labs/ts-sdk@latest/dist/index.global.js" />
```

Then, the SDK can be accessed through `window.aptosSDK`.

## Documentation and examples

- [The Aptos documentation site](https://aptos.dev/sdks/ts-sdk/index) provides step-by-step instructions, code snippets, and best practices to use this library.
- For in-depth examples, check out the [examples](https://github.com/aptos-labs/aptos-ts-sdk/examples) folder with ready-made `package.json` files to get you going quickly!

### Testing

To run the SDK tests, simply run from the root of this repository:

```bash
pnpm test
```

## Contributing

If you found a bug or would like to request a feature, please file an [issue](https://github.com/aptos-labs/aptos-ts-sdk/issues/new/choose). 
If, based on the discussion on an issue you would like to offer a code change, please make a [pull request](https://github.com/aptos-labs/aptos-ts-sdk/CONTRIBUTING.md). 
If neither of these describes what you would like to contribute, checkout out the [contributing guide](https://github.com/aptos-labs/aptos-ts-sdk/CONTRIBUTING.md).

[npm-image-version]: https://img.shields.io/npm/v/aptos.svg
[npm-image-downloads]: https://img.shields.io/npm/dm/aptos.svg
[npm-url]: https://npmjs.org/package/@aptos-labs/ts-sdk
[discord-image]: https://img.shields.io/discord/945856774056083548?label=Discord&logo=discord&style=flat~~~~
[discord-url]: https://discord.gg/aptosnetwork
