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

/**
 * Generates a transaction to transfer coins from one account to another.
 * This function allows you to specify the sender, recipient, amount, and coin type for the transaction.
 *
 * @param args - The parameters for the transaction.
 * @param args.aptosConfig - The Aptos configuration object.
 * @param args.sender - The address of the account sending the coins.
 * @param args.recipient - The address of the account receiving the coins.
 * @param args.amount - The amount of coins to transfer.
 * @param args.coinType - (Optional) The type of coin to transfer, defaults to Aptos Coin if not specified.
 * @param args.options - (Optional) Options for generating the transaction.
 */
export async function transferCoinTransaction(args: {
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
