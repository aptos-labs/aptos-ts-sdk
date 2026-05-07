import {
  AptosConfig,
  Network,
  Aptos,
  Account,
  Deserializer,
  RawTransaction,
  TransactionPayloadEntryFunction,
} from "../../../src";
import { FUND_AMOUNT, longTestTimeout } from "../../unit/helper";
import { getAptosClient } from "../helper";

describe("coin", () => {
  test("it generates a transfer coin transaction with AptosCoin coin type", async () => {
    const config = new AptosConfig({ network: Network.LOCAL });
    const aptos = new Aptos(config);
    const sender = Account.generate();
    const recipient = Account.generate();
    await aptos.fundAccount({ accountAddress: sender.accountAddress, amount: FUND_AMOUNT });

    const transaction = await aptos.transferCoinTransaction({
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
    expect(typeArg.value.moduleName.identifier).toBe("aptos_coin");
    expect(typeArg.value.name.identifier).toBe("AptosCoin");
  });

  test("it generates a transfer coin transaction with a custom coin type", async () => {
    const { aptos } = getAptosClient();
    const sender = Account.generate();
    const recipient = Account.generate();
    await aptos.fundAccount({ accountAddress: sender.accountAddress, amount: FUND_AMOUNT });

    const transaction = await aptos.transferCoinTransaction({
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
      const { aptos } = getAptosClient();
      const sender = Account.generate();
      const recipient = Account.generate();

      await aptos.fundAccount({ accountAddress: sender.accountAddress, amount: FUND_AMOUNT });
      const senderCoinsBefore = await aptos.getAccountCoinsData({ accountAddress: sender.accountAddress });

      const transaction = await aptos.transferCoinTransaction({
        sender: sender.accountAddress,
        recipient: recipient.accountAddress,
        amount: 10,
      });
      const pendingTxn = await aptos.signAndSubmitTransaction({ signer: sender, transaction });

      const res = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
      const recipientCoins = await aptos.getAccountCoinsData({
        accountAddress: recipient.accountAddress,
        minimumLedgerVersion: BigInt(res.version),
      });
      const senderCoinsAfter = await aptos.getAccountCoinsData({
        accountAddress: sender.accountAddress,
        minimumLedgerVersion: BigInt(res.version),
      });

      expect(recipientCoins[0].amount).toBe(10);
      expect(recipientCoins[0].asset_type).toBe("0x1::aptos_coin::AptosCoin");
      expect(senderCoinsAfter[0].amount).toBeLessThan(senderCoinsBefore[0].amount);
    },
    longTestTimeout,
  );
});
