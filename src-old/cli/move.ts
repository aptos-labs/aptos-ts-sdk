import { spawn } from "child_process";
import { platform } from "os";

import { AccountAddress } from "../core";
import { Network } from "../utils";

export class Move {
  /**
   * Function to initialize current directory for Aptos
   *
   * Configuration will be pushed into .aptos/config.yaml
   * @param args.network optional Network type argument to use for default settings, default is local
   * @param args.profile optional Profile to use from the config file, default is 'default'
   * This will be used to override associated settings such as the REST URL, the Faucet URL, and the private key arguments.
   * @param args.extraArguments (optional) Any extra arguments to include in the form of an array of strings
   * @example
   * ["--assume-yes","--gas-unit-price=10"]
   *
   * @returns stdout
   */
  async init(args: {
    network?: Network;
    profile?: string;
    extraArguments?: Array<string>;
  }): Promise<{ output: string }> {
    const { network, profile, extraArguments } = args;
    const cliArgs = ["aptos", "init", `--network=${network ?? "local"}`, `--profile=${profile ?? "default"}`];

    if (extraArguments) {
      cliArgs.push(...extraArguments);
    }

    return this.runCommand(cliArgs);
  }

  /**
   * Function to compile a package
   *
   * @param args.packageDirectoryPath Path to a move package (the folder with a Move.toml file)
   * @param args.namedAddresses  Named addresses for the move binary
   * @param args.extraArguments (optional) Any extra arguments to include in the form of an array of strings
   * @example
   * ["--assume-yes","--gas-unit-price=10"]
   * @example
   * {
   *  alice:0x1234, bob:0x5678
   * }
   *
   * @returns stdout
   */
  async compile(args: {
    packageDirectoryPath: string;
    namedAddresses: Record<string, AccountAddress>;
    extraArguments?: Array<string>;
  }): Promise<{ output: string }> {
    const { packageDirectoryPath, namedAddresses, extraArguments } = args;
    const cliArgs = ["aptos", "move", "compile", "--package-dir", packageDirectoryPath];

    const addressesMap = this.parseNamedAddresses(namedAddresses);

    cliArgs.push(...this.prepareNamedAddresses(addressesMap));

    if (extraArguments) {
      cliArgs.push(...extraArguments);
    }

    return this.runCommand(cliArgs);
  }

  /**
   * Function to run Move unit tests for a package
   *
   * @param args.packageDirectoryPath Path to a move package (the folder with a Move.toml file)
   * @param args.namedAddresses  Named addresses for the move binary
   * @example
   * {
   *  alice:0x1234, bob:0x5678
   * }
   * @param args.extraArguments (optional) Any extra arguments to include in the form of an array of strings
   * @example
   * ["--assume-yes","--gas-unit-price=10"]
   *
   * @returns stdout
   */
  async test(args: {
    packageDirectoryPath: string;
    namedAddresses: Record<string, AccountAddress>;
    extraArguments?: Array<string>;
  }): Promise<{ output: string }> {
    const { packageDirectoryPath, namedAddresses, extraArguments } = args;
    const cliArgs = ["aptos", "move", "test", "--package-dir", packageDirectoryPath];

    const addressesMap = this.parseNamedAddresses(namedAddresses);

    cliArgs.push(...this.prepareNamedAddresses(addressesMap));

    if (extraArguments) {
      cliArgs.push(...extraArguments);
    }

    return this.runCommand(cliArgs);
  }

  /**
   * Function to publish the modules to the publisher account on the Aptos blockchain
   *
   * @param args.packageDirectoryPath Path to a move package (the folder with a Move.toml file)
   * @param args.namedAddresses  Named addresses for the move binary
   * @example
   * {
   *  alice:0x1234, bob:0x5678
   * }
   * @param args.profile optional Profile to use from the config file.
   * @param args.extraArguments (optional) Any extra arguments to include in the form of an array of strings
   * @example
   * ["--assume-yes","--gas-unit-price=10"]
   *
   * @returns stdout
   */
  async publish(args: {
    packageDirectoryPath: string;
    namedAddresses: Record<string, AccountAddress>;
    profile?: string;
    extraArguments?: Array<string>;
  }): Promise<{ output: string }> {
    const { packageDirectoryPath, namedAddresses, profile, extraArguments } = args;
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

    return this.runCommand(cliArgs);
  }

