import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import {
  Network,
  NetworkToNetworkName,
  AptosConfig,
  Aptos,
  AccountAddress,
  AnyRawTransaction,
  Account,
  Bool,
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
  MoveVector,
  MoveString,
  U8,
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
  confidentialAssetModuleAddress: "0x1",
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

/**
 * Returns the localnet core resources account (0xA550C18) by reading the BCS-encoded
 * private key from ~/.aptos/testnet/mint.key. During test genesis, the root_key's auth key
 * is set on this account. It has mint capability and can call
 * `aptos_governance::get_signer_testnet_only` to obtain the 0x1 framework signer.
 */
export const getCoreResourcesAccount = (): Ed25519Account => {
  // The mint.key is written inside aptos-core/.aptos/ by run-localnet.
  // It contains the BCS-encoded root_key whose auth key is set on 0xA550C18 during genesis.
  const aptosCorePath = path.resolve(__dirname, "../../../../aptos-core");
  const keyPath = path.join(aptosCorePath, ".aptos/testnet/mint.key");
  const keyBytes = fs.readFileSync(keyPath);
  const rawKey = keyBytes.slice(1); // strip BCS length prefix
  const privateKey = new Ed25519PrivateKey(rawKey);
  // The address must be 0xA550C18 (core_resources) — that's where genesis set the
  // auth key to match this private key via rotate_authentication_key_internal.
  return Account.fromPrivateKey({
    privateKey,
    address: AccountAddress.fromStringStrict("0x000000000000000000000000000000000000000000000000000000000A550C18"),
    legacy: true,
  });
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

// =============================================================================
// Governance helpers
// =============================================================================

const GOVERNANCE_SCRIPTS_DIR = path.resolve(__dirname, "../e2e/scripts/governance");

/**
 * Compiles the governance Move scripts (if not already compiled) and returns the
 * bytecode directory path. This ensures tests work regardless of whether the build
 * artifacts are checked in.
 */
export function compileGovernanceScripts(): string {
  const bytecodeDir = path.join(GOVERNANCE_SCRIPTS_DIR, "build/governance/bytecode_scripts");
  if (!fs.existsSync(bytecodeDir)) {
    execSync("aptos move compile", { cwd: GOVERNANCE_SCRIPTS_DIR, stdio: "pipe" });
  }
  return bytecodeDir;
}

function loadGovernanceScript(bytecodeDir: string, name: string): Uint8Array {
  return fs.readFileSync(path.join(bytecodeDir, `${name}.mv`));
}

/** A plain Aptos client without the fee payer plugin (for governance txns). */
export const plainAptos = new Aptos(new AptosConfig({ network: APTOS_NETWORK }));

/**
 * Submits a governance script transaction signed by the core resources account.
 * Returns the transaction result (does not throw on VM failure).
 */
export async function submitGovernanceScript(args: {
  coreResourcesAccount: Ed25519Account;
  bytecodeDir: string;
  scriptName: string;
  functionArguments: any[];
}): Promise<CommittedTransactionResponse> {
  const bytecode = loadGovernanceScript(args.bytecodeDir, args.scriptName);

  const txn = await plainAptos.transaction.build.simple({
    sender: args.coreResourcesAccount.accountAddress,
    data: {
      bytecode,
      functionArguments: args.functionArguments,
    },
  });

  const pendingTxn = await plainAptos.signAndSubmitTransaction({
    signer: args.coreResourcesAccount,
    transaction: txn,
  });

  return plainAptos.waitForTransaction({
    transactionHash: pendingTxn.hash,
    options: { checkSuccess: false },
  });
}
