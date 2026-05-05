import path from "node:path";
import fs from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  Network,
  AptosConfig,
  Aptos,
  AccountAddress,
  Account,
  CommittedTransactionResponse,
  Ed25519PrivateKey,
  PrivateKey,
  PrivateKeyVariants,
  Ed25519Account,
  PendingTransactionResponse,
  InputSubmitTransactionData,
  TransactionSubmitter,
} from "@aptos-labs/ts-sdk";
import { TwistedEd25519PrivateKey } from "../../src/index.js";
import { ConfidentialAsset } from "../../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Use a plain config (no plugins) to avoid re-triggering this plugin on the inner submit call.
    // Spreading args.aptosConfig would copy pluginSettings (including TRANSACTION_SUBMITTER),
    // causing infinite recursion where the fee payer is re-applied on every recursive call.
    const aptos = new Aptos(new AptosConfig({ network: args.aptosConfig.network }));
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

/**
 * Returns the localnet core resources account (0xA550C18) by reading the BCS-encoded
 * private key from mint.key. During test genesis, the root_key's auth key is set on this
 * account. It has mint capability and can call `aptos_governance::get_signer_testnet_only`
 * to obtain the 0x1 framework signer.
 *
 * Returns undefined if mint.key is not found (e.g., governance scripts are not available).
 */
export const getCoreResourcesAccount = (): Ed25519Account | undefined => {
  // The localnet must write mint.key to ~/.aptos/testnet/. This happens automatically
  // with the npm CLI package. When running from source, pass --test-dir ~/.aptos/testnet.
  const candidates = [path.join(process.env.HOME || "~", ".aptos/testnet/mint.key")];

  const keyPath = candidates.find((p) => fs.existsSync(p));
  if (!keyPath) return undefined;

  const keyBytes = fs.readFileSync(keyPath);
  const rawKey = keyBytes.subarray(1); // strip BCS length prefix
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
 * A convenience function to compile a package locally with the CLI
 * @param packageDir directory of the package to compile
 * @param args extra arguments to pass to the compile command
 */
export function compilePackage(packageDir: string, args?: string[]) {
  try {
    execSync("aptos --version");
  } catch {
    console.log("In order to run compilation, you must have the `aptos` CLI installed.");
    console.log("aptos is not installed. Please install it from the instructions on aptos.dev");
  }

  // Assume yes automatically overwrites the previous compiled version, only do this if you are sure you want to overwrite the previous version.
  const cliArgs = ["move", "compile", "--package-dir", packageDir];
  if (args) cliArgs.push(...args);

  console.log("Running the compilation locally, in a real situation you may want to compile this ahead of time.");
  console.log(["aptos", ...cliArgs].join(" "));

  const result = spawnSync("aptos", cliArgs, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Compilation failed with exit code ${result.status}`);
  }
}

/**
 * Compiles the governance Move scripts (if not already compiled) and returns the
 * bytecode directory path. Returns undefined if compilation fails (e.g., Move
 * framework source not available in CI).
 */
export function compileGovernanceScripts(): string | undefined {
  const bytecodeDir = path.join(GOVERNANCE_SCRIPTS_DIR, "build/governance/bytecode_scripts");
  // Compilation must succeed
  compilePackage(GOVERNANCE_SCRIPTS_DIR, []);
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
