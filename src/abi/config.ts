import fs from "fs";
import yaml from "js-yaml";

export type NamedAddress = string;
export type AddressName = string;

export type Dictionary<T> = {
  [key: string]: T;
};

export type ConfigDictionary = {
  namedAddresses?: {
    [key: `0x${string}`]: string;
  };
  structArgs?: boolean;
  outputPath?: string;
  functionComments?: string;
  expandedStructs?: boolean; // 0x1::string::String vs String, 0x1::option::Option vs Option, etc
  replaceNamedAddresses?: boolean; // replace named addresses with their address values in types, e.g. Object<0xbeefcafe::some_resource::Resource> => Object<my_address::some_resource::Resource>
  includeAccountParams?: boolean;
};

export function getCodeGenConfig(configFilePath = "./src/abi/config.yaml"): ConfigDictionary {
  if (!fs.existsSync(configFilePath)) {
    throw new Error(`Config file not found at ${configFilePath}`);
  }
  const configFile = fs.readFileSync(configFilePath, "utf-8");
  const loadedConfig = yaml.load(configFile) as any;
  const config: ConfigDictionary = loadedConfig;
  const namedAddresses = config.namedAddresses;
  if (namedAddresses !== undefined) {
    Object.keys(namedAddresses).forEach((key) => {
      const address = namedAddresses[key as any];
      delete namedAddresses[key as any];
      namedAddresses[`0x${key}`] = address;
    });
  }
  config.namedAddresses = namedAddresses;
  return config;
}
