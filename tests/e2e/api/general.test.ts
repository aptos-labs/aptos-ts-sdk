// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import { Network, GraphqlQuery, ProcessorType, InputViewFunctionData, InputViewFunctionJsonData } from "../../../src";
import { getCedraClient } from "../helper";

describe("general api", () => {
  const { cedra } = getCedraClient();

  test("it fetches ledger info", async () => {
    const ledgerInfo = await cedra.getLedgerInfo();
    expect(ledgerInfo.chain_id).toBe(4);
  });

  test("it fetches chain id", async () => {
    const chainId = await cedra.getChainId();
    expect(chainId).toBe(4);
  });

  describe("View functions", () => {
    test("it fetches view function data", async () => {
      const payload: InputViewFunctionData = {
        function: "0x1::chain_id::get",
      };

      const chainId = (await cedra.view({ payload }))[0];

      expect(chainId).toEqual(4);
    });

    test("it fetches view function with a type", async () => {
      const payload: InputViewFunctionData = {
        function: "0x1::chain_id::get",
      };

      const chainId = (await cedra.view<[number]>({ payload }))[0];

      expect(chainId).toEqual(4);
    });

    test("it fetches view function with bool", async () => {
      const payload: InputViewFunctionData = {
        function: "0x1::account::exists_at",
        functionArguments: ["0x1"],
      };

      const exists = (await cedra.view<[boolean]>({ payload }))[0];

      expect(exists).toBe(true);
    });

    test("it fetches view function with address input and different output types", async () => {
      const payload: InputViewFunctionData = {
        function: "0x1::account::get_sequence_number",
        functionArguments: ["0x1"],
      };

      const sequenceNumber = (await cedra.view<[string]>({ payload }))[0];

      expect(BigInt(sequenceNumber)).toEqual(BigInt(0));

      const payload2: InputViewFunctionData = {
        function: "0x1::account::get_authentication_key",
        functionArguments: ["0x1"],
      };

      const authKey = (await cedra.view<[string]>({ payload: payload2 }))[0];

      expect(authKey).toEqual("0x0000000000000000000000000000000000000000000000000000000000000001");
    });

    test("it fetches view functions with generics", async () => {
      const payload: InputViewFunctionData = {
        function: "0x1::coin::symbol",
        typeArguments: ["0x1::cedra_coin::CedraCoin"],
      };

      const symbol = (await cedra.view<[string]>({ payload }))[0];
      expect(symbol).toEqual("APT");

      const payload2: InputViewFunctionData = {
        function: "0x1::coin::decimals",
        typeArguments: ["0x1::cedra_coin::CedraCoin"],
        functionArguments: [],
      };

      const decimals = (await cedra.view<[number]>({ payload: payload2 }))[0];
      expect(decimals).toEqual(8);

      const payload3: InputViewFunctionData = {
        function: "0x1::coin::supply",
        typeArguments: ["0x1::cedra_coin::CedraCoin"],
      };

      const supply = (await cedra.view<[{ vec: [string] }]>({ payload: payload3 }))[0].vec[0];
      expect(BigInt(supply)).toBeGreaterThan(BigInt(0));
    });
  });
  describe("View json functions", () => {
    test("it fetches view function data", async () => {
      const payload: InputViewFunctionJsonData = {
        function: "0x1::chain_id::get",
      };

      const chainId = (await cedra.viewJson({ payload }))[0];

      expect(chainId).toEqual(4);
    });

    test("it fetches view function with a type", async () => {
      const payload: InputViewFunctionJsonData = {
        function: "0x1::chain_id::get",
      };

      const chainId = (await cedra.viewJson<[number]>({ payload }))[0];

      expect(chainId).toEqual(4);
    });

    test("it fetches view function with bool", async () => {
      const payload: InputViewFunctionJsonData = {
        function: "0x1::account::exists_at",
        functionArguments: ["0x1"],
      };

      const exists = (await cedra.viewJson<[boolean]>({ payload }))[0];

      expect(exists).toBe(true);
    });

    test("it fetches view function with address input and different output types", async () => {
      const payload: InputViewFunctionJsonData = {
        function: "0x1::account::get_sequence_number",
        functionArguments: ["0x1"],
      };

      const sequenceNumber = (await cedra.viewJson<[string]>({ payload }))[0];

      expect(BigInt(sequenceNumber)).toEqual(BigInt(0));

      const payload2: InputViewFunctionJsonData = {
        function: "0x1::account::get_authentication_key",
        functionArguments: ["0x1"],
      };

      const authKey = (await cedra.viewJson<[string]>({ payload: payload2 }))[0];

      expect(authKey).toEqual("0x0000000000000000000000000000000000000000000000000000000000000001");
    });

    test("it fetches view functions with generics", async () => {
      const payload: InputViewFunctionJsonData = {
        function: "0x1::coin::symbol",
        typeArguments: ["0x1::cedra_coin::CedraCoin"],
      };

      const symbol = (await cedra.viewJson<[string]>({ payload }))[0];
      expect(symbol).toEqual("APT");

      const payload2: InputViewFunctionJsonData = {
        function: "0x1::coin::decimals",
        typeArguments: ["0x1::cedra_coin::CedraCoin"],
        functionArguments: [],
      };

      const decimals = (await cedra.viewJson<[number]>({ payload: payload2 }))[0];
      expect(decimals).toEqual(8);

      const payload3: InputViewFunctionJsonData = {
        function: "0x1::coin::supply",
        typeArguments: ["0x1::cedra_coin::CedraCoin"],
      };

      const supply = (await cedra.viewJson<[{ vec: [string] }]>({ payload: payload3 }))[0].vec[0];
      expect(BigInt(supply)).toBeGreaterThan(BigInt(0));
    });
  });

  test("it should get the processor statuses for one", async () => {
    const processor = await cedra.getProcessorStatus(ProcessorType.ACCOUNT_TRANSACTION_PROCESSOR);
    expect(processor.processor).toEqual(ProcessorType.ACCOUNT_TRANSACTION_PROCESSOR);
  });
});

describe("general api (requires testnet)", () => {
  const { cedra } = getCedraClient({ network: Network.TESTNET });
  test("it fetches data with a custom graphql query", async () => {
    const query: GraphqlQuery = {
      query: `query MyQuery {
        ledger_infos {
          chain_id
        }
      }`,
    };

    const chainId = await cedra.queryIndexer<{
      ledger_infos: [
        {
          chain_id: number;
        },
      ];
    }>({ query });

    expect(chainId.ledger_infos[0].chain_id).toBe(2);
  });

  test("it should fetch chain top user transactions", async () => {
    const topUserTransactions = await cedra.getChainTopUserTransactions({ limit: 3 });
    expect(topUserTransactions.length).toEqual(3);
  });
});
