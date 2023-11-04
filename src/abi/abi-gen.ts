// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AccountAddress,
  Aptos,
  Bool,
  MoveOption,
  MoveString,
  MoveVector,
  TypeTag,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
  parseTypeTag,
} from "../../src";
import { AccountAuthenticator } from "../../src/transactions/authenticator/account";
import {
  getArgNameMapping,
  getMoveFunctionsWithArgumentNames,
  getSourceCodeMap,
  sortByNameField,
} from "../../src/abi/package-metadata";
import {
  ABIGeneratedCode,
  ABIGeneratedCodeMap,
  AbiFunctions,
  BCSClassAnnotated,
  BCSKinds,
  EntryFunctionArgumentSignature,
} from "../../src/abi/types";
import {
  fetchModuleABIs,
  isAbiDefined,
  kindArrayToString,
  kindToSimpleTypeMap,
  numberToLetter,
  sanitizeName,
  toBCSClassName,
  toPascalCase,
} from "../../src/abi/utils";
import fs from "fs";
import { ConfigDictionary } from "./config";
import * as prettier from "prettier";
import { sleep } from "../utils/helpers";

const DEFAULT_ARGUMENT_BASE = "arg_";
const R_PARENTHESIS = ")";

const BOILERPLATE_IMPORTS = `
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";
`;

export class CodeGenerator {
  public readonly config: ConfigDictionary;

  constructor(config: ConfigDictionary) {
    this.config = config;
  }

  // Note that the suppliedFieldNames includes the `&signer` and `signer` fields.
  metaclassBuilder(
    moduleAddress: AccountAddress,
    moduleName: string,
    functionName: string,
    className: string,
    typeTags: Array<TypeTag>,
    suppliedFieldNames?: Array<string>,
  ): string {
    const GENERIC_TYPE_TAGS = new Array<TypeTag>();
    const fieldNames = suppliedFieldNames ?? [];

    // Check if the user supplied field names
    // If they're undefined or length 0, generate them
    if (fieldNames === undefined || fieldNames.length === 0) {
      for (let i = 0; i < typeTags.length; i += 1) {
        fieldNames.push(`${DEFAULT_ARGUMENT_BASE}${i}`);
      }
      // otherwise, ensure that the array lengths match
    } else if (fieldNames.length !== typeTags.length) {
      throw new Error(`fieldNames.length (${fieldNames.length}) !== typeTags.length (${typeTags.length})`);
    }

    // --------------- Handle signers --------------- //
    // Get the array of annotated BCS class names, their string representation, and original TypeTag string
    const { signerArguments, functionArguments } = this.getClassArgTypes(typeTags);
    const lines: Array<string> = [];

    // TODO: Handle 1 vs multiple signers, you can construct the payload *for* them knowing how
    // many signers..!
    const signerArgumentNames = suppliedFieldNames ? suppliedFieldNames.splice(0, signerArguments.length) : [];
    signerArguments.forEach((signerArgument, i) => {
      // TODO: add later and support the various types of transaction construction
      lines.push(`// let ${signerArgumentNames[i]}: AccountAuthenticator | undefined; // ${signerArgument.annotation}`);
    });

    const argsType = `${className}PayloadBCSArguments`;

    // ---------- Declare class field types separately ---------- //
    if (functionArguments.length > 0) {
      lines.push(`export type ${argsType} = {`);
      functionArguments.forEach((functionArgument, i) => {
        lines.push(`${fieldNames[i]}: ${functionArgument.kindString};`);
      });
      lines.push("}");
    }

    // ---------- Class fields ---------- //
    lines.push("");
    lines.push(`export class ${className} extends EntryFunctionPayloadBuilder {`);
    lines.push(`public readonly moduleAddress = AccountAddress.fromRelaxed("${moduleAddress.toString()}");`);
    lines.push(`public readonly moduleName = "${moduleName}";`);
    lines.push(`public readonly functionName = "${functionName}";`);
    if (functionArguments.length > 0) {
      lines.push(`public readonly args: ${argsType};`);
    } else {
      lines.push(`public readonly args = { };`);
    }
    lines.push("");

    // -------- Constructor input types -------- //
    // constructor fields
    if (functionArguments.length > 0) {
      lines.push(`constructor(`);
      functionArguments.forEach((functionArgument, i) => {
        const inputType = this.createInputTypes(functionArgument.kindArray);
        const argComment = ` // ${functionArgument.annotation}`;
        lines.push(`${fieldNames[i]}: ${inputType}, ${argComment}`);
      });
      lines.push(`) {`);

      // -------- Assign constructor fields to class fields -------- //
      lines.push(`super();`);
      lines.push(`this.args = {`);
      functionArguments.forEach((_, i) => {
        const inputTypeConverter = this.createInputTypeConverter(fieldNames[i], functionArguments[i].kindArray, 0);
        lines.push(`${fieldNames[i]}: ${inputTypeConverter},`);
      });
      lines.push(`}`);
      lines.push(`}`);
    } else {
      lines.push(`constructor() { super(); this.args = { }; }`);
    }
    lines.push("");
    lines.push("}");
    return lines.join("\n");
  }

