import {
  AptosConfig,
  GraphqlQuery,
  postAptosIndexer,
  postAptosFullNode,
  U8,
  postAptosFaucet,
  Account,
  InputViewFunctionData,
} from "../../../src";
import { GetChainTopUserTransactionsQuery } from "../../../src/types/generated/operations";
import { GetChainTopUserTransactions } from "../../../src/types/generated/queries";
import { getAptosClient } from "../helper";

function getAptosConfig(): AptosConfig {
  const partialConfig = {
    clientConfig: {
      HEADERS: { clientConfig: "clientConfig-header" },
      API_KEY: "api-key",
    },
    fullnodeConfig: { HEADERS: { fullnodeHeader: "fullnode-header" } },
    indexerConfig: { HEADERS: { indexerHeader: "indexer-header" } },
    faucetConfig: { HEADERS: { faucetHeader: "faucet-header" }, AUTH_TOKEN: "auth-token" },
  };
  const { config } = getAptosClient(partialConfig);
  return config;
}

describe("post request", () => {
  describe("indexer", () => {
    test("it sets correct headers", async () => {
      const response = await postAptosIndexer<GraphqlQuery, GetChainTopUserTransactionsQuery>({
        aptosConfig: getAptosConfig(),
        originMethod: "testQueryIndexer",
        path: "",
        body: {
          query: GetChainTopUserTransactions,
          variables: { limit: 5 },
        },
        overrides: { WITH_CREDENTIALS: false },
      });
      const h = response.config.headers;
      expect(h.get("clientconfig")).toEqual("clientConfig-header");
      expect(h.get("authorization")).toEqual("Bearer api-key");
      expect(h.get("indexerheader")).toEqual("indexer-header");
      expect(h.get("fullnodeheader")).toBeNull();
      expect(h.get("faucetheader")).toBeNull();
    });
  });
  describe("fullnode", () => {
    test("it sets correct headers on post request", async () => {
      const response = await postAptosFullNode<InputViewFunctionData, U8>({
        aptosConfig: getAptosConfig(),
        originMethod: "testPostFullnodeQuery",
        path: "view",
        body: {
          function: "0x1::chain_status::is_operating",
          type_arguments: [],
          arguments: [],
        },
      });
      const h = response.config.headers;
      expect(h.get("clientconfig")).toEqual("clientConfig-header");
      expect(h.get("authorization")).toEqual("Bearer api-key");
      expect(h.get("fullnodeheader")).toEqual("fullnode-header");
      expect(h.get("indexerheader")).toBeNull();
      expect(h.get("faucetheader")).toBeNull();
    });
  });
  describe("faucet", () => {
    test("it sets correct headers", async () => {
      const account = Account.generate();
      const response = await postAptosFaucet<any, { txn_hashes: Array<string> }>({
        aptosConfig: getAptosConfig(),
        path: "fund",
        body: {
          address: account.accountAddress.toString(),
          amount: 1000,
        },
        originMethod: "testQueryFaucet",
      });
      const h = response.config.headers;
      expect(h.get("clientconfig")).toEqual("clientConfig-header");
      expect(h.get("authorization")).toEqual("Bearer auth-token");
      expect(h.get("faucetheader")).toEqual("faucet-header");
      expect(h.get("fullnodeheader")).toBeNull();
      expect(h.get("indexerheader")).toBeNull();
    });
  });
});
