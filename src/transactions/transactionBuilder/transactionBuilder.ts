// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file handles the transaction creation lifecycle.
 * It holds different operations to generate a transaction payload, a raw transaction,
 * and a signed transaction that can be simulated, signed and submitted to chain.
 */
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3.js";
import { AptosConfig } from "../../api/aptosConfig.js";
import { MAX_U64_BIG_INT } from "../../bcs/consts.js";
import { AccountAddress, AccountAddressInput, Hex, PublicKey } from "../../core/index.js";
import { AuthenticationKey } from "../../core/authenticationKey.js";
import {
  AnyPublicKey,
  AnySignature,
  Secp256k1PublicKey,
  MultiKey,
  MultiKeySignature,
} from "../../core/crypto/index.js";
import { AnyPublicKeyVariant } from "../../types/index.js";
import { Ed25519PublicKey, Ed25519Signature } from "../../core/crypto/ed25519.js";
import { getInfo } from "../../internal/utils/index.js";
import { getLedgerInfo } from "../../internal/general.js";
import { fetchAndCacheEncryptionKey } from "../../internal/encryptionKey.js";
import { getGasPriceEstimation } from "../../internal/transaction.js";
import { NetworkToChainId } from "../../utils/apiEndpoints.js";
import { MIN_MAX_GAS_AMOUNT, TEXT_ENCODER } from "../../utils/const.js";
import { normalizeBundle } from "../../utils/normalizeBundle.js";
import {
  AccountAuthenticator,
  AccountAuthenticatorEd25519,
  AccountAuthenticatorMultiEd25519,
  AccountAuthenticatorMultiKey,
  AccountAuthenticatorNoAccountAuthenticator,
  AccountAuthenticatorSingleKey,
} from "../authenticator/account.js";
import {
  TransactionAuthenticator,
  TransactionAuthenticatorEd25519,
  TransactionAuthenticatorFeePayer,
  TransactionAuthenticatorMultiAgent,
  TransactionAuthenticatorMultiEd25519,
  TransactionAuthenticatorSingleSender,
} from "../authenticator/transaction.js";
import {
  ChainId,
  EntryFunction,
  FeePayerRawTransaction,
  MultiAgentRawTransaction,
  MultiSig,
  MultiSigTransactionPayload,
  RawTransaction,
  Script,
  TransactionInnerPayload,
  TransactionPayloadEntryFunction,
  TransactionPayloadMultiSig,
  TransactionPayloadScript,
} from "../instances/index.js";
import { Identifier } from "../instances/identifier.js";
import { ModuleId } from "../instances/moduleId.js";
import { ClaimedEntryFunction } from "../instances/transactionPayload.js";
import { SignedTransaction } from "../instances/signedTransaction.js";
import {
  AnyRawTransaction,
  AnyTransactionPayloadInstance,
  EntryFunctionArgumentTypes,
  InputGenerateMultiAgentRawTransactionArgs,
  InputGenerateRawTransactionArgs,
  InputGenerateSingleSignerRawTransactionArgs,
  InputGenerateTransactionOptions,
  InputScriptData,
  InputSimulateTransactionData,
  InputMultiSigDataWithRemoteABI,
  InputEntryFunctionDataWithRemoteABI,
  InputGenerateTransactionPayloadDataWithRemoteABI,
  InputSubmitTransactionData,
  InputGenerateTransactionPayloadDataWithABI,
  InputEntryFunctionDataWithABI,
  InputMultiSigDataWithABI,
  InputViewFunctionDataWithRemoteABI,
  InputViewFunctionDataWithABI,
  FunctionABI,
  InputClaimedEntryFunction,
} from "../types.js";
import { convertArgument, fetchEntryFunctionAbi, fetchViewFunctionAbi, standardizeTypeTags } from "./remoteAbi.js";
import { memoizeAsync } from "../../utils/memoize.js";
import { isScriptDataInput } from "./helpers.js";
import { SimpleTransaction } from "../instances/simpleTransaction.js";
import { MultiAgentTransaction } from "../instances/multiAgentTransaction.js";
import { getFunctionParts } from "../../utils/helpers.js";
import {
  DecryptedPlaintext,
  DECRYPTION_NONCE_LENGTH,
  PayloadAssociatedData,
  TransactionExecutable,
  TransactionExecutableEmpty,
  TransactionExecutableEntryFunction,
  TransactionExecutableScript,
  TransactionExtraConfig,
  TransactionExtraConfigV1,
  TransactionExtraConfigV2,
  TransactionInnerPayloadV1,
  TransactionPayloadEncryptedPayload,
} from "../instances/transactionPayload.js";

/**
 * Builds a transaction payload based on the provided arguments and returns a transaction payload.
 * This function uses the RemoteABI by default, but can also utilize a specified ABI.
 * When we call our `generateTransactionPayload` function with the relevant type properties,
 * Typescript can infer the return type based on the appropriate function overload.
 * @param args - The input data for generating the transaction payload.
 * @param args.function - The function to be called, specified in the format "moduleAddress::moduleName::functionName".
 * @param args.functionArguments - The arguments to pass to the function.
 * @param args.typeArguments - The type arguments for the function.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.abi - The ABI to use for the transaction, if not using the RemoteABI.
 *
 * @returns TransactionPayload - The generated transaction payload, which can be of type TransactionPayloadScript,
 * TransactionPayloadMultiSig, or TransactionPayloadEntryFunction.
 * @group Implementation
 * @category Transactions
 */
export async function generateTransactionPayload(args: InputScriptData): Promise<TransactionPayloadScript>;
/**
 * @group Implementation
 * @category Transactions
 */
export async function generateTransactionPayload(
  args: InputEntryFunctionDataWithRemoteABI,
): Promise<TransactionPayloadEntryFunction>;
/**
 * @group Implementation
 * @category Transactions
 */
