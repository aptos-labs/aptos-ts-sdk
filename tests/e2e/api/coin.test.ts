import { AptosConfig, Network, Aptos, Account, Deserializer, TypeTagStruct } from "../../../src";
import { waitForTransaction } from "../../../src/internal/transaction";
import { RawTransaction, TransactionPayloadEntryFunction } from "../../../src/transactions/instances";
import { FUND_AMOUNT, longTestTimeout } from "../../unit/helper";

describe("coin", () => {
  test("it generates a transfer coin transaction with AptosCoin coin type", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
    const sender = Account.generate();
    const recipient = Account.generate();
    await aptos.fundAccount({ accountAddress: sender.accountAddress.toString(), amount: FUND_AMOUNT });

    const transaction = await aptos.transferCoinTransaction({
      sender,
      recipient: recipient.accountAddress.toString(),
      amount: 10,
    });

    const txnDeserializer = new Deserializer(transaction.rawTransaction);
    const rawTransaction = RawTransaction.deserialize(txnDeserializer);
    const typeArgs = (rawTransaction.payload as TransactionPayloadEntryFunction).entryFunction.type_args;
    expect((typeArgs[0] as TypeTagStruct).value.address.toString()).toBe("0x1");
    expect((typeArgs[0] as TypeTagStruct).value.moduleName.identifier).toBe("aptos_coin");
    expect((typeArgs[0] as TypeTagStruct).value.name.identifier).toBe("AptosCoin");
  });

  test("it generates a transfer coin transaction with a custom coin type", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
    const sender = Account.generate();
    const recipient = Account.generate();
    await aptos.fundAccount({ accountAddress: sender.accountAddress.toString(), amount: FUND_AMOUNT });

    const transaction = await aptos.transferCoinTransaction({
      sender,
      recipient: recipient.accountAddress.toString(),
      amount: 10,
      coinType: "0x1::my_coin::type",
    });

    const txnDeserializer = new Deserializer(transaction.rawTransaction);
    const rawTransaction = RawTransaction.deserialize(txnDeserializer);
    const typeArgs = (rawTransaction.payload as TransactionPayloadEntryFunction).entryFunction.type_args;
    expect((typeArgs[0] as TypeTagStruct).value.address.toString()).toBe("0x1");
    expect((typeArgs[0] as TypeTagStruct).value.moduleName.identifier).toBe("my_coin");
    expect((typeArgs[0] as TypeTagStruct).value.name.identifier).toBe("type");
  });

  test(
    "it transfers APT coin amount from sender to recipient",
    async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const sender = Account.generate();
      const recipient = Account.generate();

      await aptos.fundAccount({ accountAddress: sender.accountAddress.toString(), amount: FUND_AMOUNT });
      const senderCoinsBefore = await aptos.getAccountCoinsData({ accountAddress: sender.accountAddress.toString() });

      const transaction = await aptos.transferCoinTransaction({
        sender,
        recipient: recipient.accountAddress.toString(),
        amount: 10,
      });
      const response = await aptos.signAndSubmitTransaction({ signer: sender, transaction });

      await waitForTransaction({ aptosConfig: config, transactionHash: response.hash });
      const recipientCoins = await aptos.getAccountCoinsData({ accountAddress: recipient.accountAddress.toString() });
      const senderCoinsAfter = await aptos.getAccountCoinsData({ accountAddress: sender.accountAddress.toString() });

      expect(recipientCoins[0].amount).toBe(10);
      expect(recipientCoins[0].asset_type).toBe("0x1::aptos_coin::AptosCoin");
      expect(senderCoinsAfter[0].amount).toBeLessThan(senderCoinsBefore[0].amount);
    },
    longTestTimeout,
  );
});
