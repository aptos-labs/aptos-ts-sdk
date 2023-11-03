import { Aptos, AptosConfig } from "../api";
import { AccountAddress } from "../core";
import { MoveFunction, MoveModule } from "../types";
import { Network } from "../utils/apiEndpoints";
import { ArgumentNamesWithTypes, ModuleFunctionArgNameMap, ModuleMetadata, MoveFunctionWithArgumentNames, PackageMetadata } from "./types";
import { transformCode } from "./utils";

export const sortByNameField = (objs: any[]): any[] => {
  // sort the abiFunctions by moduleName alphabetically
  objs.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }
    return a.name > b.name ? 1 : 0;
  });
  return objs;
}

export async function getPackageMetadata(accountAddress: AccountAddress, network: Network): Promise<PackageMetadata[]> {
  const aptos = new Aptos(new AptosConfig({ network }));
  const packageMetadata = await aptos.getAccountResource<PackageMetadata[]>({ accountAddress: accountAddress.toString(), resourceType: "0x1::code::PackageRegistry" });
  const registryData = packageMetadata as {
    packages?: PackageMetadata[];
  };

  const packages: PackageMetadata[] =
    registryData?.packages?.map((pkg): PackageMetadata => {
      const sortedModules = sortByNameField(pkg.modules);
      return { name: pkg.name, modules: sortedModules };
    }) || [];

  return packages;
}

export async function getSourceCodeMap(accountAddress: AccountAddress, network: Network): Promise<Record<string, string>> {
  const packageMetadata = await getPackageMetadata(accountAddress, network);

  let sourceCodeByModuleName: Record<string, string> = {};

  packageMetadata.forEach((pkg) =>
    pkg.modules.forEach((module: ModuleMetadata) => {
      const sourceCode = transformCode(module.source);
      sourceCodeByModuleName[module.name] = sourceCode;
    })
  );

  return sourceCodeByModuleName;
}

export function extractSignature(functionName: string, sourceCode: string) {
  // find the function signature in the source code
  const regex = new RegExp(`${functionName}(<.*>)?\\s*\\(([^)]*)\\)`, 'm');
  const match = sourceCode.match(regex);
  return match ? match[2].trim() : null;
}

export function extractArguments(functionSignature: string): ArgumentNamesWithTypes[] {
  // parsing argument names
  const regex = /([\w_\d]+):\s*(&?[\w_\d]+)/g;
  let match;
  const argumentsList = [];

  while ((match = regex.exec(functionSignature)) !== null) {
      argumentsList.push({
          argName: match[1],
          typeTag: match[2]
      });
  }

  return argumentsList;
}


export function getArgNameMapping(abi: MoveModule, funcs: MoveFunction[], sourceCode: string): ModuleFunctionArgNameMap {
  let modulesWithFunctionSignatures: ModuleFunctionArgNameMap = {};

  funcs.map((func) => {
    const functionSignature = extractSignature(func.name, sourceCode);
    if (functionSignature === null) {
      throw new Error(`Could not find function signature for ${func.name}`);
    } else {
      const args = extractArguments(functionSignature);
      if (!modulesWithFunctionSignatures[abi.name]) {
        modulesWithFunctionSignatures[abi.name] = {};
      }
      modulesWithFunctionSignatures[abi.name][func.name] = args;
    }
  });

  return modulesWithFunctionSignatures;
}

export function getArgNames(abi: MoveModule, funcs: MoveFunction[], mapping: ModuleFunctionArgNameMap): Array<MoveFunctionWithArgumentNames> {
  return funcs.map(func => {
    let argNames = new Array<string>();
    if (abi.name in mapping && func.name in mapping[abi.name]) {
      argNames = mapping[abi.name][func.name].map((arg: ArgumentNamesWithTypes) => arg.argName);
    } else {
      argNames = []
    }
    return { ...func, arg_names: argNames}
  });
}


// export function convertToMoveFunctionWithArgumentNames(moveFunction: MoveFunction, argumentNames: ArgumentNamesWithTypes[]): MoveFunctionWithArgumentNames {
//   const moveFunctionWithArgumentNames = {
//     ...moveFunction,
//     arg_names: argumentNames.map(argument => argument.argumentName),
//   };
//   return moveFunctionWithArgumentNames;
// }

// export type ArgumentNamesWithTypes = {
//   name: string,
//   type: string
// };

// export type ABIFunctionsWithArgumentNames = {
//   moduleName: string;
//   functions: Array<ArgumentNamesWithTypes>;
// }

// // Given the move function names, we regex parse the argument names from the source code
// export async function getArgumentNames(sourceCode: string, moveFunctions: Array<MoveFunction>): Promise<ArgumentNamesWithTypes[][]> {

//   moveFunctions.forEach(moveFunction => {
//     const functionName = moveFunction.name;
//     const typeNames = moveFunction.params;
//     const signature = extractSignature(functionName, sourceCode);
//     const argumentNames = extractArguments(signature);
//     // All entry and view function arguments follow something like this format:
//     // [visibility] [entry] [fun] [functionName] (
//     // [argumentName]: [argumentType],
//     // [argumentName]: [argumentType],
//     // ...
//     // [argumentName]: [argumentType],
//     // ): [returnType] {
//   });
//   return sourceCode.map((pkg) =>
//     pkg.map(module => {
//       const argumentNames = extractArguments(module);
//       return argumentNames;
//     })
//   );
// }
