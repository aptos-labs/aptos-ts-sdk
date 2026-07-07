// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { createMockClient } from "../../helpers/mockClient.js";
import { Account } from "../../../src/account/Account.js";
import { getAccountsForPublicKey } from "../../../src/internal/account.js";

describe("internal/account.getAccountsForPublicKey", () => {
  it("returns the default account when the auth-key address exists on-chain", async () => {
    const mock = createMockClient();
    const account = Account.generate();
    const authKeyHex = account.accountAddress.toString();

    mock.setResponder((req) => {
      if (req.method === "GET" && req.url?.includes("/transactions")) {
        return { data: [{ version: "12", hash: "0x1" }] };
      }
      if (req.method === "GET" && req.url?.includes("/resource/0x1::account::Account")) {
        return {
          data: {
            type: "0x1::account::Account",
            data: { sequence_number: "1", authentication_key: authKeyHex },
          },
        };
      }
      if (req.method === "POST" && req.body && typeof req.body === "object" && "query" in (req.body as object)) {
        const body = req.body as { query?: string };
        if (body.query?.includes("current_objects")) {
          return { data: { data: { current_objects: [] } } };
        }
        if (body.query?.includes("public_key_auth_keys")) {
          return { data: { data: { public_key_auth_keys: [] } } };
        }
        if (body.query?.includes("auth_key_account_addresses")) {
          return { data: { data: { auth_key_account_addresses: [] } } };
        }
      }
      return { data: {} };
    });

    const result = await getAccountsForPublicKey({
      aptosConfig: mock.config,
      publicKey: account.publicKey,
    });

    expect(result).toHaveLength(1);
    expect(result[0].accountAddress.toString()).toBe(account.accountAddress.toString());
    expect(result[0].lastTransactionVersion).toBe(12);
  });

  it("discovers multi-key accounts that contain the signer public key", async () => {
    const mock = createMockClient();
    const signer = Account.generate();
    const other = Account.generate();
    const { MultiKey } = await import("../../../src/core/crypto/multiKey.js");
    const multiKey = new MultiKey({ publicKeys: [signer.publicKey, other.publicKey], signaturesRequired: 1 });
    const multiKeyHex = multiKey.bcsToHex().toString();
    const multiAuthKey = multiKey.authKey().toString();
    const multiAddress = Account.generate().accountAddress.toString();

    mock.setResponder((req) => {
      if (req.method === "GET" && req.url?.includes("/transactions")) {
        return { data: [] };
      }
      if (req.method === "GET" && req.url?.includes("/resource/0x1::account::Account")) {
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
                    last_transaction_version: 42,
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

    const result = await getAccountsForPublicKey({
      aptosConfig: mock.config,
      publicKey: signer.publicKey,
    });

    expect(result).toHaveLength(1);
    expect(result[0].accountAddress.toString()).toBe(multiAddress);
    expect(result[0].lastTransactionVersion).toBe(42);
    expect(result[0].publicKey).toBeInstanceOf(MultiKey);
    expect((result[0].publicKey as InstanceType<typeof MultiKey>).getSignaturesRequired()).toBe(1);
  });

  it("throws when noMultiKey is true and the public key is a multi-key", async () => {
    const mock = createMockClient();
    const { MultiKeyAccount } = await import("../../../src/account/MultiKeyAccount.js");
    const { MultiKey } = await import("../../../src/core/crypto/multiKey.js");
    const a = Account.generate();
    const b = Account.generate();
    const multiKey = new MultiKey({ publicKeys: [a.publicKey, b.publicKey], signaturesRequired: 2 });
    const multiAccount = new MultiKeyAccount({ multiKey, signers: [a, b] });

    await expect(
      getAccountsForPublicKey({
        aptosConfig: mock.config,
        publicKey: multiAccount.publicKey,
        options: { noMultiKey: true },
      }),
    ).rejects.toThrow(/Multi-key accounts are not supported when noMultiKey is true/);
  });
});
