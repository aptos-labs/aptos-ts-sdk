// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { Ed25519PrivateKey } from "../../../../src/core/crypto/ed25519.js";
import { Secp256k1PrivateKey } from "../../../../src/core/crypto/secp256k1.js";
import { MultiEd25519PublicKey } from "../../../../src/core/crypto/multiEd25519.js";
import { MultiKey } from "../../../../src/core/crypto/multiKey.js";
import { AnyPublicKey } from "../../../../src/core/crypto/singleKey.js";
import {
  accountPublicKeyToBaseAccountPublicKey,
  accountPublicKeyToSigningScheme,
  convertSigningMessage,
} from "../../../../src/core/crypto/utils.js";
import { SigningScheme } from "../../../../src/types/index.js";

const ED_PK = new Ed25519PrivateKey(new Uint8Array(32).fill(7)).publicKey();
const ED_PK_B = new Ed25519PrivateKey(new Uint8Array(32).fill(8)).publicKey();
const SECP_PK = new Secp256k1PrivateKey(new Uint8Array(32).fill(1)).publicKey();

describe("convertSigningMessage", () => {
  it("returns a Uint8Array message as-is", () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    expect(convertSigningMessage(bytes)).toBe(bytes);
  });

  it("returns a valid hex string as-is (interpreted as bytes downstream)", () => {
    // Valid hex (even length, hex chars) — preserved as-is.
    expect(convertSigningMessage("0xcafe")).toBe("0xcafe");
    expect(convertSigningMessage("cafe")).toBe("cafe");
  });

  it("encodes an invalid-hex string as its UTF-8 byte form", () => {
    // "hello" has odd length / non-hex chars → not valid hex → encoded as UTF-8.
    const out = convertSigningMessage("hello");
    expect(out).toBeInstanceOf(Uint8Array);
    expect(Array.from(out as Uint8Array)).toEqual([0x68, 0x65, 0x6c, 0x6c, 0x6f]);
  });

  it("encodes the empty string as zero-length UTF-8 bytes", () => {
    // Hex.isValid("") is not considered valid hex, so this falls through to
    // the TextEncoder path and produces an empty Uint8Array.
    const out = convertSigningMessage("");
    expect(out).toBeInstanceOf(Uint8Array);
    expect((out as Uint8Array).length).toBe(0);
  });

  it("encodes a multi-byte UTF-8 string as its byte form", () => {
    // Non-ASCII characters are not valid hex.
    const out = convertSigningMessage("héllo");
    expect(out).toBeInstanceOf(Uint8Array);
    // "héllo" = 0x68 0xC3 0xA9 0x6C 0x6C 0x6F
    expect(Array.from(out as Uint8Array)).toEqual([0x68, 0xc3, 0xa9, 0x6c, 0x6c, 0x6f]);
  });
});

describe("accountPublicKeyToBaseAccountPublicKey", () => {
  it("returns an Ed25519PublicKey directly", () => {
    expect(accountPublicKeyToBaseAccountPublicKey(ED_PK)).toBe(ED_PK);
  });

  it("returns a MultiEd25519PublicKey directly", () => {
    const multi = new MultiEd25519PublicKey({ publicKeys: [ED_PK, ED_PK_B], threshold: 1 });
    expect(accountPublicKeyToBaseAccountPublicKey(multi)).toBe(multi);
  });

  it("returns a MultiKey directly", () => {
    const multi = new MultiKey({
      publicKeys: [new AnyPublicKey(ED_PK), new AnyPublicKey(SECP_PK)],
      signaturesRequired: 1,
    });
    expect(accountPublicKeyToBaseAccountPublicKey(multi)).toBe(multi);
  });

  it("returns an AnyPublicKey directly", () => {
    const any = new AnyPublicKey(ED_PK);
    expect(accountPublicKeyToBaseAccountPublicKey(any)).toBe(any);
  });
});

describe("accountPublicKeyToSigningScheme", () => {
  it("maps Ed25519PublicKey to SigningScheme.Ed25519", () => {
    expect(accountPublicKeyToSigningScheme(ED_PK)).toBe(SigningScheme.Ed25519);
  });

  it("maps AnyPublicKey to SigningScheme.SingleKey", () => {
    expect(accountPublicKeyToSigningScheme(new AnyPublicKey(ED_PK))).toBe(SigningScheme.SingleKey);
  });

  it("maps MultiEd25519PublicKey to SigningScheme.MultiEd25519", () => {
    const multi = new MultiEd25519PublicKey({ publicKeys: [ED_PK, ED_PK_B], threshold: 1 });
    expect(accountPublicKeyToSigningScheme(multi)).toBe(SigningScheme.MultiEd25519);
  });

  it("maps MultiKey to SigningScheme.MultiKey", () => {
    const multi = new MultiKey({
      publicKeys: [new AnyPublicKey(ED_PK), new AnyPublicKey(SECP_PK)],
      signaturesRequired: 1,
    });
    expect(accountPublicKeyToSigningScheme(multi)).toBe(SigningScheme.MultiKey);
  });
});
