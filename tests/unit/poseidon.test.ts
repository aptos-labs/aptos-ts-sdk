// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { poseidonHash } from "../../src/core/crypto/poseidon";

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
});
