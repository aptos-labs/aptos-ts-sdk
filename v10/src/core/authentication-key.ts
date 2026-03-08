import { sha3_256 } from "@noble/hashes/sha3.js";
import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import type { AccountPublicKey } from "../crypto/public-key.js";
import type { AuthenticationKeyScheme } from "../crypto/types.js";
import { Hex, type HexInput } from "../hex/index.js";
import { AccountAddress } from "./account-address.js";

/**
 * Represents a 32-byte authentication key derived from a public key and signing scheme.
 *
 * Authentication keys are used to derive account addresses and to verify
 * that a transaction signer is authorized for a given account.
 */
export class AuthenticationKey extends Serializable {
  /** The fixed byte length of an authentication key. */
  static readonly LENGTH: number = 32;

  /** The raw authentication key data as a Hex wrapper. */
  public readonly data: Hex;

  /**
   * Creates an AuthenticationKey from raw hex input.
   * @param args.data - The 32-byte authentication key as hex string or byte array.
   * @throws If the input is not exactly 32 bytes.
   */
  constructor(args: { data: HexInput }) {
    super();
    const { data } = args;
    const hex = Hex.fromHexInput(data);
    if (hex.toUint8Array().length !== AuthenticationKey.LENGTH) {
      throw new Error(`Authentication Key length should be ${AuthenticationKey.LENGTH}`);
    }
    this.data = hex;
  }

  /** Serializes the authentication key as fixed-length bytes via BCS. */
  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.data.toUint8Array());
  }

  /**
   * Deserializes an AuthenticationKey from BCS bytes.
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new AuthenticationKey instance.
   */
  static deserialize(deserializer: Deserializer): AuthenticationKey {
    const bytes = deserializer.deserializeFixedBytes(AuthenticationKey.LENGTH);
    return new AuthenticationKey({ data: bytes });
  }

  /** Returns the underlying 32-byte array. */
  toUint8Array(): Uint8Array {
    return this.data.toUint8Array();
  }

  /**
   * Derives an authentication key by hashing the input bytes concatenated with the scheme identifier using SHA3-256.
   * @param args.scheme - The authentication key scheme (e.g., Ed25519, MultiKey).
   * @param args.input - The public key bytes to derive from.
   * @returns A new AuthenticationKey derived from the scheme and input.
   */
  static fromSchemeAndBytes(args: { scheme: AuthenticationKeyScheme; input: HexInput }): AuthenticationKey {
    const { scheme, input } = args;
    const inputBytes = Hex.fromHexInput(input).toUint8Array();
    const hashInput = new Uint8Array([...inputBytes, scheme]);
    const hashDigest = sha3_256.create().update(hashInput).digest();
    return new AuthenticationKey({ data: hashDigest });
  }

  /**
   * Derives an authentication key from an account public key.
   * @param args.publicKey - The public key to derive the authentication key from.
   * @returns The authentication key for the given public key.
   */
  static fromPublicKey(args: { publicKey: AccountPublicKey }): AuthenticationKey {
    const { publicKey } = args;
    return publicKey.authKey() as AuthenticationKey;
  }

  /**
   * Derives the account address from this authentication key.
   * The address is the authentication key bytes interpreted as an AccountAddress.
   * @returns The derived AccountAddress.
   */
  derivedAddress(): AccountAddress {
    return new AccountAddress(this.data.toUint8Array());
  }
}
