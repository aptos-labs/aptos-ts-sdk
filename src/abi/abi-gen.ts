// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AccountAddress,
  Aptos,
  Bool,
  MoveFunctionGenericTypeParam,
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
  BCSKindsWithGeneric,
  EntryFunctionArgumentSignature,
  GenericKind,
  codeGeneratorOptions,
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
  truncateAddressForFileName,
  truncateStruct,
} from "../../src/abi/utils";
import fs from "fs";
import { ConfigDictionary } from "./config";
// import { format } from "prettier";
import { sleep } from "../utils/helpers";

const DEFAULT_ARGUMENT_BASE = "arg_";
const R_PARENTHESIS = ")";

const BOILERPLATE_COPYRIGHT = `` + `// Copyright © Aptos Foundation\n` + `// SPDX-License-Identifier: Apache-2.0\n`;

const BOILERPLATE_IMPORTS = `
${BOILERPLATE_COPYRIGHT}

/* eslint-disable max-len */
import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, Account, InputTypes, AccountAddressInput, Hex, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256, parseTypeTag } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject, ObjectAddress, TypeTagInput } from "../../src/abi/types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilders";

`;

export class CodeGenerator {
  public readonly config: ConfigDictionary;

  constructor(config: ConfigDictionary) {
    this.config = config;
  }

  // Note that the suppliedFieldNames includes the `&signer` and `signer` fields.
  metaclassBuilder(args: codeGeneratorOptions): string {
    const {
      moduleAddress,
      moduleName,
      functionName,
      className,
      typeTags,
      genericTypeTags,
      viewFunction,
      displaySignerArgsAsComments,
      suppliedFieldNames,
      visibility,
      genericTypeParams,
      documentation,
    } = args;
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
      console.log(moduleAddress.toString(), moduleName, functionName, fieldNames, typeTags.map(t => t.toString()));
      throw new Error(`fieldNames.length (${fieldNames.length}) !== typeTags.length (${typeTags.length})`);
    }

    // --------------- Handle signers --------------- //
    // Get the array of annotated BCS class names, their string representation, and original TypeTag string
    const { signerArguments, functionArguments, genericsWithAbilities } = this.getClassArgTypes(
      typeTags,
      genericTypeParams,
    );
    const lines: Array<string> = [];

    const argsType = `${className}PayloadMoveArguments`;
    const signerArgumentNames = suppliedFieldNames ? suppliedFieldNames.splice(0, signerArguments.length) : [];
    const joinedGenericsWithAbilities = genericsWithAbilities.join(", ");

    // ---------- Declare class field types separately ---------- //
    if (functionArguments.length > 0) {
      lines.push(`export type ${argsType} = {`);
      functionArguments.forEach((functionArgument, i) => {
        if (viewFunction) {
          const viewFunctionInputTypeConverter = this.createInputTypes(functionArgument.kindArray);
          lines.push(`${fieldNames[i]}: ${viewFunctionInputTypeConverter};`);
        } else {
          lines.push(`${fieldNames[i]}: ${functionArgument.kindString};`);
        }
      });
      if (genericTypeTags) {
        lines.push(`typeTags: Array<TypeTag>;`);
      }
      lines.push("}");
    }
    lines.push("");

    // ---------- Documentation --------- //
    if (documentation?.displayFunctionSignature) {
      lines.push("/**");
      lines.push(`*  ${visibility} fun ${functionName}<${joinedGenericsWithAbilities}>(`);
      signerArguments.forEach((signerArgument, i) => {
        lines.push(`*     ${signerArgumentNames[i]}: ${signerArgument.annotation},`);
      });
      functionArguments.forEach((functionArgument, i) => {
        lines.push(`*     ${fieldNames[i]}: ${functionArgument.annotation},`);
      });
      lines.push("*   )");
      lines.push("**/");
    }

