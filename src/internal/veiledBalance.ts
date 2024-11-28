import { concatBytes } from "@noble/hashes/utils";
import { AptosConfig } from "../api/aptosConfig";
import {
  AccountAddress,
  AccountAddressInput,
  genSigmaProofVeiledKeyRotation,
  SigmaProofVeiledKeyRotationInputs,
  TwistedEd25519PrivateKey,
  TwistedEd25519PublicKey,
  TwistedElGamalCiphertext,
} from "../core";
import { InputGenerateTransactionOptions } from "../transactions/types";
import { AnyNumber, HexInput, LedgerVersionArg } from "../types";
import { generateTransaction } from "./transactionSubmission";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";
import { view } from "./view";
import {
  publicKeyToU8,
  toTwistedEd25519PrivateKey,
  toTwistedEd25519PublicKey,
} from "../core/crypto/veiledOperationZKP/helpers";
import { VeiledWithdraw } from "../core/crypto/veiledOperationZKP/veiledWithdraw";
import { VeiledTransfer } from "../core/crypto/veiledOperationZKP/veiledTransfer";

// TODO: update the module address as soon as it becomes a system address
//  At the moment, the module work only on TESTNET.
const VEILED_COIN_MODULE_ADDRESS = "0xd2fadc8e5abc1a0d2914795b1be91870fded881148d078033716da3f21918fd7";

export type VeiledBalanceResponse = {
  left: { data: string };
  right: { data: string };
}[]; // tuple of 4

export async function getVeiledBalances(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddress;
  tokenAddress: string;
  options?: LedgerVersionArg;
}): Promise<{
  pending: TwistedElGamalCiphertext[];
  actual: TwistedElGamalCiphertext[];
}> {
  const { aptosConfig, accountAddress, tokenAddress, options } = args;
  const [chunkedPendingBalance, chunkedActualBalances] = await Promise.all([
    view<VeiledBalanceResponse>({
      aptosConfig,
      payload: {
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::pending_balance`,
        typeArguments: [],
        functionArguments: [accountAddress, tokenAddress],
      },
      options,
    }),
    view<VeiledBalanceResponse>({
      aptosConfig,
      payload: {
        function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::actual_balance`,
        typeArguments: [],
        functionArguments: [accountAddress, tokenAddress],
      },
      options,
    }),
  ]);

  return {
    pending: chunkedPendingBalance.map(
      (el) => new TwistedElGamalCiphertext(el.left.data.slice(2), el.right.data.slice(2)),
    ),
    actual: chunkedActualBalances.map(
      (el) => new TwistedElGamalCiphertext(el.left.data.slice(2), el.right.data.slice(2)),
    ),
  };
}

export async function registerVeiledBalanceTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  tokenAddress: string;
  publicKey: HexInput | TwistedEd25519PublicKey;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, sender, publicKey, tokenAddress, options } = args;
  const pkU8 = publicKeyToU8(publicKey);
  return generateTransaction({
    aptosConfig,
    sender,
    data: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::register`,
      functionArguments: [tokenAddress, pkU8],
    },
    options,
  });
}

export async function depositToVeiledBalanceTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  tokenAddress: string;
  amount: AnyNumber;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, sender, amount, tokenAddress, options } = args;
  return generateTransaction({
    aptosConfig,
    sender,
    data: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::veil`,
      functionArguments: [tokenAddress, String(amount)],
    },
    options,
  });
}