export async function generateTransactionPayload(
  args: InputMultiSigDataWithRemoteABI,
): Promise<TransactionPayloadMultiSig>;

/**
 * Builds a transaction payload based on the data argument and returns
 * a transaction payload - TransactionPayloadScript | TransactionPayloadMultiSig | TransactionPayloadEntryFunction
 *
 * This uses the RemoteABI by default, and the remote ABI can be skipped by using generateTransactionPayloadWithABI
 *
 * @param args.data GenerateTransactionPayloadData
 *
 * @return TransactionPayload
 * @group Implementation
 * @category Transactions
 */
export async function generateTransactionPayload(
  args: InputGenerateTransactionPayloadDataWithRemoteABI,
): Promise<AnyTransactionPayloadInstance> {
  if (isScriptDataInput(args)) {
    const scriptPayload = generateTransactionPayloadScript(args);
    // If multisigAddress is present, wrap the script in a multisig payload
    if ("multisigAddress" in args) {
      const multisigAddress = AccountAddress.from(args.multisigAddress);
      return new TransactionPayloadMultiSig(
        new MultiSig(multisigAddress, new MultiSigTransactionPayload(scriptPayload.script)),
      );
    }
    return scriptPayload;
  }
  const { moduleAddress, moduleName, functionName } = getFunctionParts(args.function);

  const functionAbi = await fetchAbi({
    key: "entry-function",
    moduleAddress,
    moduleName,
    functionName,
    aptosConfig: args.aptosConfig,
    abi: args.abi,
    fetch: fetchEntryFunctionAbi,
  });

  // Fill in the ABI
  return generateTransactionPayloadWithABI({ ...args, abi: functionAbi });
}

/**
 * Generates a transaction payload using the provided ABI and function details.
 * This function helps create a properly structured transaction payload for executing a specific function on a module.
 *
 * @param args - The input data required to generate the transaction payload.
 * @param args.abi - The ABI of the function to be executed.
 * @param args.function - The fully qualified name of the function in the format `moduleAddress::moduleName::functionName`.
 * @param args.typeArguments - An array of type arguments that correspond to the function's type parameters.
 * @param args.functionArguments - An array of arguments to be passed to the function.
 * @param args.multisigAddress - (Optional) The address for a multisig transaction if applicable.
 *
 * @throws Error if the type argument count does not match the ABI or if the number of function arguments is incorrect.
 * @group Implementation
 * @category Transactions
 */
export function generateTransactionPayloadWithABI(args: InputEntryFunctionDataWithABI): TransactionPayloadEntryFunction;
/**
 * @group Implementation
 * @category Transactions
 */
export function generateTransactionPayloadWithABI(args: InputMultiSigDataWithABI): TransactionPayloadMultiSig;
/**
 * @group Implementation
 * @category Transactions
 */
export function generateTransactionPayloadWithABI(
  args: InputGenerateTransactionPayloadDataWithABI,
): AnyTransactionPayloadInstance {
  const functionAbi = args.abi;
  const { moduleAddress, moduleName, functionName } = getFunctionParts(args.function);

  // Ensure that all type arguments are typed properly
  const typeArguments = standardizeTypeTags(args.typeArguments);

  // Check the type argument count against the ABI
  if (typeArguments.length !== functionAbi.typeParameters.length) {
    throw new Error(
      `Type argument count mismatch, expected ${functionAbi.typeParameters.length}, received ${typeArguments.length}`,
    );
  }

  // Check all BCS types, and convert any non-BCS types
  const functionArguments: Array<EntryFunctionArgumentTypes> | undefined = args.functionArguments?.map((arg, i) =>
    /**
     * Converts the argument for a specified function using its ABI and type arguments.
     * This function helps ensure that the correct number of arguments is provided for the function call.
     *
     * @param args - The arguments for the function call.
     * @param args.function - The specific function to be invoked.
     * @param functionAbi - The ABI (Application Binary Interface) of the function, which includes parameter details.
     * @param arg - The argument to be converted.
     * @param i - The index of the argument in the function call.
     * @param typeArguments - Additional type arguments that may be required for the conversion.
     * @group Implementation
     * @category Transactions
     */
    // TODO: Fix JSDoc
    convertArgument(args.function, functionAbi, arg, i, typeArguments),
  );

  // Check that all arguments are accounted for
  if ((functionArguments?.length ?? 0) !== functionAbi.parameters.length) {
    throw new Error(
      `Too few arguments for '${moduleAddress}::${moduleName}::${functionName}', expected ${functionAbi.parameters.length} but got ${functionArguments?.length ?? 0}`,
    );
  }

  // Generate entry function payload
  const entryFunctionPayload = EntryFunction.build(
    `${moduleAddress}::${moduleName}`,
    functionName,
    typeArguments,
    functionArguments ?? [],
  );

  // Send it as multi sig if it's a multisig payload
  if ("multisigAddress" in args) {
    const multisigAddress = AccountAddress.from(args.multisigAddress);
    return new TransactionPayloadMultiSig(
      new MultiSig(multisigAddress, new MultiSigTransactionPayload(entryFunctionPayload)),
    );
  }

  // Otherwise send as an entry function
  return new TransactionPayloadEntryFunction(entryFunctionPayload);
}

/**
 * Generates the payload for a view function call using the provided arguments.
 * This function helps in preparing the necessary data to interact with a specific view function on the blockchain.
 *
 * @param args - The input data required to generate the view function payload.
 * @param args.function - The function identifier in the format "moduleAddress::moduleName::functionName".
 * @param args.aptosConfig - Configuration settings for the Aptos client.
 * @param args.abi - The ABI (Application Binary Interface) of the module.
 *
 * @returns The generated payload for the view function call.
 * @group Implementation
 * @category Transactions
 */
