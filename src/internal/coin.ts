import { AptosConfig } from "../api/aptosConfig";
import { AccountAddressInput } from "../core";
import { EntryFunctionABI, InputGenerateTransactionOptions } from "../transactions/types";
import { AnyNumber, MoveStructId } from "../types";
import { APTOS_COIN } from "../utils/const";
import { generateTransaction } from "./transactionSubmission";
import { TypeTagAddress, TypeTagU64 } from "../transactions";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";

const coinTransferAbi: EntryFunctionABI = {
  typeParameters: [{ constraints: [] }],
  parameters: [new TypeTagAddress(), new TypeTagU64()],
};

export async

/**
 * Generates a transaction to transfer coins from one account to another.
 * This function allows you to specify the sender, recipient, amount, and coin type for the transfer.
 * 
 * @param args - The arguments for the transaction.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.sender - The address of the account sending the coins.
 * @param args.recipient - The address of the account receiving the coins.
 * @param args.amount - The amount of coins to transfer.
 * @param args.coinType - The type of coin to transfer (optional).
 * @param args.options - Additional options for generating the transaction (optional).
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const sender = "0x1"; // replace with a real sender address
 *   const recipient = "0x2"; // replace with a real recipient address
 *   const amount = 100; // specify the amount to transfer
 * 
 *   // Generate a transaction to transfer coins
 *   const transaction = await aptos.transaction.transferCoinTransaction({
 *     aptosConfig: config,
 *     sender,
 *     recipient,
 *     amount,
 *   });
 * 
 *   console.log("Transaction generated:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function transferCoinTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  recipient: AccountAddressInput;
  amount: AnyNumber;
  coinType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, sender, recipient, amount, coinType, options } = args;
  const coinStructType = coinType ?? APTOS_COIN;
  return generateTransaction({
    aptosConfig,
    sender,
    data: {
      function: "0x1::aptos_account::transfer_coins",
      typeArguments: [coinStructType],
      functionArguments: [recipient, amount],
      abi: coinTransferAbi,
    },
    options,
  });
}