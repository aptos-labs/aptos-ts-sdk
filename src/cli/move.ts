import { spawn } from "child_process";
import { platform } from "os";

import { AccountAddress } from "../core";
import { Network } from "../utils";

/**
 * Class representing a Move package management utility for the Aptos blockchain.
 * This class provides methods to initialize directories, compile packages, run tests, publish modules, create objects, upgrade
 * packages, build transaction payloads, and run scripts.
 */
export class Move {
  /**
   * Initialize the current directory for Aptos by configuring the necessary settings.
   * Configuration will be pushed into .aptos/config.yaml.
   *
   * @param args - The arguments for initialization.
   * @param args.network - Optional Network type argument to use for default settings; defaults to local.
   * @param args.profile - Optional Profile to use from the config file; defaults to 'default'. This will override associated
   * settings such as the REST URL, the Faucet URL, and the private key arguments.
   * @param args.extraArguments - Optional extra arguments to include in the form of an array of strings.
   * Ex. ["--assume-yes","--gas-unit-price=10"]
   * @returns stdout
   */
  async init(args: {
    network?: Network;
    profile?: string;
    extraArguments?: Array<string>;
    showStdout?: boolean;
  }): Promise<{ output: string }> {
    const { network, profile, extraArguments, showStdout } = args;
    const cliArgs = ["aptos", "init", `--network=${network ?? "local"}`, `--profile=${profile ?? "default"}`];

    if (extraArguments) {
      cliArgs.push(...extraArguments);
    }

    return this.runCommand(cliArgs, showStdout);
  }

  /**
   * Compile a Move package located at the specified directory path.
   * This function helps in preparing the Move package for deployment or further processing.
   *
   * @param args - The arguments for compiling the package.
   * @param args.packageDirectoryPath - Path to a Move package (the folder with a Move.toml file).
   * @param args.namedAddresses - Named addresses for the move binary. Ex. { alice: 0x1234, bob: 0x5678 }
   * @param args.extraArguments - Optional extra arguments to include in the form of an array of strings.
   * Ex. ["--assume-yes","--gas-unit-price=10"]
   * @returns stdout
   */
  async compile(args: {
    packageDirectoryPath: string;
    namedAddresses: Record<string, AccountAddress>;
    extraArguments?: Array<string>;
    showStdout?: boolean;
  }): Promise<{ output: string }> {
    const { packageDirectoryPath, namedAddresses, extraArguments, showStdout } = args;
    const cliArgs = ["aptos", "move", "compile", "--package-dir", packageDirectoryPath];

    const addressesMap = this.parseNamedAddresses(namedAddresses);

    cliArgs.push(...this.prepareNamedAddresses(addressesMap));

    if (extraArguments) {
      cliArgs.push(...extraArguments);
    }

    return this.runCommand(cliArgs, showStdout);
  }

  /**
   * Run Move unit tests for a specified package.
   *
   * @param args - The arguments for running the tests.
   * @param args.packageDirectoryPath - The path to a Move package (the folder containing a Move.toml file).
   * @param args.namedAddresses - Named addresses for the move binary. Ex. { alice: 0x1234, bob: 0x5678 }
   * @param args.extraArguments - Optional extra arguments to include in the form of an array of strings.
   * Ex. ["--assume-yes","--gas-unit-price=10"]
   * @returns The stdout output from running the tests.
   */
  async test(args: {
    packageDirectoryPath: string;
    namedAddresses: Record<string, AccountAddress>;
    extraArguments?: Array<string>;
    showStdout?: boolean;
  }): Promise<{ output: string }> {
    const { packageDirectoryPath, namedAddresses, extraArguments, showStdout } = args;
    const cliArgs = ["aptos", "move", "test", "--package-dir", packageDirectoryPath];

    const addressesMap = this.parseNamedAddresses(namedAddresses);

    cliArgs.push(...this.prepareNamedAddresses(addressesMap));

    if (extraArguments) {
      cliArgs.push(...extraArguments);
    }

    return this.runCommand(cliArgs, showStdout);
  }

  /**
   * Publishes the modules to the publisher account on the Aptos blockchain.
   *
   * @param args - The arguments for publishing the modules.
   * @param args.packageDirectoryPath - The path to a move package (the folder with a Move.toml file).
   * @param args.namedAddresses - Named addresses for the move binary. Ex. { alice: 0x1234, bob: 0x5678 }
   * @param args.profile - Optional profile to use from the config file.
   * @param args.extraArguments - Optional extra arguments to include in the form of an array of strings.
   * Ex. ["--assume-yes","--gas-unit-price=10"]
   * @returns stdout
   */
  async publish(args: {
    packageDirectoryPath: string;
    namedAddresses: Record<string, AccountAddress>;
    profile?: string;
    extraArguments?: Array<string>;
    showStdout?: boolean;
  }): Promise<{ output: string }> {
    const { packageDirectoryPath, namedAddresses, profile, extraArguments, showStdout } = args;
    const cliArgs = [
      "aptos",
      "move",
      "publish",
      "--package-dir",
      packageDirectoryPath,
      `--profile=${profile ?? "default"}`,
    ];

    const addressesMap = this.parseNamedAddresses(namedAddresses);

    cliArgs.push(...this.prepareNamedAddresses(addressesMap));

    if (extraArguments) {
      cliArgs.push(...extraArguments);
    }

    return this.runCommand(cliArgs, showStdout);
  }

