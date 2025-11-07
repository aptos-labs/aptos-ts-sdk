import { AptosConfig } from "@aptos-labs/ts-client";
import { AccountAddressInput } from "@aptos-labs/ts-core";
import { EntryFunctionABI, InputGenerateTransactionOptions } from "@aptos-labs/ts-transactions";
import { AnyNumber, MoveStructId } from "@aptos-labs/ts-types";
import { APTOS_COIN } from "@aptos-labs/ts-types";
import { generateTransaction } from "@aptos-labs/ts-transactions";
import { TypeTagAddress, TypeTagU64 } from "@aptos-labs/ts-transactions";
import { SimpleTransaction } from "@aptos-labs/ts-transactions";

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
 * @group Implementation
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
