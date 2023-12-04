#!/bin/sh

# Replace the old version with the newest version
sed "s|\".*\"|\"$npm_package_version\"|g" src/version.ts > version.ts.tmp && mv version.ts.tmp src/version.ts
