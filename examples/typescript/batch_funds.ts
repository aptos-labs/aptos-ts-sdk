/* eslint-disable no-console */

/**
 * This example demonstrates how a client can utilize the TransactionWorker class.
 *
 * The TransactionWorker provides a simple framework for receiving payloads to be processed. It
 * acquires an account new sequence number, produces a signed transaction and
 * then submits the transaction. In other tasks, it waits for resolution of the submission
 * process or get pre-execution validation error and waits for the resolution of the execution process
 * or get an execution validation error.
 *
 * The TransactionWorker constructor accepts
 * @param aptosConfig - a config object
 * @param sender - the sender account
 * @param maxWaitTime - the max wait time to wait before restarting the local sequence number to the current on-chain state
 * @param maximumInFlight - submit up to `maximumInFlight` transactions per account
 * @param sleepTime - If `maximumInFlight` are in flight, wait `sleepTime` seconds before re-evaluating
 *
 * Read more about it here {@link https://aptos.dev/guides/transaction-management}
 */
import {
  Account,
  AccountData,
  Aptos,
  AptosConfig,
  InputGenerateTransactionPayloadData,
  Network,
  NetworkToNetworkName,
  TransactionWorker,
  TransactionWorkerEventsEnum,
  UserTransactionResponse,
} from "@aptos-labs/ts-sdk";

const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];

const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

async function main() {
  const accountsCount = 2;
  const transactionsCount = 10;

  const totalExpectedTransactions = accountsCount * transactionsCount;

  const start = Date.now() / 1000; // current time in seconds

  console.log("Starting...");

  // create senders and recipients accounts
  const senders: Account[] = [];
  const recipients: Account[] = [];
  for (let i = 0; i < accountsCount; i += 1) {
    senders.push(Account.generate());
    recipients.push(Account.generate());
  }
  for (const sender of senders) {
    console.log(sender.accountAddress.toString());
  }
  let last = Date.now() / 1000;
  console.log(
    `${senders.length} sender accounts and ${recipients.length} recipient accounts created in ${last - start} seconds`,
  );

  // fund sender accounts
  const funds: Array<Promise<UserTransactionResponse>> = [];

  for (const sender of senders) {
    funds.push(
      aptos.fundAccount({ accountAddress: sender.accountAddress.toStringWithoutPrefix(), amount: 10000000000 }),
    );
  }

  await Promise.all(funds);

  console.log(`${funds.length} sender accounts funded in ${Date.now() / 1000 - last} seconds`);
  last = Date.now() / 1000;

  // Read sender accounts to check their balances.
  const balances: Array<Promise<AccountData>> = [];
  for (const sender of senders) {
    balances.push(aptos.getAccountInfo({ accountAddress: sender.accountAddress }));
  }
  await Promise.all(balances);

  console.log(`${balances.length} sender account balances checked in ${Date.now() / 1000 - last} seconds`);
  last = Date.now() / 1000;

  // Create transaction payloads.
  const payloads: InputGenerateTransactionPayloadData[] = [];
  for (let j = 0; j < transactionsCount; j += 1) {
    for (let i = 0; i < recipients.length; i += 1) {
      const txn: InputGenerateTransactionPayloadData = {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipients[i].accountAddress, 1],
      };
      payloads.push(txn);
    }
  }

  console.log(
    `Sending ${totalExpectedTransactions * senders.length} (${totalExpectedTransactions} transactions per sender) transactions to ${aptos.config.network}...`,
  );

  const transactionWorkers: TransactionWorker[] = [];
  for (const sender of senders) {
    // Create a transaction worker for each sender.
    const transactionWorker = new TransactionWorker(config, sender);
    transactionWorkers.push(transactionWorker);

    // Register listeners for certain events.
    transactionWorker.on(TransactionWorkerEventsEnum.TransactionSent, async (data) => {
      console.log(`Transaction sent. Hash: ${data.transactionHash}. Message: ${data.message}`);
    });
    transactionWorker.on(TransactionWorkerEventsEnum.TransactionExecuted, async (data) => {
      console.log(`Transaction executed. Hash: ${data.transactionHash}. Message: ${data.message}`);
    });
    transactionWorker.on(TransactionWorkerEventsEnum.TransactionExecutionFailed, async (data) => {
      console.log(`Transaction execution failed. Message: ${data.message}`);
    });

    // Push the payloads to the transaction worker.
    transactionWorker.pushMany(payloads.map((payload) => [payload, undefined]));

    // Start the transaction worker.
    transactionWorker.start();
  }

  // Wait for all transaction workers to finish, up to 45 seconds.
  const timeout = 45 * 1000;
  const startTime = Date.now();
  await Promise.all(
    transactionWorkers.map(async (worker) => {
      while (worker.executedTransactions.length < totalExpectedTransactions) {
        console.debug("Waiting for transaction worker to finish...");

        // Check if we've exceeded the timeout
        if (Date.now() - startTime > timeout) {
          console.error("Timeout waiting for transaction worker to finish");
          worker.stop();
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }),
  );

  // Verify the sequence numbers of the accounts.
  const accounts = senders.map((sender) => aptos.getAccountInfo({ accountAddress: sender.accountAddress }));
  const accountsData = await Promise.all(accounts);
  accountsData.forEach((accountData) => {
    console.log(`Account sequence number is ${accountData.sequence_number}, it should be ${totalExpectedTransactions}`);
  });

  process.exit(0);
}

main();
