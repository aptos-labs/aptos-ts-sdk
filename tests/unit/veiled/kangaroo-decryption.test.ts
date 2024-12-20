import { TwistedEd25519PrivateKey, TwistedElGamal } from "../../../src";
import { VeiledAmount } from "../../../src/core/crypto/veiled/veiledAmount";
import { KangarooRistretto } from "../../../src/core/crypto/kangaroo/kangarooRistretto";
import { loadTableMap } from "./helpers";

function generateRandomInteger(bits: number): bigint {
  const max = (1n << BigInt(bits)) - 1n;
  const randomValue = BigInt(Math.floor(Math.random() * (Number(max) + 1)));

  return randomValue;
}

describe("decrypt amount", () => {
  const aliceDecryptionKey = TwistedEd25519PrivateKey.generate();

  it("Pre load table map", async () => {
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

    expect(Object.keys(KangarooRistretto.tablesMapWithParams).length).toEqual(3);
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

  it("Should decrypt 1 chunk", async () => {
    const ALICE_BALANCE = 2n ** 32n - 1n;

    const aliceVB = VeiledAmount.fromAmount(ALICE_BALANCE);
    aliceVB.encrypt(aliceDecryptionKey.publicKey());

    const decryptedChunk = await TwistedElGamal.decryptWithPK(aliceVB.amountEncrypted![0], aliceDecryptionKey);

    expect(decryptedChunk).toBeDefined();
  });

  it("Kangaroo for random numbers [0n, 2n**32n]", async () => {
    const randBalances = Array.from({ length: 50 }, () => generateRandomInteger(48));

    console.log(randBalances.toString());

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
});
