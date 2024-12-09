import { ExtPointType } from "@noble/curves/abstract/edwards";
import { ed25519 } from "@noble/curves/ed25519";
import * as fs from "fs";
import { bytesToHex } from "@noble/hashes/utils";

export class TableMap {
  s: ExtPointType[];

  slog: bigint[];

  table: Map<bigint, bigint>;

  constructor() {
    this.s = new Array<ExtPointType>();
    this.slog = new Array<bigint>();
    this.table = new Map<bigint, bigint>();
  }

  get(key: bigint): bigint | undefined {
    return this.table.get(key);
  }

  set(key: bigint, value: bigint) {
    this.table.set(key, value);
  }

  // Function to write data to a file
  writeToFile(path: string): boolean {
    try {
      console.log(new URL(path, import.meta.url));
      const outFile = fs.openSync(new URL(path, import.meta.url), "w");

      // Write the size of the map
      const mapSize = this.table.size;
      const sizeBuffer = Buffer.alloc(8);
      sizeBuffer.writeBigUInt64LE(BigInt(mapSize));
      fs.writeSync(outFile, sizeBuffer);

      // Write each entry in the map
      for (const [key, value] of this.table.entries()) {
        // Convert the hex string key to bytes
        const keyBytes = key.toString(16);
        const keySizeBuffer = Buffer.alloc(8);
        keySizeBuffer.writeBigUInt64LE(BigInt(keyBytes.length / 2));
        fs.writeSync(outFile, keySizeBuffer);
        fs.writeSync(outFile, Buffer.from(keyBytes));

        // Serialize the log as a string
        const logBuffer = value.toString(16);
        const logSizeBuffer = Buffer.alloc(8);
        logSizeBuffer.writeBigUInt64LE(BigInt(logBuffer.length / 2));
        fs.writeSync(outFile, logSizeBuffer);
        fs.writeSync(outFile, logBuffer);
      }

      fs.closeSync(outFile);
      return true;
    } catch (error) {
      console.error(`Error: Unable to open file for writing: ${path}`);
      return false;
    }
  }

  readFromBuffer(buffer: Buffer): boolean {
    try {
      // Clear the current map
      this.table.clear();

      let offset = 0;

      // Read the size of the map
      const mapSize = Number(buffer.readBigUInt64LE(offset));
      offset += 8;

      // Read each entry in the map
      for (let i = 0; i < mapSize; i++) {
        const keySize = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        const keyBytes = buffer.slice(offset, offset + keySize);
        const key = bytesToHex(new Uint8Array(keyBytes));
        offset += keySize;

        const logSize = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        const logBuffer = buffer.slice(offset, offset + logSize);
        const logStr = logBuffer.toString();
        offset += logSize;

        // Insert the read values into the map
        this.table.set(BigInt(`0x${key}`), BigInt(`0x${logStr}`));
      }

      return true;
    } catch (error) {
      console.error("Error: Unable to read data from buffer");
      return false;
    }
  }

  // Method to serialize the TableMap to JSON format
  writeJson(w: bigint, n: number, secretSize: number, r: bigint): string {
    return JSON.stringify({
      file_name: "output.json", // _${w.toString()}_${n}_${secretSize}_${r.toString(10)}
      s: this.s.map((value) => value.toHex()),
      slog: this.slog.map((value) => value.toString(16)),
      table: Array.from(this.table.entries()).map(([key, value]) => ({
        point: key.toString(16),
        value: value.toString(16),
      })),
    });
  }

  // Static method to create a TableMap from JSON data
  readJson(jsonString: string) {
    const parsedData = JSON.parse(jsonString);

    const s = parsedData.s.map((value: string) => ed25519.ExtendedPoint.fromHex(value));
    const slog = parsedData.slog.map((value: string) => BigInt(`0x${value}`));
    const table = new Map<bigint, bigint>(
      parsedData.table.map((entry: { point: string; value: string }) => [
        BigInt(`0x${entry.point}`),
        BigInt(`0x${entry.value}`),
      ]),
    );

    this.s = s;
    this.slog = slog;
    this.table = table;
  }
}
