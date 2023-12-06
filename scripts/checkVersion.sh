#!/bin/sh

echo "Version from package.json: $npm_package_version";

# Check that the version in package.json matches the version in src/version.ts
VERSION_FILE='src/version.ts'
echo "Checking $VERSION_FILE";
VERSION_FROM_FILE=$(sed -n '/VERSION/p' $VERSION_FILE | sed 's/^.* \"//' | sed 's/\";.*$//');

if [ "$VERSION_FROM_FILE" != "$npm_package_version" ]; then
  echo "Versions don't match, NPM: $npm_package_version, $VERSION_FILE: $VERSION_FROM_FILE";
  exit 1;
fi;

# Check that the landing page on docs has the version
echo "Checking docs main landing";
DOCS_FILE='docs/index.md';
DOC_LANDING=$(sed -n "/ts-sdk-$npm_package_version/p" $DOCS_FILE);


if [ "$DOC_LANDING" = "" ]; then
  echo "No version $npm_package_version found on main doc landing page $DOCS_FILE";
  exit 1;
fi

DOC_FOLDER="docs/@aptos-labs/ts-sdk-$npm_package_version"

echo "Checking docs folder $DOC_FOLDER"
if [ ! -d "$DOC_FOLDER" ]; then
  echo "Docs folder $DOC_FOLDER doesn't exist";
  exit 1;
fi
