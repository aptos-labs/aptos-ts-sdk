// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import * as transactionFunctions from "../../../src/internal/transaction.js";
import {
  type CommittedTransactionResponse,
  type WriteSetChangeDeleteTableItem,
  type WriteSetChangeWriteTableItem,
  TransactionResponseType,
} from "../../../src/types/index.js";
import { ProcessorType } from "../../../src/utils/const.js";
import { createMockClient, expectRequest, type MockClient, type RecordedRequest } from "../../helpers/mockClient.js";

type EnrichTransactionWithTableItemData = (args: {
  aptosConfig: AptosConfig;
  transaction: CommittedTransactionResponse;
}) => Promise<CommittedTransactionResponse>;

function getEnrichmentFunction(): EnrichTransactionWithTableItemData {
  const enrichTransactionWithTableItemData = (
    transactionFunctions as unknown as {
      enrichTransactionWithTableItemData?: EnrichTransactionWithTableItemData;
    }
  ).enrichTransactionWithTableItemData;

  expect(enrichTransactionWithTableItemData).toBeTypeOf("function");
  return enrichTransactionWithTableItemData!;
}

function committedTransaction(changes: CommittedTransactionResponse["changes"]): CommittedTransactionResponse {
  return {
    type: TransactionResponseType.User,
    version: "563060087",
    changes,
  } as CommittedTransactionResponse;
}

function graphqlOperation(request: RecordedRequest): string {
  return String((request.body as { query?: string } | undefined)?.query);
}

function tableDataRequest(mock: MockClient): RecordedRequest | undefined {
  return mock.requests.find((request) => graphqlOperation(request).includes("getTableItemsData"));
}

function tableMetadataRequest(mock: MockClient): RecordedRequest | undefined {
  return mock.requests.find((request) => graphqlOperation(request).includes("getTableItemsMetadata"));
}

function syncedProcessorResponse() {
  return {
    data: {
      data: {
        processor_status: [
          {
            processor: ProcessorType.DEFAULT,
            last_success_version: "563060087",
            last_updated: "2026-09-14T00:00:00",
          },
        ],
      },
    },
  };
}

