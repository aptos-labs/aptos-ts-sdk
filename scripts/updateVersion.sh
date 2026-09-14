#!/bin/sh

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
PACKAGE_DIR="$REPO_ROOT/packages/ts-sdk"

# Check version from file
VERSION_FILE="$PACKAGE_DIR/src/version.ts"
echo "Checking $VERSION_FILE";
VERSION_FROM_FILE=$(sed -n '/VERSION/p' "$VERSION_FILE" | sed 's/^.* \"//' | sed 's/\";.*$//');

echo "Version file currently: $VERSION_FROM_FILE";
if [ "$VERSION_FROM_FILE" = "$npm_package_version" ]; then
  echo "WARNING: Version is already $npm_package_version, only docs will be updated!";
else
  # Replace the old version with the newest version
  echo "Replacing $VERSION_FROM_FILE with $npm_package_version in $VERSION_FILE";
  sed "s|\".*\"|\"$npm_package_version\"|g" "$VERSION_FILE" > "$VERSION_FILE.tmp" &&
    mv "$VERSION_FILE.tmp" "$VERSION_FILE"
fi
