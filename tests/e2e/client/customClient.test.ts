import {
  AptosConfig,
  Aptos,
  Network,
  getAptosFullNode,
  Account,
  postAptosFaucet,
  AccountAddress,
  postAptosFullNode,
  MimeType,
} from "../../../src";
import { generateSignedTransaction } from "../../../src/transactions/transaction_builder/transaction_builder";
import { customClient } from "../../unit/helper";

describe("custom client", () => {
  test("it uses default client when it doesnt set in AptosConfig", () => {
    const config = new AptosConfig();
    const aptos = new Aptos(config);
    expect(aptos.config.client.provider).toBeInstanceOf(Function);
    expect(aptos.config.client.provider.name).toBe("aptosClient");
  });
  test("it uses a custom client set in AptosConfig", () => {
    const config = new AptosConfig({ client: { provider: customClient } });
    const aptos = new Aptos(config);
    expect(aptos.config.client.provider).toBeInstanceOf(Function);
    expect(aptos.config.client.provider.name).toBe("customClient");
  });

  test("it uses custom client for fetch queries", async () => {
    const config = new AptosConfig({ network: Network.LOCAL, client: { provider: customClient } });
    const response = await getAptosFullNode({ aptosConfig: config, originMethod: "getInfo", path: "accounts/0x1" });
    expect(((response.request as any).headers as any)?.customClient).toBeTruthy();
  });

  test("it uses custom client for post queries", async () => {
    const config = new AptosConfig({ network: Network.LOCAL, client: { provider: customClient } });
    const account = Account.generate();
    const response = await postAptosFaucet({
      aptosConfig: config,
      path: "fund",
      body: {
        address: AccountAddress.fromHexInput(account.accountAddress.toString()).toString(),
        amount: 100_000_000,
      },
      originMethod: "testFundAccount",
    });
    expect(((response.request as any).headers as any)?.customClient).toBeTruthy();
  });

  test("it uses custom client for transaction submission", async () => {
    const config = new AptosConfig({ network: Network.LOCAL, client: { provider: customClient } });
    const aptos = new Aptos(config);
    const account = Account.generate();
    const recipient = Account.generate();
    await aptos.fundAccount({ accountAddress: account.accountAddress.toString(), amount: 100_000_000 });
    const transaction = await aptos.transferCoinTransaction({
      sender: account,
      recipient: recipient.accountAddress.toString(),
      amount: 10,
    });
    const authenticator = aptos.signTransaction({ signer: account, transaction });
    const signedTransaction = generateSignedTransaction({ transaction, senderAuthenticator: authenticator });
    const response = await postAptosFullNode({
      aptosConfig: config,
      body: signedTransaction,
      path: "transactions",
      originMethod: "testSubmitTransaction",
      contentType: MimeType.BCS_SIGNED_TRANSACTION,
    });
    expect(((response.request as any).headers as any)?.customClient).toBeTruthy();
  });
});
