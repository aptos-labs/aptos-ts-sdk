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
  tablesMap: Record<
    string,
    {
      n: bigint;
      w: bigint;
      r: bigint;
      bits: number;
      table: {
        file_name: string;
        s: string[];
        slog: string[];
        table: {
          point: string;
          value: string;
        }[];
      };
      max_attempts: number;
    }
  >,
) {
  await initWasm({ module_or_path: POLLARD_KANGAROO_WASM_URL });

  // bigint to string
  const serializedTablesMap = Object.entries(tablesMap).reduce((acc, [key, value]) => {
    const serializedTable = {
      ...value,
      n: +value.n.toString(),
      w: +value.w.toString(),
      r: +value.r.toString(),
    };
    return { ...acc, [key]: serializedTable };
  }, {});

  return create_kangaroo(JSON.stringify(serializedTablesMap));
}
