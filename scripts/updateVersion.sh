#!/bin/sh
# Check version from file
VERSION_FILE='src/version.ts'
echo "Checking $VERSION_FILE";
VERSION_FROM_FILE=$(sed -n '/VERSION/p' $VERSION_FILE | sed 's/^.* \"//' | sed 's/\";.*$//');

echo "Version file currently: $VERSION_FROM_FILE";
if [ "$VERSION_FROM_FILE" = "$npm_package_version" ]; then
  echo "WARNING: Version is already $npm_package_version, only docs will be updated!";
else
  # Replace the old version with the newest version
  echo "Replacing $VERSION_FROM_FILE with $npm_package_version in $VERSION_FILE";
  sed "s|\".*\"|\"$npm_package_version\"|g" src/version.ts > version.ts.tmp && mv version.ts.tmp src/version.ts
fi
