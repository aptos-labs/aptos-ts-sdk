import { ChildProcessWithoutNullStreams, spawn } from "child_process";
var kill = require("tree-kill");

export class LocalNode {
  static MAXIMUM_WAIT_TIME_SEC = 30;

  process: ChildProcessWithoutNullStreams | null = null;

  /**
   * kills all the descendent processes
   * of the node process, including the node process itself
   */
  stop() {
    kill(this.process?.pid);
  }

  /**
   * Runs a local testnet and wait for process to be up
   */
  async run() {
    this.start();
    await this.waitUntilProcessIsUp();
  }

  /**
   * Starts the local testnet by running the aptos node run-local-testnet command
   */
  start() {
    const cliCommand = "npx";
    const cliArgs = ["aptos", "node", "run-local-testnet", "--force-restart", "--assume-yes", "--with-indexer-api"];

    const childProcess = spawn(cliCommand, cliArgs);
    this.process = childProcess;

    childProcess.stderr?.on("data", (data: any) => {
      const str = data.toString();
      // Print local node output log
      console.log(str);
    });

    childProcess.stdout?.on("data", (data: any) => {
      const str = data.toString();
      // Print local node output log
      console.log(str);
    });
  }

  /**
   * Waits for the local testnet process to be up
   *
   * @returns Promise<boolean>
   */
  async waitUntilProcessIsUp(): Promise<boolean> {
    let operational = await this.checkIfProcessIsUp();
    let start = Date.now() / 1000;
    let last = start;

    while (!operational && start + LocalNode.MAXIMUM_WAIT_TIME_SEC > last) {
      await this.sleep(1000);
      operational = await this.checkIfProcessIsUp();
      last = Date.now() / 1000;
    }
    return true;
  }

  /**
   * Checks if the local testnet is up
   *
   * @returns Promise<boolean>
   */
  async checkIfProcessIsUp(): Promise<boolean> {
    try {
      // Query readiness endpoint
      const data = await fetch("http://127.0.0.1:8070/");
      if (data.status === 200) {
        return true;
      } else {
        return false;
      }
    } catch (err: any) {
      return false;
    }
  }

  sleep(timeMs: number): Promise<null> {
    return new Promise((resolve) => {
      setTimeout(resolve, timeMs);
    });
  }
}
