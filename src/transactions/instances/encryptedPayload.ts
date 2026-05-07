// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 as sha3Hash } from "@noble/hashes/sha3.js";
import { Deserializer } from "../../bcs/deserializer.js";
import { Serializable, Serializer } from "../../bcs/serializer.js";
import { AccountAddress } from "../../core/index.js";
import { AuthenticationKey } from "../../core/authenticationKey.js";
import { Identifier } from "./identifier.js";
import { ModuleId } from "./moduleId.js";
import { EntryFunction, TransactionExecutable } from "./transactionPayload.js";

/** 16-byte decryption nonce for encrypted payloads (aptos-core `DecryptionNonce`). */
export const DECRYPTION_NONCE_LENGTH = 16;

/**
 * Optional claim about the entry function inside an encrypted payload (`claimed_entry_fun` in aptos-core).
 * Lets fee payers and multisig co-signers see module and optionally function name without decrypting.
 *
 * BCS: `module: ModuleId` then `function: Option<Identifier>`. The REST API renames the optional field to `name`.
 */
export class ClaimedEntryFunction extends Serializable {
  public readonly moduleId: ModuleId;

  /** BCS/Rust `function`; JSON API field is `name`. */
  public readonly functionName?: Identifier;

  constructor(moduleId: ModuleId, functionName?: Identifier) {
    super();
    this.moduleId = moduleId;
    this.functionName = functionName;
  }

  serialize(serializer: Serializer): void {
    this.moduleId.serialize(serializer);
    serializer.serializeOption(this.functionName);
  }

  static deserialize(deserializer: Deserializer): ClaimedEntryFunction {
    const moduleId = ModuleId.deserialize(deserializer);
    const functionName = deserializer.deserializeOption(Identifier);
    return new ClaimedEntryFunction(moduleId, functionName);
  }

  /**
   * @param includeFunctionName - When false, only the module is claimed (`Option::None` for function on wire).
   */
  static fromEntryFunction(entry: EntryFunction, opts?: { includeFunctionName?: boolean }): ClaimedEntryFunction {
    const includeFunctionName = opts?.includeFunctionName !== false;
    return new ClaimedEntryFunction(entry.module_name, includeFunctionName ? entry.function_name : undefined);
  }
}

/**
 * BCS-serializable `DecryptedPlaintext`. Built client-side before encrypting; its BCS hash becomes `payload_hash`.
 * Matches Rust: `DecryptedPlaintext { executable, decryption_nonce: [u8; 16] }`.
 */
export class DecryptedPlaintext extends Serializable {
  executable: TransactionExecutable;

  decryptionNonce: Uint8Array;

  constructor(executable: TransactionExecutable, decryptionNonce: Uint8Array) {
    super();
    if (decryptionNonce.length !== DECRYPTION_NONCE_LENGTH) {
      throw new Error(`decryptionNonce must be ${DECRYPTION_NONCE_LENGTH} bytes`);
    }
    this.executable = executable;
    this.decryptionNonce = decryptionNonce;
  }

  serialize(serializer: Serializer): void {
    this.executable.serialize(serializer);
    serializer.serializeFixedBytes(this.decryptionNonce);
  }

  static deserialize(deserializer: Deserializer): DecryptedPlaintext {
    const executable = TransactionExecutable.deserialize(deserializer);
    const decryptionNonce = deserializer.deserializeFixedBytes(DECRYPTION_NONCE_LENGTH);
    return new DecryptedPlaintext(executable, decryptionNonce);
  }

  /**
   * Domain-separated BCS crypto hash (`BCSCryptoHash` in aptos-core):
   * SHA3-256( SHA3-256("APTOS::DecryptedPlaintext") || BCS(self) ).
   */
  hash(): Uint8Array {
    const saltHash = sha3Hash(new TextEncoder().encode("APTOS::DecryptedPlaintext"));
    const h = sha3Hash.create();
    h.update(saltHash);
    h.update(this.bcsToBytes());
    return h.digest();
  }
}

/**
 * One `(AccountAddress, AuthenticationKey)` entry in `PayloadAssociatedData::V1.signer_auth_keys` (aptos-core).
 * @internal
 */
export type SignerAuthKeyPair = {
  address: AccountAddress;
  authenticationKey: AuthenticationKey;
};

const PAYLOAD_ASSOCIATED_DATA_V1 = 0;

/**
 * AAD for batch-encrypted transaction payloads. BCS matches Rust `PayloadAssociatedData::V1`:
 * uleb128 variant | `sender` | `Vec<(AccountAddress, AuthenticationKey)>`.
 */
export class PayloadAssociatedData extends Serializable {
  constructor(
    public readonly sender: AccountAddress,
    public readonly signerAuthKeys: readonly SignerAuthKeyPair[],
  ) {
    super();
    if (signerAuthKeys.length === 0) {
      throw new Error("PayloadAssociatedData requires at least one signer auth key pair");
    }
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(PAYLOAD_ASSOCIATED_DATA_V1);
    this.sender.serialize(serializer);
    serializer.serializeU32AsUleb128(this.signerAuthKeys.length);
    for (const { address, authenticationKey } of this.signerAuthKeys) {
      address.serialize(serializer);
      authenticationKey.serialize(serializer);
    }
  }

  static deserialize(deserializer: Deserializer): PayloadAssociatedData {
    const variant = deserializer.deserializeUleb128AsU32();
    if (variant !== PAYLOAD_ASSOCIATED_DATA_V1) {
      throw new Error(`Unknown PayloadAssociatedData variant: ${variant}`);
    }
    const sender = AccountAddress.deserialize(deserializer);
    const len = deserializer.deserializeUleb128AsU32();
    const signerAuthKeys: SignerAuthKeyPair[] = [];
    for (let i = 0; i < len; i += 1) {
      signerAuthKeys.push({
        address: AccountAddress.deserialize(deserializer),
        authenticationKey: AuthenticationKey.deserialize(deserializer),
      });
    }
    return new PayloadAssociatedData(sender, signerAuthKeys);
  }
}
