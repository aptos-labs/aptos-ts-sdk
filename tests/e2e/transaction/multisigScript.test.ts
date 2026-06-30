// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, Script, TransactionPayloadMultiSig, U64 } from "../../../src/index.js";
import { longTestTimeout, TRANSFER_AMOUNT } from "../../unit/helper.js";
import { getAptosClient } from "../helper.js";
import {
  createAndFundMultisigAccount,
  createMultisigScriptTransaction,
  fundAccounts,
  singleSignerScriptBytecode,
} from "./helper.js";

describe("multisig script on local testnet", () => {
  const { aptos } = getAptosClient();
  const owner = Account.generate();
  const receiver = Account.generate();
  let multisigAddress: string;

  beforeAll(async () => {
    await fundAccounts(aptos, [owner, receiver]);
    multisigAddress = await createAndFundMultisigAccount(owner);
    await createMultisigScriptTransaction(owner, multisigAddress, {
      bytecode: singleSignerScriptBytecode,
      functionArguments: [new U64(TRANSFER_AMOUNT), receiver.accountAddress],
    });
  }, longTestTimeout);

  test(
    "simulates multisig script execute payload",
    async () => {
      const rawTxn = await aptos.transaction.build.simple({
        sender: owner.accountAddress,
        data: {
          multisigAddress,
          bytecode: singleSignerScriptBytecode,
          functionArguments: [new U64(TRANSFER_AMOUNT), receiver.accountAddress],
        },
      });
      expect(rawTxn.rawTransaction.payload).toBeInstanceOf(TransactionPayloadMultiSig);
      const msPayload = rawTxn.rawTransaction.payload as TransactionPayloadMultiSig;
      expect(msPayload.multiSig.transaction_payload?.transaction_payload).toBeInstanceOf(Script);

      const [response] = await aptos.transaction.simulate.simple({
        signerPublicKey: owner.publicKey,
        transaction: rawTxn,
      });
      expect(response.success).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "executes multisig script transfer on chain",
    async () => {
      const recipientOldBalance = await aptos.getAccountAPTAmount({
        accountAddress: receiver.accountAddress,
      });

      const transaction = await aptos.transaction.build.simple({
        sender: owner.accountAddress,
        data: {
          multisigAddress,
          bytecode: singleSignerScriptBytecode,
          functionArguments: [new U64(TRANSFER_AMOUNT), receiver.accountAddress],
        },
      });
      const response = await aptos.signAndSubmitTransaction({
        signer: owner,
        transaction,
      });
      const committedTxn = await aptos.waitForTransaction({
        transactionHash: response.hash,
      });

      expect(committedTxn.success).toBeTruthy();

      const recipientNewBalance = await aptos.getAccountAPTAmount({
        accountAddress: receiver.accountAddress,
        minimumLedgerVersion: Number(committedTxn.version),
      });
      expect(recipientNewBalance - recipientOldBalance).toEqual(TRANSFER_AMOUNT);
    },
    longTestTimeout,
  );
});
