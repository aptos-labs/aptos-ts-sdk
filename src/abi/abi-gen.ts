// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, AccountAddress, Aptos, AptosConfig, Bool, EntryFunctionArgumentTypes, MoveFunction, MoveModule, MoveModuleBytecode, MoveOption, MoveString, MoveStructType, MoveVector, Serializable, StructTag, TypeTag, TypeTagAddress, TypeTagBool, TypeTagReference, TypeTagSigner, TypeTagStruct, TypeTagU128, TypeTagU16, TypeTagU256, TypeTagU32, TypeTagU64, TypeTagU8, TypeTagVector, U128, U16, U256, U32, U64, U8, objectStructTag, parseTypeTag, stringStructTag } from "../../src";
import { AccountAuthenticator } from "../transactions/authenticator/account";
import { EntryFunctionArgument } from "../transactions/instances";
import { createFile } from "./classGen";
import { AccountAddressInput } from "./types";

async function fetchModuleABIs(aptos: Aptos, account: Account) {
    const moduleABIs = await aptos.getAccountModules({
        accountAddress: account.accountAddress.toString(),
    });
    return moduleABIs;
}

function isAbiDefined(obj: MoveModuleBytecode): obj is { bytecode: string, abi: MoveModule } {
    return obj.abi !== undefined;
}

type AbiFunctions = {
    moduleAddress: AccountAddress,
    moduleName: string,
    publicEntryFunctions: Array<MoveFunction>,
    privateEntryFunctions: Array<MoveFunction>,
    viewFunctions: Array<MoveFunction>,
};

/**
 * Tracks information about the entry function argument
 * @kindArray - the type of each argument inwards, e.g. MoveVector<MoveOption<MoveVector<u64>>> would be [MoveVector, MoveOption, MoveVector, U64]
 * @kindString - the string representation of the kind, aka its type
 * @annotation - the original Move argument TypeTag string
 */
type BCSClassAnnotated = {
    kindArray: Array<Kind>,
    kindString: string,
    annotation: string,
}

type EntryFunctionArgumentSignature = {
    signerArguments: Array<BCSClassAnnotated>,
    functionArguments: Array<BCSClassAnnotated>,
}

const TypeClasses = { Bool, U8, U16, U32, U64, U128, U256, AccountAddress, MoveString, MoveVector, MoveOption, TypeTagStruct, AccountAuthenticator };
type Kind = (typeof TypeClasses)[keyof typeof TypeClasses]['kind'] | "MoveObject";

function kindArrayToString(kindArray: Array<Kind>): string {
    if (kindArray.length == 0) {
        return "";
    } else if (kindArray.length == 1) {
        return kindArray[0];
    } else {
        let kindString = kindArray[kindArray.length - 1];
        for (let i = kindArray.length - 2; i >= 0; i -= 1) {
            kindString = `${kindArray[i]}<${kindString}>`;
        }
        return kindString;
    }
}
function toBCSClassName(typeTag: TypeTag): Array<Kind> {
    if (typeTag.isVector()) {
        return [MoveVector.kind, ...toBCSClassName(typeTag.value)];
    }
    if (typeTag.isStruct()) {
        if (typeTag.isString()) {
            return [MoveString.kind];
        } else if (typeTag.isObject()) {
            // Objects can only have 1 TypeTag
            // when we return this, we will check if an AccountAddress kind is second to last,
            // because that means it's an Object<T>, then we'll remove the T and add a comment explaining
            // that T is of type: T
            // NOTE: This means a true Object<T> as an entry function argument will not work
            return ["MoveObject", ...toBCSClassName(typeTag.value.type_args[0])];
        } else if (typeTag.isOption()) {
            // Options can only have 1 TypeTag
            return [MoveOption.kind, ...toBCSClassName(typeTag.value.type_args[0])];
        } else {
            // It must be a resource, otherwise the .move file would not compile
            return [typeTag.toString()];
        }
    }
    // as any because typeguards aren't working correctly...
    if ((typeTag as any).isBool()) { return [Bool.kind]; }
    if ((typeTag as any).isU8()) { return [U8.kind]; }
    if ((typeTag as any).isU16()) { return [U16.kind]; }
    if ((typeTag as any).isU32()) { return [U32.kind]; }
    if ((typeTag as any).isU64()) { return [U64.kind]; }
    if ((typeTag as any).isU128()) { return [U128.kind]; }
    if ((typeTag as any).isU256()) { return [U256.kind]; }
    if ((typeTag as any).isAddress()) { return [AccountAddress.kind]; }

    if (typeTag.isReference()) {
        if (typeTag.value.isSigner()) {
            return [AccountAuthenticator.kind];
        } else {
            throw new Error(`Invalid reference argument: ${typeTag.toString()}`);
        }
    }
    if (typeTag.isSigner()) {
        return [AccountAuthenticator.kind];
    }
    console.log(typeTag);

    throw new Error(`Unknown TypeTag: ${typeTag}`);
}

const DEFAULT_ARGUMENT_BASE = "arg_";
const TAB = "    ";
const R_PARENTHESIS = ")";

