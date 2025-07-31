// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { ed25519, RistrettoPoint } from "@noble/curves/ed25519";
import { bytesToNumberLE } from "@noble/curves/abstract/utils";
import { H_RISTRETTO, RistPoint, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "./twistedEd25519";
import { ed25519GenRandom, ed25519modN } from "../utils";
import { HexInput } from "@aptos-labs/ts-sdk";
import { create_kangaroo, WASMKangaroo } from "@aptos-labs/confidential-asset-wasm-bindings/pollard-kangaroo";
import initWasm from "@aptos-labs/confidential-asset-wasm-bindings/pollard-kangaroo";

const POLLARD_KANGAROO_WASM_URL =
  "https://unpkg.com/@aptos-labs/confidential-asset-wasm-bindings@0.0.2/pollard-kangaroo/aptos_pollard_kangaroo_wasm_bg.wasm";

export async function createKangaroo(secret_size: number) {
  await initWasm({ module_or_path: POLLARD_KANGAROO_WASM_URL });

  return create_kangaroo(secret_size);
}

class AsyncLock {
  private locks: Map<string, Promise<void>> = new Map();

  async acquire<T>(key: string, fn: () => Promise<T>): Promise<T> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let resolve: () => void;
    const promise = new Promise<void>((r) => (resolve = r));
    this.locks.set(key, promise);

    try {
      const result = await fn();
      return result;
    } finally {
      this.locks.delete(key);
      resolve!();
    }
  }
}

export interface DecryptionRange {
  start?: bigint;
  end?: bigint;
}

export type ModifyCiphertextOperation = "add" | "subtract";

/**
 * Twisted ElGamal encryption/decryption
 * @see {@link https://drive.google.com/file/d/1wGo-pIOPOcCQA0gjngE5kmWUQ-TxktAF/view | Veiled coins with twisted ElGamal}
 */
export class TwistedElGamal {
  /**
   * The private key of an Twisted ElGamal Ed25519 key pair.
   */
  private readonly privateKey: TwistedEd25519PrivateKey;

  /**
   * Create a new TwistedElGamal instance from private key.
   *
   * @param privateKey TwistedEd25519PrivateKey or HexInput (string or Uint8Array)
   */
  constructor(privateKey: TwistedEd25519PrivateKey | HexInput) {
    this.privateKey =
      privateKey instanceof TwistedEd25519PrivateKey ? privateKey : new TwistedEd25519PrivateKey(privateKey);
  }

  /**
   * Encrypts the amount with Twisted ElGamal
   *
   * @param amount amount for encryption
   * @param random random 32 bytes
   */
  public encrypt(amount: bigint, random?: bigint): TwistedElGamalCiphertext {
    return TwistedElGamal.encryptWithPK(amount, this.privateKey.publicKey(), random);
  }

  /**
   * Decrypts the amount with Twisted ElGamal
   *
   * @param ciphertext сiphertext points encrypted by Twisted ElGamal
   */
  public async decrypt(ciphertext: TwistedElGamalCiphertext): Promise<bigint> {
    return TwistedElGamal.decryptWithPK(ciphertext, this.privateKey);
  }

  /**
   * Encrypts the amount with Twisted ElGamal
   *
   * @param amount amount for encryption
   * @param publicKey Twisted ElGamal Ed25519 public key.
   * @param random Random number less than ed25519.CURVE.n (bigint)
   */
  static encryptWithPK(amount: bigint, publicKey: TwistedEd25519PublicKey, random?: bigint) {
    if (amount < 0n && amount > ed25519.CURVE.n)
      throw new Error(`The amount must be in the range 0n to ${ed25519.CURVE.n - 1n}`);

    if (random !== undefined && random < 0n && random > ed25519.CURVE.n)
      throw new Error(`The random must be in the range 0n to ${ed25519.CURVE.n - 1n}`);

    const m = amount;
    const r = random ?? ed25519GenRandom();
    const rH = H_RISTRETTO.multiply(r);
    const mG = m === BigInt(0) ? RistrettoPoint.ZERO : RistrettoPoint.BASE.multiply(m);

    const D = RistrettoPoint.fromHex(publicKey.toUint8Array()).multiply(r);
    const C = mG.add(rH);

    return new TwistedElGamalCiphertext(C.toRawBytes(), D.toRawBytes());
  }

