// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// CJS compatibility wrapper for @aptos-labs/ts-sdk/compat
//
// Node 22.12+ can require() ESM modules directly (no flag needed).
// Older Node 22.x users should use:  const sdk = await import("@aptos-labs/ts-sdk/compat")

"use strict";

try {
  module.exports = require("./index.js");
} catch {
  // Node < 22.12: require(esm) not yet supported — export the import() promise.
  // Consumer must await: const { Aptos } = await require("@aptos-labs/ts-sdk/compat")
  module.exports = import("./index.js");
}
