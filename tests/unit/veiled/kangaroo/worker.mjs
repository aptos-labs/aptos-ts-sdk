import * as Comlink from "comlink";
import nodeEndpoint from "comlink/dist/umd/node-adapter";
import { parentPort } from "worker_threads";

if (!parentPort) {
  throw new Error("InvalidWorker");
}

Comlink.expose(
  {
    /**
     *
     * @param {Uint8Array} pk
     * @param {(pk: Uint8Array) => bigint} decryptionFn
     * @returns {Promise<bigint>}
     */
    decrypt: async (pk, decryptionFn) => decryptionFn(pk),
  },
  nodeEndpoint(parentPort),
);
