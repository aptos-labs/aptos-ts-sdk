import { AptosConfig, Network, Aptos, Account, U64 } from "../../../src";
import { waitForTransaction } from "../../../src/internal/transaction";
import { longTestTimeout } from "../../unit/helper";
import { fundAccounts, publishTransferPackage, singleSignerScriptBytecode } from "../transaction/helper";

const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);

describe("transaction submission", () => {
  const contractPublisherAccount = Account.generate();
  const legacyED25519SenderAccount = Account.generate();
  const receiverAccounts = [Account.generate(), Account.generate()];
  beforeAll(async () => {
    await fundAccounts(aptos, [contractPublisherAccount, ...receiverAccounts, legacyED25519SenderAccount]);
    await publishTransferPackage(aptos, contractPublisherAccount);
  }, longTestTimeout);
  describe("single signer transaction", () => {
    test("with script payload", async () => {
      const transaction = await aptos.generate.singleSignerTransaction({
        sender: legacyED25519SenderAccount.accountAddress.toString(),
        data: {
          bytecode: singleSignerScriptBytecode,
          functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
        },
      });
      const authenticator = await aptos.sign.transaction({
        signer: legacyED25519SenderAccount,
        transaction,
      });

      const response = await aptos.submit.singleSignerTransaction({
        senderAuthenticator: authenticator,
        transaction,
      });

      await waitForTransaction({
        aptosConfig: config,
        transactionHash: response.hash,
      });
      expect(response.signature?.type).toBe("ed25519_signature");
    });

    test("new flow", async () => {
      const transaction = await aptos.generate.singleSignerTransaction({
        sender: legacyED25519SenderAccount.accountAddress.toString(),
        data: {
          bytecode: singleSignerScriptBytecode,
          functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
        },
      });

      const authenticator = aptos.sign.transaction({ signer: legacyED25519SenderAccount, transaction });

      const response = await aptos.submit.singleSignerTransaction({ transaction, senderAuthenticator: authenticator });
    });
  });
});
