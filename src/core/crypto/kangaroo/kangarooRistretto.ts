import { RistrettoPoint } from "@noble/curves/ed25519";
import { bytesToNumberLE, numberToBytesLE } from "@noble/curves/abstract/utils";
import { bytesToHex } from "@noble/hashes/utils";
import { TableMap } from "./tableMap";
import { Utils } from "./utils";

export class KangarooRistretto {
  static n: number;

  static w: bigint;

  static l: bigint;

  static r: bigint;

  static secretSize: number;

  static table: TableMap;

  static setTable(table: TableMap) {
    this.table = table;
  }

  static setParams(n: number, w: bigint, r: bigint, secretSize: number) {
    this.n = n;
    this.w = w;
    this.l = BigInt(Math.ceil(Math.log2(n)));
    this.r = r;
    this.secretSize = secretSize;
  }

  static async solveDLP(pubKey: bigint): Promise<bigint> {
    if (!this.table) throw new TypeError("table is not set");

    if (!this.n || !this.w || !this.r || !this.secretSize) throw new TypeError("parameters are not set");

    const sanitizedHex = bytesToHex(numberToBytesLE(pubKey, this.secretSize));

    if (sanitizedHex === RistrettoPoint.ZERO.toHex()) return 0n;

    const pubKeyPoint = RistrettoPoint.fromHex(sanitizedHex);

    while (true) {
      let wdist = Utils.generateRandomInteger(this.secretSize - 8);

      let w = pubKeyPoint.add(RistrettoPoint.BASE.multiply(wdist));
      let wBig = bytesToNumberLE(w.toRawBytes()); // BigInt(`0x${w.toHex()}`);

      for (let loop = 0; loop < 8n * this.w; loop++) {
        if (Utils.isDistinguished(wBig, this.w)) {
          const tableEntry = this.table.get(wBig);

          if (tableEntry !== undefined) {
            wdist = tableEntry - wdist;

            if (bytesToNumberLE(RistrettoPoint.BASE.multiply(wdist).toRawBytes()) === pubKey) {
              return wdist;
            }
          }

          break;
        }

        const h = Utils.hash(wBig, this.r);
        wdist += this.table.slog[h];

        w = w.add(RistrettoPoint.fromHex(this.table.s[h].toString(16)));
        wBig = BigInt(`0x${w.toString()}`);
      }
    }
  }
}
