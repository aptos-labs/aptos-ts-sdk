import { secp256k1WalletTestObject, wallet } from "./helper";
import { isValidBIP32Path, isValidHardenedPath } from "../../src";

describe("Hierarchical Deterministic Key (hdkey)", () => {
  describe("hardened path", () => {
    it("Parsing a valid path should work", () => {
      expect(isValidHardenedPath(wallet.path)).toBe(true);
      expect(isValidHardenedPath("m/44'/637'/0'/0'/1'")).toBe(true);
      expect(isValidHardenedPath("m/44'/637'/0'/0'/2'")).toBe(true);
      expect(isValidHardenedPath("m/44'/637'/0'/2'/2'")).toBe(true);
      expect(isValidHardenedPath("m/44'/637'/22'/22'/22'")).toBe(true);
    });

    it("Parsing a invalid path should not work", () => {
      // All beginning fields have to be hardened
      expect(isValidHardenedPath("m/44/637/0/0/1")).toBe(false);
      expect(isValidHardenedPath("m/44'/637/0/0/1")).toBe(false);
      expect(isValidHardenedPath("m/44'/637'/0/0/1")).toBe(false);
      expect(isValidHardenedPath("m/44'/637'/0'/0/1")).toBe(false);
      // We don't accept `h`, only `'` is accepted
      expect(isValidHardenedPath("m/44'/637'/0h/0/0")).toBe(false);
      // No number
      expect(isValidHardenedPath("m/44'/637'/a/0/0")).toBe(false);
      // Invalid chain code
      expect(isValidHardenedPath("m/44'/638'/0/0/0")).toBe(false);
      // Not enough pieces
      expect(isValidHardenedPath("m/44'/637'/")).toBe(false);
      expect(isValidHardenedPath("m/44'/637'/0")).toBe(false);
      expect(isValidHardenedPath("m/44'/637'/0/0")).toBe(false);
      // Extra slash
      expect(isValidHardenedPath("m/44'/637'/0/0/0/")).toBe(false);
    });
  });

  describe("BIP32 Path", () => {
    it("Parsing a valid path should work", () => {
      expect(isValidBIP32Path(secp256k1WalletTestObject.path)).toBe(true);
      expect(isValidBIP32Path("m/44'/637'/0'/0/1")).toBe(true);
      expect(isValidBIP32Path("m/44'/637'/0'/2/2")).toBe(true);
      expect(isValidBIP32Path("m/44'/637'/22'/2/22")).toBe(true);
    });

    it("Parsing a invalid path should not work", () => {
      expect(isValidBIP32Path("m/44'/637'/0'/0'/1")).toBe(false);
      expect(isValidBIP32Path("m/44'/637'/0'/0'/1'")).toBe(false);
      // All beginning fields have to be hardened
      expect(isValidBIP32Path("m/44/637/0/0/1")).toBe(false);
      expect(isValidBIP32Path("m/44'/637/0/0/1")).toBe(false);
      expect(isValidBIP32Path("m/44'/637'/0/0/1")).toBe(false);
      // We don't accept `h`, only `'` is accepted
      expect(isValidBIP32Path("m/44'/637'/0h/0/0")).toBe(false);
      // No number
      expect(isValidBIP32Path("m/44'/637'/a/0/0")).toBe(false);
      // Invalid chain code
      expect(isValidBIP32Path("m/44'/638'/0/0/0")).toBe(false);
      // Not enough pieces
      expect(isValidBIP32Path("m/44'/637'/")).toBe(false);
      expect(isValidBIP32Path("m/44'/637'/0")).toBe(false);
      expect(isValidBIP32Path("m/44'/637'/0/0")).toBe(false);
      // Extra slash
      expect(isValidBIP32Path("m/44'/637'/0/0/0/")).toBe(false);
    });
  });
});
