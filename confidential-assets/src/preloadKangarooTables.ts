// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import initWasm, { create_kangaroo } from "@aptos-labs/confidential-asset-wasm-bindings/pollard-kangaroo";

import { bytesToNumberLE } from "@noble/curves/abstract/utils";
import { TwistedElGamal } from "./twistedElGamal";

const POLLARD_KANGAROO_WASM_URL =
  "https://unpkg.com/@aptos-labs/confidential-asset-wasm-bindings@0.0.2/pollard-kangaroo/aptos_pollard_kangaroo_wasm_bg.wasm";

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

    try {
      let result = kangaroo16.solve_dlp(pk, 30n);

      if (!result) {
        result = kangaroo32.solve_dlp(pk, 120n);
      }

      if (!result) {
        result = kangaroo48.solve_dlp(pk, 2000n);
      }

      if (!result) throw new TypeError("Decryption failed");

      return result;
    } catch (e) {
      console.error("Decryption failed", e);
      throw e;
    }
  });
};
