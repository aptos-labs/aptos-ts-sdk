// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from "vitest";
import { Account } from "../../../src/account/Account.js";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { signAndSubmitTransaction } from "../../../src/internal/transactionSubmission.js";
import {
  TransactionWorker,
  TransactionWorkerEventsEnum,
} from "../../../src/transactions/management/transactionWorker.js";
import { PendingTransactionResponse } from "../../../src/types/index.js";
import { Network } from "../../../src/utils/apiEndpoints.js";

vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  generateTransaction: vi.fn(),
  signAndSubmitTransaction: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function prepareWorker() {
  const worker = new TransactionWorker(new AptosConfig({ network: Network.LOCAL }), Account.generate());
  const submissionLoopWaiting = deferred<void>();
  const finishSubmissionLoop = deferred<void>();

  vi.spyOn(worker.accountSequnceNumber, "nextSequenceNumber")
    .mockResolvedValueOnce(0n)
    .mockImplementationOnce(async () => {
      submissionLoopWaiting.resolve();
      await finishSubmissionLoop.promise;
      return null;
    });
  vi.spyOn(worker, "generateNextTransaction").mockResolvedValue({} as never);

  return { worker, submissionLoopWaiting, finishSubmissionLoop };
}

describe("TransactionWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emits TransactionSent when a submission resolves while the producer is still running", async () => {
    const { worker, submissionLoopWaiting, finishSubmissionLoop } = prepareWorker();
    const pendingTransaction = deferred<PendingTransactionResponse>();
    const transactionSent = vi.fn();
    vi.mocked(signAndSubmitTransaction).mockReturnValue(pendingTransaction.promise);

    worker.on(TransactionWorkerEventsEnum.TransactionSent, transactionSent);
    let producerFinished = false;
    const producerPromise = worker.submitNextTransaction().finally(() => {
      producerFinished = true;
    });

    await submissionLoopWaiting.promise;
    pendingTransaction.resolve({ hash: "0x1" } as PendingTransactionResponse);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    try {
      expect(transactionSent).toHaveBeenCalledWith({
        message: "transaction hash 0x1 has been committed to chain",
        transactionHash: "0x1",
      });
      expect(producerFinished).toBe(false);
    } finally {
      finishSubmissionLoop.resolve();
      await producerPromise;
    }
  });

  it("emits TransactionSendFailed when a submission rejects while the producer is still running", async () => {
    const { worker, submissionLoopWaiting, finishSubmissionLoop } = prepareWorker();
    const pendingTransaction = deferred<PendingTransactionResponse>();
    const error = new Error("submission failed");
    const transactionSendFailed = vi.fn();
    vi.mocked(signAndSubmitTransaction).mockReturnValue(pendingTransaction.promise);
    pendingTransaction.promise.catch(() => {});

    worker.on(TransactionWorkerEventsEnum.TransactionSendFailed, transactionSendFailed);
    let producerFinished = false;
    const producerPromise = worker.submitNextTransaction().finally(() => {
      producerFinished = true;
    });

    await submissionLoopWaiting.promise;
    pendingTransaction.reject(error);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    try {
      expect(transactionSendFailed).toHaveBeenCalledWith({
        message: "failed to commit transaction 1 with error Error: submission failed",
        error,
      });
      expect(producerFinished).toBe(false);
    } finally {
      finishSubmissionLoop.resolve();
      await producerPromise;
    }
  });
});
