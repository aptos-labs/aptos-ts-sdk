// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Runtime detection utilities. Kept out of the `utils` barrel on purpose —
 * these are internal implementation details used to populate the
 * `x-aptos-client` telemetry header and are not part of the public SDK API.
 *
 * Consumers that need to branch on the current runtime should inspect
 * `globalThis` themselves (e.g. `typeof Bun !== "undefined"`) rather than
 * relying on these helpers.
 *
 * @internal
 */

/**
 * Identifier for the JavaScript runtime the SDK is currently running in.
 * Used for telemetry (e.g. the `x-aptos-client` header).
 *
 * @internal
 */
export type RuntimePlatform = "node" | "browser" | "bun" | "deno" | "react-native" | "unknown";

/**
 * Detects the JavaScript runtime the SDK is currently running in.
 *
 * Detection precedence (most specific first): react-native, deno, bun, browser, node.
 * Falls back to "unknown" if detection fails or the environment is hostile.
 *
 * @internal
 */
export function getRuntimePlatform(): RuntimePlatform {
  try {
    const g = globalThis as any;
    if (typeof g.navigator !== "undefined" && g.navigator.product === "ReactNative") {
      return "react-native";
    }
    if (typeof g.Deno !== "undefined") return "deno";
    if (typeof g.Bun !== "undefined") return "bun";
    if (typeof g.window !== "undefined" && typeof g.document !== "undefined") return "browser";
    if (g.process?.versions?.node) return "node";
  } catch {
    // Fall through to "unknown" in hostile environments.
  }
  return "unknown";
}

/**
 * Returns a compact runtime tag for the `x-aptos-client` telemetry header.
 * Node, Bun, and Deno expose their engine version cheaply and synchronously;
 * browsers do not (userAgent is already forwarded as `User-Agent`), and React
 * Native's JS-engine version is not reachable from `src/` without a
 * platform-specific import.
 *
 * Shape examples:
 *   - "node/22.12.0"
 *   - "bun/1.1.38"
 *   - "deno/2.1.4"
 *   - "browser" | "react-native" | "unknown" (no version suffix)
 *
 * @internal
 */
export function getRuntimePlatformTag(): string {
  const platform = getRuntimePlatform();
  try {
    const g = globalThis as any;
    switch (platform) {
      case "node": {
        const v = g.process?.versions?.node;
        return v ? `node/${v}` : "node";
      }
      case "bun": {
        const v = g.Bun?.version ?? g.process?.versions?.bun;
        return v ? `bun/${v}` : "bun";
      }
      case "deno": {
        const v = g.Deno?.version?.deno;
        return v ? `deno/${v}` : "deno";
      }
      default:
        return platform;
    }
  } catch {
    return platform;
  }
}
