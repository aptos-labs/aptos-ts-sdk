// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, Ed25519PrivateKey, Serializer, generateSigningMessageForTransaction } from "../../src";
import { AptsoDomainSeparator, CryptoHashable } from "../../src/core/crypto/cryptoHasher";
import { getAptosClient } from "../e2e/helper";
import { ed25519 } from "./helper";

const { aptos } = getAptosClient();
const TRANSFER_AMOUNT = 100;

describe("generateSigningMessage ", () => {
  const alice = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(ed25519.privateKey),
  });

  test("generates the proper message for transaction", async () => {
    const transaction = await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [alice.accountAddress, TRANSFER_AMOUNT],
      },
      options: {
        accountSequenceNumber: 1,
        expireTimestamp: 100,
      },
    });
    const signingMessage = generateSigningMessageForTransaction(transaction);
    expect(signingMessage).toEqual(
      new Uint8Array([
        181, 233, 125, 176, 127, 160, 189, 14, 85, 152, 170, 54, 67, 169, 188, 111, 102, 147, 189, 220, 26, 159, 236,
        158, 103, 74, 70, 30, 170, 0, 177, 147, 151, 140, 33, 57, 144, 196, 131, 61, 247, 21, 72, 223, 124, 228, 157,
        84, 199, 89, 214, 182, 217, 50, 222, 34, 178, 77, 86, 6, 11, 122, 242, 170, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 13, 97, 112, 116, 111,
        115, 95, 97, 99, 99, 111, 117, 110, 116, 8, 116, 114, 97, 110, 115, 102, 101, 114, 0, 2, 32, 151, 140, 33, 57,
        144, 196, 131, 61, 247, 21, 72, 223, 124, 228, 157, 84, 199, 89, 214, 182, 217, 50, 222, 34, 178, 77, 86, 6, 11,
        122, 242, 170, 8, 100, 0, 0, 0, 0, 0, 0, 0, 64, 13, 3, 0, 0, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 100, 0, 0, 0, 0,
        0, 0, 0, 4,
      ]),
    );
  });

  test("generates the proper message for fee payer transaction", async () => {
    const transaction = await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      withFeePayer: true,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [alice.accountAddress, TRANSFER_AMOUNT],
      },
      options: {
        accountSequenceNumber: 1,
        expireTimestamp: 100,
      },
    });
    const signingMessage = generateSigningMessageForTransaction(transaction);
    expect(signingMessage).toEqual(
      new Uint8Array([
        94, 250, 60, 79, 2, 248, 58, 15, 75, 45, 105, 252, 149, 198, 7, 204, 2, 130, 92, 196, 231, 190, 83, 110, 240,
        153, 45, 240, 80, 217, 230, 124, 1, 151, 140, 33, 57, 144, 196, 131, 61, 247, 21, 72, 223, 124, 228, 157, 84,
        199, 89, 214, 182, 217, 50, 222, 34, 178, 77, 86, 6, 11, 122, 242, 170, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 13, 97, 112, 116, 111, 115,
        95, 97, 99, 99, 111, 117, 110, 116, 8, 116, 114, 97, 110, 115, 102, 101, 114, 0, 2, 32, 151, 140, 33, 57, 144,
        196, 131, 61, 247, 21, 72, 223, 124, 228, 157, 84, 199, 89, 214, 182, 217, 50, 222, 34, 178, 77, 86, 6, 11, 122,
        242, 170, 8, 100, 0, 0, 0, 0, 0, 0, 0, 64, 13, 3, 0, 0, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 100, 0, 0, 0, 0, 0,
        0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]),
    );
  });

  test("generates the proper message for serializable", async () => {
    class TestClass extends CryptoHashable {
      domainSeparator: AptsoDomainSeparator;

      data: string;

      constructor() {
        super();
        this.data = "test";
        this.domainSeparator = "APTOS::TestClass";
      }

      serialize(serializer: Serializer): void {
        serializer.serializeStr(this.data);
      }
    }

    const signingMessage = new TestClass().hash();
    expect(signingMessage).toEqual(
      new Uint8Array([
        134, 234, 208, 191, 5, 202, 254, 220, 58, 89, 147, 141, 29, 129, 67, 235, 85, 247, 253, 242, 60, 51, 32, 219,
        33, 228, 237, 43, 170, 195, 204, 116, 4, 116, 101, 115, 116,
      ]),
    );
  });
});
