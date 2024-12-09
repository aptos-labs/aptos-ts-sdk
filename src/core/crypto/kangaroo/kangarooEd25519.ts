import { ed25519 } from "@noble/curves/ed25519";
import { TableMap } from "./tableMap";
import { Utils, WorkerData } from "./utils";

export class KangarooEd25519 {
  n: number;

  w: bigint;

  l: bigint;

  // g: bigint;

  r: bigint;

  secretSize: number;

  public table: TableMap;

  constructor(n: number, w: bigint, r: bigint, secretSize: number) {
    this.n = n;
    this.w = w;
    this.secretSize = secretSize;
    this.l = BigInt(2 ** secretSize);
    this.r = r;

    this.table = new TableMap();

    this.initS();
  }

  static generateRandomInteger(bits: number): bigint {
    const max = (1n << BigInt(bits)) - 1n;
    const randomValue = BigInt(Math.floor(Math.random() * (Number(max) + 1)));

    return randomValue;
  }

  static generateRandomIntegerInRange(n: number): bigint {
    const randomValue = BigInt(Math.floor(Math.random() * n));

    return randomValue;
  }

  static mulBasePoint(scalar: bigint): bigint {
    return BigInt(`0x${ed25519.ExtendedPoint.BASE.multiply(scalar).toHex()}`);
  }

  initS() {
    for (let i = 0; i < this.r; i++) {
      const sValue = KangarooEd25519.generateRandomIntegerInRange(
        Number(KangarooEd25519.generateRandomInteger(this.secretSize - 2) / this.w),
      );

      // TODO: there might be a case when sValue is 0
      this.table.slog[i] = sValue;
      this.table.s[i] = ed25519.ExtendedPoint.fromHex(
        KangarooEd25519.mulBasePoint(sValue).toString(16).padStart(64, "0"),
      );
    }
  }

  async solveDLP(pubKey: bigint, numberOfThreads: number = navigator.hardwareConcurrency || 1): Promise<bigint> {
    const pubKeyPoint = ed25519.ExtendedPoint.fromHex(pubKey.toString(16).padStart(64, "0"));
    const workerData = new WorkerData(
      this.secretSize,
      pubKeyPoint,
      this.w,
      this.r,
      this.table.slog,
      this.table.s,
      this.table.table,
    );

    const workers: Worker[] = [];
    for (let i = 0; i < numberOfThreads; i++) {
      const worker = new Worker(new URL("./worker.ts", import.meta.url));
      workers.push(worker);
      worker.postMessage(workerData);
    }

    const result = await Utils.waitForAnyWorker(workers);
    Utils.terminateWorkers(workers);

    return result;
  }

  async solveDLPTest(pubKey: bigint): Promise<bigint> {
    // TODO: change solveDLPTest argument to ExtendedPoint
    const pubKeyPoint = ed25519.ExtendedPoint.fromHex(pubKey.toString(16).padStart(64, "0"));

    while (true) {
      let wdist = Utils.generateRandomInteger(this.secretSize - 8);

      let w = pubKeyPoint.add(ed25519.ExtendedPoint.BASE.multiply(wdist));
      let wBig = Utils.extendedPointToBigInt(w);

      for (let loop = 0; loop < 8n * this.w; loop++) {
        if (Utils.isDistinguished(wBig, this.w)) {
          const tableEntry = this.table.get(wBig);

          if (tableEntry !== undefined) {
            wdist = tableEntry - wdist;

            if (Utils.mulBasePointEd25519(wdist) === pubKey) {
              postMessage(wdist);
              return wdist;
            }
          }

          break;
        }

        const h = Utils.hash(wBig, this.r);
        wdist += this.table.slog[h];

        w = w.add(this.table.s[h]);
        wBig = Utils.extendedPointToBigInt(w);
      }
    }
  }

  async writeJsonToServer() {
    const tableJSON = this.table.writeJson(this.w, this.n, this.secretSize, this.r);

    await fetch("http://localhost:3001/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: tableJSON,
    });
  }

  async readJsonFromServer(): Promise<boolean> {
    const response = await fetch(
      `http://localhost:3001/table?file_name=output_${this.w.toString()}_${this.n}_${this.secretSize}_${this.r}.json`,
    );

    if (!response.ok) {
      return false;
    }

    this.table.readJson(JSON.stringify(await response.json()));
    return true;
  }
}
