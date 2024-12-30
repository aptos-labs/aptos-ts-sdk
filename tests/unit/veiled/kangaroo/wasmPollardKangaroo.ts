// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import initWasm, {
  create_kangaroo,
  type WASMKangaroo as _WASMKangaroo,
} from "@distributedlab/aptos-wasm-bindings/pollard-kangaroo";

import { loadTableMapJSON } from "../helpers";
import { TwistedElGamal } from "../../../../src";

const POLLARD_KANGAROO_WASM_URL =
  "https://unpkg.com/@distributedlab/aptos-wasm-bindings/pollard-kangaroo/aptos_pollard_kangaroo_wasm_bg.wasm";

export type WASMKangaroo = _WASMKangaroo;

type TableMapParams = {
  n: number;
  w: number;
  r: number;
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
};

export async function createKangaroo(tablesMap: Record<string, TableMapParams>) {
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

export let tableMapsParams: Record<number, TableMapParams>;

export let kangaroo: WASMKangaroo;

// function executeDecryption(pk: Uint8Array) {
//   return kangaroo.solve_dlp(pk);
// }
//
// const wrappedDecryptFn = async (pk: Uint8Array): Promise<bigint> => {
//   const worker = new Worker(`${__dirname}/worker.mjs`);
//
//   try {
//     const remoteFn = wrap<{
//       decrypt: (pk: Uint8Array, decryptionFn: (pk: Uint8Array) => bigint) => Promise<bigint>;
//     }>(worker);
//
//     return await remoteFn.decrypt(pk, proxy(executeDecryption));
//   } catch (error) {
//     await worker.terminate();
//     throw error;
//   }
// };

export const preloadTables = async () => {
  const [table16, table32, table48] = await Promise.all([
    loadTableMapJSON(
      "https://raw.githubusercontent.com/distributed-lab/pollard-kangaroo-plus-testing/refs/heads/tables/output_8_8000_16_64.json",
    ),
    loadTableMapJSON(
      "https://raw.githubusercontent.com/distributed-lab/pollard-kangaroo-plus-testing/refs/heads/tables/output_2048_4000_32_128.json",
    ),
    loadTableMapJSON(
      "https://raw.githubusercontent.com/distributed-lab/pollard-kangaroo-plus-testing/refs/heads/tables/output_65536_40000_48_128.json",
    ),
  ]);

  tableMapsParams = {
    16: {
      n: 8000,
      w: 8,
      r: 64,
      bits: 16,
      table: table16,
      max_attempts: 20,
    },
    32: {
      n: 4000,
      w: 2048,
      r: 128,
      bits: 32,
      table: table32,
      max_attempts: 40,
    },
    48: {
      n: 40_000,
      w: 65536,
      r: 128,
      bits: 48,
      table: table48,
      max_attempts: 1000,
    },
  };

  kangaroo = await createKangaroo(tableMapsParams);

  // TwistedElGamal.setDecryptionFn(async (pk) => wrappedDecryptFn(pk));
  TwistedElGamal.setDecryptionFn(async (pk) => kangaroo.solve_dlp(pk));
};
