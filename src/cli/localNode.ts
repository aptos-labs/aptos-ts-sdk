/* eslint-disable no-console */

import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import kill from "tree-kill";
import { platform } from "os";

import { sleep } from "../utils/helpers";

/**
 * Represents a local node for running a testnet environment.
 * This class provides methods to start, stop, and check the status of the local testnet process.
 * It manages the lifecycle of the node process and ensures that it is operational before executing tests.
 */
export class LocalNode {
  readonly MAXIMUM_WAIT_TIME_SEC = 75;

  readonly READINESS_ENDPOINT = "http://127.0.0.1:8070/";

  showStdout: boolean = true;

  process: ChildProcessWithoutNullStreams | null = null;

  constructor(args?: { showStdout?: boolean }) {
    this.showStdout = args?.showStdout ?? true;
  }

  /**
   * Kills the current process and all its descendant processes.
   *
   * @returns {Promise<void>} A promise that resolves to true if the process was successfully killed.
   * @throws {Error} If there is an error while attempting to kill the process.
   */
  async stop(): Promise<void> {
    await new Promise((resolve, reject) => {
      if (!this.process?.pid) return;

      /**
       * Terminates the process associated with the given process ID.
       *
       * @param pid - The process ID of the process to be terminated.
       * @param callback - A function that is called after the termination attempt is complete.
       * @param callback.err - An error object if the termination failed; otherwise, null.
       * @param callback.resolve - A boolean indicating whether the termination was successful.
       */
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
   * If the local node process is already running, it returns without starting the process.
   *
   * @returns {Promise<void>} A promise that resolves when the process is up.
   */
  async run(): Promise<void> {
    const nodeIsUp = await this.checkIfProcessIsUp();
    if (nodeIsUp) {
      return;
    }
    this.start();
    await this.waitUntilProcessIsUp();
  }

  /**
   * Starts the local testnet by running the Aptos node with the specified command-line arguments.
   *
   * @returns {void}
   *
   * @throws {Error} If there is an issue starting the local testnet.
   */
  start(): void {
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
      // Print local node output error log
      console.log(str);
    });

    childProcess.stdout?.on("data", (data: any) => {
      const str = data.toString();
      // Print local node output log
      if (this.showStdout) {
        console.log(str);
      }
    });
  }

  /**
   * Waits for the local testnet process to be operational within a specified maximum wait time.
   * This function continuously checks if the process is up and will throw an error if it fails to start.
   *
   * @returns Promise<boolean> - Resolves to true if the process is up, otherwise throws an error.
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
   * Checks if the local testnet is up by querying the readiness endpoint.
   *
   * @returns Promise<boolean> - A promise that resolves to true if the testnet is up, otherwise false.
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