// Note that the suppliedFieldNames includes the `&signer` and `signer` fields.
function metaclassBuilder(className: string, typeTags: Array<TypeTag>, suppliedFieldNames?: Array<string>): string {
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
    const { signerArguments, functionArguments } = getClassArgTypes(typeTags);
    const lines: Array<string> = [];
    lines.push(`type MoveObject = AccountAddress`);
    lines.push();

    // TODO: Handle 1 vs multiple signers, you can construct the payload *for* them knowing how 
    // many signers..!
    signerArguments.forEach((signerArgument, i) => {
        lines.push(`let account${i}: AccountAuthenticator | undefined; // ${signerArgument.annotation}`);
    });

    const argsType = `${className}SerializableArgs`;

    // ---------- Declare class field types separately ---------- //
    lines.push(`export type ${argsType} = {`);
    functionArguments.forEach((functionArgument, i) => {
        lines.push(`${TAB.repeat(1)}${fieldNames[i]}: ${functionArgument.kindString};`);
    });
    lines.push(`}`);

    // ---------- Class fields ---------- //
    lines.push(``);
    lines.push(`export class ${className} extends Serializable {`);
    lines.push(`${TAB.repeat(1)}public readonly args: ${argsType};`);
    lines.push('');

    // -------- Constructor input types -------- //
    // constructor fields
    lines.push(`${TAB.repeat(1)}constructor(args: {`);
    functionArguments.forEach((functionArgument, i) => {
        const inputType = createInputTypes(functionArgument.kindArray);
        const argComment = ` // ${functionArgument.annotation}`;
        lines.push(`${TAB.repeat(2)}${fieldNames[i]}: ${inputType}; ${argComment}`);
    });
    lines.push(`${TAB.repeat(1)}}) {`);

    // -------- Assign constructor fields to class fields -------- //
    lines.push(`${TAB.repeat(2)}super();`);
    lines.push(`${TAB.repeat(2)}this.args = {`);
    functionArguments.forEach((_, i) => {
        const inputTypeConverter = createInputTypeConverter(fieldNames[i], functionArguments[i].kindArray, 0);
        lines.push(`${TAB.repeat(3)}${fieldNames[i]}: ${inputTypeConverter},`);
    });
    lines.push(`${TAB.repeat(2)}}`);
    lines.push(`${TAB.repeat(1)}}`);
    
    // -------- Add the serialize function -------- //
    const serializeFunction = `
    serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach(field => {
            const value = this.args[field as keyof typeof this.args];
            serializer.serialize(value);
        });
    }`;
    lines.push(serializeFunction);
    lines.push(`}`);
    return lines.join('\n');
}

