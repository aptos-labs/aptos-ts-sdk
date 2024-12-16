import { RistrettoPoint } from "@noble/curves/ed25519";
import { bytesToNumberLE, numberToBytesLE } from "@noble/curves/abstract/utils";
import { bytesToHex } from "@noble/hashes/utils";
import { TableMap } from "./tableMap";
import { Utils } from "./utils";

export class KangarooRistretto {
  // static table: TableMap;

  static tablesMapWithParams: Record<
    number,
    {
      table: TableMap;
      n: number;
      w: bigint;
      l: bigint;
      r: bigint;
      secretSize: number;
    }
  > = {};

  static setTableWithParams(opts: { table: TableMap; n: number; w: bigint; r: bigint; secretSize: number }) {
    this.tablesMapWithParams[opts.secretSize] = {
      table: opts.table,
      n: opts.n,
      w: opts.w,
      l: BigInt(Math.ceil(Math.log2(opts.n))),
      r: opts.r,
      secretSize: opts.secretSize,
    };
  }

  static async solveDLP(pubKey: bigint): Promise<bigint> {
    if (!Object.entries(this.tablesMapWithParams).length) throw new TypeError("table & params is not set");

    const sortedTablesAndParams = Object.entries(this.tablesMapWithParams)
      .sort(([keyA], [keyB]) => Number(keyA) - Number(keyB))
      .map(([, value]) => value);

    for (const variant of sortedTablesAndParams) {
      const sanitizedHex = bytesToHex(numberToBytesLE(pubKey, 32));

      if (sanitizedHex === RistrettoPoint.ZERO.toHex()) return 0n;

      const pubKeyPoint = RistrettoPoint.fromHex(sanitizedHex);

      let attempts = 0;
      let foundedNumber: bigint | undefined;
      do {
        let wdist = Utils.generateRandomInteger(variant.secretSize - 8);

        if (wdist === 0n) {
          continue;
        }

        let w = pubKeyPoint.add(RistrettoPoint.BASE.multiply(wdist));
        let wBig = bytesToNumberLE(w.toRawBytes());

        for (let loop = 0; loop < 8n * variant.w; loop++) {
          if (Utils.isDistinguished(wBig, variant.w)) {
            const tableEntry = variant.table.get(wBig);

            if (tableEntry !== undefined) {
              wdist = tableEntry - wdist;

              if (bytesToNumberLE(RistrettoPoint.BASE.multiply(wdist).toRawBytes()) === pubKey) {
                return wdist;
              }
            }

            break;
          }

          const h = Utils.hash(wBig, variant.r);
          wdist += variant.table.slog[h];

          w = w.add(variant.table.s[h]);
          wBig = BigInt(`0x${w.toHex()}`);
        }

        attempts += 1;
      } while (foundedNumber === undefined && attempts < 100);
    }

    return 0n;
  }
}
