// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it } from "vitest";
import { createMockClient } from "../../helpers/mockClient.js";
import { Account } from "../../../src/account/Account.js";
import { publicPackageTransaction } from "../../../src/internal/transactionSubmission.js";
import { SimpleTransaction } from "../../../src/transactions/instances/simpleTransaction.js";
import { TransactionPayloadEntryFunction } from "../../../src/transactions/instances/transactionPayload.js";

describe("internal/transactionSubmission.publicPackageTransaction", () => {
  beforeEach(() => {
    // publicPackageTransaction delegates to generateTransaction, which fetches sequence_number.
  });

  it("builds a publish_package_txn SimpleTransaction with metadata and module bytecode", async () => {
    const mock = createMockClient();
    const sender = Account.generate();
    mock.enqueue({
      data: {
        sequence_number: "0",
        authentication_key: sender.accountAddress.toString(),
      },
    });

    const txn = await publicPackageTransaction({
      aptosConfig: mock.config,
      account: sender.accountAddress,
      metadataBytes: "0x01",
      moduleBytecode: ["0x02", "0x03"],
      options: { gasUnitPrice: 100 },
    });

    expect(txn).toBeInstanceOf(SimpleTransaction);
    expect(txn.rawTransaction.payload).toBeInstanceOf(TransactionPayloadEntryFunction);
    const entry = (txn.rawTransaction.payload as TransactionPayloadEntryFunction).entryFunction;
    expect(entry.module_name.name.identifier).toBe("code");
    expect(entry.function_name.identifier).toBe("publish_package_txn");
  });
});
