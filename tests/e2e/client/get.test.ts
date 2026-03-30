import {
  AptosConfig,
  LedgerInfo,
  MoveModuleBytecode,
  MoveResource,
  getAptosFullNode,
  paginateWithCursor,
  paginateWithObfuscatedCursor,
  getPageWithObfuscatedCursor,
} from "../../../src";
import { getAptosClient } from "../helper";

const partialConfig = new AptosConfig({
  clientConfig: {
    HEADERS: { clientConfig: "clientConfig-header" },
    API_KEY: "api-key",
  },
  fullnodeConfig: { HEADERS: { fullnodeHeader: "fullnode-header" } },
  indexerConfig: { HEADERS: { indexerHeader: "indexer-header" } },
  faucetConfig: { HEADERS: { faucetHeader: "faucet-header" }, AUTH_TOKEN: "auth-token" },
});
const { config: aptosConfig } = getAptosClient(partialConfig);

function expectFullnodeHeaders(overrides: any) {
  expect(overrides.API_KEY).toEqual("api-key");
  expect(overrides.HEADERS).toHaveProperty("clientConfig");
  expect(overrides.HEADERS.clientConfig).toEqual("clientConfig-header");
  expect(overrides.HEADERS).toHaveProperty("fullnodeHeader");
  expect(overrides.HEADERS.fullnodeHeader).toEqual("fullnode-header");
  // Properties from other configs should not be included
  expect(overrides.HEADERS).not.toHaveProperty("faucetConfig");
  expect(overrides.HEADERS).not.toHaveProperty("AUTH_TOKEN");
  expect(overrides.HEADERS).not.toHaveProperty("indexerHeader");
}

// All tests are expected to catch becuase server call will fail
// due to a fake API_KEY. But that is ok because we just want
// to test the config we set
describe("get request", () => {
  describe("fullnode", () => {
    test("it sets correct headers on getAptosFullNode request", async () => {
      try {
        await getAptosFullNode<{}, LedgerInfo>({
          aptosConfig,
          originMethod: "testGetFullnodeQuery",
          path: "",
        });
      } catch (e: any) {
        expectFullnodeHeaders(e.request.overrides);
      }
    });

    test("it sets correct headers on paginateWithCursor request", async () => {
      try {
        await paginateWithCursor<{}, LedgerInfo[]>({
          aptosConfig,
          originMethod: "testPaginateWithCursor",
          path: "transactions",
          params: { limit: 1 },
        });
      } catch (e: any) {
        expectFullnodeHeaders(e.request.overrides);
      }
    });

    test("it sets correct headers on paginateWithObfuscatedCursor request", async () => {
      try {
        await paginateWithObfuscatedCursor<{}, MoveModuleBytecode[]>({
          aptosConfig,
          originMethod: "testPaginateWithObfuscatedCursor",
          path: "accounts/0x1/modules",
          params: { limit: 1 },
        });
      } catch (e: any) {
        expectFullnodeHeaders(e.request.overrides);
      }
    });

    test("it sets correct headers on getPageWithObfuscatedCursor request", async () => {
      try {
        await getPageWithObfuscatedCursor<{}, MoveResource[]>({
          aptosConfig,
          originMethod: "testGetPageWithObfuscatedCursor",
          path: "accounts/0x1/resources",
          params: { limit: 1 },
        });
      } catch (e: any) {
        expectFullnodeHeaders(e.request.overrides);
      }
    });
  });
});
