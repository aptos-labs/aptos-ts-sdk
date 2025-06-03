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
} from "@aptos-labs/ts-sdk";
import { ConfidentialAssetTransactionBuilder } from "../../src";
import { TwistedEd25519PrivateKey } from "../../src";
import { ConfidentialAsset } from "../../src";

export const longTestTimeout = 120 * 1000;

/**
 * Address usdt token on the testnet
 */
export const TOKEN_ADDRESS = "0xd5d0d561493ea2b9410f67da804653ae44e793c2423707d4f11edb2e38192050";

/**
 * This handles the nonsense where we have to use network = custom if we want to use
 * the faucet on testnet with a token.
 */
function getConfig(networkRaw: Network, apiKey: string | undefined, faucetToken: string | undefined) {
  const network = faucetToken !== undefined ? Network.CUSTOM : networkRaw;
  let customSettings;
  if (network === Network.CUSTOM) {
    const baseConfig = new AptosConfig({ network: Network.TESTNET });
    const tempAptos = new Aptos(baseConfig);
    customSettings = {
      fullnode: tempAptos.config.getRequestUrl(AptosApiType.FULLNODE),
      faucet: "https://faucet.testnet.aptoslabs.com",
      indexer: tempAptos.config.getRequestUrl(AptosApiType.INDEXER),
    };
  }
  return new AptosConfig({
    network,
    clientConfig: { API_KEY: apiKey },
    faucetConfig: { AUTH_TOKEN: faucetToken },
    ...(customSettings ?? {}),
  });
}

// We have to use a custom network if we have a faucet token to make the SDK happy.
const API_KEY = process.env.APTOS_API_KEY;
export const FAUCET_TOKEN = process.env.FAUCET_TOKEN;
if (!FAUCET_TOKEN) {
  throw new Error("FAUCET_TOKEN is not set for testnet");
}
if (!API_KEY) {
  throw new Error("API_KEY is not set for testnet");
}
const APTOS_NETWORK: Network = FAUCET_TOKEN ? Network.CUSTOM : NetworkToNetworkName[Network.TESTNET];
const config = getConfig(APTOS_NETWORK, API_KEY, FAUCET_TOKEN);
export const transactionBuilder = new ConfidentialAssetTransactionBuilder(config, {
  confidentialAssetModuleAddress: "0xbe14a545c8e1f0024a1665f39fc1227c066727a70236e784fb203ec619fedf4c",
});
export const confidentialAsset = new ConfidentialAsset({
  config,
  confidentialAssetModuleAddress: "0xbe14a545c8e1f0024a1665f39fc1227c066727a70236e784fb203ec619fedf4c",
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

/**
 * TOKEN_ADDRESS is binded to ConfidentialCoin.CONFIDENTIAL_COIN_MODULE_ADDRESS mock token, be aware of that when minting tokens
 * Make sure you are minting the token that is actual TOKEN_ADDRESS
 * @param account
 */
export const mintFungibleTokens = async (account: Account) => {
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${transactionBuilder.confidentialAssetModuleAddress}::mock_token::mint_to`,
      functionArguments: [500],
    },
  });
  const pendingTxn = await aptos.signAndSubmitTransaction({ signer: account, transaction });
  return aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
};

export async function mintUsdt(account: Ed25519Account, amountInUsdt: bigint) {
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      // TODO: Do something smarter than just hardcode this.
      // function: `0x33c6f1c080cffdb8bc57dbd93bf2e4f10420f729bedb430ffd79c788518e0f86::mock_token::mint_to`,
      // This is testnet USDT:
      function: `0x24246c14448a5994d9f23e3b978da2a354e64b6dfe54220debb8850586c448cc::usdt::faucet`,
      functionArguments: [amountInUsdt * 10n ** 6n],
    },
  });
  return await sendTxn(account, transaction);
}

async function sendTxn(account: Ed25519Account, transaction: SimpleTransaction) {
  const res = await aptos.signAndSubmitTransaction({ signer: account, transaction });
  return await aptos.waitForTransaction({ transactionHash: res.hash });
}