export async function generateViewFunctionPayload(args: InputViewFunctionDataWithRemoteABI): Promise<EntryFunction> {
  const { moduleAddress, moduleName, functionName } = getFunctionParts(args.function);

  const functionAbi = await fetchAbi({
    key: "view-function",
    moduleAddress,
    moduleName,
    functionName,
    aptosConfig: args.aptosConfig,
    abi: args.abi,
    fetch: fetchViewFunctionAbi,
  });

  // Fill in the ABI
  return generateViewFunctionPayloadWithABI({ abi: functionAbi, ...args });
}

/**
 * Generates a payload for a view function call using the provided ABI and arguments.
 * This function ensures that the type arguments and function arguments are correctly formatted
 * and match the expected counts as defined in the ABI.
 *
 * @param args - The input data for generating the view function payload.
 * @param args.abi - The ABI of the function to be called.
 * @param args.function - The full name of the function in the format "moduleAddress::moduleName::functionName".
 * @param args.typeArguments - An array of type arguments to be used in the function call.
 * @param args.functionArguments - An array of arguments to be passed to the function.
 *
 * @throws Error if the type argument count does not match the ABI or if the function arguments
 * do not match the expected parameters defined in the ABI.
 * @group Implementation
 * @category Transactions
 */
export function generateViewFunctionPayloadWithABI(args: InputViewFunctionDataWithABI): EntryFunction {
  const functionAbi = args.abi;
  const { moduleAddress, moduleName, functionName } = getFunctionParts(args.function);

  // Ensure that all type arguments are typed properly
  const typeArguments = standardizeTypeTags(args.typeArguments);

  // Check the type argument count against the ABI
  if (typeArguments.length !== functionAbi.typeParameters.length) {
    throw new Error(
      `Type argument count mismatch, expected ${functionAbi.typeParameters.length}, received ${typeArguments.length}`,
    );
  }

  // Check all BCS types, and convert any non-BCS types
  const functionArguments: Array<EntryFunctionArgumentTypes> =
    args?.functionArguments?.map((arg, i) => convertArgument(args.function, functionAbi, arg, i, typeArguments)) ?? [];

  // Check that all arguments are accounted for
  if (functionArguments.length !== functionAbi.parameters.length) {
    throw new Error(
      `Too few arguments for '${moduleAddress}::${moduleName}::${functionName}', expected ${functionAbi.parameters.length} but got ${functionArguments.length}`,
    );
  }

  // Generate entry function payload
  return EntryFunction.build(`${moduleAddress}::${moduleName}`, functionName, typeArguments, functionArguments);
}

/**
 * Generates a transaction payload script based on the provided input data.
 * This function helps in creating a structured script for transaction processing.
 *
 * @param args - The input data required to generate the transaction payload script.
 * @param args.bytecode - The bytecode to be converted into a Uint8Array.
 * @param args.typeArguments - The type arguments that will be standardized.
 * @param args.functionArguments - The arguments for the function being called.
 * @returns A new instance of TransactionPayloadScript.
 * @group Implementation
 * @category Transactions
 */
function generateTransactionPayloadScript(args: InputScriptData) {
  return new TransactionPayloadScript(
    new Script(
      Hex.fromHexInput(args.bytecode).toUint8Array(),
      standardizeTypeTags(args.typeArguments),
      args.functionArguments,
    ),
  );
}

/**
 * Generates a raw transaction that can be sent to the Aptos network.
 *
 * @param args - The arguments for generating the raw transaction.
 * @param args.aptosConfig - The configuration for the Aptos network.
 * @param args.sender - The transaction's sender account address as a hex input.
 * @param args.payload - The transaction payload, which can be created using generateTransactionPayload().
 * @param args.options - Optional parameters for transaction generation.
 * @param args.feePayerAddress - The address of the fee payer for sponsored transactions.
 *
 * @returns RawTransaction - The generated raw transaction.
 * @group Implementation
 * @category Transactions
 */