  /**
   * Function to create a new object and publish the Move package to it on the Aptos blockchain
   *
   * @param args.packageDirectoryPath Path to a move package (the folder with a Move.toml file)
   * @param args.addressName Address name for the Move package
   * @example
   * MoonCoin, please find the actual address name in Move.toml
   * @param args.namedAddresses  Named addresses for the move binary
   * @example
   * {
   *  alice:0x1234, bob:0x5678
   * }
   * @param args.profile optional Profile to use from the config file.
   * @param args.extraArguments (optional) Any extra arguments to include in the form of an array of strings
   * @example
   * ["--assume-yes","--gas-unit-price=10"]
   *
   * A complete example in cli
   * aptos move create-object-and-publish-package \
   * --package-dir path_to_directory_that_has_move.toml \
   * --address-name launchpad_addr \
   * --named-addresses "launchpad_addr=0x123,initial_creator_addr=0x456"\
   * --profile my_profile \
   * --assume-yes
   * @returns object address
   */
  async createObjectAndPublishPackage(args: {
    packageDirectoryPath: string;
    addressName: string;
    namedAddresses: Record<string, AccountAddress>;
    profile?: string;
    extraArguments?: Array<string>;
  }): Promise<{ objectAddress: string }> {
    const { packageDirectoryPath, addressName, namedAddresses, profile, extraArguments } = args;
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

    const result = await this.runCommand(cliArgs);
    return { objectAddress: this.extractAddressFromOutput(result.output) };
  }

  /**
   * Function to upgrade a Move package previously published to an object on the Aptos blockchain
   * Caller must be the object owner to call this function
   *
   * @param args.packageDirectoryPath Path to a move package (the folder with a Move.toml file)
   * @param args.objectAddress Address of the object that the Move package published to
   * @example
   * 0x1000
   * @param args.namedAddresses  Named addresses for the move binary
   * @example
   * {
   *  alice:0x1234, bob:0x5678
   * }
   * @param args.profile optional Profile to use from the config file.
   * @param args.extraArguments (optional) Any extra arguments to include in the form of an array of strings
   * @example
   * ["--assume-yes","--gas-unit-price=10"]
   *
   * @returns stdout
   */
  async upgradeObjectPackage(args: {
    packageDirectoryPath: string;
    objectAddress: string;
    namedAddresses: Record<string, AccountAddress>;
    profile?: string;
    extraArguments?: Array<string>;
  }): Promise<{ output: string }> {
    const { packageDirectoryPath, objectAddress, namedAddresses, profile, extraArguments } = args;
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

    return this.runCommand(cliArgs);
  }

  /**
   * Build a publication transaction payload and store it in a JSON output file
   *
   * @param args.packageDirectoryPath Path to a move package (the folder with a Move.toml file)
   * @param args.outputFile Output file to write publication transaction to
   * @param args.namedAddresses  Named addresses for the move binary
   * @example
   * {
   *  alice:0x1234, bob:0x5678
   * }
   * @param args.extraArguments (optional) Any extra arguments to include in the form of an array of strings
   * @example
   * ["--assume-yes","--gas-unit-price=10"]
   *
   * @returns stdout
   */
  async buildPublishPayload(args: {
    packageDirectoryPath: string;
    outputFile: string;
    namedAddresses: Record<string, AccountAddress>;
    extraArguments?: Array<string>;
  }) {
    const { outputFile, packageDirectoryPath, namedAddresses, extraArguments } = args;
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

    return this.runCommand(cliArgs);
  }

  /**
   * Function to run a Move script, please run compile before running this
   *
   * @param args.compiledScriptPath Path to a compiled Move script bytecode file
   * @param args.namedAddresses  Named addresses for the move binary
   * @example
   * build/my_package/bytecode_scripts/my_move_script.mv
   * @param args.profile optional Profile to use from the config file.
   * @param args.extraArguments (optional) Any extra arguments to include in the form of an array of strings
   * @example
   * ["--assume-yes","--gas-unit-price=10"]
   *
   * @returns stdout
   */
  async runScript(args: {
    compiledScriptPath: string;
    profile?: string;
    extraArguments?: Array<string>;
  }): Promise<{ output: string }> {
    const { compiledScriptPath, profile, extraArguments } = args;
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

    return this.runCommand(cliArgs);
  }

  /**
   * Run a move command
   *
   * @param args
   * @returns stdout
   */
  // eslint-disable-next-line class-methods-use-this
  private async runCommand(args: Array<string>): Promise<{ output: string }> {
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

      childProcess.stdout.pipe(process.stdout);
      childProcess.stderr.pipe(process.stderr);
      process.stdin.pipe(childProcess.stdin);

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
   * Convert named addresses from a Map into an array seperated by a comma
   *
   * @example
   * input: {'alice' => '0x123', 'bob' => '0x456'}
   * output: "alice=0x123,bob=0x456"
   *
   * @param namedAddresses
   * @returns An array of names addresses seperated by a comma
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
   * Parse named addresses from a Record type into a Map
   *
   * @param namedAddresses
   * @returns Map<name,address>
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
   * Extract object address from the output
   *
   * @param output
   * @returns object address
   */
  // eslint-disable-next-line class-methods-use-this
  private extractAddressFromOutput(output: string): string {
    const match = output.match("Code was successfully deployed to object address (0x[0-9a-fA-F]+)\\.");
    if (match) {
      return match[1];
    }
    throw new Error("Failed to extract object address from output");
  }
}
