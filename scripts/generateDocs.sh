#!/bin/sh

# Generate docs by version for the SDK
# References the Github repo directly
# shellcheck disable=SC2154
cross-var npx typedoc src/index.ts --out "docs/@aptos-labs/ts-sdk-$npm_package_version" --cleanOutputDir --excludeInternal --includeVersion

# Update the main page
INDEX_FILE='docs/index.md'
FIRST_LINE=7
NEXT_LINE=$((FIRST_LINE + 1))

# Add in the middle line the new version.
# TODO: Make this more stable / a different way of generating that isn't just inserting a line
{
  head -n $FIRST_LINE $INDEX_FILE;
  cross-var echo "- [Stable - @aptos-labs/ts-sdk-$npm_package_version](@aptos-labs/ts-sdk-$npm_package_version)";
  tail -n +$NEXT_LINE $INDEX_FILE;
} > $INDEX_FILE.tmp && mv $INDEX_FILE.tmp $INDEX_FILE

