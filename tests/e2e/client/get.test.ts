import { AptosConfig, LedgerInfo, getAptosFullNode } from "../../../src";
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

// All tests are expected to catch becuase server call will fail
// due to a fake API_KEY. But that is ok because we just want
// to test the config we set
describe("get request", () => {
  describe("fullnode", () => {
    test("it sets correct headers on get request", async () => {
      try {
        await getAptosFullNode<{}, LedgerInfo>({
          aptosConfig,
          originMethod: "testGetFullnodeQuery",
          path: "",
        });
      } catch (e) {
        const error = e as { request: { overrides: { API_KEY: string; HEADERS: Record<string, string> } } };
        expect(error.request.overrides.API_KEY).toEqual("api-key");
        expect(error.request.overrides.HEADERS).toHaveProperty("clientConfig");
        expect(error.request.overrides.HEADERS.clientConfig).toEqual("clientConfig-header");
        expect(error.request.overrides.HEADERS).toHaveProperty("fullnodeHeader");
        expect(error.request.overrides.HEADERS.fullnodeHeader).toEqual("fullnode-header");
        // Properties should not be included
        expect(error.request.overrides.HEADERS).not.toHaveProperty("faucetConfig");
        expect(error.request.overrides.HEADERS).not.toHaveProperty("AUTH_TOKEN");
        expect(error.request.overrides.HEADERS).not.toHaveProperty("indexerHeader");
      }
    });
  });
});
