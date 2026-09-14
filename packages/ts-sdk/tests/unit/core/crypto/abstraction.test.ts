// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { Deserializer, Serializer } from "../../../../src/bcs/index.js";
import { AccountAddress } from "../../../../src/core/accountAddress.js";
import { AuthenticationKey } from "../../../../src/core/authenticationKey.js";
import { AbstractPublicKey, AbstractSignature } from "../../../../src/core/crypto/abstraction.js";

describe("core/crypto/abstraction", () => {
  const address = AccountAddress.from("0x1");
  const signatureBytes = new Uint8Array([1, 2, 3, 4]);

  describe("AbstractSignature", () => {
    it("round-trips through BCS", () => {
      const original = new AbstractSignature(signatureBytes);
      const serializer = new Serializer();
      original.serialize(serializer);

      const restored = AbstractSignature.deserialize(new Deserializer(serializer.toUint8Array()));

      expect(Array.from(restored.value)).toEqual(Array.from(signatureBytes));
    });

    it("accepts hex input", () => {
      const sig = new AbstractSignature("0x01020304");
      expect(Array.from(sig.value)).toEqual([1, 2, 3, 4]);
    });
  });

  describe("AbstractPublicKey", () => {
    it("authKey() is derived from the account address bytes", () => {
      const publicKey = new AbstractPublicKey(address);
      const expected = new AuthenticationKey({ data: address.toUint8Array() });
      expect(publicKey.authKey().toString()).toBe(expected.toString());
    });

    it("verifySignature throws because verification is on-chain only", () => {
      const publicKey = new AbstractPublicKey(address);
      expect(() =>
        publicKey.verifySignature({
          message: new Uint8Array(),
          signature: new AbstractSignature(signatureBytes),
        }),
      ).toThrow("This function is not implemented for AbstractPublicKey.");
    });

    it("verifySignatureAsync throws because verification is on-chain only", async () => {
      const publicKey = new AbstractPublicKey(address);
      await expect(
        publicKey.verifySignatureAsync({
          message: new Uint8Array(),
          signature: new AbstractSignature(signatureBytes),
        }),
      ).rejects.toThrow("This function is not implemented for AbstractPublicKey.");
    });

    it("serialize throws because abstract keys are not serialized standalone", () => {
      const publicKey = new AbstractPublicKey(address);
      expect(() => publicKey.serialize(new Serializer())).toThrow(
        "This function is not implemented for AbstractPublicKey.",
      );
    });
  });
});
