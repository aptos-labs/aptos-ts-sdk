// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import initWasm, {
  create_kangaroo,
  type WASMKangaroo as _WASMKangaroo,
} from "@distributedlab/aptos-wasm-bindings/pollard-kangaroo";

const POLLARD_KANGAROO_WASM_URL =
  "https://unpkg.com/@distributedlab/aptos-wasm-bindings/pollard-kangaroo/aptos_pollard_kangaroo_wasm_bg.wasm";

export type WASMKangaroo = _WASMKangaroo;

export async function createKangaroo(
  tableMap: {
    file_name: string;
    s: string[];
    slog: string[];
    table: {
      point: string;
      value: string;
    }[];
  },
  n: bigint,
  w: bigint,
  r: bigint,
  bits: number,
) {
  await initWasm({ module_or_path: POLLARD_KANGAROO_WASM_URL });

  return create_kangaroo(tableMap, n, w, r, bits);
}
