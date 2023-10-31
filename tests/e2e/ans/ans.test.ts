// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Aptos, Network, Account, AnyRawTransaction, U8, AptosConfig } from "../../../src";
import { generateTransaction } from "../../../src/internal/transactionSubmission";
import { publishAnsContract } from "./publishANSContracts";

// This isn't great, we should look into deploying outside the test
jest.setTimeout(20000);

describe("ANS", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);

  const signAndSubmit = async (signer: Account, transaction: AnyRawTransaction) => {
    const pendingTxn = await aptos.signAndSubmitTransaction({ transaction, signer });
    return aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
  };

  const randomString = () => Math.random().toString().slice(2);

  beforeAll(async () => {
    const { address: ANS_ADDRESS, privateKey: ANS_PRIVATE_KEY } = await publishAnsContract(aptos);
    const contractAccount = Account.fromPrivateKeyAndAddress({
      privateKey: ANS_PRIVATE_KEY,
      address: ANS_ADDRESS,
    });
    // Publish the contract, should be idempotent

    // Enable reverse lookup for the case of v1
    await signAndSubmit(
      contractAccount,
      await generateTransaction({
        aptosConfig: config,
        sender: contractAccount.accountAddress.toString(),
        data: {
          function: `${ANS_ADDRESS}::domains::init_reverse_lookup_registry_v1`,
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
          function: `${ANS_ADDRESS}::router::set_mode`,
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
