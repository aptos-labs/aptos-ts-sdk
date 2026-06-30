// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Covers the MultiKey verification + lookup branches not exercised by
// `multiKey.test.ts`: `getIndex` (hit + miss), `verifySignature`
// (success / count-mismatch throw / sub-signature failure), and
// `verifySignatureAsync` (success / non-MultiKeySignature handling with and
// without throwErrorWithReason).

import { describe, expect, it } from "vitest";
import { Account } from "../../src/account/Account.js";
import { MultiKeyAccount } from "../../src/account/MultiKeyAccount.js";
import { MultiKey } from "../../src/core/crypto/multiKey.js";
import { Ed25519Signature } from "../../src/core/crypto/ed25519.js";
import { AptosConfig } from "../../src/api/aptosConfig.js";
import { Network } from "../../src/utils/apiEndpoints.js";

const config = new AptosConfig({ network: Network.LOCAL });
const MESSAGE = "deadbeef00";

function build() {
  const signer1 = Account.generate();
  const signer2 = Account.generate();
  const signer3 = Account.generate();
  const publicKeys = [signer1.publicKey, signer2.publicKey, signer3.publicKey];
  const multiKey = new MultiKey({ publicKeys, signaturesRequired: 2 });
  const account = MultiKeyAccount.fromPublicKeysAndSigners({
    publicKeys,
    signaturesRequired: 2,
    signers: [signer1, signer2],
  });
  return { signer1, signer2, signer3, multiKey, account };
}

describe("MultiKey.getIndex", () => {
  it("returns the index of a contained public key", () => {
    const { signer1, signer2, multiKey } = build();
    expect(multiKey.getIndex(signer1.publicKey)).toBe(0);
    expect(multiKey.getIndex(signer2.publicKey)).toBe(1);
  });

  it("throws when the public key is not in the set", () => {
    const { multiKey } = build();
    const stranger = Account.generate();
    expect(() => multiKey.getIndex(stranger.publicKey)).toThrow(/not found in multi key set/);
  });
});

describe("MultiKey.verifySignature", () => {
  it("returns true for a valid 2-of-3 signature", () => {
    const { account, multiKey } = build();
    const signature = account.sign(MESSAGE);
    expect(multiKey.verifySignature({ message: MESSAGE, signature })).toBe(true);
  });

  it("throws when the signature count does not match signaturesRequired", () => {
    const { account, multiKey } = build();
    const signature = account.sign(MESSAGE);
    const stricter = new MultiKey({ publicKeys: multiKey.publicKeys, signaturesRequired: 3 });
    expect(() => stricter.verifySignature({ message: MESSAGE, signature })).toThrow(
      "The number of signatures does not match the number of required signatures",
    );
  });

  it("returns false when a sub-signature does not match the message", () => {
    const { account, multiKey } = build();
    const signature = account.sign(MESSAGE);
    expect(multiKey.verifySignature({ message: "0badc0de00", signature })).toBe(false);
  });
});

describe("MultiKey.verifySignatureAsync", () => {
  it("verifies a valid signature asynchronously", async () => {
    const { account, multiKey } = build();
    const signature = account.sign(MESSAGE);
    await expect(multiKey.verifySignatureAsync({ aptosConfig: config, message: MESSAGE, signature })).resolves.toBe(
      true,
    );
  });

  it("returns false for a non-MultiKeySignature (and rethrows with throwErrorWithReason)", async () => {
    const { multiKey } = build();
    const wrongSignature = new Ed25519Signature(new Uint8Array(64));

    await expect(
      multiKey.verifySignatureAsync({ aptosConfig: config, message: MESSAGE, signature: wrongSignature }),
    ).resolves.toBe(false);

    await expect(
      multiKey.verifySignatureAsync({
        aptosConfig: config,
        message: MESSAGE,
        signature: wrongSignature,
        options: { throwErrorWithReason: true },
      }),
    ).rejects.toThrow("Signature is not a MultiKeySignature");
  });
});
