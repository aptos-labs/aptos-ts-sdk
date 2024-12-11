import { bytesToNumberLE } from "@noble/curves/abstract/utils";
import { TwistedEd25519PrivateKey, TwistedElGamal } from "../../../src";
import { VeiledAmount } from "../../../src/core/crypto/veiled/veiledAmount";
import { KangarooRistretto } from "../../../src/core/crypto/kangaroo/kangarooRistretto";
import { TableMap } from "../../../src/core/crypto/kangaroo/tableMap";

function generateRandomInteger(bits: number): bigint {
  const max = (1n << BigInt(bits)) - 1n;
  const randomValue = BigInt(Math.floor(Math.random() * (Number(max) + 1)));

  return randomValue;
}

describe("decrypt amount", () => {
  const aliceDecryptionKey = TwistedEd25519PrivateKey.generate();

  console.log("dk", aliceDecryptionKey.toString());

  console.log("ek", aliceDecryptionKey.publicKey().toString());

  const n = 4_000;
  const w = 2048n;
  const r = 128n;
  const secretSize = 32;

  it("Pre load table map", async () => {
    const tableMapResponse = await fetch("http://localhost:5173/ristretto/output_2048_4000_32_128.json");

    if (!tableMapResponse.ok) {
      throw new Error("Failed to load table map");
    }

    const tableMapJson = await tableMapResponse.json();

    KangarooRistretto.setTable(TableMap.createFromJson(JSON.stringify(tableMapJson)));
    KangarooRistretto.setParams(n, w, r, secretSize);

    expect(KangarooRistretto.table).toBeDefined();
    expect(KangarooRistretto.n).toEqual(n);
    expect(KangarooRistretto.w).toEqual(w);
    expect(KangarooRistretto.r).toEqual(r);
    expect(KangarooRistretto.secretSize).toEqual(secretSize);
  });

  it("Kangaroo 140n", async () => {
    const ALICE_BALANCE = 140n;

    const aliceVB = VeiledAmount.fromAmount(ALICE_BALANCE);
    aliceVB.encrypt(aliceDecryptionKey.publicKey());

    const decryptedAmount = await VeiledAmount.fromEncrypted(aliceVB.amountEncrypted!, aliceDecryptionKey);

    expect(decryptedAmount.amount).toEqual(ALICE_BALANCE);
  });

  it("Kangaroo 2 ** 32", async () => {
    const ALICE_BALANCE = 2n ** 32n;

    const aliceVB = VeiledAmount.fromAmount(ALICE_BALANCE);
    aliceVB.encrypt(aliceDecryptionKey.publicKey());

    const decryptedAmount = await VeiledAmount.fromEncrypted(aliceVB.amountEncrypted!, aliceDecryptionKey);

    expect(decryptedAmount.amount).toEqual(ALICE_BALANCE);
  });

  it("Kangaroo for random numbers [0n, 2n**32n]", async () => {
    const randBalances = Array.from({ length: 50 }, () => generateRandomInteger(32));

    console.log(randBalances.toString());

    // const decryptedAmounts = await Promise.all(
    //   randBalances.map(async (balance) => {
    //     const newAlice = TwistedEd25519PrivateKey.generate();
    //
    //     const newAliceVB = VeiledAmount.fromAmount(balance);
    //     newAliceVB.encrypt(newAlice.publicKey());
    //
    //     const startMainTime = performance.now();
    //     const result = await VeiledAmount.fromEncrypted(newAliceVB.amountEncrypted!, newAlice);
    //     const endMainTime = performance.now();
    //
    //     const elapsedMainTime = endMainTime - startMainTime;
    //
    //     return { result, elapsedTime: elapsedMainTime };
    //   }),
    // );

    const decryptedAmounts: { result: VeiledAmount; elapsedTime: number }[] = [];

    for (const balance of randBalances) {
      const newAlice = TwistedEd25519PrivateKey.generate();

      const newAliceVB = VeiledAmount.fromAmount(balance);
      newAliceVB.encrypt(newAlice.publicKey());

      const startMainTime = performance.now();
      const result = await VeiledAmount.fromEncrypted(newAliceVB.amountEncrypted!, newAlice);
      const endMainTime = performance.now();

      const elapsedMainTime = endMainTime - startMainTime;

      decryptedAmounts.push({ result, elapsedTime: elapsedMainTime });
    }

    const averageTime =
      decryptedAmounts.reduce((acc, { elapsedTime }) => acc + elapsedTime, 0) / decryptedAmounts.length;

    const lowestTime = decryptedAmounts.reduce((acc, { elapsedTime }) => Math.min(acc, elapsedTime), Infinity);
    const highestTime = decryptedAmounts.reduce((acc, { elapsedTime }) => Math.max(acc, elapsedTime), 0);

    console.log(`Average time: ${averageTime} ms`);
    console.log(`Lowest time: ${lowestTime} ms`);
    console.log(`Highest time: ${highestTime} ms`);

    decryptedAmounts.forEach(({ result }, i) => {
      expect(result.amount).toEqual(randBalances[i]);
    });
  });

  it("Should decrypt 1 chunk", async () => {
    const ALICE_BALANCE = 2n ** 32n - 1n;

    const aliceVB = VeiledAmount.fromAmount(ALICE_BALANCE);
    aliceVB.encrypt(aliceDecryptionKey.publicKey());

    const decryptedChunk = await TwistedElGamal.decryptWithPK(aliceVB.amountEncrypted![0], aliceDecryptionKey);

    expect(decryptedChunk).toBeDefined();
  });
});
