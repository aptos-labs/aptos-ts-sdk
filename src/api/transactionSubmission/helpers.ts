export

/**
 * Validates the fee payer data when submitting a transaction to ensure that the fee payer authenticator is provided if a fee payer address is specified.
 * 
 * @param target - The target object where the method is defined.
 * @param propertyKey - The name of the method being decorated.
 * @param descriptor - The property descriptor for the method being decorated.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const sender = await aptos.account.generate(); // Generate a new account
 *   const destination = await aptos.account.generate(); // Generate a new account
 * 
 *   const transaction = await aptos.transaction.build.simple({
 *     sender: sender.accountAddress,
 *     data: {
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: [destination.accountAddress, 100],
 *     },
 *   });
 * 
 *   // Here we simulate a fee payer transaction
 *   transaction.feePayerAddress = sender.accountAddress; // Set fee payer address
 *   // Uncomment and provide a real authenticator if needed
 *   // transaction.feePayerAuthenticator = ...; 
 * 
 *   try {
 *     await aptos.transaction.submit(transaction);
 *   } catch (error) {
 *     console.error(error.message); // Handle validation error
 *   }
 * 
 *   console.log("Transaction submitted successfully");
 * }
 * runExample().catch(console.error);
 * ```
 */
 function ValidateFeePayerDataOnSubmission(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  /* eslint-disable-next-line func-names, no-param-reassign */
  descriptor.value =

/**
 * Simulates a transaction, ensuring that the fee payer's public key is provided if a fee payer address is specified.
 * This function is essential for validating fee payer transactions before execution.
 * 
 * @param args - The arguments for the transaction simulation.
 * @param args[0].transaction - The transaction details.
 * @param args[0].transaction.feePayerAddress - The address of the fee payer for the transaction.
 * @param args[0].feePayerPublicKey - The public key of the fee payer.
 * 
 * @throws Error if simulating a fee payer transaction without a fee payer public key.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const transaction = await aptos.transaction.build.simple({
 *     sender: "0x1", // replace with a real sender address
 *     data: {
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: ["0x2", 100], // replace with a real destination address
 *     },
 *   });
 * 
 *   // Simulating the transaction
 *   const simulationResult = await aptos.transaction.simulate({
 *     transaction,
 *     feePayerPublicKey: "0x3", // replace with a real fee payer public key
 *   });
 * 
 *   console.log(simulationResult);
 * }
 * runExample().catch(console.error);
 * ```
 */
 async function (...args: any[]) {
    const [methodArgs] = args;

    if (methodArgs.transaction.feePayerAddress && !methodArgs.feePayerAuthenticator) {
      throw new Error("You are submitting a Fee Payer transaction but missing the feePayerAuthenticator");
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}

export

/**
 * Validates the fee payer data during transaction simulation to ensure that the required public key is provided when a fee payer address is specified.
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
 *   const sender = await aptos.account.generate(); // Generate a new account for sending
 *   const destination = await aptos.account.generate(); // Generate a new account for receiving
 * 
 *   const transaction = await aptos.transaction.build.simple({
 *     sender: sender.accountAddress,
 *     data: {
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: [destination.accountAddress, 100],
 *     },
 *   });
 * 
 *   // Simulating a transaction with fee payer
 *   const methodArgs = {
 *     transaction: {
 *       feePayerAddress: sender.accountAddress, // Specify fee payer address
 *     },
 *     feePayerPublicKey: sender.publicKey, // Provide the fee payer public key
 *   };
 * 
 *   await aptos.transaction.simulate(methodArgs); // Simulate the transaction
 *   console.log("Transaction simulation completed successfully.");
 * }
 * runExample().catch(console.error);
 * ```
 */
 function ValidateFeePayerDataOnSimulation(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  /* eslint-disable-next-line func-names, no-param-reassign */
  descriptor.value =

/**
 * Simulates a transaction, ensuring that the fee payer's public key is provided if a fee payer address is specified.
 * This function is essential for validating fee payer transactions before execution.
 * 
 * @param args - The arguments for the transaction simulation.
 * @param args[0].transaction - The transaction details.
 * @param args[0].transaction.feePayerAddress - The address of the fee payer for the transaction.
 * @param args[0].feePayerPublicKey - The public key of the fee payer.
 * 
 * @throws Error if simulating a fee payer transaction without a fee payer public key.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const transaction = await aptos.transaction.build.simple({
 *     sender: "0x1", // replace with a real sender address
 *     data: {
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: ["0x2", 100], // replace with a real destination address
 *     },
 *   });
 * 
 *   // Simulating the transaction
 *   const simulationResult = await aptos.transaction.simulate({
 *     transaction,
 *     feePayerPublicKey: "0x3", // replace with a real fee payer public key
 *   });
 * 
 *   console.log(simulationResult);
 * }
 * runExample().catch(console.error);
 * ```
 */
 async function (...args: any[]) {
    const [methodArgs] = args;

    if (methodArgs.transaction.feePayerAddress && !methodArgs.feePayerPublicKey) {
      throw new Error("You are simulating a Fee Payer transaction but missing the feePayerPublicKey");
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}