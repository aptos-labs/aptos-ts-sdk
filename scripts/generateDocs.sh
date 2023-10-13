# Generate docs by version for the SDK
# References the Github repo directly
# shellcheck disable=SC2154
cross-var npx typedoc src/index.ts --out "docs/aptos-$npm_package_version" --cleanOutputDir --excludeInternal --gitRemote https://github.com/aptos-labs/aptos-ts-sdk.git --includeVersion
