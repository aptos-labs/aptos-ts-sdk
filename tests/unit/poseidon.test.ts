// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { poseidonHash } from "../../src/core/crypto/poseidon";

describe("Poseidon", () => {
  it("should hash correctly", () => {
    const input = [1, 2];
    let hash = poseidonHash(input);
    expect(hash).toEqual(BigInt("7853200120776062878684798364095072458815029376092732009249414926327459813530"));
    input.pop();
    hash = poseidonHash(input);
    expect(hash).toEqual(BigInt("18586133768512220936620570745912940619677854269274689475585506675881198879027"));
  });
});
