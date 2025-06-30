import { AnyPublicKey } from "./singleKey";
import { Ed25519PublicKey } from "./ed25519";
import { MultiKey } from "./multiKey";
import { MultiEd25519PublicKey } from "./multiEd25519";

// This type is used to represent the base from of an account's public key.
// These are the types of public keys that can be used to derive an account's address by appending
// the signing scheme to the public key as bytes and hashing it.
export type BaseAccountPublicKey = Ed25519PublicKey | AnyPublicKey | MultiKey | MultiEd25519PublicKey;
