import { TwistedEd25519PrivateKey, TwistedElGamal, VeiledAmount } from "../../../../src";
import { preloadTables, preloadTablesForBalances } from "./wasmPollardKangaroo";
import { longTestTimeout } from "../../helper";

function generateRandomInteger(bits: number): bigint {
  // eslint-disable-next-line no-bitwise
  const max = (1n << BigInt(bits)) - 1n;
  const randomValue = BigInt(Math.floor(Math.random() * (Number(max) + 1)));

  return randomValue;
}

const executionSimple = async (
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

const executionBalance = async (
  bitsAmount: 16 | 32 | 48,
  length = 50,
): Promise<{ randBalances: bigint[]; results: { result: bigint; elapsedTime: number }[] }> => {
  const randBalances = Array.from({ length }, () => generateRandomInteger(bitsAmount));

  const decryptedAmounts: { result: bigint; elapsedTime: number }[] = [];

  for (const balance of randBalances) {
    const newAlice = TwistedEd25519PrivateKey.generate();

    const veiledAmount = VeiledAmount.fromAmount(balance);
    veiledAmount.encrypt(newAlice.publicKey());

    const startMainTime = performance.now();
    const decryptedBalance = await VeiledAmount.fromEncrypted(veiledAmount.amountEncrypted!, newAlice);
    const endMainTime = performance.now();

    const elapsedMainTime = endMainTime - startMainTime;

    decryptedAmounts.push({ result: decryptedBalance.amount, elapsedTime: elapsedMainTime });
  }

  const averageTime = decryptedAmounts.reduce((acc, { elapsedTime }) => acc + elapsedTime, 0) / decryptedAmounts.length;

  const lowestTime = decryptedAmounts.reduce((acc, { elapsedTime }) => Math.min(acc, elapsedTime), Infinity);
  const highestTime = decryptedAmounts.reduce((acc, { elapsedTime }) => Math.max(acc, elapsedTime), 0);

  console.log(
    `Pollard kangaroo(balance: ${bitsAmount}):\n`,
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

    const { randBalances, results } = await executionSimple(16);

    results.forEach(({ result }, i) => {
      expect(result).toEqual(randBalances[i]);
    });
  });

  it("kangarooWasmAll(32): Should decrypt 50 rand numbers", async () => {
    console.log("WASM:");

    const { randBalances, results } = await executionSimple(32);

    results.forEach(({ result }, i) => {
      expect(result).toEqual(randBalances[i]);
    });
  });

  it("kangarooWasmAll(48): Should decrypt 50 rand numbers", async () => {
    console.log("WASM:");

    const { randBalances, results } = await executionSimple(48);

    results.forEach(({ result }, i) => {
      expect(result).toEqual(randBalances[i]);
    });
  });

  it(
    "Pre load wasm table map for balances",
    async () => {
      await preloadTablesForBalances();
    },
    longTestTimeout,
  );

  it("kangarooWasmAll(16): Should decrypt 50 rand numbers", async () => {
    const { randBalances, results } = await executionBalance(16);

    results.forEach(({ result }, i) => {
      expect(result).toEqual(randBalances[i]);
    });
  });

  it("kangarooWasmAll(32): Should decrypt 50 rand numbers", async () => {
    const { randBalances, results } = await executionBalance(32);

    results.forEach(({ result }, i) => {
      expect(result).toEqual(randBalances[i]);
    });
  });
});
