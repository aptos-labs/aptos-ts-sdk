import path from "path";
import fs from "fs";
import {
  Network,
  NetworkToNetworkName,
  AptosConfig,
  Aptos,
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
  AptosApiType,
  SimpleTransaction,
  PendingTransactionResponse,
  InputSubmitTransactionData,
  TransactionSubmitter,
} from "@aptos-labs/ts-sdk";
import { ConfidentialAssetTransactionBuilder } from "../../src";
import { TwistedEd25519PrivateKey } from "../../src";
import { ConfidentialAsset } from "../../src";

export const longTestTimeout = 120 * 1000;

/**
 * Address APT token to be used for testing.
 */
export const TOKEN_ADDRESS = "0x000000000000000000000000000000000000000000000000000000000000000a";

const APTOS_NETWORK: Network = Network.LOCAL;

export const feePayerAccount = Account.generate();

// Create a custom transaction submitter that implements the TransactionSubmitter interface
class CustomTransactionSubmitter implements TransactionSubmitter {
  async submitTransaction(
    args: {
      aptosConfig: AptosConfig;
    } & Omit<InputSubmitTransactionData, "transactionSubmitter">,
  ): Promise<PendingTransactionResponse> {
    const newConfig = new AptosConfig({
      ...args.aptosConfig,
    });
    const aptos = new Aptos(newConfig);
    const feePayerAuthenticator = aptos.signAsFeePayer({ signer: feePayerAccount, transaction: args.transaction });
    return aptos.transaction.submit.simple({
      transaction: args.transaction,
      senderAuthenticator: args.senderAuthenticator,
      feePayerAuthenticator,
    });
  }
}

const config = new AptosConfig({
  network: APTOS_NETWORK,
  pluginSettings: {
    TRANSACTION_SUBMITTER: new CustomTransactionSubmitter(),
  },
});
export const confidentialAsset = new ConfidentialAsset({
  config,
  confidentialAssetModuleAddress: "0x7",
  withFeePayer: true,
});
export const aptos = new Aptos(config);

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
  return confidentialAsset.getBalance({
    decryptionKey,
    accountAddress,
    tokenAddress,
  });
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
      privateKey: new Ed25519PrivateKey(
        PrivateKey.formatPrivateKey(process.env.TESTNET_PK, PrivateKeyVariants.Ed25519),
      ),
    });
  }

  console.log("Generating new account");
  const account = Account.generate();
  console.log(`Account generated: ${account.accountAddress}`);
  return account;
};

export const getTestConfidentialAccount = (account?: Ed25519Account) => {
  if (process.env.TESTNET_DK) {
    return new TwistedEd25519PrivateKey(process.env.TESTNET_DK);
  }

  if (!account) return TwistedEd25519PrivateKey.generate();

  const signature = account.sign(TwistedEd25519PrivateKey.decryptionKeyDerivationMessage);

  return TwistedEd25519PrivateKey.fromSignature(signature);
};
