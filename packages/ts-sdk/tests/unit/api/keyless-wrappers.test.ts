// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { Keyless } from "../../../src/api/keyless.js";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { EPHEMERAL_KEY_PAIR, keylessTestObject } from "../helper.js";
import { AccountAddress } from "../../../src/core/index.js";

vi.mock("../../../src/internal/keyless.js", () => ({
  getPepper: vi.fn(),
  getPepperBase: vi.fn(),
  getProof: vi.fn(),
  deriveKeylessAccount: vi.fn(),
  updateFederatedKeylessJwkSetTransaction: vi.fn(),
}));

import {
  deriveKeylessAccount,
  getPepper,
  getPepperBase,
  getProof,
  updateFederatedKeylessJwkSetTransaction,
} from "../../../src/internal/keyless.js";

const mocks = {
  getPepper: getPepper as MockedFunction<typeof getPepper>,
  getPepperBase: getPepperBase as MockedFunction<typeof getPepperBase>,
  getProof: getProof as MockedFunction<typeof getProof>,
  deriveKeylessAccount: deriveKeylessAccount as MockedFunction<typeof deriveKeylessAccount>,
  updateFederatedKeylessJwkSetTransaction: updateFederatedKeylessJwkSetTransaction as MockedFunction<
    typeof updateFederatedKeylessJwkSetTransaction
  >,
};

describe("api/Keyless wrappers", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const keyless = new Keyless(config);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPepper forwards jwt and ephemeral key pair to the internal implementation", async () => {
    const pepper = new Uint8Array(31).fill(3);
    mocks.getPepper.mockResolvedValue(pepper);

    const result = await keyless.getPepper({
      jwt: keylessTestObject.JWT,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
      derivationPath: "m/44'/637'/0'/0'/0'",
    });

    expect(result).toBe(pepper);
    expect(mocks.getPepper).toHaveBeenCalledWith({
      aptosConfig: config,
      jwt: keylessTestObject.JWT,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
      derivationPath: "m/44'/637'/0'/0'/0'",
    });
  });

  it("getPepperBase forwards to the internal signature endpoint wrapper", async () => {
    const pepperBase = new Uint8Array(48).fill(4);
    mocks.getPepperBase.mockResolvedValue(pepperBase);

    const result = await keyless.getPepperBase({
      jwt: keylessTestObject.JWT,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
      uidKey: "email",
    });

    expect(result).toBe(pepperBase);
    expect(mocks.getPepperBase).toHaveBeenCalledWith({
      aptosConfig: config,
      jwt: keylessTestObject.JWT,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
      uidKey: "email",
    });
  });

  it("getProof forwards pepper and uidKey to the internal prover wrapper", async () => {
    mocks.getProof.mockResolvedValue(keylessTestObject.proof);

    const proof = await keyless.getProof({
      jwt: keylessTestObject.JWT,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
      pepper: keylessTestObject.pepper,
      uidKey: "sub",
    });

    expect(proof).toBe(keylessTestObject.proof);
    expect(mocks.getProof).toHaveBeenCalledWith({
      aptosConfig: config,
      jwt: keylessTestObject.JWT,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
      pepper: keylessTestObject.pepper,
      uidKey: "sub",
    });
  });

  it("deriveKeylessAccount forwards optional jwkAddress for federated accounts", async () => {
    const account = { accountAddress: AccountAddress.ONE } as never;
    mocks.deriveKeylessAccount.mockResolvedValue(account);
    const jwkAddress = AccountAddress.from("0x000000000000000000000000000000000000000000000000000000000000face");

    const result = await keyless.deriveKeylessAccount({
      jwt: keylessTestObject.JWT,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
      pepper: keylessTestObject.pepper,
      jwkAddress,
    });

    expect(result).toBe(account);
    expect(mocks.deriveKeylessAccount).toHaveBeenCalledWith({
      aptosConfig: config,
      jwt: keylessTestObject.JWT,
      ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
      pepper: keylessTestObject.pepper,
      jwkAddress,
    });
  });

  it("updateFederatedKeylessJwkSetTransaction forwards sender and issuer", async () => {
    const txn = { rawTransaction: {} } as never;
    mocks.updateFederatedKeylessJwkSetTransaction.mockResolvedValue(txn);
    const sender = { accountAddress: AccountAddress.ONE } as never;

    const result = await keyless.updateFederatedKeylessJwkSetTransaction({
      sender,
      iss: keylessTestObject.iss,
      jwksUrl: "https://issuer.example/.well-known/jwks.json",
    });

    expect(result).toBe(txn);
    expect(mocks.updateFederatedKeylessJwkSetTransaction).toHaveBeenCalledWith({
      aptosConfig: config,
      sender,
      iss: keylessTestObject.iss,
      jwksUrl: "https://issuer.example/.well-known/jwks.json",
    });
  });
});
