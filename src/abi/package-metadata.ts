import { Aptos, AptosConfig } from "../api";
import { AccountAddress } from "../core";
import { MoveFunction, MoveModule } from "../types";
import { Network } from "../utils/apiEndpoints";
import {
  ArgumentNamesWithTypes,
  ModuleFunctionArgNameMap,
  ModuleMetadata,
  MoveFunctionWithArgumentNamesAndGenericTypes,
  PackageMetadata,
} from "./types";
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
};

export async function getPackageMetadata(accountAddress: AccountAddress, network: Network): Promise<PackageMetadata[]> {
  const aptos = new Aptos(new AptosConfig({ network }));
  const packageMetadata = await aptos.getAccountResource<PackageMetadata[]>({
    accountAddress: accountAddress.toString(),
    resourceType: "0x1::code::PackageRegistry",
  });
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

export async function getSourceCodeMap(
  accountAddress: AccountAddress,
  network: Network,
): Promise<Record<string, string>> {
  const packageMetadata = await getPackageMetadata(accountAddress, network);

  let sourceCodeByModuleName: Record<string, string> = {};

  packageMetadata.forEach((pkg) =>
    pkg.modules.forEach((module: ModuleMetadata) => {
      const sourceCode = transformCode(module.source);
      sourceCodeByModuleName[module.name] = sourceCode;
    }),
  );

  return sourceCodeByModuleName;
}

export type FunctionSignatureWithTypeTags = {
  genericTypeTags: string | null;
  functionSignature: string | null;
};

export function extractSignature(functionName: string, sourceCode: string): FunctionSignatureWithTypeTags {
  // find the function signature in the source code
  const regex = new RegExp(`fun ${functionName}(<.*>)?\\s*\\(([^)]*)\\)`, "m");
  const match = sourceCode.match(regex);
  let genericTypeTags = null;
  if (match) {
    genericTypeTags = match[1] ? match[1].slice(1, -1) : null;
  }
  return {
    genericTypeTags: genericTypeTags,
    functionSignature: match ? match[2].trim() : null,
  };
}

export function extractArguments(functionSignature: string): ArgumentNamesWithTypes[] {
  const args = functionSignature.split(',');
  const argumentsList = args.map((arg) => {
    const [argName, typeTag] = arg.split(':').map((arg) => arg.trim());
    if (argName && typeTag) {
      return { argName, typeTag };
    }
    return null;
  }).filter((arg) => arg !== null) as ArgumentNamesWithTypes[];

  return argumentsList;
}

export function getArgNameMapping(
  abi: MoveModule,
  funcs: MoveFunction[],
  sourceCode: string,
): ModuleFunctionArgNameMap {
  let modulesWithFunctionSignatures: ModuleFunctionArgNameMap = {};

  funcs.map((func) => {
    const { genericTypeTags, functionSignature } = extractSignature(func.name, sourceCode);
    if (functionSignature === null) {
      throw new Error(`Could not find function signature for ${func.name}`);
    } else {
      const args = extractArguments(functionSignature);
      if (!modulesWithFunctionSignatures[abi.name]) {
        modulesWithFunctionSignatures[abi.name] = {};
      }
      modulesWithFunctionSignatures[abi.name][func.name] = {
        genericTypes: genericTypeTags,
        argumentNamesWithTypes: args,
      };
    }
  });

  return modulesWithFunctionSignatures;
}

export function getMoveFunctionsWithArgumentNames(
  abi: MoveModule,
  funcs: MoveFunction[],
  mapping: ModuleFunctionArgNameMap,
): Array<MoveFunctionWithArgumentNamesAndGenericTypes> {
  return funcs.map((func) => {
    let argNames = new Array<string>();
    let genericTypes = null;
    if (abi.name in mapping && func.name in mapping[abi.name]) {
      genericTypes = mapping[abi.name][func.name].genericTypes;
      argNames = mapping[abi.name][func.name].argumentNamesWithTypes.map((arg: ArgumentNamesWithTypes) => arg.argName);
    } else {
      genericTypes = null;
      argNames = [];
    }
    return { ...func, genericTypes, argNames: argNames };
  });
}
