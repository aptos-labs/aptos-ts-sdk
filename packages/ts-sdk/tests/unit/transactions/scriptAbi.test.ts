// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { MoveAbility, TypeTagAddress, TypeTagStruct, TypeTagU64, parseScriptAbi } from "../../../src/index.js";

const COIN_TRANSFER_SCRIPT =
  "a11ceb0b060000000701000202020603080c04140405181a07321b084d2000000001040100010002030101000003040501000002010203060c0305010b0001090001090002060c0302050b000109000004636f696e04436f696e087769746864726177076465706f736974000000000000000000000000000000000000000000000000000000000000000101000001080b000b0138000c030b020b03380102";

function uleb(value: number): number[] {
  const bytes: number[] = [];
  let remaining = value;
  do {
    let byte = remaining % 128;
    remaining = Math.floor(remaining / 128);
    if (remaining > 0) byte |= 0x80;
    bytes.push(byte);
  } while (remaining > 0);
  return bytes;
}

function minimalScript(signatureTable: number[], mainSignature = 0, abilities: number[] = []): Uint8Array {
  return new Uint8Array([
    0xa1,
    0x1c,
    0xeb,
    0x0b,
    6,
    0,
    0,
    0,
    1,
    5,
    0,
    ...uleb(signatureTable.length),
    ...signatureTable,
    ...uleb(abilities.length),
    ...abilities.flatMap(uleb),
    ...uleb(mainSignature),
    0,
    1,
    2,
  ]);
}

function structScript(): Uint8Array {
  const identifiers = [1, "m".charCodeAt(0), 1, "S".charCodeAt(0)];
  const tables = [
    { kind: 1, bytes: [0, 0] },
    { kind: 2, bytes: [0, 1, 0, 0] },
    { kind: 5, bytes: [1, 8, 0] },
    { kind: 7, bytes: identifiers },
    { kind: 8, bytes: [...new Uint8Array(31), 1] },
  ];
  let offset = 0;
  const headers = tables.flatMap(({ kind, bytes }) => {
    const header = [kind, ...uleb(offset), ...uleb(bytes.length)];
    offset += bytes.length;
    return header;
  });
  return new Uint8Array([
    0xa1,
    0x1c,
    0xeb,
    0x0b,
    6,
    0,
    0,
    0,
    ...uleb(tables.length),
    ...headers,
    ...tables.flatMap(({ bytes }) => bytes),
    0,
    0,
    0,
    1,
    2,
  ]);
}

describe("parseScriptAbi", () => {
  it("extracts signer, generic, and caller parameter types from a real script", () => {
    const abi = parseScriptAbi(COIN_TRANSFER_SCRIPT);
    expect(abi.signers).toBe(1);
    expect(abi.typeParameters).toEqual([{ constraints: [] }]);
    expect(abi.parameters).toEqual([new TypeTagU64(), new TypeTagAddress()]);
  });

  it("resolves struct handles through module, identifier, and address tables", () => {
    const abi = parseScriptAbi(structScript());
    expect(abi.parameters).toHaveLength(1);
    expect(abi.parameters[0]).toBeInstanceOf(TypeTagStruct);
    expect(abi.parameters[0].toString()).toBe("0x1::m::S");
  });

  it("maps generic ability bits", () => {
    const abi = parseScriptAbi(minimalScript([0], 0, [15]));
    expect(abi.typeParameters[0].constraints).toEqual([
      MoveAbility.COPY,
      MoveAbility.DROP,
      MoveAbility.STORE,
      MoveAbility.KEY,
    ]);
  });

  it("rejects malformed and unsupported binaries", () => {
    expect(() => parseScriptAbi("0x00")).toThrow(/Invalid script bytecode.*magic|too short/i);
    expect(() => parseScriptAbi(minimalScript([1, 255]))).toThrow(/signature token/i);

    const unsupported = minimalScript([0]);
    unsupported.set([11, 0, 0, 10], 4);
    expect(() => parseScriptAbi(unsupported)).toThrow(/version 11/i);
  });

  it("rejects invalid table ranges and signature references", () => {
    const invalidRange = minimalScript([0]);
    invalidRange[11] = 100;
    expect(() => parseScriptAbi(invalidRange)).toThrow(/table/i);
    expect(() => parseScriptAbi(minimalScript([0], 1))).toThrow(/signature index/i);
  });
});
