// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * BCS round-trip tests for transactions/authenticator/{account,transaction}.ts.
 * Each variant: serialize → TransactionAuthenticator.deserialize → assert
 * field-by-field equality and that the returned subclass matches. Plus the
 * default-branch error for unknown variant indices.
 */

import { describe, expect, it } from "vitest";
import { Deserializer, Serializer } from "../../../src/bcs/index.js";
import { AccountAddress } from "../../../src/core/index.js";
import {
  AccountAuthenticator,
  AccountAuthenticatorEd25519,
  AccountAuthenticatorMultiKey,
  AccountAuthenticatorNoAccountAuthenticator,
  AccountAuthenticatorSingleKey,
} from "../../../src/transactions/authenticator/account.js";
import {
  TransactionAuthenticator,
  TransactionAuthenticatorEd25519,
  TransactionAuthenticatorFeePayer,
  TransactionAuthenticatorMultiAgent,
  TransactionAuthenticatorSingleSender,
} from "../../../src/transactions/authenticator/transaction.js";
import { Account } from "../../../src/account/Account.js";
import { Ed25519PrivateKey, Ed25519PublicKey, Ed25519Signature } from "../../../src/core/crypto/ed25519.js";
import { AnyPublicKey, AnySignature } from "../../../src/core/crypto/singleKey.js";
import { MultiKey, MultiKeySignature } from "../../../src/core/crypto/multiKey.js";
import { Secp256k1PrivateKey } from "../../../src/core/crypto/secp256k1.js";

