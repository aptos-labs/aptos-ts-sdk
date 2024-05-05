import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { AccountAddress } from "../core";
import { Network } from "../utils";

export class Move {
  process: ChildProcessWithoutNullStreams | null = null;

  init(network: Network, profile?: string) {
    const cliCommand = "npx";
    const cliArgs = ["aptos", "init", `--network=${network}`, `--profile=${profile ?? "default"}`];

    const childProcess = spawn(cliCommand, cliArgs);
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

  compile(packageDirectoryPath: string, moduleAddress: AccountAddress) {
    const cliCommand = "npx";
    const cliArgs = [
      "aptos",
      "move",
      "compile",
      "--package-dir",
      packageDirectoryPath,
      "--skip-fetch-latest-git-deps",
      "--named-addresses",
      `module_addr=${moduleAddress.toString()}`,
    ];

    const childProcess = spawn(cliCommand, cliArgs);
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

  test(packageDirectoryPath: string, moduleAddress: AccountAddress) {
    const cliCommand = "npx";
    const cliArgs = [
      "aptos",
      "move",
      "test",
      "--package-dir",
      packageDirectoryPath,
      "--skip-fetch-latest-git-deps",
      "--named-addresses",
      `module_addr=${moduleAddress.toString()}`,
    ];

    const childProcess = spawn(cliCommand, cliArgs);
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

  publish(packageDirectoryPath: string, moduleAddress: AccountAddress, profile?: string) {
    const cliCommand = "npx";
    const cliArgs = [
      "aptos",
      "move",
      "publish",
      "--package-dir",
      packageDirectoryPath,
      "--skip-fetch-latest-git-deps",
      "--named-addresses",
      `module_addr=${moduleAddress.toString()}`,
      `--profile=${profile ?? "default"}`,
    ];

    const childProcess = spawn(cliCommand, cliArgs);
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
}
