// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

export {
  isValidANSSegment,
  isValidANSName,
  getANSExpirationStatus,
  getOwnerAddress,
  registerName,
  getExpiration,
  getPrimaryName,
  setPrimaryName,
  getTargetAddress,
  setTargetAddress,
  clearTargetAddress,
  getName,
  getAccountNames,
  getAccountDomains,
  getAccountSubdomains,
  getDomainSubdomains,
  getANSGracePeriod,
  renewDomain,
} from "../internal/ans";
