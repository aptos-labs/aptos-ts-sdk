import { AptosConfig } from "../api/aptosConfig";
import { U64 } from "../bcs/serializable/movePrimitives";
import { Account, AccountAddress, AccountAddressInput } from "../core";
import { InputGenerateTransactionOptions, InputSingleSignerTransaction } from "../transactions/types";
import { AnyNumber, MoveStructType } from "../types";
import { APTOS_COIN } from "../utils/const";
import { generateTransaction } from "./transactionSubmission";
import { parseTypeTag } from "../transactions/typeTag/parser";

export async function transferCoinTransaction(args: {
  aptosConfig: AptosConfig;
  sender: Account;
  recipient: AccountAddressInput;
  amount: AnyNumber;
  coinType?: MoveStructType;
  options?: InputGenerateTransactionOptions;
}): Promise<InputSingleSignerTransaction> {
  const { aptosConfig, sender, recipient, amount, coinType, options } = args;
  const coinStructType = coinType ?? APTOS_COIN;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: sender.accountAddress,
    data: {
      function: "0x1::aptos_account::transfer_coins",
      typeArguments: [parseTypeTag(coinStructType)],
      functionArguments: [new AccountAddress(recipient), new U64(amount)],
    },
    options,
  });

  return transaction as InputSingleSignerTransaction;
}
