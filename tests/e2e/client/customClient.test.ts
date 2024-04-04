import {
  getAptosFullNode,
  Account,
  postAptosFaucet,
  AccountAddress,
  postAptosFullNode,
  MimeType,
  generateSignedTransaction,
} from "../../../src";
import { customClient } from "../../unit/helper";
import { getAptosClient } from "../helper";

describe("custom client", () => {
  test("it uses default client when it doesnt set in AptosConfig", () => {
    const { aptos } = getAptosClient();
    expect(aptos.config.client.provider).toBeInstanceOf(Function);
    expect(aptos.config.client.provider.name).toBe("aptosClient");
  });
  test("it uses a custom client set in AptosConfig", () => {
    const { aptos } = getAptosClient({ client: { provider: customClient } });
    expect(aptos.config.client.provider).toBeInstanceOf(Function);
    expect(aptos.config.client.provider.name).toBe("customClient");
  });

  test("it uses custom client for fetch queries", async () => {
    const { config } = getAptosClient({ client: { provider: customClient } });
    const response = await getAptosFullNode<{ headers?: { customClient?: any } }, {}>({
      aptosConfig: config,
      originMethod: "getInfo",
      path: "accounts/0x1",
    });
    expect(response?.request?.headers?.customClient).toBeTruthy();
  });

  test("it uses custom client for post queries", async () => {
    const { config } = getAptosClient({ client: { provider: customClient } });
    const account = Account.generate();
    const response = await postAptosFaucet<{ headers?: { customClient?: any } }, {}>({
      aptosConfig: config,
      path: "fund",
      body: {
        address: AccountAddress.from(account.accountAddress).toString(),
        amount: 100_000_000,
      },
      originMethod: "testFundAccount",
    });
    expect(response?.request?.headers?.customClient).toBeTruthy();
  });

  test("it uses custom client for transaction submission", async () => {
    const { aptos, config } = getAptosClient({ client: { provider: customClient } });
    const account = Account.generate();
    const recipient = Account.generate();
    await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 100_000_000 });
    const transaction = await aptos.transferCoinTransaction({
      sender: account.accountAddress,
      recipient: recipient.accountAddress,
      amount: 10,
    });
    const authenticator = aptos.transaction.sign({ signer: account, transaction });
    const signedTransaction = generateSignedTransaction({ transaction, senderAuthenticator: authenticator });
    const response = await postAptosFullNode<{ headers?: { customClient?: any } }, {}>({
      aptosConfig: config,
      body: signedTransaction,
      path: "transactions",
      originMethod: "testSubmitTransaction",
      contentType: MimeType.BCS_SIGNED_TRANSACTION,
    });
    expect(response?.request?.headers?.customClient).toBeTruthy();
  });
});
