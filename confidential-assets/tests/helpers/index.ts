import path from "path";
import fs from "fs";
import { genBatchRangeZKP, generateRangeZKP, verifyBatchRangeZKP, verifyRangeZKP } from "./wasmRangeProof";
import {
  Network,
  NetworkToNetworkName,
  CedraConfig,
  Cedra,
  AccountAddress,
  AnyRawTransaction,
  Account,
  CommittedTransactionResponse,
  InputGenerateTransactionPayloadData,
  TransactionWorkerEventsEnum,
  Ed25519PrivateKey,
  PrivateKey,
  PrivateKeyVariants,
  Ed25519Account,
} from "@cedra-labs/ts-sdk";
import { ConfidentialAmount } from "../../src/confidentialAmount";
import { ConfidentialAsset } from "../../src/confidentialAsset";
import { RangeProofExecutor } from "../../src/rangeProof";
import { TwistedEd25519PrivateKey } from "../../src/twistedEd25519";

export const longTestTimeout = 120 * 1000;

/**
 * Address of the mocked fungible token on the testnet
 */
export const TOKEN_ADDRESS = "0x8b4dd7ebf8150f349675dde8bd2e9daa66461107b181a67e764de85d82bbac21";

const CEDRA_NETWORK: Network = NetworkToNetworkName[Network.DEVNET];
const config = new CedraConfig({ network: CEDRA_NETWORK });
export const confidentialAsset = new ConfidentialAsset(config, {
  confidentialAssetModuleAddress: "0xd4aa5d2b93935bae55ef5aee8043e78e09e91ad1d31ea9532963a036b1cd5df1",
});
export const cedra = new Cedra(config);

const rootDir = path.resolve(__dirname, "../../../");

export const addNewContentLineToFile = (filename: string, data: string) => {
  const filePath = path.resolve(rootDir, filename);

  const content = `\n#TESTNET_DK=${data}\n`;

  fs.appendFileSync(filePath, content);
};

export const getBalances = async (
  decryptionKey: TwistedEd25519PrivateKey,
  accountAddress: AccountAddress,
  tokenAddress = TOKEN_ADDRESS,
) => {
  const aliceChunkedConfidentialBalance = await confidentialAsset.getBalance({
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
  const pendingTxn = await cedra.signAndSubmitTransaction({ signer, transaction });
  return cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
};

export const sendAndWaitBatchTxs = async (
  txPayloads: InputGenerateTransactionPayloadData[],
  sender: Account,
): Promise<CommittedTransactionResponse[]> => {
  cedra.transaction.batch.forSingleAccount({
    sender,
    data: txPayloads,
  });

  let allTxSentPromiseResolve: (value: void | PromiseLike<void>) => void;

  const txHashes: string[] = [];
  cedra.transaction.batch.on(TransactionWorkerEventsEnum.TransactionSent, async (data) => {
    txHashes.push(data.transactionHash);

    if (txHashes.length === txPayloads.length) {
      allTxSentPromiseResolve();
    }
  });

  await new Promise<void>((resolve) => {
    allTxSentPromiseResolve = resolve;
  });

  return Promise.all(txHashes.map((txHash) => cedra.waitForTransaction({ transactionHash: txHash })));
};

export const getTestAccount = () => {
  if (process.env.TESTNET_PK) {
    return Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(
        PrivateKey.formatPrivateKey(process.env.TESTNET_PK, PrivateKeyVariants.Ed25519),
      ),
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
  const transaction = await cedra.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${confidentialAsset.confidentialAssetModuleAddress}::mock_token::mint_to`,
      functionArguments: [500],
    },
  });
  const pendingTxn = await cedra.signAndSubmitTransaction({ signer: account, transaction });
  return cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
};

RangeProofExecutor.setGenBatchRangeZKP(genBatchRangeZKP);
RangeProofExecutor.setVerifyBatchRangeZKP(verifyBatchRangeZKP);
RangeProofExecutor.setGenerateRangeZKP(generateRangeZKP);
RangeProofExecutor.setVerifyRangeZKP(verifyRangeZKP);
