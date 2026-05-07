import { type GetANSNameResponse } from "./indexer";

export type RawANSName = GetANSNameResponse[0];

/**
 * The token standard for the ANS name. v1 is the original token standard, v2 is
 * the new token standard. v1 has been deprecated.
 */
export type AnsTokenStandard = "v1" | "v2";

/**
 * Policy for determining how subdomains expire in relation to their parent domain.
 */
export enum SubdomainExpirationPolicy {
  /**
   * The subdomain will expire independently of the domain. The owner of the
   * domain can manually set when the subdomain expires.
   */
  Independent = 0,
  /**
   * The subdomain will expire at the same time as the domain.
   */
  FollowsDomain = 1,
}

/**
 * The status of the name.
 */
export enum ExpirationStatus {
  /**
   * The name no longer functions as a primary or target name. It is open to
   * being claimed by the public.
   */
  Expired = "expired",
  /**
   * The name is past it's expiration date, but only claimable by the current
   * owner of the name. It does not function as a primary or target name.
   */
  InGracePeriod = "in_grace_period",
  /**
   * The name is in good standing.
   */
  Active = "active",
}

export interface AnsName extends RawANSName {
  /**
   * The domain name. ie "aptos.apt" would have a domain of "aptos"
   */
  domain: string;
  /**
   * The subdomain name, if the name is a subdomain. ie "name.aptos.apt" would have a subdomain of "name"
   */
  subdomain?: string;
  /**
   * The expiration timestamp of the name in milliseconds since epoch. Note, if
   * the name is not a subdomain, this will be the same as the domain expiration
   * timestamp.
   */
  expiration_timestamp: string;
  /**
   * The expiration timestamp of the domain in milliseconds since epoch.
   */
  domain_expiration_timestamp: string;
  /**
   * This is a derived date value. It takes into consideration if the name is a
   * subdomain and its expiration policy.
   */
  expiration: Date;

  /**
   * The status of the name's expiration.
   *
   * 1. Expired: The name has expired and is no longer resolvable.
   * 2. InGracePeriod: The name is within the grace period and is still
   *    resolvable if it is renewed.
   * 3. Active: The name is active and is resolvable.
   *
   * @see {@link ExpirationStatus}
   */
  expiration_status: ExpirationStatus;
  /**
   * The address that the name points to. For example, if you send a transaction
   * to "aptos.apt" with a target address of "0x1", the registered_address will
   * be "0x1".
   */
  registered_address?: string;
  /**
   * The token standard for the name. See {@link AnsTokenStandard} for more details.
   */
  token_standard: AnsTokenStandard;
  /**
   * If the name is registered as a primary name for _any_ account. It is
   * possible to have multiple primary names returned in a single query.
   */
  is_primary: boolean;
  /**
   * The address of the wallet that owns the name.
   */
  owner_address?: string;
  /**
   * The expiration policy for the subdomain. See {@link SubdomainExpirationPolicy} for more details.
   */
  subdomain_expiration_policy: SubdomainExpirationPolicy;
  /**
   * Whether the name is in the renewable period. This incorporates leading time
   * before the name expires and the grace period after the name expires.
   */
  isInRenewablePeriod: boolean;
}
