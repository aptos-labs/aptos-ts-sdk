import { secp256k1WalletTestObject, wallet } from "./helper";
import { Ed25519PrivateKey, Hex, isValidBIP44Path, isValidHardenedPath, Secp256k1PrivateKey } from "../../src";

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

  describe("BIP44 Path", () => {
    it("Parsing a valid path should work", () => {
      expect(isValidBIP44Path(secp256k1WalletTestObject.path)).toBe(true);
      expect(isValidBIP44Path("m/44'/637'/0'/0/1")).toBe(true);
      expect(isValidBIP44Path("m/44'/637'/0'/2/2")).toBe(true);
      expect(isValidBIP44Path("m/44'/637'/22'/2/22")).toBe(true);
    });

    it("Parsing a invalid path should not work", () => {
      expect(isValidBIP44Path("m/44'/637'/0'/0'/1")).toBe(false);
      expect(isValidBIP44Path("m/44'/637'/0'/0'/1'")).toBe(false);
      // All beginning fields have to be hardened
      expect(isValidBIP44Path("m/44/637/0/0/1")).toBe(false);
      expect(isValidBIP44Path("m/44'/637/0/0/1")).toBe(false);
      expect(isValidBIP44Path("m/44'/637'/0/0/1")).toBe(false);
      // We don't accept `h`, only `'` is accepted
      expect(isValidBIP44Path("m/44'/637'/0h/0/0")).toBe(false);
      // No number
      expect(isValidBIP44Path("m/44'/637'/a/0/0")).toBe(false);
      // Invalid chain code
      expect(isValidBIP44Path("m/44'/638'/0/0/0")).toBe(false);
      // Not enough pieces
      expect(isValidBIP44Path("m/44'/637'/")).toBe(false);
      expect(isValidBIP44Path("m/44'/637'/0")).toBe(false);
      expect(isValidBIP44Path("m/44'/637'/0/0")).toBe(false);
      // Extra slash
      expect(isValidBIP44Path("m/44'/637'/0/0/0/")).toBe(false);
    });
  });

  // testing against https://github.com/satoshilabs/slips/blob/master/slip-0010.md#test-vector-1-for-ed25519
  describe("Ed25519", () => {
    const ed25519 = [
      {
        seed: Hex.fromHexInput("000102030405060708090a0b0c0d0e0f"),
        vectors: [
          {
            chain: "m",
            private: "2b4be7f19ee27bbf30c667b642d5f4aa69fd169872f8fc3059c08ebae2eb19e7",
            public: "00a4b2856bfec510abab89753fac1ac0e1112364e7d250545963f135f2a33188ed",
          },
          {
            chain: "m/0'",
            private: "68e0fe46dfb67e368c75379acec591dad19df3cde26e63b93a8e704f1dade7a3",
            public: "008c8a13df77a28f3445213a0f432fde644acaa215fc72dcdf300d5efaa85d350c",
          },
          {
            chain: "m/0'/1'",
            private: "b1d0bad404bf35da785a64ca1ac54b2617211d2777696fbffaf208f746ae84f2",
            public: "001932a5270f335bed617d5b935c80aedb1a35bd9fc1e31acafd5372c30f5c1187",
          },
          {
            chain: "m/0'/1'/2'",
            private: "92a5b23c0b8a99e37d07df3fb9966917f5d06e02ddbd909c7e184371463e9fc9",
            public: "00ae98736566d30ed0e9d2f4486a64bc95740d89c7db33f52121f8ea8f76ff0fc1",
          },
          {
            chain: "m/0'/1'/2'/2'",
            private: "30d1dc7e5fc04c31219ab25a27ae00b50f6fd66622f6e9c913253d6511d1e662",
            public: "008abae2d66361c879b900d204ad2cc4984fa2aa344dd7ddc46007329ac76c429c",
          },
          {
            chain: "m/0'/1'/2'/2'/1000000000'",
            private: "8f94d394a8e8fd6b1bc2f3f49f5c47e385281d5c17e65324b0f62483e37e8793",
            public: "003c24da049451555d51a7014a37337aa4e12d41e485abccfa46b47dfb2af54b7a",
          },
        ],
      },
    ];

    ed25519.forEach(({ seed, vectors }) => {
      vectors.forEach(({ chain, private: privateKey }) => {
        it(`should generate correct key pair for ${chain}`, () => {
          // eslint-disable-next-line @typescript-eslint/dot-notation
          const key = Ed25519PrivateKey["fromDerivationPathInner"](chain, seed.toUint8Array());
          expect(key.toHexString()).toBe(`0x${privateKey}`);
        });
      });
    });
  });

  // testing against https://github.com/satoshilabs/slips/blob/master/slip-0010.md#test-vector-1-for-secp256k1
  describe("secp256k1", () => {
    const secp256k1 = [
      {
        seed: Hex.fromHexInput("000102030405060708090a0b0c0d0e0f"),
        vectors: [
          {
            chain: "m",
            private: "e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35",
            public: "0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2",
          },
          {
            chain: "m/0'",
            private: "edb2e14f9ee77d26dd93b4ecede8d16ed408ce149b6cd80b0715a2d911a0afea",
            public: "035a784662a4a20a65bf6aab9ae98a6c068a81c52e4b032c0fb5400c706cfccc56",
          },
          {
            chain: "m/0'/1",
            private: "3c6cb8d0f6a264c91ea8b5030fadaa8e538b020f0a387421a12de9319dc93368",
            public: "03501e454bf00751f24b1b489aa925215d66af2234e3891c3b21a52bedb3cd711c",
          },
          {
            chain: "m/0'/1/2'",
            private: "cbce0d719ecf7431d88e6a89fa1483e02e35092af60c042b1df2ff59fa424dca",
            public: "0357bfe1e341d01c69fe5654309956cbea516822fba8a601743a012a7896ee8dc2",
          },
          {
            chain: "m/0'/1/2'/2",
            private: "0f479245fb19a38a1954c5c7c0ebab2f9bdfd96a17563ef28a6a4b1a2a764ef4",
            public: "02e8445082a72f29b75ca48748a914df60622a609cacfce8ed0e35804560741d29",
          },
          {
            chain: "m/0'/1/2'/2/1000000000",
            private: "471b76e389e528d6de6d816857e012c5455051cad6660850e58372a6c3e6e7c8",
            public: "022a471424da5e657499d1ff51cb43c47481a03b1e77f951fe64cec9f5a48f7011",
          },
        ],
      },
    ];

    secp256k1.forEach(({ seed, vectors }) => {
      vectors.forEach(({ chain, private: privateKey }) => {
        it(`should generate correct key pair for ${chain}`, () => {
          // eslint-disable-next-line @typescript-eslint/dot-notation
          const key = Secp256k1PrivateKey["fromDerivationPathInner"](chain, seed.toUint8Array());
          expect(key.toHexString()).toBe(`0x${privateKey}`);
        });
      });
    });
  });
});