export async function generateRawTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  payload: AnyTransactionPayloadInstance;
  options?: InputGenerateTransactionOptions;
  feePayerAddress?: AccountAddressInput;
  /**
   * When building an encrypted multi-agent transaction, secondary signer addresses (same order as
   * `options.secondarySignerAuthenticationKeys`).
   */
  secondarySignerAddresses?: AccountAddressInput[];
}): Promise<RawTransaction> {
  const { aptosConfig, sender, payload, options, feePayerAddress, secondarySignerAddresses } = args;

  if (options?.replayProtectionNonce !== undefined && options?.accountSequenceNumber !== undefined) {
    throw new Error("Cannot specify both replayProtectionNonce and accountSequenceNumber in options.");
  }

  const getChainId = async () => {
    if (NetworkToChainId[aptosConfig.network]) {
      return { chainId: NetworkToChainId[aptosConfig.network] };
    }
    const info = await getLedgerInfo({ aptosConfig });
    return { chainId: info.chain_id };
  };

  const getGasUnitPrice = async () => {
    if (options?.gasUnitPrice) {
      return { gasEstimate: options.gasUnitPrice };
    }
    const estimation = await getGasPriceEstimation({ aptosConfig });
    return { gasEstimate: estimation.gas_estimate };
  };

  const getSequenceNumberForAny = async () => {
    const getSequenceNumber = async () => {
      if (options?.accountSequenceNumber !== undefined) {
        return options.accountSequenceNumber;
      }
      if (options?.replayProtectionNonce !== undefined) {
        // Orderless: chain uses sequence_number = u64::MAX and replay protection via
        // extra_config.replay_protection_nonce (see RawTransaction::replay_protector in aptos-core).
        return MAX_U64_BIG_INT;
      }

      return (await getInfo({ aptosConfig, accountAddress: sender })).sequence_number;
    };

    /**
     * Check if is sponsored transaction to honor AIP-52
     * {@link https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-52.md}
     * @group Implementation
     * @category Transactions
     */
    if (feePayerAddress && AccountAddress.from(feePayerAddress).equals(AccountAddress.ZERO)) {
      // Handle sponsored transaction generation with the option that
      // the main signer has not been created on chain
      try {
        // Check if main signer has been created on chain, if not assign sequence number 0
        return await getSequenceNumber();
      } catch {
        return 0;
      }
    } else {
      return getSequenceNumber();
    }
  };
  const [{ chainId }, { gasEstimate }, sequenceNumber] = await Promise.all([
    getChainId(),
    getGasUnitPrice(),
    getSequenceNumberForAny(),
  ]);

  const userMaxGas = options?.maxGasAmount
    ? BigInt(options.maxGasAmount)
    : BigInt(aptosConfig.getDefaultMaxGasAmount());
  const { maxGasAmount, gasUnitPrice, expireTimestamp, replayProtectionNonce } = {
    maxGasAmount: userMaxGas < BigInt(MIN_MAX_GAS_AMOUNT) ? BigInt(MIN_MAX_GAS_AMOUNT) : userMaxGas,
    gasUnitPrice: options?.gasUnitPrice ?? BigInt(gasEstimate),
    expireTimestamp:
      options?.expireTimestamp ?? BigInt(Math.floor(Date.now() / 1000) + aptosConfig.getDefaultTxnExpirySecFromNow()),
    replayProtectionNonce:
      options?.replayProtectionNonce !== undefined && options?.replayProtectionNonce !== null
        ? BigInt(options.replayProtectionNonce)
        : undefined,
  };

  // If encryption requested, encrypt the original payload (before inner-payload conversion).
  // The encrypted payload carries its own extra_config with the replay nonce.
  let txnPayload: AnyTransactionPayloadInstance = payload;
  if (options?.encrypted) {
    if (options.authenticationKey === undefined) {
      throw new Error(
        "options.authenticationKey is required when options.encrypted is true (32-byte auth key hex; must match the signing authenticator).",
      );
    }
    const secondaryAddrs = secondarySignerAddresses ?? [];
    const secondaryAuthHex = options.secondarySignerAuthenticationKeys;
    if (secondaryAddrs.length > 0) {
      if (!secondaryAuthHex || secondaryAuthHex.length !== secondaryAddrs.length) {
        throw new Error(
          "Encrypted multi-agent transactions require options.secondarySignerAuthenticationKeys with one 32-byte auth key per secondarySignerAddresses entry, in the same order.",
        );
      }
    } else if (secondaryAuthHex !== undefined && secondaryAuthHex.length > 0) {
      throw new Error(
        "options.secondarySignerAuthenticationKeys was set but no secondarySignerAddresses were provided to generateRawTransaction.",
      );
    }
    const authenticationKey = new AuthenticationKey({ data: options.authenticationKey });
    const claimedEntryFun = resolveClaimedEntryFunForEncryptedTransaction({
      payload,
      feePayerAddress,
      options,
    });
    const additionalSignerAuthKeys =
      secondaryAddrs.length > 0 && secondaryAuthHex
        ? secondaryAddrs.map((addr, i) => ({
            address: AccountAddress.from(addr),
            authenticationKey: new AuthenticationKey({ data: secondaryAuthHex[i]! }),
          }))
        : undefined;
    txnPayload = await encryptTransactionPayload({
      aptosConfig,
      sender: AccountAddress.from(sender),
      payload,
      replayProtectionNonce,
      claimedEntryFun,
      authenticationKey,
      additionalSignerAuthKeys,
    });
  } else if (replayProtectionNonce !== undefined) {
    txnPayload = convertPayloadToInnerPayload(payload, replayProtectionNonce);
  }

  return new RawTransaction(
    AccountAddress.from(sender),
    BigInt(sequenceNumber),
    txnPayload,
    BigInt(maxGasAmount),
    BigInt(gasUnitPrice),
    BigInt(expireTimestamp),
    new ChainId(chainId),
  );
}

export function convertPayloadToInnerPayload(
  payload: AnyTransactionPayloadInstance,
  replayProtectionNonce?: bigint,
): TransactionInnerPayload {
  if (payload instanceof TransactionPayloadScript) {
    return new TransactionInnerPayloadV1(
      new TransactionExecutableScript(payload.script),
      new TransactionExtraConfigV1(undefined, replayProtectionNonce),
    );
  }
  if (payload instanceof TransactionPayloadEntryFunction) {
    return new TransactionInnerPayloadV1(
      new TransactionExecutableEntryFunction(payload.entryFunction),
      new TransactionExtraConfigV1(undefined, replayProtectionNonce),
    );
  }
  if (payload instanceof TransactionPayloadMultiSig) {
    const innerPayload = payload.multiSig.transaction_payload;
    let executable: TransactionExecutable;
    if (innerPayload === undefined || innerPayload?.transaction_payload === undefined) {
      executable = new TransactionExecutableEmpty();
    } else if (innerPayload.transaction_payload instanceof EntryFunction) {
      executable = new TransactionExecutableEntryFunction(innerPayload.transaction_payload);
    } else if (innerPayload.transaction_payload instanceof Script) {
      executable = new TransactionExecutableScript(innerPayload.transaction_payload);
    } else {
      throw new Error("Unsupported multisig transaction payload type");
    }

    return new TransactionInnerPayloadV1(
      executable,
      new TransactionExtraConfigV1(payload.multiSig.multisig_address, replayProtectionNonce),
    );
  }
  throw new Error(`Unsupported payload type: ${payload}`);
}

