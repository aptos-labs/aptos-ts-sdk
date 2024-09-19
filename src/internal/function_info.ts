import { Deserializer, Serializable, Serializer } from "../bcs";
import { AccountAddress, Hex } from "../core";

export class FunctionInfo extends Serializable {
    readonly module_address: AccountAddress;
    readonly module_name: string;
    readonly function_name: string;
    constructor(module_address: AccountAddress, module_name: string, function_name: string) {
        super();
        this.module_address = module_address;
        this.module_name = module_name;
        this.function_name = function_name;
    }

    serialize(serializer: Serializer): void {
        this.module_address.serialize(serializer);
        serializer.serializeStr(this.module_name);
        serializer.serializeStr(this.function_name);
    }
    static deserialize(deserializer: Deserializer): FunctionInfo {
        const module_address = AccountAddress.deserialize(deserializer);
        const module_name = deserializer.deserializeStr();
        const function_name = deserializer.deserializeStr();
        return new FunctionInfo(module_address, module_name, function_name);
    }
}