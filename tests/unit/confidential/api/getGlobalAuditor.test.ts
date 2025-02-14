import { aptos } from "../helpers";

describe("Global auditor", () => {
  it("it should get global auditor", async () => {
    const [address] = await aptos.confidentialCoin.getGlobalAuditor();
    const globalAuditorAddress = address.toString();

    console.log(address);

    expect(globalAuditorAddress).toBeDefined();
  });
});
