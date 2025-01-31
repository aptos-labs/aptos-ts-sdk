// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import initWasm, { create_kangaroo } from "@distributedlab/aptos-wasm-bindings/pollard-kangaroo";

import { bytesToNumberLE } from "@noble/curves/abstract/utils";
import { TwistedElGamal } from "../../../../src";

const POLLARD_KANGAROO_WASM_URL =
  "https://unpkg.com/@distributedlab/aptos-wasm-bindings/pollard-kangaroo/aptos_pollard_kangaroo_wasm_bg.wasm";

export async function createKangaroo(secret_size: number) {
  await initWasm({ module_or_path: POLLARD_KANGAROO_WASM_URL });

  return create_kangaroo(secret_size);
}

export const preloadTables = async () => {
  const kangaroo16 = await createKangaroo(16);
  const kangaroo32 = await createKangaroo(32);
  const kangaroo48 = await createKangaroo(48);

  TwistedElGamal.setDecryptionFn(async (pk) => {
    if (bytesToNumberLE(pk) === 0n) return 0n;

    let result = kangaroo16.solve_dlp(pk, 30n);

    if (!result) {
      result = kangaroo32.solve_dlp(pk, 120n);
    }

    if (!result) {
      result = kangaroo48.solve_dlp(pk);
    }

    if (!result) throw new TypeError("Decryption failed");

    return result;
  });
};

export const preloadTablesForBalances = async () => {
  const kangaroo16 = await createKangaroo(16);
  const kangaroo32 = await createKangaroo(32);

  TwistedElGamal.setDecryptionFn(async (pk) => {
    if (bytesToNumberLE(pk) === 0n) return 0n;

    let result = kangaroo16.solve_dlp(pk, 30n);

    if (!result) {
      result = kangaroo32.solve_dlp(pk);
    }

    if (!result) throw new TypeError("Decryption failed");

    return result;
  });
};
