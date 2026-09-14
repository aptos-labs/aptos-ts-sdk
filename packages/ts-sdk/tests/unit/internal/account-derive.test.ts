// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { createMockClient } from "../../helpers/mockClient.js";
import { Account } from "../../../src/account/Account.js";
import { deriveAccountFromPrivateKey, deriveOwnedAccountsFromSigner } from "../../../src/internal/account.js";
import { Ed25519PrivateKey } from "../../../src/core/crypto/ed25519.js";

function emptyAccountResponder() {
  return (req: { method?: string; url?: string; body?: unknown }) => {
    if (req.method === "GET" && req.url?.includes("/transactions")) {
      return { data: [] };
    }
    if (req.method === "GET" && req.url?.includes("/resource/")) {
      return {
        status: 404,
        statusText: "Not Found",
        data: { message: "resource not found", error_code: "resource_not_found" },
      };
    }
    if (req.method === "POST" && req.body && typeof req.body === "object" && "query" in (req.body as object)) {
      const body = req.body as { query?: string };
      if (body.query?.includes("current_objects")) {
        return { data: { data: { current_objects: [] } } };
      }
      if (body.query?.includes("auth_key_account_addresses")) {
        return { data: { data: { auth_key_account_addresses: [] } } };
      }
      if (body.query?.includes("public_key_auth_keys")) {
        return { data: { data: { public_key_auth_keys: [] } } };
      }
      return { data: { data: {} } };
    }
    return { data: {} };
  };
}

