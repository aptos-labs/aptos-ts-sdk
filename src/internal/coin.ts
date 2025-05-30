import { CedraConfig } from "../api/cedraConfig";
import { AccountAddressInput } from "../core";
import { EntryFunctionABI, InputGenerateTransactionOptions } from "../transactions/types";
import { AnyNumber, MoveStructId } from "../types";
import { CEDRA_COIN } from "../utils/const";
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
 * @param args.cedraConfig - The Cedra configuration object.
 * @param args.sender - The address of the account sending the coins.
 * @param args.recipient - The address of the account receiving the coins.
 * @param args.amount - The amount of coins to transfer.
 * @param args.coinType - (Optional) The type of coin to transfer, defaults to Cedra Coin if not specified.
 * @param args.options - (Optional) Options for generating the transaction.
 * @group Implementation
 */
export async function transferCoinTransaction(args: {
  cedraConfig: CedraConfig;
  sender: AccountAddressInput;
  recipient: AccountAddressInput;
  amount: AnyNumber;
  coinType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { cedraConfig, sender, recipient, amount, coinType, options } = args;
  const coinStructType = coinType ?? CEDRA_COIN;
  return generateTransaction({
    cedraConfig,
    sender,
    data: {
      function: "0x1::cedra_account::transfer_coins",
      typeArguments: [coinStructType],
      functionArguments: [recipient, amount],
      abi: coinTransferAbi,
    },
    options,
  });
}
