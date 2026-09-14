// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { isKeylessSigner } from "../../../src/account/keylessSigner.js";
import { Account } from "../../../src/account/Account.js";

describe("account/keylessSigner.isKeylessSigner", () => {
  it("returns true for objects exposing both keyless methods", () => {
    const signer = {
      ...Account.generate(),
      checkKeylessAccountValidity: async () => {},
      waitForProofFetch: async () => {},
    };

    expect(isKeylessSigner(signer)).toBe(true);
  });

  it("returns false for a plain Account", () => {
    expect(isKeylessSigner(Account.generate())).toBe(false);
  });

  it("returns false for null, undefined, and partial shapes", () => {
    expect(isKeylessSigner(null)).toBe(false);
    expect(isKeylessSigner(undefined)).toBe(false);
    expect(
      isKeylessSigner({
        checkKeylessAccountValidity: async () => {},
      }),
    ).toBe(false);
    expect(
      isKeylessSigner({
        waitForProofFetch: async () => {},
      }),
    ).toBe(false);
  });
});