describe("internal/account derive* helpers", () => {
  it("deriveAccountFromPrivateKey returns a default legacy account when none exist on-chain", async () => {
    const mock = createMockClient();
    mock.setResponder(emptyAccountResponder());
    const privateKey = new Ed25519PrivateKey(new Uint8Array(32).fill(0xab));

    const account = await deriveAccountFromPrivateKey({
      aptosConfig: mock.config,
      privateKey,
    });

    expect(account.privateKey.toString()).toBe(privateKey.toString());
  });

  it("deriveAccountFromPrivateKey throws when throwIfNoAccountFound is true and none exist", async () => {
    const mock = createMockClient();
    mock.setResponder(emptyAccountResponder());
    const privateKey = new Ed25519PrivateKey(new Uint8Array(32).fill(0xcd));

    await expect(
      deriveAccountFromPrivateKey({
        aptosConfig: mock.config,
        privateKey,
        options: { throwIfNoAccountFound: true },
      }),
    ).rejects.toThrow(/No existing account found for private key/);
  });

  it("deriveOwnedAccountsFromSigner with a private key delegates to the private-key path", async () => {
    const mock = createMockClient();
    mock.setResponder(emptyAccountResponder());
    const privateKey = new Ed25519PrivateKey(new Uint8Array(32).fill(0xef));

    const accounts = await deriveOwnedAccountsFromSigner({
      aptosConfig: mock.config,
      signer: privateKey,
    });

    expect(accounts).toEqual([]);
  });

  it("deriveOwnedAccountsFromSigner with an Account delegates via its private key", async () => {
    const mock = createMockClient();
    mock.setResponder(emptyAccountResponder());
    const account = Account.generate();

    const accounts = await deriveOwnedAccountsFromSigner({
      aptosConfig: mock.config,
      signer: account,
    });

    expect(accounts).toEqual([]);
  });

  it("deriveOwnedAccountsFromSigner recurses for a single-signer MultiEd25519Account", async () => {
    const mock = createMockClient();
    mock.setResponder(emptyAccountResponder());
    const { MultiEd25519Account } = await import("../../../src/account/MultiEd25519Account.js");
    const { MultiEd25519PublicKey } = await import("../../../src/core/crypto/multiEd25519.js");
    const k1 = new Ed25519PrivateKey(new Uint8Array(32).fill(0x21));
    const k2 = new Ed25519PrivateKey(new Uint8Array(32).fill(0x22));
    const multiPub = new MultiEd25519PublicKey({
      publicKeys: [k1.publicKey(), k2.publicKey()],
      threshold: 1,
    });
    const multiAccount = new MultiEd25519Account({ publicKey: multiPub, signers: [k1] });

    const accounts = await deriveOwnedAccountsFromSigner({
      aptosConfig: mock.config,
      signer: multiAccount,
    });

    expect(accounts).toEqual([]);
  });

  it("deriveAccountFromPrivateKey returns the on-chain account when one exists", async () => {
    const mock = createMockClient();
    const account = Account.generate();
    const authKeyHex = account.accountAddress.toString();

    mock.setResponder((req) => {
      if (req.method === "GET" && req.url?.includes("/transactions")) {
        return { data: [{ version: "99", hash: "0xabc" }] };
      }
      if (req.method === "GET" && req.url?.includes("/resource/0x1::account::Account")) {
        return {
          data: {
            type: "0x1::account::Account",
            data: { sequence_number: "3", authentication_key: authKeyHex },
          },
        };
      }
      if (req.method === "POST" && req.body && typeof req.body === "object" && "query" in (req.body as object)) {
        const body = req.body as { query?: string };
        if (body.query?.includes("current_objects")) {
          return { data: { data: { current_objects: [] } } };
        }
        if (body.query?.includes("auth_key_account_addresses")) {
          return { data: { data: { auth_key_account_addresses: [] } } };
        }
        if (body.query?.includes("public_key_auth_keys")) {
          return { data: { data: { public_key_auth_keys: [] } } };
        }
      }
      return { data: {} };
    });

    const derived = await deriveAccountFromPrivateKey({
      aptosConfig: mock.config,
      privateKey: account.privateKey,
    });

    expect(derived.accountAddress.toString()).toBe(account.accountAddress.toString());
    expect(derived.privateKey.toString()).toBe(account.privateKey.toString());
  });

  it("deriveOwnedAccountsFromSigner with a KeylessAccount queries owned accounts", async () => {
    const mock = createMockClient();
    mock.setResponder(emptyAccountResponder());
    const { KeylessAccount } = await import("../../../src/account/KeylessAccount.js");
    const { keylessTestObject } = await import("../helper.js");
    const keylessAccount = KeylessAccount.create({
      jwt: keylessTestObject.JWT,
      pepper: keylessTestObject.pepper,
      ephemeralKeyPair: keylessTestObject.ephemeralKeyPair,
      proof: keylessTestObject.proof,
    });

    const accounts = await deriveOwnedAccountsFromSigner({
      aptosConfig: mock.config,
      signer: keylessAccount,
    });

    expect(accounts).toEqual([]);
  });

  it("deriveOwnedAccountsFromSigner builds a MultiKeyAccount when indexer discovers a single-signer multi-key", async () => {
    const mock = createMockClient();
    const signer = Account.generate();
    const other = Account.generate();
    const { MultiKey } = await import("../../../src/core/crypto/multiKey.js");
    const { MultiKeyAccount } = await import("../../../src/account/MultiKeyAccount.js");
    const multiKey = new MultiKey({ publicKeys: [signer.publicKey, other.publicKey], signaturesRequired: 1 });
    const multiKeyHex = multiKey.bcsToHex().toString();
    const multiAuthKey = multiKey.authKey().toString();
    const multiAddress = Account.generate().accountAddress.toString();

    mock.setResponder((req) => {
      if (req.method === "GET" && req.url?.includes("/transactions")) {
        return { data: [] };
      }
      if (req.method === "GET" && req.url?.includes("/resource/")) {
        return {
          status: 404,
          statusText: "Not Found",
          data: { message: "resource not found", error_code: "resource_not_found" },
        };
      }
      if (req.method === "POST" && req.body && typeof req.body === "object" && "query" in (req.body as object)) {
        const body = req.body as { query?: string };
        if (body.query?.includes("public_key_auth_keys")) {
          return {
            data: {
              data: {
                public_key_auth_keys: [
                  {
                    public_key: signer.publicKey.toString(),
                    public_key_type: "ed25519",
                    account_public_key: multiKeyHex,
                    signature_type: "multi_key_signature",
                    is_public_key_used: true,
                  },
                ],
              },
            },
          };
        }
        if (body.query?.includes("auth_key_account_addresses")) {
          return {
            data: {
              data: {
                auth_key_account_addresses: [
                  {
                    auth_key: multiAuthKey,
                    account_address: multiAddress,
                    last_transaction_version: 7,
                    is_auth_key_used: true,
                  },
                ],
              },
            },
          };
        }
        if (body.query?.includes("current_objects")) {
          return { data: { data: { current_objects: [] } } };
        }
      }
      return { data: {} };
    });

    const accounts = await deriveOwnedAccountsFromSigner({
      aptosConfig: mock.config,
      signer: signer.privateKey,
    });

    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toBeInstanceOf(MultiKeyAccount);
    expect(accounts[0].accountAddress.toString()).toBe(multiAddress);
  });

  it("deriveOwnedAccountsFromSigner throws for an unknown signer type", async () => {
    const mock = createMockClient();
    await expect(
      deriveOwnedAccountsFromSigner({
        aptosConfig: mock.config,
        signer: { not: "an account" } as never,
      }),
    ).rejects.toThrow(/Unknown signer type/);
  });
});