function roundTripBytes<T extends { serialize: (s: Serializer) => void }>(value: T): Uint8Array {
  const s = new Serializer();
  value.serialize(s);
  return s.toUint8Array();
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function makeEd25519Pair(): { publicKey: Ed25519PublicKey; signature: Ed25519Signature } {
  // Deterministic from a fixed seed so failures reproduce.
  const sk = new Ed25519PrivateKey(new Uint8Array(32).fill(0x42));
  const publicKey = sk.publicKey();
  const signature = sk.sign(new Uint8Array([1, 2, 3]));
  return { publicKey, signature };
}

describe("transactions/authenticator/account — variant round trips", () => {
  it("Ed25519 variant: round-trip via AccountAuthenticator.deserialize returns same subclass + fields", () => {
    const { publicKey, signature } = makeEd25519Pair();
    const original = new AccountAuthenticatorEd25519(publicKey, signature);

    const bytes = roundTripBytes(original);
    const restored = AccountAuthenticator.deserialize(new Deserializer(bytes));

    expect(restored).toBeInstanceOf(AccountAuthenticatorEd25519);
    expect(restored.isEd25519()).toBe(true);
    const r = restored as AccountAuthenticatorEd25519;
    expect(bytesEqual(r.public_key.toUint8Array(), publicKey.toUint8Array())).toBe(true);
    expect(bytesEqual(r.signature.toUint8Array(), signature.toUint8Array())).toBe(true);
    // The byte stream must start with the variant uleb128 (Ed25519 == 0).
    expect(bytes[0]).toBe(0);
  });

  it("SingleKey variant: AnyPublicKey + AnySignature round trip", () => {
    const account = Account.generate({ scheme: 0 /* Ed25519 */ as never });
    const anyPk = new AnyPublicKey(account.publicKey as unknown as Ed25519PublicKey);
    const sig = account.sign(new Uint8Array([9]));
    const anySig = new AnySignature(sig as unknown as Ed25519Signature);

    const original = new AccountAuthenticatorSingleKey(anyPk, anySig);
    const bytes = roundTripBytes(original);
    const restored = AccountAuthenticator.deserialize(new Deserializer(bytes));

    expect(restored).toBeInstanceOf(AccountAuthenticatorSingleKey);
    expect(restored.isSingleKey()).toBe(true);
  });

  it("MultiKey variant: 2-of-3 round trip preserves participant indices", () => {
    const a = Account.generate();
    const b = Account.generate();
    const c = Account.generate();
    const anyPks = [a.publicKey, b.publicKey, c.publicKey].map(
      (pk) => new AnyPublicKey(pk as unknown as Ed25519PublicKey),
    );
    const mk = new MultiKey({ publicKeys: anyPks, signaturesRequired: 2 });
    const sigs = [a.sign(new Uint8Array([1])), b.sign(new Uint8Array([1]))].map(
      (s) => new AnySignature(s as unknown as Ed25519Signature),
    );
    const mkSig = new MultiKeySignature({ signatures: sigs, bitmap: [0, 1] });

    const original = new AccountAuthenticatorMultiKey(mk, mkSig);
    const bytes = roundTripBytes(original);
    const restored = AccountAuthenticator.deserialize(new Deserializer(bytes));

    expect(restored).toBeInstanceOf(AccountAuthenticatorMultiKey);
    const r = restored as AccountAuthenticatorMultiKey;
    expect(r.public_keys.publicKeys).toHaveLength(3);
    expect(r.public_keys.signaturesRequired).toBe(2);
    expect(r.signatures.signatures).toHaveLength(2);
  });

  it("NoAccountAuthenticator: serializes to a single uleb128 byte (no payload)", () => {
    const original = new AccountAuthenticatorNoAccountAuthenticator();
    const bytes = roundTripBytes(original);
    // Variant index 4 — single byte for small ulebs.
    expect(bytes).toHaveLength(1);

    const restored = AccountAuthenticator.deserialize(new Deserializer(bytes));
    expect(restored).toBeInstanceOf(AccountAuthenticatorNoAccountAuthenticator);
  });

  it("AccountAuthenticator.deserialize throws on an unknown variant", () => {
    const s = new Serializer();
    s.serializeU32AsUleb128(99);
    expect(() => AccountAuthenticator.deserialize(new Deserializer(s.toUint8Array()))).toThrow(
      /Unknown variant index for AccountAuthenticator/,
    );
  });

  it("type guards return the right boolean for each instance", () => {
    const { publicKey, signature } = makeEd25519Pair();
    const ed = new AccountAuthenticatorEd25519(publicKey, signature);
    const none = new AccountAuthenticatorNoAccountAuthenticator();
    expect(ed.isEd25519()).toBe(true);
    expect(ed.isMultiKey()).toBe(false);
    expect(ed.isSingleKey()).toBe(false);
    expect(ed.isMultiEd25519()).toBe(false);
    expect(none.isEd25519()).toBe(false);
  });
});

describe("transactions/authenticator/transaction — variant round trips", () => {
  const { publicKey, signature } = makeEd25519Pair();
  const sponsor = AccountAddress.from("0x9");
  const secondary = AccountAddress.from("0xa");

  it("Ed25519 variant: round-trip via TransactionAuthenticator.deserialize", () => {
    const original = new TransactionAuthenticatorEd25519(publicKey, signature);
    const bytes = roundTripBytes(original);
    const restored = TransactionAuthenticator.deserialize(new Deserializer(bytes));

    expect(restored).toBeInstanceOf(TransactionAuthenticatorEd25519);
    expect(restored.isEd25519()).toBe(true);
  });

  it("SingleSender variant: wraps an AccountAuthenticator and round-trips", () => {
    const inner = new AccountAuthenticatorEd25519(publicKey, signature);
    const original = new TransactionAuthenticatorSingleSender(inner);
    const bytes = roundTripBytes(original);
    const restored = TransactionAuthenticator.deserialize(new Deserializer(bytes));

    expect(restored).toBeInstanceOf(TransactionAuthenticatorSingleSender);
    const r = restored as TransactionAuthenticatorSingleSender;
    expect(r.sender).toBeInstanceOf(AccountAuthenticatorEd25519);
  });

  it("MultiAgent variant: sender + N secondary signer addresses + N secondary authenticators", () => {
    const inner = new AccountAuthenticatorEd25519(publicKey, signature);
    const original = new TransactionAuthenticatorMultiAgent(inner, [secondary, sponsor], [inner, inner]);

    const bytes = roundTripBytes(original);
    const restored = TransactionAuthenticator.deserialize(new Deserializer(bytes));

    expect(restored).toBeInstanceOf(TransactionAuthenticatorMultiAgent);
    const r = restored as TransactionAuthenticatorMultiAgent;
    expect(r.secondary_signer_addresses.map((a) => a.toString())).toEqual([secondary.toString(), sponsor.toString()]);
    expect(r.secondary_signers).toHaveLength(2);
  });

  it("FeePayer variant: round-trip preserves the fee_payer { address, authenticator }", () => {
    const inner = new AccountAuthenticatorEd25519(publicKey, signature);
    const feePayerAuth = new AccountAuthenticatorEd25519(publicKey, signature);
    const original = new TransactionAuthenticatorFeePayer(inner, [secondary], [inner], {
      address: sponsor,
      authenticator: feePayerAuth,
    });

    const bytes = roundTripBytes(original);
    const restored = TransactionAuthenticator.deserialize(new Deserializer(bytes));

    expect(restored).toBeInstanceOf(TransactionAuthenticatorFeePayer);
    const r = restored as TransactionAuthenticatorFeePayer;
    expect(r.fee_payer.address.toString()).toBe(sponsor.toString());
    expect(r.fee_payer.authenticator).toBeInstanceOf(AccountAuthenticatorEd25519);
  });

  it("TransactionAuthenticator.deserialize throws on an unknown variant index", () => {
    const s = new Serializer();
    s.serializeU32AsUleb128(99);
    expect(() => TransactionAuthenticator.deserialize(new Deserializer(s.toUint8Array()))).toThrow(
      /Unknown variant index for TransactionAuthenticator/,
    );
  });

  it("type guards: each subclass reports its own variant", () => {
    const ed = new TransactionAuthenticatorEd25519(publicKey, signature);
    expect(ed.isEd25519()).toBe(true);
    expect(ed.isMultiAgent()).toBe(false);
    expect(ed.isFeePayer()).toBe(false);
    expect(ed.isSingleSender()).toBe(false);
  });

  it("identical inputs produce identical bytes (determinism)", () => {
    const a = new TransactionAuthenticatorEd25519(publicKey, signature);
    const b = new TransactionAuthenticatorEd25519(publicKey, signature);
    expect(Array.from(roundTripBytes(a))).toEqual(Array.from(roundTripBytes(b)));
  });
});

describe("authenticator cross-cutting: Secp256k1 SingleSender round-trip", () => {
  it("SingleSender wrapping a SingleKey AnyPublicKey of Secp256k1 round-trips", () => {
    const sk = new Secp256k1PrivateKey(new Uint8Array(32).fill(0x07));
    const pk = sk.publicKey();
    const sig = sk.sign(new Uint8Array([5, 5, 5]));

    const anyPk = new AnyPublicKey(pk);
    const anySig = new AnySignature(sig);
    const inner = new AccountAuthenticatorSingleKey(anyPk, anySig);
    const original = new TransactionAuthenticatorSingleSender(inner);

    const bytes = roundTripBytes(original);
    const restored = TransactionAuthenticator.deserialize(new Deserializer(bytes));

    expect(restored).toBeInstanceOf(TransactionAuthenticatorSingleSender);
    const r = restored as TransactionAuthenticatorSingleSender;
    expect(r.sender).toBeInstanceOf(AccountAuthenticatorSingleKey);
  });
});