  /**
   * Encrypts the amount with Twisted ElGamal with no randomness
   *
   * @param amount amount for encryption
   */
  static encryptWithNoRandomness(amount: bigint) {
    if (amount < 0n && amount > ed25519.CURVE.n)
      throw new Error(`The amount must be in the range 0n to ${ed25519.CURVE.n - 1n}`);

    const C = amount === BigInt(0) ? RistrettoPoint.ZERO : RistrettoPoint.BASE.multiply(amount);

    return new TwistedElGamalCiphertext(C.toRawBytes(), RistrettoPoint.ZERO.toRawBytes());
  }

  static tablePreloadPromise: Promise<void> | undefined;
  static tablesPreloaded = false;
  private static initializationLock = new AsyncLock();

  static kangaroo16: WASMKangaroo;
  static kangaroo32: WASMKangaroo;
  static kangaroo48: WASMKangaroo;

  static decryptionFn: ((pk: Uint8Array) => Promise<bigint>) | undefined;

  static async initializeKangaroos() {
    return this.initializationLock.acquire("kangaroo-init", async () => {
      try {
        if (TwistedElGamal.tablesPreloaded && TwistedElGamal.decryptionFn !== undefined) {
          return;
        }

        if (!TwistedElGamal.tablePreloadPromise) {
          const createKangaroos = async () => {
            try {
              TwistedElGamal.kangaroo16 = await createKangaroo(16);
              TwistedElGamal.kangaroo32 = await createKangaroo(32);
              TwistedElGamal.kangaroo48 = await createKangaroo(48);
            } catch (error) {
              // Reset state on failure
              TwistedElGamal.tablePreloadPromise = undefined;
              TwistedElGamal.tablesPreloaded = false;
              throw error;
            }
          };
          TwistedElGamal.tablePreloadPromise = createKangaroos();
        }

        await TwistedElGamal.tablePreloadPromise;

        if (!TwistedElGamal.decryptionFn) {
          TwistedElGamal.setDecryptionFn(async (pk) => {
            if (bytesToNumberLE(pk) === 0n) return 0n;
            try {
              let result = TwistedElGamal.kangaroo16.solve_dlp(pk, 30n);
              if (!result) {
                result = TwistedElGamal.kangaroo32.solve_dlp(pk, 120n);
              }
              if (!result) {
                // Exponential backoff
                const maxRetries = 3;
                const baseTimeout = 2000n;

                for (let attempt = 0; attempt < maxRetries; attempt++) {
                  const timeout = baseTimeout * 2n ** BigInt(attempt); // 2000, 4000, 8000
                  result = TwistedElGamal.kangaroo48.solve_dlp(pk, timeout);
                  if (result) return result;

                  if (attempt < maxRetries - 1) {
                    console.warn(`decryption attempt ${attempt + 1} failed, retrying with timeout ${timeout}...`);
                  }
                }
              }
              if (!result) throw new TypeError("Decryption failed. Timed out.");
              return result;
            } catch (e) {
              console.error("Decryption failed:", e);
              throw e;
            }
          });
        }

        TwistedElGamal.tablesPreloaded = true;
      } catch (error) {
        // Reset state on any initialization failure
        TwistedElGamal.tablePreloadPromise = undefined;
        TwistedElGamal.tablesPreloaded = false;
        TwistedElGamal.decryptionFn = undefined;
        throw error;
      }
    });
  }

  static setDecryptionFn(fn: (pk: Uint8Array) => Promise<bigint>) {
    this.decryptionFn = fn;
  }

  static calculateCiphertextMG(ciphertext: TwistedElGamalCiphertext, privateKey: TwistedEd25519PrivateKey): RistPoint {
    const { C, D } = ciphertext;
    const modS = ed25519modN(bytesToNumberLE(privateKey.toUint8Array()));
    const sD = RistrettoPoint.fromHex(D.toRawBytes()).multiply(modS);
    const mG = RistrettoPoint.fromHex(C.toRawBytes()).subtract(sD);

    return mG;
  }

  /**
   * Decrypts the amount with Twisted ElGamal
   * @param ciphertext сiphertext points encrypted by Twisted ElGamal
   * @param privateKey Twisted ElGamal Ed25519 private key.
   * @param decryptionRange The range of amounts to be used in decryption
   */
  static async decryptWithPK(
    ciphertext: TwistedElGamalCiphertext,
    privateKey: TwistedEd25519PrivateKey,
  ): Promise<bigint> {
    await TwistedElGamal.ensureInitialized();
    const mG = TwistedElGamal.calculateCiphertextMG(ciphertext, privateKey);

    return TwistedElGamal.decryptionFn!(mG.toRawBytes());
  }