  createInputTypes(kindArray: Array<BCSKinds>): string {
    const kind = kindArray[0];
    switch (kind) {
      case MoveVector.kind:
        if (kindArray.length === 2 && kindArray[1] === U8.kind) {
          return "HexInput";
        }
      case MoveOption.kind:
        return `${kindToSimpleTypeMap[kind]}<${this.createInputTypes(kindArray.slice(1))}>`;
      case Bool.kind:
      case U8.kind:
      case U16.kind:
      case U32.kind:
      case U64.kind:
      case U128.kind:
      case U256.kind:
      case AccountAddress.kind:
      case MoveString.kind:
      case "MoveObject":
        return `${kindToSimpleTypeMap[kind]}`;
      default:
        throw new Error(`Unknown kind: ${kind}`);
    }
  }

  /**
   * The transformer function for converting the constructor input types to the class field types
   * @param bcsArgument the BCSClassAnnotated object containing the kindArray, kindString, and annotation
   * @returns a string representing the generated typescript code to convert the constructor input type to the class field type
   */
  createInputTypeConverter(
    fieldName: string,
    kindArray: Array<BCSKinds>,
    depth: number,
    replaceOptionWithVector = true,
  ): string {
    // replace MoveObject with AccountAddress for the constructor input types
    const kind = kindArray[0] === "MoveObject" ? AccountAddress.kind : kindArray[0];
    const nameFromDepth = depth === 0 ? `${fieldName}` : `arg${numberToLetter(depth)}`;
    switch (kind) {
      case MoveVector.kind:
        // if we're at the innermost type and it's a vector<u8>, we'll use the MoveVector.U8(hex: HexInput) factory method
        if (kindArray.length === 2 && kindArray[1] === U8.kind) {
          return `MoveVector.U8(${nameFromDepth})${R_PARENTHESIS.repeat(depth)}`;
        }
      case MoveOption.kind: {
        // conditionally replace MoveOption with MoveVector for the constructor input types
        const newBCSKinds = replaceOptionWithVector ? MoveVector.kind : kind;
        const innerNameFromDepth = `arg${numberToLetter(depth + 1)}`;
        return (
          `new ${newBCSKinds}(${nameFromDepth}.map(${innerNameFromDepth} => ` +
          `${this.createInputTypeConverter(innerNameFromDepth, kindArray.slice(1), depth + 1)})`
        );
      }
      case Bool.kind:
      case U8.kind:
      case U16.kind:
      case U32.kind:
      case U64.kind:
      case U128.kind:
      case U256.kind:
      case MoveString.kind:
        return `new ${kind}(${nameFromDepth})${R_PARENTHESIS.repeat(depth)}`;
      case AccountAddress.kind:
        return `${kind}.fromRelaxed(${nameFromDepth})${R_PARENTHESIS.repeat(depth)}`;
      default:
        throw new Error(`Unknown kind: ${kind}`);
    }
  }

  getClassArgTypes(typeTags: Array<TypeTag>, replaceOptionWithVector = true): EntryFunctionArgumentSignature {
    const signerArguments = new Array<BCSClassAnnotated>();
    const functionArguments = new Array<BCSClassAnnotated>();
    typeTags.forEach((typeTag) => {
      const kindArray = toBCSClassName(typeTag);
      const annotation = typeTag.toString();

      // Check if it's an AccountAuthenticator, which indicates it's a signer argument
      // and we add it to the signerArguments array
      if (kindArray[0] === AccountAuthenticator.kind) {
        signerArguments.push({
          kindArray: [AccountAuthenticator.kind],
          kindString: AccountAuthenticator.kind,
          annotation,
        });
        // It's a non-signer entry function argument, so we'll add it to the functionArguments array
      } else {
        // Check if the TypeTag is actually an Object type
        // Object<T> must have at least 2 types, so if the length is 1, it's not an Object
        if (kindArray.length > 1) {
          // Check if the second to last kind is an AccountAddress, because that's *always* an Object
          // if (kindArray[kindArray.length - 2] === AccountAddress.kind) {
          if (kindArray[kindArray.length - 2] === "MoveObject") {
            // Remove the second to last kind, because it's an Object
            kindArray.pop();
          }
        }
        // Replacing the Option with a Vector is useful for the constructor input types since
        // ultimately it's the same serialization, and we can restrict the number of elements
        // with the input type at compile time.
        // Since we want the annotation to remain the same, we perform the swap here, instead of
        // in the `toBCSClassName` function.
        let moveArgString = "";
        if (replaceOptionWithVector) {
          const newBCSKindsArray = kindArray.map((kindElement) => {
            if (kindElement === MoveOption.kind) {
              return MoveVector.kind;
            }
            return kindElement;
          });
          moveArgString = kindArrayToString(newBCSKindsArray);
        } else {
          moveArgString = kindArrayToString(kindArray);
        }
        functionArguments.push({
          kindArray,
          kindString: moveArgString,
          annotation,
        });
      }
    });

    return {
      signerArguments,
      functionArguments,
    };
  }

