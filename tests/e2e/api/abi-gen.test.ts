// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, AccountAddress, Aptos, AptosConfig, Bool, EntryFunctionArgumentTypes, MoveFunction, MoveModule, MoveModuleBytecode, Network, StructTag, TypeTag, TypeTagAddress, TypeTagBool, TypeTagParser, TypeTagStruct, TypeTagU128, TypeTagU16, TypeTagU256, TypeTagU32, TypeTagU64, TypeTagU8, TypeTagVector, U128, U16, U256, U32, U64, U8, objectStructTag } from "../../../src";
import { FUND_AMOUNT } from "../../unit/helper";
import { publishModule } from "./helper";

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

function toBCSClassName(typeTag: TypeTag): string {
    if (typeTag instanceof TypeTagVector) {
        return `MoveVector<${toBCSClassName(typeTag.value)}>`;
    }
    else if (typeTag instanceof TypeTagStruct) {
        if (typeTag.isStringTypeTag()) {
            return "MoveString";
        } else if (typeTag.isObjectTypeTag()) {
            return `MoveObject<${toBCSClassName(typeTag.value)}>`;
        } else if (typeTag.isOptionTypeTag()) {
            return `MoveOption<${toBCSClassName(typeTag.value)}>`;
        } else if (typeTag.value.type_args.length === 0) {
            return `${typeTag.value.address.toString()}::${typeTag.value.module_name.identifier}::${typeTag.value.name.identifier}`;
        } else {
            throw new Error("Should be unreachable.")
        }
        return ``;
        // return toBCSStructName(typeTag);
    } else if (typeTag instanceof TypeTagBool) {
        return "Bool";
    } else if (typeTag instanceof TypeTagU8) {
        return "U8";
    } else if (typeTag instanceof TypeTagU16) {
        return "U16";
    } else if (typeTag instanceof TypeTagU32) {
        return "U32";
    } else if (typeTag instanceof TypeTagU64) {
        return "U64";
    } else if (typeTag instanceof TypeTagU128) {
        return "U128";
    } else if (typeTag instanceof TypeTagU256) {
        return "U256";
    } else if (typeTag instanceof TypeTagAddress) {
        return "AccountAddress";//.fromHexInputRelaxed({ input: value });
    } else if (typeTag instanceof StructTag) {
        return `${typeTag.address.toString()}::${typeTag.module_name.identifier}::${typeTag.name.identifier}`;
    } else {
        console.log(typeTag instanceof TypeTagStruct);
        console.log(typeTag);
        console.log(typeTag);
        throw new Error('type tag not found');
    }
    return '';
}

function metaclassBuilder(typeTags: Array<TypeTag>): string {
    const lines: Array<string> = [];
    lines.push("export class Metaclass {");
    typeTags.forEach((typeTag, i) => {
        lines.push(`    public readonly arg_${i}: ${toBCSClassName(typeTag)};`);
    });
    
    return lines.join('\n');
}

describe("module abi tester", () => {
    beforeAll(async () => {
        const aptos = new Aptos(new AptosConfig({ network: Network.LOCAL }));
        const senderAccount = Account.generate();
        await aptos.fundAccount({ accountAddress: senderAccount.accountAddress.toString(), amount: FUND_AMOUNT});
        await publishModule(aptos, senderAccount)
        const moduleABIs = await fetchModuleABIs(aptos, senderAccount);

        const abiFunctions: AbiFunctions[] = [];

        moduleABIs.filter(isAbiDefined).forEach((module) => {
            const abi = module.abi;
            const exposedFunctions = abi.exposed_functions;
            abiFunctions.push({
                moduleAddress: AccountAddress.fromHexInputRelaxed({input: abi.address}),
                moduleName: abi.name,
                publicEntryFunctions: exposedFunctions.filter(func => func.is_entry && func.visibility == "public"),
                privateEntryFunctions: exposedFunctions.filter(func => func.is_entry && func.visibility == "private"),
                viewFunctions: exposedFunctions.filter(func => func.is_view),
            });
        });

        const tags = abiFunctions[0].publicEntryFunctions[0].params.map((param) => {
            return new TypeTagParser(param).parseTypeTag();
        });
        tags.push(new TypeTagParser("vector<vector<vector<vector<u64>>>>").parseTypeTag());
        tags.push(new TypeTagParser("vector<vector<vector<vector<vector<u64>>>>>>").parseTypeTag());
        tags.push(new TypeTagParser("0x1::option::Option<u8>").parseTypeTag());
        tags.push(new TypeTagParser("0x1::option::Option<vector<u8>>").parseTypeTag());
        tags.push(new TypeTagParser("0x1::option::Option<vector<0x1::option::Option<u64>>>").parseTypeTag()); // TODO: FIX incorrect
        const metaclass = metaclassBuilder(tags);
        console.log(metaclass);
        // console.log(JSON.stringify(abiFunctions, null, 3));
    });

    it("succeeds", () => {
        
    });
});
