// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  isValidANSSegment,
  isValidANSName,
  getANSExpirationStatus,
  VALIDATION_RULES_DESCRIPTION,
} from "../../../src/internal/ans.js";
import { ExpirationStatus, SubdomainExpirationPolicy, type RawANSName } from "../../../src/types/index.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { AptosConfig } from "../../../src/api/aptosConfig.js";

const aptosConfig = new AptosConfig({ network: Network.LOCAL });

describe("internal/ans pure helpers", () => {
  describe("isValidANSSegment", () => {
    it.each([
      ["empty string", "", false],
      ["one character", "a", false],
      ["two characters", "ab", false],
      ["minimum three characters", "abc", true],
      ["normal name", "alice", true],
      ["name with digits", "user123", true],
      ["name with hyphen in middle", "ali-ce", true],
      ["starts with hyphen", "-alice", false],
      ["ends with hyphen", "alice-", false],
      ["only hyphens", "-----", false],
      ["uppercase letters", "Alice", false],
      ["max 63 chars", "a".repeat(63), true],
      ["64 chars (too long)", "a".repeat(64), false],
    ])("%s → %s", (_label, input, expected) => {
      expect(isValidANSSegment(input)).toBe(expected);
    });

    it("emoji and non-ascii fail (regex anchors to a-z/0-9 only)", () => {
      expect(isValidANSSegment("alicé")).toBe(false);
      expect(isValidANSSegment("\u{1f600}aa")).toBe(false);
    });
  });

  describe("isValidANSName", () => {
    it("parses a bare domain", () => {
      expect(isValidANSName("alice")).toEqual({ domainName: "alice", subdomainName: undefined });
    });

    it("parses a subdomain.domain", () => {
      expect(isValidANSName("bob.alice")).toEqual({ domainName: "alice", subdomainName: "bob" });
    });

    it("strips a trailing .apt before parsing", () => {
      expect(isValidANSName("alice.apt")).toEqual({ domainName: "alice", subdomainName: undefined });
      expect(isValidANSName("bob.alice.apt")).toEqual({ domainName: "alice", subdomainName: "bob" });
    });

    it("rejects more than two segments", () => {
      expect(() => isValidANSName("a.b.c")).toThrow(/A name can only have two parts/);
    });

    it("rejects an invalid first segment with the validation-rules description in the message", () => {
      expect(() => isValidANSName("ab")).toThrow(new RegExp(VALIDATION_RULES_DESCRIPTION.split(",")[0]));
    });

    it("rejects an invalid second segment", () => {
      expect(() => isValidANSName("alice.ab")).toThrow(/ab is not valid/);
    });
  });

  describe("getANSExpirationStatus", () => {
    const now = () => Date.now();
    const future = () => new Date(now() + 24 * 60 * 60 * 1000).toISOString();
    const farPast = () => new Date(now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const gracePeriod = 60 * 60; // 1 hour, in seconds

    function base(overrides: Partial<RawANSName> = {}): RawANSName {
      return {
        domain: "alice",
        subdomain: null,
        owner_address: "0x1",
        registered_address: "0x1",
        expiration_timestamp: future(),
        token_standard: "v2",
        is_primary: false,
        subdomain_expiration_policy: null,
        domain_expiration_timestamp: future(),
        ...overrides,
      } as unknown as RawANSName;
    }

    it("returns Expired when the input is falsy", () => {
      expect(getANSExpirationStatus({ name: null as unknown as RawANSName, aptosConfig, gracePeriod })).toBe(
        ExpirationStatus.Expired,
      );
    });

    it("returns Active for a TLD whose expiration is in the future", () => {
      expect(getANSExpirationStatus({ name: base(), aptosConfig, gracePeriod })).toBe(ExpirationStatus.Active);
    });

    it("returns InGracePeriod when name is just-expired but within grace window", () => {
      const name = base({
        // Expired 30 minutes ago, grace period is 60 minutes → still in grace.
        expiration_timestamp: new Date(now() - 30 * 60 * 1000).toISOString(),
      });
      expect(getANSExpirationStatus({ name, aptosConfig, gracePeriod })).toBe(ExpirationStatus.InGracePeriod);
    });

    it("returns Expired when name is past the grace window", () => {
      expect(
        getANSExpirationStatus({ name: base({ expiration_timestamp: farPast() }), aptosConfig, gracePeriod }),
      ).toBe(ExpirationStatus.Expired);
    });

    it("subdomain inherits Expired when TLD is fully expired (past grace)", () => {
      const sub = base({
        subdomain: "bob",
        expiration_timestamp: future(),
        domain_expiration_timestamp: farPast(),
        subdomain_expiration_policy: SubdomainExpirationPolicy.Independent,
      });
      expect(getANSExpirationStatus({ name: sub, aptosConfig, gracePeriod })).toBe(ExpirationStatus.Expired);
    });

    it("subdomain with FollowsDomain policy is InGracePeriod when TLD is in grace", () => {
      const sub = base({
        subdomain: "bob",
        expiration_timestamp: future(),
        // TLD expired 30 minutes ago → in 1h grace.
        domain_expiration_timestamp: new Date(now() - 30 * 60 * 1000).toISOString(),
        subdomain_expiration_policy: SubdomainExpirationPolicy.FollowsDomain,
      });
      expect(getANSExpirationStatus({ name: sub, aptosConfig, gracePeriod })).toBe(ExpirationStatus.InGracePeriod);
    });

    it("subdomain with FollowsDomain returns Active when both TLD and subdomain are alive", () => {
      const sub = base({
        subdomain: "bob",
        subdomain_expiration_policy: SubdomainExpirationPolicy.FollowsDomain,
      });
      expect(getANSExpirationStatus({ name: sub, aptosConfig, gracePeriod })).toBe(ExpirationStatus.Active);
    });

    it("subdomain with Independent policy is Expired when its own ts is past grace, even if TLD is alive", () => {
      const sub = base({
        subdomain: "bob",
        expiration_timestamp: farPast(),
        domain_expiration_timestamp: future(),
        subdomain_expiration_policy: SubdomainExpirationPolicy.Independent,
      });
      expect(getANSExpirationStatus({ name: sub, aptosConfig, gracePeriod })).toBe(ExpirationStatus.Expired);
    });
  });
});
