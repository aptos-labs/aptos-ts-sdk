import { SigningScheme } from "../types";
import { AccountAddress } from "../core";
import { Deserializer } from "../bcs/deserializer";

export function deserializeSchemeAndAddress(deserializer: Deserializer): {
  address: AccountAddress;
  signingScheme: SigningScheme;
} {
  const signingScheme = deserializer.deserializeUleb128AsU32();
  // Validate that signingScheme is a valid SigningScheme value
  if (!Object.values(SigningScheme).includes(signingScheme)) {
    throw new Error(
      `Deserialization of Account failed: SigningScheme variant ${signingScheme} is invalid ending at offset ${deserializer.getOffset()}`,
    );
  }
  const address = AccountAddress.deserialize(deserializer);
  return { address, signingScheme };
}
