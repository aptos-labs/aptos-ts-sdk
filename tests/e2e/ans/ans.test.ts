// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Aptos, Network, Account, AnyRawTransaction, U8, AptosConfig, GetANSNameResponse } from "../../../src";
import { isValidANSName } from "../../../src/internal/ans";
import { generateTransaction } from "../../../src/internal/transactionSubmission";
import { publishAnsContract } from "./publishANSContracts";

// This isn't great, we should look into deploying outside the test
jest.setTimeout(20000);

describe("ANS", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);

  let changeExpirationDate: (
    tokenMode: 0 | 1,
    expirationDate: number,
    domainName: string,
    subdomainName?: string,
  ) => void;

  let changeRouterMode: (mode: 0 | 1) => void;

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
          sender: contractAccount.accountAddress,
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
          sender: contractAccount.accountAddress,
          data: {
            function: `${ANS_ADDRESS}::router::set_mode`,
            functionArguments: [new U8(1)],
          },
        }),
      );

      changeExpirationDate = async (
        // What version of the ANS sdk the name is. Depending on the version, we
        // hit different contracts to change the expiration date.
        // 0 = ANS v1 token
        // 1 = ANS v2 token
        tokenMode: 0 | 1,
        expirationDate: number,
        domainName: string,
        subdomainName?: string,
      ) =>
        signAndSubmit(
          contractAccount,
          await generateTransaction({
            aptosConfig: config,
            sender: contractAccount.accountAddress,
            data: {
              function:
                tokenMode === 0
                  ? `${ANS_ADDRESS}::domain::force_set_expiration`
                  : `${ANS_ADDRESS}::v2_1_domains::force_set_name_expiration`,
              functionArguments:
                tokenMode === 0
                  ? [subdomainName, domainName, expirationDate]
                  : [domainName, subdomainName, expirationDate],
            },
          }),
        );

      // 0 = Points the router to ANS v1
      // 1 = Points the router to ANS v2
      changeRouterMode = async (mode: 0 | 1) =>
        signAndSubmit(
          contractAccount,
          await generateTransaction({
            aptosConfig: config,
            sender: contractAccount.accountAddress,
            data: {
              function: `${ANS_ADDRESS}::router::set_mode`,
              functionArguments: [mode],
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
          accountAddress: alice.accountAddress,
          amount: 500_000_000,
        }),
        aptos.fundAccount({
          accountAddress: bob.accountAddress,
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
          expiration: { policy: "domain" },
        }),
      ).toBeTruthy();

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
          expiration: { policy: "domain", years: 0 } as any,
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
          expiration: { policy: "domain" },
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
          expiration: { policy: "domain" },
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
          expiration: { policy: "domain" },
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

      const owner = await aptos.getOwnerAddress({ name: `${subdomainName}.${domainName}` });
      expect(owner).toEqual(alice.accountAddress.toString());
    });

    test("it mints a subdomain name and gives it to the specified address", async () => {
      await signAndSubmit(
        alice,
        await aptos.registerName({
          name: domainName,
          expiration: { policy: "domain" },
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
            expirationDate: Date.now() + 365 * 24 * 60 * 60 * 1000 - 2000,
          },
          transferable: true,
          sender: alice,
          targetAddress: bob.accountAddress.toString(),
          toAddress: bob.accountAddress.toString(),
        }),
      );

      const owner = await aptos.getOwnerAddress({ name: `${subdomainName}.${domainName}` });
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
        accountAddress: alice.accountAddress,
        amount: 500_000_000,
      });

      bob = Account.generate();
      await aptos.fundAccount({
        accountAddress: bob.accountAddress,
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
          expiration: { policy: "domain" },
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
          address: bob.accountAddress,
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
          expiration: { policy: "domain" },
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
          address: bob.accountAddress,
          sender: alice,
        }),
      );
      addr = await aptos.getTargetAddress({ name });
      expect(addr).toEqual(bob.accountAddress.toString());
    });
  });

  describe("setPrimaryName and getPrimaryName", () => {
    let alice: Account;
    let bob: Account;
    let domainName: string;
    let subdomainName: string;

    beforeEach(async () => {
      alice = Account.generate();
      await aptos.fundAccount({
        accountAddress: alice.accountAddress,
        amount: 500_000_000,
      });

      bob = Account.generate();
      await aptos.fundAccount({
        accountAddress: bob.accountAddress,
        amount: 500_000_000,
      });

      domainName = randomString();
      subdomainName = randomString();
    });

    test("it returns null if no primary name is set", async () => {
      const res = await aptos.getPrimaryName({ address: alice.accountAddress });
      expect(res).toBeFalsy();
    });

    test("it sets and gets domain primary names", async () => {
      const name = domainName;

      await signAndSubmit(alice, await aptos.registerName({ name, expiration: { policy: "domain" }, sender: alice }));

      await signAndSubmit(alice, await aptos.setPrimaryName({ name, sender: alice }));

      const res = await aptos.getPrimaryName({ address: alice.accountAddress });

      expect(res).toEqual(name);
    });

    test("it sets and gets subdomain primary names", async () => {
      const tld = domainName;
      const name = `${subdomainName}.${domainName}`;

      await signAndSubmit(
        alice,
        await aptos.registerName({ name: tld, expiration: { policy: "domain" }, sender: alice }),
      );

      await signAndSubmit(
        alice,
        await aptos.registerName({ name, expiration: { policy: "subdomain:follow-domain" }, sender: alice }),
      );

      await signAndSubmit(alice, await aptos.setPrimaryName({ name, sender: alice }));

      const res = await aptos.getPrimaryName({ address: alice.accountAddress });

      expect(res).toEqual(name);
    });
  });

  describe("renewDomain", () => {
    let alice: Account;
    let bob: Account;
    let domainName: string;
    let subdomainName: string;

    beforeEach(async () => {
      alice = Account.generate();
      await aptos.fundAccount({
        accountAddress: alice.accountAddress,
        amount: 500_000_000,
      });

      bob = Account.generate();
      await aptos.fundAccount({
        accountAddress: bob.accountAddress,
        amount: 500_000_000,
      });

      domainName = randomString();
      subdomainName = randomString();
    });

    test("can renew a v2 name that is eligible for renewal", async () => {
      const name = domainName;

      await changeRouterMode(1);

      await signAndSubmit(
        alice,
        await aptos.registerName({
          name,
          expiration: { policy: "domain" },
          sender: alice,
        }),
      );

      // Change the expiration date of the name to be tomorrow
      const newExpirationDate = Math.floor(new Date(Date.now() + 24 * 60 * 60 * 1000).getDate() / 1000);
      await changeExpirationDate(1, newExpirationDate, name);

      await signAndSubmit(alice, await aptos.renewDomain({ name, sender: alice }));

      // We expect the renewed expiration time to be one year from tomorrow
      const expectedExpirationDate = (newExpirationDate + 365 * 24 * 60 * 60) * 1000;
      const res = await aptos.getExpiration({ name });
      expect(res?.toString()).toBe(expectedExpirationDate.toString());
    });

    test("throws an error for subdomain renewals", async () => {
      const tld = domainName;
      const name = `${subdomainName}.${domainName}`;

      await changeRouterMode(1);

      await signAndSubmit(
        alice,
        await aptos.registerName({
          name: tld,
          expiration: { policy: "domain" },
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

      expect(aptos.renewDomain({ name, sender: alice })).rejects.toThrow();
    });
  });

  describe("can get names", () => {
    const testnet = new Aptos(
      new AptosConfig({
        network: Network.TESTNET,
      }),
    );

    // This account has two long living domain names, each with one subdomain.
    const ACCOUNT_ADDRESS_1 = "0x24f92ae64dfcf44b2bbb3a4621515e86ad88d53d6b87f6dfe978b535621cefd4";
    const DOMAIN = "8923ulahsdjfaiu";

    test("returns all the names for an account", async () => {
      const res = await testnet.ans.getAccountNames({ accountAddress: ACCOUNT_ADDRESS_1 });
      expect(res.length).toBe(4);
    });

    test("returns only the domains for an account", async () => {
      const res = await testnet.ans.getAccountDomains({ accountAddress: ACCOUNT_ADDRESS_1 });
      expect(res.length).toBe(2);
      // None of our results should have a subdomain
      expect(res.find((name) => Boolean(name.subdomain))).toBeFalsy();
    });

    test("returns only the subdomains for an account", async () => {
      const res = await testnet.ans.getAccountSubdomains({ accountAddress: ACCOUNT_ADDRESS_1 });
      expect(res.length).toBe(2);
      // All our results should have a subdomain
      expect(res.find((name) => !name.subdomain)).toBeFalsy();
    });

    test("returns only the subdomains names for a domain", async () => {
      const res = await testnet.ans.getDomainSubdomains({ domain: DOMAIN });
      expect(res.length).toBe(1);
      // All our results should have a subdomain
      expect(res.find((name) => !name.subdomain)).toBeFalsy();
    });

    test("accommodates where, pagination, and ordering", async () => {
      let res: GetANSNameResponse;

      res = await testnet.ans.getAccountNames({
        accountAddress: ACCOUNT_ADDRESS_1,
        options: { limit: 1 },
      });
      expect(res.length).toBe(1);

      res = await testnet.ans.getAccountNames({
        accountAddress: ACCOUNT_ADDRESS_1,
        options: {
          where: {
            domain: { _eq: DOMAIN },
          },
        },
      });
      expect(res[0].domain).toBe(DOMAIN);
    });

    // TODO: When we have local testnet, test order here
  });

  describe("query an individual name", () => {
    const testnet = new Aptos(
      new AptosConfig({
        network: Network.TESTNET,
      }),
    );

    const domain = "8923ulahsdjfaiu";

    test("returns domains subdomains", async () => {
      const res1 = await testnet.ans.getName({ name: `not-a-name-${randomString()}` });
      expect(res1).toBeFalsy();

      const res2 = await testnet.ans.getName({ name: domain });
      expect(res2).toBeTruthy();
    });
  });
});
