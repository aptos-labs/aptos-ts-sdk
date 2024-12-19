import { RistrettoPoint } from "@noble/curves/ed25519";

type RistPoint = InstanceType<typeof RistrettoPoint>;

export class ShanksRistretto {
  static m: bigint = 0n;

  static babyMap = new Map<string, bigint>();

  static setBabyMap(m: bigint, v: Map<string, bigint>) {
    this.m = m;
    this.babyMap = v;
  }

  static pregenBabyMap(secretSize: bigint) {
    const m = ShanksRistretto.bigintSqrtCeil(secretSize);
    this.m = m;

    let current = RistrettoPoint.ZERO;
    for (let i = 0n; i < m; i++) {
      const key = current.toHex();
      // Store i as the discrete log of current relative to A
      this.babyMap.set(key, i);
      current = current.add(RistrettoPoint.BASE);
    }
  }

  /**
   * Compute the ceiling of the square root of n.
   * This uses a numeric conversion for simplicity. For extremely large `n`,
   * a more robust method would be needed.
   */
  static bigintSqrtCeil(n: bigint): bigint {
    const x = BigInt(Math.floor(Math.sqrt(Number(n))));
    return x * x === n ? x : x + 1n;
  }

  /**
   * Baby-step Giant-step algorithm for Ristretto groups
   *
   * Given points A and B in a Ristretto group with known order n,
   * find x such that x*A = B.
   *
   * @param A Base point of the group (like a generator)
   * @param B Target point we want to express as x*A
   * @param n Order of the group (e.g. ed25519.CURVE.n for Ristretto)
   * @returns x if a solution is found, otherwise undefined
   */
  static babyStepGiantStepRistretto(B: RistPoint): bigint | undefined {
    if (!this.m || !this.babyMap.size) throw new TypeError("baby map is not generated");

    // Giant step factor: M*A
    const MA = RistrettoPoint.BASE.multiply(ShanksRistretto.m);

    // Giant steps: for j in [0, m-1], compute B - j*(M*A) and check if it matches a baby step
    let giant = B;
    for (let j = 0n; j < ShanksRistretto.m; j++) {
      const key = giant.toHex();
      if (ShanksRistretto.babyMap.has(key)) {
        const i = ShanksRistretto.babyMap.get(key)!;
        // x = i + j*m
        return i + j * ShanksRistretto.m;
      }
      giant = giant.subtract(MA);
    }

    // No solution found
    return undefined;
  }
}
