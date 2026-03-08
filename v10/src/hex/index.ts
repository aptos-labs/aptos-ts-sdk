// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * @module hex
 *
 * Hex encoding / decoding utilities for the Aptos SDK.
 *
 * Key exports:
 * - {@link Hex} — helper class for hex data (wraps `Uint8Array`, converts to/from strings)
 * - {@link HexInput} — union type `string | Uint8Array` accepted by most SDK APIs
 * - {@link HexInvalidReason} — enum of reasons why a hex string may fail validation
 * - {@link hexToAsciiString} — decode a hex-encoded string to UTF-8
 * - {@link ParsingError} / {@link ParsingResult} — error and result types for validation
 */
export { ParsingError, type ParsingResult } from "./errors.js";
export { Hex, type HexInput, HexInvalidReason, hexToAsciiString } from "./hex.js";
