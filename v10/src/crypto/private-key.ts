import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import type { PublicKey } from "./public-key.js";
import type { Signature } from "./signature.js";
import { PrivateKeyVariants } from "./types.js";

export interface PrivateKey {
  sign(message: HexInput): Signature;
  publicKey(): PublicKey;
  toUint8Array(): Uint8Array;
}

// Static utilities on the PrivateKey namespace
export const PrivateKeyUtils = {
  AIP80_PREFIXES: {
    [PrivateKeyVariants.Ed25519]: "ed25519-priv-",
    [PrivateKeyVariants.Secp256k1]: "secp256k1-priv-",
    [PrivateKeyVariants.Secp256r1]: "secp256r1-priv-",
  } as Record<PrivateKeyVariants, string>,

  formatPrivateKey(privateKey: HexInput, type: PrivateKeyVariants): string {
    const aip80Prefix = PrivateKeyUtils.AIP80_PREFIXES[type];
    let formattedPrivateKey = privateKey;
    if (typeof formattedPrivateKey === "string" && formattedPrivateKey.startsWith(aip80Prefix)) {
      formattedPrivateKey = formattedPrivateKey.split("-")[2];
    }
    return `${aip80Prefix}${Hex.fromHexInput(formattedPrivateKey).toString()}`;
  },

  parseHexInput(value: HexInput, type: PrivateKeyVariants, strict?: boolean): Hex {
    const aip80Prefix = PrivateKeyUtils.AIP80_PREFIXES[type];

    if (typeof value === "string") {
      if (!strict && !value.startsWith(aip80Prefix)) {
        return Hex.fromHexInput(value);
      }
      if (value.startsWith(aip80Prefix)) {
        return Hex.fromHexString(value.split("-")[2]);
      }
      if (strict) {
        throw new Error("Invalid HexString input while parsing private key. Must AIP-80 compliant string.");
      }
      throw new Error("Invalid HexString input while parsing private key.");
    }

    return Hex.fromHexInput(value);
  },
};
