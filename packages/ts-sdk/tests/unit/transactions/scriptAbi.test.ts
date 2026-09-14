// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { MoveAbility, TypeTagAddress, TypeTagStruct, TypeTagU64, parseScriptAbi } from "../../../src/index.js";

const COIN_TRANSFER_SCRIPT =
  "a11ceb0b060000000701000202020603080c04140405181a07321b084d2000000001040100010002030101000003040501000002010203060c0305010b0001090001090002060c0302050b000109000004636f696e04436f696e087769746864726177076465706f736974000000000000000000000000000000000000000000000000000000000000000101000001080b000b0138000c030b020b03380102";
const CURRENT_V10_ABORT_SCRIPT = new Uint8Array([
  0xa1, 0x1c, 0xeb, 0x0b, 10, 0, 0, 10, 1, 5, 0, 1, 0, 0, 0, 1, 0, 1, 0x68,
]);

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

function versionBytes(version: number): number[] {
  const encoded = version >= 7 ? 0x0a000000 | version : version;
  return [encoded & 0xff, (encoded >>> 8) & 0xff, (encoded >>> 16) & 0xff, (encoded >>> 24) & 0xff];
}

function minimalScript(
  signatureTable: number[],
  mainSignature = 0,
  abilities: number[] = [],
  version = 6,
  accessSpecifiers: number[] = [],
): Uint8Array {
  return new Uint8Array([
    0xa1,
    0x1c,
    0xeb,
    0x0b,
    ...versionBytes(version),
    1,
    5,
    0,
    ...uleb(signatureTable.length),
    ...signatureTable,
    ...uleb(abilities.length),
    ...abilities.flatMap(uleb),
    ...uleb(mainSignature),
    ...(version >= 8 ? [accessSpecifiers.length === 0 ? 1 : 2, ...accessSpecifiers] : []),
    0,
    1,
    2,
  ]);
}

function identifierScript(identifier: string, version: number): Uint8Array {
  const identifierBytes = Array.from(new TextEncoder().encode(identifier));
  const tables = [
    { kind: 5, bytes: [0] },
    { kind: 7, bytes: [...uleb(identifierBytes.length), ...identifierBytes] },
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
    ...versionBytes(version),
    ...uleb(tables.length),
    ...headers,
    ...tables.flatMap(({ bytes }) => bytes),
    0,
    0,
    ...(version >= 8 ? [1] : []),
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

  it("consumes a current v10 script fixture", () => {
    expect(parseScriptAbi(CURRENT_V10_ABORT_SCRIPT)).toEqual({
      signers: 0,
      typeParameters: [],
      parameters: [],
    });
  });

  it("consumes v8 access specifiers before the code unit", () => {
    const readAnyResourceAtAnyAddress = [1, 1, 1, 1, 1];
    expect(parseScriptAbi(minimalScript([0], 0, [], 8, readAnyResourceAtAnyAddress))).toEqual({
      signers: 0,
      typeParameters: [],
      parameters: [],
    });
  });

  it("rejects truncated and trailing script bodies", () => {
    const complete = minimalScript([0]);
    expect(() => parseScriptAbi(complete.slice(0, -1))).toThrow(/Invalid script bytecode.*end of input/i);
    expect(() => parseScriptAbi(new Uint8Array([...complete, 0xff]))).toThrow(/Invalid script bytecode.*trailing/i);
  });

  it("validates references in every signature while permitting function tokens", () => {
    expect(() => parseScriptAbi(minimalScript([0, 1, 8, 0]))).toThrow(/struct handle index 0/i);
    expect(parseScriptAbi(minimalScript([0, 1, 0x10, 0, 0, 0], 0, [], 8))).toEqual({
      signers: 0,
      typeParameters: [],
      parameters: [],
    });
  });

  it("validates Move identifiers with versioned compiler-internal forms", () => {
    expect(parseScriptAbi(identifierScript("<SELF>_12", 8)).parameters).toEqual([]);
    expect(parseScriptAbi(identifierScript("$compiler", 9)).parameters).toEqual([]);
    expect(() => parseScriptAbi(identifierScript("$compiler", 8))).toThrow(/\$.*version 8/i);
    expect(() => parseScriptAbi(identifierScript("bad-name", 9))).toThrow(/invalid identifier/i);
    expect(() => parseScriptAbi(identifierScript("_", 9))).toThrow(/invalid identifier/i);
  });

  it("rejects malformed and unsupported binaries", () => {
    expect(() => parseScriptAbi("0x00")).toThrow(/Invalid script bytecode.*magic|too short/i);
    expect(() => parseScriptAbi(minimalScript([1, 255]))).toThrow(/signature token/i);

    const unsupported = minimalScript([0]);
    unsupported.set(versionBytes(11), 4);
    expect(() => parseScriptAbi(unsupported)).toThrow(/version 11/i);
  });

  it("rejects invalid table ranges and signature references", () => {
    const invalidRange = minimalScript([0]);
    invalidRange[11] = 100;
    expect(() => parseScriptAbi(invalidRange)).toThrow(/table/i);
    expect(() => parseScriptAbi(minimalScript([0], 1))).toThrow(/signature index/i);
  });
});
