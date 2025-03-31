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
  PrivateKeyVariants,
  PrivateKey,
} from "../../../src";
import { genBatchRangeZKP, generateRangeZKP, verifyBatchRangeZKP, verifyRangeZKP } from "./wasmRangeProof";

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
export const TOKEN_ADDRESS = "0x8b4dd7ebf8150f349675dde8bd2e9daa66461107b181a67e764de85d82bbac21";
// export const TOKEN_ADDRESS = "0xb63fe2a70847e0b34b309eab304fc8854b482a2e8eb2ebfb8080c511def0dacf";

const APTOS_NETWORK: Network = NetworkToNetworkName[Network.DEVNET];
const config = new AptosConfig({ network: APTOS_NETWORK });
export const aptos = new Aptos(config);

const rootDir = path.resolve(__dirname, "../../../");

export const addNewContentLineToFile = (filename: string, data: string) => {
  const filePath = path.resolve(rootDir, filename);

  const content = `\n#TESTNET_DK=${data}\n`;

  fs.appendFileSync(filePath, content);
};

export const getBalances = async (decryptionKey: TwistedEd25519PrivateKey, accountAddress: AccountAddress, tokenAddress = TOKEN_ADDRESS) => {
  const aliceChunkedConfidentialBalance = await aptos.confidentialCoin.getBalance({
    accountAddress,
    tokenAddress,
  });

  const aliceConfidentialAmountPending = await ConfidentialAmount.fromEncrypted(
    aliceChunkedConfidentialBalance.pending,
    decryptionKey,
  );
  const aliceConfidentialAmountActual = await ConfidentialAmount.fromEncrypted(
    aliceChunkedConfidentialBalance.actual,
    decryptionKey,
  );

  return {
    pending: aliceConfidentialAmountPending,
    actual: aliceConfidentialAmountActual,
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
      privateKey: new Ed25519PrivateKey(PrivateKey.formatPrivateKey(process.env.TESTNET_PK, PrivateKeyVariants.Ed25519)),
    });
  }

  return Account.generate();
};

export const getTestConfidentialAccount = (account?: Ed25519Account) => {
  if (process.env.TESTNET_DK) {
    return new TwistedEd25519PrivateKey(process.env.TESTNET_DK);
  }

  if (!account) return TwistedEd25519PrivateKey.generate();

  const signature = account.sign(TwistedEd25519PrivateKey.decryptionKeyDerivationMessage);

  return TwistedEd25519PrivateKey.fromSignature(signature);
};

/**
 * TOKEN_ADDRESS is binded to ConfidentialCoin.CONFIDENTIAL_COIN_MODULE_ADDRESS mock token, be aware of that when minting tokens
 * Make sure you are minting the token that is actual TOKEN_ADDRESS
 * @param account
 */
export const mintFungibleTokens = async (account: Account) => {
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${ConfidentialCoin.CONFIDENTIAL_COIN_MODULE_ADDRESS}::mock_token::mint_to`,
      functionArguments: [500],
    },
  });
  const pendingTxn = await aptos.signAndSubmitTransaction({ signer: account, transaction });
  return aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
};

RangeProofExecutor.setGenBatchRangeZKP(genBatchRangeZKP);
RangeProofExecutor.setVerifyBatchRangeZKP(verifyBatchRangeZKP);
RangeProofExecutor.setGenerateRangeZKP(generateRangeZKP);
RangeProofExecutor.setVerifyRangeZKP(verifyRangeZKP);
