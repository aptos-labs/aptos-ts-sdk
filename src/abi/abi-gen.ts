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

function structTagBaseEqual(a: StructTag, b: StructTag): boolean {
    return a.address.toString() === b.address.toString() && a.module_name.identifier === b.module_name.identifier && a.name.identifier === b.name.identifier;
}

/**
 * Tracks information about the entry function argument
 * @typeString - the string representation of the type
 * @types - the type of each argument inwards, e.g. MoveVector<MoveOption<MoveVector<u64>>> would be [MoveVector, MoveOption, MoveVector, U64]
 * @comment - the comment for the argument, usually for indicating a generic that doesn't need to be specified in the serialization (for Objects for example)
 * @depth - the depth of the argument, e.g. MoveVector<MoveOption<MoveVector<u64>>> would be 3
 */
// `types` tracks the type of each argument inwards.
// MoveVector<MoveOption<MoveVector<u64>>> would be [MoveVector, MoveOption, MoveVector, U64]

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
            // return "MoveString";
        } else if (typeTag.isObject()) {
            // Objects can only have 1 TypeTag
            // when we return this, we will check if an AccountAddress kind is second to last,
            // because that means it's an Object<T>, then we'll remove the T and add a comment explaining
            // that T is of type: T
            // NOTE: This means a true Object<T> as an entry function argument will not work
            return ["MoveObject", ...toBCSClassName(typeTag.value.type_args[0])];
            // return `MoveObject`;
        } else if (typeTag.isOption()) {
            // Options can only have 1 TypeTag
            return [MoveOption.kind, ...toBCSClassName(typeTag.value.type_args[0])];
            // return `MoveOption<${toBCSClassName(typeTag.value.type_args[0], depth + 1)}>`;
        } else {
            // It must be a resource, otherwise the .move file would not compile
            return [typeTag.toString()];
            // return typeTag.toString();
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
        lines.push(`const account${i}: AccountAuthenticator | undefined; // ${signerArgument.annotation}`);
    });

    // ---------- Class fields ---------- //
    lines.push(``);
    lines.push(`export class ${className} extends Serializable {`);
    lines.push(`${TAB.repeat(1)}public readonly args: {`);
    functionArguments.forEach((functionArgument, i) => {
        const argComment = ` // ${functionArgument.annotation}`;
        lines.push(`${TAB.repeat(2)}${fieldNames[i]}: ${functionArgument.kindString}; ${argComment}`);
    });
    lines.push(`${TAB.repeat(1)}};`);
    lines.push('');

    // -------- Constructor input types -------- //
    // constructor fields
    lines.push(`${TAB.repeat(1)}constructor(args: {`);
    functionArguments.forEach((functionArgument, i) => {
        const inputType = processInputTypes(functionArgument.kindArray);
        // const inputType = processInputTypesConstruction(functionArgument);
        lines.push(`${TAB.repeat(2)}${fieldNames[i]}: ${inputType};`);
    });
    lines.push(`${TAB.repeat(1)}}) {`);

    // -------- Assign constructor fields to class fields -------- //
    lines.push(`${TAB.repeat(2)}super();`);
    functionArguments.forEach((_, i) => {
        lines.push(`${TAB.repeat(2)}this.${fieldNames[i]} = ${fieldNames[i]};`);
    });
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
    // lines.push(`${TAB.repeat(1)}serialize(serializer: Serializer): void {`);
    // lines.push(`${TAB.repeat(1)}`);
    // lines.push(`${TAB.repeat(1)}}`);
    lines.push(`}`);
    return lines.join('\n');
}

/*
    if (typeTag.isVector()) {
        return [MoveVector.kind, ...toBCSClassName(typeTag.value)];
    }
    if (typeTag.isStruct()) {
        if (typeTag.isString()) {
            return [MoveString.kind];
            // return "MoveString";
        } else if (typeTag.isObject()) {
            // Objects can only have 1 TypeTag
            // when we return this, we will check if an AccountAddress kind is second to last,
            // because that means it's an Object<T>, then we'll remove the T and add a comment explaining
            // that T is of type: T
            // NOTE: This means a true Object<T> as an entry function argument will not work
            return ["MoveObject", ...toBCSClassName(typeTag.value.type_args[0])];
            // return `MoveObject`;
        }  else if (typeTag.isOption()) {
            // Options can only have 1 TypeTag
            return [MoveOption.kind, ...toBCSClassName(typeTag.value.type_args[0])];
            // return `MoveOption<${toBCSClassName(typeTag.value.type_args[0], depth + 1)}>`;
        } else {
            // It must be a resource, otherwise the .move file would not compile
            return [typeTag.toString()];
            // return typeTag.toString();
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
*/

function processInputTypes(kindArray: Array<Kind>): string {
    let output = '';
    const kind = kindArray[0];
    switch (kind) {
        case MoveVector.kind:
        case MoveOption.kind:
            output += `${kindToSimpleTypeMap[kind]}<${processInputTypes(kindArray.slice(1))}>`;
            break;
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
            output += `${kindToSimpleTypeMap[kind]}`;
            break;
    }

    return output;
}
function processInputTypesConstruction(bcsArgument: BCSClassAnnotated): string {
    let output = '';


    return output;
}

const kindToSimpleTypeMap: { [key in Kind]: string } = {
    Bool: "boolean",
    U8: "number",
    U16: "number",
    U32: "number",
    U64: "number | bigint",
    U128: "number | bigint",
    U256: "number | bigint",
    AccountAddress: "HexInput | AccountAddress",
    MoveString: "string",
    MoveVector: "Array",
    MoveOption: "OptionInput", // OptionInput<T>
    MoveObject: "HexInput | AccountAddress",
    AccountAuthenticator: "AccountAuthenticator",
}

type BCSClassAnnotated = {
    kindArray: Array<Kind>,
    kindString: string,
    annotation: string,
}

function toSimpleArgumentInputType(kindArray: Array<Kind>): string {
    let inputs = '';
    kindArray.forEach((kind) => {
        switch (kind) {
            case "Bool":
                return Bool.kind;
            case "U8":
            case "U16":
            case "U32":
            case "U64":
            case "U128":
            case "U256":
                return "number";
            case "AccountAddress":
            case "MoveString":
                return "string";
            case "MoveVector":
                return "Array";
            case "MoveOption":
                return "Option";
            default:
                return kind;
        }
    });

    return inputs;
}

type EntryFunctionArgumentSignature = {
    signerArguments: Array<BCSClassAnnotated>,
    functionArguments: Array<BCSClassAnnotated>,
}

function getClassArgTypes(typeTags: Array<TypeTag>): EntryFunctionArgumentSignature {
    const signerArguments = new Array<BCSClassAnnotated>();
    const functionArguments = new Array<BCSClassAnnotated>();
    typeTags.forEach((typeTag) => {
        const kindArray = toBCSClassName(typeTag);
        const annotation = typeTag.toString();
        if (kindArray[0] == AccountAuthenticator.kind) {
            signerArguments.push({
                kindArray: [AccountAuthenticator.kind],
                kindString: AccountAuthenticator.kind,
                annotation,
            });

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
            functionArguments.push({
                kindArray: kindArray,
                kindString: kindArrayToString(kindArray),
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

