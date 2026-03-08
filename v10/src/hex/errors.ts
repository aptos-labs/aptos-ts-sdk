// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Error thrown when parsing fails (e.g. in `fromString` / `fromHexString`).
 *
 * @typeParam T - An enum type describing the possible failure reasons.
 *
 * @example
 * ```typescript
 * throw new ParsingError("Invalid hex", HexInvalidReason.INVALID_HEX_CHARS);
 * ```
 */
export class ParsingError<T> extends Error {
  /**
   * Programmatic reason why parsing failed.
   * Should be a value from an enum such as `HexInvalidReason`.
   */
  public invalidReason: T;

  /**
   * @param message - Human-readable description of the failure.
   * @param invalidReason - Machine-readable reason code for the failure.
   */
  constructor(message: string, invalidReason: T) {
    super(message);
    this.invalidReason = invalidReason;
  }
}

/**
 * The result type returned by non-throwing validation functions such as `Hex.isValid()`.
 * When `valid` is `false`, `invalidReason` and `invalidReasonMessage` provide details.
 *
 * @typeParam T - An enum type describing the possible failure reasons.
 *
 * @example
 * ```typescript
 * const result: ParsingResult<HexInvalidReason> = Hex.isValid("0xgg");
 * if (!result.valid) {
 *   console.log(result.invalidReason);        // HexInvalidReason.INVALID_HEX_CHARS
 *   console.log(result.invalidReasonMessage); // descriptive message
 * }
 * ```
 */
export type ParsingResult<T> = {
  /** Whether the input was successfully parsed. */
  valid: boolean;
  /** Machine-readable reason for the failure (only set when `valid` is `false`). */
  invalidReason?: T;
  /** Human-readable description of the failure (only set when `valid` is `false`). */
  invalidReasonMessage?: string;
};
