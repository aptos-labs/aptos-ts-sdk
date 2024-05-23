// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, KeylessAccount } from "../../../src";
import { getAptosClient } from "../helper";
import { balance, fetchDevnetTestKeylessAccount } from "../transaction/helper";

describe("keyless api", () => {
  const FUND_AMOUNT = 100_000_000;
  const TRANSFER_AMOUNT = 500_000;
  const RSA_SECRET_KEY_URL =
    // eslint-disable-next-line max-len
    "https://raw.githubusercontent.com/aptos-labs/aptos-core/ae9a956d2963f3eb4baef543f629cbc2fe3ece1c/types/src/jwks/rsa/insecure_test_jwk_private_key.pem";

  // let rsaPrivateKey: string;
  let keylessAccount: KeylessAccount;
  // TODO: Make this work for local by spinning up a local proving service.
  const { aptos } = getAptosClient();

  beforeAll(async () => {
    const response = await fetch(RSA_SECRET_KEY_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // rsaPrivateKey = await response.text();
    // keylessAccount = await fetchTestKeylessAccount(aptos, 0, rsaPrivateKey);
    keylessAccount = fetchDevnetTestKeylessAccount(0);
  });
  describe("keyless account", () => {
    test("it submits transactions", async () => {
      const recipient = Account.generate();
      await aptos.faucet.fundAccount({
        accountAddress: keylessAccount.accountAddress,
        amount: FUND_AMOUNT,
        options: { waitForIndexer: false },
      });
      await aptos.faucet.fundAccount({
        accountAddress: recipient.accountAddress,
        amount: FUND_AMOUNT,
        options: { waitForIndexer: false },
      });

      const senderOldBalance = await balance(aptos, keylessAccount.accountAddress);
      const recipientOldBalance = await balance(aptos, recipient.accountAddress);

      const transaction = await aptos.transferCoinTransaction({
        sender: keylessAccount.accountAddress,
        recipient: recipient.accountAddress,
        amount: TRANSFER_AMOUNT,
      });

      const committedTxn = await aptos.signAndSubmitTransaction({ signer: keylessAccount, transaction });
      await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

      const senderNewBalance = await balance(aptos, keylessAccount.accountAddress);
      const recipientNewBalance = await balance(aptos, recipient.accountAddress);

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
