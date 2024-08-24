import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import kill from "tree-kill";
import { platform } from "os";

import { sleep } from "../utils/helpers";

export class LocalNode {
  readonly MAXIMUM_WAIT_TIME_SEC = 75;

  readonly READINESS_ENDPOINT = "http://127.0.0.1:8070/";

  process: ChildProcessWithoutNullStreams | null = null;

/**
 * Terminates the current process and all its descendant processes.
 * 
 * @returns {Promise<boolean>} A promise that resolves to true if the process was successfully terminated.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // This function stops the current process and its descendants.
 *   await aptos.stop();
 *   console.log("Process terminated successfully.");
 * }
 * runExample().catch(console.error);
 * ```
 */


  async stop() {
    await new Promise((resolve, reject) => {
      if (!this.process?.pid) return;
      kill(this.process.pid, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

/**
 * Runs a local testnet and waits for the process to be up. 
 * If the local node process is already running, it returns without starting a new process.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // This will start the local testnet if it is not already running
 *   await aptos.run();
 *   console.log("Local testnet is up and running.");
 * }
 * runExample().catch(console.error);
 * ```
 */


  async run() {
    const nodeIsUp = await this.checkIfProcessIsUp();
    if (nodeIsUp) {
      return;
    }
    this.start();
    await this.waitUntilProcessIsUp();
  }

  /**
   * Starts the local testnet by running the aptos node run-local-testnet command
   */
  start() {
    const cliCommand = "npx";
    const cliArgs = ["aptos", "node", "run-localnet", "--force-restart", "--assume-yes", "--with-indexer-api"];

    const currentPlatform = platform();
    let childProcess;
    // Check if current OS is windows
    if (currentPlatform === "win32") {
      childProcess = spawn(cliCommand, cliArgs, { shell: true });
    } else {
      childProcess = spawn(cliCommand, cliArgs);
    }

    this.process = childProcess;

    childProcess.stderr?.on("data", (data: any) => {
      const str = data.toString();
      // Print local node output log
      // eslint-disable-next-line no-console
      console.log(str);
    });

    childProcess.stdout?.on("data", (data: any) => {
      const str = data.toString();
      // Print local node output log
      // eslint-disable-next-line no-console
      console.log(str);
    });
  }

/**
 * Waits for the local testnet process to be up.
 * This function will continuously check if the process is operational until it either becomes operational or the maximum wait time is exceeded.
 *
 * @returns Promise<boolean> - Resolves to true if the process is up, otherwise throws an error.
 * @throws Error - If the process fails to start within the maximum wait time.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Wait for the local testnet process to be up
 *   const isProcessUp = await aptos.waitUntilProcessIsUp();
 *   console.log("Is the process up?", isProcessUp);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async waitUntilProcessIsUp(): Promise<boolean> {
    let operational = await this.checkIfProcessIsUp();
    const start = Date.now() / 1000;
    let last = start;

    while (!operational && start + this.MAXIMUM_WAIT_TIME_SEC > last) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000);
      // eslint-disable-next-line no-await-in-loop
      operational = await this.checkIfProcessIsUp();
      last = Date.now() / 1000;
    }

    // If we are here it means something blocks the process to start.
    // Might worth checking if another process is running on port 8080
    if (!operational) {
      throw new Error("Process failed to start");
    }

    return true;
  }

/**
 * Checks if the local testnet is up.
 * 
 * @returns Promise<boolean> - Resolves to true if the testnet is operational, otherwise false.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Check if the local testnet is up
 *   const isUp = await aptos.checkIfProcessIsUp();
 *   console.log("Is the testnet up?", isUp);
 * }
 * runExample().catch(console.error);
 * ```
 */


  async checkIfProcessIsUp(): Promise<boolean> {
    try {
      // Query readiness endpoint
      const data = await fetch(this.READINESS_ENDPOINT);
      if (data.status === 200) {
        return true;
      }
      return false;
    } catch (err: any) {
      return false;
    }
  }
}