describe("enrichTransactionWithTableItemData", () => {
  it("fills missing write and delete table data by write-set change index", async () => {
    const mock = createMockClient();
    const existingData = {
      key: "already-decoded",
      key_type: "address",
      value: "already-decoded",
      value_type: "u64",
    };
    const transaction = committedTransaction([
      {
        type: "write_resource",
        address: "0x1",
        state_key_hash: "0xresource",
        data: { type: "0x1::example::Resource", data: {} },
      },
      {
        type: "write_table_item",
        state_key_hash: "0xwrite",
        handle: "0xwrite_handle",
        key: "0x01",
        value: "0x02",
        data: null,
      },
      {
        type: "delete_resource",
        address: "0x1",
        state_key_hash: "0xdeleted_resource",
        resource: "0x1::example::Resource",
      },
      {
        type: "delete_table_item",
        state_key_hash: "0xdelete",
        handle: "0xdelete_handle",
        key: "0x03",
        data: null,
      },
      {
        type: "write_table_item",
        state_key_hash: "0xexisting",
        handle: "0xexisting_handle",
        key: "0x04",
        value: "0x05",
        data: existingData,
      },
    ] as CommittedTransactionResponse["changes"]);

    mock.setResponder((request) => {
      const operation = graphqlOperation(request);
      if (operation.includes("getProcessorStatus")) {
        return syncedProcessorResponse();
      }
      if (operation.includes("getTableItemsData")) {
        return {
          data: {
            data: {
              table_items: [
                {
                  decoded_key: "deleted-key",
                  decoded_value: null,
                  key: "0x03",
                  table_handle: "0xdelete_handle",
                  transaction_version: 563060087,
                  write_set_change_index: 3,
                },
                {
                  decoded_key: "written-key",
                  decoded_value: { amount: "10" },
                  key: "0x01",
                  table_handle: "0xwrite_handle",
                  transaction_version: 563060087,
                  write_set_change_index: 1,
                },
              ],
            },
          },
        };
      }
      if (operation.includes("getTableItemsMetadata")) {
        return {
          data: {
            data: {
              table_metadatas: [
                { handle: "0xdelete_handle", key_type: "address", value_type: "u128" },
                { handle: "0xwrite_handle", key_type: "0x1::string::String", value_type: "0x1::example::Value" },
              ],
            },
          },
        };
      }
      throw new Error(`Unexpected request: ${operation}`);
    });

    const result = await getEnrichmentFunction()({
      aptosConfig: mock.config,
      transaction,
    });

    expect(result).toBe(transaction);
    expect((transaction.changes[1] as WriteSetChangeWriteTableItem).data).toEqual({
      key: "written-key",
      key_type: "0x1::string::String",
      value: { amount: "10" },
      value_type: "0x1::example::Value",
    });
    expect((transaction.changes[3] as WriteSetChangeDeleteTableItem).data).toEqual({
      key: "deleted-key",
      key_type: "address",
    });
    expect((transaction.changes[4] as WriteSetChangeWriteTableItem).data).toBe(existingData);

    expect(mock.requests).toHaveLength(3);
    expectRequest(mock.requests[0], { method: "POST", originMethod: "getProcessorStatus" });
    expect((mock.requests[0]?.body as { variables: Record<string, unknown> } | undefined)?.variables).toMatchObject({
      where_condition: { processor: { _eq: ProcessorType.DEFAULT } },
    });
    const dataRequest = tableDataRequest(mock);
    const metadataRequest = tableMetadataRequest(mock);
    expectRequest(dataRequest, { method: "POST", originMethod: "getTableItemsData" });
    expectRequest(metadataRequest, { method: "POST", originMethod: "getTableItemsMetadata" });
    expect((dataRequest?.body as { variables: Record<string, unknown> } | undefined)?.variables).toMatchObject({
      where_condition: { transaction_version: { _eq: "563060087" } },
    });
    expect((metadataRequest?.body as { variables: Record<string, unknown> } | undefined)?.variables).toMatchObject({
      where_condition: { handle: { _in: ["0xwrite_handle", "0xdelete_handle"] } },
    });
  });

  it("does not query the indexer when every table change already has decoded data", async () => {
    const mock = createMockClient();
    const transaction = committedTransaction([
      {
        type: "write_table_item",
        state_key_hash: "0xwrite",
        handle: "0xhandle",
        key: "0x01",
        value: "0x02",
        data: { key: "key", key_type: "address", value: "value", value_type: "u64" },
      },
    ] as CommittedTransactionResponse["changes"]);

    const result = await getEnrichmentFunction()({
      aptosConfig: mock.config,
      transaction,
    });

    expect(result).toBe(transaction);
    expect(mock.requests).toHaveLength(0);
  });

  it("leaves data missing when the indexer has no matching item or metadata", async () => {
    const mock = createMockClient();
    const transaction = committedTransaction([
      {
        type: "write_table_item",
        state_key_hash: "0xwrite",
        handle: "0xmissing_handle",
        key: "0x01",
        value: "0x02",
        data: null,
      },
    ] as CommittedTransactionResponse["changes"]);

    mock.setResponder((request) => {
      const operation = graphqlOperation(request);
      if (operation.includes("getProcessorStatus")) {
        return syncedProcessorResponse();
      }
      return operation.includes("getTableItemsData")
        ? { data: { data: { table_items: [] } } }
        : { data: { data: { table_metadatas: [] } } };
    });

    await getEnrichmentFunction()({
      aptosConfig: mock.config,
      transaction,
    });

    expect((transaction.changes[0] as WriteSetChangeWriteTableItem).data).toBeNull();
  });

  it("paginates table items and metadata beyond the indexer page size", async () => {
    const mock = createMockClient();
    const transaction = committedTransaction(
      Array.from({ length: 101 }, (_, index) => ({
        type: "write_table_item",
        state_key_hash: `0xstate_${index}`,
        handle: `0xhandle_${index}`,
        key: `0xkey_${index}`,
        value: `0xvalue_${index}`,
        data: null,
      })) as CommittedTransactionResponse["changes"],
    );

    mock.setResponder((request) => {
      const operation = graphqlOperation(request);
      const variables = (request.body as { variables: Record<string, unknown> }).variables;
      if (operation.includes("getProcessorStatus")) {
        return syncedProcessorResponse();
      }
      if (operation.includes("getTableItemsData")) {
        const offset = Number(variables.offset);
        const length = offset === 0 ? 100 : 1;
        return {
          data: {
            data: {
              table_items: Array.from({ length }, (_, pageIndex) => {
                const changeIndex = offset + pageIndex;
                return {
                  decoded_key: `key-${changeIndex}`,
                  decoded_value: `value-${changeIndex}`,
                  key: `0xkey_${changeIndex}`,
                  table_handle: `0xhandle_${changeIndex}`,
                  transaction_version: 563060087,
                  write_set_change_index: changeIndex,
                };
              }),
            },
          },
        };
      }
      if (operation.includes("getTableItemsMetadata")) {
        const handles = (variables.where_condition as { handle: { _in: string[] } }).handle._in;
        return {
          data: {
            data: {
              table_metadatas: handles.map((handle) => ({
                handle,
                key_type: "address",
                value_type: "u64",
              })),
            },
          },
        };
      }
      throw new Error(`Unexpected request: ${operation}`);
    });

    await getEnrichmentFunction()({
      aptosConfig: mock.config,
      transaction,
    });

    expect((transaction.changes[100] as WriteSetChangeWriteTableItem).data).toEqual({
      key: "key-100",
      key_type: "address",
      value: "value-100",
      value_type: "u64",
    });
    expect(mock.requests.filter((request) => graphqlOperation(request).includes("getTableItemsData"))).toHaveLength(2);
    expect(mock.requests.filter((request) => graphqlOperation(request).includes("getTableItemsMetadata"))).toHaveLength(
      2,
    );
  });
});
