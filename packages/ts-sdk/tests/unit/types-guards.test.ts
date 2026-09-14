// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  AnyPublicKeyVariant,
  TransactionResponseType,
  anyPublicKeyVariantToString,
  isBlockEpilogueTransactionResponse,
  isBlockMetadataTransactionResponse,
  isEd25519Signature,
  isFeePayerSignature,
  isGenesisTransactionResponse,
  isMultiAgentSignature,
  isMultiEd25519Signature,
  isPendingTransactionResponse,
  isSecp256k1Signature,
  isSingleSenderSignature,
  isStateCheckpointTransactionResponse,
  isUserTransactionResponse,
  isValidatorTransactionResponse,
} from "../../src/types/types.js";

describe("types/type guards", () => {
  it("anyPublicKeyVariantToString maps every known variant", () => {
    expect(anyPublicKeyVariantToString(AnyPublicKeyVariant.Ed25519)).toBe("ed25519");
    expect(anyPublicKeyVariantToString(AnyPublicKeyVariant.Secp256k1)).toBe("secp256k1");
    expect(anyPublicKeyVariantToString(AnyPublicKeyVariant.Secp256r1)).toBe("secp256r1");
    expect(anyPublicKeyVariantToString(AnyPublicKeyVariant.Keyless)).toBe("keyless");
    expect(anyPublicKeyVariantToString(AnyPublicKeyVariant.FederatedKeyless)).toBe("federated_keyless");
    expect(anyPublicKeyVariantToString(AnyPublicKeyVariant.SlhDsaSha2_128s)).toBe("slh_dsa_sha2_128s");
    expect(() => anyPublicKeyVariantToString(99 as AnyPublicKeyVariant)).toThrow("Unknown public key variant");
  });

  it("transaction response guards discriminate on response.type", () => {
    const pending = { type: TransactionResponseType.Pending } as const;
    const user = { type: TransactionResponseType.User } as const;
    const genesis = { type: TransactionResponseType.Genesis } as const;
    const blockMetadata = { type: TransactionResponseType.BlockMetadata } as const;
    const stateCheckpoint = { type: TransactionResponseType.StateCheckpoint } as const;
    const validator = { type: TransactionResponseType.Validator } as const;
    const blockEpilogue = { type: TransactionResponseType.BlockEpilogue } as const;

    expect(isPendingTransactionResponse(pending)).toBe(true);
    expect(isUserTransactionResponse(user)).toBe(true);
    expect(isGenesisTransactionResponse(genesis)).toBe(true);
    expect(isBlockMetadataTransactionResponse(blockMetadata)).toBe(true);
    expect(isStateCheckpointTransactionResponse(stateCheckpoint)).toBe(true);
    expect(isValidatorTransactionResponse(validator)).toBe(true);
    expect(isBlockEpilogueTransactionResponse(blockEpilogue)).toBe(true);

    expect(isPendingTransactionResponse(user)).toBe(false);
  });

  it("transaction signature guards discriminate on signature.type", () => {
    expect(isEd25519Signature({ type: "ed25519_signature", signature: "0x01" } as never)).toBe(true);
    expect(isSecp256k1Signature({ signature: "secp256k1_ecdsa_signature" } as never)).toBe(true);
    expect(isMultiAgentSignature({ type: "multi_agent_signature" } as never)).toBe(true);
    expect(isFeePayerSignature({ type: "fee_payer_signature" } as never)).toBe(true);
    expect(isMultiEd25519Signature({ type: "multi_ed25519_signature" } as never)).toBe(true);
    expect(isSingleSenderSignature({ type: "single_sender" } as never)).toBe(true);
    expect(isEd25519Signature({ type: "other", signature: "0x01" } as never)).toBe(false);
  });
});