  /**
   * Create a new object and publish the Move package to it on the Aptos blockchain.
   *
   * @param args - The arguments for creating the object and publishing the package.
   * @param args.packageDirectoryPath - Path to a Move package (the folder with a Move.toml file).
   * @param args.addressName - Address name for the Move package.
   * @param args.namedAddresses - Named addresses for the Move binary.
   * @param args.profile - Optional profile to use from the config file.
   * @param args.extraArguments - Optional extra arguments to include in the form of an array of strings.
   * Ex. ["--assume-yes","--gas-unit-price=10"]
   * @returns The object address.
   *
   * A complete example in CLI:
   * aptos move create-object-and-publish-package \
   * --package-dir path_to_directory_that_has_move.toml \
   * --address-name launchpad_addr \
   * --named-addresses "launchpad_addr=0x123,initial_creator_addr=0x456" \
   * --profile my_profile \
   * --assume-yes
   */
  async createObjectAndPublishPackage(args: {
    packageDirectoryPath: string;
    addressName: string;
    namedAddresses: Record<string, AccountAddress>;
    profile?: string;
    extraArguments?: Array<string>;
    showStdout?: boolean;
  }): Promise<{ objectAddress: string }> {
    const { packageDirectoryPath, addressName, namedAddresses, profile, extraArguments, showStdout } = args;
    const cliArgs = [
      "aptos",
      "move",
      "create-object-and-publish-package",
      "--package-dir",
      packageDirectoryPath,
      "--address-name",
      addressName,
      `--profile=${profile ?? "default"}`,
    ];

    const addressesMap = this.parseNamedAddresses(namedAddresses);

    cliArgs.push(...this.prepareNamedAddresses(addressesMap));

    if (extraArguments) {
      cliArgs.push(...extraArguments);
    }

    const result = await this.runCommand(cliArgs, showStdout);
    return { objectAddress: this.extractAddressFromOutput(result.output) };
  }

  /**
   * Upgrade a Move package previously published to an object on the Aptos blockchain.
   * The caller must be the object owner to execute this function.
   *
   * @param args - The arguments for upgrading the object package.
   * @param args.packageDirectoryPath - Path to a Move package (the folder with a Move.toml file).
   * @param args.objectAddress - Address of the object that the Move package published to. Ex. 0x1000
   * @param args.namedAddresses - Named addresses for the move binary. Ex. { alice: 0x1234, bob: 0x5678 }
   * @param args.profile - Optional profile to use from the config file.
   * @param args.extraArguments - Optional extra arguments to include in the form of an array of strings.
   * Ex. ["--assume-yes","--gas-unit-price=10"]
   * @returns stdout
   */
  async upgradeObjectPackage(args: {
    packageDirectoryPath: string;
    objectAddress: string;
    namedAddresses: Record<string, AccountAddress>;
    profile?: string;
    extraArguments?: Array<string>;
    showStdout?: boolean;
  }): Promise<{ output: string }> {
    const { packageDirectoryPath, objectAddress, namedAddresses, profile, extraArguments, showStdout } = args;
    const cliArgs = [
      "aptos",
      "move",
      "upgrade-object-package",
      "--package-dir",
      packageDirectoryPath,
      "--object-address",
      objectAddress,
      `--profile=${profile ?? "default"}`,
    ];

    const addressesMap = this.parseNamedAddresses(namedAddresses);

    cliArgs.push(...this.prepareNamedAddresses(addressesMap));

    if (extraArguments) {
      cliArgs.push(...extraArguments);
    }

    return this.runCommand(cliArgs, showStdout);
  }

  /**
   * Build a publication transaction payload and store it in a JSON output file.
   *
   * @param args - The arguments for building the publishing payload.
   * @param args.packageDirectoryPath - Path to a move package (the folder with a Move.toml file).
   * @param args.outputFile - Output file to write the publication transaction to.
   * @param args.namedAddresses - Named addresses for the move binary. Ex. { alice: 0x1234, bob: 0x5678 }
   * @param args.extraArguments - Optional extra arguments to include in the form of an array of strings.
   * Ex. ["--assume-yes","--gas-unit-price=10"]   *
   * @returns stdout
   */
  async buildPublishPayload(args: {
    packageDirectoryPath: string;
    outputFile: string;
    namedAddresses: Record<string, AccountAddress>;
    extraArguments?: Array<string>;
    showStdout?: boolean;
  }): Promise<{ output: string }> {
    const { outputFile, packageDirectoryPath, namedAddresses, extraArguments, showStdout } = args;
    const cliArgs = [
      "aptos",
      "move",
      "build-publish-payload",
      "--json-output-file",
      outputFile,
      "--package-dir",
      packageDirectoryPath,
    ];

    const addressesMap = this.parseNamedAddresses(namedAddresses);

    cliArgs.push(...this.prepareNamedAddresses(addressesMap));

    if (extraArguments) {
      cliArgs.push(...extraArguments);
    }

    return this.runCommand(cliArgs, showStdout);
  }

