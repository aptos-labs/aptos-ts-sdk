import { AptosConfig, Network, Aptos, Account, Deserializer } from "../../../src";
import { waitForTransaction } from "../../../src/internal/transaction";
import { RawTransaction, TransactionPayloadEntryFunction } from "../../../src/transactions/instances";
import { TypeTagStruct } from "../../../src/transactions/typeTag/typeTag";
import { SigningScheme } from "../../../src/types";

describe("coin", () => {
  test("it generates a transfer coin transaction with AptosCoin coin type", async () => {
    const config = new AptosConfig({ network: Network.DEVNET });
    const aptos = new Aptos(config);
    const sender = Account.generate({ scheme: SigningScheme.Ed25519 });
    const recipient = Account.generate({ scheme: SigningScheme.Ed25519 });
    await aptos.fundAccount({ accountAddress: sender.accountAddress.toString(), amount: 100000000 });

    const transaction = await aptos.transferCoinTransaction({
      sender,
      recipient: recipient.accountAddress.toString(),
      amount: 10,
    });

    const txnDeserializer = new Deserializer(transaction.rawTransaction);
    const rawTransaction = RawTransaction.deserialize(txnDeserializer);
    const typeArgs = (rawTransaction.payload as TransactionPayloadEntryFunction).entryFunction.type_args;
    expect((typeArgs[0] as TypeTagStruct).value.address.toString()).toBe("0x1");
    expect((typeArgs[0] as TypeTagStruct).value.module_name.identifier).toBe("aptos_coin");
    expect((typeArgs[0] as TypeTagStruct).value.name.identifier).toBe("AptosCoin");
  });

  test("it generates a transfer coin transaction with a custom coin type", async () => {
    const config = new AptosConfig({ network: Network.DEVNET });
    const aptos = new Aptos(config);
    const sender = Account.generate({ scheme: SigningScheme.Ed25519 });
    const recipient = Account.generate({ scheme: SigningScheme.Ed25519 });
    await aptos.fundAccount({ accountAddress: sender.accountAddress.toString(), amount: 100000000 });

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
    expect((typeArgs[0] as TypeTagStruct).value.module_name.identifier).toBe("my_coin");
    expect((typeArgs[0] as TypeTagStruct).value.name.identifier).toBe("type");
  });

  test("it transfers APT coin aomunt from sender to recipient", async () => {
    const config = new AptosConfig({ network: Network.DEVNET });
    const aptos = new Aptos(config);
    const sender = Account.generate({ scheme: SigningScheme.Ed25519 });
    const recipient = Account.generate({ scheme: SigningScheme.Ed25519 });

    await aptos.fundAccount({ accountAddress: sender.accountAddress.toString(), amount: 100000000 });
    const senderCoinsBefore = await aptos.getAccountCoinsData({ accountAddress: sender.accountAddress.toString() });

    const transaction = await aptos.transferCoinTransaction({
      sender,
      recipient: recipient.accountAddress.toString(),
      amount: 10,
    });
    const response = await aptos.signAndSubmitTransaction({ signer: sender, transaction });

    await waitForTransaction({ aptosConfig: config, txnHash: response.hash });

    const recipientCoins = await aptos.getAccountCoinsData({ accountAddress: recipient.accountAddress.toString() });
    const senderCoinsAfter = await aptos.getAccountCoinsData({ accountAddress: sender.accountAddress.toString() });

    expect(recipientCoins[0].amount).toBe(10);
    expect(recipientCoins[0].asset_type).toBe("0x1::aptos_coin::AptosCoin");
    expect(senderCoinsAfter[0].amount).toBeLessThan(senderCoinsBefore[0].amount);
  });
});
