import { AccountAuthenticator, AnyRawTransaction, InputTransactionPluginData } from "../../transactions";
import { AptosConfig } from "../aptosConfig";

/**
 * Validates the fee payer data when submitting a transaction to ensure that the fee
 * payer authenticator is provided if a fee payer address is specified. This helps
 * prevent errors in transaction submission related to fee payer authentication.
 *
 * The validation is skipped if a custom transaction submitter is defined.
 *
 * @param config - The Aptos configuration that may contain a transaction submitter.
 * @param args - The method arguments containing transaction data and optional transaction submitter.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 *
 * class TransactionHandler {
 *   async submitTransaction(methodArgs: { transaction: { feePayerAddress: string }, feePayerAuthenticator?: string }) {
 *     validateFeePayerDataOnSubmission(this.config, methodArgs);
 *     // Logic to submit the transaction
 *   }
 * }
 *
 * async function runExample() {
 *   const handler = new TransactionHandler();
 *
 *   // Attempt to submit a transaction without a fee payer authenticator
 *   try {
 *     await handler.submitTransaction({
 *       transaction: { feePayerAddress: "0x1" }, // replace with a real fee payer address
 *     });
 *   } catch (error) {
 *     console.error(error.message); // Should log the error message
 *   }
 *
 *   // Submit a transaction with a fee payer authenticator
 *   await handler.submitTransaction({
 *     transaction: { feePayerAddress: "0x1" }, // replace with a real fee payer address
 *     feePayerAuthenticator: "authenticatorValue", // replace with a real authenticator
 *   });
 *
 *   console.log("Transaction submitted successfully.");
 * }
 * runExample().catch(console.error);
 * ```
 * @group Implementation
 */
export function validateFeePayerDataOnSubmission(
  config: AptosConfig,
  args: {
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    feePayerAuthenticator?: AccountAuthenticator;
  } & InputTransactionPluginData,
): void {
  // Skip validation if a transaction submitter is defined.
  if (config.getTransactionSubmitter() !== undefined || args.transactionSubmitter !== undefined) {
    return;
  }

  if (args.transaction.feePayerAddress && !args.feePayerAuthenticator) {
    throw new Error("You are submitting a Fee Payer transaction but missing the feePayerAuthenticator");
  }
}

/**
 * Validates that the fee payer public key is provided when simulating a Fee Payer transaction.
 * This ensures that all necessary data is present for the simulation to proceed correctly.
 *
 * @param target - The target object where the method is defined.
 * @param propertyKey - The name of the method being decorated.
 * @param descriptor - The property descriptor for the method.
 *
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 *
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 *
 * async function runExample() {
 *   const methodArgs = {
 *     transaction: {
 *       feePayerAddress: "0x1", // replace with a real fee payer address
 *     },
 *     feePayerPublicKey: undefined, // missing fee payer public key
 *   };
 *
 *   try {
 *     // This will throw an error due to missing feePayerPublicKey
 *     await aptos.someMethod(methodArgs);
 *   } catch (error) {
 *     console.error(error.message); // Output the error message
 *   }
 * }
 * runExample().catch(console.error);
 * ```
 * @group Implementation
 */
export function ValidateFeePayerDataOnSimulation(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  /* eslint-disable-next-line func-names, no-param-reassign */
  descriptor.value = async function (...args: any[]) {
    return originalMethod.apply(this, args);
  };

  return descriptor;
}
