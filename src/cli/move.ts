import { spawn } from "child_process";
import { platform } from "os";

import { AccountAddress } from "../core";
import { Network } from "../utils";

export class Move {

/**
 * Initializes the current directory for Aptos by configuring the necessary settings.
 * This will push the configuration into the .aptos/config.yaml file.
 * 
 * @param args - The configuration arguments for initialization.
 * @param args.network - Optional Network type argument to use for default settings; defaults to 'local'.
 * @param args.profile - Optional Profile to use from the config file; defaults to 'default'. This will override associated settings such as the REST URL, the Faucet URL, and the private key arguments.
 * @param args.extraArguments - Optional array of extra arguments to include, such as ["--assume-yes", "--gas-unit-price=10"].
 * 
 * @returns stdout
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET }); // Specify the network
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Initialize the Aptos configuration
 *   await aptos.init({
 *     network: Network.TESTNET, // Specify your desired network
 *     profile: "default", // Specify your desired profile
 *     extraArguments: ["--assume-yes", "--gas-unit-price=10"] // Add any extra arguments if needed
 *   });
 * }
 * runExample().catch(console.error);
 * ```
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
 * Compiles a Move package located at the specified directory path.
 * This function helps you compile Move code by providing the necessary package directory and named addresses.
 * 
 * @param args - The arguments for the compilation.
 * @param args.packageDirectoryPath - Path to a Move package (the folder with a Move.toml file).
 * @param args.namedAddresses - Named addresses for the Move binary.
 * @param args.extraArguments - (optional) Any extra arguments to include in the form of an array of strings.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Compiling a Move package with specified parameters
 *   const result = await aptos.compile({
 *     packageDirectoryPath: "./path/to/move/package", // replace with your package path
 *     namedAddresses: {
 *       alice: "0x1", // replace with a real account address
 *       bob: "0x2" // replace with a real account address
 *     },
 *     extraArguments: ["--assume-yes", "--gas-unit-price=10"] // specify any additional arguments if needed
 *   });
 * 
 *   console.log(result); // Output the result of the compilation
 * }
 * runExample().catch(console.error);
 * ```
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
 * Run Move unit tests for a specified package directory.
 * This function helps you execute unit tests defined in a Move package, allowing you to verify the functionality of your smart contracts.
 * 
 * @param args - The arguments for running the tests.
 * @param args.packageDirectoryPath - Path to a Move package (the folder containing a Move.toml file).
 * @param args.namedAddresses - Named addresses for the Move binary.
 * @example
 * {
 *  alice: "0x1234", // replace with a real account address
 *  bob: "0x5678"    // replace with a real account address
 * }
 * @param args.extraArguments - (optional) Any extra arguments to include in the form of an array of strings.
 * @example
 * ["--assume-yes", "--gas-unit-price=10"]
 * 
 * @returns stdout
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Running Move unit tests for a package
 *   const result = await aptos.test({
 *     packageDirectoryPath: "./path/to/package", // specify your package directory
 *     namedAddresses: {
 *       alice: "0x1234", // replace with a real account address
 *       bob: "0x5678"    // replace with a real account address
 *     },
 *     extraArguments: ["--assume-yes", "--gas-unit-price=10"] // optional arguments
 *   });
 * 
 *   console.log(result); // Output the result of the test execution
 * }
 * runExample().catch(console.error);
 * ```
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
 * Publishes the modules to the publisher account on the Aptos blockchain.
 * 
 * @param args - The arguments for publishing the modules.
 * @param args.packageDirectoryPath - Path to a move package (the folder with a Move.toml file).
 * @param args.namedAddresses - Named addresses for the move binary.
 * @example
 * {
 *  alice: "0x1234", // replace with a real account address
 *  bob: "0x5678"    // replace with a real account address
 * }
 * @param args.profile - Optional profile to use from the config file.
 * @param args.extraArguments - Optional extra arguments to include in the form of an array of strings.
 * @example
 * ["--assume-yes", "--gas-unit-price=10"]
 * 
 * @returns stdout
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Publishing a move package to the Aptos blockchain
 *   const result = await aptos.publish({
 *     packageDirectoryPath: "./path/to/package", // specify the path to your move package
 *     namedAddresses: {
 *       alice: "0x1234", // replace with a real account address
 *       bob: "0x5678"    // replace with a real account address
 *     },
 *     profile: "default", // optional, specify your profile if needed
 *     extraArguments: ["--assume-yes", "--gas-unit-price=10"] // optional additional arguments
 *   });
 * 
 *   console.log(result); // Log the result of the publish command
 * }
 * runExample().catch(console.error);
 * ```
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
 * Create a new object and publish the Move package to it on the Aptos blockchain.
 * This function allows you to deploy a Move package and associate it with a specified address.
 * 
 * @param args - The arguments for creating the object and publishing the package.
 * @param args.packageDirectoryPath - Path to a Move package (the folder with a Move.toml file).
 * @param args.addressName - Address name for the Move package, such as "MoonCoin".
 * @param args.namedAddresses - Named addresses for the Move binary.
 * @example
 * {
 *  alice: "0x1234", 
 *  bob: "0x5678"
 * }
 * @param args.profile - Optional profile to use from the config file.
 * @param args.extraArguments - Optional extra arguments to include in the form of an array of strings.
 * @example
 * ["--assume-yes", "--gas-unit-price=10"]
 * @returns - The object address of the newly created object.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Create an object and publish a Move package
 *   const result = await aptos.createObjectAndPublishPackage({
 *     packageDirectoryPath: "./path_to_directory_that_has_move.toml", // specify your own path
 *     addressName: "launchpad_addr",
 *     namedAddresses: {
 *       launchpad_addr: "0x123", // replace with a real address
 *       initial_creator_addr: "0x456" // replace with a real address
 *     },
 *     profile: "my_profile", // optional, specify your own profile if needed
 *     extraArguments: ["--assume-yes"] // optional, specify any extra arguments if needed
 *   });
 * 
 *   console.log("Object Address:", result.objectAddress);
 * }
 * runExample().catch(console.error);
 * ```
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
 * Upgrades a Move package that has been previously published to an object on the Aptos blockchain. 
 * Ensure that the caller is the object owner to execute this function.
 * 
 * @param args - The arguments for upgrading the object package.
 * @param args.packageDirectoryPath - Path to a Move package (the folder containing the Move.toml file).
 * @param args.objectAddress - Address of the object that the Move package was published to.
 * @example
 * 0x1000
 * @param args.namedAddresses - Named addresses for the Move binary.
 * @example
 * {
 *   alice: 0x1234, 
 *   bob: 0x5678
 * }
 * @param args.profile - Optional profile to use from the config file.
 * @param args.extraArguments - Optional additional arguments to include in the form of an array of strings.
 * @example
 * ["--assume-yes", "--gas-unit-price=10"]
 * 
 * @returns stdout
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Upgrading a Move package for a specific object
 *   const result = await aptos.upgradeObjectPackage({
 *     packageDirectoryPath: "./path/to/package", // specify your own path
 *     objectAddress: "0x1000", // replace with a real object address
 *     namedAddresses: {
 *       alice: "0x1234", // replace with a real account address
 *       bob: "0x5678" // replace with a real account address
 *     },
 *     profile: "default", // specify your own profile if needed
 *     extraArguments: ["--assume-yes", "--gas-unit-price=10"] // specify your own arguments if needed
 *   });
 * 
 *   console.log(result); // Output the result of the upgrade
 * }
 * runExample().catch(console.error);
 * ```
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
 * Build a publication transaction payload and store it in a JSON output file.
 * This function helps you create a payload for publishing a Move package, which can then be executed on the Aptos blockchain.
 * 
 * @param args - The arguments for building the publish payload.
 * @param args.packageDirectoryPath - Path to a Move package (the folder with a Move.toml file).
 * @param args.outputFile - Output file to write the publication transaction to.
 * @param args.namedAddresses - Named addresses for the Move binary.
 * @example
 * {
 *   alice: "0x1234", // replace with a real account address
 *   bob: "0x5678"    // replace with a real account address
 * }
 * @param args.extraArguments - (optional) Any extra arguments to include in the form of an array of strings.
 * @example
 * ["--assume-yes", "--gas-unit-price=10"]
 * 
 * @returns stdout
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Build the publish payload
 *   const payload = await aptos.buildPublishPayload({
 *     packageDirectoryPath: "./path/to/package", // specify your package directory
 *     outputFile: "./output/payload.json",      // specify your desired output file
 *     namedAddresses: {
 *       alice: "0x1234", // replace with a real account address
 *       bob: "0x5678"    // replace with a real account address
 *     },
 *     extraArguments: ["--assume-yes", "--gas-unit-price=10"] // optional extra arguments
 *   });
 * 
 *   console.log(payload); // Log the output to verify it worked
 * }
 * runExample().catch(console.error);
 * ```
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
 * Runs a Move script using the specified compiled script path and optional parameters. 
 * This function allows you to execute scripts that have been compiled, enabling interaction with the Aptos blockchain.
 * 
 * @param args - The arguments for running the script.
 * @param args.compiledScriptPath - The path to a compiled Move script bytecode file. 
 *                                   @example "build/my_package/bytecode_scripts/my_move_script.mv"
 * @param args.profile - Optional profile to use from the config file. Defaults to "default".
 * @param args.extraArguments - Optional additional arguments to include as an array of strings. 
 *                              @example ["--assume-yes", "--gas-unit-price=10"]
 * 
 * @returns The standard output from the script execution.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Running a Move script
 *   const output = await aptos.runScript({
 *     compiledScriptPath: "build/my_package/bytecode_scripts/my_move_script.mv", // replace with your script path
 *     profile: "default", // specify your profile if needed
 *     extraArguments: ["--assume-yes", "--gas-unit-price=10"], // specify any extra arguments if needed
 *   });
 * 
 *   console.log(output);
 * }
 * runExample().catch(console.error);
 * ```
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
  private

/**
 * Executes a command in a child process and returns the standard output.
 * This function allows you to run shell commands programmatically and capture their output.
 * 
 * @param args - An array of strings representing the command and its arguments to execute.
 * 
 * @returns A promise that resolves with the output of the command if it executes successfully.
 * 
 * @example
 * ```typescript
 * import { spawn } from "child_process";
 * 
 * async function runExample() {
 *   // This will run a shell command using npx
 *   const result = await runCommand(["your-command", "--option"]); // replace with your command and options
 *   console.log(result.output); // Log the output of the command
 * }
 * runExample().catch(console.error);
 * ```
 */
 async runCommand(args: Array<string>): Promise<{ output: string }> {
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