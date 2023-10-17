# Generate docs by version for the SDK
# References the Github repo directly
# shellcheck disable=SC2154
cross-var npx typedoc src/index.ts --out "docs/@aptos-labs/ts-sdk-$npm_package_version" --cleanOutputDir --excludeInternal --includeVersion
