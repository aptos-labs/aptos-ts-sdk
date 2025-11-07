import type { LocalNode } from "@aptos-labs/ts-sdk/cli";

declare global {
  // eslint-disable-next-line no-var
  var __LOCAL_NODE__: LocalNode | undefined;
}

export {};
