import { AptosConfig } from "../api/aptos_config";
import { U64 } from "../bcs/serializable/move-primitives";
import { Account, AccountAddress } from "../core";
import { GenerateTransactionOptions, SingleSignerTransaction } from "../transactions/types";
import { StructTag, TypeTagStruct } from "../transactions/typeTag/typeTag";
import { HexInput, AnyNumber, MoveResourceType } from "../types";
import { APTOS_COIN } from "../utils/const";
import { generateTransaction } from "./transaction_submission";

export async function transferCoinTransaction(args: {
  aptosConfig: AptosConfig;
  sender: Account;
  recipient: HexInput;
  amount: AnyNumber;
  coinType?: MoveResourceType;
  options?: GenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
  const { aptosConfig, sender, recipient, amount, coinType, options } = args;
  const coinStructType = coinType ?? APTOS_COIN;
  const transaction = await generateTransaction({
    aptosConfig,
    sender: sender.accountAddress.toString(),
    data: {
      function: "0x1::aptos_account::transfer_coins",
      type_arguments: [new TypeTagStruct(StructTag.fromString(coinStructType))],
      arguments: [AccountAddress.fromHexInput(recipient), new U64(amount)],
    },
    options,
  });

  return transaction as SingleSignerTransaction;
}
