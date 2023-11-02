// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Aptos,
  Network,
  Account,
  AnyRawTransaction,
  Ed25519PrivateKey,
  U8,
  AptosConfig,
  AccountAddress,
} from "../../../src";
import { LOCAL_ANS_ACCOUNT_ADDRESS, LOCAL_ANS_ACCOUNT_PK } from "../../../src/internal/ans";
import { generateTransaction } from "../../../src/internal/transactionSubmission";

describe("ANS", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);
  const contractAccount = Account.fromPrivateKeyAndAddress({
    privateKey: new Ed25519PrivateKey(LOCAL_ANS_ACCOUNT_PK),
    address: AccountAddress.fromHexInput(LOCAL_ANS_ACCOUNT_ADDRESS),
  });

  const signAndSubmit = async (signer: Account, transaction: AnyRawTransaction) => {
    const pendingTxn = await aptos.signAndSubmitTransaction({ transaction, signer });
    return aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
  };

  const randomString = () => Math.random().toString().slice(2);

  beforeAll(async () => {
    // Enable reverse lookup for the case of v1
    await signAndSubmit(
      contractAccount,
      await generateTransaction({
        aptosConfig: config,
        sender: contractAccount.accountAddress.toString(),
        data: {
          function: `${LOCAL_ANS_ACCOUNT_ADDRESS}::domains::init_reverse_lookup_registry_v1`,
          functionArguments: [],
        },
      }),
    );

    // Toggle router to v2
    await signAndSubmit(
      contractAccount,
      await generateTransaction({
        aptosConfig: config,
        sender: contractAccount.accountAddress.toString(),
        data: {
          function: `${LOCAL_ANS_ACCOUNT_ADDRESS}::router::set_mode`,
          functionArguments: [new U8(1)],
        },
      }),
    );
  });

  describe("registerDomain", () => {
    test("it mints a domain name and gives it to the sender", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({
        accountAddress: alice.accountAddress.toString(),
        amount: 500_000_000,
      });

      const domainName = randomString();

      await signAndSubmit(
        alice,
        await aptos.ans.registerDomain({
          domainName,
          registrationDuration: 31536000,
          sender: alice,
        }),
      );

      const owner = await aptos.ans.getOwnerAddress({ domainName });
      expect(owner).toEqual(alice.accountAddress.toString());
    });

    test("it mints a domain name and gives it to the specified address", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({
        accountAddress: alice.accountAddress.toString(),
        amount: 500_000_000,
      });

      const bob = Account.generate();
      await aptos.fundAccount({
        accountAddress: bob.accountAddress.toString(),
        amount: 500_000_000,
      });

      const domainName = randomString();

      await signAndSubmit(
        alice,
        await aptos.ans.registerDomain({
          domainName,
          registrationDuration: 31536000,
          sender: alice,
          targetAddress: bob.accountAddress.toString(),
          toAddress: bob.accountAddress.toString(),
        }),
      );

      const owner = await aptos.ans.getOwnerAddress({ domainName });
      expect(owner).toEqual(bob.accountAddress.toString());
    });
  });
});