export async function veiledWithdrawTransaction(args: {
  privateKey: TwistedEd25519PrivateKey | HexInput;
  encryptedBalance: TwistedElGamalCiphertext[];
  tokenAddress: string;
  sender: AccountAddressInput;
  amount: bigint;
  aptosConfig: AptosConfig;
  randomness?: bigint[];
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const veiledWithdraw = new VeiledWithdraw(
    toTwistedEd25519PrivateKey(args.privateKey),
    args.encryptedBalance,
    args.amount,
    args.randomness,
  );

  await veiledWithdraw.init();

  const sigmaProof = await veiledWithdraw.genSigmaProof();

  const rangeProof = await veiledWithdraw.genRangeProof();

  return generateTransaction({
    aptosConfig: args.aptosConfig,
    sender: args.sender,
    data: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::unveil`,
      functionArguments: [
        args.tokenAddress,
        String(args.amount),
        rangeProof,
        VeiledWithdraw.serializeSigmaProof(sigmaProof),
      ],
    },
    options: args.options,
  });
}

export async function rolloverPendingVeiledBalanceTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  tokenAddress: string;
  withFreezeBalance?: boolean;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, sender, tokenAddress, options, withFreezeBalance } = args;
  const method = withFreezeBalance ? "rollover_pending_balance_and_freeze" : "rollover_pending_balance";

  return generateTransaction({
    aptosConfig,
    sender,
    data: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::${method}`,
      functionArguments: [tokenAddress],
    },
    options,
  });
}

export async function veiledTransferCoinTransaction(args: {
  senderPrivateKey: TwistedEd25519PrivateKey | HexInput;
  recipientPublicKey: TwistedEd25519PublicKey | HexInput;
  encryptedBalance: TwistedElGamalCiphertext[];
  amount: bigint;
  auditorPublicKeys?: (TwistedEd25519PublicKey | HexInput)[];
  randomness?: bigint[];

  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  tokenAddress: string;
  recipient: AccountAddressInput;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const veiledTransfer = new VeiledTransfer(
    toTwistedEd25519PrivateKey(args.senderPrivateKey),
    args.encryptedBalance,
    args.amount,
    toTwistedEd25519PublicKey(args.recipientPublicKey),
    args.auditorPublicKeys?.map((el) => toTwistedEd25519PublicKey(el)) || [],
    args.randomness,
  );

  await veiledTransfer.init();

  const sigmaProof = await veiledTransfer.genSigmaProof();

  const { rangeProofAmount, rangeProofNewBalance } = await veiledTransfer.genRangeProof();

  return generateTransaction({
    aptosConfig: args.aptosConfig,
    sender: args.sender,
    data: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::fully_veiled_transfer`,
      functionArguments: [
        args.tokenAddress,
        args.recipient,
        concatBytes(...args.encryptedBalance.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat()),
        concatBytes(
          ...veiledTransfer.encryptedAmountByRecipient.map(({ C, D }) => [C.toRawBytes(), D.toRawBytes()]).flat(),
        ),
        concatBytes(...veiledTransfer.auditorPublicKeys.map(publicKeyToU8)),
        concatBytes(...veiledTransfer.auditorsDList.flat()),
        rangeProofNewBalance,
        rangeProofAmount,
        VeiledTransfer.serializeSigmaProof(sigmaProof),
      ],
    },
    options: args.options,
  });
}

export async function veiledBalanceKeyRotationTransaction(
  args: SigmaProofVeiledKeyRotationInputs & {
    aptosConfig: AptosConfig;
    sender: AccountAddressInput;
    tokenAddress: string;
    withUnfreezeBalance?: boolean;
    options?: InputGenerateTransactionOptions;
  },
): Promise<SimpleTransaction> {
  const {
    aptosConfig,
    sender,
    tokenAddress,
    oldPrivateKey,
    newPrivateKey,
    balance,
    oldEncryptedBalance,
    withUnfreezeBalance,
    options,
  } = args;

  const { proof, newEncryptedBalance } = genSigmaProofVeiledKeyRotation({
    oldPrivateKey,
    newPrivateKey,
    balance,
    oldEncryptedBalance,
  });

  const newPublicKeyU8 = toTwistedEd25519PrivateKey(newPrivateKey).publicKey().toUint8Array();

  const serializedNewBalance = concatBytes(
    ...newEncryptedBalance.map((el) => el.C.toRawBytes()),
    ...newEncryptedBalance.map((el) => el.D.toRawBytes()),
  );
  const method = withUnfreezeBalance ? "rotate_public_key_and_unfreeze" : "rotate_public_key";

  return generateTransaction({
    aptosConfig,
    sender,
    data: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::${method}`,
      functionArguments: [tokenAddress, newPublicKeyU8, serializedNewBalance, proof],
    },
    options,
  });
}
