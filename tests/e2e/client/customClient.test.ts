import {
  getCedraFullNode,
  Account,
  postCedraFaucet,
  AccountAddress,
  postCedraFullNode,
  MimeType,
  generateSignedTransaction,
} from "../../../src";
import { customClient } from "../../unit/helper";
import { getCedraClient } from "../helper";

describe("custom client", () => {
  test("it uses default client when it doesnt set in CedraConfig", () => {
    const { cedra } = getCedraClient();
    expect(cedra.config.client.provider).toBeInstanceOf(Function);
    expect(cedra.config.client.provider.name).toBe("cedraClient");
  });
  test("it uses a custom client set in CedraConfig", () => {
    const { cedra } = getCedraClient({ client: { provider: customClient } });
    expect(cedra.config.client.provider).toBeInstanceOf(Function);
    expect(cedra.config.client.provider.name).toBe("customClient");
  });

  test("it uses custom client for fetch queries", async () => {
    const { config } = getCedraClient({ client: { provider: customClient } });
    const response = await getCedraFullNode<{ headers?: { customClient?: any } }, {}>({
      cedraConfig: config,
      originMethod: "getInfo",
      path: "accounts/0x1",
    });
    expect(response?.request?.headers?.customClient).toBeTruthy();
  });

  test("it uses custom client for post queries", async () => {
    const { config } = getCedraClient({ client: { provider: customClient } });
    const account = Account.generate();
    const response = await postCedraFaucet<{ headers?: { customClient?: any } }, {}>({
      cedraConfig: config,
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
    const { cedra, config } = getCedraClient({ client: { provider: customClient } });
    const account = Account.generate();
    const recipient = Account.generate();
    await cedra.fundAccount({ accountAddress: account.accountAddress, amount: 100_000_000 });
    const transaction = await cedra.transferCoinTransaction({
      sender: account.accountAddress,
      recipient: recipient.accountAddress,
      amount: 10,
    });
    const authenticator = cedra.transaction.sign({ signer: account, transaction });
    const signedTransaction = generateSignedTransaction({ transaction, senderAuthenticator: authenticator });
    const response = await postCedraFullNode<{ headers?: { customClient?: any } }, {}>({
      cedraConfig: config,
      body: signedTransaction,
      path: "transactions",
      originMethod: "testSubmitTransaction",
      contentType: MimeType.BCS_SIGNED_TRANSACTION,
    });
    expect(response?.request?.headers?.customClient).toBeTruthy();
  });
});
