// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Deserializer,
  Ed25519PublicKey,
  Ed25519Signature,
  Hex,
  MultiEd25519PublicKey,
  MultiEd25519Signature,
  Serializer,
} from "../../src";
import { multiEd25519PkTestObject, multiEd25519SigTestObject } from "./helper";

describe("MultiEd25519PublicKey", () => {
  it("should verify the signature correctly", () => {
    const publicKeys = [
      "98e12a20fc5f4de3c9b075399dc5cba113307a1b3a913847932b2374c5fbc2f9",
      "ab2ef6bdaf26dbb9df86640ebe6ca197529e2a53495d6daca8ec6c14eefb3f5d",
      "5224654234c2de966f6c190670cde06ba68f3ce27598a5c9c00d92070934d0ec",
    ].map((pk) => new Ed25519PublicKey(pk));

    const signingMessage = "0xdeadbeef";

    /* eslint-disable max-len */
    const signatures = [
      "10f88e602b0b6b248ad25b64b8071db3c8cfea55f0bad95b1c7815f885358f0fa0d765213c378079dbd5befdf5a1efabc5b48a54c59b90f55dd0e3bc3975eb09",
      "ee818fda2af9528386b08f8489094634ff5e9f61ca5a87702d8d545df0892867e17ec43b06eede4b6bf7039d97165cc1fed147bb4ca8412fe6003279831b9c0a",
      "d94428f514ce5b60ed7849041a485b9fecd8d4d639bfba59364e231a71352122568b3a5d0b701750eb7362f1ef94fb7ce60b0ce4977575f8f6f6927311cc160d",
    ].map((sig) => new Ed25519Signature(sig));
    /* eslint-enable max-len */

    const multiEd25519PublicKey = new MultiEd25519PublicKey({
      publicKeys,
      threshold: 2,
    });

    expect(
      multiEd25519PublicKey.verifySignature({
        message: signingMessage,
        signature: new MultiEd25519Signature({
          signatures: [signatures[0], signatures[1]],
          bitmap: [0, 1],
        }),
      }),
    ).toBeTruthy();

    expect(
      multiEd25519PublicKey.verifySignature({
        message: signingMessage,
        signature: new MultiEd25519Signature({
          signatures: [signatures[1], signatures[2]],
          bitmap: [1, 2],
        }),
      }),
    ).toBeTruthy();

    expect(
      multiEd25519PublicKey.verifySignature({
        message: signingMessage,
        signature: new MultiEd25519Signature({
          signatures: [signatures[0], signatures[2]],
          bitmap: [0, 2],
        }),
      }),
    ).toBeTruthy();

    expect(
      multiEd25519PublicKey.verifySignature({
        message: signingMessage,
        signature: new MultiEd25519Signature({
          signatures: [signatures[0], signatures[1]],
          bitmap: [0, 2],
        }),
      }),
    ).toBeFalsy();
  });

  it("should convert to Uint8Array correctly", async () => {
    const publicKey1 = "b9c6ee1630ef3e711144a648db06bbb2284f7274cfbee53ffcee503cc1a49200";
    const publicKey2 = "aef3f4a4b8eca1dfc343361bf8e436bd42de9259c04b8314eb8e2054dd6e82ab";
    const publicKey3 = "8a5762e21ac1cdb3870442c77b4c3af58c7cedb8779d0270e6d4f1e2f7367d74";

    const multiPubKey = new MultiEd25519PublicKey({
      publicKeys: [
        new Ed25519PublicKey(publicKey1),
        new Ed25519PublicKey(publicKey2),
        new Ed25519PublicKey(publicKey3),
      ],
      threshold: 2,
    });

    const expected = new Uint8Array([
      185, 198, 238, 22, 48, 239, 62, 113, 17, 68, 166, 72, 219, 6, 187, 178, 40, 79, 114, 116, 207, 190, 229, 63, 252,
      238, 80, 60, 193, 164, 146, 0, 174, 243, 244, 164, 184, 236, 161, 223, 195, 67, 54, 27, 248, 228, 54, 189, 66,
      222, 146, 89, 192, 75, 131, 20, 235, 142, 32, 84, 221, 110, 130, 171, 138, 87, 98, 226, 26, 193, 205, 179, 135, 4,
      66, 199, 123, 76, 58, 245, 140, 124, 237, 184, 119, 157, 2, 112, 230, 212, 241, 226, 247, 54, 125, 116, 2,
    ]);
    expect(multiPubKey.toUint8Array()).toEqual(expected);
  });

  it("should serializes to bytes correctly", async () => {
    const edPksArray = [];
    for (let i = 0; i < multiEd25519PkTestObject.public_keys.length; i += 1) {
      edPksArray.push(new Ed25519PublicKey(multiEd25519PkTestObject.public_keys[i]));
    }

    const pubKeyMultiSig = new MultiEd25519PublicKey({
      publicKeys: edPksArray,
      threshold: multiEd25519PkTestObject.threshold,
    });

    expect(Hex.fromHexInput(pubKeyMultiSig.toUint8Array()).toStringWithoutPrefix()).toEqual(
      multiEd25519PkTestObject.bytesInStringWithoutPrefix,
    );
  });

  it("should deserializes from bytes correctly", async () => {
    const edPksArray = [];
    for (let i = 0; i < multiEd25519PkTestObject.public_keys.length; i += 1) {
      edPksArray.push(new Ed25519PublicKey(multiEd25519PkTestObject.public_keys[i]));
    }

    const pubKeyMultiSig = new MultiEd25519PublicKey({
      publicKeys: edPksArray,
      threshold: multiEd25519PkTestObject.threshold,
    });

    const serializer = new Serializer();
    serializer.serialize(pubKeyMultiSig);
    const deserialzed = MultiEd25519PublicKey.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(new Hex(deserialzed.toUint8Array())).toEqual(new Hex(pubKeyMultiSig.toUint8Array()));
  });
});

