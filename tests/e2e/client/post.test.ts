import {
  CedraConfig,
  GraphqlQuery,
  postCedraIndexer,
  postCedraFullNode,
  U8,
  postCedraFaucet,
  Account,
  InputViewFunctionData,
} from "../../../src";
import { GetChainTopUserTransactionsQuery } from "../../../src/types/generated/operations";
import { GetChainTopUserTransactions } from "../../../src/types/generated/queries";
import { getCedraClient } from "../helper";

function getCedraConfig(): CedraConfig {
  const partialConfig = {
    clientConfig: {
      HEADERS: { clientConfig: "clientConfig-header" },
      API_KEY: "api-key",
    },
    fullnodeConfig: { HEADERS: { fullnodeHeader: "fullnode-header" } },
    indexerConfig: { HEADERS: { indexerHeader: "indexer-header" } },
    faucetConfig: { HEADERS: { faucetHeader: "faucet-header" }, AUTH_TOKEN: "auth-token" },
  };
  const { config } = getCedraClient(partialConfig);
  return config;
}

describe("post request", () => {
  describe("indexer", () => {
    test("it sets correct headers", async () => {
      const response = await postCedraIndexer<GraphqlQuery, GetChainTopUserTransactionsQuery>({
        cedraConfig: getCedraConfig(),
        originMethod: "testQueryIndexer",
        path: "",
        body: {
          query: GetChainTopUserTransactions,
          variables: { limit: 5 },
        },
        overrides: { WITH_CREDENTIALS: false },
      });
      expect(response.config.headers).toHaveProperty("clientconfig");
      expect(response.config.headers.clientconfig).toEqual("clientConfig-header");
      expect(response.config.headers).toHaveProperty("authorization");
      expect(response.config.headers.authorization).toEqual("Bearer api-key");
      expect(response.config.headers).toHaveProperty("indexerheader");
      expect(response.config.headers.indexerheader).toEqual("indexer-header");
      // Properties that should not be included
      expect(response.config.headers).not.toHaveProperty("fullnodeheader");
      expect(response.config.headers).not.toHaveProperty("faucetheader");
    });
  });
  describe("fullnode", () => {
    test("it sets correct headers on post request", async () => {
      const response = await postCedraFullNode<InputViewFunctionData, U8>({
        cedraConfig: getCedraConfig(),
        originMethod: "testPostFullnodeQuery",
        path: "view",
        body: {
          function: "0x1::chain_status::is_operating",
          type_arguments: [],
          arguments: [],
        },
      });
      expect(response.config.headers).toHaveProperty("clientconfig");
      expect(response.config.headers.clientconfig).toEqual("clientConfig-header");
      expect(response.config.headers).toHaveProperty("authorization");
      expect(response.config.headers.authorization).toEqual("Bearer api-key");
      expect(response.config.headers).toHaveProperty("fullnodeheader");
      expect(response.config.headers.fullnodeheader).toEqual("fullnode-header");
      // Properties that should not be included
      expect(response.config.headers).not.toHaveProperty("indexerheader");
      expect(response.config.headers).not.toHaveProperty("faucetheader");
    });
  });
  describe("faucet", () => {
    test("it sets correct headers", async () => {
      const account = Account.generate();
      const response = await postCedraFaucet<any, { txn_hashes: Array<string> }>({
        cedraConfig: getCedraConfig(),
        path: "fund",
        body: {
          address: account.accountAddress.toString(),
          amount: 1000,
        },
        originMethod: "testQueryFaucet",
      });
      expect(response.config.headers).toHaveProperty("clientconfig");
      expect(response.config.headers.clientconfig).toEqual("clientConfig-header");
      expect(response.config.headers).toHaveProperty("authorization");
      expect(response.config.headers.authorization).toEqual("Bearer auth-token");
      expect(response.config.headers).toHaveProperty("faucetheader");
      expect(response.config.headers.faucetheader).toEqual("faucet-header");
      // Properties that should not be included
      expect(response.config.headers).not.toHaveProperty("fullnodeheader");
      expect(response.config.headers).not.toHaveProperty("indexerheader");
    });
  });
});
