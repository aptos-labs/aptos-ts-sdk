// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { TwistedEd25519PrivateKey } from "../../src/index.js";

describe("TwistedEd25519PrivateKey.clear", () => {
  it("zeros the underlying byte buffer", () => {
    const key = TwistedEd25519PrivateKey.generate();
    const bytes = key.toUint8Array();
    expect(bytes.some((b) => b !== 0)).toBe(true);
    key.clear();
    // The same Uint8Array reference is now zeroed in place — toUint8Array
    // returns the backing buffer of the Hex wrapper.
    expect(bytes.every((b) => b === 0)).toBe(true);
  });

  it("isCleared() flips from false to true", () => {
    const key = TwistedEd25519PrivateKey.generate();
    expect(key.isCleared()).toBe(false);
    key.clear();
    expect(key.isCleared()).toBe(true);
  });

  it("clear() is idempotent", () => {
    const key = TwistedEd25519PrivateKey.generate();
    key.clear();
    expect(() => key.clear()).not.toThrow();
    expect(key.isCleared()).toBe(true);
  });

  it.each([
    ["publicKey", (k: TwistedEd25519PrivateKey) => k.publicKey()],
    ["toUint8Array", (k: TwistedEd25519PrivateKey) => k.toUint8Array()],
    ["toString", (k: TwistedEd25519PrivateKey) => k.toString()],
    ["toStringWithoutPrefix", (k: TwistedEd25519PrivateKey) => k.toStringWithoutPrefix()],
  ])("rejects %s() after clear()", (_label, op) => {
    const key = TwistedEd25519PrivateKey.generate();
    key.clear();
    expect(() => op(key)).toThrow(/cleared from memory/);
  });

  it("normal operations work before clear()", () => {
    const key = TwistedEd25519PrivateKey.generate();
    expect(() => key.publicKey()).not.toThrow();
    expect(() => key.toUint8Array()).not.toThrow();
    expect(() => key.toString()).not.toThrow();
  });
});
