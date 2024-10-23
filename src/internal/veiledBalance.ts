import { concatBytes } from "@noble/hashes/utils";
import { AptosConfig } from "../api/aptosConfig";
import { 
  AccountAddress,
  AccountAddressInput,
  genProofVeiledTransfer,
  genProofVeiledWithdraw,
  genSigmaProofVeiledKeyRotation,
  ProofVeiledTransferInputs,
  ProofVeiledWithdrawInputs,
  SigmaProofVeiledKeyRotationInputs,
  TwistedEd25519PublicKey,
  TwistedElGamalCiphertext,
} from "../core";
import { InputGenerateTransactionOptions } from "../transactions/types";
import { AnyNumber, HexInput, LedgerVersionArg } from "../types";
import { generateTransaction } from "./transactionSubmission";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";
import { view } from "./view";
import { publicKeyToU8, toTwistedEd25519PrivateKey } from "../core/crypto/veiledOperationZKP/helpers";

// TODO: update the module address as soon as it becomes a system address
// At the moment, the module work only on TESTNET.
const VEILED_COIN_MODULE_ADDRESS = "0xd2fadc8e5abc1a0d2914795b1be91870fded881148d078033716da3f21918fd7"

interface VeiledBalanceOutputItem {
  left: { data: string };
  right: { data: string };
}

export interface VeiledBalances {
  pending: TwistedElGamalCiphertext;
  actual: TwistedElGamalCiphertext;
}

export async function getVeiledBalances(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddress;
  tokenAddress: string;
  options?: LedgerVersionArg;
}): Promise<VeiledBalances> {
  const { aptosConfig, accountAddress, tokenAddress, options } = args;
  const balances = await view<VeiledBalanceOutputItem[]>({
    aptosConfig,
    payload: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::veiled_balance`,
      typeArguments: [],
      functionArguments: [accountAddress, tokenAddress],
    },
    options,
  });

  return {
    pending: new TwistedElGamalCiphertext(balances[0].left.data.slice(2), balances[0].right.data.slice(2)),
    actual: new TwistedElGamalCiphertext(balances[1].left.data.slice(2), balances[1].right.data.slice(2)),
  }
}

export async function registerVeiledBalanceTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  tokenAddress: string;
  publicKey: HexInput | TwistedEd25519PublicKey;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, sender, publicKey, tokenAddress, options } = args;
  const pkU8 = publicKeyToU8(publicKey)
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

export async function veiledWithdrawTransaction(args: ProofVeiledWithdrawInputs & {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  tokenAddress: string;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const {
    aptosConfig,
    privateKey,
    encryptedBalance,
    sender,
    amount,
    changedBalance,
    tokenAddress,
    options
  } = args;

  const { sigma, range } = await genProofVeiledWithdraw({
    privateKey,
    encryptedBalance,
    amount,
    changedBalance,
  })

  return generateTransaction({
    aptosConfig,
    sender,
    data: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::unveil`,
      functionArguments: [tokenAddress, String(amount), range, sigma],
    },
    options,
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
  const method = withFreezeBalance ? "rollover_pending_balance_and_freeze" : "rollover_pending_balance"

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

export async function veiledTransferCoinTransaction(args: ProofVeiledTransferInputs & {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  tokenAddress: string;
  recipient: AccountAddressInput;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const {
    aptosConfig,
    sender,
    recipient,
    tokenAddress,
    senderPrivateKey,
    recipientPublicKey,
    encryptedSenderBalance,
    amount,
    changedSenderBalance,
    random,
    auditorPublicKeys,
    options,
  } = args;

  const transferProof = await genProofVeiledTransfer({
    senderPrivateKey,
    recipientPublicKey,
    encryptedSenderBalance,
    amount,
    changedSenderBalance,
    random,
    auditorPublicKeys,
  })

  const auditorU8PublicKeys = (auditorPublicKeys ?? []).map(pk => publicKeyToU8(pk))


  return generateTransaction({
    aptosConfig,
    sender,
    data: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::fully_veiled_transfer`,
      functionArguments: [
        tokenAddress,
        recipient,
        transferProof.encryptedAmountBySender.C.toRawBytes(),
        transferProof.encryptedAmountBySender.D.toRawBytes(),
        transferProof.maskedRecipientPublicKey,
        concatBytes(...auditorU8PublicKeys),
        concatBytes(...transferProof.maskedAuditorsPublicKeys),
        transferProof.proof.rangeNewBalance,
        transferProof.proof.rangeAmount,
        transferProof.proof.sigma,
      ],
    },
    options,
  });
}

export async function veiledBalanceKeyRotationTransaction(args: SigmaProofVeiledKeyRotationInputs & {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  tokenAddress: string;
  withUnfreezeBalance?: boolean;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const {
    aptosConfig,
    sender,
    tokenAddress,
    oldPrivateKey,
    newPrivateKey,
    balance,
    encryptedBalance,
    withUnfreezeBalance,
    options
  } = args;

  const {proof, encryptedBalanceByNewPublicKey} = genSigmaProofVeiledKeyRotation({
    oldPrivateKey,
    newPrivateKey,
    balance,
    encryptedBalance,
  })

  const newPublicKeyU8 = toTwistedEd25519PrivateKey(newPrivateKey).publicKey().toUint8Array()

  const serializedNewBalance = concatBytes(
    encryptedBalanceByNewPublicKey.C.toRawBytes(),
    encryptedBalanceByNewPublicKey.D.toRawBytes(),
  )
  const method = withUnfreezeBalance ? "rotate_public_key_and_unfreeze" : "rotate_public_key"

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