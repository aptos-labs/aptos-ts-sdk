import { aptos } from "../helpers";

describe("Global auditor", () => {
  it("it should get global auditor", async () => {
    const [address] = await aptos.veiledCoin.getGlobalAuditor();
    const globalAuditorAddress = address.toString();

    console.log(address);

    expect(globalAuditorAddress).toBeDefined();
  });
});
