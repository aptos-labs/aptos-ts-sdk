// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../../api/aptosConfig.js";
import { AccountAddress, AccountAddressInput } from "../../core/index.js";
import { AuthenticationKey } from "../../core/authenticationKey.js";
import { fetchAndCacheAuthKeyForAddress } from "../../internal/account.js";
import { fetchAndCacheEncryptionKey } from "../../internal/encryptionKey.js";
import {
  ClaimedEntryFunction,
  DECRYPTION_NONCE_LENGTH,
  DecryptedPlaintext,
  PayloadAssociatedData,
  type SignerAuthKeyPair,
} from "../instances/encryptedPayload.js";
import { Identifier } from "../instances/identifier.js";
import { ModuleId } from "../instances/moduleId.js";
import {
  TransactionExecutable,
  TransactionExecutableEntryFunction,
  TransactionExtraConfig,
  TransactionExtraConfigV1,
  TransactionInnerPayloadV1,
  TransactionPayloadEncryptedPayload,
  TransactionPayloadMultiSig,
} from "../instances/transactionPayload.js";
import { HexInput } from "../../types/index.js";
import { AnyTransactionPayloadInstance, InputClaimedEntryFunction, InputGenerateTransactionOptions } from "../types.js";
import { convertPayloadToInnerPayload } from "./transactionBuilder.js";

function payloadToExecutable(payload: AnyTransactionPayloadInstance): {
  executable: TransactionExecutable;
  extraConfig: TransactionExtraConfig;
} {
  if (payload instanceof TransactionInnerPayloadV1) {
    return { executable: payload.executable, extraConfig: payload.extra_config };
  }
  const inner = convertPayloadToInnerPayload(payload) as TransactionInnerPayloadV1;
  return { executable: inner.executable, extraConfig: inner.extra_config };
}

function toClaimedEntryFunction(input: ClaimedEntryFunction | InputClaimedEntryFunction): ClaimedEntryFunction {
  if (input instanceof ClaimedEntryFunction) {
    return input;
  }
  return new ClaimedEntryFunction(
    ModuleId.fromStr(input.module),
    input.functionName !== undefined ? new Identifier(input.functionName) : undefined,
  );
}

function assertClaimMatchesExecutable(payload: AnyTransactionPayloadInstance, claim: ClaimedEntryFunction): void {
  const { executable } = payloadToExecutable(payload);
  if (!(executable instanceof TransactionExecutableEntryFunction)) {
    throw new Error("claimedEntryFunction is only valid when the plaintext executable is an entry function.");
  }
  const entry = executable.entryFunction;
  if (
    !entry.module_name.address.equals(claim.moduleId.address) ||
    entry.module_name.name.identifier !== claim.moduleId.name.identifier
  ) {
    throw new Error("claimedEntryFunction.module must match the entry function module.");
  }
  if (claim.functionName !== undefined && entry.function_name.identifier !== claim.functionName.identifier) {
    throw new Error("claimedEntryFunction.functionName must match the entry function name when provided.");
  }
}

function payloadHasMultisigAddress(payload: AnyTransactionPayloadInstance): boolean {
  if (payload instanceof TransactionPayloadMultiSig) {
    return true;
  }
  if (payload instanceof TransactionInnerPayloadV1) {
    const ec = payload.extra_config;
    return ec instanceof TransactionExtraConfigV1 && ec.multisigAddress !== undefined;
  }
  return false;
}

function resolveClaimedEntryFun(args: {
  payload: AnyTransactionPayloadInstance;
  feePayerAddress?: AccountAddressInput;
  options: InputGenerateTransactionOptions;
}): ClaimedEntryFunction | undefined {
  const { payload, feePayerAddress, options } = args;
  // Unlike buildSignerAuthKeys, we treat a zero feePayerAddress (deferred gas-station sponsor) the
  // same as a real one: a fee payer *will* sign, so include claimed_entry_fun so they can inspect
  // the payload without decrypting it. The zero check in buildSignerAuthKeys is different — adding
  // a placeholder zero auth key to the cryptographic AAD would corrupt it.
  const hasFeePayer = feePayerAddress !== undefined;
  if (!hasFeePayer && !payloadHasMultisigAddress(payload)) {
    return undefined;
  }
  if (options.claimedEntryFunction !== undefined) {
    const claim = toClaimedEntryFunction(options.claimedEntryFunction);
    assertClaimMatchesExecutable(payload, claim);
    return claim;
  }
  const { executable } = payloadToExecutable(payload);
  if (executable instanceof TransactionExecutableEntryFunction) {
    return ClaimedEntryFunction.fromEntryFunction(executable.entryFunction);
  }
  return undefined;
}

function resolveAuthKey(input: AuthenticationKey | HexInput): AuthenticationKey {
  if (input instanceof AuthenticationKey) {
    return input;
  }
  return new AuthenticationKey({ data: input });
}

/**
 * Assembles `(address, authenticationKey)` pairs in `TransactionAuthenticator::all_signer_auth_keys` order
 * (sender, secondaries, fee payer last). Auth keys not supplied in `options` are fetched from chain via
 * `fetchAndCacheAuthKeyForAddress`, which caches per `(network, address)` for ~1 hour.
 */
