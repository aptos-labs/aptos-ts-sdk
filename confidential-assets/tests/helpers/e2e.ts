/**
 * This file contains helpers for E2E tests, generally meaning they interact with a network.
 */

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
} from "@aptos-labs/ts-sdk";
import { ConfidentialAmount } from "../../src/confidentialAmount";
import { ConfidentialAsset } from "../../src/confidentialAsset";
import { TwistedEd25519PrivateKey } from "../../src/twistedEd25519";

export const TESTING_NETWORK = process.env.TESTING_NETWORK || Network.TESTNET;

export type MockTokenData = {
  address: string;
  mintingPayload: InputGenerateTransactionPayloadData;
};

function getMockTokenData(): MockTokenData {
  if (TESTING_NETWORK === Network.TESTNET) {
    return {
      address: "0xd5d0d561493ea2b9410f67da804653ae44e793c2423707d4f11edb2e38192050",
      mintingPayload: {
        function: `0x24246c14448a5994d9f23e3b978da2a354e64b6dfe54220debb8850586c448cc::usdt::faucet`,
        functionArguments: [5000000],
      },
    };
  }

  throw new Error(`No default token data for network ${TESTING_NETWORK}, set MOCK_TOKEN_ADDRESS`);
}

function getConfidentialAssetModuleAddress(): string {
  if (process.env.CONFIDENTIAL_ASSETS_MODULE_ADDRESS) {
    return process.env.CONFIDENTIAL_ASSETS_MODULE_ADDRESS;
  }

  if (TESTING_NETWORK === Network.TESTNET) {
    return "0x7571d0b7084d07cbc74b8a6c904d9bea6e1e9c5c4fdcf61b77cecd7f471421bc";
  }

  throw new Error(
    `No default confidential asset module address for network ${TESTING_NETWORK}, set CONFIDENTIAL_ASSETS_MODULE_ADDRESS`,
  );
}

export const MOCK_TOKEN_DATA = getMockTokenData();
export const CONFIDENTIAL_ASSETS_MODULE_ADDRESS = getConfidentialAssetModuleAddress();

const APTOS_NETWORK: Network = NetworkToNetworkName[TESTING_NETWORK];
const config = new AptosConfig({ network: APTOS_NETWORK });
export const confidentialAsset = new ConfidentialAsset(config, {
  confidentialAssetModuleAddress: CONFIDENTIAL_ASSETS_MODULE_ADDRESS,
});
export const aptos = new Aptos(config);

/** Catch common issues, particularly with trying to test against testnet. */
export async function preCheck() {
  if (TESTING_NETWORK === Network.TESTNET) {
    if (!process.env.TESTNET_PK) {
      throw new Error("TESTNET_PK must be set if the network is testnet");
    }

    const privateKey = new Ed25519PrivateKey(process.env.TESTNET_PK);
    const account = Account.fromPrivateKey({ privateKey });
    try {
      const aptBalance = await aptos.account.getAccountAPTAmount({ accountAddress: account.accountAddress });
      if (aptBalance === 0) {
        throw new Error(
          "TESTNET_PK does not correspond to an account with APT, please use a valid testnet private key",
        );
      }
    } catch (e) {
      throw new Error("TESTNET_PK does not correspond to an existing account, please use a valid testnet private key");
    }
  }
}

export const getBalances = async (
  decryptionKey: TwistedEd25519PrivateKey,
  accountAddress: AccountAddress,
  tokenAddress = MOCK_TOKEN_DATA.address,
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

/** This mints USDt. Only tested with testnet. */
export const mintFungibleTokens = async (account: Account) => {
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: MOCK_TOKEN_DATA.mintingPayload,
  });
  const pendingTxn = await aptos.signAndSubmitTransaction({ signer: account, transaction });
  return aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
};
