// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Covers the `AccountUtils` branches that the happy-path round-trip suite in
// `accountSerialization.test.ts` does not reach: `toHexStringWithoutPrefix`
// and the typed `*FromHex` helpers' type-mismatch guards.

import { describe, expect, it } from "vitest";
import { Account } from "../../src/account/Account.js";
import { AccountUtils } from "../../src/account/AccountUtils.js";
import { SigningSchemeInput } from "../../src/types/index.js";

const legacyEd = Account.generate();
const singleEd = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
const secp = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });

describe("AccountUtils.toHexStringWithoutPrefix", () => {
  it("returns the serialized account hex without a 0x prefix", () => {
    const withPrefix = AccountUtils.toHexString(legacyEd);
    const withoutPrefix = AccountUtils.toHexStringWithoutPrefix(legacyEd);
    expect(withPrefix.startsWith("0x")).toBe(true);
    expect(withoutPrefix.startsWith("0x")).toBe(false);
    expect(withPrefix).toBe(`0x${withoutPrefix}`);
  });
});

describe("AccountUtils typed-fromHex guards", () => {
  it("ed25519AccountFromHex rejects a non-Ed25519 account", () => {
    const hex = AccountUtils.toHexString(secp);
    expect(() => AccountUtils.ed25519AccountFromHex(hex)).toThrow("Deserialization of Ed25519Account failed");
  });

  it("singleKeyAccountFromHex rejects a legacy Ed25519 account", () => {
    const hex = AccountUtils.toHexString(legacyEd);
    expect(() => AccountUtils.singleKeyAccountFromHex(hex)).toThrow("Deserialization of SingleKeyAccount failed");
  });

  it("keylessAccountFromHex rejects a SingleKey Ed25519 account", () => {
    const hex = AccountUtils.toHexString(singleEd);
    expect(() => AccountUtils.keylessAccountFromHex(hex)).toThrow("Deserialization of KeylessAccount failed");
  });

  it("federatedKeylessAccountFromHex rejects a Secp256k1 account", () => {
    const hex = AccountUtils.toHexString(secp);
    expect(() => AccountUtils.federatedKeylessAccountFromHex(hex)).toThrow(
      "Deserialization of FederatedKeylessAccount failed",
    );
  });

  it("multiKeyAccountFromHex rejects a single-signer account", () => {
    const hex = AccountUtils.toHexString(legacyEd);
    expect(() => AccountUtils.multiKeyAccountFromHex(hex)).toThrow("Deserialization of MultiKeyAccount failed");
  });

  it("fromBytes round-trips the same way as fromHex", () => {
    const bytes = AccountUtils.toBytes(secp);
    const fromBytes = AccountUtils.fromBytes(bytes);
    expect(AccountUtils.toBytes(fromBytes)).toEqual(bytes);
  });
});
