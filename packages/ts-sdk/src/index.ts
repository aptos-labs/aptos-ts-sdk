// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { apiTransactionPluginHost } from "@aptos-labs/ts-api/internal/registerTransactionHost";
import { setTransactionPluginHost } from "@aptos-labs/ts-transactions";

setTransactionPluginHost(apiTransactionPluginHost);

export * from "@aptos-labs/ts-accounts";
export * from "@aptos-labs/ts-api";
export * from "@aptos-labs/ts-bcs";
export * from "@aptos-labs/ts-client";
export * from "@aptos-labs/ts-core";
export * from "@aptos-labs/ts-core/errors";
export * from "@aptos-labs/ts-transactions";
export * from "@aptos-labs/ts-types";
export * from "./utils";