  // TODO: Add support for view functions. It should be very straightforward, since they're
  // the same as entry functions but with no BCS serialization, so it just uses the input types.
  // Also, no signers (verify this?)
  //
  // TODO: Add support for remote ABI BCS serialization? You just would treat everything like a view function.
  async fetchABIs(aptos: Aptos, accountAddress: AccountAddress): Promise<ABIGeneratedCodeMap> {
    const moduleABIs = await fetchModuleABIs(aptos, accountAddress);
    const sourceCodeMap = await getSourceCodeMap(accountAddress, aptos.config.network);

    let abiFunctions: AbiFunctions[] = [];
    let generatedCode: ABIGeneratedCodeMap = {};

    moduleABIs.filter(isAbiDefined).forEach((module) => {
      const { abi } = module;
      const exposedFunctions = abi.exposed_functions;

      const sourceCode = sourceCodeMap[abi.name];

      const publicEntryFunctions = exposedFunctions.filter((func) => func.is_entry);
      const privateEntryFunctions = exposedFunctions.filter((func) => func.is_entry && func.visibility === "private");
      const viewFunctions = exposedFunctions.filter((func) => func.is_view);

      const publicMapping = getArgNameMapping(abi, publicEntryFunctions, sourceCode);
      const privateMapping = getArgNameMapping(abi, privateEntryFunctions, sourceCode);
      const viewMapping = getArgNameMapping(abi, viewFunctions, sourceCode);

      const abiFunction = {
        moduleAddress: AccountAddress.fromRelaxed(abi.address),
        moduleName: abi.name,
        publicEntryFunctions: getMoveFunctionsWithArgumentNames(abi, publicEntryFunctions, publicMapping),
        privateEntryFunctions: getMoveFunctionsWithArgumentNames(abi, privateEntryFunctions, privateMapping),
        viewFunctions: getMoveFunctionsWithArgumentNames(abi, viewFunctions, viewMapping),
      };

      // TODO: fix private functions printing twice?

      abiFunctions.push(abiFunction);
      const moduleName = toPascalCase(abiFunction.moduleName);
      const sanitizedModuleName = sanitizeName(moduleName);

      if (abiFunction.publicEntryFunctions.length > 0) {
        const namespaceString = `export namespace ${sanitizedModuleName} {`;
        const publicFunctionsCode = abiFunction.publicEntryFunctions.map((func) => {
          try {
            const typeTags = func.params.map((param) => parseTypeTag(param));
            const generatedClassesCode = this.metaclassBuilder(
              abiFunction.moduleAddress,
              abiFunction.moduleName,
              func.name,
              `${toPascalCase(func.name)}`,
              typeTags,
              func.arg_names,
            );
            const formattedCode = prettier.format(generatedClassesCode, { parser: "typescript" });
            return formattedCode;
          } catch (e) {}
        });
        const privateFunctionsCode = abiFunction.privateEntryFunctions.map((func) => {
          try {
            const typeTags = func.params.map((param) => parseTypeTag(param));
            const generatedClassesCode = this.metaclassBuilder(
              abiFunction.moduleAddress,
              abiFunction.moduleName,
              func.name,
              `${toPascalCase(func.name)}`,
              typeTags,
              func.arg_names,
            );
            return generatedClassesCode;
          } catch (e) {}
        });

        const code = `${namespaceString}\n${publicFunctionsCode.join("\n")}\n${privateFunctionsCode.join("\n")}\n}`;
        generatedCode[abi.name] = {
          address: abi.address,
          name: abi.name,
          code: code,
        };
      }
    });

    return generatedCode;
  }

  writeGeneratedCodeToFiles(baseDirectory: string, codeMap: ABIGeneratedCodeMap, skipEmptyModules = true) {
    const namedAddresses = this.config.namedAddresses ?? {};

    Object.keys(codeMap).forEach(async (moduleName) => {
      if (skipEmptyModules && (!codeMap[moduleName] || codeMap[moduleName].code.length === 0)) {
        console.debug(`Skipping empty module ${module}`);
        return;
      }

      const { address, name, code } = codeMap[moduleName];
      let directory = baseDirectory + "/" + AccountAddress.fromRelaxed(address).toString();
      if (address in namedAddresses) {
        // if a named address directory exists, remove the previously unnamed-address/module directory
        if (fs.existsSync(moduleName)) {
          fs.rmdirSync(moduleName);
        }
        directory = baseDirectory + "/" + namedAddresses[AccountAddress.fromRelaxed(address).toString()];
      }
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
      }
      const fileName = `${name}.ts`;
      const filePath = `${directory}/${fileName}`;
      const contents = BOILERPLATE_IMPORTS + "\n\n" + code;
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath);
      }
      fs.writeFileSync(filePath, contents);
    });
  }

  // TODO: Add `deserializeAsTypeTag(typeTag: TypeTag)` where it deserializes something based solely on
  // a string type tag
  //
  // This would mean we have to include a `kind` in each BCS class instance that we can use as a string
  // type tag.
}
