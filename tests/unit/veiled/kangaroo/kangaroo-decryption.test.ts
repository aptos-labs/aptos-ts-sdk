import { bytesToNumberLE } from "@noble/curves/abstract/utils";
import { KangarooRistretto, TwistedEd25519PrivateKey, TwistedElGamal } from "../../../../src";
import { loadTableMap } from "../helpers";
import { preloadTables } from "./wasmPollardKangaroo";
import { longTestTimeout } from "../../helper";

function generateRandomInteger(bits: number): bigint {
  // eslint-disable-next-line no-bitwise
  const max = (1n << BigInt(bits)) - 1n;
  const randomValue = BigInt(Math.floor(Math.random() * (Number(max) + 1)));

  return randomValue;
}

const execution = async (
  bitsAmount: 16 | 32 | 48,
  length = 50,
): Promise<{ randBalances: bigint[]; results: { result: bigint; elapsedTime: number }[] }> => {
  const randBalances = Array.from({ length }, () => generateRandomInteger(bitsAmount));

  const decryptedAmounts: { result: bigint; elapsedTime: number }[] = [];

  for (const balance of randBalances) {
    const newAlice = TwistedEd25519PrivateKey.generate();

    const encryptedBalance = TwistedElGamal.encryptWithPK(balance, newAlice.publicKey());

    const startMainTime = performance.now();
    const decryptedBalance = await TwistedElGamal.decryptWithPK(encryptedBalance, newAlice);
    const endMainTime = performance.now();

    const elapsedMainTime = endMainTime - startMainTime;

    decryptedAmounts.push({ result: decryptedBalance, elapsedTime: elapsedMainTime });
  }

  const averageTime = decryptedAmounts.reduce((acc, { elapsedTime }) => acc + elapsedTime, 0) / decryptedAmounts.length;

  const lowestTime = decryptedAmounts.reduce((acc, { elapsedTime }) => Math.min(acc, elapsedTime), Infinity);
  const highestTime = decryptedAmounts.reduce((acc, { elapsedTime }) => Math.max(acc, elapsedTime), 0);

  console.log(
    `Pollard kangaroo(table ${bitsAmount}):\n`,
    `Average time: ${averageTime} ms\n`,
    `Lowest time: ${lowestTime} ms\n`,
    `Highest time: ${highestTime} ms`,
  );

  return {
    randBalances,
    results: decryptedAmounts,
  };
};

describe("decrypt amount", () => {
  it(
    "Pre load wasm table map",
    async () => {
      await preloadTables();
    },
    longTestTimeout,
  );

  it("kangarooWasmAll(16): Should decrypt 50 rand numbers", async () => {
    console.log("WASM:");

    const { randBalances, results } = await execution(16);

    results.forEach(({ result }, i) => {
      expect(result).toEqual(randBalances[i]);
    });
  });

  it("kangarooWasmAll(32): Should decrypt 50 rand numbers", async () => {
    console.log("WASM:");

    const { randBalances, results } = await execution(32);

    results.forEach(({ result }, i) => {
      expect(result).toEqual(randBalances[i]);
    });
  });

  it("kangarooWasmAll(48): Should decrypt 50 rand numbers", async () => {
    console.log("WASM:");

    const { randBalances, results } = await execution(48);

    results.forEach(({ result }, i) => {
      expect(result).toEqual(randBalances[i]);
    });
  });

  it.skip("Pre load js table map", async () => {
    const [table16, table32, table48] = await Promise.all([
      loadTableMap(
        "https://raw.githubusercontent.com/distributed-lab/pollard-kangaroo-plus-testing/refs/heads/tables/output_8_8000_16_64.json",
      ),
      loadTableMap(
        "https://raw.githubusercontent.com/distributed-lab/pollard-kangaroo-plus-testing/refs/heads/tables/output_2048_4000_32_128.json",
      ),
      loadTableMap(
        "https://raw.githubusercontent.com/distributed-lab/pollard-kangaroo-plus-testing/refs/heads/tables/output_65536_40000_48_128.json",
      ),
    ]);

    KangarooRistretto.setTableWithParams({
      table: table16,
      n: 8_000,
      w: 8n,
      r: 64n,
      secretSize: 16,
    });
    KangarooRistretto.setTableWithParams({
      table: table32,
      n: 4_000,
      w: 2048n,
      r: 128n,
      secretSize: 32,
    });
    KangarooRistretto.setTableWithParams({
      table: table48,
      n: 40_000,
      w: 65536n,
      r: 128n,
      secretSize: 48,
    });

    TwistedElGamal.setDecryptionFn(async (pk) => KangarooRistretto.solveDLP(bytesToNumberLE(pk)));

    expect(Object.keys(KangarooRistretto.tablesMapWithParams).length).toEqual(3);
  });

  it.skip("KangarooJS16: Should decrypt 50 rand numbers", async () => {
    console.log("JS:");

    const { randBalances, results } = await execution(16);

    results.forEach(({ result }, i) => {
      expect(result).toEqual(randBalances[i]);
    });
  });

  it.skip("KangarooJS32: Should decrypt 50 rand numbers", async () => {
    console.log("JS:");

    const { randBalances, results } = await execution(32);

    results.forEach(({ result }, i) => {
      expect(result).toEqual(randBalances[i]);
    });
  });

  it.skip("KangarooJS48: Should decrypt 50 rand numbers", async () => {
    console.log("JS:");

    const { randBalances, results } = await execution(48);

    results.forEach(({ result }, i) => {
      expect(result).toEqual(randBalances[i]);
    });
  });
});
