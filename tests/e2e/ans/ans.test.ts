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

  beforeAll(
    async () => {
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
    },
    2 * 60 * 1000,
  );

  describe("isValidANSName", () => {
    test("it returns true for valid names", () => {
      expect(isValidANSName("primary")).toEqual({ domainName: "primary", subdomainName: undefined });
      expect(isValidANSName("primary.apt")).toEqual({ domainName: "primary", subdomainName: undefined });

      expect(isValidANSName("secondary.primary")).toEqual({ domainName: "primary", subdomainName: "secondary" });
      expect(isValidANSName("secondary.primary.apt")).toEqual({ domainName: "primary", subdomainName: "secondary" });
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
      expect(() => isValidANSName("-bad-")).toThrow();
      expect(() => isValidANSName("-bad.apt")).toThrow();
      expect(() => isValidANSName("bad-.apt")).toThrow();
      expect(() => isValidANSName("b.a.d.apt")).toThrow();
    });
  });

  describe("registerName", () => {
    let alice: Account;
    let bob: Account;
    let domainName: string;
    let subdomainName: string;

    beforeEach(async () => {
      domainName = randomString();
      subdomainName = randomString();

      alice = Account.generate();
      bob = Account.generate();
      await Promise.all([
        aptos.fundAccount({
          accountAddress: alice.accountAddress.toString(),
          amount: 500_000_000,
        }),
        aptos.fundAccount({
          accountAddress: bob.accountAddress.toString(),
          amount: 500_000_000,
        }),
      ]);
    });

    test("can be called with a variety of parameters", async () => {
      const name = domainName;

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
      const name = domainName;

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
      const name = domainName;

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

    test("it mints a subdomain name and gives it to the sender", async () => {
      await signAndSubmit(
        alice,
        await aptos.registerName({
          name: domainName,
          expiration: { policy: "domain", years: 1 },
          sender: alice,
        }),
      );

      await signAndSubmit(
        alice,
        await aptos.ans.registerName({
          name: `${subdomainName}.${domainName}`,
          expiration: { policy: "subdomain:follow-domain" },
          transferable: true,
          sender: alice,
        }),
      );

      const owner = await aptos.ans.getOwnerAddress({ name: `${subdomainName}.${domainName}` });
      expect(owner).toEqual(alice.accountAddress.toString());
    });

    test("it mints a subdomain name and gives it to the specified address", async () => {
      await signAndSubmit(
        alice,
        await aptos.registerName({
          name: domainName,
          expiration: { policy: "domain", years: 1 },
          sender: alice,
        }),
      );

      await signAndSubmit(
        alice,
        await aptos.registerName({
          name: `${subdomainName}.${domainName}`,
          expiration: {
            policy: "subdomain:independent",
            // Expire the subdomain two seconds before the TLD expires
            expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 - 2000),
          },
          transferable: true,
          sender: alice,
          targetAddress: bob.accountAddress.toString(),
          toAddress: bob.accountAddress.toString(),
        }),
      );

      const owner = await aptos.ans.getOwnerAddress({ name: `${subdomainName}.${domainName}` });
      expect(owner).toEqual(bob.accountAddress.toString());
    });
  });

  describe("setTargetAddress and getTargetAddress", () => {
    let alice: Account;
    let bob: Account;
    let domainName: string;
    let subdomainName: string;
    let addr: string | undefined;

    beforeEach(async () => {
      alice = Account.generate();
      await aptos.fundAccount({
        accountAddress: alice.accountAddress.toString(),
        amount: 500_000_000,
      });

      bob = Account.generate();
      await aptos.fundAccount({
        accountAddress: bob.accountAddress.toString(),
        amount: 500_000_000,
      });

      domainName = randomString();
      subdomainName = randomString();
    });

    test("it sets and gets the target address for a tld", async () => {
      const name = domainName;

      await signAndSubmit(
        alice,
        await aptos.registerName({
          name,
          expiration: { policy: "domain", years: 1 },
          sender: alice,
          targetAddress: alice.accountAddress.toString(),
          toAddress: alice.accountAddress.toString(),
        }),
      );

      addr = await aptos.getTargetAddress({ name });
      expect(addr).toEqual(alice.accountAddress.toString());

      await signAndSubmit(
        alice,
        await aptos.setTargetAddress({
          name,
          address: bob.accountAddress.toString(),
          sender: alice,
        }),
      );
      addr = await aptos.getTargetAddress({ name });
      expect(addr).toEqual(bob.accountAddress.toString());
    });

    test("it sets and gets the target address for a subdomain", async () => {
      const name = `${subdomainName}.${domainName}`;

      await signAndSubmit(
        alice,
        await aptos.registerName({
          name: domainName,
          expiration: { policy: "domain", years: 1 },
          sender: alice,
        }),
      );

      await signAndSubmit(
        alice,
        await aptos.registerName({
          name,
          expiration: { policy: "subdomain:follow-domain" },
          sender: alice,
        }),
      );

      addr = await aptos.getTargetAddress({ name });
      expect(addr).toEqual(alice.accountAddress.toString());

      await signAndSubmit(
        alice,
        await aptos.setTargetAddress({
          name,
          address: bob.accountAddress.toString(),
          sender: alice,
        }),
      );
      addr = await aptos.getTargetAddress({ name });
      expect(addr).toEqual(bob.accountAddress.toString());
    });
  });

  describe("setPrimaryName and getPrimaryName", () => {
    test("it returns null if no primary name is set", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({
        accountAddress: alice.accountAddress.toString(),
        amount: 500_000_000,
      });

      const res = await aptos.ans.getPrimaryName({ address: alice.accountAddress.toString() });

      expect(res).toBeFalsy();
    });

    test("it sets and gets domain primary names", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({
        accountAddress: alice.accountAddress.toString(),
        amount: 500_000_000,
      });

      const domainName = randomString();

      await signAndSubmit(
        alice,
        await aptos.registerName({
          name: domainName,
          expiration: { policy: "domain", years: 1 },
          sender: alice,
        }),
      );

      await signAndSubmit(
        alice,
        await aptos.ans.setPrimaryName({
          name: domainName,
          sender: alice,
        }),
      );

      const res = await aptos.ans.getPrimaryName({ address: alice.accountAddress.toString() });

      expect(res).toBeTruthy();
      expect(res?.subdomainName).toBeFalsy();
      expect(res?.domainName).toEqual(domainName);
    });

    test("it sets and gets subdomain primary names", async () => {
      const alice = Account.generate();
      await aptos.fundAccount({
        accountAddress: alice.accountAddress.toString(),
        amount: 500_000_000,
      });

      const domainName = randomString();
      const subdomainName = randomString();

      await signAndSubmit(
        alice,
        await aptos.registerName({
          name: domainName,
          expiration: { policy: "domain", years: 1 },
          sender: alice,
        }),
      );

      await signAndSubmit(
        alice,
        await aptos.registerName({
          name: `${subdomainName}.${domainName}`,
          expiration: { policy: "subdomain:follow-domain" },
          transferable: true,
          sender: alice,
        }),
      );

      await signAndSubmit(
        alice,
        await aptos.ans.setPrimaryName({
          name: `${subdomainName}.${domainName}`,
          sender: alice,
        }),
      );

      const res = await aptos.ans.getPrimaryName({ address: alice.accountAddress.toString() });

      expect(res).toBeTruthy();
      expect(res?.domainName).toEqual(domainName);
      expect(res?.subdomainName).toEqual(subdomainName);
    });
  });
});