  /**
   * Runs a Move script using the provided compiled script path and optional parameters. Ensure that the script is compiled
   * before executing this function.
   *
   * @param args - The arguments for running the script.
   * @param args.compiledScriptPath - Path to a compiled Move script bytecode file.
   * Ex. "build/my_package/bytecode_scripts/my_move_script.mv"
   * @param args.profile - Optional profile to use from the config file.
   * @param args.extraArguments - Optional extra arguments to include in the form of an array of strings.
   * Ex. ["--assume-yes","--gas-unit-price=10"]
   *
   * @returns The standard output from running the script.
   */
  async runScript(args: {
    compiledScriptPath: string;
    profile?: string;
    extraArguments?: Array<string>;
    showStdout?: boolean;
  }): Promise<{ output: string }> {
    const { compiledScriptPath, profile, extraArguments, showStdout } = args;
    const cliArgs = [
      "aptos",
      "move",
      "run-script",
      "--compiled-script-path",
      compiledScriptPath,
      `--profile=${profile ?? "default"}`,
    ];

    if (extraArguments) {
      cliArgs.push(...extraArguments);
    }

    return this.runCommand(cliArgs, showStdout);
  }

  /**
   * Run a command with the specified arguments and return the output.
   *
   * @param args - An array of strings representing the command-line arguments to be passed to the command.
   * @param showStdout - Show the standard output generated by the command.
   * @returns The standard output generated by the command.
   */
  // eslint-disable-next-line class-methods-use-this
  private async runCommand(args: Array<string>, showStdout: boolean = true): Promise<{ output: string }> {
    return new Promise((resolve, reject) => {
      const currentPlatform = platform();
      let childProcess;
      let stdout = "";

      // Check if current OS is windows
      if (currentPlatform === "win32") {
        childProcess = spawn("npx", args, { shell: true });
      } else {
        childProcess = spawn("npx", args);
      }

      childProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      if (showStdout) {
        childProcess.stdout.pipe(process.stdout);
        childProcess.stderr.pipe(process.stderr);
        process.stdin.pipe(childProcess.stdin);
      }

      childProcess.on("close", (code) => {
        if (code === 0) {
          resolve({ output: stdout }); // Resolve with stdout if the child process exits successfully
        } else {
          reject(new Error(`Child process exited with code ${code}`)); // Reject with an error if the child process exits with an error code
        }
      });
    });
  }

  /**
   * Convert named addresses from a Map into an array separated by a comma.
   *
   * @param namedAddresses - A Map where the key is a string representing the name and the value is an AccountAddress.
   * Ex. {'alice' => '0x123', 'bob' => '0x456'}
   * @returns An array of named addresses formatted as strings separated by a comma. Ex. "alice=0x123,bob=0x456"
   */
  // eslint-disable-next-line class-methods-use-this
  private prepareNamedAddresses(namedAddresses: Map<string, AccountAddress>): Array<string> {
    const totalNames = namedAddresses.size;
    const newArgs: Array<string> = [];

    if (totalNames === 0) {
      return newArgs;
    }

    newArgs.push("--named-addresses");

    const names: Array<string> = [];
    namedAddresses.forEach((value, key) => {
      const toAppend = `${key}=${value.toString()}`;
      names.push(toAppend);
    });
    newArgs.push(names.join(","));
    return newArgs;
  }

  /**
   * Parse named addresses from a Record type into a Map.
   *
   * This function transforms a collection of named addresses into a more accessible format by mapping each name to its
   * corresponding address.
   *
   * @param namedAddresses - A record containing named addresses where the key is the name and the value is the AccountAddress.
   * @returns A Map where each key is a name and each value is the corresponding address.
   */
  // eslint-disable-next-line class-methods-use-this
  private parseNamedAddresses(namedAddresses: Record<string, AccountAddress>): Map<string, AccountAddress> {
    const addressesMap = new Map();

    Object.keys(namedAddresses).forEach((key) => {
      const address = namedAddresses[key];
      addressesMap.set(key, address);
    });

    return addressesMap;
  }

  /**
   * Extracts the object address from the provided output string.
   *
   * @param output - The output string containing the object address.
   * @returns The extracted object address.
   * @throws Error if the object address cannot be extracted from the output.
   */
  // eslint-disable-next-line class-methods-use-this
  private extractAddressFromOutput(output: string): string {
    const match = output.match("Code was successfully deployed to object address (0x[0-9a-fA-F]+)");
    if (match) {
      return match[1];
    }
    throw new Error("Failed to extract object address from output");
  }
}