describe("MultiEd25519Signature", () => {
  it("should serializes to bytes correctly", async () => {
    const edSigsArray = [];
    for (let i = 0; i < multiEd25519SigTestObject.signatures.length; i += 1) {
      edSigsArray.push(new Ed25519Signature(Hex.fromHexString(multiEd25519SigTestObject.signatures[i]).toUint8Array()));
    }

    const multisig = new MultiEd25519Signature({
      signatures: edSigsArray,
      bitmap: Hex.fromHexString(multiEd25519SigTestObject.bitmap).toUint8Array(),
    });

    expect(Hex.fromHexInput(multisig.toUint8Array()).toStringWithoutPrefix()).toEqual(
      multiEd25519SigTestObject.bytesInStringWithoutPrefix,
    );
  });

  it("should deserializes from bytes correctly", async () => {
    const edSigsArray = [];
    for (let i = 0; i < multiEd25519SigTestObject.signatures.length; i += 1) {
      edSigsArray.push(new Ed25519Signature(Hex.fromHexString(multiEd25519SigTestObject.signatures[i]).toUint8Array()));
    }

    const multisig = new MultiEd25519Signature({
      signatures: edSigsArray,
      bitmap: Hex.fromHexString(multiEd25519SigTestObject.bitmap).toUint8Array(),
    });

    const serializer = new Serializer();
    serializer.serialize(multisig);
    const deserialized = MultiEd25519Signature.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(Hex.fromHexInput(deserialized.toUint8Array())).toEqual(Hex.fromHexInput(multisig.toUint8Array()));
  });

  it("should creates a valid bitmap", () => {
    expect(MultiEd25519Signature.createBitmap({ bits: [0, 2, 31] })).toEqual(
      new Uint8Array([0b10100000, 0b00000000, 0b00000000, 0b00000001]),
    );
  });

  it("should throws exception when creating a bitmap with wrong bits", async () => {
    expect(() => {
      MultiEd25519Signature.createBitmap({ bits: [32] });
    }).toThrow("Cannot have a signature larger than 31.");
  });

  it("should throws exception when creating a bitmap with duplicate bits", async () => {
    expect(() => {
      MultiEd25519Signature.createBitmap({ bits: [2, 2] });
    }).toThrow("Duplicate bits detected.");
  });
});
