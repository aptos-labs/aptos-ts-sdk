// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { bigIntToBytesLE, bytesToBigIntLE, hashStrToField, poseidonHash } from "../../src/core/crypto/poseidon";

describe("Poseidon", () => {
  it("should hash correctly", () => {
    const input = [[1, 2], [1]];
    const expected = [
      BigInt("7853200120776062878684798364095072458815029376092732009249414926327459813530"),
      BigInt("18586133768512220936620570745912940619677854269274689475585506675881198879027"),
    ];
    for (let i = 0; i < input.length; i += 1) {
      expect(poseidonHash(input[i])).toEqual(expected[i]);
    }
  });
  it("should hash strings correctly", () => {
    const input = ["hello", "google"];
    const expected = [
      BigInt("19131502131677697582824316262023599653223229634739282128274922348992854400539"),
      BigInt("10420754430899002178577798392930147671924237248238291825718956074978332229675"),
    ];
    for (let i = 0; i < input.length; i += 1) {
      expect(hashStrToField(input[i], 31)).toEqual(expected[i]);
    }
  });
  it("should convert bigint to array and back correctly", () => {
    const input = [BigInt(123), BigInt(321)];
    for (let i = 0; i < input.length; i += 1) {
      expect(input[i]).toEqual( bytesToBigIntLE(bigIntToBytesLE(input[i], 31)));
    }
  });
});
