// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { ed25519, ristretto255 } from "@noble/curves/ed25519.js";
import { bytesToNumberLE } from "@noble/curves/utils.js";
import { H_RISTRETTO, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "./twistedEd25519.js";
import { ed25519GenRandom, ed25519modN } from "../utils.js";
import { Hex, HexInput } from "@aptos-labs/ts-sdk";
import { solveDiscreteLog } from "@aptos-labs/confidential-asset-bindings";
import type { RistrettoPoint } from "./ristrettoPoint.js";

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
   * The private key of a Twisted ElGamal Ed25519 key pair.
   */
  private readonly privateKey: TwistedEd25519PrivateKey;

  /**
   * Create a new TwistedElGamal instance from a private key.
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
   * @param random Random number less than ed25519.Point.CURVE().n (bigint)
   */
  static encryptWithPK(amount: bigint, publicKey: TwistedEd25519PublicKey, random?: bigint) {
    const n = ed25519.Point.CURVE().n;
    if (amount < 0n || amount >= n) throw new Error(`The amount must be in the range 0n to ${n - 1n}`);

    if (random !== undefined && (random < 0n || random >= n))
      throw new Error(`The random must be in the range 0n to ${n - 1n}`);

    const m = amount;
    const r = random ?? ed25519GenRandom();
    const rH = H_RISTRETTO.multiply(r);
    const mG = m === BigInt(0) ? ristretto255.Point.ZERO : ristretto255.Point.BASE.multiply(m);

    const D = ristretto255.Point.fromBytes(publicKey.toUint8Array()).multiply(r);
    const C = mG.add(rH);

    return new TwistedElGamalCiphertext(C.toBytes(), D.toBytes());
  }

  /**
   * Encrypts the amount with Twisted ElGamal with no randomness
   *
   * @param amount amount for encryption
   */
  static encryptWithNoRandomness(amount: bigint) {
    const n = ed25519.Point.CURVE().n;
    if (amount < 0n || amount >= n) throw new Error(`The amount must be in the range 0n to ${n - 1n}`);

    const C = amount === BigInt(0) ? ristretto255.Point.ZERO : ristretto255.Point.BASE.multiply(amount);

    return new TwistedElGamalCiphertext(C.toBytes(), ristretto255.Point.ZERO.toBytes());
  }

  static initialized = false;

  static calculateCiphertextMG(
    ciphertext: TwistedElGamalCiphertext,
    privateKey: TwistedEd25519PrivateKey,
  ): RistrettoPoint {
    const { C, D } = ciphertext;
    const modS = ed25519modN(bytesToNumberLE(privateKey.toUint8Array()));
    const sD = D.multiply(modS);
    return C.subtract(sD);
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
        return await solveDiscreteLog(pk, 16);
      } catch {
        // Fall through to 32-bit
      }
      // Try 32-bit (~12ms with TBSGS-k32)
      return await solveDiscreteLog(pk, 32);
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
    const mG = TwistedElGamal.calculateCiphertextMG(ciphertext, privateKey);

    return TwistedElGamal.decryptAmount(mG.toBytes());
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
}

/**
 * Points of ciphertext encrypted by Twisted ElGamal
 */
export class TwistedElGamalCiphertext {
  readonly C: RistrettoPoint;

  readonly D: RistrettoPoint;

  constructor(C: HexInput, D: HexInput) {
    this.C = ristretto255.Point.fromBytes(Hex.fromHexInput(C).toUint8Array());
    this.D = ristretto255.Point.fromBytes(Hex.fromHexInput(D).toUint8Array());
  }

  public addAmount(amount: bigint): TwistedElGamalCiphertext {
    const aG = ristretto255.Point.BASE.multiply(amount);
    const updatedC = this.C.add(aG);

    return new TwistedElGamalCiphertext(updatedC.toBytes(), this.D.toBytes());
  }

  public subtractAmount(amount: bigint): TwistedElGamalCiphertext {
    const aG = ristretto255.Point.BASE.multiply(amount);
    const updatedC = this.C.subtract(aG);

    return new TwistedElGamalCiphertext(updatedC.toBytes(), this.D.toBytes());
  }

  public addCiphertext(ciphertext: TwistedElGamalCiphertext): TwistedElGamalCiphertext {
    const updatedC = this.C.add(ciphertext.C);
    const updatedD = this.D.add(ciphertext.D);

    return new TwistedElGamalCiphertext(updatedC.toBytes(), updatedD.toBytes());
  }

  public subtractCiphertext(ciphertext: TwistedElGamalCiphertext): TwistedElGamalCiphertext {
    const updatedC = this.C.subtract(ciphertext.C);
    const updatedD = this.D.subtract(ciphertext.D);

    return new TwistedElGamalCiphertext(updatedC.toBytes(), updatedD.toBytes());
  }

  public serialize(): Uint8Array {
    return new Uint8Array([...this.C.toBytes(), ...this.D.toBytes()]);
  }
}
