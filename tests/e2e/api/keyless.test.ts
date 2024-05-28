// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, KeylessAccount } from "../../../src";
import { getAptosClient } from "../helper";
import { fetchDevnetTestKeylessAccount } from "../transaction/helper";

describe("keyless api", () => {
  const FUND_AMOUNT = 100_000_000;
  const TRANSFER_AMOUNT = 500_000;

  let keylessAccount: KeylessAccount;
  // TODO: Make this work for local by spinning up a local proving service.
  const { aptos } = getAptosClient();

  beforeAll(async () => {
    keylessAccount = fetchDevnetTestKeylessAccount(0);
  });
  describe("keyless account", () => {
    test("it submits transactions", async () => {
      const recipient = Account.generate();
      await aptos.faucet.fundAccount({
        accountAddress: keylessAccount.accountAddress,
        amount: FUND_AMOUNT,
      });
      await aptos.faucet.fundAccount({
        accountAddress: recipient.accountAddress,
        amount: FUND_AMOUNT,
      });

      const senderOldBalance = await aptos.getAccountAPTAmount({
        accountAddress: keylessAccount.accountAddress,
      });
      const recipientOldBalance = await aptos.getAccountAPTAmount({
        accountAddress: recipient.accountAddress,
      });

      const transaction = await aptos.transferCoinTransaction({
        sender: keylessAccount.accountAddress,
        recipient: recipient.accountAddress,
        amount: TRANSFER_AMOUNT,
      });

      const committedTxn = await aptos.signAndSubmitTransaction({ signer: keylessAccount, transaction });
      await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

      const senderNewBalance = await aptos.getAccountAPTAmount({
        accountAddress: keylessAccount.accountAddress,
      });
      const recipientNewBalance = await aptos.getAccountAPTAmount({
        accountAddress: recipient.accountAddress,
      });

      expect(senderOldBalance - senderNewBalance).toBeGreaterThan(TRANSFER_AMOUNT);
      expect(recipientNewBalance - recipientOldBalance).toEqual(TRANSFER_AMOUNT);
    });
    test("serializes and deserializes", async () => {
      const bytes = keylessAccount.bcsToBytes();
      const deserializedAccount = KeylessAccount.fromBytes(bytes);
      expect(bytes).toEqual(deserializedAccount.bcsToBytes());
    });
  });
});
