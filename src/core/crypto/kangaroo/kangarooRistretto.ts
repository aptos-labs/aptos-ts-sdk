import { RistrettoPoint } from "@noble/curves/ed25519";
import { bytesToNumberLE, numberToBytesLE } from "@noble/curves/abstract/utils";
import { bytesToHex } from "@noble/hashes/utils";
import { TableMap } from "./tableMap";
import { Utils } from "./utils";

/**
 * Class implementing the Pollard's Kangaroo method for solving the discrete logarithm problem (DLP)
 * on the Ristretto curve. This method is particularly effective for finding discrete logarithms
 * within a known interval.
 *
 * The implementation is inspired by the work of Daniel J. Bernstein and Tanja Lange in
 * "Computing small discrete logarithms faster" (2012), which discusses methods to accelerate
 * the computation of discrete logarithms in small intervals using precomputed tables.
 * [Source](https://cr.yp.to/dlog/cuberoot-20120919.pdf)
 */
export class KangarooRistretto {
  // Static map to store precomputed tables and parameters for different secret sizes.
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

  /**
   * Sets the precomputed table and associated parameters for a given secret size.
   * These tables are used to accelerate the discrete logarithm computation.
   *
   * @param opts - An object containing the table, n, w, r, and secretSize.
   */
  static setTableWithParams(opts: { table: TableMap; n: number; w: bigint; r: bigint; secretSize: number }) {
    this.tablesMapWithParams[opts.secretSize] = {
      table: opts.table,
      n: opts.n,
      w: opts.w,
      l: BigInt(Math.ceil(Math.log2(opts.n))), // l is the ceiling of log2(n)
      r: opts.r,
      secretSize: opts.secretSize,
    };
  }

  /**
   * Solves the discrete logarithm problem for a given public key on the Ristretto curve.
   * Utilizes the precomputed tables and parameters to expedite the computation.
   *
   * @param pubKey - The public key as a bigint for which the discrete logarithm is sought.
   * @returns The discrete logarithm as a bigint.
   * @throws If the precomputed tables and parameters are not set.
   */
  static async solveDLP(pubKey: bigint): Promise<bigint> {
    // Ensure that precomputed tables and parameters are available.
    if (!Object.entries(this.tablesMapWithParams).length) throw new TypeError("table & params is not set");

    // Sort the tables and parameters by secret size in ascending order.
    const sortedTablesAndParams = Object.entries(this.tablesMapWithParams)
      .sort(([keyA], [keyB]) => Number(keyA) - Number(keyB))
      .map(([, value]) => value);

    // Iterate over each set of parameters to attempt solving the DLP.
    for (const variant of sortedTablesAndParams) {
      const sanitizedHex = bytesToHex(numberToBytesLE(pubKey, 32));

      // Check if the public key is the identity element.
      if (sanitizedHex === RistrettoPoint.ZERO.toHex()) return 0n;

      const pubKeyPoint = RistrettoPoint.fromHex(sanitizedHex);

      let attempts = 0;
      let foundNumber: bigint | undefined;
      do {
        // Generate a random initial distance within the secret size minus 8 bits.
        let wdist = Utils.generateRandomInteger(variant.secretSize - 8);

        // Skip if the distance is zero.
        if (wdist === 0n) {
          continue;
        }

        // Compute the initial point w.
        let w = pubKeyPoint.add(RistrettoPoint.BASE.multiply(wdist));
        let wBig = bytesToNumberLE(w.toRawBytes());

        // Perform a bounded number of iterations to find a distinguished point.
        for (let loop = 0; loop < 8n * variant.w; loop++) {
          // Check if the current point is distinguished.
          if (Utils.isDistinguished(wBig, variant.w)) {
            // Look up the current point in the precomputed table.
            const tableEntry = variant.table.get(wBig);

            if (tableEntry !== undefined) {
              // Compute the candidate discrete logarithm.
              wdist = tableEntry - wdist;

              // Verify the candidate by recomputing the public key.
              if (bytesToNumberLE(RistrettoPoint.BASE.multiply(wdist).toRawBytes()) === pubKey) {
                return wdist;
              }
            }

            // Exit the loop if a distinguished point is found, regardless of table lookup success.
            break;
          }

          // Compute the next step in the random walk.
          const h = Utils.hash(wBig, variant.r);
          wdist += variant.table.slog[h];

          w = w.add(variant.table.s[h]);
          wBig = BigInt(`0x${w.toHex()}`);
        }

        attempts += 1;
      } while (foundNumber === undefined && attempts < 100);
    }

    // Return 0 if the discrete logarithm is not found after all attempts.
    return 0n;
  }
}