  /**
   * Modify ciphertext by amount
   * @param ciphertext Сiphertext points encrypted by Twisted ElGamal
   * @param operation Operation to change ciphertext points
   * @param amount Natural number or 0
   */
  static modifyCiphertextByAmount(
    ciphertext: TwistedElGamalCiphertext,
    operation: ModifyCiphertextOperation,
    amount: bigint,
  ): TwistedElGamalCiphertext {
    switch (operation) {
      case "add":
        return ciphertext.addAmount(amount);
      case "subtract":
        return ciphertext.subtractAmount(amount);
      default:
        throw new Error("Unsupported operation");
    }
  }

  /**
   * Modify ciphertext by ciphertext
   * @param operand1 Сiphertext points encrypted by Twisted ElGamal
   * @param operation Operation to change ciphertext points
   * @param operand2 Сiphertext points encrypted by Twisted ElGamal
   */
  static modifyCiphertextByCiphertext(
    operand1: TwistedElGamalCiphertext,
    operation: ModifyCiphertextOperation,
    operand2: TwistedElGamalCiphertext,
  ): TwistedElGamalCiphertext {
    switch (operation) {
      case "add":
        return operand1.addCiphertext(operand2);
      case "subtract":
        return operand1.subtractCiphertext(operand2);
      default:
        throw new Error("Unsupported operation");
    }
  }

  static async cleanup() {
    return this.initializationLock.acquire("kangaroo-cleanup", async () => {
      try {
        if (TwistedElGamal.kangaroo16) TwistedElGamal.kangaroo16.free();
        if (TwistedElGamal.kangaroo32) TwistedElGamal.kangaroo32.free();
        if (TwistedElGamal.kangaroo48) TwistedElGamal.kangaroo48.free();
      } finally {
        TwistedElGamal.tablePreloadPromise = undefined;
        TwistedElGamal.tablesPreloaded = false;
        TwistedElGamal.decryptionFn = undefined;
      }
    });
  }

  static isInitialized(): boolean {
    return (
      TwistedElGamal.tablesPreloaded &&
      TwistedElGamal.decryptionFn !== undefined &&
      TwistedElGamal.kangaroo16 !== undefined &&
      TwistedElGamal.kangaroo32 !== undefined &&
      TwistedElGamal.kangaroo48 !== undefined
    );
  }

  private static async ensureInitialized() {
    if (!this.isInitialized()) {
      await this.initializeKangaroos();
    }
  }
}

/**
 * Points of ciphertext encrypted by Twisted ElGamal
 */
export class TwistedElGamalCiphertext {
  readonly C: RistPoint;

  readonly D: RistPoint;

  constructor(C: HexInput, D: HexInput) {
    this.C = RistrettoPoint.fromHex(C);
    this.D = RistrettoPoint.fromHex(D);
  }

  public addAmount(amount: bigint): TwistedElGamalCiphertext {
    const aG = RistrettoPoint.BASE.multiply(amount);
    const updatedC = this.C.add(aG);

    return new TwistedElGamalCiphertext(updatedC.toRawBytes(), this.D.toRawBytes());
  }

  public subtractAmount(amount: bigint): TwistedElGamalCiphertext {
    const aG = RistrettoPoint.BASE.multiply(amount);
    const updatedC = this.C.subtract(aG);

    return new TwistedElGamalCiphertext(updatedC.toRawBytes(), this.D.toRawBytes());
  }

  public addCiphertext(ciphertext: TwistedElGamalCiphertext): TwistedElGamalCiphertext {
    const updatedC = this.C.add(ciphertext.C);
    const updatedD = this.D.add(ciphertext.D);

    return new TwistedElGamalCiphertext(updatedC.toRawBytes(), updatedD.toRawBytes());
  }

  public subtractCiphertext(ciphertext: TwistedElGamalCiphertext): TwistedElGamalCiphertext {
    const updatedC = this.C.subtract(ciphertext.C);
    const updatedD = this.D.subtract(ciphertext.D);

    return new TwistedElGamalCiphertext(updatedC.toRawBytes(), updatedD.toRawBytes());
  }

  public serialize(): Uint8Array {
    return new Uint8Array([...this.C.toRawBytes(), ...this.D.toRawBytes()]);
  }
}
