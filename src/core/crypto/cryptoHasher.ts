import { generateSigningMessage } from "../../transactions/transactionBuilder/signingMessage";
import { Serializable } from "../../bcs/serializer";

export type AptsoDomainSeparator = `APTOS::${string}`;
export abstract class CryptoHashable extends Serializable {
  abstract readonly domainSeparator: AptsoDomainSeparator;

  /**
   * Hashes the bcs serialized from of the class. This is the typescript corollary to the BCSCryptoHash macro in aptos-core.
   * 
   * @returns Uint8Array
   */
  hash(): Uint8Array {
    return generateSigningMessage(this.bcsToBytes(), this.domainSeparator);
  }
}
