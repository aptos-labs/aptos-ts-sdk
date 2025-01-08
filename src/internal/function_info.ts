import { Deserializer, Serializable, Serializer } from "../bcs";
import { AccountAddress } from "../core";

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
    const moduleAddress = AccountAddress.deserialize(deserializer);
    console.log(moduleAddress.toUint8Array());
    const moduleName = deserializer.deserializeStr();
    console.log(moduleName);
    const functionName = deserializer.deserializeStr();
    console.log(functionName);
    return new FunctionInfo(moduleAddress, moduleName, functionName);
  }
}