    // ---------- Class fields ---------- //
    const entryOrView = viewFunction ? "View" : "Entry";
    lines.push(`export class ${className} extends ${entryOrView}FunctionPayloadBuilder {`);
    lines.push(`public readonly moduleAddress = AccountAddress.fromRelaxed("${moduleAddress.toString()}");`);
    lines.push(`public readonly moduleName = "${moduleName}";`);
    lines.push(`public readonly functionName = "${functionName}";`);
    if (functionArguments.length > 0) {
      lines.push(`public readonly args: ${argsType};`);
    } else {
      lines.push(`public readonly args = { };`);
    }
    lines.push(`public readonly typeArgs: Array<TypeTag> = []; // ${joinedGenericsWithAbilities}`);
    lines.push("");

    // -------- Constructor input types -------- //
    // constructor fields
    if (functionArguments.length > 0) {
      lines.push(`constructor(`);
      signerArguments.forEach((signerArgument, i) => {
        if (this.config.includeAccountParams) {
          lines.push(`${signerArgumentNames[i]}: Account, // ${signerArgument.annotation}`);
        } else if (displaySignerArgsAsComments) {
          lines.push(`// ${signerArgumentNames[i]}: ${signerArgument.annotation},`);
        }
      });
      functionArguments.forEach((functionArgument, i) => {
        const inputType = this.createInputTypes(functionArgument.kindArray);
        const argComment = ` // ${functionArgument.annotation}`;
        lines.push(`${fieldNames[i]}: ${inputType}, ${argComment}`);
      });
      if (genericTypeTags) {
        lines.push(`typeTags: Array<TypeTagInput>, // ${joinedGenericsWithAbilities}`);
      }
      if (this.config.includeAccountParams && !viewFunction) {
        lines.push("feePayer?: Account, // optional fee payer account to sponsor the transaction");
      }
      lines.push(`) {`);

      // -------- Assign constructor fields to class fields -------- //
      lines.push(`super();`);
      lines.push(`this.args = {`);
      functionArguments.forEach((_, i) => {
        // Don't use BCS classes for view functions, since they don't need to be serialized
        // Although we can use them eventually when view functions accepts BCS inputs
        if (viewFunction) {
          // lines.push(`${fieldNames[i]}: ${functionArguments[i].kindArray},`);
          const viewFunctionInputTypeConverter = this.transformViewFunctionInputTypes(
            fieldNames[i],
            functionArguments[i].kindArray,
            0,
          );
          lines.push(`${fieldNames[i]}: ${viewFunctionInputTypeConverter},`);
        } else {
          const entryFunctionInputTypeConverter = this.transformEntryFunctionInputTypes(
            fieldNames[i],
            functionArguments[i].kindArray,
            0,
          );
          lines.push(`${fieldNames[i]}: ${entryFunctionInputTypeConverter},`);
        }
      });
      if (genericTypeTags) {
        lines.push(`typeTags: typeTags.map(typeTag => typeof typeTag === 'string' ? parseTypeTag(typeTag) : typeTag),`);
      }
      lines.push(`}`);
      lines.push(`}`);
    } else {
      lines.push(`constructor() { super(); this.args = { }; }`);
    }
    lines.push("");
    lines.push("}");
    return lines.join("\n");
  }

  createInputTypes(kindArray: BCSKindsWithGeneric, numGenericsEncountered: number = 0): string {
    const kind = kindArray[0];
    switch (kind) {
      case MoveVector.kind:
        if (kindArray.length === 2 && kindArray[1] === U8.kind) {
          return "HexInput";
        }
      case MoveOption.kind:
        // for both MoveVector and MoveOption, we'll recursively call this function
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
        if (kind === "GenericType") {
          return "InputTypes";
        }
        throw new Error(`Unknown kind: ${kind}`);
    }
  }

  /**
   * The transformer function for converting the constructor input types to the view function JSON types.
   *
   */
  transformViewFunctionInputTypes(fieldName: string, kindArray: BCSKindsWithGeneric, depth: number): string {
    // replace MoveObject with AccountAddress for the constructor input types
    const kind = kindArray[0] === "MoveObject" ? AccountAddress.kind : kindArray[0];
    const nameFromDepth = depth === 0 ? `${fieldName}` : `arg${numberToLetter(depth)}`;
    switch (kind) {
      case MoveVector.kind:
        // if we're at the innermost type and it's a vector<u8>, we'll use the MoveVector.U8(hex: HexInput) factory method
        if (kindArray.length === 2 && kindArray[1] === U8.kind) {
          return `Hex.fromHexInput(${nameFromDepth})${R_PARENTHESIS.repeat(depth)}`;
        }
      case MoveOption.kind: {
        const innerNameFromDepth = `arg${numberToLetter(depth + 1)}`;
        return (
          `${nameFromDepth}.map(${innerNameFromDepth} => ` +
          `${this.transformViewFunctionInputTypes(innerNameFromDepth, kindArray.slice(1), depth + 1)}`
        );
      }
      case AccountAddress.kind:
        return `${kind}.fromRelaxed(${nameFromDepth})${R_PARENTHESIS.repeat(depth)}`;
      case Bool.kind:
      case U8.kind:
      case U16.kind:
      case U32.kind:
      case U64.kind:
      case U128.kind:
      case U256.kind:
      case MoveString.kind:
        return `${nameFromDepth}${R_PARENTHESIS.repeat(depth)}`;
      default:
        if (kind === "GenericType") {
          return "InputTypes";
        }
        throw new Error(`Unknown kind: ${kind}`);
    }
  }

  /**
   * The transformer function for converting the constructor input types to the class field types
   * @param kindArray the array of BCSKinds, aka the class types as strings
   * @returns a string representing the generated typescript code to convert the constructor input type to the class field type
   * @see BCSKinds
   */
  transformEntryFunctionInputTypes(
    fieldName: string,
    kindArray: BCSKindsWithGeneric,
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
          `${this.transformEntryFunctionInputTypes(innerNameFromDepth, kindArray.slice(1), depth + 1)})`
        );
      }
      case AccountAddress.kind:
        return `${kind}.fromRelaxed(${nameFromDepth})${R_PARENTHESIS.repeat(depth)}`;
      case Bool.kind:
      case U8.kind:
      case U16.kind:
      case U32.kind:
      case U64.kind:
      case U128.kind:
      case U256.kind:
      case MoveString.kind:
        return `new ${kind}(${nameFromDepth})${R_PARENTHESIS.repeat(depth)}`;
      default:
        if (kind === "GenericType") {
          return "InputTypes";
        }
        throw new Error(`Unknown kind: ${kind}`);
    }
  }

  getClassArgTypes(
    typeTags: Array<TypeTag>,
    genericTypeParams: Array<MoveFunctionGenericTypeParam>,
    replaceOptionWithVector = true,
  ): EntryFunctionArgumentSignature {
    const signerArguments = new Array<BCSClassAnnotated>();
    const functionArguments = new Array<BCSClassAnnotated>();
    const genericsWithAbilities = new Array<string>();
    typeTags.forEach((typeTag, i) => {
      const kindArray = toBCSClassName(typeTag);
      let annotation = this.config.expandedStructs ? typeTag.toString() : truncateStruct(typeTag);

      // TODO: Change this to Account? Or something else, not sure. But AccountAuthenticator doesn't make sense in the new flow anymore.
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
        if (kindArray[kindArray.length - 1] === "GenericType") {
          const genericType = `T${genericsWithAbilities.length}`;
          const constraints = `: ${genericTypeParams[genericsWithAbilities.length].constraints.join(" + ")}`;
          // 2, because that's the length of ": ". We don't add it if there are no constraints
          const genericTypeWithConstraints = constraints.length > 2 ? `${genericType}${constraints}` : genericType;
          // Check if the second to last kind is an AccountAddress, because that's *always* an Object
          // if (kindArray[kindArray.length - 2] === AccountAddress.kind) {
          if (kindArray[kindArray.length - 2] === "MoveObject") {
            // Remove the second to last kind, because it's an Object
            genericsWithAbilities.push(genericTypeWithConstraints);
            kindArray.pop();
            annotation += `<${genericType}>`;
          } else {
            genericsWithAbilities.push(genericTypeWithConstraints);
            // The second to last kind is not an Object, so we'll add it to the functionArguments array
            // this is a generically typed argument, meaning (as of right now, 11-2023), it's a normal
            // BCS argument            // functionArguments.push({
            //   kindArray,
            //   kindString: kindArrayToString(kindArray),
            //   annotation,
            // });
          }
        }

        let moveArgString = "";
        if (kindArray[kindArray.length - 1] == "GenericType") {
          kindArray[kindArray.length - 1] = "EntryFunctionArgumentTypes";
          moveArgString = kindArrayToString(kindArray);
        }

        // Replacing the Option with a Vector is useful for the constructor input types since
        // ultimately it's the same serialization, and we can restrict the number of elements
        // with the input type at compile time.
        // Since we want the annotation to remain the same, we perform the swap here, instead of
        // in the `toBCSClassName` function.
        if (replaceOptionWithVector) {
          const newBCSKindsArray = kindArray.map((kindElement) => {
            if (kindElement === MoveOption.kind) {
              return MoveVector.kind;
            }
            return kindElement;
          });
          moveArgString = kindArrayToString(newBCSKindsArray);
        } else {
          // the only time we have a GenericType at the end is when it's for the actual argument.
          // since we pop the argument off if it's an Object<T>, we can assume that it's an actual
          // generic argument that the developer will have to serialize themselves.
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
      genericsWithAbilities,
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

    await Promise.all(
      moduleABIs.filter(isAbiDefined).map(async (module) => {
        const { abi } = module;
        const exposedFunctions = abi.exposed_functions;
        const sourceCode = sourceCodeMap[abi.name];

        const publicEntryFunctions = exposedFunctions.filter((func) => func.is_entry && func.visibility !== "private");
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
        // TODO: Remove this? We may not need it now that we are using namespaces only.
        // const sanitizedModuleName = sanitizeName(moduleName);

        // count the number of typeTags in the ABI
        // then populate the typeTags array with the correct number of generic type tags
        // and hard code them 1 by 1 into the generated code
        // you can also use this to count/match generics to a type `T` in Object<T>

        const functionsWithAnyVisibility = [
          abiFunction.publicEntryFunctions,
          abiFunction.privateEntryFunctions,
          abiFunction.viewFunctions,
        ];
        const codeForFunctionsWithAnyVisibility: Array<Array<string | undefined>> = [[], [], []];
        functionsWithAnyVisibility.forEach((functions, i) => {
          if (functions.length > 0) {
            codeForFunctionsWithAnyVisibility[i].push(
              ...functions.map((func) => {
                try {
                  const typeTags = func.params.map((param) => parseTypeTag(param, { allowGenerics: true }));
                  const generatedClassesCode = this.metaclassBuilder({
                    moduleAddress: abiFunction.moduleAddress,
                    moduleName: abiFunction.moduleName,
                    functionName: func.name,
                    className: `${toPascalCase(func.name)}`,
                    typeTags: typeTags,
                    genericTypeTags: func.genericTypes,
                    viewFunction: func.is_view,
                    displaySignerArgsAsComments: true,
                    suppliedFieldNames: func.argNames,
                    visibility: func.visibility as "public" | "private",
                    genericTypeParams: func.generic_type_params,
                    documentation: {
                      fullStructNames: false,
                      displayFunctionSignature: true,
                    },
                  });
                  return generatedClassesCode;
                } catch (e) {
                  if (func.params.find((param) => param.startsWith("&0x"))) {
                    console.warn(
                      `Ignoring deprecated parameter ${func.params.find((param) =>
                        param.startsWith("&0x"),
                      )} in function ${func.name}`,
                    );
                  } else {
                    const typeTags = func.params.map((param) => parseTypeTag(param, { allowGenerics: true }));
                    console.log(func.genericTypes);
                    console.log(typeTags.map((typeTag) => typeTag.toString()));
                    console.log(abiFunction.moduleAddress.toString());
                    console.log(abiFunction.moduleName);
                    console.log(func.name);
                    console.error(e);
                  }
                }
              }),
            );
          }
        });
        const publicFunctionsCode: Array<string | undefined> = codeForFunctionsWithAnyVisibility[0];
        const privateFunctionsCode: Array<string | undefined> = codeForFunctionsWithAnyVisibility[1];
        const viewFunctionsCode: Array<string | undefined> = codeForFunctionsWithAnyVisibility[2];

        const publicFunctionsCodeString = `\n${publicFunctionsCode.join("\n")}`;
        const privateFunctionsCodeString = `\n${privateFunctionsCode.join("\n")}\n`;
        const viewFunctionsCodeString = `\n${viewFunctionsCode.join("\n")}\n`;

        const namespaceString = `export namespace ${moduleName} {\n`;
        const entryFunctionsNamespace = `export namespace EntryFunctions {\n${publicFunctionsCodeString}${privateFunctionsCodeString}}`;
        const viewFunctionsNamespace = `export namespace ViewFunctions {\n${viewFunctionsCodeString}}`;

        if (publicFunctionsCode.length + privateFunctionsCode.length + viewFunctionsCode.length > 0) {
          let code = `${namespaceString}`;
          code += entryFunctionsNamespace;
          code += viewFunctionsNamespace;
          code += `}`;
          generatedCode[abi.name] = {
            address: abi.address,
            name: abi.name,
            // code: await format(code, { parser: "typescript" }),
            code: code,
          };
        }
      }),
    );

    return generatedCode;
  }

  async generateCodeForModules(aptos: Aptos, moduleAddresses: Array<AccountAddress>): Promise<void> {
    const baseDirectory = this.config.outputPath ?? ".";
    const generatedIndexFile: Array<string> = [BOILERPLATE_COPYRIGHT];
    await Promise.all(
      moduleAddresses.map(async (address) => {
        const generatedCode = await this.fetchABIs(aptos, address);
        const namedAddresses = this.config.namedAddresses ?? {};
        const addressString = address.toString();
        const namedAddress = addressString in namedAddresses ? namedAddresses[addressString] : addressString;
        this.writeGeneratedCodeToFiles(namedAddress, baseDirectory, generatedCode);
        const fileNamedAddress = namedAddress.startsWith("0x")
          ? truncateAddressForFileName(address)
          : toPascalCase(namedAddress);
        generatedIndexFile.push(`export * as ${fileNamedAddress} from "./${namedAddress}";`);
        generatedIndexFile.push("\n");
        const filePath = `${baseDirectory}/index.ts`;
        // Read from `index.ts` and check if the namedAddress is already in the file
        // If it is, don't add it again
        const newExport = `export * as ${fileNamedAddress} from "./${namedAddress}";\n`;
        if (fs.existsSync(filePath)) {
          const fileContents = fs.readFileSync(filePath, "utf8");
          if (fileContents.includes(newExport)) {
            // pass
          } else {
            const newFileContents = fileContents + newExport;
            fs.writeFileSync(filePath, newFileContents);
          }
        } else {
          fs.writeFileSync(filePath, generatedIndexFile.join("\n"));
        }
      }),
    );
  }

  writeGeneratedCodeToFiles(
    namedAddress: string,
    baseDirectory: string,
    codeMap: ABIGeneratedCodeMap,
    skipEmptyModules = true,
  ) {
    const perAddressIndexFile: Array<string> = [BOILERPLATE_COPYRIGHT];

    Object.keys(codeMap).forEach(async (moduleName, i) => {
      if (skipEmptyModules && (!codeMap[moduleName] || codeMap[moduleName].code.length === 0)) {
        console.debug(`Skipping empty module ${module}`);
        return;
      }

      const { name, code } = codeMap[moduleName];
      const directory = baseDirectory + "/" + namedAddress;
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
      }
      const fileName = `${name}.ts`;
      const filePath = `${directory}/${fileName}`;
      const contents = BOILERPLATE_IMPORTS + "\n\n" + code;

      perAddressIndexFile.push(`export * as ${toPascalCase(name)} from "./${name}";`);
      if (i === Object.keys(codeMap).length - 1) {
        perAddressIndexFile.push("\n");
        // create the index.ts file
        const indexFilePath = `${directory}/index.ts`;
        if (fs.existsSync(indexFilePath)) {
          fs.rmSync(indexFilePath);
        }
        fs.writeFileSync(indexFilePath, perAddressIndexFile.join("\n"));
      }

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
