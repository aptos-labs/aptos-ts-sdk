import { Serializable } from "./serializer";

export type AptsoDomainSeparator = `APTOS::${string}`;
export abstract class CryptoHashable extends Serializable {
  abstract readonly domainSeparator: AptsoDomainSeparator;
}
