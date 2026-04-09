#!/usr/bin/env node
/**
 * Confidential Asset Load Test
 *
 * Measures throughput and latency of Aptos confidential asset operations
 * (deposit, rollover, transfer, withdraw) against a configurable endpoint.
 *
 * Each account runs in its own worker thread with its own WASM instance,
 * giving true parallel ZK proof generation.
 *
 * Usage:
 *   npx tsx scripts/load-test.ts --funder-key <hex> [options]
 *
 * Required:
 *   --funder-key <hex>          Private key (hex) of a pre-funded account on the target
 *                               network. Used to fund test accounts with APT for gas.
 *
 * Options:
 *   --duration <sec>            Test duration in seconds              (default: 60)
 *   --accounts <num>            Number of participant accounts        (default: 4)
 *   --network <name>            Network: testnet|mainnet|devnet|local|custom (default: testnet)
 *   --endpoint <url>            Override fullnode URL (optional; required when --network custom)
 *   --token <addr>              Fungible Asset token address          (default: APT = 0xa)
 *   --module-address <addr>     Confidential asset module address     (default: 0x1)
 *   --fund-amount <octas>       APT (in octas) to send each account   (default: 10000000 = 0.1 APT)
 *   --initial-deposit <num>     Confidential deposit per account      (default: 1000)
 *   --transfer-amount <num>     Amount per transfer/withdraw op       (default: 1)
 *   --stats-interval <sec>      How often to print live stats         (default: 10)
 *   --max-gas <units>           Max gas units per transaction         (default: 50000)
 *   --api-key <key>             API key for authenticated fullnode access (optional)
 *
 * Example:
 *   npx tsx scripts/load-test.ts \
 *     --funder-key 0xabc123... \
 *     --duration 120 \
 *     --accounts 10 \
 *     --network testnet \
 *     --api-key aptoslabs_...
 */

import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  type ClientConfig,
  Ed25519Account,
  Ed25519PrivateKey,
  Network,
  PrivateKey,
  PrivateKeyVariants,
  TransactionWorkerEventsEnum,
  type CommittedTransactionResponse,
  type InputGenerateTransactionPayloadData,
} from "@aptos-labs/ts-sdk";
import {
  ConfidentialAsset,
  ConfidentialTransfer,
  TwistedEd25519PrivateKey,
  TwistedEd25519PublicKey,
  type TwistedElGamalCiphertext,
  initializeWasm,
} from "../src/index.ts";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface Config {
  durationSec: number;
  numAccounts: number;
  network: Network;
  endpoint?: string;
  tokenAddress: string;
  moduleAddress: string;
  funderPrivateKey: string;
  fundAmountOctas: bigint;
  initialDeposit: bigint;
  transferAmount: bigint;
  statsIntervalSec: number;
  maxGasAmount: number;
  apiKey?: string;
}