/**
 * Converts a transaction payload to an executable for use inside a DecryptedPlaintext.
 * Maps the various payload types to their corresponding TransactionExecutable variants.
 */
function payloadToExecutable(payload: AnyTransactionPayloadInstance): {
  executable: TransactionExecutable;
  extraConfig: TransactionExtraConfig;
} {
  if (payload instanceof TransactionPayloadScript) {
    return {
      executable: new TransactionExecutableScript(payload.script),
      extraConfig: new TransactionExtraConfigV1(),
    };
  }
  if (payload instanceof TransactionPayloadEntryFunction) {
    return {
      executable: new TransactionExecutableEntryFunction(payload.entryFunction),
      extraConfig: new TransactionExtraConfigV1(),
    };
  }
  if (payload instanceof TransactionPayloadMultiSig) {
    const innerPayload = payload.multiSig.transaction_payload;
    let executable: TransactionExecutable;
    if (innerPayload === undefined || innerPayload?.transaction_payload === undefined) {
      executable = new TransactionExecutableEmpty();
    } else if (innerPayload.transaction_payload instanceof EntryFunction) {
      executable = new TransactionExecutableEntryFunction(innerPayload.transaction_payload);
    } else if (innerPayload.transaction_payload instanceof Script) {
      executable = new TransactionExecutableScript(innerPayload.transaction_payload);
    } else {
      throw new Error("Unsupported multisig transaction payload type");
    }
    return {
      executable,
      extraConfig: new TransactionExtraConfigV1(payload.multiSig.multisig_address),
    };
  }
  if (payload instanceof TransactionInnerPayloadV1) {
    return {
      executable: payload.executable,
      extraConfig: payload.extra_config,
    };
  }
  throw new Error(`Cannot convert payload to executable: ${payload}`);
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

function payloadImpliesCoSignerClaimVisibility(payload: AnyTransactionPayloadInstance): boolean {
  if (payload instanceof TransactionPayloadMultiSig) {
    return true;
  }
  if (payload instanceof TransactionInnerPayloadV1) {
    const ec = payload.extra_config;
    return (
      (ec instanceof TransactionExtraConfigV1 || ec instanceof TransactionExtraConfigV2) &&
      ec.multisigAddress !== undefined
    );
  }
  return false;
}

function resolveClaimedEntryFunForEncryptedTransaction(args: {
  payload: AnyTransactionPayloadInstance;
  feePayerAddress?: AccountAddressInput;
  options?: InputGenerateTransactionOptions;
}): ClaimedEntryFunction | undefined {
  const { payload, feePayerAddress, options } = args;
  const hasFeePayer = feePayerAddress !== undefined;
  const coSignerFlow = payloadImpliesCoSignerClaimVisibility(payload);
  if (!hasFeePayer && !coSignerFlow) {
    return undefined;
  }
  if (options?.claimedEntryFunction !== undefined) {
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

/**
 * Encrypts a transaction payload using the encryption key from the node.
 *
 * Steps (matching Rust sdk/src/transaction_builder.rs encrypt_payload):
 * 1. Convert payload to TransactionExecutable + TransactionExtraConfig
 * 2. Generate random decryption nonce
 * 3. Build DecryptedPlaintext(executable, 16-byte nonce)
 * 4. Build `PayloadAssociatedData::V1` (sender + `signer_auth_keys`, matching Rust `encrypt_payload`)
 * 5. Encrypt with AAD using EncryptionKey
 * 6. Compute payload_hash = CryptoHash(DecryptedPlaintext)
 * 7. Return EncryptedInner on wire (epoch hint + optional claimed_entry_fun)
 */
async function encryptTransactionPayload(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddress;
  payload: AnyTransactionPayloadInstance;
  replayProtectionNonce?: bigint;
  claimedEntryFun?: ClaimedEntryFunction;
  authenticationKey: AuthenticationKey;
  /** Additional `(address, authentication_key)` pairs after the primary sender, same order as multi-agent secondaries. */
  additionalSignerAuthKeys?: Array<{ address: AccountAddress; authenticationKey: AuthenticationKey }>;
}): Promise<TransactionPayloadEncryptedPayload> {
  const {
    aptosConfig,
    sender,
    payload,
    replayProtectionNonce,
    claimedEntryFun,
    authenticationKey,
    additionalSignerAuthKeys,
  } = args;

  const encryption = await fetchAndCacheEncryptionKey({ aptosConfig });
  if (!encryption) {
    throw new Error(
      "Encrypted transactions requested but the node does not provide an encryption key. " +
        "Ensure the node supports encrypted transaction submission.",
    );
  }

  const { key: encryptionKey, epoch: encryptionEpoch } = encryption;

  const { executable, extraConfig: baseExtraConfig } = payloadToExecutable(payload);

  // Ensure replay protection nonce propagates to extraConfig
  let extraConfig: TransactionExtraConfig = baseExtraConfig;
  if (replayProtectionNonce !== undefined) {
    if (extraConfig instanceof TransactionExtraConfigV1) {
      extraConfig = new TransactionExtraConfigV1(extraConfig.multisigAddress, replayProtectionNonce);
    } else if (extraConfig instanceof TransactionExtraConfigV2) {
      extraConfig = new TransactionExtraConfigV2(
        extraConfig.multisigAddress,
        replayProtectionNonce,
        extraConfig.txnLimitsRequest,
      );
    }
  }

  const nonceBytes = new Uint8Array(DECRYPTION_NONCE_LENGTH);
  crypto.getRandomValues(nonceBytes);

  const decryptedPayload = new DecryptedPlaintext(executable, nonceBytes);
  const signerAuthKeys = [
    { address: sender, authenticationKey },
    ...(additionalSignerAuthKeys ?? []),
  ];
  const associatedData = new PayloadAssociatedData(sender, signerAuthKeys);

  const ciphertext = encryptionKey.encrypt(decryptedPayload, associatedData);

  const payloadHash = decryptedPayload.hash();

  return new TransactionPayloadEncryptedPayload(ciphertext, extraConfig, payloadHash, encryptionEpoch, claimedEntryFun);
}

/**
 * Generates a transaction based on the provided arguments.
 * This function can create both simple and multi-agent transactions, allowing for flexible transaction handling.
 *
 * @param args - The input arguments for generating the transaction.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.sender - The transaction's sender account address as a hex input.
 * @param args.payload - The transaction payload, which can be created using `generateTransactionPayload()`.
 * @param args.options - Optional. Transaction options object.
 * @param args.secondarySignerAddresses - Optional. An array of addresses for additional signers in a multi-signature transaction.
 * @param args.feePayerAddress - Optional. The address of the fee payer for sponsored transactions.
 * @returns An instance of a transaction, which may include secondary signer addresses and a fee payer address.
 * @group Implementation
 * @category Transactions
 */
export async function buildTransaction(args: InputGenerateSingleSignerRawTransactionArgs): Promise<SimpleTransaction>;
/**
 * @group Implementation
 * @category Transactions
 */
export async function buildTransaction(args: InputGenerateMultiAgentRawTransactionArgs): Promise<MultiAgentTransaction>;

/**
 * Generates a transaction based on the provided arguments
 *
 * Note: we can start with one function to support all different payload/transaction types,
 * and if to complex to use, we could have function for each type
 *
 * @param args.aptosConfig AptosConfig
 * @param args.sender The transaction's sender account address as a hex input
 * @param args.payload The transaction payload - can create by using generateTransactionPayload()
 * @param args.options optional. Transaction options object
 * @param args.secondarySignerAddresses optional. For when want to create a multi signers transaction
 * @param args.feePayerAddress optional. For when want to create a fee payer (aka sponsored) transaction
 *
 * @return An instance of a RawTransaction, plus optional secondary/fee payer addresses
 * ```
 * {
 *  rawTransaction: RawTransaction,
 *  secondarySignerAddresses?: Array<AccountAddress>,
 *  feePayerAddress?: AccountAddress
 * }
 * ```
 * @group Implementation
 * @category Transactions
 */
export async function buildTransaction(args: InputGenerateRawTransactionArgs): Promise<AnyRawTransaction> {
  const { aptosConfig, sender, payload, options, feePayerAddress } = args;
  // generate raw transaction
  const rawTxn = await generateRawTransaction({
    aptosConfig,
    sender,
    payload,
    options,
    feePayerAddress,
    secondarySignerAddresses: "secondarySignerAddresses" in args ? args.secondarySignerAddresses : undefined,
  });

  // if multi agent transaction
  if ("secondarySignerAddresses" in args) {
    const signers: Array<AccountAddress> =
      args.secondarySignerAddresses?.map((signer) => AccountAddress.from(signer)) ?? [];

    return new MultiAgentTransaction(
      rawTxn,
      signers,
      args.feePayerAddress ? AccountAddress.from(args.feePayerAddress) : undefined,
    );
  }
  // return the raw transaction
  return new SimpleTransaction(rawTxn, args.feePayerAddress ? AccountAddress.from(args.feePayerAddress) : undefined);
}

/**
 * Generate a signed transaction for simulation before submitting it to the chain.
 * This function helps in preparing a transaction that can be simulated, allowing users to verify its validity and expected behavior.
 *
 * @param args - The input data required to generate the signed transaction for simulation.
 * @param args.transaction - An Aptos transaction type to sign.
 * @param args.signerPublicKey - The public key of the signer.
 * @param args.secondarySignersPublicKeys - Optional. The public keys of secondary signers if it is a multi-signer transaction.
 * @param args.feePayerPublicKey - Optional. The public key of the fee payer in a sponsored transaction.
 * @param args.options - Optional. Additional options for simulating the transaction.
 *
 * @returns A signed serialized transaction that can be simulated.
 * @group Implementation
 * @category Transactions
 */
export async function generateSignedTransactionForSimulation(args: InputSimulateTransactionData): Promise<Uint8Array> {
  const { signerPublicKey, transaction, secondarySignersPublicKeys, feePayerPublicKey } = args;

  const accountAuthenticator = await getAuthenticatorForSimulation(signerPublicKey);

  // fee payer transaction
  if (transaction.feePayerAddress) {
    const rawTxnForSim = transaction.rawTransaction.asEncryptedVariantForSigning();
    const transactionToSign = new FeePayerRawTransaction(
      rawTxnForSim,
      transaction.secondarySignerAddresses ?? [],
      transaction.feePayerAddress,
    );
    let secondaryAccountAuthenticators: Array<AccountAuthenticator> = [];
    if (transaction.secondarySignerAddresses) {
      if (secondarySignersPublicKeys) {
        secondaryAccountAuthenticators = await Promise.all(
          secondarySignersPublicKeys.map((publicKey) => getAuthenticatorForSimulation(publicKey)),
        );
      } else {
        secondaryAccountAuthenticators = await Promise.all(
          Array.from({ length: transaction.secondarySignerAddresses.length }, () =>
            getAuthenticatorForSimulation(undefined),
          ),
        );
      }
    }
    const feePayerAuthenticator = await getAuthenticatorForSimulation(feePayerPublicKey);

    const transactionAuthenticator = new TransactionAuthenticatorFeePayer(
      accountAuthenticator,
      transaction.secondarySignerAddresses ?? [],
      secondaryAccountAuthenticators,
      {
        address: transaction.feePayerAddress,
        authenticator: feePayerAuthenticator,
      },
    );
    return new SignedTransaction(transactionToSign.raw_txn, transactionAuthenticator).bcsToBytes();
  }

  // multi agent transaction
  if (transaction.secondarySignerAddresses) {
    const rawTxnForSim = transaction.rawTransaction.asEncryptedVariantForSigning();
    const transactionToSign = new MultiAgentRawTransaction(rawTxnForSim, transaction.secondarySignerAddresses);

    let secondaryAccountAuthenticators: Array<AccountAuthenticator> = [];

    if (secondarySignersPublicKeys) {
      secondaryAccountAuthenticators = await Promise.all(
        secondarySignersPublicKeys.map((publicKey) => getAuthenticatorForSimulation(publicKey)),
      );
    } else {
      secondaryAccountAuthenticators = await Promise.all(
        Array.from({ length: transaction.secondarySignerAddresses.length }, () =>
          getAuthenticatorForSimulation(undefined),
        ),
      );
    }

    const transactionAuthenticator = new TransactionAuthenticatorMultiAgent(
      accountAuthenticator,
      transaction.secondarySignerAddresses,
      secondaryAccountAuthenticators,
    );

    return new SignedTransaction(transactionToSign.raw_txn, transactionAuthenticator).bcsToBytes();
  }

  // single signer raw transaction
  let transactionAuthenticator;
  if (accountAuthenticator instanceof AccountAuthenticatorEd25519) {
    transactionAuthenticator = new TransactionAuthenticatorEd25519(
      accountAuthenticator.public_key,
      accountAuthenticator.signature,
    );
  } else if (
    accountAuthenticator instanceof AccountAuthenticatorSingleKey ||
    accountAuthenticator instanceof AccountAuthenticatorMultiKey
  ) {
    transactionAuthenticator = new TransactionAuthenticatorSingleSender(accountAuthenticator);
  } else if (accountAuthenticator instanceof AccountAuthenticatorNoAccountAuthenticator) {
    transactionAuthenticator = new TransactionAuthenticatorSingleSender(accountAuthenticator);
  } else {
    throw new Error("Invalid public key");
  }
  return new SignedTransaction(transaction.rawTransaction, transactionAuthenticator).bcsToBytes();
}

/**
 * @group Implementation
 * @category Transactions
 */
export async function getAuthenticatorForSimulation(publicKey?: PublicKey) {
  if (!publicKey) {
    return new AccountAuthenticatorNoAccountAuthenticator();
  }

  // Wrap the public key types below with AnyPublicKey as they are only support through single sender.
  // Learn more about AnyPublicKey here - https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-55.md
  // Detect keyless public keys by duck-typing to avoid importing poseidon-heavy modules
  const detectKeylessVariant = (key: PublicKey): AnyPublicKeyVariant | undefined => {
    if ("jwkAddress" in key && "keylessPublicKey" in key) return AnyPublicKeyVariant.FederatedKeyless;
    if ("iss" in key && typeof key.iss === "string" && "idCommitment" in key) return AnyPublicKeyVariant.Keyless;
    return undefined;
  };
  const keylessVariant = detectKeylessVariant(publicKey);
  const convertToAnyPublicKey = keylessVariant !== undefined || Secp256k1PublicKey.isInstance(publicKey);
  // Pass variant explicitly for keyless keys to avoid instanceof-based registry detection
  const accountPublicKey = convertToAnyPublicKey ? new AnyPublicKey(publicKey, keylessVariant) : publicKey;

  // No need to for the signature to be matching in scheme. All that matters for simulations is that it's not valid
  const invalidSignature = new Ed25519Signature(new Uint8Array(64));

  if (Ed25519PublicKey.isInstance(accountPublicKey)) {
    return new AccountAuthenticatorEd25519(accountPublicKey, invalidSignature);
  }

  if (AnyPublicKey.isInstance(accountPublicKey)) {
    if (
      accountPublicKey.variant === AnyPublicKeyVariant.Keyless ||
      accountPublicKey.variant === AnyPublicKeyVariant.FederatedKeyless
    ) {
      // Dynamic import to avoid pulling poseidon-lite into the main bundle
      const { KeylessSignature } = await import("../../core/crypto/keyless.js");
      return new AccountAuthenticatorSingleKey(
        accountPublicKey,
        new AnySignature(KeylessSignature.getSimulationSignature()),
      );
    }
    return new AccountAuthenticatorSingleKey(accountPublicKey, new AnySignature(invalidSignature));
  }

  if (MultiKey.isInstance(accountPublicKey)) {
    let keylessSignatureModule: typeof import("../../core/crypto/keyless.js") | undefined;
    return new AccountAuthenticatorMultiKey(
      accountPublicKey,
      new MultiKeySignature({
        signatures: await Promise.all(
          accountPublicKey.publicKeys.map(async (pubKey) => {
            if (
              pubKey.variant === AnyPublicKeyVariant.Keyless ||
              pubKey.variant === AnyPublicKeyVariant.FederatedKeyless
            ) {
              keylessSignatureModule ??= await import("../../core/crypto/keyless.js");
              return new AnySignature(keylessSignatureModule.KeylessSignature.getSimulationSignature());
            }
            return new AnySignature(invalidSignature);
          }),
        ),
        bitmap: accountPublicKey.createBitmap({
          bits: new Array(accountPublicKey.publicKeys.length).fill(0).map((_, i) => i),
        }),
      }),
    );
  }

  throw new Error("Unsupported PublicKey used for simulations");
}

/**
 * Generate a signed transaction ready for submission to the blockchain.
 * This function prepares the transaction by authenticating the sender and any additional signers based on the provided arguments.
 *
 * @param args - The input data required to generate the signed transaction.
 * @param args.transaction - An Aptos transaction type containing the details of the transaction.
 * @param args.senderAuthenticator - The account authenticator of the transaction sender.
 * @param args.feePayerAuthenticator - The authenticator for the fee payer, required if the transaction has a fee payer address.
 * @param args.additionalSignersAuthenticators - Optional authenticators for additional signers in a multi-signer transaction.
 *
 * @returns A Uint8Array representing the signed transaction in bytes.
 *
 * @throws Error if the feePayerAuthenticator is not provided for a fee payer transaction.
 * @throws Error if additionalSignersAuthenticators are not provided for a multi-signer transaction.
 * @group Implementation
 * @category Transactions
 */
export function generateSignedTransaction(args: InputSubmitTransactionData): Uint8Array {
  const { transaction, feePayerAuthenticator, additionalSignersAuthenticators } = args;
  const senderAuthenticator = normalizeBundle(AccountAuthenticator, args.senderAuthenticator);

  let txnAuthenticator: TransactionAuthenticator;
  if (transaction.feePayerAddress) {
    if (!feePayerAuthenticator) {
      throw new Error("Must provide a feePayerAuthenticator argument to generate a signed fee payer transaction");
    }
    txnAuthenticator = new TransactionAuthenticatorFeePayer(
      senderAuthenticator,
      transaction.secondarySignerAddresses ?? [],
      additionalSignersAuthenticators ?? [],
      {
        address: transaction.feePayerAddress,
        authenticator: feePayerAuthenticator,
      },
    );
  } else if (transaction.secondarySignerAddresses) {
    if (!additionalSignersAuthenticators) {
      throw new Error(
        "Must provide a additionalSignersAuthenticators argument to generate a signed multi agent transaction",
      );
    }
    txnAuthenticator = new TransactionAuthenticatorMultiAgent(
      senderAuthenticator,
      transaction.secondarySignerAddresses,
      additionalSignersAuthenticators,
    );
  } else if (senderAuthenticator instanceof AccountAuthenticatorEd25519) {
    txnAuthenticator = new TransactionAuthenticatorEd25519(
      senderAuthenticator.public_key,
      senderAuthenticator.signature,
    );
  } else if (senderAuthenticator instanceof AccountAuthenticatorMultiEd25519) {
    txnAuthenticator = new TransactionAuthenticatorMultiEd25519(
      senderAuthenticator.public_key,
      senderAuthenticator.signature,
    );
  } else {
    txnAuthenticator = new TransactionAuthenticatorSingleSender(senderAuthenticator);
  }

  return new SignedTransaction(transaction.rawTransaction, txnAuthenticator).bcsToBytes();
}

/**
 * Hashes the set of values using a SHA-3 256 hash algorithm.
 * @param input - An array of UTF-8 strings or Uint8Array byte arrays to be hashed.
 * @group Implementation
 * @category Transactions
 */
export function hashValues(input: (Uint8Array | string)[]): Uint8Array {
  const hash = sha3Hash.create();
  for (const item of input) {
    hash.update(typeof item === "string" ? TEXT_ENCODER.encode(item) : item);
  }
  return hash.digest();
}

/**
 * The domain separated prefix for hashing transactions
 * @group Implementation
 * @category Transactions
 */
const TRANSACTION_PREFIX = hashValues(["APTOS::Transaction"]);

/**
 * Generates a user transaction hash for the provided transaction payload, which must already have an authenticator.
 * This function helps ensure the integrity and uniqueness of the transaction by producing a hash based on the signed transaction data.
 *
 * @param args - The input data required to submit the transaction.
 * @param args.authenticator - The authenticator for the transaction.
 * @param args.payload - The payload containing the transaction details.
 * @param args.sender - The address of the sender initiating the transaction.
 * @param args.sequenceNumber - The sequence number of the transaction for the sender.
 * @group Implementation
 * @category Transactions
 */
export function generateUserTransactionHash(args: InputSubmitTransactionData): string {
  const signedTransaction = generateSignedTransaction(args);

  // Transaction signature is defined as, the domain separated prefix based on struct (Transaction)
  // Then followed by the type of the transaction for the enum, UserTransaction is 0
  // Then followed by BCS encoded bytes of the signed transaction
  return new Hex(hashValues([TRANSACTION_PREFIX, new Uint8Array([0]), signedTransaction])).toString();
}

/**
 * Fetches and caches ABIs while allowing for pass-through on provided ABIs.
 *
 * @param key - A unique identifier for the cached ABI.
 * @param moduleAddress - The address of the module from which to fetch the ABI.
 * @param moduleName - The name of the module containing the function.
 * @param functionName - The name of the function whose ABI is being fetched.
 * @param aptosConfig - Configuration settings for Aptos.
 * @param abi - An optional ABI to use if already available.
 * @param fetch - A function to fetch the ABI if it is not provided.
 * @group Implementation
 * @category Transactions
 */
async function fetchAbi<T extends FunctionABI>({
  key,
  moduleAddress,
  moduleName,
  functionName,
  aptosConfig,
  abi,
  fetch,
}: {
  key: string;
  moduleAddress: string;
  moduleName: string;
  functionName: string;
  aptosConfig: AptosConfig;
  abi?: T;
  fetch: (moduleAddress: string, moduleName: string, functionName: string, aptosConfig: AptosConfig) => Promise<T>;
}): Promise<T> {
  if (abi !== undefined) {
    return abi;
  }

  // We fetch the entry function ABI, and then pretend that we already had the ABI
  return memoizeAsync(
    async () => fetch(moduleAddress, moduleName, functionName, aptosConfig),
    `${key}-${aptosConfig.network}-${moduleAddress}-${moduleName}-${functionName}`,
    1000 * 60 * 5, // 5 minutes
  )();
}
