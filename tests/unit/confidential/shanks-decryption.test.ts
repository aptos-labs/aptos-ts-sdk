import { RistrettoPoint } from "@noble/curves/ed25519";
import { TwistedEd25519PrivateKey, TwistedElGamal } from "../../../src";
import { ShanksRistretto } from "../../../src/core/crypto/bsgs";

function generateRandomInteger(bits: number): bigint {
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
    `BSGS(table ${bitsAmount}):\n`,
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
  const secretSize = 2n ** 16n;

  it("Pre Generate babyMap", async () => {
    ShanksRistretto.pregenBabyMap(secretSize);

    expect(ShanksRistretto.m).toBeDefined();
    expect(ShanksRistretto.babyMap.size).toBeGreaterThan(0);
  });

  it("Shanks for random numbers [0n, 2n**16n]", async () => {
    TwistedElGamal.setDecryptionFn(
      async (pk) => ShanksRistretto.babyStepGiantStepRistretto(RistrettoPoint.fromHex(pk))!,
    );

    const { randBalances, results } = await execution(16);

    results.forEach(({ result }, i) => {
      expect(result).toEqual(randBalances[i]);
    });
  });
});
