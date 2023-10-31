import type { Deserializer } from "../../../bcs";
import { LegacyAccountAuthenticatorEd25519 } from "./legacyEd25519";
import { LegacyAccountAuthenticatorMultiEd25519 } from "./legacyMultiEd25519";
import { AccountAuthenticatorSingleKey } from "./singleKey";
import { AccountAuthenticatorVariant } from "./variant";

export class AccountAuthenticator {
  static deserialize(deserializer: Deserializer) {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case AccountAuthenticatorVariant.LegacyEd25519:
        return LegacyAccountAuthenticatorEd25519.load(deserializer);
      case AccountAuthenticatorVariant.LegacyMultiEd25519:
        return LegacyAccountAuthenticatorMultiEd25519.load(deserializer);
      case AccountAuthenticatorVariant.SingleKey:
        return AccountAuthenticatorSingleKey.load(deserializer);
      default:
        throw new Error(`Unknown variant index for AccountAuthenticator: ${index}`);
    }
  }
}
