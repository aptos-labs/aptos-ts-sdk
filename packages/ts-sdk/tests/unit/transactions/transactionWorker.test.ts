// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from "vitest";
import { Account } from "../../../src/account/Account.js";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import {
  TransactionWorker,
  TransactionWorkerEventsEnum,
} from "../../../src/transactions/management/transactionWorker.js";
import { Network } from "../../../src/utils/apiEndpoints.js";

describe("TransactionWorker", () => {
  it("emits transaction events while another worker task is still running", async () => {
    const worker = new TransactionWorker(new AptosConfig({ network: Network.LOCAL }), Account.generate());
    let notifySubmissionStarted!: () => void;
    const submissionStarted = new Promise<void>((resolve) => {
      notifySubmissionStarted = resolve;
    });
    let finishSubmission!: () => void;
    const submissionCanFinish = new Promise<void>((resolve) => {
      finishSubmission = resolve;
    });
    let submissionFinished = false;
    const transactionSent = vi.fn();

    worker.on(TransactionWorkerEventsEnum.TransactionSent, transactionSent);
    worker.taskQueue.enqueue(async () => {
      notifySubmissionStarted();
      await submissionCanFinish;
      submissionFinished = true;
    });
    worker.taskQueue.enqueue(async () => {
      worker.emit(TransactionWorkerEventsEnum.TransactionSent, {
        message: "transaction sent",
        transactionHash: "0x1",
      });
    });

    const runPromise = worker.run();
    await submissionStarted;
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    try {
      expect(transactionSent).toHaveBeenCalledOnce();
      expect(submissionFinished).toBe(false);
    } finally {
      worker.taskQueue.cancel();
      finishSubmission();
      await runPromise;
    }
  });
});
