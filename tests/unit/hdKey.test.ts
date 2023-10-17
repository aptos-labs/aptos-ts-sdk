import { wallet } from "./helper";
import { derivePrivateKeyFromMnemonic, isValidPath, KeyType, Hex } from "../../src";

describe("Hierarchical Deterministic Key (hdkey)", () => {
  it("Parsing a valid path should work", () => {
    expect(isValidPath(wallet.path)).toBe(true);
    // Combinations of hardened allowed
    expect(isValidPath("m/44'/637'/0'/0'/1")).toBe(true);
    expect(isValidPath("m/44'/637'/0'/0'/1'")).toBe(true);
    // Other numbers are accepted
    expect(isValidPath("m/44'/637'/0'/0'/2")).toBe(true);
    expect(isValidPath("m/44'/637'/0'/2'/2")).toBe(true);
    expect(isValidPath("m/44'/637'/22'/22'/22")).toBe(true);
  });

  it("Parsing a invalid path should not work", () => {
    // All beginning fields have to be hardened
    expect(isValidPath("m/44/637/0/0/1")).toBe(false);
    expect(isValidPath("m/44'/637/0/0/1")).toBe(false);
    expect(isValidPath("m/44'/637'/0/0/1")).toBe(false);
    expect(isValidPath("m/44'/637'/0'/0/1")).toBe(false);
    // We don't accept `h`, only `'` is accepted
    expect(isValidPath("m/44'/637'/0h/0/0")).toBe(false);
    // No number
    expect(isValidPath("m/44'/637'/a/0/0")).toBe(false);
    // Invalid chain code
    expect(isValidPath("m/44'/638'/0/0/0")).toBe(false);
    // Not enough pieces
    expect(isValidPath("m/44'/637'/")).toBe(false);
    expect(isValidPath("m/44'/637'/0")).toBe(false);
    expect(isValidPath("m/44'/637'/0/0")).toBe(false);
    // Extra slash
    expect(isValidPath("m/44'/637'/0/0/0/")).toBe(false);
  });

  it("Deriving a key is valid and different with different paths", () => {
    const keys0 = derivePrivateKeyFromMnemonic(KeyType.ED25519, wallet.path, wallet.mnemonic);
    const keys1 = derivePrivateKeyFromMnemonic(KeyType.ED25519, wallet.path.replace("0", "1"), wallet.mnemonic);
    expect(keys0.key).toEqual(Hex.fromHexInput(wallet.privateKey).toUint8Array());
    expect(keys0.key).not.toEqual(keys1.key);
    expect(keys0.chainCode).not.toEqual(keys1.chainCode);
  });
});
