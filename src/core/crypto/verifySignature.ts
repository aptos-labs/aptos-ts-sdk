// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { AptosConfig } from "../../api/aptosConfig.js";
import { AnyPublicKeyVariant, HexInput } from "../../types/index.js";
import { PublicKey } from "./publicKey.js";
import { Signature } from "./signature.js";
import { AnyPublicKey, AnySignature } from "./singleKey.js";

/**
 * Arguments for the standalone {@link verifySignature} function.
 *
 * @param message - The message that was signed, as a hex string or Uint8Array.
 * @param signature - The signature to verify.
 * @param publicKey - The public key to verify against.
 * @group Implementation
 * @category Serialization
 */
export interface VerifyMessageSignatureArgs {
  message: HexInput;
  signature: Signature;
  publicKey: PublicKey;
}

/**
 * Arguments for the standalone {@link verifySignatureAsync} function.
 *
 * Required for signature types that depend on network state (e.g. Keyless).
 *
 * @param aptosConfig - The Aptos configuration for network calls.
 * @param message - The message that was signed, as a hex string or Uint8Array.
 * @param signature - The signature to verify.
 * @param publicKey - The public key to verify against.
 * @param options - Optional verification options.
 * @group Implementation
 * @category Serialization
 */
export interface VerifyMessageSignatureAsyncArgs extends VerifyMessageSignatureArgs {
  aptosConfig: AptosConfig;
  options?: { throwErrorWithReason?: boolean };
}

function wrapInAnySignature(signature: Signature): AnySignature {
  return signature instanceof AnySignature ? signature : new AnySignature(signature);
}

/**
 * Verifies a digital signature for a given message, automatically handling
 * all supported public key and signature types.
 *
 * This function removes the need to know the specific key type (Ed25519, Secp256k1,
 * MultiEd25519, MultiKey, etc.) before performing verification. Simply pass any
 * public key, its corresponding signature, and the original message.
 *
 * **Note:** Keyless and FederatedKeyless signatures require network state for verification.
 * Use {@link verifySignatureAsync} for those types, or when the key type is unknown and
 * may be Keyless.
 *
 * @param args - The verification arguments.
 * @param args.message - The original message that was signed.
 * @param args.signature - The signature to verify.
 * @param args.publicKey - The signer's public key.
 * @returns `true` if the signature is valid, `false` otherwise.
 * @throws Error if the public key is a Keyless variant (use `verifySignatureAsync` instead).
 *
 * @example
 * ```typescript
 * import { Ed25519PublicKey, Ed25519Signature, verifySignature } from "@aptos-labs/ts-sdk";
 *
 * const publicKey = new Ed25519PublicKey("0x...");
 * const signature = new Ed25519Signature("0x...");
 * const isValid = verifySignature({
 *   message: "hello world",
 *   signature,
 *   publicKey,
 * });
 * ```
 *
 * @example
 * ```typescript
 * import { AnyPublicKey, AnySignature, verifySignature } from "@aptos-labs/ts-sdk";
 * import { Deserializer } from "@aptos-labs/ts-sdk";
 *
 * // Deserialize BCS-encoded public key and signature from wallet
 * const publicKey = AnyPublicKey.deserialize(new Deserializer(publicKeyBytes));
 * const signature = AnySignature.deserialize(new Deserializer(signatureBytes));
 * const isValid = verifySignature({
 *   message: "hello world",
 *   signature,
 *   publicKey,
 * });
 * ```
 * @group Implementation
 * @category Serialization
 */
export function verifySignature(args: VerifyMessageSignatureArgs): boolean {
  const { message, signature, publicKey } = args;

  if (publicKey instanceof AnyPublicKey) {
    if (
      publicKey.variant === AnyPublicKeyVariant.Keyless ||
      publicKey.variant === AnyPublicKeyVariant.FederatedKeyless
    ) {
      throw new Error(
        "Keyless signatures require async verification with an AptosConfig. Use verifySignatureAsync instead.",
      );
    }
    return publicKey.verifySignature({ message, signature: wrapInAnySignature(signature) });
  }

  // For Ed25519PublicKey, Secp256k1PublicKey, MultiEd25519PublicKey, MultiKey, etc.
  // the concrete verifySignature narrows the signature type but accepts the base at runtime.
  return publicKey.verifySignature({ message, signature } as Parameters<typeof publicKey.verifySignature>[0]);
}

/**
 * Verifies a digital signature for a given message, supporting all key types
 * including those that require asynchronous network lookups (e.g. Keyless).
 *
 * This is the recommended verification function when the key type is unknown,
 * as it handles every supported type including Keyless and FederatedKeyless.
 *
 * @param args - The verification arguments.
 * @param args.aptosConfig - The Aptos network configuration (needed for Keyless verification).
 * @param args.message - The original message that was signed.
 * @param args.signature - The signature to verify.
 * @param args.publicKey - The signer's public key.
 * @param args.options - Optional settings for verification.
 * @param args.options.throwErrorWithReason - If true, throws an error with the reason for failure
 *   instead of returning false.
 * @returns `true` if the signature is valid, `false` otherwise.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, verifySignatureAsync } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 *
 * // Works with any public key type — Ed25519, Secp256k1, Keyless, MultiKey, etc.
 * const isValid = await verifySignatureAsync({
 *   aptosConfig: config,
 *   message: "hello world",
 *   signature: anySignatureObject,
 *   publicKey: anyPublicKeyObject,
 * });
 * ```
 * @group Implementation
 * @category Serialization
 */
export async function verifySignatureAsync(args: VerifyMessageSignatureAsyncArgs): Promise<boolean> {
  const { message, signature, publicKey, aptosConfig, options } = args;

  if (publicKey instanceof AnyPublicKey) {
    return publicKey.verifySignatureAsync({
      aptosConfig,
      message,
      signature: wrapInAnySignature(signature),
      options,
    });
  }

  return publicKey.verifySignatureAsync({ aptosConfig, message, signature });
}
