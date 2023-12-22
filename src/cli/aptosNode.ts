import { ChildProcessWithoutNullStreams, exec, spawn, spawnSync } from "child_process";
import http, { IncomingMessage } from "http";

export class AptosNode {
  static MAXIMUM_WAIT_TIME_SEC = 30;

  process: ChildProcessWithoutNullStreams | null = null;

  stop() {
    const killed = this.process?.kill();
    console.log("killed", killed);
  }

  start() {
    const cliCommand = "npx";
    const cliArgs = ["aptos", "node", "run-local-testnet", "--force-restart", "--assume-yes", "--with-indexer-api"];

    const childProcess = spawn(cliCommand, cliArgs);
    //this.process = childProcess;

    childProcess.stdout?.on("data", (data: any) => {
      console.log(`CLI Process stdout: ${data}`);
    });

    childProcess.stderr?.on("data", (data: any) => {
      console.error(`CLI Process stderr: ${data}`);
    });

    childProcess.on("close", (code: any) => {
      console.log(`CLI Process Closed with Code: ${code}`);
    });

    childProcess.on("exit", (code: any) => {
      console.log(`CLI Process Exited with Code: ${code}`);
    });
  }

  async waitUntilProcessIsUp(): Promise<boolean> {
    let operational = await this.checkIfProcessIsUp();
    let start = Date.now() / 1000;
    let last = start;

    while (!operational && start + AptosNode.MAXIMUM_WAIT_TIME_SEC > last) {
      await this.sleep(1000);
      operational = await this.checkIfProcessIsUp();
      last = Date.now() / 1000;
    }
    console.log("local node is up");
    return true;
  }

  async checkIfProcessIsUp(): Promise<boolean> {
    try {
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
