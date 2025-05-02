// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import initWasm, { create_kangaroo, WASMKangaroo } from "@aptos-labs/confidential-asset-wasm-bindings/pollard-kangaroo";

import { bytesToNumberLE } from "@noble/curves/abstract/utils";
import { ConfidentialAmount, TwistedEd25519PrivateKey, TwistedElGamal, TwistedElGamalCiphertext } from "../../src";

const POLLARD_KANGAROO_WASM_URL =
  'https://unpkg.com/@aptos-labs/confidential-asset-wasm-bindings@0.0.2/pollard-kangaroo/aptos_pollard_kangaroo_wasm_bg.wasm';

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

  const decryptChunk = (pk: Uint8Array, instance: WASMKangaroo) => {
    if (bytesToNumberLE(pk) === 0n) return 0n;

    const result = instance.solve_dlp(pk);

    if (!result) throw new TypeError("Decryption failed");

    return result;
  };

  ConfidentialAmount.setDecryptBalanceFn(
    async (encrypted: TwistedElGamalCiphertext[], privateKey: TwistedEd25519PrivateKey) => {
      const mGs = encrypted.map((el) => TwistedElGamal.calculateCiphertextMG(el, privateKey));

      const olderChunks = mGs.slice(0, 4).map((el) => el.toRawBytes());
      const yongerChunks = mGs.slice(-4).map((el) => el.toRawBytes());

      return Promise.all([
        ...(await olderChunks.map((el) => decryptChunk(el, kangaroo16))),
        ...(await yongerChunks.map((el) => decryptChunk(el, kangaroo32))),
      ]);
    },
  );
};
