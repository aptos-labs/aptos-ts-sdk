// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Error thrown when parsing fails (e.g. in fromString / fromHexString).
 */
export class ParsingError<T> extends Error {
  /**
   * Programmatic reason why parsing failed (should be an enum value).
   */
  public invalidReason: T;

  constructor(message: string, invalidReason: T) {
    super(message);
    this.invalidReason = invalidReason;
  }
}

/**
 * Defensive result returned from validation functions like `isValid()`.
 * Unlike ParsingError, this is returned rather than thrown.
 */
export type ParsingResult<T> = {
  valid: boolean;
  invalidReason?: T;
  invalidReasonMessage?: string;
};
