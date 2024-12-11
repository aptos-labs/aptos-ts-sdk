import { RistrettoPoint } from "@noble/curves/ed25519";

export class TableMap {
  s: bigint[];

  slog: bigint[];

  table: Map<bigint, bigint>;

  constructor(s: bigint[], slog: bigint[], table: Map<bigint, bigint>) {
    this.s = s;
    this.slog = slog;
    this.table = table;
  }

  get(key: bigint): bigint | undefined {
    return this.table.get(key);
  }

  set(key: bigint, value: bigint) {
    this.table.set(key, value);
  }

  // Static method to create a TableMap from JSON data
  static createFromJson(jsonString: string) {
    const parsedData = JSON.parse(jsonString);

    const s = parsedData.s.map((value: string) => RistrettoPoint.fromHex(value));
    const slog = parsedData.slog.map((value: string) => BigInt(`0x${value}`));
    const table = new Map<bigint, bigint>(
      parsedData.table.map((entry: { point: string; value: string }) => [
        BigInt(`0x${entry.point}`),
        BigInt(`0x${entry.value}`),
      ]),
    );

    return new TableMap(s, slog, table);
  }
}
