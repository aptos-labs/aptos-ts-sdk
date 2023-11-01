import { HexInput } from "../../types";
import { AccountAddress } from "../accountAddress";
import { AccountAuthenticatorSingleKey } from "./accountAuthenticator";
import { Ed25519PrivateKey, type Ed25519PublicKey, type Ed25519Signature } from "./ed25519";
import type { BaseSigner, PrivateKey, PublicKey } from "./interfaces";
import { SignatureScheme } from "./scheme";
import { Secp256k1PrivateKey, type Secp256k1PublicKey, type Secp256k1Signature } from "./secp256k1";
import { AllowedSignatures, AnyPublicKey, AnySignature } from "./wrapped";

export interface SignerConstructorArgs<
  TSignature extends AllowedSignatures,
  TPublicKey extends PublicKey<TSignature> = PublicKey<TSignature>,
> {
  privateKey: PrivateKey<TSignature, TPublicKey>;
  address?: AccountAddress | HexInput;
}

export interface GenerateSignerArgs<TSignatureScheme extends SignatureScheme = SignatureScheme> {
  scheme: TSignatureScheme;
}

export class Signer<
  TSignature extends AllowedSignatures = AllowedSignatures,
  TPublicKey extends PublicKey<TSignature> = PublicKey<TSignature>,
> implements BaseSigner<AccountAuthenticatorSingleKey<TSignature, TPublicKey>>
{
  public readonly privateKey: PrivateKey<TSignature, TPublicKey>;

  public readonly publicKey: AnyPublicKey<TSignature, TPublicKey>;

  public readonly address: AccountAddress;

  constructor({ privateKey, address }: SignerConstructorArgs<TSignature, TPublicKey>) {
    this.privateKey = privateKey;
    this.publicKey = new AnyPublicKey(this.privateKey.publicKey());

    if (address instanceof AccountAddress) {
      this.address = address;
    } else if (address !== undefined) {
      this.address = AccountAddress.fromHexInput(address);
    } else {
      this.address = this.publicKey.authKey().derivedAddress();
    }
  }

  static generate(): Signer<Ed25519Signature, Ed25519PublicKey>;
  static generate(args: GenerateSignerArgs<SignatureScheme.Ed25519>): Signer<Ed25519Signature, Ed25519PublicKey>;
  static generate(args: GenerateSignerArgs<SignatureScheme.Secp256k1>): Signer<Secp256k1Signature, Secp256k1PublicKey>;
  static generate(args?: GenerateSignerArgs) {
    const scheme = args?.scheme ?? SignatureScheme.Ed25519;
    if (scheme === SignatureScheme.Ed25519) {
      const privateKey = Ed25519PrivateKey.generate();
      return new Signer({ privateKey });
    }
    if (scheme === SignatureScheme.Secp256k1) {
      const privateKey = Secp256k1PrivateKey.generate();
      return new Signer({ privateKey });
    }
    throw new Error(`Signing scheme ${scheme} is not supported`);
  }

  sign(message: HexInput): AccountAuthenticatorSingleKey<TSignature, TPublicKey> {
    const signature = new AnySignature(this.privateKey.sign(message));
    return new AccountAuthenticatorSingleKey(this.publicKey, signature);
  }
}
