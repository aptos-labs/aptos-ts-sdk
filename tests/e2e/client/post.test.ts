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

const aptosConfig = new AptosConfig({
  clientConfig: {
    HEADERS: { clientConfig: "clientConfig-header" },
    API_KEY: "api-key",
  },
  fullnodeConfig: { HEADERS: { fullnodeHeader: "fullnode-header" } },
  indexerConfig: { HEADERS: { indexerHeader: "indexer-header" } },
  faucetConfig: { HEADERS: { faucetHeader: "faucet-header" }, AUTH_TOKEN: "auth-token" },
});

// All tests are expected to catch becuase server call will fail
// due to a fake API_KEY. But that is ok because we just want
// to test the config we set
describe("post request", () => {
  describe("indexer", () => {
    test("it sets correct headers", async () => {
      try {
        await postAptosIndexer<GraphqlQuery, GetChainTopUserTransactionsQuery>({
          aptosConfig,
          originMethod: "testQueryIndexer",
          path: "",
          body: {
            query: GetChainTopUserTransactions,
            variables: { limit: 5 },
          },
          overrides: { WITH_CREDENTIALS: false },
        });
      } catch (e: any) {
        expect(e.request.overrides.API_KEY).toEqual("api-key");
        expect(e.request.overrides.HEADERS).toHaveProperty("clientConfig");
        expect(e.request.overrides.HEADERS.clientConfig).toEqual("clientConfig-header");
        expect(e.request.overrides.HEADERS).toHaveProperty("indexerHeader");
        expect(e.request.overrides.HEADERS.indexerHeader).toEqual("indexer-header");
        // Properties should not be included
        expect(e.request.overrides.HEADERS).not.toHaveProperty("fullnodeHeader");
        expect(e.request.overrides.HEADERS).not.toHaveProperty("faucetConfig");
        expect(e.request.overrides.HEADERS).not.toHaveProperty("AUTH_TOKEN");
      }
    });
  });
  describe("fullnode", () => {
    test("it sets correct headers on post request", async () => {
      try {
        await postAptosFullNode<InputViewFunctionData, U8>({
          aptosConfig,
          originMethod: "testPostFullnodeQuery",
          path: "view",
          body: {
            function: "0x1::aptos_chain::get",
          },
        });
      } catch (e: any) {
        expect(e.request.overrides.API_KEY).toEqual("api-key");
        expect(e.request.overrides.HEADERS).toHaveProperty("clientConfig");
        expect(e.request.overrides.HEADERS.clientConfig).toEqual("clientConfig-header");
        expect(e.request.overrides.HEADERS).toHaveProperty("fullnodeHeader");
        expect(e.request.overrides.HEADERS.fullnodeHeader).toEqual("fullnode-header");
        // Properties should not be included
        expect(e.request.overrides.HEADERS).not.toHaveProperty("faucetConfig");
        expect(e.request.overrides.HEADERS).not.toHaveProperty("AUTH_TOKEN");
        expect(e.request.overrides.HEADERS).not.toHaveProperty("indexerHeader");
      }
    });
  });
  describe("faucet", () => {
    test("it sets correct headers", async () => {
      const account = Account.generate();
      try {
        await postAptosFaucet<any, { txn_hashes: Array<string> }>({
          aptosConfig,
          path: "fund",
          body: {
            address: account.accountAddress.toString(),
            amount: 1000,
          },
          originMethod: "testQueryFaucet",
        });
      } catch (e: any) {
        expect(e.request.overrides).toHaveProperty("AUTH_TOKEN");
        expect(e.request.overrides.AUTH_TOKEN).toEqual("auth-token");
        expect(e.request.overrides.HEADERS).toHaveProperty("clientConfig");
        expect(e.request.overrides.HEADERS.clientConfig).toEqual("clientConfig-header");
        expect(e.request.overrides.HEADERS).toHaveProperty("faucetHeader");
        expect(e.request.overrides.HEADERS.fullnodeHeader).toEqual("faucet-header");
        // Properties should not be included
        expect(e.request.overrides.HEADERS).not.toHaveProperty("fullnodeConfig");
        expect(e.request.overrides.HEADERS).not.toHaveProperty("indexerHeader");
        expect(e.request.overrides.API_KEY).not.toHaveProperty("API_KEY");
      }
    });
  });
});
