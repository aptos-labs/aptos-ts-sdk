// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, Ed25519PrivateKey, generateSigningMessageForSerializable, generateSigningMessageForTransaction } from "../../src";
import { getAptosClient } from "../e2e/helper";

const { aptos } = getAptosClient();
const TRANSFER_AMOUNT = 100;

describe("generateSigningMessage ", () => {
  const alice = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey("0x1111111111111111111111111111111111111111111111111111111111111111"),
  });
  const bob = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey("0x2222222222222222222222222222222222222222222222222222222222222222"),
  });

  test("generates the proper message for transaction", async () => {
    const transaction = await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [bob.accountAddress, TRANSFER_AMOUNT],
      },
      options: {
        accountSequenceNumber: 1,
        expireTimestamp: 100
      }
    });
    const signingMessage = generateSigningMessageForTransaction(transaction);
    expect(signingMessage).toEqual(new Uint8Array([
        181, 233, 125, 176, 127, 160, 189,  14,  85, 152, 170,  54,
         67, 169, 188, 111, 102, 147, 189, 220,  26, 159, 236, 158,
        103,  74,  70,  30, 170,   0, 177, 147,  20, 126,  77,  58,
         91,  16, 234, 237,  42, 147,  83, 110,  40,  76,  35,   9,
        109, 252, 234, 154, 198,  31,  10, 132,  32, 229, 208,  31,
        189, 143,  14, 168,   1,   0,   0,   0,   0,   0,   0,   0,
          2,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
          0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
          0,   0,   0,   0,   0,   0,   0,   0,   1,  13,  97, 112,
        116, 111, 115,  95,  97,  99,  99, 111, 117, 110, 116,   8,
        116, 114,  97, 110, 115, 102, 101, 114,   0,   2,  32, 163,
         38,  87, 253,  96, 172, 176,  67,  52, 145, 163,  61, 132,
        130,  60,   4, 114,  42, 231, 102,  57, 178, 114, 135,  60,
        194, 125,   1,  82,  50, 144,  78,   8, 100,   0,   0,   0,
          0,   0,   0,   0,  64,  13,   3,   0,   0,   0,   0,   0,
        100,   0,   0,   0,   0,   0,   0,   0, 100,   0,   0,   0,
          0,   0,   0,   0,   4
      ]));
  });

  test("generates the proper message for fee payer transaction", async () => {
    const transaction = await aptos.transaction.build.simple({
      sender: alice.accountAddress,
      withFeePayer: true,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [bob.accountAddress, TRANSFER_AMOUNT],
      },
      options: {
        accountSequenceNumber: 1,
        expireTimestamp: 100
      }
    });
    const signingMessage = generateSigningMessageForTransaction(transaction);
    expect(signingMessage).toEqual(new Uint8Array([
        94, 250,  60,  79,   2, 248,  58,  15,  75,  45, 105, 252,
       149, 198,   7, 204,   2, 130,  92, 196, 231, 190,  83, 110,
       240, 153,  45, 240,  80, 217, 230, 124,   1,  20, 126,  77,
        58,  91,  16, 234, 237,  42, 147,  83, 110,  40,  76,  35,
         9, 109, 252, 234, 154, 198,  31,  10, 132,  32, 229, 208,
        31, 189, 143,  14, 168,   1,   0,   0,   0,   0,   0,   0,
         0,   2,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
         0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
         0,   0,   0,   0,   0,   0,   0,   0,   0,   1,  13,  97,
       112, 116, 111, 115,  95,  97,  99,  99, 111, 117, 110, 116,
         8, 116, 114,  97, 110, 115, 102, 101, 114,   0,   2,  32,
       163,  38,  87, 253,  96, 172, 176,  67,  52, 145, 163,  61,
       132, 130,  60,   4, 114,  42, 231, 102,  57, 178, 114, 135,
        60, 194, 125,   1,  82,  50, 144,  78,   8, 100,   0,   0,
         0,   0,   0,   0,   0,  64,  13,   3,   0,   0,   0,   0,
         0, 100,   0,   0,   0,   0,   0,   0,   0, 100,   0,   0,
         0,   0,   0,   0,   0,   4,   0,   0,   0,   0,   0,   0,
         0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
         0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
         0,   0,   0
     ]));
  });

  test("generates the proper message for serializable", async () => {
    const signingMessage = generateSigningMessageForSerializable(alice.publicKey);
    expect(signingMessage).toEqual(new Uint8Array([
        35, 174, 146,  91,  32, 167, 212, 247, 186,  43,  31,
       208,  55,  67, 229, 235, 208, 187, 199, 127, 107,  22,
       147,  72, 128, 135, 179, 154, 150,  76,  73,  93,  32,
       208,  74, 178,  50, 116,  43, 180, 171,  58,  19, 104,
       189,  70,  21, 228, 230, 208,  34,  74, 183,  26,   1,
       107, 175, 133,  32, 163,  50, 201, 119, 135,  55
     ]));
  });
});