function createInputTypes(kindArray: Array<Kind>): string {
    const kind = kindArray[0];
    switch (kind) {
        case MoveVector.kind:
        case MoveOption.kind:
            return `${kindToSimpleTypeMap[kind]}<${createInputTypes(kindArray.slice(1))}>`;
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

function numberToLetter(num: number): string {
    // Check if the number corresponds to the letters in the English alphabet
    if (num < 1 || num > 26) {
        throw new Error('Number out of range. Please provide a number between 1 and 26.');
    }

    // 64 is the ASCII code right before 'A'; therefore, adding the number gives the corresponding letter
    return String.fromCharCode(64 + num);
}

/**
 * The transformer function for converting the constructor input types to the class field types
 * @param bcsArgument the BCSClassAnnotated object containing the kindArray, kindString, and annotation
 * @returns a string representing the generated typescript code to convert the constructor input type to the class field type
 */
function createInputTypeConverter(fieldName: string, kindArray: Array<Kind>, depth: number, replaceOptionWithVector = true): string {
    // replace MoveObject with AccountAddress for the constructor input types
    const kind = kindArray[0] == "MoveObject" ? AccountAddress.kind : kindArray[0];
    const nameFromDepth = depth == 0 ? `args.${fieldName}` : `arg${numberToLetter(depth)}`;
    const whitespace = depth == 0 ? '' : TAB.repeat(depth + 2);
    switch (kind) {
        // if the next kindArray (kindArray + 1) == a non-generic type, then let's just use a factory method?
        // or we can keep it simple.
        case MoveVector.kind:
        case MoveOption.kind:
            // conditionally replace MoveOption with MoveVector for the constructor input types
            const newKind = replaceOptionWithVector ? MoveVector.kind : kind;
            const innerNameFromDepth = `arg${numberToLetter(depth + 1)}`;
            // const mappedString = `${whitespace}${nameFromDepth}.map(${innerNameFromDepth}: ${createInputTypes(kindArray.slice(1))} =>
            return `new ${newKind}(${nameFromDepth}.map(${innerNameFromDepth} => ` +
            `${createInputTypeConverter(innerNameFromDepth, kindArray.slice(1), depth + 1)})`;
            // const output = `new ${newKind}(${createInputTypeConverter(fieldName, kindArray.slice(1), depth + 1)})`;
        case Bool.kind:
        case U8.kind:
        case U16.kind:
        case U32.kind:
        case U64.kind:
        case U128.kind:
        case U256.kind:
        case MoveString.kind:
            return `new ${kind}(${nameFromDepth})${R_PARENTHESIS.repeat(depth)}`
        case AccountAddress.kind:
            return `${kind}.fromHexInputRelaxed(${nameFromDepth})${R_PARENTHESIS.repeat(depth)}`
        default:
            throw new Error(`Unknown kind: ${kind}`);
    }
}

function convertInputTypes(kindArray: Array<Kind>): string {
    return '';
}

const kindToSimpleTypeMap: { [key in Kind]: string } = {
    Bool: "boolean",
    U8: "number",
    U16: "number",
    U32: "number",
    U64: "AnyNumber",
    U128: "AnyNumber",
    U256: "AnyNumber",
    AccountAddress: "HexInput", // don't accept AccountAddress because it makes things messy
    MoveString: "string",
    MoveVector: "Array",
    MoveOption: "OneOrNone", // OneOrNone<T>
    MoveObject: "HexInput", // don't accept AccountAddress because it makes things messy
    AccountAuthenticator: "AccountAuthenticator",
}

function getClassArgTypes(typeTags: Array<TypeTag>, replaceOptionWithVector = true): EntryFunctionArgumentSignature {
    const signerArguments = new Array<BCSClassAnnotated>();
    const functionArguments = new Array<BCSClassAnnotated>();
    typeTags.forEach((typeTag) => {
        const kindArray = toBCSClassName(typeTag);
        const annotation = typeTag.toString();

        // Check if it's an AccountAuthenticator, which indicates it's a signer argument
        // and we add it to the signerArguments array
        if (kindArray[0] == AccountAuthenticator.kind) {
            signerArguments.push({
                kindArray: [AccountAuthenticator.kind],
                kindString: AccountAuthenticator.kind,
                annotation,
            });
        // It's an non-signer entry function argument, so we'll add it to the functionArguments array
        } else {
            // Check if the TypeTag is actually an Object type
            // Object<T> must have at least 2 types, so if the length is 1, it's not an Object
            if (kindArray.length > 1) {
                // Check if the second to last kind is an AccountAddress, because that's *always* an Object
                // if (kindArray[kindArray.length - 2] == AccountAddress.kind) {
                if (kindArray[kindArray.length - 2] == "MoveObject") {
                    // Remove the second to last kind, because it's an Object
                    kindArray.pop();
                }
            }
            // Replacing the Option with a Vector is useful for the constructor input types since
            // ultimately it's the same serialization, and we can restrict the number of elements
            // with the input type at compile time.
            // Since we want the annotation to remain the same, we perform the swap here, instead of
            // in the `toBCSClassName` function.
            let moveArgString = '';
            if (replaceOptionWithVector) {
                const newKindArray = kindArray.map((kindElement) => {
                    if (kindElement == MoveOption.kind) {
                        return MoveVector.kind;
                    } else {
                        return kindElement;
                    }
                });
                moveArgString = kindArrayToString(newKindArray);
            } else {
                moveArgString = kindArrayToString(kindArray);
            }
            functionArguments.push({
                kindArray: kindArray,
                kindString: moveArgString,
                annotation,
            });
        }
    });

    return {
        signerArguments: signerArguments,
        functionArguments: functionArguments,
    };
}

export async function fetchABIs(aptos: Aptos, senderAccount: Account) {
    const moduleABIs = await fetchModuleABIs(aptos, senderAccount);

    const abiFunctions: AbiFunctions[] = [];

    moduleABIs.filter(isAbiDefined).forEach((module) => {
        const abi = module.abi;
        const exposedFunctions = abi.exposed_functions;
        abiFunctions.push({
            moduleAddress: AccountAddress.fromHexInputRelaxed(abi.address),
            moduleName: abi.name,
            publicEntryFunctions: exposedFunctions.filter(func => func.is_entry && func.visibility == "public"),
            privateEntryFunctions: exposedFunctions.filter(func => func.is_entry && func.visibility == "private"),
            viewFunctions: exposedFunctions.filter(func => func.is_view),
        });
    });

    const tags = abiFunctions[0].publicEntryFunctions[1].params.map((param) => {
        // console.log(param);
        return parseTypeTag(param);
    });
    tags.push(parseTypeTag("vector<vector<vector<vector<u64>>>>"));
    tags.push(parseTypeTag("vector<vector<vector<vector<vector<u64>>>>>"));
    tags.push(parseTypeTag("0x1::option::Option<u8>"));
    tags.push(parseTypeTag("0x1::option::Option<vector<u8>>"));
    tags.push(parseTypeTag("0x1::option::Option<vector<0x1::option::Option<u64>>>"));
    const metaclass = metaclassBuilder("TestEntryFunctionPayload", tags, []);
    console.log(metaclass);
    // console.log(JSON.stringify(abiFunctions, null, 3));

    // createFile();

    return metaclass;
}

// TODO: Add `deserializeAsTypeTag(typeTag: TypeTag)` where it deserializes something based solely on
// a string type tag
// 
// This would mean we have to include a `kind` in each BCS class instance that we can use as a string
// type tag.

