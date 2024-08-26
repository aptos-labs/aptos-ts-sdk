import { ed25519, RistrettoPoint } from "@noble/curves/ed25519";
import { mod } from "@noble/curves/abstract/modular";
import { bytesToNumberLE, ensureBytes } from "@noble/curves/abstract/utils";
import { randomBytes } from "crypto";
import { HexInput } from "../../types";
import { TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "./twistedEd25519";
import { Hex } from "../hex";

/**
 * Twisted ElGamal encryption/decryption
 * @see {@link https://drive.google.com/file/d/1wGo-pIOPOcCQA0gjngE5kmWUQ-TxktAF/view | Veiled coins with twisted ElGamal}
 */
export class TwistedElGamal {
  /**
   * The hash of the basepoint of the Ristretto255 group using SHA3_512
   */
  public static readonly HASH_BASE_POINT: string = "8c9240b456a9e6dc65c377a1048d745f94a08cdb7f44cbcd7b46f34048871134";

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
    this.privateKey = privateKey instanceof TwistedEd25519PrivateKey
      ? privateKey
      : new TwistedEd25519PrivateKey(privateKey)
  }

  /**
   * Encrypts the amount with Twisted ElGamal
   * 
   * @param amount amount for encryption
   * @param random random 32 bytes
   */
  public encrypt(amount: bigint, random?: Uint8Array): TwistedElGamalCiphertext {
    return TwistedElGamal.encryptWithPK(amount, this.privateKey.publicKey(), random)
  }

  /**
   * Decrypts the amount with Twisted ElGamal
   * 
   * @param ciphertext сiphertext points encrypted by Twisted ElGamal
   * @param startAmount Start amount from which the decryption will begin
   */
  public decrypt(ciphertext: TwistedElGamalCiphertext, startAmount?: bigint): bigint {
    return TwistedElGamal.decryptWithSK(ciphertext, this.privateKey, startAmount)
  }

  /**
   * Encrypts the amount with Twisted ElGamal
   * 
   * @param amount amount for encryption
   * @param publicKey Twisted ElGamal Ed25519 public key.
   * @param random random 32 bytes
   */
  static encryptWithPK(amount: bigint, publicKey: TwistedEd25519PublicKey, random?: Uint8Array) {
    if (amount < 0n && amount >= ed25519.CURVE.n) throw new Error(`The amount must be in the range 0 to ${ed25519.CURVE.n}`)

    const rBytes = random
      ? ensureBytes("Random bytes", random, 32)
      : randomBytes(32)

    const m = amount
    const H = RistrettoPoint.fromHex(TwistedElGamal.HASH_BASE_POINT)
    const r = mod(bytesToNumberLE(rBytes), ed25519.CURVE.n)
    const D = RistrettoPoint.fromHex(publicKey.toUint8Array()).multiply(r).toRawBytes()
    const rG = RistrettoPoint.BASE.multiply(r)
    const mH = m === BigInt(0)
      ? RistrettoPoint.ZERO
      : H.multiply(m)
    const C = mH.add(rG).toRawBytes()
  
    return new TwistedElGamalCiphertext(C, D);
  }

  /**
   * Decrypts the amount with Twisted ElGamal
   * @param ciphertext сiphertext points encrypted by Twisted ElGamal
   * @param privateKey Twisted ElGamal Ed25519 private key.
   * @param startAmount Start amount from which the decryption will begin
   */
  static decryptWithSK(
    ciphertext: TwistedElGamalCiphertext,
    privateKey: TwistedEd25519PrivateKey,
    startAmount?: bigint
  ): bigint {
    const { C, D } = ciphertext
    const H = RistrettoPoint.fromHex(TwistedElGamal.HASH_BASE_POINT)
    const modS = mod(bytesToNumberLE(privateKey.toUint8Array()), ed25519.CURVE.n)
    const sD = RistrettoPoint.fromHex(D.toUint8Array()).multiply(modS)
    const mH = RistrettoPoint.fromHex(C.toUint8Array()).subtract(sD)

    let searchablePoint = H
    let amount = startAmount ?? BigInt(0)
    if (amount === BigInt(0)){
      if (mH.equals(RistrettoPoint.ZERO)) return BigInt(0)

      amount += BigInt(1)
    } 

    while (!mH.equals(searchablePoint)) {
      if (amount >= ed25519.CURVE.n) throw new Error("Error when decrypting the amount")

      amount += BigInt(1)
      searchablePoint = searchablePoint.add(H)
    }
    return amount
  }
}

/**
 * Points of ciphertext encrypted by Twisted ElGamal
 */
export class TwistedElGamalCiphertext {
  readonly C: Hex;

  readonly D: Hex;

  constructor(C: HexInput, D: HexInput) {
    this.C = Hex.fromHexInput(C);
    this.D = Hex.fromHexInput(D);
  }
}