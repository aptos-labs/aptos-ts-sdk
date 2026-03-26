// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { ed25519, RistrettoPoint } from "@noble/curves/ed25519";
import { bytesToNumberLE } from "@noble/curves/abstract/utils";
import { H_RISTRETTO, RistPoint, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "./twistedEd25519";
import { ed25519GenRandom, ed25519modN } from "../utils";
import { HexInput } from "@aptos-labs/ts-sdk";
import { DiscreteLogSolver, ensureWasmInitialized, initializeWasm, isWasmInitialized } from "./wasmLoader";

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

  static initPromise: Promise<void> | undefined;
  static initialized = false;
  private static initializationLock = new AsyncLock();

  static solver: DiscreteLogSolver;

  /**
   * Initialize the discrete log solver with precomputed tables.
   * Supports 16-bit (O(1) lookup) and 32-bit (~12ms with TBSGS-k32) secrets.
   *
   * @param wasmSource - Optional WASM source: URL string, or Buffer/ArrayBuffer for Node.js
   */
  static async initializeSolver(wasmSource?: string | BufferSource) {
    return this.initializationLock.acquire("solver-init", async () => {
      try {
        if (TwistedElGamal.initialized) {
          return;
        }

        if (!TwistedElGamal.initPromise) {
          const createSolver = async () => {
            try {
              await initializeWasm(wasmSource);
              TwistedElGamal.solver = new DiscreteLogSolver();
            } catch (error) {
              // Reset state on failure
              TwistedElGamal.initPromise = undefined;
              TwistedElGamal.initialized = false;
              throw error;
            }
          };
          TwistedElGamal.initPromise = createSolver();
        }

        await TwistedElGamal.initPromise;
        TwistedElGamal.initialized = true;
      } catch (error) {
        // Reset state on any initialization failure
        TwistedElGamal.initPromise = undefined;
        TwistedElGamal.initialized = false;
        throw error;
      }
    });
  }

  static calculateCiphertextMG(ciphertext: TwistedElGamalCiphertext, privateKey: TwistedEd25519PrivateKey): RistPoint {
    const { C, D } = ciphertext;
    const modS = ed25519modN(bytesToNumberLE(privateKey.toUint8Array()));
    const sD = RistrettoPoint.fromHex(D.toRawBytes()).multiply(modS);
    const mG = RistrettoPoint.fromHex(C.toRawBytes()).subtract(sD);

    return mG;
  }

  /**
   * Solves the discrete log problem to recover the encrypted amount.
   * Tries 16-bit first (O(1) lookup), then falls back to 32-bit.
   */
  private static async decryptAmount(pk: Uint8Array): Promise<bigint> {
    if (bytesToNumberLE(pk) === 0n) return 0n;
    try {
      // Try 16-bit first (O(1) lookup)
      try {
        return TwistedElGamal.solver.solve(pk, 16);
      } catch {
        // Fall through to 32-bit
      }
      // Try 32-bit (~12ms with TBSGS-k32)
      return TwistedElGamal.solver.solve(pk, 32);
    } catch (e) {
      console.error("Decryption failed:", e);
      throw new TypeError("Decryption failed. Value may be out of 32-bit range.");
    }
  }

  /**
   * Decrypts the amount with Twisted ElGamal
   * @param ciphertext сiphertext points encrypted by Twisted ElGamal
   * @param privateKey Twisted ElGamal Ed25519 private key.
   *
   * TODO: rename WithPK to WithDK?
   */
  static async decryptWithPK(
    ciphertext: TwistedElGamalCiphertext,
    privateKey: TwistedEd25519PrivateKey,
  ): Promise<bigint> {
    await TwistedElGamal.ensureInitialized();
    const mG = TwistedElGamal.calculateCiphertextMG(ciphertext, privateKey);

    return TwistedElGamal.decryptAmount(mG.toRawBytes());
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
    return this.initializationLock.acquire("solver-cleanup", async () => {
      try {
        if (TwistedElGamal.solver) TwistedElGamal.solver.free();
      } finally {
        TwistedElGamal.initPromise = undefined;
        TwistedElGamal.initialized = false;
      }
    });
  }

  static isInitialized(): boolean {
    return TwistedElGamal.initialized && TwistedElGamal.solver !== undefined && isWasmInitialized();
  }

  /**
   * Returns the algorithm name used by the discrete log solver.
   */
  static getAlgorithmName(): string {
    return TwistedElGamal.solver?.algorithm() ?? "not initialized";
  }

  private static async ensureInitialized() {
    if (!this.isInitialized()) {
      await this.initializeSolver();
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
