#!/bin/sh

# Verify license metadata and that npm pack includes LICENSE for a package.
# Usage: scripts/checkLicense.sh [package-directory]

PKG_DIR="${1:-.}"

if [ ! -f "$PKG_DIR/package.json" ]; then
  echo "package.json not found in $PKG_DIR"
  exit 1
fi

if [ ! -f "$PKG_DIR/LICENSE" ]; then
  echo "LICENSE file missing in $PKG_DIR"
  exit 1
fi

LICENSE_FIELD=$(sed -n 's/.*"license": "\(.*\)".*/\1/p' "$PKG_DIR/package.json" | head -n 1)
if [ "$LICENSE_FIELD" != "SEE LICENSE IN LICENSE" ]; then
  echo "Unexpected license field in $PKG_DIR/package.json: $LICENSE_FIELD"
  exit 1
fi

PACK_OUTPUT=$(cd "$PKG_DIR" && npm pack --dry-run 2>&1)
if ! echo "$PACK_OUTPUT" | grep -q ' LICENSE$'; then
  echo "LICENSE not included in npm pack tarball for $PKG_DIR"
  echo "$PACK_OUTPUT"
  exit 1
fi

PACKAGE_NAME=$(sed -n 's/.*"name": "\(.*\)".*/\1/p' "$PKG_DIR/package.json" | head -n 1)
echo "License metadata OK for $PACKAGE_NAME"
