// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi, beforeEach, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";
import { SimpleTransaction } from "../../../src/transactions/instances/simpleTransaction.js";
import { RawTransaction } from "../../../src/transactions/instances/rawTransaction.js";
import { ChainId } from "../../../src/transactions/instances/chainId.js";
import {
  EntryFunction,
  TransactionPayloadEntryFunction,
} from "../../../src/transactions/instances/transactionPayload.js";
import { ModuleId } from "../../../src/transactions/instances/moduleId.js";
import { Identifier } from "../../../src/transactions/instances/identifier.js";
import { AccountAuthenticatorEd25519 } from "../../../src/transactions/authenticator/account.js";
import { Ed25519PrivateKey } from "../../../src/core/crypto/ed25519.js";
import {
  submitTransaction,
  signAndSubmitTransaction,
  signAndSubmitAsFeePayer,
} from "../../../src/internal/transactionSubmission.js";
import { PendingTransactionResponse } from "../../../src/types/index.js";

vi.mock("../../../src/client", () => ({
  postAptosFullNode: vi.fn(),
}));

import { postAptosFullNode } from "../../../src/client/index.js";
import { generateSignedTransaction } from "../../../src/transactions/transactionBuilder/transactionBuilder.js";

const mockPost = postAptosFullNode as MockedFunction<typeof postAptosFullNode>;

function makeSimpleTransaction(): SimpleTransaction {
  const moduleId = new ModuleId(Account.generate().accountAddress, new Identifier("coin"));
  const payload = new TransactionPayloadEntryFunction(new EntryFunction(moduleId, new Identifier("transfer"), [], []));
  const raw = new RawTransaction(
    Account.generate().accountAddress,
    1n,
    payload,
    1000n,
    100n,
    9_999_999n,
    new ChainId(4),
  );
  return new SimpleTransaction(raw);
}

describe("internal/transactionSubmission submit paths", () => {
  const aptosConfig = new AptosConfig({ network: Network.LOCAL });
  const signer = Account.generate();
  const transaction = makeSimpleTransaction();
  const sk = new Ed25519PrivateKey(new Uint8Array(32).fill(1));
  const senderAuthenticator = new AccountAuthenticatorEd25519(sk.publicKey(), sk.sign(new Uint8Array([1])));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submitTransaction delegates to a custom transactionSubmitter when provided", async () => {
    const pending = { hash: "0xcustom" } as PendingTransactionResponse;
    const transactionSubmitter = {
      submitTransaction: vi.fn().mockResolvedValue(pending),
    };

    const result = await submitTransaction({
      aptosConfig,
      transaction,
      senderAuthenticator,
      transactionSubmitter,
    });

    expect(result).toEqual(pending);
    expect(transactionSubmitter.submitTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ transaction, senderAuthenticator }),
    );
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("submitTransaction POSTs BCS bytes to transactions/", async () => {
    const pending = { hash: "0xabc" } as PendingTransactionResponse;
    mockPost.mockResolvedValue({ data: pending } as never);

    const result = await submitTransaction({
      aptosConfig,
      transaction,
      senderAuthenticator,
    });

    expect(result).toEqual(pending);
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "transactions",
        originMethod: "submitTransaction",
      }),
    );
  });

  it("signAndSubmitTransaction signs then submits", async () => {
    mockPost.mockResolvedValue({ data: { hash: "0xdef" } } as never);

    const result = await signAndSubmitTransaction({
      aptosConfig,
      signer,
      transaction,
    });

    expect(result.hash).toBe("0xdef");
    expect(mockPost).toHaveBeenCalledTimes(1);
    const body = mockPost.mock.calls[0][0].body as Uint8Array;
    expect(body).toBeInstanceOf(Uint8Array);
    expect(body.length).toBeGreaterThan(0);
  });

  it("signAndSubmitAsFeePayer validates a keyless fee payer before submitting", async () => {
    const feePayer = Object.assign(Account.generate(), {
      checkKeylessAccountValidity: vi.fn().mockResolvedValue(undefined),
      waitForProofFetch: vi.fn().mockResolvedValue(undefined),
    });
    const feePayerTxn = new SimpleTransaction(transaction.rawTransaction, feePayer.accountAddress);
    mockPost.mockResolvedValue({ data: { hash: "0xfee" } } as never);

    const result = await signAndSubmitAsFeePayer({
      aptosConfig,
      feePayer,
      senderAuthenticator,
      transaction: feePayerTxn,
    });

    expect(result.hash).toBe("0xfee");
    expect(feePayer.checkKeylessAccountValidity).toHaveBeenCalledWith(aptosConfig);
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("submitTransaction rethrows the original error when post fails", async () => {
    mockPost.mockRejectedValue(new Error("submission rejected"));

    await expect(
      submitTransaction({
        aptosConfig,
        transaction,
        senderAuthenticator,
      }),
    ).rejects.toThrow(/submission rejected/);
  });

  it("generateSignedTransaction output is accepted by submitTransaction", async () => {
    const bytes = generateSignedTransaction({ transaction, senderAuthenticator });
    mockPost.mockResolvedValue({ data: { hash: "0x111" } } as never);

    await submitTransaction({
      aptosConfig,
      transaction,
      senderAuthenticator,
    });

    expect(bytes.length).toBeGreaterThan(0);
    expect(mockPost.mock.calls[0][0].body).toEqual(bytes);
  });
});
