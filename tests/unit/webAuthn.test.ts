// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { p256 } from "@noble/curves/nist.js";
import { sha256 } from "@noble/hashes/sha2";
import {
  AnySignature,
  Deserializer,
  Hex,
  Secp256r1PrivateKey,
  Secp256r1PublicKey,
  Serializer,
  WebAuthnSignature,
} from "../../src";


describe("WebAuthnSignature", () => {
  it("导入私钥 -> 推导公钥 -> 组合 WebAuthn 摘要 -> 签名并验证", () => {
    // 1) 导入写死的 secp256r1 私钥（AIP-80 格式）
    const privateKey = new Secp256r1PrivateKey(
      "secp256r1-priv-0x1f1e2d3c4b5a69788796a5b4c3d2e1f0a9b8c7d6e5f403122334455667788990",
    );

    // 2) 通过 TS SDK 推导公钥，并与 noble 计算的公钥比对，确保一致
    const pubFromSdk = privateKey.publicKey();
    const pubFromNoble = new Secp256r1PublicKey(
      p256.getPublicKey(Hex.fromHexInput(privateKey.toHexString()).toUint8Array(), false),
    );
    expect(pubFromSdk.toString()).toEqual(pubFromNoble.toString());

    // 3) 使用 Rust 输出中的 authenticatorData 与 clientDataJSON（保持不变）
    const authenticatorData = new Uint8Array([
      73, 150, 13, 229, 136, 14, 140, 104, 116, 52, 23, 15, 100, 118, 96, 91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92, 243, 186, 131,
      29, 151, 99, 29, 0, 0, 0, 0,
    ]);
    const clientDataJSON = new Uint8Array([
      123, 34, 116, 121, 112, 101, 34, 58, 34, 119, 101, 98, 97, 117, 116, 104, 110, 46, 103, 101, 116, 34, 44, 34, 99, 104, 97, 108, 108,
      101, 110, 103, 101, 34, 58, 34, 97, 106, 80, 56, 77, 112, 55, 86, 90, 78, 119, 75, 105, 52, 97, 78, 49, 87, 101, 45, 97, 45, 122, 88,
      108, 111, 70, 75, 86, 101, 72, 70, 53, 54, 100, 70, 97, 85, 106, 120, 72, 66, 85, 34, 44, 34, 111, 114, 105, 103, 105, 110, 34, 58, 34,
      104, 116, 116, 112, 58, 47, 47, 108, 111, 99, 97, 108, 104, 111, 115, 116, 58, 53, 49, 55, 51, 34, 44, 34, 99, 114, 111, 115, 115, 79,
      114, 105, 103, 105, 110, 34, 58, 102, 97, 108, 115, 101, 125,
    ]);

    // 4) 计算 WebAuthn 摘要：sha256(authenticatorData || sha256(clientDataJSON))
    const clientHash = sha256(clientDataJSON);
    const toBeSigned = new Uint8Array(authenticatorData.length + clientHash.length);
    toBeSigned.set(authenticatorData, 0);
    toBeSigned.set(clientHash, authenticatorData.length);
    const webauthnDigest = sha256(toBeSigned);

    // 5) 使用 noble P-256 对摘要签名，得到 64 字节（r||s），并构造 WebAuthnSignature
    const privBytes = Hex.fromHexInput(privateKey.toHexString()).toUint8Array();
    const sig = p256.sign(webauthnDigest, privBytes);
    const signatureBytes = sig.toCompactRawBytes();
    const webSig = new WebAuthnSignature(signatureBytes, authenticatorData, clientDataJSON);

    // 6) BCS 序列化/反序列化回环校验
    const ser = new Serializer();
    webSig.serialize(ser);
    const deser = new Deserializer(ser.toUint8Array());
    const roundtripped = WebAuthnSignature.deserialize(deser);
    expect(roundtripped.toStringWithoutPrefix()).toEqual(webSig.toStringWithoutPrefix());

    // 7) AnySignature 包装回环
    const any = new AnySignature(webSig);
    const anySer = new Serializer();
    any.serialize(anySer);
    const anyDeser = new Deserializer(anySer.toUint8Array());
    const any2 = AnySignature.deserialize(anyDeser);
    expect(any2.toUint8Array()).toEqual(any.toUint8Array());

    // 8) 使用公钥验签（noble），应通过
    const ok = p256.verify(signatureBytes, webauthnDigest, pubFromSdk.toUint8Array());
    expect(ok).toBe(true);

    // 9) 负例：篡改 clientDataJSON，验签应失败
    const tampered = clientDataJSON.slice();
    tampered[0] = tampered[0] ^ 1;
    const cHash2 = sha256(tampered);
    const toBeSigned2 = new Uint8Array(authenticatorData.length + cHash2.length);
    toBeSigned2.set(authenticatorData, 0);
    toBeSigned2.set(cHash2, authenticatorData.length);
    const digest2 = sha256(toBeSigned2);
    expect(p256.verify(signatureBytes, digest2, pubFromSdk.toUint8Array())).toBe(false);
  });
});
