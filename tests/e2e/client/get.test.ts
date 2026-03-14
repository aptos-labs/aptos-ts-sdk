import { LedgerInfo, getAptosFullNode } from "../../../src";
import { getAptosClient } from "../helper";

const partialConfig = {
  clientConfig: {
    HEADERS: { clientConfig: "clientConfig-header" },
    API_KEY: "api-key",
  },
  fullnodeConfig: { HEADERS: { fullnodeHeader: "fullnode-header" } },
  indexerConfig: { HEADERS: { indexerHeader: "indexer-header" } },
  faucetConfig: { HEADERS: { faucetHeader: "faucet-header" }, AUTH_TOKEN: "auth-token" },
};
const { config: aptosConfig } = getAptosClient(partialConfig);

describe("get request", () => {
  describe("fullnode", () => {
    test("it sets correct headers on get request", async () => {
      const response = await getAptosFullNode<{}, LedgerInfo>({
        aptosConfig,
        originMethod: "testGetFullnodeQuery",
        path: "",
      });
      const h = response.config.headers;
      expect(h.get("clientconfig")).toEqual("clientConfig-header");
      expect(h.get("authorization")).toEqual("Bearer api-key");
      expect(h.get("fullnodeheader")).toEqual("fullnode-header");
      expect(h.get("indexerheader")).toBeNull();
      expect(h.get("faucetheader")).toBeNull();
    });
  });
});
