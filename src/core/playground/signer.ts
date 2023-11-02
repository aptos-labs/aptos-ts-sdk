import { HexInput, SigningSchemeInput } from "../../types";
import { AccountAddress } from "../accountAddress";
import { Account } from "./account";
import { AccountAuthenticatorSingleKey } from "./accountAuthenticator";
import { Ed25519PrivateKey, type Ed25519PublicKey, type Ed25519Signature } from "./ed25519";
import type { BaseSigner, PrivateKey, PublicKey } from "./interfaces";
import { Secp256k1PrivateKey, type Secp256k1PublicKey, type Secp256k1Signature } from "./secp256k1";
import { AllowedSignatures, AnyPublicKey, AnySignature } from "./wrapped";

export interface SignerConstructorArgs<
  TSignature extends AllowedSignatures,
  TPublicKey extends PublicKey<TSignature> = PublicKey<TSignature>,
> {
  privateKey: PrivateKey<TSignature, TPublicKey>;
  address?: AccountAddress | HexInput;
}

export interface GenerateSignerArgs<TSignatureScheme extends SigningSchemeInput = SigningSchemeInput> {
  scheme: TSignatureScheme;
}

export class Signer<
    TSignature extends AllowedSignatures = AllowedSignatures,
    TPublicKey extends PublicKey<TSignature> = PublicKey<TSignature>,
  >
  extends Account<TSignature, TPublicKey>
  implements BaseSigner<AccountAuthenticatorSingleKey<TSignature, TPublicKey>>
{
  public readonly privateKey: PrivateKey<TSignature, TPublicKey>;

  constructor({ privateKey, address }: SignerConstructorArgs<TSignature, TPublicKey>) {
    const publicKey = new AnyPublicKey(privateKey.publicKey());
    super({ publicKey, address });
    this.privateKey = privateKey;
  }

  static generate(): Signer<Ed25519Signature, Ed25519PublicKey>;
  static generate(args: GenerateSignerArgs<SigningSchemeInput.Ed25519>): Signer<Ed25519Signature, Ed25519PublicKey>;
  static generate(
    args: GenerateSignerArgs<SigningSchemeInput.Secp256k1Ecdsa>,
  ): Signer<Secp256k1Signature, Secp256k1PublicKey>;
  static generate(args?: GenerateSignerArgs) {
    const scheme = args?.scheme ?? SigningSchemeInput.Ed25519;
    switch (scheme) {
      case SigningSchemeInput.Ed25519:
        return new Signer({ privateKey: Ed25519PrivateKey.generate() });
      case SigningSchemeInput.Secp256k1Ecdsa:
        return new Signer({ privateKey: Secp256k1PrivateKey.generate() });
      default:
        throw new Error(`Signing scheme ${scheme} is not supported`);
    }
  }

  sign(message: HexInput): AccountAuthenticatorSingleKey<TSignature, TPublicKey> {
    const signature = new AnySignature(this.privateKey.sign(message));
    return new AccountAuthenticatorSingleKey(this.publicKey, signature);
  }
}
