import { AptosConfig } from "../api/aptosConfig";
import { Account, AccountAddressInput } from "../core";
import { InputGenerateTransactionOptions, SingleSignerTransaction } from "../transactions/types";
import { AnyNumber, MoveStructId } from "../types";
import { APTOS_COIN } from "../utils/const";
import { generateTransaction } from "./transactionSubmission";

export async function transferCoinTransaction(args: {
  aptosConfig: AptosConfig;
  sender: Account;
  recipient: AccountAddressInput;
  amount: AnyNumber;
  coinType?: MoveStructId;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
  const { aptosConfig, sender, recipient, amount, coinType, options } = args;
  const coinStructType = coinType ?? APTOS_COIN;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: sender.accountAddress,
    data: {
      function: "0x1::aptos_account::transfer_coins",
      typeArguments: [coinStructType],
      functionArguments: [recipient, amount],
    },
    options,
  });

  return transaction;
}
