import { HexInput } from "../types";
import { AccountAddress } from "./accountAddress";
import { AnyPublicKey, AnySignature } from "./crypto";

export interface AccountConstructorArgs {
  publicKey: AnyPublicKey;
  address?: AccountAddress | HexInput;
}

/**
 * Class for creating and managing account on Aptos network
 *
 * Use this class to create accounts, sign transactions, and more.
 * Note: Creating an account instance does not create the account on-chain.
 *
 * Since [AIP-55](https://github.com/aptos-foundation/AIPs/pull/263) Aptos supports
 * `Legacy` and `Unified` authentications.
 *
 * @Legacy includes `ED25519` and `MultiED25519`
 * @Unified includes `SingleSender` and `MultiSender`, where currently
 * `SingleSender` supports `ED25519` and `Secp256k1`, and `MultiSender` supports
 * `MultiED25519`.
 */
export class Account {
  public readonly publicKey: AnyPublicKey;

  public readonly accountAddress: AccountAddress;

  /**
   * constructor for Account
   * @param privateKey PrivateKey - private key of the account
   * @param address AccountAddress - address of the account
   */
  constructor({ publicKey, address }: AccountConstructorArgs) {
    this.publicKey = publicKey;

    if (address instanceof AccountAddress) {
      this.accountAddress = address;
    } else if (address !== undefined) {
      this.accountAddress = AccountAddress.from(address);
    } else {
      this.accountAddress = this.publicKey.authKey().derivedAddress();
    }
  }

  /**
   * Verify the given message and signature with the public key.
   *
   * @param args.message raw message data in HexInput format
   * @param args.signature signed message Signature
   * @returns
   */
  verifySignature(args: { message: HexInput; signature: AnySignature }): boolean {
    return this.publicKey.verifySignature(args);
  }
}
