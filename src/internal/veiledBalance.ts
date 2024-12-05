import { concatBytes } from "@noble/hashes/utils";
import { AptosConfig } from "../api/aptosConfig";
import {
  AccountAddress,
  AccountAddressInput,
  TwistedEd25519PrivateKey,
  TwistedEd25519PublicKey,
  TwistedElGamalCiphertext,
  VeiledWithdraw,
  VeiledTransfer,
  VeiledKeyRotation,
  VeiledNormalization,
} from "../core";
import { InputGenerateTransactionOptions, SimpleTransaction } from "../transactions";
import { AnyNumber, HexInput, LedgerVersionArg } from "../types";
import { generateTransaction } from "./transactionSubmission";
import { view } from "./view";
import { publicKeyToU8, toTwistedEd25519PrivateKey, toTwistedEd25519PublicKey } from "../core/crypto/veiled/helpers";

const VEILED_COIN_MODULE_ADDRESS = "0xcbd21318a3fe6eb6c01f3c371d9aca238a6cd7201d3fc75627767b11b87dcbf5";

export type VeiledBalanceResponse = {
  chunks: {
    left: { data: string };
    right: { data: string };
  }[];
}[];

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
  const [[chunkedPendingBalance], [chunkedActualBalances]] = await Promise.all([
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
    pending: chunkedPendingBalance.chunks.map(
      (el) => new TwistedElGamalCiphertext(el.left.data.slice(2), el.right.data.slice(2)),
    ),
    actual: chunkedActualBalances.chunks.map(
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
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::veil_to`,
      functionArguments: [tokenAddress, sender, String(amount)],
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
  const veiledWithdraw = await VeiledWithdraw.create({
    privateKey: toTwistedEd25519PrivateKey(args.privateKey),
    encryptedActualBalance: args.encryptedBalance,
    amountToWithdraw: args.amount,
    randomness: args.randomness,
  });

  const [{ sigmaProof, rangeProof }, veiledAmountAfterWithdraw] = await veiledWithdraw.authorizeWithdrawal();

  return generateTransaction({
    aptosConfig: args.aptosConfig,
    sender: args.sender,
    data: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::unveil_to`,
      functionArguments: [
        args.tokenAddress,
        AccountAddress.from(args.sender),
        String(args.amount),
        concatBytes(...veiledAmountAfterWithdraw.map((el) => el.serialize()).flat()),
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

export async function safeRolloverPendingVeiledBalanceTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  tokenAddress: string;
  withFreezeBalance?: boolean;

  privateKey: TwistedEd25519PrivateKey;
  unnormilizedEncryptedBalance: TwistedElGamalCiphertext[];
  balanceAmount: bigint;
  randomness?: bigint[];

  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction[]> {
  const txList: SimpleTransaction[] = [];

  const isNormalized = await isUserBalanceNormalized({
    aptosConfig: args.aptosConfig,
    accountAddress: AccountAddress.from(args.sender),
    tokenAddress: args.tokenAddress,
  });

  if (!isNormalized) {
    const normalizeTx = await normalizeUserBalance({
      aptosConfig: args.aptosConfig,
      accountAddress: AccountAddress.from(args.sender),
      tokenAddress: args.tokenAddress,

      privateKey: args.privateKey,
      unnormilizedEncryptedBalance: args.unnormilizedEncryptedBalance,
      balanceAmount: args.balanceAmount,
      randomness: args.randomness,

      sender: args.sender,

      options: args.options,
    });

    txList.push(normalizeTx);
  }

  const rolloverTx = await rolloverPendingVeiledBalanceTransaction({
    aptosConfig: args.aptosConfig,
    sender: args.sender,
    tokenAddress: args.tokenAddress,
    withFreezeBalance: args.withFreezeBalance,
    options: args.options,
  });

  txList.push(rolloverTx);

  return txList;
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
  const veiledTransfer = await VeiledTransfer.create({
    senderPrivateKey: toTwistedEd25519PrivateKey(args.senderPrivateKey),
    encryptedActualBalance: args.encryptedBalance,
    amountToTransfer: args.amount,
    recipientPublicKey: toTwistedEd25519PublicKey(args.recipientPublicKey),
    auditorPublicKeys: args.auditorPublicKeys?.map((el) => toTwistedEd25519PublicKey(el)) || [],
    randomness: args.randomness,
  });

  const [
    {
      sigmaProof,
      rangeProof: { rangeProofAmount, rangeProofNewBalance },
    },
    encryptedAmountAfterTransfer,
    encryptedAmountByRecipient,
    auditorsVBList,
  ] = await veiledTransfer.authorizeTransfer();

  const newBalance = encryptedAmountAfterTransfer.map((el) => el.serialize()).flat();
  const transferBalance = encryptedAmountByRecipient.map((el) => el.serialize()).flat();
  const auditorEks = veiledTransfer.auditorsU8PublicKeys;
  const auditorBalances = auditorsVBList
    .flat()
    .map((el) => el.serialize())
    .flat();

  return generateTransaction({
    aptosConfig: args.aptosConfig,
    sender: args.sender,
    data: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::fully_veiled_transfer`,
      functionArguments: [
        args.tokenAddress,
        args.recipient,
        concatBytes(...newBalance),
        concatBytes(...transferBalance),
        concatBytes(...auditorEks),
        concatBytes(...auditorBalances),
        rangeProofNewBalance,
        rangeProofAmount,
        VeiledTransfer.serializeSigmaProof(sigmaProof),
      ],
    },
    options: args.options,
  });
}

export async function veiledBalanceKeyRotationTransaction(args: {
  oldPrivateKey: TwistedEd25519PrivateKey | HexInput;
  newPrivateKey: TwistedEd25519PrivateKey | HexInput;
  balance: bigint;
  oldEncryptedBalance: TwistedElGamalCiphertext[];
  randomness?: bigint[];
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  tokenAddress: string;
  withUnfreezeBalance?: boolean;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const veiledKeyRotation = new VeiledKeyRotation(
    toTwistedEd25519PrivateKey(args.oldPrivateKey),
    toTwistedEd25519PrivateKey(args.newPrivateKey),
    args.oldEncryptedBalance,
  );

  await veiledKeyRotation.init();

  const [{ sigmaProof, rangeProof }, newVB] = await veiledKeyRotation.authorizeKeyRotation();

  const newPublicKeyU8 = toTwistedEd25519PrivateKey(args.newPrivateKey).publicKey().toUint8Array();

  const serializedNewBalance = concatBytes(...newVB.map((el) => [el.C.toRawBytes(), el.D.toRawBytes()]).flat());

  // TODO
  const method = args.withUnfreezeBalance ? "rotate_public_key_and_unfreeze" : "rotate_public_key";

  return generateTransaction({
    aptosConfig: args.aptosConfig,
    sender: args.sender,
    data: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::${method}`,
      functionArguments: [
        args.tokenAddress,
        newPublicKeyU8,
        serializedNewBalance,
        rangeProof,
        VeiledKeyRotation.serializeSigmaProof(sigmaProof),
      ],
    },
    options: args.options,
  });
}

export async function hasUserRegistered(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddress;
  tokenAddress: string;
  options?: LedgerVersionArg;
}): Promise<boolean> {
  const [isRegister] = await view<[boolean]>({
    aptosConfig: args.aptosConfig,
    payload: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::has_veiled_coin_store`,
      typeArguments: [],
      functionArguments: [args.accountAddress, args.tokenAddress],
    },
    options: args.options,
  });

  return isRegister;
}

export async function isUserBalanceNormalized(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddress;
  tokenAddress: string;
  options?: LedgerVersionArg;
}): Promise<boolean> {
  const [isNormalized] = await view<[boolean]>({
    aptosConfig: args.aptosConfig,
    payload: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::is_normalized`,
      typeArguments: [],
      functionArguments: [args.accountAddress, args.tokenAddress],
    },
    options: args.options,
  });

  return isNormalized;
}

export async function normalizeUserBalance(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddress;
  tokenAddress: string;

  privateKey: TwistedEd25519PrivateKey;
  unnormilizedEncryptedBalance: TwistedElGamalCiphertext[];
  balanceAmount: bigint;
  randomness?: bigint[];

  sender: AccountAddressInput;

  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const veiledNormalization = await VeiledNormalization.create({
    privateKey: args.privateKey,
    unnormilizedEncryptedBalance: args.unnormilizedEncryptedBalance,
    balanceAmount: args.balanceAmount,
    randomness: args.randomness,
  });

  const [{ sigmaProof, rangeProof }, normalizedVB] = await veiledNormalization.authorizeNormalization();

  return generateTransaction({
    aptosConfig: args.aptosConfig,
    sender: args.sender,
    data: {
      function: `${VEILED_COIN_MODULE_ADDRESS}::veiled_coin::normalize`,
      functionArguments: [
        args.tokenAddress,
        concatBytes(...normalizedVB.map((el) => el.serialize()).flat()),
        rangeProof,
        VeiledNormalization.serializeSigmaProof(sigmaProof),
      ],
    },
    options: args.options,
  });
}
