import {
  CedraConfig,
  Network,
  Cedra,
  Account,
  Deserializer,
  RawTransaction,
  TransactionPayloadEntryFunction,
} from "../../../src";
import { FUND_AMOUNT, longTestTimeout } from "../../unit/helper";
import { getCedraClient } from "../helper";

describe("coin", () => {
  test("it generates a transfer coin transaction with CedraCoin coin type", async () => {
    const config = new CedraConfig({ network: Network.LOCAL });
    const cedra = new Cedra(config);
    const sender = Account.generate();
    const recipient = Account.generate();
    await cedra.fundAccount({ accountAddress: sender.accountAddress, amount: FUND_AMOUNT });

    const transaction = await cedra.transferCoinTransaction({
      sender: sender.accountAddress,
      recipient: recipient.accountAddress,
      amount: 10,
    });

    const txnDeserializer = new Deserializer(transaction.rawTransaction.bcsToBytes());
    const rawTransaction = RawTransaction.deserialize(txnDeserializer);

    if (!(rawTransaction.payload instanceof TransactionPayloadEntryFunction)) {
      throw new Error("Transaction payload is not an entry function");
    }

    const typeArg = rawTransaction.payload.entryFunction.type_args[0];
    if (!typeArg.isStruct()) {
      throw new Error("Transaction payload type arg is not a struct");
    }

    expect(typeArg.value.address.toString()).toBe("0x1");
    expect(typeArg.value.moduleName.identifier).toBe("cedra_coin");
    expect(typeArg.value.name.identifier).toBe("CedraCoin");
  });

  test("it generates a transfer coin transaction with a custom coin type", async () => {
    const { cedra } = getCedraClient();
    const sender = Account.generate();
    const recipient = Account.generate();
    await cedra.fundAccount({ accountAddress: sender.accountAddress, amount: FUND_AMOUNT });

    const transaction = await cedra.transferCoinTransaction({
      sender: sender.accountAddress,
      recipient: recipient.accountAddress,
      amount: 10,
      coinType: "0x1::my_coin::type",
    });

    const txnDeserializer = new Deserializer(transaction.rawTransaction.bcsToBytes());
    const rawTransaction = RawTransaction.deserialize(txnDeserializer);

    if (!(rawTransaction.payload instanceof TransactionPayloadEntryFunction)) {
      throw new Error("Transaction payload is not an entry function");
    }

    const typeArg = rawTransaction.payload.entryFunction.type_args[0];
    if (!typeArg.isStruct()) {
      throw new Error("Transaction payload type arg is not a struct");
    }

    expect(typeArg.value.address.toString()).toBe("0x1");
    expect(typeArg.value.moduleName.identifier).toBe("my_coin");
    expect(typeArg.value.name.identifier).toBe("type");
  });

  test(
    "it transfers APT coin amount from sender to recipient",
    async () => {
      const { cedra } = getCedraClient();
      const sender = Account.generate();
      const recipient = Account.generate();

      await cedra.fundAccount({ accountAddress: sender.accountAddress, amount: FUND_AMOUNT });
      const senderCoinsBefore = await cedra.getAccountCoinsData({ accountAddress: sender.accountAddress });

      const transaction = await cedra.transferCoinTransaction({
        sender: sender.accountAddress,
        recipient: recipient.accountAddress,
        amount: 10,
      });
      const pendingTxn = await cedra.signAndSubmitTransaction({ signer: sender, transaction });

      const res = await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
      const recipientCoins = await cedra.getAccountCoinsData({
        accountAddress: recipient.accountAddress,
        minimumLedgerVersion: BigInt(res.version),
      });
      const senderCoinsAfter = await cedra.getAccountCoinsData({
        accountAddress: sender.accountAddress,
        minimumLedgerVersion: BigInt(res.version),
      });

      expect(recipientCoins[0].amount).toBe(10);
      expect(recipientCoins[0].asset_type).toBe("0x1::cedra_coin::CedraCoin");
      expect(senderCoinsAfter[0].amount).toBeLessThan(senderCoinsBefore[0].amount);
    },
    longTestTimeout,
  );
});
