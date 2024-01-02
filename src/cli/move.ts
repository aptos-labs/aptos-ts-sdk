import { spawnSync } from "child_process";
import path from "path";
import fs from "fs";
import { Account } from "../core";

export class AptosCLI {
  static prepareNamedAddresses(namedAddresses: Map<string, Account>) {
    const totalNames = namedAddresses.size;
    const newArgs: Array<string> = [];

    if (totalNames == 0) {
      return newArgs;
    }

    newArgs.push("--named-addresses");

    let idx = 0;
    namedAddresses.forEach((value, key) => {
      idx++;
      let toAppend = `${key}=${value.accountAddress.toString()}`;
      if (idx < totalNames - 1) {
        toAppend += ",";
      }
      newArgs.push(toAppend);
    });
    return newArgs;
  }

  static appendAdditionalArguments(additionalArguments: Map<string, string>) {
    const totaArguments = additionalArguments.size;
    const newArgs: Array<string> = [];

    if (totaArguments == 0) {
      return newArgs;
    }

    let idx = 0;
    additionalArguments.forEach((value, key) => {
      idx++;
      let toAppend = `${key}=${value}`;
      if (idx < totaArguments - 1) {
        toAppend += " ";
      }
      newArgs.push(toAppend);
    });
    return newArgs;
  }

  // compile move modules
  async compilePackage(namedAddresses: Map<string, Account>, packageDir: string) {
    const args = [
      "aptos",
      "move",
      "compile",
      "--save-metadata",
      "--package-dir",
      packageDir,
      "--skip-fetch-latest-git-deps",
    ];

    args.push(...AptosCLI.prepareNamedAddresses(namedAddresses));

    spawnSync(`npx`, args, {
      stdio: "inherit",
    });
  }

  async compilePackageToJsonFile(packageDir: string, outputFile: string, namedAddresses: Map<string, Account>) {
    const args = [
      "aptos",
      "move",
      "build-publish-payload",
      "--json-output-file",
      outputFile,
      "--package-dir",
      packageDir,
      "--assume-yes",
    ];

    args.push(...AptosCLI.prepareNamedAddresses(namedAddresses));

    spawnSync(`npx`, args, {
      stdio: "inherit",
    });
  }

  async parseJsonToGetPackageBytesToPublish(filePath: string) {
    // current working directory - the root folder of this repo
    const cwd = process.cwd();
    // target directory - current working directory + filePath (filePath json file is generated with the prevoius, compilePackage, cli command)
    const modulePath = path.join(cwd, filePath);

    const jsonData = JSON.parse(fs.readFileSync(modulePath, "utf8"));

    const metadataBytes = jsonData.args[0].value;
    const byteCode = jsonData.args[1].value;

    return { metadataBytes, byteCode };
  }
}
