import path from "path";
import fs from "fs";
import {
  Account,
  AccountAddress,
  AnyRawTransaction,
  Aptos,
  AptosConfig,
  CommittedTransactionResponse,
  Ed25519PrivateKey,
  InputGenerateTransactionPayloadData,
  Network,
  NetworkToNetworkName,
  TableMap,
  TransactionWorkerEventsEnum,
  TwistedEd25519PrivateKey,
  ConfidentialAmount,
  RangeProofExecutor,
  Ed25519Account,
  ConfidentialCoin,
} from "../../../src";
import { generateRangeZKP, verifyRangeZKP } from "./wasmRangeProof";

export async function loadTableMapJSON(url: string): Promise<{
  file_name: string;
  s: string[];
  slog: string[];
  table: {
    point: string;
    value: string;
  }[];
}> {
  const tableMapResponse = await fetch(url);

  if (!tableMapResponse.ok) {
    throw new TypeError("Failed to load table map");
  }

  return tableMapResponse.json();
}

export async function loadTableMap(url: string) {
  return TableMap.createFromJson(JSON.stringify(await loadTableMapJSON(url)));
}

/**
 * Address of the mocked fungible token on the testnet
 */
export const TOKEN_ADDRESS = "0xea70167cd603ed1f982d8361343b279263c2408b5c0053a48e7dda0834ea5b1b";

const APTOS_NETWORK: Network = NetworkToNetworkName[Network.TESTNET];
const config = new AptosConfig({ network: APTOS_NETWORK });
export const aptos = new Aptos(config);

const rootDir = path.resolve(__dirname, "../../../");

export const addNewContentLineToFile = (filename: string, data: string) => {
  const filePath = path.resolve(rootDir, filename);

  const content = `\n#TESTNET_DK=${data}\n`;

  fs.appendFileSync(filePath, content);
};

export const getBalances = async (decryptionKey: TwistedEd25519PrivateKey, accountAddress: AccountAddress) => {
  const aliceChunkedVeiledBalance = await aptos.veiledCoin.getBalance({
    accountAddress,
    tokenAddress: TOKEN_ADDRESS,
  });

  const aliceVeiledAmountPending = await ConfidentialAmount.fromEncrypted(
    aliceChunkedVeiledBalance.pending,
    decryptionKey,
  );
  const aliceVeiledAmountActual = await ConfidentialAmount.fromEncrypted(
    aliceChunkedVeiledBalance.actual,
    decryptionKey,
  );

  return {
    pending: aliceVeiledAmountPending,
    actual: aliceVeiledAmountActual,
  };
};

export const sendAndWaitTx = async (
  transaction: AnyRawTransaction,
  signer: Account,
): Promise<CommittedTransactionResponse> => {
  const pendingTxn = await aptos.signAndSubmitTransaction({ signer, transaction });
  return aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
};

export const sendAndWaitBatchTxs = async (
  txPayloads: InputGenerateTransactionPayloadData[],
  sender: Account,
): Promise<CommittedTransactionResponse[]> => {
  aptos.transaction.batch.forSingleAccount({
    sender,
    data: txPayloads,
  });

  let allTxSentPromiseResolve: (value: void | PromiseLike<void>) => void;

  const txHashes: string[] = [];
  aptos.transaction.batch.on(TransactionWorkerEventsEnum.TransactionSent, async (data) => {
    txHashes.push(data.transactionHash);

    if (txHashes.length === txPayloads.length) {
      allTxSentPromiseResolve();
    }
  });

  await new Promise<void>((resolve) => {
    allTxSentPromiseResolve = resolve;
  });

  return Promise.all(txHashes.map((txHash) => aptos.waitForTransaction({ transactionHash: txHash })));
};

export const getTestAccount = () => {
  if (process.env.TESTNET_PK) {
    return Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(process.env.TESTNET_PK),
    });
  }

  return Account.generate();
};

export const getTestVeiledAccount = (account?: Ed25519Account) => {
  if (process.env.TESTNET_DK) {
    return new TwistedEd25519PrivateKey(process.env.TESTNET_DK);
  }

  if (!account) return TwistedEd25519PrivateKey.generate();

  const signature = account.sign(TwistedEd25519PrivateKey.decryptionKeyDerivationMessage);

  return TwistedEd25519PrivateKey.fromSignature(signature);
};

export const mintFungibleTokens = async (account: Account) => {
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${ConfidentialCoin.VEILED_COIN_MODULE_ADDRESS}::mock_token::mint_to`,
      functionArguments: [500],
    },
  });
  const pendingTxn = await aptos.signAndSubmitTransaction({ signer: account, transaction });
  return aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
};

/** !important: for testing purposes */
RangeProofExecutor.setGenerateRangeZKP(generateRangeZKP);
RangeProofExecutor.setVerifyRangeZKP(verifyRangeZKP);