async function buildSignerAuthKeys(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddress;
  options: InputGenerateTransactionOptions;
  feePayerAddress?: AccountAddressInput;
  secondarySignerAddresses?: AccountAddressInput[];
}): Promise<{ sender: SignerAuthKeyPair; additional: SignerAuthKeyPair[] | undefined }> {
  const { aptosConfig, sender, options, feePayerAddress, secondarySignerAddresses } = args;

  const secondaryAddrs = secondarySignerAddresses ?? [];
  const secondaryAuthInputs = options.secondarySignerAuthenticationKeys;
  if (secondaryAddrs.length === 0 && secondaryAuthInputs !== undefined && secondaryAuthInputs.length > 0) {
    throw new Error(
      "options.secondarySignerAuthenticationKeys was set but no secondarySignerAddresses were provided to generateRawTransaction.",
    );
  }
  if (
    secondaryAddrs.length > 0 &&
    secondaryAuthInputs !== undefined &&
    secondaryAuthInputs.length !== secondaryAddrs.length
  ) {
    throw new Error(
      "Encrypted multi-agent transactions require options.secondarySignerAuthenticationKeys (when provided) to have one entry per secondarySignerAddresses entry, in the same order. " +
        "Leave individual entries undefined to fetch them from chain.",
    );
  }

  const feePayerAddr = feePayerAddress !== undefined ? AccountAddress.from(feePayerAddress) : undefined;
  const hasNonZeroFeePayer = feePayerAddr !== undefined && !feePayerAddr.equals(AccountAddress.ZERO);
  if (options.feePayerAuthenticationKey !== undefined && !hasNonZeroFeePayer) {
    throw new Error(
      "options.feePayerAuthenticationKey was set but feePayerAddress is missing or the zero address (no on-chain fee payer for AAD).",
    );
  }

  const resolveFor = async (
    address: AccountAddress,
    input: AuthenticationKey | HexInput | undefined,
  ): Promise<AuthenticationKey> => {
    if (input !== undefined) {
      return resolveAuthKey(input);
    }
    return fetchAndCacheAuthKeyForAddress({ aptosConfig, accountAddress: address });
  };

  const secondaryPairsPromise = Promise.all(
    secondaryAddrs.map(async (addr, i) => {
      const address = AccountAddress.from(addr);
      const authenticationKey = await resolveFor(address, secondaryAuthInputs?.[i]);
      return { address, authenticationKey };
    }),
  );

  const [senderAuthKey, secondaryPairs, feePayerAuthKey] = await Promise.all([
    resolveFor(sender, options.senderAuthenticationKey),
    secondaryPairsPromise,
    hasNonZeroFeePayer ? resolveFor(feePayerAddr, options.feePayerAuthenticationKey) : Promise.resolve(undefined),
  ]);

  const senderPair: SignerAuthKeyPair = { address: sender, authenticationKey: senderAuthKey };
  const additional: SignerAuthKeyPair[] = [...secondaryPairs];
  if (hasNonZeroFeePayer && feePayerAuthKey !== undefined) {
    additional.push({ address: feePayerAddr, authenticationKey: feePayerAuthKey });
  }
  return { sender: senderPair, additional: additional.length > 0 ? additional : undefined };
}

/**
 * Encrypts an entry-function/script/inner payload using the node's per-epoch batch encryption key.
 * Validates `options.encrypted` requirements first.
 *
 * @group Implementation
 * @category Transactions
 */
export async function buildEncryptedPayload(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  payload: AnyTransactionPayloadInstance;
  options: InputGenerateTransactionOptions;
  feePayerAddress?: AccountAddressInput;
  secondarySignerAddresses?: AccountAddressInput[];
  replayProtectionNonce?: bigint;
}): Promise<TransactionPayloadEncryptedPayload> {
  const { aptosConfig, sender, payload, options, feePayerAddress, secondarySignerAddresses, replayProtectionNonce } =
    args;

  const senderAddr = AccountAddress.from(sender);
  const { sender: senderPair, additional } = await buildSignerAuthKeys({
    aptosConfig,
    sender: senderAddr,
    options,
    feePayerAddress,
    secondarySignerAddresses,
  });
  const claimedEntryFunction = resolveClaimedEntryFun({ payload, feePayerAddress, options });

  const encryption = await fetchAndCacheEncryptionKey({ aptosConfig });
  if (!encryption) {
    throw new Error(
      "Encrypted transactions requested but the node does not provide an encryption key. " +
        "Ensure the node supports encrypted transaction submission.",
    );
  }
  const { key: encryptionKey, epoch: encryptionEpoch } = encryption;

  const { executable, extraConfig: baseExtraConfig } = payloadToExecutable(payload);
  let extraConfig: TransactionExtraConfig = baseExtraConfig;
  if (replayProtectionNonce !== undefined && extraConfig instanceof TransactionExtraConfigV1) {
    extraConfig = new TransactionExtraConfigV1(extraConfig.multisigAddress, replayProtectionNonce);
  }

  const decryptionNonce = new Uint8Array(DECRYPTION_NONCE_LENGTH);
  crypto.getRandomValues(decryptionNonce);
  const decryptedPayload = new DecryptedPlaintext(executable, decryptionNonce);
  const associatedData = new PayloadAssociatedData(senderAddr, [senderPair, ...(additional ?? [])]);
  const ciphertext = encryptionKey.encrypt(decryptedPayload, associatedData);

  return new TransactionPayloadEncryptedPayload(
    ciphertext,
    extraConfig,
    decryptedPayload.hash(),
    encryptionEpoch,
    claimedEntryFunction,
  );
}
