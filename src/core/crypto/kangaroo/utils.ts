import { ed25519 } from "@noble/curves/ed25519";
import { ExtPointType } from "@noble/curves/abstract/edwards";
import { secp256k1 } from "@noble/curves/secp256k1";

export class Utils {
  static generateRandomInteger(bits: number): bigint {
    const max = (1n << BigInt(bits)) - 1n;
    const randomValue = BigInt(Math.floor(Math.random() * (Number(max) + 1)));

    return randomValue;
  }

  static generateRandomIntegerInRange(n: number): bigint {
    const randomValue = BigInt(Math.floor(Math.random() * n));

    return randomValue;
  }

  static uint8ArrayToBigInt(uint8Array: Uint8Array): bigint {
    let result = BigInt(0);
    for (let i = 0; i < uint8Array.length; i++) {
      result = (result << BigInt(8)) | BigInt(uint8Array[i]);
    }

    return result;
  }

  static padWithZerosBeginning(input: string, length: number): string {
    if (input.length >= length) {
      return input;
    }
    return "0".repeat(length - input.length) + input;
  }

  static isDistinguished(pubKey: bigint, w: bigint): boolean {
    return !(pubKey & (w - 1n));
  }

  static hash(pubKey: bigint, r: bigint): number {
    return Number(pubKey & (r - 1n));
  }

  static addPointsSecp256k1(point1: bigint, point2: bigint): bigint {
    const paddedPoint1 = Utils.padWithZerosBeginning(point1.toString(16), 66);
    const point1Projective = secp256k1.ProjectivePoint.fromHex(paddedPoint1);

    const paddedPoint2 = Utils.padWithZerosBeginning(point2.toString(16), 66);
    const point2Projective = secp256k1.ProjectivePoint.fromHex(paddedPoint2);

    return BigInt(`0x${point1Projective.add(point2Projective).toHex()}`);
  }

  static addPointsEd25519(point1: bigint, point2: bigint): bigint {
    const paddedPoint1 = point1.toString(16).padStart(64, "0");
    const point1Extended = ed25519.ExtendedPoint.fromHex(paddedPoint1);

    const paddedPoint2 = point2.toString(16).padStart(64, "0");
    const point2Extended = ed25519.ExtendedPoint.fromHex(paddedPoint2);

    return BigInt(`0x${point1Extended.add(point2Extended).toHex()}`);
  }

  static mulBasePointEd25519(scalar: bigint): bigint {
    return BigInt(`0x${ed25519.ExtendedPoint.BASE.multiply(scalar).toHex()}`);
  }

  // Function that returns a promise to wait for any worker to complete
  static waitForAnyWorker(workers: Worker[]): Promise<bigint> {
    const promises = workers.map(
      (worker) =>
        new Promise<bigint>((resolve) => {
          worker.onmessage = (event: MessageEvent) => {
            console.log("received new message");
            resolve(event.data);
          };
        }),
    );

    return Promise.race(promises);
  }

  // Function that terminates every worker
  static terminateWorkers(workers: Worker[]) {
    workers.forEach((worker) => {
      worker.terminate();
    });
  }

  static extendedPointToBigInt(point: ExtPointType): bigint {
    return BigInt(`0x${point.toHex()}`);
  }

  static add(point1: ExtPointType, point2: ExtPointType): ExtPointType {
    return point1.add(point2);
  }
}

export class WorkerData {
  secretSize: number;

  pubKey: ExtPointType;

  w: bigint;

  r: bigint;

  slog: bigint[];

  s: ExtPointType[];

  table: Map<bigint, bigint>;

  constructor(
    secretSize: number,
    pubKey: ExtPointType,
    w: bigint,
    r: bigint,
    slog: bigint[],
    s: ExtPointType[],
    table: Map<bigint, bigint>,
  ) {
    this.secretSize = secretSize;
    this.pubKey = pubKey;
    this.w = w;
    this.r = r;
    this.slog = slog;
    this.s = s;
    this.table = table;
  }
}
