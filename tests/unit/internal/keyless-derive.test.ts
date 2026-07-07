// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockClient } from "../../helpers/mockClient.js";
import { clearMemoizeCache } from "../../../src/utils/memoize.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { deriveKeylessAccount } from "../../../src/internal/keyless.js";
import { EPHEMERAL_KEY_PAIR, keylessTestObject } from "../helper.js";
import { installKeylessMocks } from "../helpers/keylessMocks.js";
import { KeylessAccount } from "../../../src/account/KeylessAccount.js";
import { FederatedKeylessAccount } from "../../../src/account/FederatedKeylessAccount.js";
import { AccountAddress } from "../../../src/core/index.js";

describe("internal/keyless.deriveKeylessAccount", () => {
  beforeEach(() => clearMemoizeCache());
  afterEach(() => clearMemoizeCache());

  it("derives a KeylessAccount with pepper, proof, and derived address", async () => {
    const mock = createMockClient({ network: Network.LOCAL });
    installKeylessMocks(mock);

    const account = await deriveKeylessAccount({
      aptosConfig: mock.config,
      jwt: keylessTestObject.JWT,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
      pepper: keylessTestObject.pepper,
    });

    expect(account).toBeInstanceOf(KeylessAccount);
    expect(account.accountAddress.toString()).toBe(keylessTestObject.address);
    expect(account.publicKey.toString()).toBe(keylessTestObject.publicKey);
    expect(account.proof).toBeDefined();
    expect(mock.requests.some((r) => r.url?.includes("keyless_account::Configuration"))).toBe(true);
  });

  it("derives a FederatedKeylessAccount when jwkAddress is provided", async () => {
    const mock = createMockClient({ network: Network.LOCAL });
    installKeylessMocks(mock);
    const jwkAddress = AccountAddress.from("0x000000000000000000000000000000000000000000000000000000000000face");

    const account = await deriveKeylessAccount({
      aptosConfig: mock.config,
      jwt: keylessTestObject.JWT,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
      pepper: keylessTestObject.pepper,
      jwkAddress,
    });

    expect(account).toBeInstanceOf(FederatedKeylessAccount);
    expect(account.publicKey.jwkAddress.toString()).toBe(jwkAddress.toString());
    expect(account.publicKey.toString()).not.toBe(keylessTestObject.publicKey);
  });

  it("invokes proofFetchCallback without blocking account creation", async () => {
    const mock = createMockClient({ network: Network.LOCAL });
    installKeylessMocks(mock);
    const statuses: string[] = [];

    const account = await deriveKeylessAccount({
      aptosConfig: mock.config,
      jwt: keylessTestObject.JWT,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
      pepper: keylessTestObject.pepper,
      proofFetchCallback: (status) => statuses.push(status.status),
    });

    expect(account).toBeInstanceOf(KeylessAccount);
    expect(statuses.length).toBeGreaterThan(0);
  });
});