function parseArgs(): Config {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: npx tsx scripts/load-test.ts --funder-key <hex> [options]

Required:
  --funder-key <hex>        Private key of a pre-funded account

Options:
  --duration <sec>          Test duration in seconds (default: 60)
  --accounts <num>          Number of test accounts / parallel workers (default: 4)
  --network <name>          testnet|mainnet|devnet|local|custom (default: testnet)
  --endpoint <url>          Override fullnode URL (required when --network custom)
  --token <addr>            FA token address (default: APT = 0xa)
  --module-address <addr>   Module address (default: 0x1)
  --fund-amount <octas>     APT to send each account in octas (default: 10000000 = 0.1 APT)
  --initial-deposit <num>   Initial confidential deposit per account (default: 1000)
  --transfer-amount <num>   Amount per transfer/withdraw (default: 1)
  --stats-interval <sec>    Seconds between live stats prints (default: 10)
  --max-gas <units>         Max gas units per transaction (default: 50000)
                            At 100 octas/unit: 50000 units = 0.05 APT max fee per tx
  --api-key <key>           API key for authenticated fullnode access (optional)
    `);
    process.exit(0);
  }

  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
  };

  const funderPrivateKey = get("--funder-key");
  if (!funderPrivateKey) {
    console.error("Error: --funder-key is required. Run with --help for usage.");
    process.exit(1);
  }

  const networkStr = (get("--network") ?? "testnet").toLowerCase();
  const networkMap: Record<string, Network> = {
    testnet: Network.TESTNET,
    mainnet: Network.MAINNET,
    devnet: Network.DEVNET,
    local: Network.LOCAL,
    custom: Network.CUSTOM,
  };
  const network = networkMap[networkStr];
  if (!network) {
    console.error(
      `Error: unknown --network "${networkStr}". Valid values: testnet, mainnet, devnet, local, custom`,
    );
    process.exit(1);
  }

  const endpoint = get("--endpoint");
  if (network === Network.CUSTOM && !endpoint) {
    console.error("Error: --endpoint is required when --network is custom");
    process.exit(1);
  }

  return {
    durationSec: Number(get("--duration") ?? 60),
    numAccounts: Number(get("--accounts") ?? 4),
    network,
    endpoint,
    tokenAddress:
      get("--token") ?? "0x000000000000000000000000000000000000000000000000000000000000000a",
    moduleAddress: get("--module-address") ?? "0x1",
    funderPrivateKey,
    fundAmountOctas: BigInt(get("--fund-amount") ?? 10_000_000),
    initialDeposit: BigInt(get("--initial-deposit") ?? 1000),
    transferAmount: BigInt(get("--transfer-amount") ?? 1),
    statsIntervalSec: Number(get("--stats-interval") ?? 10),
    maxGasAmount: Number(get("--max-gas") ?? 50_000),
    apiKey: get("--api-key"),
  };
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

interface OpStats {
  count: number;
  success: number;
  failed: number;
  totalLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
}

function newOpStats(): OpStats {
  return {
    count: 0,
    success: 0,
    failed: 0,
    totalLatencyMs: 0,
    minLatencyMs: Number.POSITIVE_INFINITY,
    maxLatencyMs: 0,
  };
}

function recordOp(stats: OpStats, latencyMs: number, success: boolean) {
  stats.count++;
  if (success) stats.success++;
  else stats.failed++;
  stats.totalLatencyMs += latencyMs;
  if (latencyMs < stats.minLatencyMs) stats.minLatencyMs = latencyMs;
  if (latencyMs > stats.maxLatencyMs) stats.maxLatencyMs = latencyMs;
}

interface Metrics {
  deposit: OpStats;
  rollover: OpStats;
  transfer: OpStats;
  withdraw: OpStats;
  startTime: number;
  errors: { op: string; msg: string }[];
}

type OpType = "deposit" | "rollover" | "transfer" | "withdraw";
const OP_KEYS: OpType[] = ["deposit", "rollover", "transfer", "withdraw"];

function newMetrics(): Metrics {
  return {
    deposit: newOpStats(),
    rollover: newOpStats(),
    transfer: newOpStats(),
    withdraw: newOpStats(),
    startTime: Date.now(),
    errors: [],
  };
}

function printStats(metrics: Metrics, now: number, header?: string) {
  const elapsed = (now - metrics.startTime) / 1000;

  let totalSuccess = 0;
  let totalAttempts = 0;
  for (const op of OP_KEYS) {
    totalSuccess += metrics[op].success;
    totalAttempts += metrics[op].count;
  }

  const actualTps = elapsed > 0 ? (totalSuccess / elapsed).toFixed(2) : "0.00";

  console.log(`\n${header ?? `--- Stats at ${elapsed.toFixed(1)}s ---`}`);
  console.log(
    `Attempted: ${totalAttempts}  Succeeded: ${totalSuccess}  Failed: ${totalAttempts - totalSuccess}`,
  );
  console.log(`Actual TPS: ${actualTps}`);
  console.log(
    `${"Op".padEnd(10)} ${"Attempts".padStart(8)} ${"OK".padStart(6)} ${"Fail".padStart(6)} ${"Avg(s)".padStart(8)} ${"Min(s)".padStart(8)} ${"Max(s)".padStart(8)}`,
  );
  for (const op of OP_KEYS) {
    const s = metrics[op];
    if (s.count === 0) continue;
    const avg = (s.totalLatencyMs / s.count / 1000).toFixed(2);
    const min =
      s.minLatencyMs === Number.POSITIVE_INFINITY ? "-" : (s.minLatencyMs / 1000).toFixed(2);
    const max = (s.maxLatencyMs / 1000).toFixed(2);
    console.log(
      `${op.padEnd(10)} ${String(s.count).padStart(8)} ${String(s.success).padStart(6)} ${String(s.failed).padStart(6)} ${avg.padStart(8)} ${min.padStart(8)} ${max.padStart(8)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${msg}`);
}

function buildAptosConfig(config: Config): AptosConfig {
  const clientConfig: ClientConfig | undefined = config.apiKey
    ? { API_KEY: config.apiKey }
    : undefined;
  return new AptosConfig({
    network: config.network,
    ...(config.endpoint && { fullnode: config.endpoint }),
    ...(clientConfig && { clientConfig }),
  });
}

// ---------------------------------------------------------------------------
// Worker protocol
// ---------------------------------------------------------------------------

interface WorkerInit {
  accountPrivKeyHex: string;
  decryptionKeyHex: string;
  /** Addresses of all other participant accounts (used as transfer recipients). */
  recipientAddresses: string[];
  initialAvailableBalance: bigint;
  config: Config;
  startTime: number;
  durationMs: number;
}

interface WorkerOpMsg {
  type: "op";
  op: OpType;
  latencyMs: number;
  success: boolean;
  error?: string;
}

interface WorkerDoneMsg {
  type: "done";
}

type WorkerMsg = WorkerOpMsg | WorkerDoneMsg;

// ---------------------------------------------------------------------------
// Worker thread — runs one account in a tight loop
// ---------------------------------------------------------------------------

async function runWorker() {
  const init = workerData as WorkerInit;
  const {
    accountPrivKeyHex,
    decryptionKeyHex,
    recipientAddresses,
    initialAvailableBalance,
    config,
    startTime,
    durationMs,
  } = init;

  // Reconstruct account and decryption key
  const account = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(accountPrivKeyHex),
  });
  const decryptionKey = new TwistedEd25519PrivateKey(decryptionKeyHex);

  // Each worker initializes its own WASM instance
  await initializeWasm();

  const aptosConfig = buildAptosConfig(config);
  const confidentialAsset = new ConfidentialAsset({
    config: aptosConfig,
    confidentialAssetModuleAddress: config.moduleAddress,
  });

  const { gas_estimate: gasUnitPrice } = await confidentialAsset.transaction.client.getGasPriceEstimation();
  const txOptions = { maxGasAmount: config.maxGasAmount, gasUnitPrice };
  let availableBalance = initialAvailableBalance;
  let pendingBalance = 0n;

  // Caches to skip view calls for repeated transfers.
  // Sender ciphertext is populated lazily and updated after each successful transfer.
  // Auditor key is fetched once per worker lifetime.
  // Recipient EKs are fetched once per recipient address and stored in a Map.
  let cachedSenderCipherText: TwistedElGamalCiphertext[] | null = null;
  let cachedAuditorKey: TwistedEd25519PublicKey | undefined = undefined;
  let auditorKeyFetched = false;
  const recipientEKCache = new Map<string, TwistedEd25519PublicKey>();

  /**
   * Build and submit a confidential transfer directly, skipping the three view
   * calls that `confidentialAsset.transfer()` issues as preflight simulation:
   *   - getAssetAuditorEncryptionKey  (cached after first call)
   *   - isIncomingTransfersPaused     (always false in load-test accounts)
   *   - getBalance × 2               (cached ciphertext reused across transfers)
   */
  async function transferDirect(recipient: string): Promise<CommittedTransactionResponse> {
    const aptos = confidentialAsset.transaction.client;
    const moduleAddr = confidentialAsset.transaction.confidentialAssetModuleAddress;

    // Fetch auditor key once per worker lifetime.
    if (!auditorKeyFetched) {
      cachedAuditorKey = await confidentialAsset.getAssetAuditorEncryptionKey({
        tokenAddress: config.tokenAddress,
      });
      auditorKeyFetched = true;
    }

    // Fetch sender's encrypted balance from chain only when the cache is cold
    // (first transfer, or after a rollover invalidated it).
    if (!cachedSenderCipherText) {
      const bal = await confidentialAsset.getBalance({
        accountAddress: account.accountAddress,
        tokenAddress: config.tokenAddress,
        decryptionKey,
      });
      cachedSenderCipherText = bal.available.getCipherText();
    }

    const senderAddr = AccountAddress.from(account.accountAddress);
    const recipientAddr = AccountAddress.fromString(recipient);
    const tokenAddr = AccountAddress.from(config.tokenAddress);
    const chainId = await confidentialAsset.transaction.getChainId();

    // Fetch the recipient's encryption key once; it never changes for an account.
    let recipientEK = recipientEKCache.get(recipient);
    if (!recipientEK) {
      recipientEK = await confidentialAsset.getEncryptionKey({
        accountAddress: recipientAddr,
        tokenAddress: config.tokenAddress,
      });
      recipientEKCache.set(recipient, recipientEK);
    }

    const allAuditorKeys = cachedAuditorKey ? [cachedAuditorKey] : [];

    const ct = await ConfidentialTransfer.create({
      senderDecryptionKey: decryptionKey,
      senderAvailableBalanceCipherText: cachedSenderCipherText,
      amount: config.transferAmount,
      recipientEncryptionKey: recipientEK,
      hasEffectiveAuditor: !!cachedAuditorKey,
      auditorEncryptionKeys: allAuditorKeys,
      senderAddress: senderAddr.toUint8Array(),
      recipientAddress: recipientAddr.toUint8Array(),
      tokenAddress: tokenAddr.toUint8Array(),
      chainId,
    });

    const [
      { sigmaProof, rangeProof: { rangeProofAmount, rangeProofNewBalance } },
      encryptedBalanceAfterTransfer,
      encryptedAmountByRecipient,
      allAuditorAmountCiphertexts,
      auditorNewBalanceList,
    ] = await ct.authorizeTransfer();

    const recipientDPoints = encryptedAmountByRecipient.getCipherText().map((c) => c.D.toRawBytes());
    const effectiveAuditorDPoints = cachedAuditorKey
      ? allAuditorAmountCiphertexts[allAuditorAmountCiphertexts.length - 1]
          .getCipherText()
          .map((c) => c.D.toRawBytes())
      : ([] as Uint8Array[]);
    const newBalanceA = cachedAuditorKey
      ? auditorNewBalanceList[auditorNewBalanceList.length - 1]
          .getCipherText()
          .map((c) => c.D.toRawBytes())
      : ([] as Uint8Array[]);

    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function:
          `${moduleAddr}::confidential_asset::confidential_transfer_raw` as `${string}::${string}::${string}`,
        functionArguments: [
          config.tokenAddress,
          recipient,
          encryptedBalanceAfterTransfer.getCipherText().map((c) => c.C.toRawBytes()),
          encryptedBalanceAfterTransfer.getCipherText().map((c) => c.D.toRawBytes()),
          newBalanceA,
          ct.transferAmountEncryptedBySender.getCipherText().map((c) => c.C.toRawBytes()),
          ct.transferAmountEncryptedBySender.getCipherText().map((c) => c.D.toRawBytes()),
          recipientDPoints,
          effectiveAuditorDPoints,
          [] as Uint8Array[],   // volunAuditorEncryptionKeys (none in load test)
          [] as Uint8Array[][], // volunAuditorDPoints
          rangeProofNewBalance,
          rangeProofAmount,
          sigmaProof.commitment,
          sigmaProof.response,
          new Uint8Array(),     // memo
        ],
      },
      options: txOptions,
    });

    const senderAuth = account.signTransactionWithAuthenticator(transaction);
    const pending = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator: senderAuth,
    });
    const committed = await aptos.waitForTransaction({
      transactionHash: pending.hash,
      options: { checkSuccess: true },
    });

    // Advance the cache so the next transfer skips the getBalance view calls.
    cachedSenderCipherText = encryptedBalanceAfterTransfer.getCipherText();

    return committed as CommittedTransactionResponse;
  }

  while (Date.now() - startTime < durationMs) {
    // Pick operation based on local balance state
    let op: OpType;
    if (pendingBalance > 0n && availableBalance < config.transferAmount) {
      op = "rollover";
    } else if (availableBalance >= config.transferAmount) {
      op = "transfer";
    } else {
      op = "deposit";
    }

    const recipient =
      recipientAddresses[Math.floor(Math.random() * recipientAddresses.length)];

    const start = Date.now();
    let success = false;
    let error: string | undefined;

    try {
      let txs: CommittedTransactionResponse[];

      switch (op) {
        case "deposit":
          txs = [
            await confidentialAsset.deposit({
              signer: account,
              tokenAddress: config.tokenAddress,
              amount: config.initialDeposit,
              options: txOptions,
            }),
          ];
          break;

        case "rollover": {
          // Call the builder directly to skip the redundant isBalanceNormalized
          // view calls that the high-level API wrapper adds. Load test accounts
          // are always normalized after the initial setup rollover.
          const aptos = confidentialAsset.transaction.client;
          const rolloverTx = await confidentialAsset.transaction.rolloverPendingBalance({
            sender: account.accountAddress,
            tokenAddress: config.tokenAddress,
            checkNormalized: false,
            options: txOptions,
          });
          const rolloverAuth = account.signTransactionWithAuthenticator(rolloverTx);
          const rolloverPending = await aptos.transaction.submit.simple({
            transaction: rolloverTx,
            senderAuthenticator: rolloverAuth,
          });
          const rolloverCommitted = await aptos.waitForTransaction({
            transactionHash: rolloverPending.hash,
            options: { checkSuccess: true },
          });
          txs = [rolloverCommitted as CommittedTransactionResponse];
          // Rollover moves pending→available; the on-chain ciphertext changes.
          // Invalidate the cache so the next transfer re-fetches from chain.
          cachedSenderCipherText = null;
          break;
        }

        case "transfer":
          txs = [await transferDirect(recipient)];
          break;

        default:
          // "withdraw" — not currently selected by the worker's op picker,
          // but kept here for completeness if the selection logic is extended.
          txs = [
            await confidentialAsset.withdraw({
              signer: account,
              tokenAddress: config.tokenAddress,
              senderDecryptionKey: decryptionKey,
              amount: config.transferAmount,
              options: txOptions,
            }),
          ];
          break;
      }

      success = txs.every((tx) => tx.success);

      if (success) {
        if (op === "deposit") {
          pendingBalance += config.initialDeposit;
        } else if (op === "rollover") {
          availableBalance += pendingBalance;
          pendingBalance = 0n;
        } else {
          // transfer or withdraw
          availableBalance -= config.transferAmount;
        }
      } else {
        error = txs.find((tx) => !tx.success)?.vm_status ?? "unknown vm_status";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const msg: WorkerMsg = {
      type: "op",
      op,
      latencyMs: Date.now() - start,
      success,
      ...(error && { error }),
    };
    parentPort!.postMessage(msg);
  }

  parentPort!.postMessage({ type: "done" } satisfies WorkerDoneMsg);
}

// ---------------------------------------------------------------------------
// Setup phase (main thread)
// ---------------------------------------------------------------------------

interface AccountSetup {
  account: Account;
  decryptionKey: TwistedEd25519PrivateKey;
  availableBalance: bigint;
}

async function fundAccounts(
  aptos: Aptos,
  funder: Account,
  targets: Account[],
  amountOctas: bigint,
): Promise<void> {
  const payloads: InputGenerateTransactionPayloadData[] = targets.map((acc) => ({
    function: "0x1::aptos_account::transfer" as `${string}::${string}::${string}`,
    functionArguments: [acc.accountAddress, amountOctas],
  }));

  aptos.transaction.batch.forSingleAccount({ sender: funder, data: payloads });

  const hashes: string[] = [];
  let resolve!: () => void;
  const allSent = new Promise<void>((r) => {
    resolve = r;
  });

  aptos.transaction.batch.on(TransactionWorkerEventsEnum.TransactionSent, (data) => {
    hashes.push(data.transactionHash);
    if (hashes.length === payloads.length) resolve();
  });

  await allSent;
  await Promise.all(hashes.map((hash) => aptos.waitForTransaction({ transactionHash: hash })));
}

async function setupAccount(
  account: Account,
  config: Config,
  confidentialAsset: ConfidentialAsset,
): Promise<AccountSetup> {
  const decryptionKey = TwistedEd25519PrivateKey.generate();
  const txOptions = { maxGasAmount: config.maxGasAmount };
  const addr = account.accountAddress.toString().slice(0, 10);

  log(`  [${addr}…] Registering...`);
  await confidentialAsset.registerBalance({
    signer: account,
    tokenAddress: config.tokenAddress,
    decryptionKey,
    options: txOptions,
  });

  log(`  [${addr}…] Depositing ${config.initialDeposit}...`);
  await confidentialAsset.deposit({
    signer: account,
    tokenAddress: config.tokenAddress,
    amount: config.initialDeposit,
    options: txOptions,
  });

  log(`  [${addr}…] Rolling over pending balance...`);
  await confidentialAsset.rolloverPendingBalance({
    signer: account,
    tokenAddress: config.tokenAddress,
    senderDecryptionKey: decryptionKey,
    options: txOptions,
  });

  log(`  [${addr}…] Ready.`);
  return { account, decryptionKey, availableBalance: config.initialDeposit };
}

async function setup(
  config: Config,
  aptos: Aptos,
  confidentialAsset: ConfidentialAsset,
): Promise<AccountSetup[]> {
  log(`Setting up ${config.numAccounts} test accounts...`);

  const funder = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(
      PrivateKey.formatPrivateKey(config.funderPrivateKey, PrivateKeyVariants.Ed25519),
    ),
  });
  log(`Funder account: ${funder.accountAddress}`);

  let funderBalance: number;
  try {
    funderBalance = await aptos.getAccountAPTAmount({ accountAddress: funder.accountAddress });
  } catch {
    throw new Error(
      `Funder account ${funder.accountAddress} not found on chain. ` +
        `Ensure it exists and has APT.`,
    );
  }

  const needed = config.fundAmountOctas * BigInt(config.numAccounts);
  log(`Funder balance: ${funderBalance} octas. Need ${needed} octas for ${config.numAccounts} accounts.`);
  if (BigInt(funderBalance) < needed) {
    throw new Error(
      `Insufficient funder balance. Have ${funderBalance} octas, need ${needed} octas.`,
    );
  }

  const accounts = Array.from({ length: config.numAccounts }, () => Account.generate());
  log(
    `Generated accounts:\n${accounts.map((a, i) => `  [${i}] ${a.accountAddress}`).join("\n")}`,
  );

  log(`Sending ${config.fundAmountOctas} octas to each of ${config.numAccounts} accounts...`);
  await fundAccounts(aptos, funder, accounts, config.fundAmountOctas);
  log(`Funding complete.`);

  log(`Registering and initializing confidential balances (parallel)...`);
  const setups = await Promise.all(
    accounts.map((acc) => setupAccount(acc, config, confidentialAsset)),
  );

  log(`Setup complete. ${setups.length} accounts ready.\n`);
  return setups;
}

// ---------------------------------------------------------------------------
// Main thread — coordinator
// ---------------------------------------------------------------------------

async function runLoadTest(config: Config, setups: AccountSetup[]): Promise<Metrics> {
  const metrics = newMetrics();
  const allAddresses = setups.map((s) => s.account.accountAddress.toString());

  const startTime = Date.now();
  const durationMs = config.durationSec * 1000;

  log(
    `Spawning ${config.numAccounts} worker threads (one per account)...`,
  );

  const workers = setups.map((setup) => {
    const init: WorkerInit = {
      accountPrivKeyHex: (setup.account as Ed25519Account).privateKey.toString(),
      decryptionKeyHex: setup.decryptionKey.toString(),
      recipientAddresses: allAddresses.filter(
        (a) => a !== setup.account.accountAddress.toString(),
      ),
      initialAvailableBalance: setup.availableBalance,
      config,
      startTime,
      durationMs,
    };
    const tsxCjsPath = require.resolve("tsx/cjs");
    return new Worker(`require(${JSON.stringify(tsxCjsPath)}); require(${JSON.stringify(__filename)});`, {
      eval: true,
      workerData: init,
    });
  });

  let doneWorkers = 0;

  const statsTimer = setInterval(
    () => printStats(metrics, Date.now()),
    config.statsIntervalSec * 1000,
  );

  await new Promise<void>((resolve) => {
    for (const worker of workers) {
      worker.on("message", (msg: WorkerMsg) => {
        if (msg.type === "op") {
          recordOp(metrics[msg.op], msg.latencyMs, msg.success);
          if (!msg.success && msg.error) {
            metrics.errors.push({ op: msg.op, msg: msg.error });
          }
        } else if (msg.type === "done") {
          doneWorkers++;
          if (doneWorkers === workers.length) resolve();
        }
      });

      worker.on("error", (err) => {
        log(`Worker error: ${err.message}`);
      });
    }
  });

  clearInterval(statsTimer);

  // Terminate any workers still running (shouldn't be needed, but just in case)
  await Promise.all(workers.map((w) => w.terminate()));

  return metrics;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (isMainThread) {
  (async () => {
    const config = parseArgs();

    console.log("╔══════════════════════════════════════════════╗");
    console.log("║     Confidential Asset Load Test             ║");
    console.log("╚══════════════════════════════════════════════╝");
    console.log(`Network:           ${config.network}`);
    if (config.endpoint) console.log(`Endpoint:          ${config.endpoint}`);
    console.log(`Token:             ${config.tokenAddress}`);
    console.log(`Module address:    ${config.moduleAddress}`);
    console.log(`Duration:          ${config.durationSec}s`);
    console.log(`Accounts/workers:  ${config.numAccounts}`);
    console.log(
      `Fund per account:  ${config.fundAmountOctas} octas (${Number(config.fundAmountOctas) / 1e8} APT)`,
    );
    console.log(`Initial deposit:   ${config.initialDeposit} token units`);
    console.log(`Transfer amount:   ${config.transferAmount} token units`);
    console.log(
      `Max gas per tx:    ${config.maxGasAmount} units (${((config.maxGasAmount * 100) / 1e8).toFixed(4)} APT max fee)`,
    );
    console.log();

    const aptosConfig = buildAptosConfig(config);
    const aptos = new Aptos(aptosConfig);
    const confidentialAsset = new ConfidentialAsset({
      config: aptosConfig,
      confidentialAssetModuleAddress: config.moduleAddress,
    });

    const setups = await setup(config, aptos, confidentialAsset);
    const metrics = await runLoadTest(config, setups);

    printStats(metrics, Date.now(), "═══ Final Results ═══");

    const totalOps = OP_KEYS.reduce((sum, op) => sum + metrics[op].count, 0);
    const totalSuccess = OP_KEYS.reduce((sum, op) => sum + metrics[op].success, 0);
    const successRate =
      totalOps > 0 ? ((totalSuccess / totalOps) * 100).toFixed(1) : "0.0";
    console.log(`\nOverall success rate: ${successRate}% (${totalSuccess}/${totalOps})`);

    if (metrics.errors.length > 0) {
      console.log(`\nErrors (first 20 of ${metrics.errors.length}):`);
      for (const e of metrics.errors.slice(0, 20)) {
        console.log(`  [${e.op}] ${e.msg}`);
      }
    }
  })().catch((err) => {
    console.error("Fatal error:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
} else {
  // Worker thread entry point
  runWorker().catch((err) => {
    log(`Worker fatal error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  });
}
