// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Aptos, Network, Account, AnyRawTransaction, U8, AptosConfig } from "../../../src";
import { isValidANSName } from "../../../src/internal/ans";
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
    const contractAccount = await aptos.deriveAccountFromPrivateKey({ privateKey: ANS_PRIVATE_KEY });

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
  }, 2 * 60 * 1000);

  describe("isValidANSName", () => {
    test("it returns true for valid names", () => {
      expect(isValidANSName("primary")).toEqual({ domainName: "primary", subdomainName: undefined });
      expect(isValidANSName("primary.apt")).toEqual({ domainName: "primary", subdomainName: undefined });

      expect(isValidANSName("secondary.primary")).toEqual({ domainName: "primary", subdomainName: "secondary" });
      expect(isValidANSName("secondary.primary.apt")).toEqual({ domainName: "primary", subdomainName: "secondary" });

      expect(isValidANSName({ domainName: "primary", subdomainName: "secondary" })).toEqual({
        domainName: "primary",
        subdomainName: "secondary",
      });
    });

    test("it returns false for invalid names", () => {
      expect(() => isValidANSName("")).toThrow();
      expect(() => isValidANSName(".")).toThrow();
      expect(() => isValidANSName("..")).toThrow();
      expect(() => isValidANSName(" . ")).toThrow();
      expect(() => isValidANSName(" test ")).toThrow();
      expect(() => isValidANSName(".apt")).toThrow();
      expect(() => isValidANSName(".apt.apt")).toThrow();
      expect(() => isValidANSName(".apt.")).toThrow();
      expect(() => isValidANSName("1")).toThrow();
      expect(() => isValidANSName("1.apt")).toThrow();
      expect(() => isValidANSName("bad.bad.bad")).toThrow();
      expect(() => isValidANSName({ domainName: "1" })).toThrow();
      expect(() => isValidANSName({ domainName: "1", subdomainName: "2" })).toThrow();
    });
  });

  describe("registerName", () => {
    test("can be called with a variety of parameters", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({
        accountAddress: alice.accountAddress.toString(),
        amount: 500_000_000,
      });
      const name = randomString();

      expect(
        await aptos.registerName({
          name,
          sender: alice,
          expiration: { policy: "domain", years: 1 },
        }),
      ).toBeTruthy();

      await expect(
        aptos.registerName({
          sender: alice,
          name,
          // Force the year to be absent
          expiration: { policy: "domain" } as any,
        }),
      ).rejects.toThrow();

      // Testing to make sure that the subdomain policy is enforced
      await expect(
        aptos.registerName({
          sender: alice,
          name,
          // Force the year to be absent
          expiration: { policy: "subdomain:follow-domain" },
        }),
      ).rejects.toThrow();
    });

    test("it mints a domain name and gives it to the sender", async () => {
      const name = randomString();
      const alice = Account.generate();
      await aptos.fundAccount({
        accountAddress: alice.accountAddress.toString(),
        amount: 500_000_000,
      });

      await signAndSubmit(
        alice,
        await aptos.registerName({
          name,
          expiration: { policy: "domain", years: 1 },
          sender: alice,
        }),
      );

      const owner = await aptos.getOwnerAddress({ name });
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

      const name = randomString();

      await signAndSubmit(
        alice,
        await aptos.registerName({
          name,
          expiration: { policy: "domain", years: 1 },
          sender: alice,
          targetAddress: bob.accountAddress.toString(),
          toAddress: bob.accountAddress.toString(),
        }),
      );

      const owner = await aptos.getOwnerAddress({ name });
      expect(owner).toEqual(bob.accountAddress.toString());
    });
  });
});
