import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha512";
import * as bip39 from "@scure/bip39";

export type DerivedKeys = {
  key: Uint8Array;
  chainCode: Uint8Array;
};

export const APTOS_HARDENED_REGEX = /^m\/44'\/637'\/[0-9]+'\/[0-9]+'\/[0-9]+'?$/;
export const APTOS_BIP44_REGEX = /^m\/44'\/637'\/[0-9]+'\/[0-9]+\/[0-9]+$/;

export const HARDENED_OFFSET = 0x80000000;

export function isValidBIP44Path(path: string): boolean {
  return APTOS_BIP44_REGEX.test(path);
}

export function isValidHardenedPath(path: string): boolean {
  return APTOS_HARDENED_REGEX.test(path);
}

export const deriveKey = (hashSeed: Uint8Array | string, data: Uint8Array | string): DerivedKeys => {
  const digest = hmac.create(sha512, hashSeed).update(data).digest();
  return {
    key: digest.slice(0, 32),
    chainCode: digest.slice(32),
  };
};

export const CKDPriv = ({ key, chainCode }: DerivedKeys, index: number): DerivedKeys => {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setUint32(0, index);
  const indexBytes = new Uint8Array(buffer);
  const zero = new Uint8Array([0]);
  const data = new Uint8Array([...zero, ...key, ...indexBytes]);
  return deriveKey(chainCode, data);
};

const removeApostrophes = (val: string): string => val.replace(/'/g, "");

export const splitPath = (path: string): Array<string> => path.split("/").slice(1).map(removeApostrophes);

export const mnemonicToSeed = (mnemonic: string): Uint8Array => {
  const normalizedMnemonic = mnemonic
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .join(" ");
  return bip39.mnemonicToSeedSync(normalizedMnemonic);
};
