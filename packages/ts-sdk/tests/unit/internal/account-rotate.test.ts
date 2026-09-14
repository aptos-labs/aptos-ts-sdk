// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { createMockClient } from "../../helpers/mockClient.js";
import { Account } from "../../../src/account/Account.js";
import { Ed25519PrivateKey } from "../../../src/core/crypto/ed25519.js";
import { MultiEd25519PublicKey } from "../../../src/core/crypto/multiEd25519.js";
import { MultiEd25519Account } from "../../../src/account/MultiEd25519Account.js";
import { SimpleTransaction } from "../../../src/transactions/instances/simpleTransaction.js";
import { rotateAuthKey, rotateAuthKeyUnverified } from "../../../src/internal/account.js";

vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  generateTransaction: vi.fn(),
}));

import { generateTransaction } from "../../../src/internal/transactionSubmission.js";

const mockedGenerateTransaction = generateTransaction as MockedFunction<typeof generateTransaction>;

describe("internal/account rotateAuthKey*", () => {
  beforeEach(() => {
    mockedGenerateTransaction.mockReset();
    mockedGenerateTransaction.mockResolvedValue(new SimpleTransaction({} as never));
  });

  it("rotateAuthKey with toNewPrivateKey builds a rotate_authentication_key transaction", async () => {
    const mock = createMockClient();
    const fromAccount = Account.generate();
    const toKey = new Ed25519PrivateKey(new Uint8Array(32).fill(9));
    mock.enqueue({
      data: {
        sequence_number: "3",
        authentication_key: fromAccount.accountAddress.toString(),
      },
    });

    const txn = await rotateAuthKey({
      aptosConfig: mock.config,
      fromAccount,
      toNewPrivateKey: toKey,
    });

    expect(txn).toBeInstanceOf(SimpleTransaction);
    expect(mockedGenerateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        aptosConfig: mock.config,
        sender: fromAccount.accountAddress,
        data: expect.objectContaining({
          function: "0x1::account::rotate_authentication_key",
        }),
      }),
    );
  });

  it("rotateAuthKey with toAccount (MultiEd25519Account) builds rotate_authentication_key", async () => {
    const mock = createMockClient();
    const fromAccount = Account.generate();
    const k1 = new Ed25519PrivateKey(new Uint8Array(32).fill(1));
    const k2 = new Ed25519PrivateKey(new Uint8Array(32).fill(2));
    const multiPub = new MultiEd25519PublicKey({
      publicKeys: [k1.publicKey(), k2.publicKey()],
      threshold: 2,
    });
    const toAccount = new MultiEd25519Account({ publicKey: multiPub, signers: [k1, k2] });
    mock.enqueue({
      data: {
        sequence_number: "2",
        authentication_key: fromAccount.accountAddress.toString(),
      },
    });

    await rotateAuthKey({
      aptosConfig: mock.config,
      fromAccount,
      toAccount,
    });

    expect(mockedGenerateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ function: "0x1::account::rotate_authentication_key" }),
      }),
    );
  });

  it("rotateAuthKey with toAccount (Ed25519Account) reuses the account private key path", async () => {
    const mock = createMockClient();
    const fromAccount = Account.generate();
    const toAccount = Account.generate();
    mock.enqueue({
      data: {
        sequence_number: "1",
        authentication_key: fromAccount.accountAddress.toString(),
      },
    });

    await rotateAuthKey({
      aptosConfig: mock.config,
      fromAccount,
      toAccount,
    });

    expect(mockedGenerateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ function: "0x1::account::rotate_authentication_key" }),
      }),
    );
  });

  it("rotateAuthKey throws on invalid arguments", async () => {
    const mock = createMockClient();
    await expect(
      rotateAuthKey({
        aptosConfig: mock.config,
        fromAccount: Account.generate(),
      } as never),
    ).rejects.toThrow(/Invalid arguments/);
  });

  it("rotateAuthKeyUnverified targets rotate_authentication_key_from_public_key", async () => {
    const fromAccount = Account.generate();
    const toNewPublicKey = Account.generate().publicKey;
    const mock = createMockClient();

    await rotateAuthKeyUnverified({
      aptosConfig: mock.config,
      fromAccount,
      toNewPublicKey,
    });

    expect(mockedGenerateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          function: "0x1::account::rotate_authentication_key_from_public_key",
        }),
      }),
    );
  });
});
