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
  TransactionWorkerEventsEnum,
  TwistedEd25519PrivateKey,
} from "../../../src";
import { VeiledAmount } from "../../../src/core/crypto/veiled/veiledAmount";

/**
 * Address of the mocked fungible token on the testnet
 */
export const TOKEN_ADDRESS = "0x4659b416f0ee349907881a5c422e307ea1838fbbf7041b78f5d3dec078a6faa4";

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

  const aliceVeiledAmountPending = await VeiledAmount.fromEncrypted(aliceChunkedVeiledBalance.pending, decryptionKey);
  const aliceVeiledAmountActual = await VeiledAmount.fromEncrypted(aliceChunkedVeiledBalance.actual, decryptionKey);

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

export const getTestVeiledAccount = () => {
  if (process.env.TESTNET_DK) {
    return new TwistedEd25519PrivateKey(process.env.TESTNET_DK);
  }

  return TwistedEd25519PrivateKey.generate();
};
