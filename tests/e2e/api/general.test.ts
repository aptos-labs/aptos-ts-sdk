// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig, Aptos, Network, GraphqlQuery, InputViewFunctionData, ProcessorType } from "../../../src";

describe("general api", () => {
  test("it fetches ledger info", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
    const ledgerInfo = await aptos.getLedgerInfo();
    expect(ledgerInfo.chain_id).toBe(4);
  });

  test("it fetches chain id", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
    const chainId = await aptos.getChainId();
    expect(chainId).toBe(4);
  });

  test("it fetches block data by block height", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
    const blockHeight = 1;
    const blockData = await aptos.getBlockByHeight({ blockHeight });
    expect(blockData.block_height).toBe(blockHeight.toString());
  });

  test("it fetches block data by block version", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
    const blockVersion = 1;
    const blockData = await aptos.getBlockByVersion({ ledgerVersion: blockVersion });
    expect(blockData.block_height).toBe(blockVersion.toString());
  });

  test("it fetches table item data", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
    type Supply = {
      supply: {
        vec: [
          {
            aggregator: {
              vec: [{ handle: string; key: string }];
            };
          },
        ];
      };
    };
    const resource = await aptos.getAccountResource<Supply>({
      accountAddress: "0x1",
      resourceType: "0x1::coin::CoinInfo<0x1::aptos_coin::AptosCoin>",
    });

    const { handle, key } = resource.supply.vec[0].aggregator.vec[0];

    const supply = await aptos.getTableItem<string>({
      handle,
      data: {
        key_type: "address",
        value_type: "u128",
        key,
      },
    });
    expect(parseInt(supply, 10)).toBeGreaterThan(0);
  });

  test("it fetches data with a custom graphql query", async () => {
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);

    const query: GraphqlQuery = {
      query: `query MyQuery {
        ledger_infos {
          chain_id
        }
      }`,
    };

    const chainId = await aptos.queryIndexer<{
      ledger_infos: [
        {
          chain_id: number;
        },
      ];
    }>({ query });

    expect(chainId.ledger_infos[0].chain_id).toBe(2);
  });

  test("it should fetch chain top user transactions", async () => {
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);

    const topUserTransactions = await aptos.getChainTopUserTransactions({ limit: 3 });
    expect(topUserTransactions.length).toEqual(3);
  });
  describe("View functions", () => {
    test("it fetches view function data", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);

      const payload: InputViewFunctionData = {
        function: "0x1::chain_id::get",
      };

      const chainId = (await aptos.view({ payload }))[0];

      expect(chainId).toEqual(4);
    });

    test("it fetches view function with a type", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);

      const payload: InputViewFunctionData = {
        function: "0x1::chain_id::get",
      };

      const chainId = (await aptos.view<[number]>({ payload }))[0];

      expect(chainId).toEqual(4);
    });

    test("it fetches view function with bool", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);

      const payload: InputViewFunctionData = {
        function: "0x1::account::exists_at",
        functionArguments: ["0x1"],
      };

      const exists = (await aptos.view<[boolean]>({ payload }))[0];

      expect(exists).toBe(true);

      const payload2: InputViewFunctionData = {
        function: "0x1::account::exists_at",
        functionArguments: ["0x12345"],
      };

      const exists2 = (await aptos.view<[boolean]>({ payload: payload2 }))[0];

      expect(exists2).toBe(false);
    });

    test("it fetches view function with address input and different output types", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);

      const payload: InputViewFunctionData = {
        function: "0x1::account::get_sequence_number",
        functionArguments: ["0x1"],
      };

      const sequenceNumber = (await aptos.view<[string]>({ payload }))[0];

      expect(BigInt(sequenceNumber)).toEqual(BigInt(0));

      const payload2: InputViewFunctionData = {
        function: "0x1::account::get_authentication_key",
        functionArguments: ["0x1"],
      };

      const authKey = (await aptos.view<[string]>({ payload: payload2 }))[0];

      expect(authKey).toEqual("0x0000000000000000000000000000000000000000000000000000000000000001");
    });

    test("it fetches view functions with generics", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);

      const payload: InputViewFunctionData = {
        function: "0x1::coin::symbol",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
      };

      const symbol = (await aptos.view<[string]>({ payload }))[0];
      expect(symbol).toEqual("APT");

      const payload2: InputViewFunctionData = {
        function: "0x1::coin::is_account_registered",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: ["0x1"],
      };

      const isRegistered = (await aptos.view<[boolean]>({ payload: payload2 }))[0];
      expect(isRegistered).toEqual(false);

      const payload3: InputViewFunctionData = {
        function: "0x1::coin::supply",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [],
      };

      const supply = (await aptos.view<[{ vec: [string] }]>({ payload: payload3 }))[0].vec[0];
      expect(BigInt(supply)).toBeGreaterThan(BigInt(0));
    });

    test("view functions that fail in the VM fail here", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);

      const payload: InputViewFunctionData = {
        function: "0x1::account::get_sequence_number",
        functionArguments: ["0x123456"],
      };

      await expect(() => aptos.view<[string]>({ payload })).rejects.toThrow("VMError");
    });
  });

  test("it should get the processor statuses for one", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);

    const processor = await aptos.getProcessorStatus(ProcessorType.ACCOUNT_TRANSACTION_PROCESSOR);
    expect(processor.processor).toEqual(ProcessorType.ACCOUNT_TRANSACTION_PROCESSOR);
  });
});
